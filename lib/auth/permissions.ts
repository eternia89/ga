import type { Role, Permission } from './types';

// Comprehensive permission definitions using resource:action naming
export const PERMISSIONS = {
  // User management (Phase 3)
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DEACTIVATE: 'user:deactivate',

  // Company/Division/Location/Category management (Phase 3)
  COMPANY_MANAGE: 'company:manage',
  DIVISION_MANAGE: 'division:manage',
  LOCATION_MANAGE: 'location:manage',
  CATEGORY_MANAGE: 'category:manage',

  // Request management (Phase 4)
  REQUEST_VIEW_ALL: 'request:view:all',       // Company-wide read (all roles per user decision)
  REQUEST_CREATE: 'request:create',            // Create requests (division-scoped for general_user)
  REQUEST_EDIT_OWN: 'request:edit:own',        // Edit own requests
  REQUEST_TRIAGE: 'request:triage',            // Assign category, priority, PIC

  // Job management (Phase 5)
  JOB_VIEW_ALL: 'job:view:all',
  JOB_CREATE: 'job:create',
  JOB_ASSIGN: 'job:assign',
  JOB_UPDATE_STATUS: 'job:update_status',
  JOB_COMMENT: 'job:comment',

  // Approval (Phase 5)
  APPROVAL_VIEW: 'approval:view',
  APPROVAL_DECIDE: 'approval:decide',          // Approve/reject

  // Inventory (Phase 6)
  ASSETS_VIEW_ALL: 'inventory:view:all',
  INVENTORY_MANAGE: 'inventory:manage',
  INVENTORY_TRANSFER: 'inventory:transfer',

  // Maintenance (Phase 7)
  MAINTENANCE_VIEW_ALL: 'maintenance:view:all',
  MAINTENANCE_MANAGE: 'maintenance:manage',

  // Dashboard (Phase 8)
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_EXPORT: 'dashboard:export',

  // Admin (Phase 3+)
  ADMIN_PANEL: 'admin:panel',                  // Access admin section
  AUDIT_VIEW: 'audit:view',                    // View audit logs (Phase 9)
} as const;

// Role-to-permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  general_user: [
    PERMISSIONS.REQUEST_VIEW_ALL,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.REQUEST_EDIT_OWN,
    PERMISSIONS.JOB_VIEW_ALL,
    PERMISSIONS.JOB_COMMENT,
    PERMISSIONS.ASSETS_VIEW_ALL,
    PERMISSIONS.MAINTENANCE_VIEW_ALL,
    PERMISSIONS.DASHBOARD_VIEW,
  ],

  ga_staff: [
    // All general_user permissions
    PERMISSIONS.REQUEST_VIEW_ALL,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.REQUEST_EDIT_OWN,
    PERMISSIONS.JOB_VIEW_ALL,
    PERMISSIONS.JOB_COMMENT,
    PERMISSIONS.ASSETS_VIEW_ALL,
    PERMISSIONS.MAINTENANCE_VIEW_ALL,
    PERMISSIONS.DASHBOARD_VIEW,
    // Additional permissions
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_ASSIGN,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_TRANSFER,
  ],

  ga_lead: [
    // All ga_staff permissions
    PERMISSIONS.REQUEST_VIEW_ALL,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.REQUEST_EDIT_OWN,
    PERMISSIONS.JOB_VIEW_ALL,
    PERMISSIONS.JOB_COMMENT,
    PERMISSIONS.ASSETS_VIEW_ALL,
    PERMISSIONS.MAINTENANCE_VIEW_ALL,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.JOB_UPDATE_STATUS,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.INVENTORY_TRANSFER,
    // Additional permissions
    PERMISSIONS.REQUEST_TRIAGE,
    PERMISSIONS.JOB_CREATE,
    PERMISSIONS.JOB_ASSIGN,
    PERMISSIONS.MAINTENANCE_MANAGE,
    PERMISSIONS.DASHBOARD_EXPORT,
    PERMISSIONS.AUDIT_VIEW,
  ],

  finance_approver: [
    PERMISSIONS.REQUEST_VIEW_ALL,
    PERMISSIONS.JOB_VIEW_ALL,
    PERMISSIONS.APPROVAL_VIEW,
    PERMISSIONS.APPROVAL_DECIDE,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_EXPORT,
    PERMISSIONS.ASSETS_VIEW_ALL,
    PERMISSIONS.MAINTENANCE_VIEW_ALL,
  ],

  admin: Object.values(PERMISSIONS) as Permission[],
};

// Helper: Check if a role has a specific permission
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Helper: Check if a role has any of the provided permissions
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Helper: Check if a role can access a specific route
export function canAccessRoute(role: Role, pathname: string): boolean {
  // Route prefix to required permission mapping
  const routePermissions: Record<string, Permission> = {
    '/admin': PERMISSIONS.ADMIN_PANEL,
    '/requests/new': PERMISSIONS.REQUEST_CREATE,
    '/requests': PERMISSIONS.REQUEST_VIEW_ALL,
    '/jobs': PERMISSIONS.JOB_VIEW_ALL,
    '/inventory': PERMISSIONS.ASSETS_VIEW_ALL,
    '/maintenance': PERMISSIONS.MAINTENANCE_VIEW_ALL,
    '/approvals': PERMISSIONS.APPROVAL_VIEW,
  };

  // Dashboard root - all roles have access
  if (pathname === '/') {
    return hasPermission(role, PERMISSIONS.DASHBOARD_VIEW);
  }

  // Check each route prefix
  for (const [prefix, permission] of Object.entries(routePermissions)) {
    if (pathname.startsWith(prefix)) {
      return hasPermission(role, permission);
    }
  }

  // Unknown routes: allow (permissive default, middleware handles auth)
  return true;
}
