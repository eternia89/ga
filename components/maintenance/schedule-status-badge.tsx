'use client';

import {
  getScheduleDisplayStatus,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_COLORS,
} from '@/lib/constants/schedule-status';

interface ScheduleStatusBadgeProps {
  schedule: {
    is_active: boolean;
    is_paused: boolean;
    paused_reason: string | null;
  };
}

export function ScheduleStatusBadge({ schedule }: ScheduleStatusBadgeProps) {
  const status = getScheduleDisplayStatus(schedule);
  const label = SCHEDULE_STATUS_LABELS[status];
  const colorClass = SCHEDULE_STATUS_COLORS[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
