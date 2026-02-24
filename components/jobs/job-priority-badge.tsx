'use client';

import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants/job-status';

interface JobPriorityBadgeProps {
  priority: string | null | undefined;
}

export function JobPriorityBadge({ priority }: JobPriorityBadgeProps) {
  if (!priority) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const label = PRIORITY_LABELS[priority] ?? priority;
  const colorClass = PRIORITY_COLORS[priority] ?? 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
}
