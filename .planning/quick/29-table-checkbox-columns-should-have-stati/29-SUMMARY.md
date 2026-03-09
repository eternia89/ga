---
phase: quick-29
plan: 01
subsystem: admin-ui
tags: [tables, checkbox, layout-shift, ui-consistency]
dependency_graph:
  requires: []
  provides: [consistent-checkbox-column-width]
  affects: [admin-settings-tables]
tech_stack:
  added: []
  patterns: [fixed-column-sizing]
key_files:
  verified:
    - components/admin/companies/company-columns.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/categories/category-columns.tsx
    - components/admin/users/user-columns.tsx
    - components/data-table/data-table.tsx
decisions: []
metrics:
  duration: "<1 min"
  completed: "2026-03-09"
---

# Quick Task 29: Table Checkbox Columns Should Have Static Width

All 5 admin table select columns already have `size: 40` and the DataTable component enforces width/minWidth/maxWidth from columnDef.size on both header and cell elements.

## Tasks Completed

### Task 1: Audit and fix all select column definitions to have size: 40

**Status:** No changes needed -- already correct

**Audit Results:**
- `components/admin/companies/company-columns.tsx` -- has `id: "select", size: 40` (confirmed)
- `components/admin/divisions/division-columns.tsx` -- has `id: "select", size: 40` (confirmed)
- `components/admin/locations/location-columns.tsx` -- has `id: "select", size: 40` (confirmed)
- `components/admin/categories/category-columns.tsx` -- has `id: "select", size: 40` (confirmed)
- `components/admin/users/user-columns.tsx` -- has `id: 'select', size: 40` (confirmed)

**DataTable enforcement verified:** `data-table.tsx` applies inline `width`, `minWidth`, and `maxWidth` from `columnDef.size` on both `TableHead` (line 129-130) and `TableCell` (line 157-158) elements.

**Verification:** 5 select columns found, 5 `size: 40` occurrences confirmed. Build passes.

## Deviations from Plan

None -- all select columns were already correctly configured with `size: 40`.

## Self-Check: PASSED

All 5 column files verified to contain `size: 40` in their select column definition. DataTable enforcement confirmed. No code changes required.
