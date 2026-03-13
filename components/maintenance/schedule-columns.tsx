'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { ScheduleStatusBadge } from './schedule-status-badge';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';

export type ScheduleTableMeta = {
  onView?: (schedule: MaintenanceSchedule) => void;
};

export const scheduleColumns: ColumnDef<MaintenanceSchedule>[] = [
  {
    id: 'template_name',
    accessorFn: (row) => row.template?.name ?? null,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Template" />
    ),
    cell: ({ row, table }) => {
      const name = row.original.template?.name;
      const schedule = row.original;
      const meta = table.options.meta as ScheduleTableMeta | undefined;
      return name ? (
        <button
          type="button"
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-normal break-words text-left"
          title={name}
          onClick={() => meta?.onView?.(schedule)}
        >
          {name}
        </button>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 200,
    meta: { grow: true },
  },
  {
    id: 'asset_name',
    accessorFn: (row) => row.asset?.name ?? null,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Asset" />
    ),
    cell: ({ row }) => {
      const asset = row.original.asset;
      const assetId = row.original.item_id;
      return asset ? (
        <Link
          href={`/inventory/${assetId}`}
          className="whitespace-normal break-words hover:underline"
          title={asset.name}
        >
          <span className="font-medium">{asset.name}</span>
          {asset.display_id && (
            <span className="text-xs text-muted-foreground ml-1">({asset.display_id})</span>
          )}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 200,
  },
  {
    accessorKey: 'interval_days',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Interval" />
    ),
    cell: ({ row }) => {
      const days = row.getValue('interval_days') as number;
      return (
        <span className="tabular-nums">
          {days} {days === 1 ? 'day' : 'days'}
        </span>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'interval_type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('interval_type') as 'fixed' | 'floating';
      return type === 'fixed' ? (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Fixed
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
          Floating
        </span>
      );
    },
    size: 100,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const schedule = row.original;
      return (
        <ScheduleStatusBadge
          schedule={{
            is_active: schedule.is_active,
            is_paused: schedule.is_paused,
            paused_reason: schedule.paused_reason,
          }}
        />
      );
    },
    size: 140,
  },
  {
    accessorKey: 'next_due_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Next Due" />
    ),
    cell: ({ row }) => {
      const schedule = row.original;
      const nextDue = schedule.next_due_at;

      // Show N/A for paused or deactivated
      if (!schedule.is_active || schedule.is_paused) {
        return <span className="text-muted-foreground">N/A</span>;
      }

      if (!nextDue) {
        return <span className="text-muted-foreground">—</span>;
      }

      const dueDate = new Date(nextDue);
      const isOverdue = dueDate < new Date();

      return (
        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
          {format(dueDate, 'dd-MM-yyyy')}
        </span>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'last_completed_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Completed" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('last_completed_at') as string | null;
      return date ? (
        <span>{format(new Date(date), 'dd-MM-yyyy')}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 140,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return <span>{format(new Date(date), 'dd-MM-yyyy')}</span>;
    },
    size: 120,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const schedule = row.original;
      const meta = table.options.meta as ScheduleTableMeta | undefined;

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-sm text-blue-600 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            meta?.onView?.(schedule);
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
