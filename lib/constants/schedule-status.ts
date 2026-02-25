import type { ScheduleDisplayStatus } from '@/lib/types/maintenance';

// ============================================================================
// getScheduleDisplayStatus
// Derives display status from DB fields (Pattern 2 from RESEARCH.md).
// Convention: paused_reason starting with 'auto:' = auto-pause by system.
// Logic:
//   !is_active         -> 'deactivated'
//   is_paused + 'auto:' prefix -> 'paused_auto'
//   is_paused (manual) -> 'paused_manual'
//   else               -> 'active'
// ============================================================================

export function getScheduleDisplayStatus(schedule: {
  is_active: boolean;
  is_paused: boolean;
  paused_reason: string | null;
}): ScheduleDisplayStatus {
  if (!schedule.is_active) return 'deactivated';
  if (schedule.is_paused && schedule.paused_reason?.startsWith('auto:')) return 'paused_auto';
  if (schedule.is_paused) return 'paused_manual';
  return 'active';
}

// ============================================================================
// SCHEDULE_STATUS_LABELS
// Human-readable labels for each schedule display status
// ============================================================================

export const SCHEDULE_STATUS_LABELS: Record<ScheduleDisplayStatus, string> = {
  active:         'Active',
  paused_auto:    'Paused (auto)',
  paused_manual:  'Paused (manual)',
  deactivated:    'Deactivated',
};

// ============================================================================
// SCHEDULE_STATUS_COLORS
// Tailwind badge color classes for each schedule display status
// ============================================================================

export const SCHEDULE_STATUS_COLORS: Record<ScheduleDisplayStatus, string> = {
  active:         'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  paused_auto:    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  paused_manual:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  deactivated:    'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};
