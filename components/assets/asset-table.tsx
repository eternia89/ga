'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { InventoryItemWithRelations } from '@/lib/types/database';
import { DataTable } from '@/components/data-table/data-table';
import { assetColumns, PendingTransfer } from './asset-columns';
import { AssetFilters, filterParsers } from './asset-filters';

interface AssetTableProps {
  data: InventoryItemWithRelations[];
  pendingTransfers: Record<string, PendingTransfer>;
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  currentUserRole: string;
}

export function AssetTable({
  data,
  pendingTransfers,
  categories,
  locations,
  currentUserRole,
}: AssetTableProps) {
  const router = useRouter();
  const [filters] = useQueryStates(filterParsers);

  // Client-side filtering based on URL params
  const filteredData = useMemo(() => {
    return data.filter((asset) => {
      // Status filter — handle virtual "in_transit_virtual" value
      if (filters.status) {
        if (filters.status === 'in_transit_virtual') {
          // Only show assets with pending transfer
          if (!pendingTransfers[asset.id]) return false;
        } else {
          if (asset.status !== filters.status) return false;
        }
      }

      // Category filter
      if (filters.category_id && asset.category_id !== filters.category_id) return false;

      // Location filter
      if (filters.location_id && asset.location_id !== filters.location_id) return false;

      // In transit filter
      if (filters.in_transit === 'true' && !pendingTransfers[asset.id]) return false;

      // Search filter — matches display_id, name, brand, model, serial_number
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const matchesDisplayId = asset.display_id.toLowerCase().includes(q);
        const matchesName = asset.name.toLowerCase().includes(q);
        const matchesBrand = asset.brand?.toLowerCase().includes(q) ?? false;
        const matchesModel = asset.model?.toLowerCase().includes(q) ?? false;
        const matchesSerial = asset.serial_number?.toLowerCase().includes(q) ?? false;
        if (!matchesDisplayId && !matchesName && !matchesBrand && !matchesModel && !matchesSerial) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters, pendingTransfers]);

  const handleView = (asset: InventoryItemWithRelations) => {
    router.push(`/inventory/${asset.id}`);
  };

  const handleEdit = (asset: InventoryItemWithRelations) => {
    router.push(`/inventory/${asset.id}?edit=true`);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <AssetFilters categories={categories} locations={locations} />

      <DataTable
        columns={assetColumns}
        data={filteredData}
        emptyMessage="No assets found"
        meta={{
          onView: handleView,
          onEdit: handleEdit,
          pendingTransfers,
          currentUserRole,
        }}
      />
    </div>
  );
}
