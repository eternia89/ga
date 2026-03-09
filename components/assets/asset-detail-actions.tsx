'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';
import { AssetTransferDialog, type GAUserWithLocation } from './asset-transfer-dialog';
import { AssetTransferRespondDialog } from './asset-transfer-respond-dialog';
import { cancelTransfer } from '@/app/actions/asset-actions';
import { InlineFeedback } from '@/components/inline-feedback';

interface AssetDetailActionsProps {
  asset: InventoryItemWithRelations;
  pendingTransfer: InventoryMovementWithRelations | null;
  currentUserId: string;
  currentUserRole: string;
  onTransfer: () => void;
  onTransferRespond: (mode: 'accept' | 'reject') => void;
  showTransferDialog: boolean;
  onTransferDialogChange: (open: boolean) => void;
  showTransferRespondDialog: boolean;
  onTransferRespondDialogChange: (open: boolean) => void;
  transferRespondMode: 'accept' | 'reject';
  locations: { id: string; name: string }[];
  gaUsers: GAUserWithLocation[];
  onActionSuccess: () => void;
}

export function AssetDetailActions({
  asset,
  pendingTransfer,
  currentUserId,
  currentUserRole,
  onTransfer,
  onTransferRespond,
  showTransferDialog,
  onTransferDialogChange,
  showTransferRespondDialog,
  onTransferRespondDialogChange,
  transferRespondMode,
  locations,
  gaUsers,
  onActionSuccess,
}: AssetDetailActionsProps) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const isGaStaffOrHigher = ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole);
  const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const isTerminal = asset.status === 'sold_disposed';

  // Transfer: GA Staff or higher on non-terminal assets with no pending transfer
  const canTransfer = isGaStaffOrHigher && !isTerminal && !pendingTransfer;

  // Receiver of pending transfer (or GA Lead/Admin can also respond)
  const isReceiver = pendingTransfer && pendingTransfer.receiver_id === currentUserId;
  const canRespond =
    pendingTransfer &&
    (isReceiver || isGaLeadOrAdmin);

  // Cancel: initiator of pending transfer or GA Lead/Admin
  const isInitiator = pendingTransfer && pendingTransfer.initiated_by === currentUserId;
  const canCancel =
    pendingTransfer &&
    (isInitiator || isGaLeadOrAdmin);

  const hasAnyAction = canTransfer || canRespond || canCancel;

  const handleCancelTransfer = async () => {
    if (!pendingTransfer) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const result = await cancelTransfer({ movement_id: pendingTransfer.id });
      if (result?.serverError) {
        setCancelError(result.serverError);
        return;
      }
      setCancelOpen(false);
      router.refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel transfer');
    } finally {
      setCancelLoading(false);
    }
  };

  if (!hasAnyAction) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Primary CTA */}
        <div className="flex flex-wrap gap-2">
          {canTransfer && (
            <Button onClick={onTransfer}>
              <Truck className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          )}

          {canRespond && (
            <Button
              onClick={() => onTransferRespond('accept')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Accept Transfer
            </Button>
          )}
        </div>

        {/* Right: Secondary actions */}
        <div className="flex flex-wrap gap-2">
          {canRespond && (
            <Button variant="outline" onClick={() => onTransferRespond('reject')}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Reject Transfer</span>
            </Button>
          )}

          {canCancel && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <Ban className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Cancel Transfer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Transfer confirmation */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this pending transfer? The asset will remain at its
              current location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cancelError && (
            <InlineFeedback
              type="error"
              message={cancelError}
              onDismiss={() => setCancelError(null)}
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Keep Transfer</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelTransfer}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading ? 'Cancelling...' : 'Cancel Transfer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer initiation dialog */}
      <AssetTransferDialog
        open={showTransferDialog}
        onOpenChange={onTransferDialogChange}
        asset={asset}
        currentLocationName={asset.location?.name ?? ''}
        gaUsers={gaUsers}
        locationNames={Object.fromEntries(locations.map((l) => [l.id, l.name]))}
        onSuccess={onActionSuccess}
      />

      {/* Transfer respond dialog */}
      {pendingTransfer && (
        <AssetTransferRespondDialog
          open={showTransferRespondDialog}
          onOpenChange={onTransferRespondDialogChange}
          movement={pendingTransfer}
          mode={transferRespondMode}
          onSuccess={onActionSuccess}
        />
      )}
    </>
  );
}
