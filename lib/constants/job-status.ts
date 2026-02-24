// Job status labels (DB value → user-facing display label)
export const JOB_STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending_approval: 'Pending Approval',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Job status badge color classes (Tailwind)
export const JOB_STATUS_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  pending_approval: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

// All possible DB status values for jobs
export const JOB_STATUSES = [
  'created',
  'assigned',
  'in_progress',
  'pending_approval',
  'completed',
  'cancelled',
] as const;

export type JobStatus = typeof JOB_STATUSES[number];

// Re-export priority constants from request-status.ts (shared between requests and jobs)
export { PRIORITIES, PRIORITY_LABELS, PRIORITY_COLORS } from './request-status';
export type { Priority } from './request-status';
