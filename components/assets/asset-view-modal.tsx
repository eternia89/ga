'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';
import type { ConditionPhoto, InvoiceItem, TransferPhoto } from './asset-detail-client';
import { AssetDetailInfo } from './asset-detail-info';
import { AssetTimeline } from './asset-timeline';
import { AssetStatusBadge } from './asset-status-badge';
import { AssetTransferDialog, type GAUserWithLocation } from './asset-transfer-dialog';
import { AssetTransferRespondModal } from './asset-transfer-respond-modal';
import type { PendingTransfer } from './asset-columns';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { InlineFeedback } from '@/components/inline-feedback';
import {
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface AssetViewModalProps {
  assetId: string | null;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  currentUserRole: string;
  onActionSuccess?: () => void;
  /** Ordered list of asset IDs for prev/next navigation */
  assetIds?: string[];
  /** Called when user navigates to a different asset */
  onNavigate?: (assetId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function AssetViewModal({
  assetId,
  onOpenChange,
  currentUserId,
  currentUserRole,
  onActionSuccess,
  assetIds = [],
  onNavigate,
}: AssetViewModalProps) {
  const router = useRouter();

  // Data states
  const [asset, setAsset] = useState<InventoryItemWithRelations | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<InventoryMovementWithRelations | null>(null);
  const [conditionPhotos, setConditionPhotos] = useState<ConditionPhoto[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<Record<string, unknown>[]>([]);
  const [movements, setMovements] = useState<InventoryMovementWithRelations[]>([]);
  const [transferPhotos, setTransferPhotos] = useState<TransferPhoto[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [gaUsers, setGaUsers] = useState<{ id: string; name: string; location_id: string | null }[]>([]);

  // Creator name (fetched separately since InventoryItemWithRelations doesn't include it)

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Asset detail client state (transfer dialogs)
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showTransferRespondDialog, setShowTransferRespondDialog] = useState(false);
  const [respondVariant, setRespondVariant] = useState<'respond' | 'admin'>('respond');
  const [respondInitialMode, setRespondInitialMode] = useState<'default' | 'accept' | 'reject' | undefined>(undefined);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Navigation
  const currentIndex = assetId ? assetIds.indexOf(assetId) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < assetIds.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      onNavigate?.(assetIds[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      onNavigate?.(assetIds[currentIndex + 1]);
    }
  };

  // URL sync
  useEffect(() => {
    if (assetId) {
      window.history.replaceState(null, '', '?view=' + assetId);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [assetId]);

  // Data fetching
  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Fetch asset with relations
      const { data: assetData, error: assetError } = await supabase
        .from('inventory_items')
        .select('*, category:categories(name), location:locations(name), company:companies(name), holder:user_profiles!holder_id(full_name, division:divisions(name), location:locations(name))')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (assetError || !assetData) {
        setError('Asset not found');
        setLoading(false);
        return;
      }

      const fetchedAsset = assetData as unknown as InventoryItemWithRelations;
      setAsset(fetchedAsset);

      const companyId = fetchedAsset.company_id;

      // Parallel fetches
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
        // Condition photos
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
        // Pending transfer
        supabase
          .from('inventory_movements')
          .select(
            '*, from_location:locations!from_location_id(name), to_location:locations!to_location_id(name), initiator:user_profiles!initiated_by(full_name), receiver:user_profiles!receiver_id(full_name)'
          )
          .eq('item_id', id)
          .eq('status', 'pending')
          .is('deleted_at', null)
          .maybeSingle(),
        // Audit logs
        supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'inventory_items')
          .eq('record_id', id)
          .order('performed_at', { ascending: true }),
        // All movements
        supabase
          .from('inventory_movements')
          .select(
            '*, from_location:locations!from_location_id(name), to_location:locations!to_location_id(name), initiator:user_profiles!initiated_by(full_name), receiver:user_profiles!receiver_id(full_name)'
          )
          .eq('item_id', id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),
        // Categories
        supabase
          .from('categories')
          .select('id, name')
          .eq('type', 'asset')
          .is('deleted_at', null)
          .order('name'),
        // Locations
        supabase
          .from('locations')
          .select('id, name')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('name'),
        // GA users (with location_id for transfer auto-derive)
        supabase
          .from('user_profiles')
          .select('id, name:full_name, location_id')
          .eq('company_id', companyId)
          .is('deleted_at', null)
          .order('full_name'),
      ]);

      setPendingTransfer(pendingTransferResult.data as InventoryMovementWithRelations | null);
      setAuditLogs((auditLogsResult.data ?? []) as unknown as Record<string, unknown>[]);

      const fetchedMovements = (movementsResult.data ?? []) as unknown as InventoryMovementWithRelations[];
      setMovements(fetchedMovements);
      setCategories(categoriesResult.data ?? []);
      setLocations(locationsResult.data ?? []);
      setGaUsers(gaUsersResult.data ?? []);

      // Fetch transfer photos for all movements
      let fetchedTransferPhotos: TransferPhoto[] = [];
      if (fetchedMovements.length > 0) {
        const movementIds = fetchedMovements.map((m) => m.id);
        const { data: transferPhotoData } = await supabase
          .from('media_attachments')
          .select('id, entity_type, entity_id, file_name, file_path, created_at')
          .in('entity_type', ['asset_transfer_send', 'asset_transfer_receive', 'asset_transfer_reject'])
          .in('entity_id', movementIds)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (transferPhotoData && transferPhotoData.length > 0) {
          const { data: signedUrls } = await supabase.storage
            .from('asset-photos')
            .createSignedUrls(
              transferPhotoData.map((a) => a.file_path),
              21600
            );
          fetchedTransferPhotos = transferPhotoData.map((a, i) => ({
            id: a.id,
            entity_type: a.entity_type,
            entity_id: a.entity_id,
            url: signedUrls?.[i]?.signedUrl ?? '',
            fileName: a.file_name,
            created_at: a.created_at,
          }));
        }
      }
      setTransferPhotos(fetchedTransferPhotos);

      // Sign condition photo URLs
      const statusAttachments = statusPhotosResult.data ?? [];
      let conditionPhotoUrls: ConditionPhoto[] = [];
      if (statusAttachments.length > 0) {
        const { data: signedUrls } = await supabase.storage
          .from('asset-photos')
          .createSignedUrls(
            statusAttachments.map((a) => a.file_path),
            21600
          );
        conditionPhotoUrls = statusAttachments.map((a, i) => ({
          id: a.id,
          entity_type: a.entity_type,
          entity_id: a.entity_id,
          url: signedUrls?.[i]?.signedUrl ?? '',
          fileName: a.file_name,
          created_at: a.created_at,
        }));
      }
      setConditionPhotos(conditionPhotoUrls);

      // Sign invoice URLs
      const invoiceAttachments = invoicesResult.data ?? [];
      let invoiceUrls: InvoiceItem[] = [];
      if (invoiceAttachments.length > 0) {
        const { data: signedUrls } = await supabase.storage
          .from('asset-invoices')
          .createSignedUrls(
            invoiceAttachments.map((a) => a.file_path),
            21600
          );
        invoiceUrls = invoiceAttachments.map((a, i) => ({
          id: a.id,
          url: signedUrls?.[i]?.signedUrl ?? '',
          fileName: a.file_name,
          created_at: a.created_at,
        }));
      }
      setInvoices(invoiceUrls);
    } catch {
      setError('Unable to load asset details. Please close and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (assetId) {
      fetchData(assetId);
    } else {
      // Reset state when modal closes
      setAsset(null);
      setPendingTransfer(null);
      setConditionPhotos([]);
      setInvoices([]);
      setAuditLogs([]);
      setMovements([]);
      setTransferPhotos([]);
      setCategories([]);
      setLocations([]);
      setGaUsers([]);
      setError(null);
      setShowTransferDialog(false);
      setShowTransferRespondDialog(false);
    }
  }, [assetId, refreshKey, fetchData]);

  // Action success handler
  const handleActionSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
    router.refresh();
    onActionSuccess?.();
  }, [router, onActionSuccess]);

  // Convert pendingTransfer to PendingTransfer shape for the respond modal
  const pendingTransferForModal: PendingTransfer | undefined = pendingTransfer
    ? {
        id: pendingTransfer.id,
        to_location: pendingTransfer.to_location,
        receiver_id: pendingTransfer.receiver_id,
        receiver_name: pendingTransfer.receiver?.full_name ?? null,
      }
    : undefined;

  return (
    <Dialog open={!!assetId} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[1000px] max-h-[90vh] flex flex-col p-0 gap-0 max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">Asset Details</DialogTitle>
        {/* Loading state */}
        {loading && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="grid grid-cols-[600px_400px] max-lg:grid-cols-1 gap-6 mt-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-6 flex flex-col items-center justify-center min-h-[200px] gap-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              {assetId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(assetId)}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Retry
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {asset && !loading && !error && (
          <>
            {/* Header (non-scrollable) */}
            <div className="px-6 pt-6 pb-4 border-b shrink-0 pr-12">
              <div className="flex flex-wrap items-center gap-3">
                {/* Prev/Next navigation */}
                {assetIds.length > 1 && (
                  <div className="flex items-center gap-1 mr-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!hasPrev}
                      onClick={goToPrev}
                      aria-label="Previous asset"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!hasNext}
                      onClick={goToNext}
                      aria-label="Next asset"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground ml-1">
                      {currentIndex + 1}/{assetIds.length}
                    </span>
                  </div>
                )}

                <h2 className="text-xl font-bold tracking-tight font-mono">
                  {asset.display_id}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <AssetStatusBadge
                  status={asset.status}
                  showInTransit={!!pendingTransfer}
                />
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(asset.created_at), 'dd-MM-yyyy')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {asset.name}
                {asset.category?.name && ` \u00b7 ${asset.category.name}`}
                {asset.location?.name && ` \u00b7 ${asset.location.name}`}
              </p>
              {/* Current Holder section */}
              {!pendingTransfer && (
                <div className="mt-3 rounded-md border p-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Current Holder</h4>
                  {asset.holder ? (
                    <div className="text-sm">
                      <p className="font-medium">{asset.holder.full_name}</p>
                      {asset.holder.division?.name && (
                        <p className="text-muted-foreground text-xs">{asset.holder.division.name}</p>
                      )}
                      {asset.holder.location?.name && (
                        <p className="text-muted-foreground text-xs">{asset.holder.location.name}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                  )}
                </div>
              )}
            </div>

            {/* Split layout: Details left, Timeline right */}
            <div className="flex-1 min-h-0 grid grid-cols-[600px_400px] max-lg:grid-cols-1">
              {/* Left: Details (scrollable) */}
              <div className="overflow-y-auto px-6 py-4 max-lg:border-b space-y-6">
                <AssetDetailInfo
                  asset={asset}
                  conditionPhotos={conditionPhotos}
                  invoices={invoices}
                  categories={categories}
                  locations={locations}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  onEditSuccess={handleActionSuccess}
                  onSubmittingChange={setIsEditSubmitting}
                />
              </div>

              {/* Right: Timeline (scrollable) */}
              <div className="overflow-y-auto border-l max-lg:border-l-0 px-6 py-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                  Timeline
                </h3>
                <AssetTimeline
                  auditLogs={auditLogs}
                  movements={movements}
                  conditionPhotos={conditionPhotos}
                  transferPhotos={transferPhotos}
                />
              </div>
            </div>

            {/* Sticky action bar */}
            <div className="border-t px-6 py-3 flex items-center justify-between gap-2 shrink-0 bg-background">
              <div className="flex items-center gap-2 min-w-0">
                {actionFeedback && (
                  <InlineFeedback type={actionFeedback.type} message={actionFeedback.message} onDismiss={() => setActionFeedback(null)} />
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) && asset.status !== 'sold_disposed' && !pendingTransfer && (
                  <Button type="submit" form="asset-edit-form" size="sm" disabled={isEditSubmitting}>
                    {isEditSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
                {pendingTransfer && currentUserId === pendingTransfer.receiver_id && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setRespondVariant('respond'); setRespondInitialMode('accept'); setShowTransferRespondDialog(true); }}>
                      Accept Transfer
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setRespondVariant('respond'); setRespondInitialMode('reject'); setShowTransferRespondDialog(true); }}>
                      Reject Transfer
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

      </DialogContent>

      {/* Transfer dialogs — rendered outside DialogContent for z-index stacking */}
      {asset && (
        <>
          <AssetTransferDialog
            open={showTransferDialog}
            onOpenChange={setShowTransferDialog}
            asset={asset}
            currentLocationName={asset.location?.name ?? ''}
            gaUsers={gaUsers as GAUserWithLocation[]}
            currentUserId={currentUserId}
            locationNames={Object.fromEntries(locations.map((l) => [l.id, l.name]))}
            onSuccess={handleActionSuccess}
          />
          <AssetTransferRespondModal
            open={showTransferRespondDialog}
            onOpenChange={setShowTransferRespondDialog}
            asset={asset}
            pendingTransfer={pendingTransferForModal}
            onSuccess={handleActionSuccess}
            variant={respondVariant}
            initialMode={respondInitialMode}
          />
        </>
      )}
    </Dialog>
  );
}
