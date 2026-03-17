'use client';

import { Truck } from 'lucide-react';
import { AssetStatus, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS } from '@/lib/constants/asset-status';

interface AssetStatusBadgeProps {
  status: AssetStatus;
  clickable?: boolean;
  showInTransit?: boolean;
}

export function AssetStatusBadge({
  status,
  clickable = false,
  showInTransit = false,
}: AssetStatusBadgeProps) {
  const label = ASSET_STATUS_LABELS[status] ?? status;
  const colorClass = ASSET_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <span className="inline-flex items-center gap-1.5">
      {showInTransit ? (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          <Truck className="h-3 w-3" />
          In Transit
        </span>
      ) : (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass} ${
            clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
          }`}
        >
          {label}
        </span>
      )}
    </span>
  );
}
