// Approval type badge colors (budget vs completion approval)
export const APPROVAL_TYPE_COLORS: Record<string, string> = {
  budget: 'bg-violet-100 text-violet-700',
  completion: 'bg-orange-100 text-orange-700',
};

// Approval decision badge colors
export const APPROVAL_DECISION_COLORS: Record<string, string> = {
  pending: 'bg-violet-100 text-violet-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

// Canonical Tailwind class for the PM (Preventive Maintenance) job type badge
export const PM_BADGE_CLASS =
  'inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700';

// Canonical labels for approval types and decisions
export const APPROVAL_TYPE_LABELS: Record<string, string> = {
  budget: 'Budget',
  completion: 'Completion',
};

export const APPROVAL_DECISION_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};
