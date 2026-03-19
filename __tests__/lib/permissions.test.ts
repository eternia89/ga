import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  canAccessRoute,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from '@/lib/auth/permissions';

describe('hasPermission', () => {
  it('admin has all permissions', () => {
    // Admin role has every permission defined in PERMISSIONS
    for (const permission of Object.values(PERMISSIONS)) {
      expect(hasPermission('admin', permission)).toBe(true);
    }
  });

  it('general_user has REQUEST_VIEW_ALL but not REQUEST_TRIAGE', () => {
    expect(hasPermission('general_user', PERMISSIONS.REQUEST_VIEW_ALL)).toBe(true);
    expect(hasPermission('general_user', PERMISSIONS.REQUEST_TRIAGE)).toBe(false);
  });

  it('ga_lead has AUDIT_VIEW permission', () => {
    expect(hasPermission('ga_lead', PERMISSIONS.AUDIT_VIEW)).toBe(true);
  });

  it('ga_staff has JOB_UPDATE_STATUS and JOB_CREATE', () => {
    expect(hasPermission('ga_staff', PERMISSIONS.JOB_UPDATE_STATUS)).toBe(true);
    expect(hasPermission('ga_staff', PERMISSIONS.JOB_CREATE)).toBe(true);
  });

  it('finance_approver has APPROVAL_DECIDE but not JOB_CREATE', () => {
    expect(hasPermission('finance_approver', PERMISSIONS.APPROVAL_DECIDE)).toBe(true);
    expect(hasPermission('finance_approver', PERMISSIONS.JOB_CREATE)).toBe(false);
  });

  it('general_user does not have AUDIT_VIEW', () => {
    expect(hasPermission('general_user', PERMISSIONS.AUDIT_VIEW)).toBe(false);
  });

  it('ga_staff does not have AUDIT_VIEW', () => {
    expect(hasPermission('ga_staff', PERMISSIONS.AUDIT_VIEW)).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('returns true when role has at least one listed permission', () => {
    expect(
      hasAnyPermission('general_user', [PERMISSIONS.REQUEST_VIEW_ALL, PERMISSIONS.ADMIN_PANEL])
    ).toBe(true);
  });

  it('returns false when role has none of the listed permissions', () => {
    expect(
      hasAnyPermission('general_user', [PERMISSIONS.ADMIN_PANEL, PERMISSIONS.AUDIT_VIEW])
    ).toBe(false);
  });
});

describe('canAccessRoute', () => {
  it('admin can access /admin routes', () => {
    expect(canAccessRoute('admin', '/admin')).toBe(true);
    expect(canAccessRoute('admin', '/admin/settings')).toBe(true);
    expect(canAccessRoute('admin', '/admin/users')).toBe(true);
  });

  it('general_user cannot access /admin routes', () => {
    expect(canAccessRoute('general_user', '/admin')).toBe(false);
    expect(canAccessRoute('general_user', '/admin/settings')).toBe(false);
  });

  it('all roles can access dashboard (/)', () => {
    const roles = ['general_user', 'ga_staff', 'ga_lead', 'finance_approver', 'admin'] as const;
    for (const role of roles) {
      expect(canAccessRoute(role, '/')).toBe(true);
    }
  });

  it('finance_approver can access /approvals', () => {
    expect(canAccessRoute('finance_approver', '/approvals')).toBe(true);
  });

  it('unknown routes return true (permissive default)', () => {
    expect(canAccessRoute('general_user', '/some-random-page')).toBe(true);
  });
});

describe('ROLE_PERMISSIONS structure', () => {
  it('all five roles are defined', () => {
    const roles = ['general_user', 'ga_staff', 'ga_lead', 'finance_approver', 'admin'] as const;
    for (const role of roles) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it('admin permissions include all defined permission values', () => {
    const allPermissions = Object.values(PERMISSIONS);
    for (const perm of allPermissions) {
      expect(ROLE_PERMISSIONS.admin).toContain(perm);
    }
  });
});
