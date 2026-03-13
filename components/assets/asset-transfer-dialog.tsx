'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createTransfer } from '@/app/actions/asset-actions';
import type { InventoryItemWithRelations } from '@/lib/types/database';
import { Combobox } from '@/components/combobox';
import { PhotoUpload } from '@/components/media/photo-upload';
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
import { AlertTriangle } from 'lucide-react';

export interface GAUserWithLocation {
  id: string;
  name: string;
  location_id: string | null;
}

type TransferMode = 'user' | 'location';

interface AssetTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: InventoryItemWithRelations;
  currentLocationName: string;
  gaUsers: GAUserWithLocation[];
  /** The current user's ID — excluded from receiver options to prevent self-transfer */
  currentUserId: string;
  /** Map of location id -> name for resolving receiver's location */
  locationNames: Record<string, string>;
  onSuccess: () => void;
}

export function AssetTransferDialog({
  open,
  onOpenChange,
  asset,
  currentLocationName,
  gaUsers,
  currentUserId,
  locationNames,
  onSuccess,
}: AssetTransferDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<TransferMode>('user');
  const [receiverId, setReceiverId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setMode('user');
      setReceiverId('');
      setToLocationId('');
      setNotes('');
      setPhotos([]);
      setFeedback(null);
    }
  }, [open]);

  const userOptions = gaUsers
    .filter((u) => u.id !== currentUserId)
    .map((u) => ({ label: u.name, value: u.id }));

  const locationOptions = Object.entries(locationNames).map(([value, label]) => ({
    value,
    label,
  }));

  // Auto-resolve location from selected receiver (user mode)
  const selectedUser = useMemo(
    () => gaUsers.find((u) => u.id === receiverId) ?? null,
    [gaUsers, receiverId]
  );
  const resolvedLocationId = selectedUser?.location_id ?? '';
  const resolvedLocationName = resolvedLocationId
    ? (locationNames[resolvedLocationId] ?? 'Unknown location')
    : '';
  const receiverHasNoLocation = receiverId !== '' && !resolvedLocationId;

  const canSubmit =
    mode === 'user'
      ? receiverId !== '' && resolvedLocationId !== '' && photos.length > 0
      : toLocationId !== '';

  const handleModeSwitch = (newMode: TransferMode) => {
    setMode(newMode);
    if (newMode === 'location') {
      setReceiverId('');
    } else {
      setToLocationId('');
    }
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const finalLocationId = mode === 'user' ? resolvedLocationId : toLocationId;
      const finalReceiverId = mode === 'user' ? receiverId : undefined;

      // Step 1: Create transfer movement
      const result = await createTransfer({
        asset_id: asset.id,
        to_location_id: finalLocationId,
        receiver_id: finalReceiverId,
        notes: notes || undefined,
      });

      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
        return;
      }

      const movementId = result?.data?.movementId;

      // Step 2: Upload sender condition photos
      if (photos.length > 0 && movementId) {
        const formData = new FormData();
        formData.append('movement_id', movementId);
        formData.append('photo_type', 'transfer_send');
        for (const file of photos) {
          formData.append('photos', file);
        }

        const uploadRes = await fetch('/api/uploads/asset-photos', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          let errorMessage = 'Upload failed. Transfer was created but condition photos could not be saved. Please try again or contact support.';
          try {
            const errorBody = await uploadRes.json();
            if (errorBody?.error) errorMessage = `Upload failed: ${errorBody.error}`;
          } catch {
            // ignore parse errors, keep default message
          }
          setFeedback({ type: 'error', message: errorMessage });
          return;
          // Do NOT call onOpenChange(false) or onSuccess() — dialog stays open so user can retry
        }
      }

      onOpenChange(false);
      onSuccess();
      router.refresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to initiate transfer',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transfer Asset</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Current location: <span className="font-medium text-foreground">{currentLocationName || '—'}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'user' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => handleModeSwitch('user')}
              disabled={isSubmitting}
            >
              Transfer to User
            </Button>
            <Button
              type="button"
              variant={mode === 'location' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => handleModeSwitch('location')}
              disabled={isSubmitting}
            >
              Move to Location
            </Button>
          </div>

          {/* User Transfer mode */}
          {mode === 'user' && (
            <div className="space-y-1.5">
              <Label htmlFor="receiver">
                Receiver <span className="text-destructive">*</span>
              </Label>
              {userOptions.length === 0 ? (
                <InlineFeedback
                  type="error"
                  message="No eligible users found in this company. Use 'Move to Location' instead."
                />
              ) : (
                <>
                  <Combobox
                    options={userOptions}
                    value={receiverId}
                    onValueChange={setReceiverId}
                    placeholder="Select receiver..."
                    searchPlaceholder="Search users..."
                    emptyText="No users found."
                    disabled={isSubmitting}
                  />
                  {/* Auto-resolved location display */}
                  {resolvedLocationName && (
                    <p className="text-xs text-muted-foreground">
                      Location: {resolvedLocationName}
                    </p>
                  )}
                  {receiverHasNoLocation && (
                    <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-2.5">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-yellow-700">
                        Selected receiver has no assigned location. Please assign a location to this user first.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Location Transfer mode */}
          {mode === 'location' && (
            <div className="space-y-1.5">
              <Label htmlFor="to-location">
                Destination Location <span className="text-destructive">*</span>
              </Label>
              <Combobox
                options={locationOptions}
                value={toLocationId}
                onValueChange={setToLocationId}
                placeholder="Select location..."
                searchPlaceholder="Search locations..."
                emptyText="No locations found."
                disabled={isSubmitting}
              />
              {toLocationId && (
                <p className="text-xs text-muted-foreground">
                  Asset will be moved to this location immediately.
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="transfer-notes">Notes (optional)</Label>
            <Textarea
              id="transfer-notes"
              placeholder="Add notes about this transfer..."
              maxLength={200}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">{notes.length}/200</p>
          </div>

          {/* Sender condition photos (required in user mode only) */}
          {mode === 'user' && (
            <div className="space-y-1.5">
              <Label>
                Condition Photos <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Document the asset condition before transfer. At least 1 photo required.
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
          )}

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
              {isSubmitting
                ? mode === 'user' ? 'Initiating...' : 'Moving...'
                : mode === 'user' ? 'Initiate Transfer' : 'Move Asset'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
