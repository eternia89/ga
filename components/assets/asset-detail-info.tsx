'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Truck } from 'lucide-react';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';
import { AssetStatusBadge } from './asset-status-badge';
import { AssetEditForm } from './asset-edit-form';
import { AssetStatusChangeDialog } from './asset-status-change-dialog';
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';
import type { ConditionPhoto, InvoiceItem } from './asset-detail-client';
import { ASSET_STATUS_TRANSITIONS } from '@/lib/constants/asset-status';
import type { AssetStatus } from '@/lib/constants/asset-status';

interface AssetDetailInfoProps {
  asset: InventoryItemWithRelations;
  pendingTransfer: InventoryMovementWithRelations | null;
  conditionPhotos: ConditionPhoto[];
  invoices: InvoiceItem[];
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onStatusBadgeClick: () => void;
  showStatusDialog: boolean;
  onStatusDialogChange: (open: boolean) => void;
  onStatusSuccess: () => void;
}

export function AssetDetailInfo({
  asset,
  pendingTransfer,
  conditionPhotos,
  invoices,
  categories,
  locations,
  currentUserId,
  currentUserRole,
  isEditing,
  onEditToggle,
  onStatusBadgeClick,
  showStatusDialog,
  onStatusDialogChange,
  onStatusSuccess,
}: AssetDetailInfoProps) {
  const [lightboxPhotos, setLightboxPhotos] = useState<Array<{ id: string; url: string; fileName: string }> | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const canChangeStatus =
    ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) &&
    asset.status !== 'sold_disposed';

  const isTerminalStatus = asset.status === 'sold_disposed';
  const allowedTransitions = isTerminalStatus
    ? []
    : ASSET_STATUS_TRANSITIONS[asset.status as AssetStatus] ?? [];

  const isStatusClickable = canChangeStatus && allowedTransitions.length > 0;

  // Show edit form when editing
  if (isEditing) {
    return (
      <AssetEditForm
        asset={asset}
        categories={categories}
        locations={locations}
        onCancel={onEditToggle}
        onSuccess={onEditToggle}
      />
    );
  }

  const openLightbox = (photos: Array<{ id: string; url: string; fileName: string }>, index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  // All asset-level condition photos (creation + status changes)
  const assetConditionPhotos = conditionPhotos
    .filter((p) => ['asset_creation', 'asset_status_change'].includes(p.entity_type))
    .map((p) => ({ id: p.id, url: p.url, fileName: p.fileName }));

  return (
    <>
      <div className="rounded-lg border p-6 space-y-6">
        {/* Header: display ID + status badge */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            {asset.display_id}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={isStatusClickable ? onStatusBadgeClick : undefined}
              disabled={!isStatusClickable}
              className={isStatusClickable ? 'cursor-pointer' : 'cursor-default'}
              aria-label={isStatusClickable ? 'Click to change status' : undefined}
            >
              <AssetStatusBadge
                status={asset.status}
                clickable={isStatusClickable}
                showInTransit={!!pendingTransfer}
              />
            </button>
          </div>

          {/* In Transit details */}
          {pendingTransfer && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 flex items-start gap-2">
              <Truck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-700">Transfer in Progress</p>
                <p className="text-blue-600 mt-0.5">
                  {pendingTransfer.from_location?.name ?? '—'} &rarr; {pendingTransfer.to_location?.name ?? '—'}
                </p>
                <p className="text-blue-600">
                  Receiver: {pendingTransfer.receiver?.full_name ?? '—'}
                </p>
                <p className="text-blue-500 text-xs mt-0.5">
                  Initiated: {format(new Date(pendingTransfer.created_at), 'dd-MM-yyyy')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Asset fields */}
        <dl className="space-y-3">
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name</dt>
            <dd className="text-sm mt-0.5">{asset.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</dt>
            <dd className="text-sm mt-0.5">{asset.category?.name ?? <span className="text-muted-foreground">—</span>}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Location</dt>
            <dd className="text-sm mt-0.5">{asset.location?.name ?? <span className="text-muted-foreground">—</span>}</dd>
          </div>
          {asset.brand && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand</dt>
              <dd className="text-sm mt-0.5">{asset.brand}</dd>
            </div>
          )}
          {asset.model && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</dt>
              <dd className="text-sm mt-0.5">{asset.model}</dd>
            </div>
          )}
          {asset.serial_number && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Serial Number</dt>
              <dd className="text-sm mt-0.5">{asset.serial_number}</dd>
            </div>
          )}
          {asset.description && (
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</dt>
              <dd className="text-sm mt-0.5 whitespace-pre-wrap">{asset.description}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Acquisition Date</dt>
            <dd className="text-sm mt-0.5">
              {asset.acquisition_date
                ? format(new Date(asset.acquisition_date), 'dd-MM-yyyy')
                : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Warranty Expiry</dt>
            <dd className="text-sm mt-0.5">
              {asset.warranty_expiry
                ? format(new Date(asset.warranty_expiry), 'dd-MM-yyyy')
                : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
        </dl>

        {/* Condition Photos */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Condition Photos
          </h3>
          {assetConditionPhotos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No condition photos.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assetConditionPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => openLightbox(assetConditionPhotos, index)}
                  className="w-20 h-20 shrink-0 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity"
                  aria-label={`View photo: ${photo.fileName}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.fileName}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Invoices
          </h3>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices attached.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((invoice) => {
                const isImage = /\.(jpe?g|png|webp)$/i.test(invoice.fileName);
                return (
                  <a
                    key={invoice.id}
                    href={invoice.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    {isImage ? (
                      <img
                        src={invoice.url}
                        alt={invoice.fileName}
                        className="w-10 h-10 object-cover rounded shrink-0"
                      />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-sm truncate">{invoice.fileName}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status change dialog */}
      <AssetStatusChangeDialog
        open={showStatusDialog}
        onOpenChange={onStatusDialogChange}
        asset={asset}
        onSuccess={onStatusSuccess}
      />

      {/* Lightbox */}
      {lightboxPhotos && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxPhotos(null)}
        />
      )}
    </>
  );
}
