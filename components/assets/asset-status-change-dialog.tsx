'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import type { InventoryItemWithRelations } from '@/lib/types/database';
import {
  ASSET_STATUS_LABELS,
  ASSET_STATUS_TRANSITIONS,
} from '@/lib/constants/asset-status';
import type { AssetStatus } from '@/lib/constants/asset-status';
import { changeAssetStatus } from '@/app/actions/asset-actions';
import { PhotoUpload } from '@/components/media/photo-upload';
import { InlineFeedback } from '@/components/inline-feedback';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DisplayId } from '@/components/display-id';

interface AssetStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: InventoryItemWithRelations;
  onSuccess: () => void;
}

export function AssetStatusChangeDialog({
  open,
  onOpenChange,
  asset,
  onSuccess,
}: AssetStatusChangeDialogProps) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState<AssetStatus | ''>('');
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setNewStatus('');
      setNote('');
      setPhotos([]);
      setFeedback(null);
    }
  }, [open]);

  const currentStatus = asset.status as AssetStatus;
  const allowedTransitions = ASSET_STATUS_TRANSITIONS[currentStatus] ?? [];
  const isSoldDisposed = newStatus === 'sold_disposed';
  const canSubmit = newStatus !== '' && photos.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Step 1: Change status
      const result = await changeAssetStatus({
        asset_id: asset.id,
        new_status: newStatus as AssetStatus,
        note: note || undefined,
      });

      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }

      // Step 2: Upload condition photos
      if (photos.length > 0) {
        const formData = new FormData();
        formData.append('asset_id', asset.id);
        formData.append('photo_type', 'status_change');
        for (const file of photos) {
          formData.append('photos', file);
        }

        const uploadRes = await fetch('/api/uploads/asset-photos', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          // Status changed but photo upload failed — still consider success
          setFeedback({
            type: 'success',
            message: 'Status changed, but photo upload failed. You can add photos later.',
          });
          onSuccess();
          router.refresh();
          return;
        }
      }

      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to change status',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Asset Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset info */}
          <div className="rounded-md border bg-muted/30 p-4 space-y-2">
            <div className="flex items-baseline gap-2">
              <DisplayId className="text-sm font-medium">{asset.display_id}</DisplayId>
              <span className="text-sm">{asset.name}</span>
            </div>
            {(asset.brand || asset.model || asset.serial_number) && (
              <p className="text-xs text-muted-foreground">
                {[asset.brand, asset.model, asset.serial_number].filter(Boolean).join(' · ')}
              </p>
            )}
            <div className="flex items-center gap-2 pt-1 border-t">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Current Status
              </p>
              <p className="text-sm font-medium">
                {ASSET_STATUS_LABELS[currentStatus] ?? currentStatus}
              </p>
            </div>
          </div>

          {/* New status selector */}
          <div className="space-y-1.5">
            <Label htmlFor="new-status">
              New Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as AssetStatus)}
            >
              <SelectTrigger id="new-status" className="w-full">
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                {allowedTransitions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {ASSET_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Irreversibility warning for sold_disposed */}
          {isSoldDisposed && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                <span className="font-medium">This action is irreversible.</span> The asset will
                be permanently marked as Sold/Disposed and cannot be changed again.
              </p>
            </div>
          )}

          {/* Condition photos (required) */}
          <div className="space-y-1.5">
            <Label>
              Condition Photos <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">
              At least 1 photo is required to document the asset condition.
            </p>
            <PhotoUpload
              onChange={setPhotos}
              maxPhotos={5}
              required
              showCount
              disabled={isSubmitting}
              enableAnnotation={false}
            />
          </div>

          {/* Optional note */}
          <div className="space-y-1.5">
            <Label htmlFor="status-note">Note (optional)</Label>
            <Textarea
              id="status-note"
              placeholder="Add a note about this status change..."
              maxLength={1000}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">{note.length}/1000</p>
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
            >
              {isSubmitting ? 'Changing...' : 'Change Status'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
