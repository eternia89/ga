'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { InventoryItemWithRelations } from '@/lib/types/database';
import { DataTable } from '@/components/data-table/data-table';
import { InlineFeedback } from '@/components/inline-feedback';
import { assetColumns, PendingTransfer } from './asset-columns';
import { AssetFilters, filterParsers } from './asset-filters';
import { AssetViewModal } from './asset-view-modal';
import { AssetTransferDialog, type GAUserWithLocation } from './asset-transfer-dialog';
import { AssetStatusChangeDialog } from './asset-status-change-dialog';
import { AssetTransferRespondModal } from './asset-transfer-respond-modal';
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';

type PhotoItem = { id: string; url: string; fileName: string };

interface AssetTableProps {
  data: InventoryItemWithRelations[];
  pendingTransfers: Record<string, PendingTransfer>;
  categories: { id: string; name: string }[];
  locations: { id: string; name: string; company_id?: string }[];
  gaUsers: GAUserWithLocation[];
  currentUserId: string;
  currentUserRole: string;
  photosByAsset: Record<string, PhotoItem[]>;
  initialViewId?: string;
}

export function AssetTable({
  data,
  pendingTransfers,
  categories,
  locations,
  gaUsers,
  currentUserId,
  currentUserRole,
  photosByAsset,
  initialViewId,
}: AssetTableProps) {
  const router = useRouter();
  const [filters] = useQueryStates(filterParsers);

  // View modal state
  const [viewAssetId, setViewAssetId] = useState<string | null>(initialViewId ?? null);

  // Transfer dialog state (triggered from table row)
  const [transferAsset, setTransferAsset] = useState<InventoryItemWithRelations | null>(null);

  // Change Status dialog state (triggered from table row)
  const [statusChangeAsset, setStatusChangeAsset] = useState<InventoryItemWithRelations | null>(null);

  // Respond modal state (triggered from table row for transfer receivers)
  const [respondAsset, setRespondAsset] = useState<InventoryItemWithRelations | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Client-side filtering based on URL params
  const filteredData = useMemo(() => {
    return data.filter((asset) => {
      // Status filter — handle virtual "in_transit_virtual" value
      if (filters.status) {
        if (filters.status === 'in_transit_virtual') {
          // Only show assets with pending transfer
          if (!pendingTransfers[asset.id]) return false;
        } else {
          if (asset.status !== filters.status) return false;
        }
      }

      // Category filter
      if (filters.category_id && asset.category_id !== filters.category_id) return false;

      // Location filter
      if (filters.location_id && asset.location_id !== filters.location_id) return false;

      // In transit filter
      if (filters.in_transit === 'true' && !pendingTransfers[asset.id]) return false;

      // Search filter — matches display_id, name, brand, model, serial_number
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const matchesDisplayId = asset.display_id.toLowerCase().includes(q);
        const matchesName = asset.name.toLowerCase().includes(q);
        const matchesBrand = asset.brand?.toLowerCase().includes(q) ?? false;
        const matchesModel = asset.model?.toLowerCase().includes(q) ?? false;
        const matchesSerial = asset.serial_number?.toLowerCase().includes(q) ?? false;
        if (!matchesDisplayId && !matchesName && !matchesBrand && !matchesModel && !matchesSerial) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters, pendingTransfers]);

  const handleView = (asset: InventoryItemWithRelations) => {
    setViewAssetId(asset.id);
  };

  const handleTransfer = (asset: InventoryItemWithRelations) => {
    setTransferAsset(asset);
  };

  const handleChangeStatus = (asset: InventoryItemWithRelations) => {
    setStatusChangeAsset(asset);
  };

  const handleRespond = (asset: InventoryItemWithRelations) => {
    setRespondAsset(asset);
  };

  const handlePhotoClick = (photos: PhotoItem[], index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleModalActionSuccess = () => {
    setFeedback({ type: 'success', message: 'Action completed successfully' });
    router.refresh();
  };

  const locationNames = useMemo(
    () => Object.fromEntries(locations.map((l) => [l.id, l.name])),
    [locations]
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <AssetFilters categories={categories} locations={locations} />

      {feedback && (
        <InlineFeedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <DataTable
        columns={assetColumns}
        data={filteredData}
        emptyMessage="No assets found"
        meta={{
          onView: handleView,
          onTransfer: handleTransfer,
          onChangeStatus: handleChangeStatus,
          onRespond: handleRespond,
          pendingTransfers,
          currentUserRole,
          currentUserId,
          photosByAsset,
          onPhotoClick: handlePhotoClick,
        }}
      />

      {/* Asset view modal */}
      <AssetViewModal
        assetId={viewAssetId}
        onOpenChange={(open) => { if (!open) setViewAssetId(null); }}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onActionSuccess={handleModalActionSuccess}
        assetIds={filteredData.map((a) => a.id)}
        onNavigate={setViewAssetId}
      />

      {/* Transfer dialog (from table row action) */}
      {transferAsset && (() => {
        const filteredGaUsers = gaUsers.filter(u => u.company_id === transferAsset.company_id);
        const filteredLocations = locations.filter(l => l.company_id === transferAsset.company_id);
        const filteredLocationNames = Object.fromEntries(
          filteredLocations.map(l => [l.id, l.name])
        );
        return (
          <AssetTransferDialog
            open={!!transferAsset}
            onOpenChange={(open) => { if (!open) setTransferAsset(null); }}
            asset={transferAsset}
            currentLocationName={transferAsset.location?.name ?? ''}
            gaUsers={filteredGaUsers}
            currentUserId={currentUserId}
            locationNames={filteredLocationNames}
            onSuccess={handleModalActionSuccess}
          />
        );
      })()}

      {/* Change Status dialog (from table row action) */}
      {statusChangeAsset && (
        <AssetStatusChangeDialog
          open={!!statusChangeAsset}
          onOpenChange={(open) => { if (!open) setStatusChangeAsset(null); }}
          asset={statusChangeAsset}
          onSuccess={handleModalActionSuccess}
        />
      )}

      {/* Respond modal (from table row action for transfer receivers) */}
      <AssetTransferRespondModal
        open={!!respondAsset}
        onOpenChange={(open) => { if (!open) setRespondAsset(null); }}
        asset={respondAsset}
        pendingTransfer={respondAsset ? pendingTransfers[respondAsset.id] : undefined}
        onSuccess={handleModalActionSuccess}
      />

      {lightboxOpen && lightboxPhotos.length > 0 && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
