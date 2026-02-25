'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import Link from 'next/link';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { ScheduleStatusBadge } from './schedule-status-badge';
import type { MaintenanceSchedule } from '@/lib/types/maintenance';

export type ScheduleTableMeta = {
  onDeactivate?: (id: string) => void;
  onActivate?: (id: string) => void;
  onDelete?: (id: string) => void;
  currentUserRole?: string;
};

export const scheduleColumns: ColumnDef<MaintenanceSchedule>[] = [
  {
    id: 'template_name',
    accessorFn: (row) => row.template?.name ?? null,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Template" />
    ),
    cell: ({ row }) => {
      const name = row.original.template?.name;
      const templateId = row.original.template_id;
      return name ? (
        <Link
          href={`/maintenance/templates/${templateId}`}
          className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline max-w-[200px] truncate block"
          title={name}
        >
          {name}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 200,
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
          className="max-w-[200px] truncate block hover:underline"
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
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          Fixed
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
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
        <span className={isOverdue ? 'text-red-600 font-medium dark:text-red-400' : ''}>
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
    id: 'actions',
    cell: ({ row, table }) => {
      const schedule = row.original;
      const meta = table.options.meta as ScheduleTableMeta | undefined;
      const canManage = ['ga_lead', 'admin'].includes(meta?.currentUserRole ?? '');

      if (!canManage) return null;

      return (
        <div className="flex items-center gap-2">
          {schedule.is_active ? (
            <button
              type="button"
              onClick={() => meta?.onDeactivate?.(schedule.id)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={() => meta?.onActivate?.(schedule.id)}
              className="text-xs text-muted-foreground hover:text-green-600 transition-colors"
            >
              Activate
            </button>
          )}
          <button
            type="button"
            onClick={() => meta?.onDelete?.(schedule.id)}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Delete
          </button>
        </div>
      );
    },
    size: 120,
    enableSorting: false,
  },
];
