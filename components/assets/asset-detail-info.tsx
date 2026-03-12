'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import type { InventoryItemWithRelations } from '@/lib/types/database';
import { AssetEditForm } from './asset-edit-form';
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';
import type { ConditionPhoto, InvoiceItem } from './asset-detail-client';
import { Input } from '@/components/ui/input';

interface AssetDetailInfoProps {
  asset: InventoryItemWithRelations;
  conditionPhotos: ConditionPhoto[];
  invoices: InvoiceItem[];
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  onEditSuccess: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
  formId?: string;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function AssetDetailInfo({
  asset,
  conditionPhotos,
  invoices,
  categories,
  locations,
  currentUserId,
  currentUserRole,
  onEditSuccess,
  onSubmittingChange,
  formId,
  onDirtyChange,
}: AssetDetailInfoProps) {
  const [lightboxPhotos, setLightboxPhotos] = useState<Array<{ id: string; url: string; fileName: string }> | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  const canEdit =
    ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) &&
    asset.status !== 'sold_disposed';

  const openLightbox = (photos: Array<{ id: string; url: string; fileName: string }>, index: number) => {
    setLightboxPhotos(photos);
    setLightboxIndex(index);
  };

  // Detail page IS edit page — show edit form directly when user has permission
  if (canEdit) {
    // Map condition photos for the edit form
    const editExistingPhotos = conditionPhotos
      .filter((p) => ['asset_creation', 'asset_status_change'].includes(p.entity_type))
      .map((p) => ({ id: p.id, url: p.url, fileName: p.fileName }));

    // Map invoices for the edit form
    const editExistingInvoices = invoices.map((inv) => ({
      id: inv.id,
      url: inv.url,
      fileName: inv.fileName,
    }));

    return (
      <AssetEditForm
        asset={asset}
        categories={categories}
        locations={locations}
        existingPhotos={editExistingPhotos}
        existingInvoices={editExistingInvoices}
        onSuccess={onEditSuccess}
        onSubmittingChange={onSubmittingChange}
        formId={formId}
        onDirtyChange={onDirtyChange}
        companyName={asset.company?.name ?? ''}
      />
    );
  }

  // All asset-level condition photos (creation + status changes)
  const assetConditionPhotos = conditionPhotos
    .filter((p) => ['asset_creation', 'asset_status_change'].includes(p.entity_type))
    .map((p) => ({ id: p.id, url: p.url, fileName: p.fileName }));

  return (
    <>
      <div className="space-y-6">
        {/* Company — always shown, always disabled */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company</label>
          <Input
            value={asset.company?.name ?? ''}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
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

        {/* Attachments */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Attachments
          </h3>

          {/* Condition Photos */}
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Condition Photos</p>
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
            <p className="text-xs text-muted-foreground mb-1">Invoices</p>
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
      </div>

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
