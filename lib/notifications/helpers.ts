// Usage pattern for adding notifications to server actions:
// 1. Import: import { createNotifications } from '@/lib/notifications/helpers'
// 2. After successful mutation, call (non-blocking):
//    createNotifications({ companyId, recipientIds, actorId, title, body, type, entityType, entityId }).catch(() => {})
// 3. Always set actorId to exclude the acting user from notifications

import { createAdminClient } from '@/lib/supabase/admin';

export interface NotifyParams {
  companyId: string;
  recipientIds: string[];     // users to notify
  actorId: string;            // user who performed action (EXCLUDED from recipients per REQ-NOTIF-007)
  title: string;              // max 150 chars
  body?: string;              // max 200 chars
  type: 'status_change' | 'assignment' | 'approval' | 'completion' | 'auto_accept_warning';
  entityType?: 'request' | 'job' | 'inventory' | 'maintenance_schedule';
  entityId?: string;          // UUID of the entity
}

/**
 * Server-side helper to create notifications for multiple recipients.
 * The actor is NEVER included in recipients (REQ-NOTIF-007).
 * Notification failures are swallowed — never breaks the triggering action.
 */
export async function createNotifications(params: NotifyParams): Promise<void> {
  const {
    companyId,
    recipientIds,
    actorId,
    title,
    body,
    type,
    entityType,
    entityId,
  } = params;

  // Filter out actorId from recipients (REQ-NOTIF-007)
  const filteredRecipients = recipientIds.filter((id) => id !== actorId);

  // If no recipients remain after filtering, return early
  if (filteredRecipients.length === 0) {
    return;
  }

  // Build one row per recipient
  const rows = filteredRecipients.map((userId) => ({
    company_id: companyId,
    user_id: userId,
    title: title.substring(0, 150),
    body: body ? body.substring(0, 200) : null,
    type,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
  }));

  try {
    // Use admin client for INSERT — notifications table has no INSERT policy for regular users
    const adminClient = createAdminClient();
    const { error } = await adminClient.from('notifications').insert(rows);
    if (error) {
      console.error('[createNotifications] Insert error:', error.message);
    }
  } catch (err) {
    // Never throw — notification failure should never break the triggering action
    console.error('[createNotifications] Unexpected error:', err);
  }
}
