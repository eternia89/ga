import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { SetBreadcrumbs } from '@/lib/breadcrumb-context';
import { AssetDetailClient } from '@/components/assets/asset-detail-client';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, company_id, role, deleted_at')
    .eq('id', user.id)
    .single();

  if (!profile || profile.deleted_at) {
    redirect('/login');
  }

  // Fetch asset with relations
  const { data: asset } = await supabase
    .from('inventory_items')
    .select(
      '*, category:categories(name), location:locations(name), company:companies(name), holder:user_profiles!holder_id(full_name, division:divisions(name), location:locations(name))'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!asset) {
    notFound();
  }

  // Fetch all data in parallel
  const [
    statusPhotosResult,
    invoicesResult,
    pendingTransferResult,
    auditLogsResult,
    movementsResult,
    categoriesResult,
    locationsResult,
    gaUsersResult,
  ] = await Promise.all([
    // Condition photos: creation + status changes for this asset
    supabase
      .from('media_attachments')
      .select('id, entity_type, entity_id, file_name, file_path, created_at')
      .in('entity_type', ['asset_creation', 'asset_status_change'])
      .eq('entity_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),

    // Invoice files
    supabase
      .from('media_attachments')
      .select('id, entity_type, entity_id, file_name, file_path, created_at')
      .eq('entity_type', 'asset_invoice')
      .eq('entity_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),

    // Pending transfer (if any)
    supabase
      .from('inventory_movements')
      .select(
        '*, from_location:locations!from_location_id(name), to_location:locations!to_location_id(name), initiator:user_profiles!initiated_by(full_name), receiver:user_profiles!receiver_id(full_name)'
      )
      .eq('item_id', id)
      .eq('status', 'pending')
      .is('deleted_at', null)
      .maybeSingle(),

    // Audit logs for timeline
    supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'inventory_items')
      .eq('record_id', id)
      .order('performed_at', { ascending: true }),

    // All movements for timeline
    supabase
      .from('inventory_movements')
      .select(
        '*, from_location:locations!from_location_id(name), to_location:locations!to_location_id(name), initiator:user_profiles!initiated_by(full_name), receiver:user_profiles!receiver_id(full_name)'
      )
      .eq('item_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),

    // Categories (asset type) for edit form
    supabase
      .from('categories')
      .select('id, name')
      .eq('type', 'asset')
      .is('deleted_at', null)
      .order('name'),

    // Locations for edit form and transfer (use asset's company, not user's primary)
    supabase
      .from('locations')
      .select('id, name')
      .eq('company_id', asset.company_id)
      .is('deleted_at', null)
      .order('name'),

    // Users for transfer receiver selection (all active users in asset's company)
    supabase
      .from('user_profiles')
      .select('id, name:full_name, location_id')
      .eq('company_id', asset.company_id)
      .is('deleted_at', null)
      .order('full_name'),
  ]);

  // Fetch movement photos for all movements
  const movements = movementsResult.data ?? [];
  let transferPhotos: Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    file_name: string;
    file_path: string;
    created_at: string;
  }> = [];

  if (movements.length > 0) {
    const movementIds = movements.map((m) => m.id);
    const { data: transferPhotoData } = await supabase
      .from('media_attachments')
      .select('id, entity_type, entity_id, file_name, file_path, created_at')
      .in('entity_type', ['asset_transfer_send', 'asset_transfer_receive', 'asset_transfer_reject'])
      .in('entity_id', movementIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    transferPhotos = transferPhotoData ?? [];
  }

  // Generate signed URLs for condition photos
  const statusAttachments = statusPhotosResult.data ?? [];
  let conditionPhotoUrls: Array<{ id: string; entity_type: string; entity_id: string; url: string; fileName: string; created_at: string }> = [];

  if (statusAttachments.length > 0) {
    const { data: signedUrls, error: signedUrlError } = await supabase.storage
      .from('asset-photos')
      .createSignedUrls(
        statusAttachments.map((a) => a.file_path),
        21600 // 6 hours
      );
    if (signedUrlError) {
      console.error('[AssetDetailPage] Failed to create signed URLs for condition photos:', signedUrlError.message);
    }
    conditionPhotoUrls = statusAttachments.map((a, i) => ({
      id: a.id,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      url: signedUrls?.[i]?.signedUrl ?? '',
      fileName: a.file_name,
      created_at: a.created_at,
    })).filter((p) => p.url !== '');
  }

  // Generate signed URLs for invoices
  const invoiceAttachments = invoicesResult.data ?? [];
  let invoiceUrls: Array<{ id: string; url: string; fileName: string; created_at: string }> = [];

  if (invoiceAttachments.length > 0) {
    const { data: signedUrls, error: signedUrlError } = await supabase.storage
      .from('asset-invoices')
      .createSignedUrls(
        invoiceAttachments.map((a) => a.file_path),
        21600 // 6 hours
      );
    if (signedUrlError) {
      console.error('[AssetDetailPage] Failed to create signed URLs for invoices:', signedUrlError.message);
    }
    invoiceUrls = invoiceAttachments.map((a, i) => ({
      id: a.id,
      url: signedUrls?.[i]?.signedUrl ?? '',
      fileName: a.file_name,
      created_at: a.created_at,
    })).filter((p) => p.url !== '');
  }

  // Generate signed URLs for transfer photos
  let transferPhotoUrls: Array<{ id: string; entity_type: string; entity_id: string; url: string; fileName: string; created_at: string }> = [];

  if (transferPhotos.length > 0) {
    const { data: signedUrls, error: signedUrlError } = await supabase.storage
      .from('asset-photos')
      .createSignedUrls(
        transferPhotos.map((a) => a.file_path),
        21600 // 6 hours
      );
    if (signedUrlError) {
      console.error('[AssetDetailPage] Failed to create signed URLs for transfer photos:', signedUrlError.message);
    }
    transferPhotoUrls = transferPhotos.map((a, i) => ({
      id: a.id,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      url: signedUrls?.[i]?.signedUrl ?? '',
      fileName: a.file_name,
      created_at: a.created_at,
    })).filter((p) => p.url !== '');
  }

  const assetWithRelations = asset as InventoryItemWithRelations;
  const pendingTransfer = pendingTransferResult.data as InventoryMovementWithRelations | null;

  return (
    <div className="space-y-6 py-6 pb-20">
      <SetBreadcrumbs items={[{ label: 'Assets', href: '/inventory' }, { label: assetWithRelations.display_id }]} />

      {/* Two-column layout via client wrapper */}
      <AssetDetailClient
        asset={assetWithRelations}
        pendingTransfer={pendingTransfer}
        conditionPhotos={conditionPhotoUrls}
        invoices={invoiceUrls}
        auditLogs={auditLogsResult.data ?? []}
        movements={movements as InventoryMovementWithRelations[]}
        transferPhotos={transferPhotoUrls}
        categories={categoriesResult.data ?? []}
        locations={locationsResult.data ?? []}
        gaUsers={gaUsersResult.data ?? []}
        currentUserId={profile.id}
        currentUserRole={profile.role}
      />
    </div>
  );
}
