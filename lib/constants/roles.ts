export const ROLES = {
  GENERAL_USER: 'general_user',
  GA_STAFF: 'ga_staff',
  GA_LEAD: 'ga_lead',
  FINANCE_APPROVER: 'finance_approver',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** GA Staff, GA Lead, Admin -- operational roles that manage assets/jobs */
export const GA_ROLES = [ROLES.GA_STAFF, ROLES.GA_LEAD, ROLES.ADMIN] as const;

/** GA Lead, Admin -- leadership roles with elevated permissions */
export const LEAD_ROLES = [ROLES.GA_LEAD, ROLES.ADMIN] as const;
