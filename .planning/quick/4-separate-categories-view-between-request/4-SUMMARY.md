---
phase: quick-4
plan: 01
subsystem: admin-settings
tags: [categories, ui, admin, settings]
dependency-graph:
  requires: []
  provides: [type-scoped-category-views]
  affects: [admin-settings-categories]
tech-stack:
  added: []
  patterns: [nested-tabs, type-scoped-filtering]
key-files:
  created: []
  modified:
    - components/admin/categories/category-columns.tsx
    - components/admin/categories/category-table.tsx
    - components/admin/categories/category-form-dialog.tsx
    - app/(dashboard)/admin/settings/settings-content.tsx
decisions:
  - "Nested Tabs (not URL-synced) for sub-tab navigation within Categories tab"
  - "Type field hidden entirely in form dialog when defaultType provided (both create and edit)"
metrics:
  duration: 4min
  completed: 2026-03-03
---

# Quick Task 4: Separate Categories View Between Request and Asset

**One-liner:** Split Categories settings tab into Request/Asset sub-tabs with type-scoped tables and hidden type field in forms

## What Was Done

### Task 1: Scope CategoryTable and columns by type (8b6b412)

- **category-columns.tsx**: Removed the "Type" column entirely from the columns array (redundant when categories are already scoped by sub-tab)
- **category-table.tsx**: Added required `categoryType` prop (`"request" | "asset"`), removed `filterableColumns` type filter from DataTable, updated header text to reflect type ("Request Categories" / "Asset Categories"), passed `defaultType={categoryType}` to both create and edit CategoryFormDialog instances, removed Type column from bulk export CSV
- **category-form-dialog.tsx**: When `defaultType` is provided, the Type form field is hidden entirely (not rendered). The form still submits the correct type value via `defaultValues`. This applies to both create (no type selector shown) and edit (type is immutable anyway). Removed the "Type cannot be changed" helper text since the field is now hidden.

### Task 2: Add sub-tabs for Request/Asset categories in settings (bdc86a8)

- **settings-content.tsx**: Within the "categories" TabsContent, added a nested `<Tabs>` component with two sub-tabs: "Request Categories" (default) and "Asset Categories". Categories are filtered at the component body level (`requestCategories` / `assetCategories` via `.filter()`). Sub-tabs use `defaultValue="request"` and are NOT synced to URL (only the top-level tab uses nuqs).
- **page.tsx**: No changes needed — server component already fetches all categories; client-side split happens in settings-content.tsx.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 8b6b412 | refactor(quick-4): scope CategoryTable and columns by category type |
| 2 | bdc86a8 | feat(quick-4): add Request/Asset sub-tabs within Categories settings tab |

## Verification

- `npm run build` passes with no errors
- Categories tab at /admin/settings?tab=categories shows two sub-tabs
- Each sub-tab renders only its type of categories
- Type column removed from table (no longer needed)
- Create dialog hides type selector and pre-fills correct type from sub-tab
- Edit dialog hides type field (type is immutable and implicit from sub-tab context)

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED

- All 4 modified files verified on disk
- Both commits (8b6b412, bdc86a8) verified in git log
- Build passes with no errors
