---
phase: quick-34
plan: 34
subsystem: admin-settings-ui
tags: [ui, data-table, settings, inactive-rows, visual-feedback]
dependency_graph:
  requires: []
  provides: [getRowClassName-prop-on-DataTable, inactive-row-visual-distinction]
  affects: [companies-table, divisions-table, locations-table, categories-table, users-table]
tech_stack:
  added: []
  patterns: [getRowClassName prop pattern for row-level styling]
key_files:
  created: []
  modified:
    - components/data-table/data-table.tsx
    - components/admin/companies/company-columns.tsx
    - components/admin/companies/company-table.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/divisions/division-table.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/locations/location-table.tsx
    - components/admin/categories/category-columns.tsx
    - components/admin/categories/category-table.tsx
    - components/admin/users/user-columns.tsx
    - components/admin/users/user-table.tsx
decisions:
  - "getRowClassName added as optional prop to DataTable; applied to TableRow className via optional chaining to keep non-settings tables unaffected"
  - "Badge import removed from 4 column files (company, division, location, category) where it was solely used by the Status column; kept in user-columns where it is used for the role badge in the Name cell"
metrics:
  duration: 8
  completed_date: "2026-03-10"
---

# Quick Task 34: Inactive Settings Rows Visual Distinction Summary

**One-liner:** Replaced Status badge column in all 5 settings tables with grey row background (`bg-muted/40`) for inactive rows via new `getRowClassName` prop on DataTable.

## What Was Done

Replaced the dedicated "Status" column (showing a green/red Badge) in all 5 admin settings tables with row-level background color. Inactive (deactivated) rows now have a subtle grey background (`bg-muted/40`). Active rows keep the default white background. This frees up horizontal space and communicates status more cleanly.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add `getRowClassName` prop to DataTable, remove Status columns from all 5 column files | ef78dc5 |
| 2 | Wire `getRowClassName` in all 5 settings table components | d989b61 |

## Files Changed

### Task 1 — DataTable prop + column removal (6 files)

- **`components/data-table/data-table.tsx`** — Added `getRowClassName?: (row: TData) => string` to `DataTableProps` interface; destructured it in function signature; applied `className={getRowClassName?.(row.original)}` to `TableRow`
- **`components/admin/companies/company-columns.tsx`** — Removed `deleted_at` Status ColumnDef block; removed `Badge` import
- **`components/admin/divisions/division-columns.tsx`** — Same as above
- **`components/admin/locations/location-columns.tsx`** — Same as above
- **`components/admin/categories/category-columns.tsx`** — Same as above
- **`components/admin/users/user-columns.tsx`** — Removed `deleted_at` Status ColumnDef block only; kept `Badge` import (used for role badge in Name cell)

### Task 2 — Wire getRowClassName in table components (5 files)

- **`components/admin/companies/company-table.tsx`** — Added `getRowClassName={(row) => (row.deleted_at ? "bg-muted/40" : "")}`
- **`components/admin/divisions/division-table.tsx`** — Same pattern
- **`components/admin/locations/location-table.tsx`** — Same pattern
- **`components/admin/categories/category-table.tsx`** — Same pattern
- **`components/admin/users/user-table.tsx`** — Same pattern

## Verification

- `npm run build` passes with no errors after both tasks
- `npm run lint` has 196 pre-existing errors (unrelated to this task; out of scope per deviation rules)
- showDeactivated toggle behavior unchanged — inactive rows appear/disappear correctly based on toggle state
- No Status column header visible in any of the 5 settings tabs

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Commits ef78dc5 and d989b61 exist in git log. All 11 modified files verified present and updated. Build succeeds.
