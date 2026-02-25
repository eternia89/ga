'use client';

import { useState, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getAllNotifications, markAllAsRead } from '@/lib/notifications/actions';
import type { Notification, NotificationFilter } from '@/lib/notifications/actions';
import { NotificationItem } from './notification-item';

type FilterOption = {
  value: NotificationFilter;
  label: string;
};

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'request', label: 'Requests' },
  { value: 'job', label: 'Jobs' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'maintenance', label: 'Maintenance' },
];

interface NotificationCenterProps {
  initialNotifications: Notification[];
  initialHasMore: boolean;
}

export function NotificationCenter({
  initialNotifications,
  initialHasMore,
}: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleFilterChange(filter: NotificationFilter) {
    if (filter === activeFilter) return;
    setActiveFilter(filter);
    startTransition(async () => {
      const result = await getAllNotifications({ filter, limit: 20 });
      if (result?.data) {
        setNotifications(result.data.notifications);
        setHasMore(result.data.hasMore);
      }
    });
  }

  async function handleLoadMore() {
    if (notifications.length === 0) return;
    const cursor = notifications[notifications.length - 1].created_at;
    setIsLoadingMore(true);
    try {
      const result = await getAllNotifications({ filter: activeFilter, cursor, limit: 20 });
      if (result?.data) {
        setNotifications((prev) => [...prev, ...result.data!.notifications]);
        setHasMore(result.data.hasMore);
      }
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleMarkAllRead() {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
  }

  function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFilterChange(opt.value)}
              disabled={isPending}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                activeFilter === opt.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs shrink-0">
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notification list */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isPending ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs mt-1">
              {activeFilter === 'unread'
                ? "You're all caught up"
                : 'Nothing here yet'}
            </p>
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

      {/* Load more */}
      {!isPending && hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading…
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
