'use client';

import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '@/lib/constants/job-status';

interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const label = JOB_STATUS_LABELS[status] ?? status;
  const colorClass = JOB_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
