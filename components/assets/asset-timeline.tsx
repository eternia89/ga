'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Pencil,
  RefreshCw,
  Truck,
  CheckCircle,
  XCircle,
  Ban,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ASSET_STATUS_LABELS,
} from '@/lib/constants/asset-status';
import type { AssetStatus } from '@/lib/constants/asset-status';
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';
import type { ConditionPhoto, TransferPhoto } from './asset-detail-client';
import type { InventoryMovementWithRelations } from '@/lib/types/database';

type AssetTimelineEventType =
  | 'created'
  | 'field_update'
  | 'status_changed'
  | 'transfer_initiated'
  | 'transfer_accepted'
  | 'transfer_rejected'
  | 'transfer_cancelled';

interface AssetTimelineEvent {
  type: AssetTimelineEventType;
  at: string;
  by?: string;
  details?: Record<string, unknown>;
  photos?: Array<{ id: string; url: string; fileName: string }>;
}

interface AssetTimelineProps {
  auditLogs: Record<string, unknown>[];
  movements: InventoryMovementWithRelations[];
  conditionPhotos: ConditionPhoto[];
  transferPhotos: TransferPhoto[];
}

const EVENT_ICONS: Record<AssetTimelineEventType, React.ReactNode> = {
  created: <Plus className="h-3.5 w-3.5" />,
  field_update: <Pencil className="h-3.5 w-3.5" />,
  status_changed: <RefreshCw className="h-3.5 w-3.5" />,
  transfer_initiated: <Truck className="h-3.5 w-3.5" />,
  transfer_accepted: <CheckCircle className="h-3.5 w-3.5" />,
  transfer_rejected: <XCircle className="h-3.5 w-3.5" />,
  transfer_cancelled: <Ban className="h-3.5 w-3.5" />,
};

const EVENT_COLORS: Record<AssetTimelineEventType, string> = {
  created: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  field_update: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  status_changed: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  transfer_initiated: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  transfer_accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  transfer_rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  transfer_cancelled: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

function formatTimestamp(iso: string): string {
  return format(new Date(iso), 'dd-MM-yyyy, HH:mm:ss');
}

// Human-readable field name mapping
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  category_id: 'Category',
  location_id: 'Location',
  brand: 'Brand',
  model: 'Model',
  serial_number: 'Serial Number',
  description: 'Description',
  acquisition_date: 'Acquisition Date',
  warranty_expiry: 'Warranty Expiry',
  notes: 'Notes',
};

interface PhotoThumbnailsProps {
  photos: Array<{ id: string; url: string; fileName: string }>;
  maxVisible?: number;
}

