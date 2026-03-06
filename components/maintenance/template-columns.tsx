'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { MaintenanceTemplate } from '@/lib/types/maintenance';

export type TemplateTableMeta = {
  onView?: (template: MaintenanceTemplate) => void;
};

export const templateColumns: ColumnDef<MaintenanceTemplate>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row, table }) => {
      const name = row.getValue('name') as string;
      const template = row.original;
      const meta = table.options.meta as TemplateTableMeta | undefined;
      return (
        <button
          type="button"
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline max-w-[260px] truncate block text-left"
          title={name}
          onClick={() => meta?.onView?.(template)}
        >
          {name}
        </button>
      );
    },
    size: 260,
  },
  {
    id: 'category_name',
    accessorFn: (row) => row.category?.name ?? null,
    header: 'Category',
    cell: ({ row }) => {
      const name = row.original.category?.name;
      return name ? (
        <span className="truncate block max-w-[160px]" title={name}>
          {name}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 160,
  },
  {
    id: 'item_count',
    accessorFn: (row) => row.item_count ?? row.checklist?.length ?? 0,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Items" />
    ),
    cell: ({ row }) => {
      const count = row.original.item_count ?? row.original.checklist?.length ?? 0;
      return (
        <span className="text-muted-foreground tabular-nums">{count}</span>
      );
    },
    size: 80,
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
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean;
      return isActive ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          Active
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          Inactive
        </span>
      );
    },
    size: 100,
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const template = row.original;
      const meta = table.options.meta as TemplateTableMeta | undefined;

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-sm text-blue-600 hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            meta?.onView?.(template);
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
