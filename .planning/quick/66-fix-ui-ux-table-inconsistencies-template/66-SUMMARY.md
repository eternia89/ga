---
phase: quick-66
plan: 01
subsystem: ui/tables
tags: [ui, tables, columns, permissions, breadcrumb]
dependency_graph:
  requires: []
  provides: [consistent-table-name-wrapping, created-columns-assets-schedules, assets-view-all-permission]
  affects: [asset-columns, schedule-columns, template-columns, job-columns, permissions, sidebar, inventory-new-page]
tech_stack:
  added: []
  patterns: [tanstack-table-column-def, date-fns-formatting]
key_files:
  created: []
  modified:
    - components/maintenance/template-columns.tsx
    - components/jobs/job-columns.tsx
    - app/(dashboard)/inventory/new/page.tsx
    - components/assets/asset-columns.tsx
    - components/maintenance/schedule-columns.tsx
    - lib/auth/permissions.ts
    - components/sidebar.tsx
decisions:
  - "Creator line omitted from Created columns for assets, schedules, and templates — inventory_items, maintenance_schedules, maintenance_templates have no created_by column in DB schema (migration 00001 confirmed); date-only format is correct"
  - "ASSETS_VIEW_ALL key replaces INVENTORY_VIEW_ALL; runtime value 'inventory:view:all' unchanged so no DB/RLS impact"
metrics:
  duration: 8min
  completed_date: "2026-03-13"
  tasks: 2
  files: 7
---

# Quick Task 66: Fix UI/UX Table Inconsistencies (Template) — Summary

**One-liner:** Fixed 6 UI/UX inconsistencies: template name truncation, job title font size, breadcrumb label, missing Created columns on assets/schedules tables, and INVENTORY_VIEW_ALL permission constant rename.

## What Was Done

### Task 1: Template name truncation, job title text-sm, breadcrumb

| File | Change |
|------|--------|
| `components/maintenance/template-columns.tsx` | Name cell: replaced `truncate` with `whitespace-normal break-words` |
| `components/jobs/job-columns.tsx` | Title span: removed `text-sm` (font size now inherits from table defaults like all other content columns) |
| `app/(dashboard)/inventory/new/page.tsx` | Breadcrumb first segment: changed `'Inventory'` to `'Assets'` |

### Task 2: Created columns + INVENTORY_VIEW_ALL rename

| File | Change |
|------|--------|
| `components/assets/asset-columns.tsx` | Added `created_at` column (date only, `dd-MM-yyyy`, size 120) before actions column |
| `components/maintenance/schedule-columns.tsx` | Added `created_at` column (date only, `dd-MM-yyyy`, size 120) before actions column |
| `lib/auth/permissions.ts` | Renamed key `INVENTORY_VIEW_ALL` to `ASSETS_VIEW_ALL` (runtime value `'inventory:view:all'` unchanged); updated all 5 internal references |
| `components/sidebar.tsx` | Updated Assets nav item to use `PERMISSIONS.ASSETS_VIEW_ALL` |

## Note on Creator Line

The Created columns for assets, templates, and schedules show **date only** — no "by creator" line. This is intentional: `inventory_items`, `maintenance_templates`, and `maintenance_schedules` tables have no `created_by` column in the DB schema (confirmed in migration 00001). Adding a creator line would require a schema migration.

## Deviations from Plan

None — plan executed exactly as written.

## Build/Lint Status

- `npm run build`: PASSED — zero TypeScript errors
- `npm run lint`: Pre-existing warnings only (use-geolocation.ts setState-in-effect, seed-ops.ts unused vars, img tag warnings in asset/job columns); zero new errors introduced by these changes

## Self-Check: PASSED

- `components/maintenance/template-columns.tsx`: contains `whitespace-normal break-words`, no `truncate` on name cell — CONFIRMED
- `components/jobs/job-columns.tsx`: title span has no `text-sm` — CONFIRMED
- `app/(dashboard)/inventory/new/page.tsx`: breadcrumb label is `'Assets'` — CONFIRMED
- `components/assets/asset-columns.tsx`: `created_at` column present before actions — CONFIRMED
- `components/maintenance/schedule-columns.tsx`: `created_at` column present before actions — CONFIRMED
- `lib/auth/permissions.ts`: key is `ASSETS_VIEW_ALL`, runtime value `'inventory:view:all'` — CONFIRMED
- `components/sidebar.tsx`: uses `PERMISSIONS.ASSETS_VIEW_ALL` — CONFIRMED
- Zero remaining `INVENTORY_VIEW_ALL` references in source files — CONFIRMED
