'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { acceptTransfer, rejectTransfer } from '@/app/actions/asset-actions';
import type { InventoryMovementWithRelations } from '@/lib/types/database';
import { AssetPhotoUpload } from './asset-photo-upload';
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

interface AssetTransferRespondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement: InventoryMovementWithRelations;
  mode: 'accept' | 'reject';
  onSuccess: () => void;
}

export function AssetTransferRespondDialog({
  open,
  onOpenChange,
  movement,
  mode,
  onSuccess,
}: AssetTransferRespondDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset when dialog opens/mode changes
  useEffect(() => {
    if (open) {
      setReason('');
      setPhotos([]);
      setFeedback(null);
    }
  }, [open, mode]);

  const isAccept = mode === 'accept';
  const canSubmit = isAccept
    ? photos.length > 0
    : photos.length > 0 && reason.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (isAccept) {
        // Accept transfer
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

          await fetch('/api/uploads/asset-photos', {
            method: 'POST',
            body: formData,
          });
        }
      } else {
        // Reject transfer
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

          await fetch('/api/uploads/asset-photos', {
            method: 'POST',
            body: formData,
          });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isAccept ? 'Accept Transfer' : 'Reject Transfer'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transfer details */}
          <div className="rounded-md border bg-muted/30 p-4 space-y-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Transfer
              </p>
              <p className="text-sm">
                {movement.from_location?.name ?? '—'} &rarr; {movement.to_location?.name ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Initiated By
              </p>
              <p className="text-sm">{movement.initiator?.full_name ?? '—'}</p>
            </div>
          </div>

          {/* Rejection reason (required for reject) */}
          {!isAccept && (
            <div className="space-y-1.5">
              <Label htmlFor="rejection-reason">
                Rejection Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Explain why this transfer is being rejected..."
                maxLength={1000}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">{reason.length}/1000</p>
            </div>
          )}

          {/* Condition photos (required) */}
          <div className="space-y-1.5">
            <Label>
              {isAccept ? 'Received Condition Photos' : 'Evidence Photos'}{' '}
              <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              {isAccept
                ? 'Document the received asset condition. At least 1 photo required.'
                : 'Document evidence for rejection. At least 1 photo required.'}
            </p>
            <AssetPhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              maxPhotos={5}
              required={true}
              disabled={isSubmitting}
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
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={
                !isAccept
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }
            >
              {isSubmitting
                ? isAccept
                  ? 'Accepting...'
                  : 'Rejecting...'
                : isAccept
                  ? 'Accept Transfer'
                  : 'Reject Transfer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
