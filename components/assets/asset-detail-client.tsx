'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { InventoryItemWithRelations, InventoryMovementWithRelations } from '@/lib/types/database';
import { AssetDetailInfo } from './asset-detail-info';
import { AssetDetailActions } from './asset-detail-actions';
import { AssetTimeline } from './asset-timeline';

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
  const [isEditing, setIsEditing] = useState(false);
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

  return (
    <div className="grid grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6">
      {/* Left column: info + actions */}
      <div className="space-y-6">
        <AssetDetailInfo
          asset={asset}
          pendingTransfer={pendingTransfer}
          conditionPhotos={conditionPhotos}
          invoices={invoices}
          categories={categories}
          locations={locations}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isEditing={isEditing}
          onEditToggle={() => {
            setIsEditing(!isEditing);
            if (isEditing) {
              router.refresh();
            }
          }}
          onStatusBadgeClick={() => setShowStatusDialog(true)}
          showStatusDialog={showStatusDialog}
          onStatusDialogChange={setShowStatusDialog}
          onStatusSuccess={handleActionSuccess}
        />

        {!isEditing && (
          <AssetDetailActions
            asset={asset}
            pendingTransfer={pendingTransfer}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onEdit={() => setIsEditing(true)}
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
        )}
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
  );
}
