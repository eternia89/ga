'use client';

import { Bell } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useNotifications } from '@/lib/notifications/hooks';
import { NotificationDropdown } from './notification-dropdown';

export function NotificationBell() {
  const { unreadCount, notifications, refresh } = useNotifications();

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
              {displayCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0 w-auto"
      >
        <NotificationDropdown
          notifications={notifications}
          onRefresh={refresh}
        />
      </PopoverContent>
    </Popover>
  );
}
