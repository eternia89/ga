'use client';

import { useMemo, type ReactNode } from 'react';
import { useUser } from '@/lib/auth/hooks';
import { hasPermission } from '@/lib/auth/permissions';
import type { Permission } from '@/lib/auth/types';

type PermissionGateProps = {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { profile } = useUser();

  const hasAccess = useMemo(() => {
    if (!profile) return false;
    return hasPermission(profile.role, permission);
  }, [profile, permission]);

  if (!hasAccess) return <>{fallback}</>;

  return <>{children}</>;
}
