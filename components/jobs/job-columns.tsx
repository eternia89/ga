'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Pencil, XCircle } from 'lucide-react';
import Link from 'next/link';
import { JobWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { JobStatusBadge } from './job-status-badge';
import { JobPriorityBadge } from './job-priority-badge';
import { OverdueBadge } from '@/components/maintenance/overdue-badge';

export type JobTableMeta = {
  onView?: (job: JobWithRelations) => void;
  onEdit?: (job: JobWithRelations) => void;
  onCancel?: (job: JobWithRelations) => void;
  currentUserId?: string;
  currentUserRole?: string;
};

export const jobColumns: ColumnDef<JobWithRelations>[] = [
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
      const job = row.original;
      const isPM = job.job_type === 'preventive_maintenance';
      const nextDueAt = job.maintenance_schedule?.next_due_at ?? null;
      return (
        <div className="space-y-0.5 max-w-[240px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isPM && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 shrink-0">
                PM
              </span>
            )}
            {isPM && (
              <OverdueBadge nextDueAt={nextDueAt} jobStatus={job.status} />
            )}
          </div>
          <span className="truncate block text-sm" title={title}>
            {title}
          </span>
        </div>
      );
    },
    size: 240,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <JobStatusBadge status={row.getValue('status')} />,
    size: 130,
  },
  {
    id: 'pic_name',
    accessorFn: (row) => row.pic?.full_name ?? null,
    header: 'PIC',
    cell: ({ row }) => {
      const name = row.original.pic?.full_name;
      return name ? (
        <span className="truncate block max-w-[130px]" title={name}>
          {name}
        </span>
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      );
    },
    size: 130,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => <JobPriorityBadge priority={row.getValue('priority')} />,
    size: 100,
  },
  {
    id: 'linked_request',
    header: 'Linked Request',
    cell: ({ row }) => {
      const jobRequests = row.original.job_requests;
      const firstRequest = jobRequests?.[0]?.request;
      if (!firstRequest) {
        return <span className="text-muted-foreground">—</span>;
      }
      const moreCount = (jobRequests?.length ?? 1) - 1;
      return (
        <div className="flex items-center gap-1">
          <Link
            href={`/requests/${firstRequest.id}`}
            className="font-mono text-xs hover:underline text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {firstRequest.display_id}
          </Link>
          {moreCount > 0 && (
            <span className="text-xs text-muted-foreground">+{moreCount}</span>
          )}
        </div>
      );
    },
    size: 130,
    enableSorting: false,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return <span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>;
    },
    size: 110,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const job = row.original;
      const meta = table.options.meta as JobTableMeta | undefined;
      const currentUserRole = meta?.currentUserRole;

      const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole ?? '');
      const canCancel = isGaLeadOrAdmin && job.status !== 'completed' && job.status !== 'cancelled';

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => meta?.onView?.(job)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>

            {isGaLeadOrAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => meta?.onEdit?.(job)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </>
            )}

            {canCancel && (
              <>
                {!isGaLeadOrAdmin && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => meta?.onCancel?.(job)}
                  className="text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 60,
  },
];
