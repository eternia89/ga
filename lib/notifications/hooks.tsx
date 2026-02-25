'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUnreadCount, getRecentNotifications } from './actions';
import type { Notification } from './actions';

export type { Notification };

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [countResult, notificationsResult] = await Promise.all([
        getUnreadCount(),
        getRecentNotifications(),
      ]);

      if (countResult?.data) {
        setUnreadCount(countResult.data.count);
      }
      if (notificationsResult?.data) {
        setNotifications(notificationsResult.data.notifications);
      }
    } catch (err) {
      // Silently handle errors — notification polling failures should not disrupt the app
      console.error('[useNotifications] refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Call immediately on mount
    refresh();

    // Poll every 30 seconds
    const intervalId = setInterval(refresh, 30_000);

    // Cleanup to prevent memory leaks
    return () => {
      clearInterval(intervalId);
    };
  }, [refresh]);

  return { unreadCount, notifications, refresh, isLoading };
}
