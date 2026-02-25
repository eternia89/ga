'use client';

import { Bell, UserPlus, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/notifications/hooks';

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'assignment':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'approval':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'completion':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'auto_accept_warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'status_change':
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function getEntityPath(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null;
  switch (entityType) {
    case 'request':
      return `/requests/${entityId}`;
    case 'job':
      return `/jobs/${entityId}`;
    case 'inventory':
      return `/inventory/${entityId}`;
    case 'maintenance_schedule':
      return `/maintenance/schedules/${entityId}`;
    default:
      return null;
  }
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    onMarkRead(notification.id);
    const path = getEntityPath(notification.entity_type, notification.entity_id);
    if (path) {
      router.push(path);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors',
        !notification.is_read && 'bg-blue-50/50'
      )}
    >
      {/* Unread indicator */}
      <div className="flex-shrink-0 mt-1">
        {!notification.is_read ? (
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-transparent" />
        )}
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-tight',
          !notification.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground'
        )}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
      </div>
    </button>
  );
}

