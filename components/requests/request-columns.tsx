'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, ClipboardList, XCircle, Ban, ImageIcon, CheckCircle } from 'lucide-react';
import { RequestWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      <span className="font-mono text-xs">{row.getValue('display_id')}</span>
    ),
    size: 130,
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
    size: 56,
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
        <span className="truncate block max-w-[140px]" title={name}>
          {name}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 140,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <RequestStatusBadge status={row.getValue('status')} />,
    size: 110,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => (
      <RequestPriorityBadge priority={row.getValue('priority')} />
    ),
    size: 100,
  },
  {
    id: 'category_name',
    accessorFn: (row) => row.category?.name ?? null,
    header: 'Category',
    cell: ({ row }) => {
      const name = row.original.category?.name;
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
    size: 110,
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => meta?.onView?.(request)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>

            {(canTriage || canReject || canCancel || canAcceptOrRejectWork) && (
              <DropdownMenuSeparator />
            )}

            {canTriage && (
              <DropdownMenuItem onClick={() => meta?.onTriage?.(request)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Triage
              </DropdownMenuItem>
            )}

            {canAcceptOrRejectWork && (
              <>
                <DropdownMenuItem onClick={() => meta?.onAccept?.(request)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  Accept Work
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => meta?.onRejectWork?.(request)}
                  className="text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Work
                </DropdownMenuItem>
              </>
            )}

            {canReject && (
              <DropdownMenuItem
                onClick={() => meta?.onReject?.(request)}
                className="text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </DropdownMenuItem>
            )}

            {canCancel && (
              <DropdownMenuItem
                onClick={() => meta?.onCancel?.(request)}
                className="text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 60,
  },
];
