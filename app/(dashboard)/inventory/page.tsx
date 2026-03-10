import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AssetTable } from '@/components/assets/asset-table';
import { PendingTransfer } from '@/components/assets/asset-columns';
import { ExportButton } from '@/components/export-button';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { AssetCreateDialog } from '@/components/assets/asset-create-dialog';

interface PageProps {
  searchParams: Promise<{ view?: string; action?: string }>;
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const { view, action } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch all active assets for this company with relations
  const { data: assets } = await supabase
    .from('inventory_items')
    .select('*, category:categories(name), location:locations(name)')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const assetList = assets ?? [];

  // Build pending transfers map: assetId -> PendingTransfer
  let pendingTransfersMap: Record<string, PendingTransfer> = {};

  if (assetList.length > 0) {
    const assetIds = assetList.map((a) => a.id);

    const { data: pendingMovements } = await supabase
      .from('inventory_movements')
      .select('id, item_id, to_location_id, to_location:locations!to_location_id(name), receiver_id')
      .in('item_id', assetIds)
      .eq('status', 'pending')
      .is('deleted_at', null);

    if (pendingMovements) {
      for (const movement of pendingMovements) {
        pendingTransfersMap[movement.item_id] = {
          id: movement.id,
          to_location: Array.isArray(movement.to_location)
            ? movement.to_location[0] ?? null
            : movement.to_location,
          receiver_id: movement.receiver_id,
        };
      }
    }
  }

  // Fetch asset-type categories for filter dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('type', 'asset')
    .is('deleted_at', null)
    .order('name');

  // Fetch locations for this company for filter dropdown
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('name');

  // Fetch GA users with location_id for transfer dialog
  const { data: gaUsersData } = await supabase
    .from('user_profiles')
    .select('id, full_name, location_id')
    .eq('company_id', profile.company_id)
    .in('role', ['ga_staff', 'ga_lead', 'admin'])
    .is('deleted_at', null)
    .order('full_name');

  const gaUsers = (gaUsersData ?? []).map((u) => ({
    id: u.id,
    name: u.full_name,
    location_id: u.location_id,
  }));

  // Batch-fetch condition photos for all assets
  let photosByAsset: Record<string, { id: string; url: string; fileName: string }[]> = {};

  if (assetList.length > 0) {
    const assetIds = assetList.map((a) => a.id);

    const { data: attachments } = await supabase
      .from('media_attachments')
      .select('id, entity_id, file_name, file_path')
      .in('entity_type', ['asset_creation', 'asset_status_change'])
      .in('entity_id', assetIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (attachments && attachments.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('asset-photos')
        .createSignedUrls(
          attachments.map((a) => a.file_path),
          21600
        );

      const photosWithUrls = attachments.map((a, i) => ({
        id: a.id,
        entityId: a.entity_id,
        url: signedUrls?.[i]?.signedUrl ?? '',
        fileName: a.file_name,
      }));

      // Group by asset ID (DESC order preserved — latest first)
      photosByAsset = {};
      for (const photo of photosWithUrls) {
        if (!photosByAsset[photo.entityId]) {
          photosByAsset[photo.entityId] = [];
        }
        photosByAsset[photo.entityId].push({
          id: photo.id,
          url: photo.url,
          fileName: photo.fileName,
        });
      }
    }
  }

  return (
    <div className="space-y-6 py-6">
      <SetBreadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Inventory' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all company assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['ga_staff', 'ga_lead', 'admin'].includes(profile.role) && (
            <ExportButton exportUrl="/api/exports/inventory" />
          )}
          {['ga_staff', 'ga_lead', 'admin'].includes(profile.role) && (
            <AssetCreateDialog
              categories={categories ?? []}
              locations={locations ?? []}
              initialOpen={action === 'create'}
            />
          )}
        </div>
      </div>

      <AssetTable
        data={assetList}
        pendingTransfers={pendingTransfersMap}
        categories={categories ?? []}
        locations={locations ?? []}
        gaUsers={gaUsers}
        currentUserId={profile.id}
        currentUserRole={profile.role}
        photosByAsset={photosByAsset}
        initialViewId={view}
      />
    </div>
  );
}
