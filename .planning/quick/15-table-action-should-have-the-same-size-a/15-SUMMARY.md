---
phase: quick-15
plan: 01
subsystem: ui
tags: [styling, tables, consistency]
dependency-graph:
  requires: []
  provides: [consistent-action-button-styling]
  affects: [all-table-views]
tech-stack:
  patterns: [blue-link-action-buttons]
key-files:
  modified:
    - components/requests/request-columns.tsx
    - components/jobs/job-columns.tsx
    - components/assets/asset-columns.tsx
    - components/maintenance/template-columns.tsx
    - components/maintenance/schedule-columns.tsx
    - components/admin/companies/company-columns.tsx
    - components/admin/divisions/division-columns.tsx
    - components/admin/locations/location-columns.tsx
    - components/admin/categories/category-columns.tsx
    - components/admin/users/user-columns.tsx
decisions:
  - Audit trail columns skipped - no action buttons present (only entity links)
metrics:
  duration: 1min
  completed: 2026-03-06
---

# Quick Task 15: Table Action Button Blue Link Styling Summary

Updated all table action buttons (View/Edit) to use blue link styling with matching font size across 10 column files.

## What Changed

Replaced `text-xs` with `text-sm text-blue-600 hover:underline` on every Button used as a row action in all table column definitions:

- **5 operational tables:** requests, jobs, assets, templates, schedules
- **5 admin tables:** companies, divisions, locations, categories, users
- **Skipped:** audit-trail-columns.tsx (no action buttons, only entity links)

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update action button styling across all column files | d733641 | 10 column files |

## Deviations from Plan

None - plan executed exactly as written. Audit trail correctly identified as having no action buttons to update.

## Verification

- All 10 files contain `text-blue-600` on action buttons
- No remaining `text-xs` on any action button
- Build passes with no errors

## Self-Check: PASSED
