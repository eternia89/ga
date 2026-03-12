---
phase: quick-61
plan: 01
subsystem: admin-users, assets, sidebar, transfer-dialog
tags: [ui, table-columns, transfer-dialog, rename]
dependency_graph:
  requires: []
  provides: [users-role-column, asset-no-transfer-row, assets-rename, transfer-two-mode]
  affects: [components/admin/users/user-columns.tsx, components/assets/asset-columns.tsx, components/assets/asset-transfer-dialog.tsx, components/sidebar.tsx, app/(dashboard)/inventory]
tech_stack:
  added: []
  patterns: [mode-toggle-buttons, combobox-location-options, optional-schema-field]
key_files:
  created: []
  modified:
    - components/admin/users/user-columns.tsx
    - components/assets/asset-columns.tsx
    - components/sidebar.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/[id]/page.tsx
    - app/(dashboard)/inventory/[id]/error.tsx
    - components/assets/asset-transfer-dialog.tsx
    - lib/validations/asset-schema.ts
decisions:
  - "receiver_id made optional in assetTransferSchema to support location-only transfers without a receiver"
  - "Mode toggle uses default/outline Button variants — active = default, inactive = outline"
  - "No-users-found state renders InlineFeedback (not empty combobox) to guide user toward location mode"
metrics:
  duration: "~5 min"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_modified: 8
---

# Quick Task 61: Users Table Role Column, Remove Transfer Button, Rename Inventory to Assets, Two-Mode Transfer Dialog — Summary

**One-liner:** Role extracted to standalone column in users table, Transfer button removed from asset rows, Inventory UI labels renamed to Assets, and transfer dialog redesigned with user vs location mode toggle plus graceful no-users-found state.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Users role column, remove Transfer row button, rename Inventory to Assets | c45d9e2 | user-columns.tsx, asset-columns.tsx, sidebar.tsx, inventory/page.tsx, inventory/[id]/page.tsx, inventory/[id]/error.tsx |
| 2 | Two-mode transfer dialog + fix no-users-found state | 78d05c0 | asset-transfer-dialog.tsx, asset-schema.ts |

## Changes Made

### Task 1

**Users table role column:**
- Removed role Badge from Name cell — Name cell now shows only name (font-medium) and email (text-xs text-muted-foreground)
- Added standalone Role column after full_name with accessorKey 'role', size 160, renders colored Badge using existing roleColors/roleDisplay maps
- Column order: select → full_name → role → location → company_id (hidden) → company_name → actions

**Asset table Transfer button removal:**
- Removed `canTransfer` computed variable and Transfer `<Button>` block from actions cell
- Kept View and Change Status buttons
- Shrunk actions column size from 220 to 160

**Inventory → Assets rename:**
- `sidebar.tsx`: Section title from 'Inventory' to 'Assets'
- `inventory/page.tsx`: h1, breadcrumb label, and subtitle updated
- `inventory/[id]/page.tsx`: breadcrumb label updated
- `inventory/[id]/error.tsx`: "Back to Inventory" → "Back to Assets"

### Task 2

**Two-mode transfer dialog:**
- Added `mode` state ('user' | 'location') defaulting to 'user'
- Mode toggle rendered as two full-width buttons at dialog top (default/outline variants)
- User mode: existing receiver combobox + auto-derived location display + no-location warning
- User mode no-users-found: shows InlineFeedback with helpful message instead of empty combobox
- Location mode: destination location Combobox built from `Object.entries(locationNames)`
- Mode switch clears the other mode's selection
- Dialog open resets mode + both selections
- Submit button: "Initiate Transfer" (user) / "Move Asset" (location)
- Dialog subtitle shows current location name below title
- Schema: `receiver_id` changed from required `.uuid()` to optional `.uuid().optional()` in assetTransferSchema

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Made receiver_id optional in assetTransferSchema**
- **Found during:** Task 2 — location-only mode passes `receiver_id: undefined`, which would fail Zod validation on the required `.uuid()` field
- **Fix:** Changed `receiver_id: z.string().uuid({ message: 'Receiver is required' })` to `receiver_id: z.string().uuid().optional()` in lib/validations/asset-schema.ts
- **Files modified:** lib/validations/asset-schema.ts
- **Commit:** 78d05c0 (included in Task 2 commit)

## Self-Check: PASSED

- FOUND: components/admin/users/user-columns.tsx
- FOUND: components/assets/asset-transfer-dialog.tsx
- FOUND: lib/validations/asset-schema.ts
- FOUND: commit c45d9e2 (Task 1)
- FOUND: commit 78d05c0 (Task 2)
