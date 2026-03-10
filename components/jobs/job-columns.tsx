'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { JobWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { JobStatusBadge } from './job-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { OverdueBadge } from '@/components/maintenance/overdue-badge';

export type JobTableMeta = {
  onView?: (job: JobWithRelations) => void;
};

export const jobColumns: ColumnDef<JobWithRelations>[] = [
  {
    accessorKey: 'display_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs">{row.getValue('display_id')}</span>
        <JobStatusBadge status={row.original.status} />
      </div>
    ),
    size: 200,
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
        <div className="space-y-0.5">
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
    size: 220,
    meta: { grow: true },
  },
  {
    id: 'pic_name',
    accessorFn: (row) => row.pic?.full_name ?? null,
    header: 'PIC',
    cell: ({ row }) => {
      const name = row.original.pic?.full_name;
      return name ? (
        <span className="truncate block max-w-[120px]" title={name}>
          {name}
        </span>
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => <PriorityBadge priority={row.getValue('priority')} />,
    size: 90,
  },
  {
    id: 'linked_request',
    header: 'Linked Requests',
    cell: ({ row }) => {
      const jobRequests = row.original.job_requests;
      if (!jobRequests?.length) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <div className="flex flex-col gap-0.5">
          {jobRequests.map((jr) => (
            <Link
              key={jr.request.id}
              href={`/requests/${jr.request.id}`}
              className="font-mono text-xs hover:underline text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {jr.request.display_id}
            </Link>
          ))}
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
    size: 100,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const job = row.original;
      const meta = table.options.meta as JobTableMeta | undefined;

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-sm text-blue-600 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            meta?.onView?.(job);
          }}
        >
          View
        </Button>
      );
    },
    size: 80,
    enableSorting: false,
  },
];
