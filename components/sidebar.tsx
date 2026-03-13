'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/auth/hooks';
import { hasPermission, PERMISSIONS } from '@/lib/auth/permissions';
import type { Permission } from '@/lib/auth/types';
import { UserMenu } from './user-menu';
type NavItem = {
  label: string;
  href: string;
  permission: Permission;
  built: boolean;
  icon: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      {
        label: 'Dashboard',
        href: '/',
        permission: PERMISSIONS.DASHBOARD_VIEW,
        built: true,
        icon: '▦',
      },
      {
        label: 'Requests',
        href: '/requests',
        permission: PERMISSIONS.REQUEST_VIEW_ALL,
        built: true,
        icon: '📄',
      },
      {
        label: 'Jobs',
        href: '/jobs',
        permission: PERMISSIONS.JOB_VIEW_ALL,
        built: true,
        icon: '🔧',
      },
      {
        label: 'Approvals',
        href: '/approvals',
        permission: PERMISSIONS.APPROVAL_VIEW,
        built: true,
        icon: '✓',
      },
    ],
  },
  {
    title: 'Assets',
    items: [
      {
        label: 'Assets',
        href: '/inventory',
        permission: PERMISSIONS.ASSETS_VIEW_ALL,
        built: true,
        icon: '📦',
      },
    ],
  },
  {
    title: 'Maintenance',
    items: [
      {
        label: 'Schedules',
        href: '/maintenance',
        permission: PERMISSIONS.MAINTENANCE_VIEW_ALL,
        built: true,
        icon: '📅',
      },
      {
        label: 'Templates',
        href: '/maintenance/templates',
        permission: PERMISSIONS.MAINTENANCE_MANAGE,
        built: true,
        icon: '📋',
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        label: 'Settings',
        href: '/admin/settings',
        permission: PERMISSIONS.ADMIN_PANEL,
        built: true,
        icon: '⚙',
      },
      {
        label: 'Company Settings',
        href: '/admin/company-settings',
        permission: PERMISSIONS.ADMIN_PANEL,
        built: true,
        icon: '⚙',
      },
      {
        label: 'Audit Trail',
        href: '/admin/audit-trail',
        permission: PERMISSIONS.AUDIT_VIEW,
        built: true,
        icon: '📜',
      },
    ],
  },
];

type SidebarProps = {
  companyName: string;
  onNavigate?: () => void;
};

export function Sidebar({ companyName, onNavigate }: SidebarProps) {
  const { profile } = useUser();
  const pathname = usePathname();

  if (!profile) return null;


  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      {/* Company name at top */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {companyName}
        </h1>
      </div>

      {/* Navigation sections - scrollable */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {NAV_SECTIONS.map((section) => {
          // Filter items by permission
          const visibleItems = section.items.filter((item) =>
            hasPermission(profile.role, item.permission)
          );

          // Don't render empty sections
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {section.title}
              </h2>
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;

                  // Unbuilt items: render as grayed/disabled span with "Coming soon"
                  if (!item.built) {
                    return (
                      <li key={item.href}>
                        <span className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 cursor-not-allowed">
                          <span className="text-base">{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                          <span className="ml-auto text-xs text-gray-400">
                            Coming soon
                          </span>
                        </span>
                      </li>
                    );
                  }

                  // Built items: render as active link
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={`
                          flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                          ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User menu at bottom - sticky */}
      <div className="border-t border-gray-200 p-4">
        <UserMenu />
      </div>
    </aside>
  );
}
