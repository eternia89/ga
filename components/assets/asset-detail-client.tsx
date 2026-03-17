'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Truck } from 'lucide-react';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { AssetStatusBadge } from './asset-status-badge';
import { AssetDetailInfo } from './asset-detail-info';
import { AssetDetailActions } from './asset-detail-actions';
import { AssetTimeline } from './asset-timeline';
import { AssetStatusChangeDialog } from './asset-status-change-dialog';
import { ASSET_STATUS_TRANSITIONS } from '@/lib/constants/asset-status';
import type { AssetStatus } from '@/lib/constants/asset-status';
import type { GAUserWithLocation } from './asset-transfer-dialog';

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
  gaUsers: GAUserWithLocation[];
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
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const FORM_ID = 'asset-edit-form';

  const handleActionSuccess = () => {
    router.refresh();
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
          <AssetStatusBadge
            status={asset.status}
            showInTransit={!!pendingTransfer}
          />
          {isStatusClickable && (
            <button
              type="button"
              onClick={() => setShowStatusDialog(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Change Status
            </button>
          )}
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
              <p className="text-blue-600 text-xs mt-0.5">
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
            onSubmittingChange={setIsSubmitting}
            formId={FORM_ID}
            onDirtyChange={setIsDirty}
          />

          <AssetDetailActions
            asset={asset}
            pendingTransfer={pendingTransfer}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onTransfer={() => setShowTransferDialog(true)}
            showTransferDialog={showTransferDialog}
            onTransferDialogChange={setShowTransferDialog}
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

      {/* Sticky save bar */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
          <div className="mx-auto max-w-[1300px] px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Unsaved changes</p>
            <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

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