function PhotoThumbnails({ photos, maxVisible = 3 }: PhotoThumbnailsProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const visible = photos.slice(0, maxVisible);
  const extraCount = photos.length - maxVisible;

  return (
    <>
      <div className="flex flex-wrap gap-1 mt-2">
        {visible.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="w-12 h-12 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity shrink-0"
            aria-label={`View photo: ${photo.fileName}`}
          >
            <img
              src={photo.url}
              alt={photo.fileName}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
        {extraCount > 0 && (
          <button
            type="button"
            onClick={() => setLightboxIndex(0)}
            className="w-12 h-12 rounded border border-border flex items-center justify-center text-xs text-muted-foreground hover:bg-muted transition-colors shrink-0"
            aria-label={`View all ${photos.length} photos`}
          >
            +{extraCount}
          </button>
        )}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

function EventContent({ event }: { event: AssetTimelineEvent }) {
  const by = event.by ?? 'System';

  switch (event.type) {
    case 'created':
      return (
        <span>
          <span className="font-medium">{by}</span> created this asset
          {event.photos && event.photos.length > 0 && (
            <PhotoThumbnails photos={event.photos} />
          )}
        </span>
      );

    case 'field_update': {
      const fields = event.details?.fields as string[] | undefined;
      if (!fields || fields.length === 0) return <span><span className="font-medium">{by}</span> updated asset details</span>;
      const fieldLabels = fields.map((f) => FIELD_LABELS[f] ?? f).join(', ');
      return (
        <span>
          <span className="font-medium">{by}</span> updated{' '}
          <span className="font-medium">{fieldLabels}</span>
        </span>
      );
    }

    case 'status_changed': {
      const oldStatus = event.details?.old_status as string | undefined;
      const newStatus = event.details?.new_status as string | undefined;
      const oldLabel = oldStatus ? (ASSET_STATUS_LABELS[oldStatus as AssetStatus] ?? oldStatus) : '?';
      const newLabel = newStatus ? (ASSET_STATUS_LABELS[newStatus as AssetStatus] ?? newStatus) : '?';
      return (
        <span>
          <span className="font-medium">{by}</span> changed status from{' '}
          <span className="font-medium">{oldLabel}</span> to{' '}
          <span className="font-medium">{newLabel}</span>
          {event.photos && event.photos.length > 0 && (
            <PhotoThumbnails photos={event.photos} />
          )}
        </span>
      );
    }

    case 'transfer_initiated': {
      const fromLocation = event.details?.from_location as string | undefined;
      const toLocation = event.details?.to_location as string | undefined;
      const receiver = event.details?.receiver as string | undefined;
      return (
        <span>
          <span className="font-medium">{by}</span> initiated a transfer
          {(fromLocation || toLocation) && (
            <span className="text-muted-foreground">
              {': '}
              {fromLocation ?? '?'} &rarr; {toLocation ?? '?'}
            </span>
          )}
          {receiver && (
            <span className="text-muted-foreground">, Receiver: {receiver}</span>
          )}
          {event.photos && event.photos.length > 0 && (
            <PhotoThumbnails photos={event.photos} />
          )}
        </span>
      );
    }

    case 'transfer_accepted': {
      const receiverName = event.details?.receiver as string | undefined;
      return (
        <span>
          <span className="font-medium">{receiverName ?? by}</span> accepted the transfer
          {event.photos && event.photos.length > 0 && (
            <PhotoThumbnails photos={event.photos} />
          )}
        </span>
      );
    }

    case 'transfer_rejected': {
      const reason = event.details?.reason as string | undefined;
      const receiverName = event.details?.receiver as string | undefined;
      return (
        <span>
          <span className="font-medium">{receiverName ?? by}</span> rejected the transfer
          {reason && (
            <blockquote className="mt-1 border-l-2 border-red-300 dark:border-red-700 pl-3 text-sm text-muted-foreground italic">
              {reason}
            </blockquote>
          )}
          {event.photos && event.photos.length > 0 && (
            <PhotoThumbnails photos={event.photos} />
          )}
        </span>
      );
    }

    case 'transfer_cancelled': {
      const initiatorName = event.details?.initiator as string | undefined;
      return (
        <span>
          <span className="font-medium">{initiatorName ?? by}</span> cancelled the transfer
        </span>
      );
    }

    default:
      return <span>{by} made a change</span>;
  }
}

export function AssetTimeline({
  auditLogs,
  movements,
  conditionPhotos,
  transferPhotos,
}: AssetTimelineProps) {
  // Build lookup maps for photos
  const creationPhotos = conditionPhotos
    .filter((p) => p.entity_type === 'asset_creation')
    .map((p) => ({ id: p.id, url: p.url, fileName: p.fileName }));

  const statusChangePhotos = conditionPhotos
    .filter((p) => p.entity_type === 'asset_status_change')
    .map((p) => ({ id: p.id, url: p.url, fileName: p.fileName }));

  // Build photo lookup by movement ID
  const photosByMovement: Record<string, { send: typeof transferPhotos; receive: typeof transferPhotos; reject: typeof transferPhotos }> = {};
  for (const photo of transferPhotos) {
    if (!photosByMovement[photo.entity_id]) {
      photosByMovement[photo.entity_id] = { send: [], receive: [], reject: [] };
    }
    if (photo.entity_type === 'asset_transfer_send') {
      photosByMovement[photo.entity_id].send.push(photo);
    } else if (photo.entity_type === 'asset_transfer_receive') {
      photosByMovement[photo.entity_id].receive.push(photo);
    } else if (photo.entity_type === 'asset_transfer_reject') {
      photosByMovement[photo.entity_id].reject.push(photo);
    }
  }

  // Process audit logs into timeline events
  const timelineEvents: AssetTimelineEvent[] = [];
  let statusChangePhotoIndex = 0;

  for (const log of auditLogs) {
    const logRecord = log as {
      operation: string;
      performed_at: string;
      user_email: string | null;
      new_data: Record<string, unknown> | null;
      old_data: Record<string, unknown> | null;
      changed_fields: string[] | null;
    };

    const byUser = logRecord.user_email ?? 'System';
    const newData = logRecord.new_data;
    const oldData = logRecord.old_data;
    const changedFields = logRecord.changed_fields ?? [];

    if (logRecord.operation === 'INSERT') {
      timelineEvents.push({
        type: 'created',
        at: logRecord.performed_at,
        by: byUser,
        photos: creationPhotos,
      });
      continue;
    }

    if (logRecord.operation !== 'UPDATE') continue;

    // Check for status change
    if (changedFields.includes('status') && oldData?.status !== newData?.status) {
      const photos = statusChangePhotos.slice(statusChangePhotoIndex, statusChangePhotoIndex + 5);
      statusChangePhotoIndex += photos.length;
      timelineEvents.push({
        type: 'status_changed',
        at: logRecord.performed_at,
        by: byUser,
        details: {
          old_status: oldData?.status,
          new_status: newData?.status,
        },
        photos: photos.map((p) => ({ id: p.id, url: p.url, fileName: p.fileName })),
      });
      continue;
    }

    // Generic field update (excluding status-only changes)
    const nonStatusFields = changedFields.filter((f) => f !== 'status' && f !== 'notes' && f !== 'updated_at');
    if (nonStatusFields.length > 0) {
      timelineEvents.push({
        type: 'field_update',
        at: logRecord.performed_at,
        by: byUser,
        details: { fields: nonStatusFields },
      });
    }
  }

  // Process movements into timeline events
  for (const movement of movements) {
    const movementPhotos = photosByMovement[movement.id];

    // Transfer initiated
    timelineEvents.push({
      type: 'transfer_initiated',
      at: movement.created_at,
      by: movement.initiator?.full_name ?? 'Unknown',
      details: {
        from_location: movement.from_location?.name,
        to_location: movement.to_location?.name,
        receiver: movement.receiver?.full_name,
        initiator: movement.initiator?.full_name,
      },
      photos: (movementPhotos?.send ?? []).map((p) => ({ id: p.id, url: p.url, fileName: p.fileName })),
    });

    if (movement.status === 'accepted' && movement.received_at) {
      timelineEvents.push({
        type: 'transfer_accepted',
        at: movement.received_at,
        by: movement.receiver?.full_name ?? 'Unknown',
        details: {
          receiver: movement.receiver?.full_name,
        },
        photos: (movementPhotos?.receive ?? []).map((p) => ({ id: p.id, url: p.url, fileName: p.fileName })),
      });
    }

    if (movement.status === 'rejected' && movement.rejected_at) {
      timelineEvents.push({
        type: 'transfer_rejected',
        at: movement.rejected_at,
        by: movement.receiver?.full_name ?? 'Unknown',
        details: {
          reason: movement.rejection_reason,
          receiver: movement.receiver?.full_name,
        },
        photos: (movementPhotos?.reject ?? []).map((p) => ({ id: p.id, url: p.url, fileName: p.fileName })),
      });
    }

    if (movement.status === 'cancelled' && movement.cancelled_at) {
      timelineEvents.push({
        type: 'transfer_cancelled',
        at: movement.cancelled_at,
        by: movement.initiator?.full_name ?? 'Unknown',
        details: {
          initiator: movement.initiator?.full_name,
        },
      });
    }
  }

  // Sort all events chronologically
  timelineEvents.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  if (timelineEvents.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No timeline events yet.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[600px]">
      <div className="relative pl-6">
        {/* Vertical connector line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {timelineEvents.map((event, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Icon circle on the line */}
              <div
                className={`absolute -left-6 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${EVENT_COLORS[event.type]}`}
              >
                {EVENT_ICONS[event.type]}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-sm leading-relaxed">
                  <EventContent event={event} />
                </div>
                <p className="text-xs text-muted-foreground">{formatTimestamp(event.at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
