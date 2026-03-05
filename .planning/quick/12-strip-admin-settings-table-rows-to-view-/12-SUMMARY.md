---
phase: quick-12
plan: 01
subsystem: admin-settings
tags: [ux, admin, form-dialog, table-actions]
key-files:
  created: []
  modified:
    - components/admin/entity-form-dialog.tsx
    - components/admin/users/user-form-dialog.tsx
    - components/admin/companies/company-form-dialog.tsx
    - components/admin/divisions/division-form-dialog.tsx
    - components/admin/locations/location-form-dialog.tsx
    - components/admin/categories/category-form-dialog.tsx
    - components/admin/users/user-columns.tsx
    - components/admin/companies/company-columns.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/categories/category-columns.tsx
    - components/admin/users/user-table.tsx
    - components/admin/companies/company-table.tsx
    - components/admin/divisions/division-table.tsx
    - components/admin/locations/location-table.tsx
    - components/admin/categories/category-table.tsx
decisions:
  - secondaryAction prop on EntityFormDialog uses variant-based styling (destructive=red, success=green) with ghost button on left side of footer
  - handleRestore functions refactored to use editingEntity state instead of accepting entity parameter (now triggered from FormDialog context)
metrics:
  duration: 4min
  completed: 2026-03-05
  tasks: 2
  files: 16
---

# Quick Task 12: Strip Admin Settings Table Rows to Edit-Only

Admin table rows simplified from multi-action (Edit + Deactivate/Reactivate) to single Edit button; lifecycle actions moved into FormDialog footer as secondary actions with confirmation dialogs preserved.

## One-Liner

Stripped admin table rows to Edit-only, moved Deactivate/Reactivate into EntityFormDialog footer with variant-styled secondary action buttons.

## Task Results

### Task 1: Add secondary action support to EntityFormDialog and update all 5 FormDialogs
**Commit:** a422658

- Added optional `secondaryAction` prop to `EntityFormDialogProps` with `label`, `variant` (destructive|success), and `onClick`
- Footer layout switches to `justify-between` when secondaryAction present, keeping Cancel/Submit grouped on right
- Secondary button uses `variant="ghost"` with color classes based on variant type
- All 5 FormDialogs (Company, Division, Location, Category, User) accept `onDeactivate`/`onReactivate` props
- UserFormDialog also accepts `isDeactivated` boolean since UserRow type differs from entity types
- Each FormDialog computes secondaryAction from entity state and callback presence

### Task 2: Strip columns to Edit-only and rewire table components
**Commit:** d6b13af

- Removed `onDeactivate`/`onReactivate` params from `getUserColumns()` (now single `onEdit` param)
- Removed UserActions component; inline Edit button renders directly in cell
- Removed conditional Deactivate/Reactivate branching from all 4 entity column files (company, division, location, category)
- Removed `onDelete`/`onRestore` from DataTable meta in all 4 entity tables
- Removed `handleDelete` functions from table components (was called from row)
- Refactored `handleRestore` to use `editingEntity` state (triggered from FormDialog)
- Added `onDeactivate`/`onReactivate` props to edit FormDialog instances in all 5 tables
- `handleConfirmDelete` and `handleReactivateConfirm` now close edit dialog on success

## Deviations from Plan

None - plan executed exactly as written.

## Verification

1. TypeScript compilation: PASSED (only pre-existing e2e test error)
2. Production build: PASSED
3. No Deactivate/Reactivate buttons in column files (only status badge text "Deactivated"/"Active" remains)
4. secondaryAction prop confirmed in EntityFormDialog

## Self-Check: PASSED

All 16 modified files exist and both commit hashes verified.
