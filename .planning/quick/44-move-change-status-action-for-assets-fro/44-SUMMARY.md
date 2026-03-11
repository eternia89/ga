---
phase: quick-44
plan: "01"
subsystem: inventory
tags: [assets, table-actions, ux, change-status]
dependency_graph:
  requires: []
  provides: [change-status-table-action]
  affects: [asset-columns, asset-table, asset-view-modal]
tech_stack:
  added: []
  patterns: [table-row-action, dialog-at-table-level]
key_files:
  created: []
  modified:
    - components/assets/asset-columns.tsx
    - components/assets/asset-table.tsx
    - components/assets/asset-view-modal.tsx
decisions:
  - "Change Status moved to table row actions following the same pattern as Transfer"
  - "AssetStatusChangeDialog mounted at AssetTable level with statusChangeAsset state, matching transferAsset pattern"
  - "Actions column size increased from 160 to 220 to accommodate Change Status button"
metrics:
  duration: "~8 min"
  completed_date: "2026-03-11"
---

# Phase quick-44 Plan 01: Move Change Status to Asset Table Row Actions Summary

## One-liner

Moved Change Status action from asset view modal sticky bar to table row actions column, matching the existing Transfer button pattern for one-click access without opening the modal.

## What Was Built

- **asset-columns.tsx**: Added `onChangeStatus` to `AssetTableMeta` type; added Change Status button in actions cell with same visibility guard as Transfer (`['ga_staff', 'ga_lead', 'admin']`, not `sold_disposed`, no pending transfer); actions column size increased from 160 to 220.
- **asset-table.tsx**: Imported `AssetStatusChangeDialog`; added `statusChangeAsset` state and `handleChangeStatus` handler; wired `onChangeStatus: handleChangeStatus` into DataTable meta; mounted `AssetStatusChangeDialog` at table level below `AssetTransferDialog`.
- **asset-view-modal.tsx**: Removed `AssetStatusChangeDialog` import; removed `showStatusDialog` state; removed `setShowStatusDialog(false)` from cleanup block; removed Change Status button from sticky action bar; removed `AssetStatusChangeDialog` block from modal body.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add Change Status to table row actions and wire at table level | 0d41a04 |
| 2 | Remove Change Status button from view modal sticky bar | a5a9b78 |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- Build passes clean: `npm run build` completes with 0 errors.
- Lint pre-existing issues (200 problems in unrelated files) are out of scope — no new lint errors introduced.

## Self-Check: PASSED

Files exist:
- components/assets/asset-columns.tsx: FOUND
- components/assets/asset-table.tsx: FOUND
- components/assets/asset-view-modal.tsx: FOUND

Commits exist:
- 0d41a04: FOUND (Task 1)
- a5a9b78: FOUND (Task 2)
