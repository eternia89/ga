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
  submitted: 'bg-gray-100 text-gray-700',
  triaged: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  pending_approval: 'bg-purple-100 text-purple-700',
  approved: 'bg-teal-100 text-teal-700',
  completed: 'bg-green-100 text-green-700',
  pending_acceptance: 'bg-violet-100 text-violet-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-stone-100 text-stone-600',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
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
