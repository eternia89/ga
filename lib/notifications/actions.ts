'use server';

import { z } from 'zod';
import { authActionClient } from '@/lib/safe-action';

export type Notification = {
  id: string;
  company_id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  deleted_at: string | null;
};

/**
 * Get unread notification count for the current user.
 */
export const getUnreadCount = authActionClient
  .action(async ({ ctx }) => {
    const { supabase, profile } = ctx;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .is('deleted_at', null);

    if (error) {
      throw new Error(error.message);
    }

    return { count: count ?? 0 };
  });

/**
 * Get the 10 most recent notifications for the current user.
 */
export const getRecentNotifications = authActionClient
  .action(async ({ ctx }) => {
    const { supabase, profile } = ctx;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw new Error(error.message);
    }

    return { notifications: (data ?? []) as Notification[] };
  });

/**
 * Mark a specific notification as read.
 */
export const markAsRead = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { id } = parsedInput;
    const { supabase, profile } = ctx;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', profile.id);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });

/**
 * Mark all unread notifications as read for the current user.
 */
export const markAllAsRead = authActionClient
  .action(async ({ ctx }) => {
    const { supabase, profile } = ctx;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .is('deleted_at', null);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true };
  });
