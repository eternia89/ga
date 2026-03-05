---
phase: quick-10
plan: 01
subsystem: ui-tables
tags: [consistency, actions, columns, view-button]
key-files:
  modified:
    - components/requests/request-columns.tsx
    - components/jobs/job-columns.tsx
    - components/assets/asset-columns.tsx
    - components/maintenance/template-columns.tsx
    - components/maintenance/schedule-columns.tsx
decisions:
  - Template actions column View button visible to all roles (not gated by canManage)
  - All action buttons use e.stopPropagation to prevent row click conflicts
metrics:
  duration: 1min
  completed: 2026-03-05
---

# Quick Task 10: Unify Table Row View Links to Modal Pattern

Consistent View button in actions column across all 5 entity tables with identical styling, stopPropagation, and enableSorting:false.

## What Changed

All 5 entity table action columns now follow an identical pattern:
- `id: 'actions'` with no `header` property
- `enableSorting: false`
- Wrapper `<div className="flex items-center gap-1">`
- View button first: `variant="ghost" size="sm" className="h-7 px-2 text-xs"`
- All click handlers include `e.stopPropagation()`
- View button visible to ALL users (not role-gated)

### Per-file Changes

| File | Changes |
|------|---------|
| request-columns.tsx | Added wrapper div, added enableSorting:false |
| asset-columns.tsx | Removed `header: 'Actions'`, added e.stopPropagation to View click |
| template-columns.tsx | Removed `if (!canManage) return null` guard, added View button for all roles, added e.stopPropagation to all handlers |
| schedule-columns.tsx | Added e.stopPropagation to View, Pause, Resume, and Deactivate handlers |
| job-columns.tsx | Added enableSorting:false to actions column |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors (only pre-existing e2e test type error)
- No `if (!canManage) return null` in template-columns.tsx
- No `header: 'Actions'` in asset-columns.tsx
- All 5 files have `enableSorting: false` on actions column

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 071b7c9 | Unify table row action columns across all 5 entity tables |

## Self-Check: PASSED

- [x] components/requests/request-columns.tsx - modified
- [x] components/jobs/job-columns.tsx - modified
- [x] components/assets/asset-columns.tsx - modified
- [x] components/maintenance/template-columns.tsx - modified
- [x] components/maintenance/schedule-columns.tsx - modified
- [x] Commit 071b7c9 exists
