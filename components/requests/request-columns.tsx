'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, ClipboardList, XCircle, Ban } from 'lucide-react';
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

export type RequestTableMeta = {
  onTriage?: (request: RequestWithRelations) => void;
  onReject?: (request: RequestWithRelations) => void;
  onCancel?: (request: RequestWithRelations) => void;
  onView?: (request: RequestWithRelations) => void;
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

      const canTriage = isGaLeadOrAdmin && request.status === 'submitted';
      const canReject =
        isGaLeadOrAdmin &&
        (request.status === 'submitted' || request.status === 'triaged');
      const canCancel = isRequester && request.status === 'submitted';

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

            {(canTriage || canReject || canCancel) && (
              <DropdownMenuSeparator />
            )}

            {canTriage && (
              <DropdownMenuItem onClick={() => meta?.onTriage?.(request)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Triage
              </DropdownMenuItem>
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
