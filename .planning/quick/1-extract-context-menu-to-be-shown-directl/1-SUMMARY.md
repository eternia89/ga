---
phase: quick
plan: 1
subsystem: ui-tables
tags: [ui, data-table, row-actions, consistency]
dependency_graph:
  requires: []
  provides:
    - "Consistent ghost text button row actions across all data tables"
  affects:
    - components/admin/companies/company-columns.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/categories/category-columns.tsx
    - components/assets/asset-columns.tsx
    - components/maintenance/template-columns.tsx
    - components/maintenance/schedule-columns.tsx
tech_stack:
  added: []
  patterns:
    - "Ghost text button row actions (h-7 px-2 text-xs, variant=ghost)"
    - "Destructive coloring for delete/deactivate actions"
    - "Green coloring for restore/activate/reactivate actions"
key_files:
  created: []
  modified:
    - components/admin/companies/company-columns.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/categories/category-columns.tsx
    - components/assets/asset-columns.tsx
    - components/maintenance/template-columns.tsx
    - components/maintenance/schedule-columns.tsx
decisions: []
metrics:
  duration: 3min
  completed: 2026-03-02
---

# Quick Task 1: Extract Context Menu to Direct Ghost Buttons Summary

Replaced all dropdown/context menu and plain button row actions with direct ghost text buttons matching the user-columns.tsx pattern across 7 data table column files.

## What Was Done

### Task 1: Admin Settings Tables (e12f803)

Converted 4 admin column files from DropdownMenu-based actions to direct ghost text buttons:

- **company-columns.tsx**: Removed DropdownMenu/MoreHorizontal imports, replaced with Edit + Delete (active) or Restore (deactivated) ghost buttons
- **division-columns.tsx**: Same conversion pattern as company
- **location-columns.tsx**: Same conversion pattern as company
- **category-columns.tsx**: Same conversion pattern as company

All files now have `size: 120` on the actions column and an "Actions" header.

### Task 2: Asset + Maintenance Tables (57ef422)

- **asset-columns.tsx**: Removed DropdownMenu/MoreHorizontal/Eye/Edit icon imports, replaced with View + Edit ghost text buttons, column size increased from 60 to 120
- **template-columns.tsx**: Added shadcn Button import, replaced plain `<button>` with `<Button variant="ghost">`, changed gap-2 to gap-1, added proper destructive/green styling
- **schedule-columns.tsx**: Added shadcn Button import, replaced plain `<button>` with `<Button variant="ghost">`, changed gap-2 to gap-1, added proper destructive/green styling

## Button Styling Convention (Established)

| Action Type | Class Pattern |
|---|---|
| Neutral (Edit, View) | `h-7 px-2 text-xs` |
| Destructive (Delete, Deactivate) | `h-7 px-2 text-xs text-destructive hover:text-destructive` |
| Positive (Restore, Activate, Reactivate) | `h-7 px-2 text-xs text-green-600 hover:text-green-700` |

All buttons: `variant="ghost" size="sm"`

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

1. `npx tsc --noEmit` -- PASSED (zero errors)
2. `npm run build` -- PASSED (production build succeeds)
3. Zero `MoreHorizontal` imports in any *-columns.tsx file
4. Zero `DropdownMenu` imports in any *-columns.tsx file
5. All action buttons use `variant="ghost" size="sm" className="h-7 px-2 text-xs"` pattern

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e12f803 | Admin settings tables: company, division, location, category |
| 2 | 57ef422 | Asset + maintenance tables: asset, template, schedule |

## Self-Check: PASSED

All 7 modified files exist. Both commit hashes verified. SUMMARY.md created.
