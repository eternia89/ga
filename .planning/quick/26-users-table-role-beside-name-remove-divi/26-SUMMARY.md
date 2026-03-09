---
phase: quick-26
plan: 1
subsystem: admin-users
tags: [ui, table-columns, cleanup]
dependency_graph:
  requires: []
  provides: [compact-user-table]
  affects: [components/admin/users/user-columns.tsx]
tech_stack:
  added: []
  patterns: [inline-badge-in-table-cell]
key_files:
  modified:
    - components/admin/users/user-columns.tsx
decisions:
  - Role badge moved inline with name rather than as separate column for better information density
metrics:
  duration_seconds: 41
  completed: "2026-03-09T14:47:53Z"
  tasks_completed: 1
  tasks_total: 1
---

# Quick Task 26: Users Table — Role Beside Name, Remove Division + Last Login

Role badge rendered inline beside user name in Name column cell; Division and Last Login columns removed to reduce table width.

## What Was Done

### Task 1: Move role badge to name cell and remove Division + Last Login columns

Moved the role badge (with existing `roleColors` and `roleDisplay` maps) into the `full_name` column cell renderer using a `flex items-center gap-2` wrapper around name + badge, with email on its own line below. Removed the standalone `role`, `division`, and `last_sign_in_at` column definitions.

**Commit:** `f5aadbc`
**Files modified:** `components/admin/users/user-columns.tsx`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors (only pre-existing e2e test error unrelated to changes)
- Users table columns: checkbox, Name (with role badge + email), Location, Status, Company, Created, Actions

## Self-Check: PASSED
