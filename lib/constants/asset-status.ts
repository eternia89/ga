// All possible asset status DB values
export const ASSET_STATUSES = ['active', 'under_repair', 'broken', 'sold_disposed'] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];

// User-facing labels for asset statuses
export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  active: 'Active',
  under_repair: 'Under Repair',
  broken: 'Broken',
  sold_disposed: 'Sold/Disposed',
};

// Badge color classes (Tailwind) for each status
export const ASSET_STATUS_COLORS: Record<AssetStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  under_repair: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  broken: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  sold_disposed: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

// Valid transitions from each status.
// sold_disposed is a terminal state — no transitions allowed.
export const ASSET_STATUS_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  active: ['under_repair', 'broken', 'sold_disposed'],
  under_repair: ['active', 'broken', 'sold_disposed'],
  broken: ['active', 'under_repair', 'sold_disposed'],
  sold_disposed: [],
};

// All possible movement status DB values
export const MOVEMENT_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled'] as const;
export type MovementStatus = typeof MOVEMENT_STATUSES[number];

// User-facing labels for movement statuses
export const MOVEMENT_STATUS_LABELS: Record<MovementStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};
