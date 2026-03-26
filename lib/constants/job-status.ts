// Job status labels (DB value → user-facing display label)
export const JOB_STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending_approval: 'Pending Approval',
  pending_completion_approval: 'Pending Completion Approval',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Job status badge color classes (Tailwind)
export const JOB_STATUS_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  pending_approval: 'bg-violet-100 text-violet-700',
  pending_completion_approval: 'bg-violet-100 text-violet-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-stone-100 text-stone-600',
};

// All possible DB status values for jobs
export const JOB_STATUSES = [
  'created',
  'assigned',
  'in_progress',
  'pending_approval',
  'pending_completion_approval',
  'completed',
  'cancelled',
] as const;

export type JobStatus = typeof JOB_STATUSES[number];

// Semantic status subsets
export const JOB_TERMINAL_STATUSES = ['completed', 'cancelled'] as const;
export const JOB_ACTIVE_STATUSES = ['assigned', 'in_progress'] as const;
export const JOB_OPEN_STATUSES = ['created', 'assigned', 'in_progress'] as const;

// Re-export priority constants from request-status.ts (shared between requests and jobs)
export { PRIORITIES, PRIORITY_LABELS, PRIORITY_COLORS } from './request-status';
export type { Priority } from './request-status';
