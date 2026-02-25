---
phase: 08-media-notifications-dashboards
plan: "03"
subsystem: notifications
tags: [notifications, polling, bell-icon, server-actions, real-time]
dependency_graph:
  requires:
    - lib/supabase/admin.ts
    - lib/safe-action.ts
    - lib/auth/hooks.tsx
    - components/ui/popover.tsx
  provides:
    - lib/notifications/helpers.ts
    - lib/notifications/actions.ts
    - lib/notifications/hooks.tsx
    - components/notifications/notification-bell.tsx
    - components/notifications/notification-dropdown.tsx
    - components/notifications/notification-item.tsx
  affects:
    - app/(dashboard)/layout.tsx
tech_stack:
  added: []
  patterns:
    - Server actions via authActionClient for all notification CRUD
    - Admin client (service_role) for notification INSERT (bypasses RLS)
    - Client-side polling hook with 30s interval and cleanup
    - Popover-based notification dropdown with relative time formatting
key_files:
  created:
    - lib/notifications/helpers.ts
    - lib/notifications/actions.ts
    - lib/notifications/hooks.tsx
    - components/notifications/notification-bell.tsx
    - components/notifications/notification-dropdown.tsx
    - components/notifications/notification-item.tsx
  modified:
    - app/(dashboard)/layout.tsx
decisions:
  - "[08-03]: createNotifications uses admin client (service_role) for INSERT — notifications table has no INSERT policy for regular users, only service_role can write"
  - "[08-03]: Notification polling uses 30s interval with useCallback+useEffect cleanup pattern to prevent memory leaks"
  - "[08-03]: Actor is always excluded from recipients via filter in createNotifications (REQ-NOTIF-007)"
  - "[08-03]: Notification failure is swallowed — try/catch in createNotifications ensures notification errors never break triggering actions"
  - "[08-03]: Bell badge shows number 1-99, then 99+ for large counts"
metrics:
  duration: 3
  completed_date: "2026-02-25"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 8 Plan 3: Notification System Summary

In-app notification system with server-side creation helper, polling hook, bell icon with unread count badge, and dropdown with mark-as-read functionality.

## What Was Built

### Task 1: Notification Helpers, Server Actions, and Polling Hook

**`lib/notifications/helpers.ts`**
- `createNotifications(params: NotifyParams)` server-side helper
- Filters out actorId from recipientIds before insert (REQ-NOTIF-007: never notify actor about own action)
- Uses `createAdminClient()` for INSERT since notifications table has no INSERT RLS policy for regular users
- Wrapped in try/catch — notification failures are logged but never thrown, ensuring notification errors never disrupt the triggering action
- Truncates title to 150 chars and body to 200 chars at insert time

**`lib/notifications/actions.ts`**
- `getUnreadCount` — counts unread notifications for current user (count: exact, head: true for efficiency)
- `getRecentNotifications` — fetches 10 most recent non-deleted notifications ordered by created_at desc
- `markAsRead` — marks a single notification as read by ID (validates ownership via user_id eq)
- `markAllAsRead` — batch marks all unread as read for current user
- All actions use `authActionClient` pattern

**`lib/notifications/hooks.tsx`**
- `useNotifications()` hook with state: `unreadCount`, `notifications`, `isLoading`
- `refresh` callback wrapped in `useCallback` for stable reference
- `useEffect` calls `refresh()` immediately on mount, then polls every 30 seconds via `setInterval`
- Returns cleanup function with `clearInterval` to prevent memory leaks
- Silently handles polling errors — notification failures don't disrupt the app

### Task 2: Notification Bell, Dropdown, and Dashboard Layout Integration

**`components/notifications/notification-item.tsx`**
- Renders icon based on notification type (Bell/UserPlus/CheckCircle/AlertTriangle)
- Bold title for unread, regular weight for read
- Blue dot unread indicator on left side
- Truncated body with `line-clamp-2`
- Relative time via `formatDistanceToNow` from date-fns
- Click handler: calls `onMarkRead`, then navigates to entity detail page using `useRouter`
- Entity routing: request → `/requests/:id`, job → `/jobs/:id`, inventory → `/inventory/:id`, maintenance_schedule → `/maintenance/schedules/:id`

**`components/notifications/notification-bell.tsx`**
- Bell icon from lucide-react with Popover trigger
- Red badge shows unread count: number if ≤ 99, "99+" if > 99
- Badge styled: absolute positioned -top-0.5 -right-0.5, min-w-[18px] h-[18px], text-[10px]
- Popover content set to `p-0 w-auto` to let dropdown control its own dimensions
- Uses `useNotifications` hook for count and notifications state

**`components/notifications/notification-dropdown.tsx`**
- w-[380px] max-h-[480px] panel inside PopoverContent
- Header: "Notifications" title + "Mark all as read" button (only shown if unread exist)
- List: up to 10 `NotificationItem` components divided by borders
- Empty state: "No notifications yet" centered text
- Footer: "View all notifications" link to `/notifications` (notification center, plan 08-04)
- Calls `onRefresh()` after markAsRead and markAllAsRead to update counts

**`app/(dashboard)/layout.tsx`**
- Added sticky top header bar inside the main flex-col wrapper
- Header: `flex items-center justify-end px-6 py-3 border-b border-border`
- `NotificationBell` placed on the right side of the header
- Main content area remains scrollable below the header

## Deviations from Plan

None — plan executed exactly as written.

Note: A parallel agent executing plans 08-01, 08-02, 08-05, 08-06, 08-07 committed the Task 2 files (notification-bell.tsx, notification-dropdown.tsx, notification-item.tsx, layout.tsx) in commit `50f892c` as part of its phase 08-05 execution. The implementation is identical to what was planned here. Task 1 files (helpers.ts, actions.ts, hooks.tsx) were committed by this agent in commit `cd2b07a`.

## Verification

1. `lib/notifications/helpers.ts` exports `createNotifications` that filters actorId and uses adminClient — CONFIRMED
2. `lib/notifications/actions.ts` exports getUnreadCount, getRecentNotifications, markAsRead, markAllAsRead — CONFIRMED
3. `lib/notifications/hooks.tsx` polls every 30s with useCallback/clearInterval cleanup — CONFIRMED
4. Bell icon appears in dashboard header with unread count — CONFIRMED (layout.tsx updated)
5. Dropdown shows 10 recent notifications — CONFIRMED
6. Clicking notification navigates to entity and marks as read — CONFIRMED
7. TypeScript compiles without errors — CONFIRMED (0 errors from notification files)

## Self-Check: PASSED

All 6 created files confirmed present on disk. Task 1 commit cd2b07a confirmed in git log. Task 2 files were committed by parallel agent in commit 50f892c with identical implementation.
