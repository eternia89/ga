'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ImageIcon } from 'lucide-react';
import { JobWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { JobStatusBadge } from './job-status-badge';
import { PriorityBadge } from '@/components/priority-badge';
import { OverdueBadge } from '@/components/maintenance/overdue-badge';
import { PM_BADGE_CLASS } from '@/lib/constants/approval-status';

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

export type JobTableMeta = {
  onView?: (job: JobWithRelations) => void;
  photosByJob?: Record<string, PhotoItem[]>;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
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
    size: 160,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <JobStatusBadge status={row.getValue('status') as string} />
    ),
    size: 150,
    enableSorting: false,
  },
  {
    id: 'photo',
    header: '',
    cell: ({ row, table }) => {
      const meta = table.options.meta as JobTableMeta | undefined;
      const photos = meta?.photosByJob?.[row.original.id] ?? [];

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
      const job = row.original;
      const isPM = job.job_type === 'preventive_maintenance';
      const nextDueAt = job.maintenance_schedule?.next_due_at ?? null;
      return (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isPM && (
              <span className={`${PM_BADGE_CLASS} shrink-0`}>
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
    id: 'location_name',
    accessorFn: (row) => row.location?.name ?? null,
    header: 'Location',
    cell: ({ row }) => {
      const name = row.original.location?.name;
      return name ? (
        <span className="truncate block max-w-[130px]" title={name}>{name}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 130,
    enableSorting: false,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => <PriorityBadge priority={row.getValue('priority')} />,
    size: 90,
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
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      const creatorName = row.original.created_by_user?.full_name;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{format(new Date(date), 'dd-MM-yyyy')}</span>
          {creatorName && (
            <span className="text-xs text-muted-foreground">by {creatorName}</span>
          )}
        </div>
      );
    },
    size: 130,
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
