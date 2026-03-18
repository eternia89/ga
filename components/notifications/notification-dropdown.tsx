'use client';

import Link from 'next/link';
import { markAsRead, markAllAsRead } from '@/lib/notifications/actions';
import { NotificationItem } from './notification-item';
import type { Notification } from '@/lib/notifications/hooks';

interface NotificationDropdownProps {
  notifications: Notification[];
  onRefresh: () => void;
}

export function NotificationDropdown({ notifications, onRefresh }: NotificationDropdownProps) {
  const hasUnread = notifications.some((n) => !n.is_read);

  const handleMarkRead = async (id: string) => {
    await markAsRead({ id });
    onRefresh();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    onRefresh();
  };

  return (
    <div className="flex flex-col w-[380px] max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5">
        <Link
          href="/notifications"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
