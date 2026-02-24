// DB status values and their user-facing labels
export const STATUS_LABELS: Record<string, string> = {
  submitted: 'New',
  triaged: 'Triaged',
  in_progress: 'In Progress',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  completed: 'Completed',
  pending_acceptance: 'Pending Acceptance',
  accepted: 'Accepted',
  closed: 'Closed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

// Status badge color classes (Tailwind)
export const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  triaged: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  pending_approval: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  approved: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  pending_acceptance: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  cancelled: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

// All possible DB status values
export const REQUEST_STATUSES = [
  'submitted',
  'triaged',
  'in_progress',
  'pending_approval',
  'approved',
  'completed',
  'pending_acceptance',
  'accepted',
  'closed',
  'rejected',
  'cancelled',
] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type Priority = typeof PRIORITIES[number];
