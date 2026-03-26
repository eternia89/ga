import type { Role } from './roles';

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  ga_lead: 'bg-blue-100 text-blue-700',
  ga_staff: 'bg-green-100 text-green-700',
  finance_approver: 'bg-yellow-100 text-yellow-700',
  general_user: 'bg-gray-100 text-gray-700',
};

export const ROLE_DISPLAY: Record<Role, string> = {
  admin: 'Admin',
  ga_lead: 'GA Lead',
  ga_staff: 'GA Staff',
  finance_approver: 'Finance Approver',
  general_user: 'General User',
};
