'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ImageIcon } from 'lucide-react';
import { InventoryItemWithRelations } from '@/lib/types/database';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { AssetStatusBadge } from './asset-status-badge';

export interface PendingTransfer {
  id: string;
  to_location: { name: string } | null;
  receiver_id: string | null;
}

interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}

export type AssetTableMeta = {
  onView?: (asset: InventoryItemWithRelations) => void;
  onTransfer?: (asset: InventoryItemWithRelations) => void;
  onChangeStatus?: (asset: InventoryItemWithRelations) => void;
  pendingTransfers?: Record<string, PendingTransfer>;
  currentUserRole?: string;
  photosByAsset?: Record<string, PhotoItem[]>;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
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
    id: 'photo',
    header: '',
    cell: ({ row, table }) => {
      const meta = table.options.meta as AssetTableMeta | undefined;
      const photos = meta?.photosByAsset?.[row.original.id] ?? [];

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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      return (
        <span className="whitespace-normal break-words font-medium" title={name}>
          {name}
        </span>
      );
    },
    size: 200,
    meta: { grow: true },
  },
  {
    id: 'category_name',
    accessorFn: (row) => row.category?.name ?? null,
    header: 'Category',
    cell: ({ row }) => {
      const name = row.original.category?.name;
      return name ? (
        <span className="whitespace-normal break-words" title={name}>
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
    cell: ({ row }) => {
      const locationName = row.original.location?.name;

      return locationName ? (
        <span className="whitespace-normal break-words" title={locationName}>
          {locationName}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
    size: 160,
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
    cell: ({ row, table }) => {
      const asset = row.original;
      const meta = table.options.meta as AssetTableMeta | undefined;
      const canChangeStatus =
        meta?.currentUserRole &&
        ['ga_staff', 'ga_lead', 'admin'].includes(meta.currentUserRole) &&
        asset.status !== 'sold_disposed' &&
        !meta?.pendingTransfers?.[row.original.id];

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-sm text-blue-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              meta?.onView?.(asset);
            }}
          >
            View
          </Button>
          {canChangeStatus && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-sm text-blue-600 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                meta?.onChangeStatus?.(asset);
              }}
            >
              Change Status
            </Button>
          )}
        </div>
      );
    },
    size: 160,
    enableSorting: false,
  },
];
