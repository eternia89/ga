'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { InventoryItemWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { AssetStatusBadge } from './asset-status-badge';

export interface PendingTransfer {
  id: string;
  to_location: { name: string } | null;
  receiver_id: string | null;
}

export type AssetTableMeta = {
  onView?: (asset: InventoryItemWithRelations) => void;
  pendingTransfers?: Record<string, PendingTransfer>;
  currentUserRole?: string;
};

export const assetColumns: ColumnDef<InventoryItemWithRelations>[] = [
  {
    accessorKey: 'display_id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue('display_id')}</span>
    ),
    size: 140,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return (
        <span className="max-w-[200px] truncate block font-medium" title={name}>
          {name}
        </span>
      );
    },
    size: 200,
  },
  {
    id: 'category_name',
    accessorFn: (row) => row.category?.name ?? null,
    header: 'Category',
    cell: ({ row }) => {
      const name = row.original.category?.name;
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
    id: 'location_name',
    accessorFn: (row) => row.location?.name ?? null,
    header: 'Location',
    cell: ({ row, table }) => {
      const meta = table.options.meta as AssetTableMeta | undefined;
      const pendingTransfer = meta?.pendingTransfers?.[row.original.id];
      const locationName = row.original.location?.name;

      return (
        <div className="flex items-center gap-1.5">
          {locationName ? (
            <span className="truncate max-w-[120px]" title={locationName}>
              {locationName}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {pendingTransfer && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 shrink-0"
              title={`In Transit to ${pendingTransfer.to_location?.name ?? 'unknown'}`}
            >
              Transit
            </span>
          )}
        </div>
      );
    },
    size: 160,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row, table }) => {
      const meta = table.options.meta as AssetTableMeta | undefined;
      const pendingTransfer = meta?.pendingTransfers?.[row.original.id];
      return (
        <AssetStatusBadge
          status={row.getValue('status')}
          showInTransit={!!pendingTransfer}
        />
      );
    },
    size: 140,
  },
  {
    accessorKey: 'warranty_expiry',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Warranty Expiry" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('warranty_expiry') as string | null;
      if (!date) return <span className="text-muted-foreground">—</span>;
      return <span>{format(new Date(date), 'dd-MM-yyyy')}</span>;
    },
    size: 130,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => {
      const asset = row.original;
      const meta = table.options.meta as AssetTableMeta | undefined;

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => meta?.onView?.(asset)}
          >
            View
          </Button>
        </div>
      );
    },
    size: 120,
    enableSorting: false,
  },
];
