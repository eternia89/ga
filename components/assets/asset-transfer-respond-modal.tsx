'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { acceptTransfer, rejectTransfer, cancelTransfer } from '@/app/actions/asset-actions';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';
import type { PendingTransfer } from './asset-columns';
import { PhotoUpload } from '@/components/media/photo-upload';
import { PhotoLightbox, type PhotoItem } from '@/components/media/photo-lightbox';
import { InlineFeedback } from '@/components/inline-feedback';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface AssetTransferRespondModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: InventoryItemWithRelations | null;
  pendingTransfer?: PendingTransfer;
  onSuccess: () => void;
  variant?: 'respond' | 'admin';
  /** Pre-select accept/reject mode to skip the default two-button screen */
  initialMode?: ModalMode;
}

type ModalMode = 'default' | 'accept' | 'reject' | 'cancel';

interface ThumbnailPhoto {
  id: string;
  url: string;
  fileName: string;
}

// ============================================================================
// Component
// ============================================================================

export function AssetTransferRespondModal({
  open,
  onOpenChange,
  asset,
  pendingTransfer,
  onSuccess,
  variant = 'respond',
  initialMode,
}: AssetTransferRespondModalProps) {
  const router = useRouter();

  // Fetched data
  const [movement, setMovement] = useState<InventoryMovementWithRelations | null>(null);
  const [senderPhotos, setSenderPhotos] = useState<ThumbnailPhoto[]>([]);
  const [assetPhotos, setAssetPhotos] = useState<ThumbnailPhoto[]>([]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ModalMode>(initialMode ?? 'default');
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lightbox state
  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open && asset && pendingTransfer) {
      setMode(initialMode ?? 'default');
      setReason('');
      setPhotos([]);
      setFeedback(null);
      fetchData(pendingTransfer.id, asset.id);
    } else if (!open) {
      setMovement(null);
      setSenderPhotos([]);
      setAssetPhotos([]);
      setLoading(false);
      setMode(initialMode ?? 'default');
      setReason('');
      setPhotos([]);
      setFeedback(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset?.id, pendingTransfer?.id]);

  const fetchData = async (movementId: string, assetId: string) => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Fetch movement details with relations
      const { data: movementData } = await supabase
        .from('inventory_movements')
        .select(
          '*, from_location:locations!from_location_id(name), to_location:locations!to_location_id(name), initiator:user_profiles!initiated_by(full_name), receiver:user_profiles!receiver_id(full_name)'
        )
        .eq('id', movementId)
        .eq('status', 'pending')
        .single();

      if (movementData) {
        setMovement(movementData as unknown as InventoryMovementWithRelations);
      }

      // Fetch sender condition photos for this movement
      const { data: senderPhotoData } = await supabase
        .from('media_attachments')
        .select('id, file_name, file_path')
        .eq('entity_type', 'asset_transfer_send')
        .eq('entity_id', movementId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (senderPhotoData && senderPhotoData.length > 0) {
        const { data: signedUrls } = await supabase.storage
          .from('asset-photos')
          .createSignedUrls(
            senderPhotoData.map((a) => a.file_path),
            21600
          );
        setSenderPhotos(
          senderPhotoData.map((a, i) => ({
            id: a.id,
            url: signedUrls?.[i]?.signedUrl ?? '',
            fileName: a.file_name,
          }))
        );
      } else {
        setSenderPhotos([]);
      }

      // Fetch latest asset condition photos (creation + status change)
      const { data: assetPhotoData } = await supabase
        .from('media_attachments')
        .select('id, file_name, file_path')
        .in('entity_type', ['asset_creation', 'asset_status_change'])
        .eq('entity_id', assetId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(4);

      if (assetPhotoData && assetPhotoData.length > 0) {
        const { data: signedUrls } = await supabase.storage
          .from('asset-photos')
          .createSignedUrls(
            assetPhotoData.map((a) => a.file_path),
            21600
          );
        setAssetPhotos(
          assetPhotoData.map((a, i) => ({
            id: a.id,
            url: signedUrls?.[i]?.signedUrl ?? '',
            fileName: a.file_name,
          }))
        );
      } else {
        setAssetPhotos([]);
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load transfer details. Please close and try again.' });
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (thumbnails: ThumbnailPhoto[], index: number) => {
    setLightboxPhotos(thumbnails.map((p) => ({ id: p.id, url: p.url, fileName: p.fileName })));
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleSubmit = async () => {
    if (!movement) return;
    if (mode === 'reject' && !reason.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (mode === 'accept') {
        const result = await acceptTransfer({ movement_id: movement.id });
        if (result?.serverError) {
          setFeedback({ type: 'error', message: result.serverError });
          return;
        }

        // Upload receiver condition photos
        if (photos.length > 0) {
          const formData = new FormData();
          formData.append('movement_id', movement.id);
          formData.append('photo_type', 'transfer_receive');
          for (const file of photos) {
            formData.append('photos', file);
          }
          const uploadRes = await fetch('/api/uploads/asset-photos', {
            method: 'POST',
            body: formData,
          });
          if (!uploadRes.ok) {
            // Transfer accepted but photos failed — show warning, don't block
            setFeedback({ type: 'error', message: 'Transfer accepted, but photo upload failed. You can add photos later.' });
            onSuccess();
            router.refresh();
            return;
          }
        }
      } else if (mode === 'reject') {
        const result = await rejectTransfer({
          movement_id: movement.id,
          reason: reason.trim(),
        });
        if (result?.serverError) {
          setFeedback({ type: 'error', message: result.serverError });
          return;
        }

        // Upload rejection evidence photos
        if (photos.length > 0) {
          const formData = new FormData();
          formData.append('movement_id', movement.id);
          formData.append('photo_type', 'transfer_reject');
          for (const file of photos) {
            formData.append('photos', file);
          }
          const rejectUploadRes = await fetch('/api/uploads/asset-photos', {
            method: 'POST',
            body: formData,
          });
          if (!rejectUploadRes.ok) {
            setFeedback({ type: 'error', message: 'Transfer rejected, but evidence photo upload failed.' });
            onSuccess();
            router.refresh();
            return;
          }
        }
      }

      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : `Failed to ${mode} transfer`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (!movement) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const result = await cancelTransfer({ movement_id: movement.id });
      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }

      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to cancel transfer',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = mode === 'accept' ? true : reason.trim().length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{variant === 'admin' ? 'Transfer Details' : 'Respond to Transfer'}</DialogTitle>
          </DialogHeader>

          {/* Loading state */}
          {loading && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                <Skeleton className="h-5 w-48" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && asset && (
            <div className="space-y-4">
              {/* Asset Information */}
              <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm font-medium">{asset.display_id}</span>
                  <span className="text-sm">{asset.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {asset.category?.name && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        Category
                      </p>
                      <p className="text-sm">{asset.category.name}</p>
                    </div>
                  )}
                  {asset.location?.name && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        Location
                      </p>
                      <p className="text-sm">{asset.location.name}</p>
                    </div>
                  )}
                  {asset.brand && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        Brand
                      </p>
                      <p className="text-sm">{asset.brand}</p>
                    </div>
                  )}
                  {asset.model && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        Model
                      </p>
                      <p className="text-sm">{asset.model}</p>
                    </div>
                  )}
                  {asset.serial_number && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        Serial Number
                      </p>
                      <p className="text-sm">{asset.serial_number}</p>
                    </div>
                  )}
                </div>
                {/* Asset condition photos */}
                {assetPhotos.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {assetPhotos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        type="button"
                        className="h-16 w-16 shrink-0 overflow-hidden rounded border border-border hover:opacity-80 transition-opacity"
                        onClick={() => openLightbox(assetPhotos, idx)}
                      >
                        <img
                          src={photo.url}
                          alt={photo.fileName}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer Details */}
              {movement && (
                <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      Transfer
                    </p>
                    <p className="text-sm flex items-center gap-1.5">
                      <span>{movement.from_location?.name ?? '—'}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{movement.to_location?.name ?? '—'}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        Initiated By
                      </p>
                      <p className="text-sm">{movement.initiator?.full_name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        Date
                      </p>
                      <p className="text-sm">{format(new Date(movement.created_at), 'dd-MM-yyyy')}</p>
                    </div>
                  </div>
                  {movement.notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                        Notes
                      </p>
                      <p className="text-sm">{movement.notes}</p>
                    </div>
                  )}
                  {/* Sender photos */}
                  {senderPhotos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        Sender Photos
                      </p>
                      <div className="flex gap-2">
                        {senderPhotos.map((photo, idx) => (
                          <button
                            key={photo.id}
                            type="button"
                            className="h-16 w-16 shrink-0 overflow-hidden rounded border border-border hover:opacity-80 transition-opacity"
                            onClick={() => openLightbox(senderPhotos, idx)}
                          >
                            <img
                              src={photo.url}
                              alt={photo.fileName}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode: Default — show variant-appropriate buttons */}
              {mode === 'default' && variant === 'respond' && (
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setMode('accept')}
                  >
                    Accept Transfer
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => setMode('reject')}
                  >
                    Reject Transfer
                  </Button>
                </div>
              )}
              {mode === 'default' && variant === 'admin' && (
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setMode('cancel')}
                  >
                    Cancel Transfer
                  </Button>
                </div>
              )}

              {/* Mode: Accept — optional photos + confirm */}
              {mode === 'accept' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>
                      Received Condition Photos{' '}
                      <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Optionally document the received asset condition.
                    </p>
                    <PhotoUpload
                      onChange={setPhotos}
                      maxPhotos={5}
                      showCount
                      disabled={isSubmitting}
                      enableAnnotation={false}
                    />
                  </div>

                  {feedback && (
                    <InlineFeedback
                      type={feedback.type}
                      message={feedback.message}
                      onDismiss={() => setFeedback(null)}
                    />
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => { setMode('default'); setPhotos([]); setFeedback(null); }}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Accepting...' : 'Accept Transfer'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Mode: Reject — required reason + optional photos + confirm */}
              {mode === 'reject' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="respond-rejection-reason">
                      Rejection Reason <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="respond-rejection-reason"
                      placeholder="Explain why this transfer is being rejected..."
                      maxLength={1000}
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">{reason.length}/1000</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Evidence Photos{' '}
                      <span className="text-muted-foreground text-xs">(optional)</span>
                    </Label>
                    <PhotoUpload
                      onChange={setPhotos}
                      maxPhotos={5}
                      showCount
                      disabled={isSubmitting}
                      enableAnnotation={false}
                    />
                  </div>

                  {feedback && (
                    <InlineFeedback
                      type={feedback.type}
                      message={feedback.message}
                      onDismiss={() => setFeedback(null)}
                    />
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => { setMode('default'); setReason(''); setPhotos([]); setFeedback(null); }}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleSubmit}
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? 'Rejecting...' : 'Reject Transfer'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Mode: Cancel — admin confirmation to cancel pending transfer */}
              {mode === 'cancel' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to cancel this pending transfer? The asset will remain at its current location.
                  </p>

                  {feedback && (
                    <InlineFeedback
                      type={feedback.type}
                      message={feedback.message}
                      onDismiss={() => setFeedback(null)}
                    />
                  )}

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => { setMode('default'); setFeedback(null); }}
                      disabled={isSubmitting}
                    >
                      Back
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelTransfer}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Cancelling...' : 'Cancel Transfer'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PhotoLightbox — rendered outside Dialog for z-index stacking */}
      {lightboxOpen && lightboxPhotos.length > 0 && (
        <PhotoLightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
