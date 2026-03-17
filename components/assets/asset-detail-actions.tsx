'use client';

import { useState } from 'react';
import { Truck, CheckCircle, XCircle, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';
import { AssetTransferDialog, type GAUserWithLocation } from './asset-transfer-dialog';
import { AssetTransferRespondModal } from './asset-transfer-respond-modal';
import type { PendingTransfer } from './asset-columns';

interface AssetDetailActionsProps {
  asset: InventoryItemWithRelations;
  pendingTransfer: InventoryMovementWithRelations | null;
  currentUserId: string;
  currentUserRole: string;
  onTransfer: () => void;
  showTransferDialog: boolean;
  onTransferDialogChange: (open: boolean) => void;
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
  showTransferDialog,
  onTransferDialogChange,
  locations,
  gaUsers,
  onActionSuccess,
}: AssetDetailActionsProps) {
  const [showRespondModal, setShowRespondModal] = useState(false);
  const [respondVariant, setRespondVariant] = useState<'respond' | 'admin'>('respond');

  const isGaStaffOrHigher = ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole);
  const isTerminal = asset.status === 'sold_disposed';

  // Transfer: GA Staff or higher on non-terminal assets with no pending transfer
  const canTransfer = isGaStaffOrHigher && !isTerminal && !pendingTransfer;

  // Receiver of pending transfer only can respond
  const isReceiver = pendingTransfer && pendingTransfer.receiver_id === currentUserId;
  const canRespond = pendingTransfer && isReceiver;

  // Cancel: initiator of pending transfer, ga_lead, or admin
  const isInitiator = pendingTransfer && pendingTransfer.initiated_by === currentUserId;
  const isLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
  const canCancel = pendingTransfer && (isInitiator || isLeadOrAdmin);

  const hasAnyAction = canTransfer || canRespond || canCancel;

  // Convert pendingTransfer to PendingTransfer shape for the respond modal
  const pendingTransferForModal: PendingTransfer | undefined = pendingTransfer
    ? {
        id: pendingTransfer.id,
        to_location: pendingTransfer.to_location,
        receiver_id: pendingTransfer.receiver_id,
        receiver_name: pendingTransfer.receiver?.full_name ?? null,
      }
    : undefined;

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
              onClick={() => { setRespondVariant('respond'); setShowRespondModal(true); }}
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
            <Button variant="outline" onClick={() => { setRespondVariant('respond'); setShowRespondModal(true); }}>
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Reject Transfer</span>
            </Button>
          )}

          {canCancel && (
            <Button variant="outline" onClick={() => { setRespondVariant('admin'); setShowRespondModal(true); }}>
              <Truck className="mr-2 h-4 w-4" />
              Edit Transfer
            </Button>
          )}
        </div>
      </div>

      {/* Transfer initiation dialog */}
      <AssetTransferDialog
        open={showTransferDialog}
        onOpenChange={onTransferDialogChange}
        asset={asset}
        currentLocationName={asset.location?.name ?? ''}
        gaUsers={gaUsers}
        currentUserId={currentUserId}
        locationNames={Object.fromEntries(locations.map((l) => [l.id, l.name]))}
        onSuccess={onActionSuccess}
      />

      {/* Transfer respond/cancel modal */}
      {pendingTransfer && (
        <AssetTransferRespondModal
          open={showRespondModal}
          onOpenChange={setShowRespondModal}
          asset={asset}
          pendingTransfer={pendingTransferForModal}
          onSuccess={onActionSuccess}
          variant={respondVariant}
        />
      )}
    </>
  );
}
