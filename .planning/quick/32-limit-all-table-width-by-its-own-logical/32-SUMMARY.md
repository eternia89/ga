---
phase: quick-32
plan: 01
subsystem: data-table
tags: [ui, tables, layout, column-widths]
key-files:
  modified:
    - components/data-table/data-table.tsx
    - components/admin/categories/category-columns.tsx
    - components/admin/companies/company-columns.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/users/user-columns.tsx
    - components/requests/request-columns.tsx
    - components/jobs/job-columns.tsx
    - components/assets/asset-columns.tsx
    - components/maintenance/template-columns.tsx
    - components/maintenance/schedule-columns.tsx
    - components/audit-trail/audit-trail-columns.tsx
decisions:
  - "Used TanStack ColumnMeta augmentation (meta.grow) to mark growing columns — avoids new DataTable props, stays within existing column definition pattern"
  - "Growing column receives only minWidth; fixed columns receive width+minWidth+maxWidth — enforced entirely in DataTable renderer"
  - "Removed max-w-[Npx] Tailwind classes from growing column cell content wrappers; DataTable controls their width instead"
metrics:
  completed_date: "2026-03-10"
  tasks: 2
  files: 12
---

# Phase quick-32 Plan 01: Stable column widths across all tables

One-liner: Pinned all table columns to explicit fixed widths and marked one growing column per table via `meta: { grow: true }` so it expands to fill remaining space without shifting.

## What Was Built

DataTable now differentiates between fixed and growing columns:
- **Fixed columns**: `{ width, minWidth, maxWidth }` — column stays exactly its specified size
- **Growing columns**: `{ minWidth }` only — column expands to consume leftover horizontal space

Applied to all 11 column definition files. One growing column per table:

| Table | Growing Column | Size (min) |
|-------|---------------|-----------|
| categories | name | 200px |
| companies | name | 200px |
| divisions | description | 220px |
| locations | address | 240px |
| users | full_name | 220px |
| requests | title | 200px |
| jobs | title | 220px |
| assets | name | 200px |
| templates | name | 260px |
| schedules | template_name | 200px |
| audit-trail | entity | 120px |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

Commits verified:
- 751cda4: feat(quick-32): add grow column meta support to DataTable
- 72bbd71: feat(quick-32): add explicit sizes to all 11 column definitions with grow markers

Build: passed with zero TypeScript or lint errors.
