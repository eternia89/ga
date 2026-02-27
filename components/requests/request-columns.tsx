'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, ClipboardList, XCircle, Ban, ImageIcon, CheckCircle } from 'lucide-react';
import { RequestWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { RequestStatusBadge } from './request-status-badge';
import { RequestPriorityBadge } from './request-priority-badge';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

export type RequestTableMeta = {
  onTriage?: (request: RequestWithRelations) => void;
  onReject?: (request: RequestWithRelations) => void;
  onCancel?: (request: RequestWithRelations) => void;
  onView?: (request: RequestWithRelations) => void;
  onAccept?: (request: RequestWithRelations) => void;
  onRejectWork?: (request: RequestWithRelations) => void;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
  photosByRequest?: Record<string, PhotoItem[]>;
  currentUserId?: string;
  currentUserRole?: string;
};

export const requestColumns: ColumnDef<RequestWithRelations>[] = [
  {
    accessorKey: 'display_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs">{row.getValue('display_id')}</span>
        <RequestStatusBadge status={row.original.status} />
      </div>
    ),
    size: 200,
  },
  {
    id: 'photo',
    header: '',
    cell: ({ row, table }) => {
      const meta = table.options.meta as RequestTableMeta | undefined;
      const photos = meta?.photosByRequest?.[row.original.id] ?? [];

      if (photos.length === 0) {
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-dashed border-muted-foreground/25">
            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
          </div>
        );
      }

      return (
        <button
          type="button"
          className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-border hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            meta?.onPhotoClick?.(photos, 0);
          }}
          aria-label={`View ${photos.length} photo${photos.length > 1 ? 's' : ''}`}
        >
          <img
            src={photos[0].url}
            alt={photos[0].fileName}
            className="h-full w-full object-cover"
          />
          {photos.length > 1 && (
            <span className="absolute bottom-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-tl bg-black/70 px-0.5 text-[10px] font-medium text-white">
              {photos.length}
            </span>
          )}
        </button>
      );
    },
    size: 50,
    enableSorting: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => {
      const title = row.getValue('title') as string;
      return (
        <span
          className="max-w-[200px] truncate block"
          title={title}
        >
          {title}
        </span>
      );
    },
    size: 200,
  },
  {
    id: 'location_name',
    accessorFn: (row) => row.location?.name ?? null,
    header: 'Location',
    cell: ({ row }) => {
      const name = row.original.location?.name;
      return name ? (
        <span className="truncate block max-w-[130px]" title={name}>
          {name}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 130,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => (
      <RequestPriorityBadge priority={row.getValue('priority')} />
    ),
    size: 90,
  },
  {
    id: 'assigned_user_name',
    accessorFn: (row) => row.assigned_user?.name ?? null,
    header: 'PIC',
    cell: ({ row }) => {
      const name = row.original.assigned_user?.name;
      return name ? (
        <span className="truncate block max-w-[120px]" title={name}>
          {name}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return format(new Date(date), 'dd-MM-yyyy');
    },
    size: 100,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const request = row.original;
      const meta = table.options.meta as RequestTableMeta | undefined;
      const currentUserId = meta?.currentUserId;
      const currentUserRole = meta?.currentUserRole;

      const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole ?? '');
      const isRequester = request.requester_id === currentUserId;
      const isAdmin = currentUserRole === 'admin';

      const canTriage = isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request.status);
      const canReject =
        isGaLeadOrAdmin &&
        (request.status === 'submitted' || request.status === 'triaged');
      const canCancel = isRequester && request.status === 'submitted';
      const canAcceptOrRejectWork =
        (isRequester || isAdmin) && request.status === 'pending_acceptance';

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="View Details"
            onClick={(e) => {
              e.stopPropagation();
              meta?.onView?.(request);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          {canTriage && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Triage"
              onClick={(e) => {
                e.stopPropagation();
                meta?.onTriage?.(request);
              }}
            >
              <ClipboardList className="h-3.5 w-3.5" />
            </Button>
          )}

          {canAcceptOrRejectWork && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700"
                title="Accept Work"
                onClick={(e) => {
                  e.stopPropagation();
                  meta?.onAccept?.(request);
                }}
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                title="Reject Work"
                onClick={(e) => {
                  e.stopPropagation();
                  meta?.onRejectWork?.(request);
                }}
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {canReject && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              title="Reject"
              onClick={(e) => {
                e.stopPropagation();
                meta?.onReject?.(request);
              }}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}

          {canCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              title="Cancel"
              onClick={(e) => {
                e.stopPropagation();
                meta?.onCancel?.(request);
              }}
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      );
    },
    size: 120,
  },
];
