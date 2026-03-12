---
phase: quick-57
plan: 57
subsystem: tables
tags: [ui, tables, columns, requests, assets]
dependency_graph:
  requires: []
  provides: [consistent-id-status-column-order]
  affects: [requests-table, assets-table]
tech_stack:
  added: []
  patterns: [tanstack-table-column-order]
key_files:
  created: []
  modified:
    - components/requests/request-columns.tsx
    - components/assets/asset-columns.tsx
decisions:
  - "Status column always occupies position 2 (after display_id) across all entity tables with a display_id"
metrics:
  duration: 3min
  completed_date: "12-03-2026"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 57: Separate ID and Status into first two columns — Summary

**One-liner:** ID-only column 1 (font-mono, no badge) and Status-badge-only column 2 enforced in requests and assets tables for consistent left-to-right scanning.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix requests table — split ID and Status into separate columns | cc22879 | components/requests/request-columns.tsx |
| 2 | Fix assets table — move Status column from position 6 to position 2 | cc22879 | components/assets/asset-columns.tsx |

## Changes Made

### Task 1 — Requests table (`request-columns.tsx`)

- Removed `<RequestStatusBadge>` from the `display_id` column cell; cell now renders only `<span className="font-mono text-xs">` with the ID.
- Column size reduced from 200 to 160 (ID-only, no badge needed).
- Inserted new `status` column at position 2 with `accessorKey: 'status'`, `size: 150`, `enableSorting: false`, rendering only `<RequestStatusBadge>`.
- Final order: display_id → status → photo → title → location → priority → PIC → created_at → actions.

### Task 2 — Assets table (`asset-columns.tsx`)

- Moved existing `status` column definition (with `AssetStatusBadge` + `showInTransit` prop + `pendingTransfers` meta lookup) from its old position after `location_name` to position 2, immediately after `display_id` and before `photo`.
- No logic, sizes, or definitions were changed — pure reorder.
- Final order: display_id → status → photo → name → category → location → warranty_expiry → actions.

## Verification

- `grep RequestStatusBadge` in `request-columns.tsx` shows import (line 9) and one occurrence inside the new `status` column cell only — not inside `display_id`.
- `grep accessorKey|id:` in `asset-columns.tsx` confirms `status` (line 45) appears between `display_id` (line 35) and `photo` (line 60).
- `npm run build` exits 0, no TypeScript errors.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `components/requests/request-columns.tsx` modified and verified
- [x] `components/assets/asset-columns.tsx` modified and verified
- [x] Commit cc22879 exists
- [x] Build passes
