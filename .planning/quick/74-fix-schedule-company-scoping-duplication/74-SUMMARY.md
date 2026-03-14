---
phase: quick-74
plan: 01
subsystem: maintenance
tags: [schedule, company-column, multi-company, ux]
dependency_graph:
  requires: [quick-55, quick-58]
  provides: [schedule-company-visibility]
  affects: [maintenance-page, schedule-columns, schedule-view-modal]
tech_stack:
  patterns: [supabase-fk-join, fk-array-normalization, tanstack-table-column]
key_files:
  created: []
  modified:
    - lib/types/maintenance.ts
    - app/(dashboard)/maintenance/page.tsx
    - components/maintenance/schedule-columns.tsx
    - components/maintenance/schedule-view-modal.tsx
decisions:
  - Company column shown for all users (not conditionally) for simplicity and consistency
metrics:
  duration_minutes: 2
  completed: "2026-03-14T05:11:33Z"
---

# Quick Task 74: Fix Schedule Company Scoping / Duplication Summary

Company column added to maintenance schedules table with FK join from companies table, so multi-company admins can distinguish which company each schedule belongs to.

## What Was Done

### Task 1: Add company join to type, queries, and normalization (535a50b)
- Added `company?: { name: string } | null` to `MaintenanceSchedule` type in `lib/types/maintenance.ts`
- Added `company:companies(name)` FK join to the server-side schedule query in `app/(dashboard)/maintenance/page.tsx`
- Added FK array normalization for company (`Array.isArray` guard) in the schedule list mapping
- Added same `company:companies(name)` join and normalization to client-side modal fetch in `components/maintenance/schedule-view-modal.tsx`

### Task 2: Add Company column to schedule table (55c2f04)
- Inserted Company column in `components/maintenance/schedule-columns.tsx` after the Asset column and before Interval
- Column renders company name from joined relation with dash fallback for null
- Column sized at 160px matching the established pattern from `division-columns.tsx`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes (only pre-existing e2e test error unrelated to changes)
- `npm run build` succeeds with clean output
- Schedule table renders Company column between Asset and Interval columns

## Self-Check

- [x] lib/types/maintenance.ts modified with company join type
- [x] app/(dashboard)/maintenance/page.tsx modified with company query and normalization
- [x] components/maintenance/schedule-columns.tsx modified with Company column
- [x] components/maintenance/schedule-view-modal.tsx modified with company query and normalization
- [x] Commit 535a50b exists
- [x] Commit 55c2f04 exists
