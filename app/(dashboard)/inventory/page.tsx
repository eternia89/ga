import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AssetTable } from '@/components/assets/asset-table';
import { PendingTransfer } from '@/components/assets/asset-columns';
import { ExportButton } from '@/components/export-button';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { AssetCreateDialog } from '@/components/assets/asset-create-dialog';
import { GA_ROLES, ROLES } from '@/lib/constants/roles';
import { getAccessibleCompanyIds } from '@/lib/auth/company-access';

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
    .select('id, company_id, role, deleted_at, location_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch user's accessible companies (primary + extra via user_company_access)
  const { allAccessibleCompanyIds, extraCompanyIds } = await getAccessibleCompanyIds(supabase, profile.id, profile.company_id);

  // General users: only see assets at their location or in transit to them
  const isGeneralUser = profile.role === ROLES.GENERAL_USER;
  let inTransitAssetIds: string[] = [];

  if (isGeneralUser) {
    // Pre-fetch asset IDs from pending transfers where user is the receiver
    const { data: pendingForUser } = await supabase
      .from('inventory_movements')
      .select('item_id')
      .eq('receiver_id', profile.id)
      .eq('status', 'pending')
      .is('deleted_at', null);

    inTransitAssetIds = (pendingForUser ?? []).map(m => m.item_id);
  }

  // Fetch assets — scoped for general users, all for operational roles
  let assetsQuery = supabase
    .from('inventory_items')
    .select('*, category:categories(name), location:locations(name), holder:user_profiles!holder_id(full_name)')
    .in('company_id', allAccessibleCompanyIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (isGeneralUser) {
    if (inTransitAssetIds.length > 0) {
      // Assets held by user OR in transit to them
      assetsQuery = assetsQuery.or(
        `holder_id.eq.${profile.id},id.in.(${inTransitAssetIds.join(',')})`
      );
    } else {
      // Only assets held by user (no pending transfers)
      assetsQuery = assetsQuery.eq('holder_id', profile.id);
    }
  }

  const { data: assets } = await assetsQuery;
  const assetList = assets ?? [];

  // Build pending transfers map: assetId -> PendingTransfer
  const pendingTransfersMap: Record<string, PendingTransfer> = {};

  if (assetList.length > 0) {
    const assetIds = assetList.map((a) => a.id);

    const { data: pendingMovements } = await supabase
      .from('inventory_movements')
      .select('id, item_id, to_location_id, to_location:locations!to_location_id(name), receiver_id, receiver:user_profiles!receiver_id(full_name)')
      .in('item_id', assetIds)
      .eq('status', 'pending')
      .is('deleted_at', null);

    if (pendingMovements) {
      for (const movement of pendingMovements) {
        const receiver = Array.isArray(movement.receiver)
          ? movement.receiver[0] ?? null
          : movement.receiver;
        pendingTransfersMap[movement.item_id] = {
          id: movement.id,
          to_location: Array.isArray(movement.to_location)
            ? movement.to_location[0] ?? null
            : movement.to_location,
          receiver_id: movement.receiver_id,
          receiver_name: receiver?.full_name ?? null,
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

  // Fetch locations for all accessible companies for filter dropdown + create dialog
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, company_id')
    .in('company_id', allAccessibleCompanyIds)
    .is('deleted_at', null)
    .order('name');

  // Multi-company: fetch companies and all locations for accessible companies
  const [extraCompaniesResult, allLocationsResult, primaryCompanyResult] = extraCompanyIds.length > 0
    ? await Promise.all([
        supabase
          .from('companies')
          .select('id, name')
          .in('id', allAccessibleCompanyIds)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('locations')
          .select('id, name, company_id')
          .in('company_id', allAccessibleCompanyIds)
          .is('deleted_at', null)
          .order('name'),
        supabase
          .from('companies')
          .select('name')
          .eq('id', profile.company_id)
          .single(),
      ])
    : await Promise.all([
        Promise.resolve({ data: null }),
        Promise.resolve({ data: null }),
        supabase
          .from('companies')
          .select('name')
          .eq('id', profile.company_id)
          .single(),
      ]);

  const extraCompanies = extraCompaniesResult.data ?? [];
  const allLocations = allLocationsResult.data ?? [];
  const primaryCompanyName = primaryCompanyResult.data?.name ?? '';

  // Fetch GA users with location_id for transfer dialog (all accessible companies)
  const { data: gaUsersData } = await supabase
    .from('user_profiles')
    .select('id, full_name, location_id, company_id')
    .in('company_id', allAccessibleCompanyIds)
    .is('deleted_at', null)
    .order('full_name');

  const gaUsers = (gaUsersData ?? []).map((u) => ({
    id: u.id,
    name: u.full_name,
    location_id: u.location_id,
    company_id: u.company_id,
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
      const { data: signedUrls, error: signedUrlError } = await supabase.storage
        .from('asset-photos')
        .createSignedUrls(
          attachments.map((a) => a.file_path),
          21600
        );

      if (signedUrlError) {
        console.error('[InventoryPage] Failed to create signed URLs:', signedUrlError.message);
      }

      const photosWithUrls = attachments.map((a, i) => ({
        id: a.id,
        entityId: a.entity_id,
        url: signedUrls?.[i]?.signedUrl ?? '',
        fileName: a.file_name,
      })).filter((p) => p.url !== '');

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
      <SetBreadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Assets' }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(GA_ROLES as readonly string[]).includes(profile.role) && (
            <ExportButton exportUrl="/api/exports/inventory" />
          )}
          {(GA_ROLES as readonly string[]).includes(profile.role) && (
            <AssetCreateDialog
              categories={categories ?? []}
              locations={locations ?? []}
              initialOpen={action === 'create'}
              extraCompanies={extraCompanies}
              allLocations={allLocations}
              primaryCompanyName={primaryCompanyName}
              primaryCompanyId={profile.company_id ?? ''}
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
