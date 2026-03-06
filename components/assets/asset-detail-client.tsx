'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Truck } from 'lucide-react';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';
import { AssetStatusBadge } from './asset-status-badge';
import { AssetDetailInfo } from './asset-detail-info';
import { AssetDetailActions } from './asset-detail-actions';
import { AssetTimeline } from './asset-timeline';
import { AssetStatusChangeDialog } from './asset-status-change-dialog';
import { ASSET_STATUS_TRANSITIONS } from '@/lib/constants/asset-status';
import type { AssetStatus } from '@/lib/constants/asset-status';

export interface ConditionPhoto {
  id: string;
  entity_type: string;
  entity_id: string;
  url: string;
  fileName: string;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  url: string;
  fileName: string;
  created_at: string;
}

export interface TransferPhoto {
  id: string;
  entity_type: string;
  entity_id: string;
  url: string;
  fileName: string;
  created_at: string;
}

interface AssetDetailClientProps {
  asset: InventoryItemWithRelations;
  pendingTransfer: InventoryMovementWithRelations | null;
  conditionPhotos: ConditionPhoto[];
  invoices: InvoiceItem[];
  auditLogs: Record<string, unknown>[];
  movements: InventoryMovementWithRelations[];
  transferPhotos: TransferPhoto[];
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  gaUsers: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
}

export function AssetDetailClient({
  asset,
  pendingTransfer,
  conditionPhotos,
  invoices,
  auditLogs,
  movements,
  transferPhotos,
  categories,
  locations,
  gaUsers,
  currentUserId,
  currentUserRole,
}: AssetDetailClientProps) {
  const router = useRouter();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showTransferRespondDialog, setShowTransferRespondDialog] = useState(false);
  const [transferRespondMode, setTransferRespondMode] = useState<'accept' | 'reject'>('accept');

  const handleActionSuccess = () => {
    router.refresh();
  };

  const openTransferRespond = (mode: 'accept' | 'reject') => {
    setTransferRespondMode(mode);
    setShowTransferRespondDialog(true);
  };

  const canChangeStatus =
    ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) &&
    asset.status !== 'sold_disposed';

  const isTerminalStatus = asset.status === 'sold_disposed';
  const allowedTransitions = isTerminalStatus
    ? []
    : ASSET_STATUS_TRANSITIONS[asset.status as AssetStatus] ?? [];

  const isStatusClickable = canChangeStatus && allowedTransitions.length > 0;

  return (
    <>
      {/* Page-level header: display ID + status badge */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight font-mono">
            {asset.display_id}
          </h1>
          <button
            type="button"
            onClick={isStatusClickable ? () => setShowStatusDialog(true) : undefined}
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

      {/* Two-column grid */}
      <div className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6">
        {/* Left column: info + actions */}
        <div className="space-y-6">
          <AssetDetailInfo
            asset={asset}
            conditionPhotos={conditionPhotos}
            invoices={invoices}
            categories={categories}
            locations={locations}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onEditSuccess={handleActionSuccess}
          />

          <AssetDetailActions
            asset={asset}
            pendingTransfer={pendingTransfer}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onTransfer={() => setShowTransferDialog(true)}
            onTransferRespond={openTransferRespond}
            showTransferDialog={showTransferDialog}
            onTransferDialogChange={setShowTransferDialog}
            showTransferRespondDialog={showTransferRespondDialog}
            onTransferRespondDialogChange={setShowTransferRespondDialog}
            transferRespondMode={transferRespondMode}
            locations={locations}
            gaUsers={gaUsers}
            onActionSuccess={handleActionSuccess}
          />
        </div>

        {/* Right column: timeline */}
        <div>
          <div className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold mb-4">Activity Timeline</h2>
            <AssetTimeline
              auditLogs={auditLogs}
              movements={movements}
              conditionPhotos={conditionPhotos}
              transferPhotos={transferPhotos}
            />
          </div>
        </div>
      </div>

      {/* Status change dialog */}
      <AssetStatusChangeDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        asset={asset}
        onSuccess={handleActionSuccess}
      />
    </>
  );
}
