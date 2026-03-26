'use client';

import { JOB_TERMINAL_STATUSES } from '@/lib/constants/job-status';

interface OverdueBadgeProps {
  nextDueAt: string | null;
  jobStatus: string;
}

/**
 * Displays a red "Overdue" badge when:
 * - nextDueAt is in the past (nextDueAt < now)
 * - AND jobStatus is NOT 'completed' or 'cancelled'
 *
 * Per RESEARCH.md: "Overdue = next_due_at < now() with no grace period"
 * Returns null if not overdue.
 */
export function OverdueBadge({ nextDueAt, jobStatus }: OverdueBadgeProps) {
  if (!nextDueAt) return null;
  if ((JOB_TERMINAL_STATUSES as readonly string[]).includes(jobStatus)) return null;

  const isOverdue = new Date(nextDueAt) < new Date();
  if (!isOverdue) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
      Overdue
    </span>
  );
}
