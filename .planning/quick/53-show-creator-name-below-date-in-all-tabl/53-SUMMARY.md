---
phase: quick-53
plan: "01"
subsystem: tables
tags: [ui, tables, requests, jobs]
dependency_graph:
  requires: []
  provides: [two-line-created-cell-requests, two-line-created-cell-jobs]
  affects: [components/requests/request-columns.tsx, components/jobs/job-columns.tsx]
tech_stack:
  added: []
  patterns: [two-line table cell]
key_files:
  modified:
    - components/requests/request-columns.tsx
    - components/jobs/job-columns.tsx
decisions:
  - Creator name conditionally rendered only when truthy — no 'by —' fallback for null
  - Column size increased from 100 to 130 to accommodate two-line layout
  - No query changes required — requester and created_by_user already fetched
metrics:
  duration: 4min
  completed: 2026-03-12
---

# Phase quick-53 Plan 01: Show Creator Name Below Date in All Tables Summary

**One-liner:** Added two-line Created cells to Requests and Jobs tables showing date on line 1 and "by {creator name}" in muted xs text on line 2.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add creator second line to Requests Created column | 10657be |
| 2 | Add creator second line to Jobs Created column | b2fa42b |

## What Was Built

Both the Requests table and Jobs table Created columns now display:
- Line 1: date formatted as `dd-MM-yyyy` (existing behavior, unchanged)
- Line 2: `by {creator name}` in `text-xs text-muted-foreground` — rendered only when the creator name is available

**Requests table** uses `row.original.requester?.name` — the `requester` join was already selected in `/requests/page.tsx` (`user_profiles!requester_id(name:full_name, email)`).

**Jobs table** uses `row.original.created_by_user?.full_name` — the `created_by_user` join was already selected in `/jobs/page.tsx` (`user_profiles!created_by(full_name)`).

No server-side query changes were needed. The creator data was already present in the existing Supabase select queries.

Column size increased from 100 to 130 on both columns to accommodate the wider two-line layout.

## Tables Intentionally Out of Scope

- `asset-columns.tsx` — no Created column
- `schedule-columns.tsx` — no Created column
- `template-columns.tsx` — `maintenance_templates` has no `created_by` FK column

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

Files modified exist and contain expected changes:
- `components/requests/request-columns.tsx` — contains `by {creatorName}` pattern, size 130
- `components/jobs/job-columns.tsx` — contains `by {creatorName}` pattern, size 130

Commits verified:
- 10657be — feat(quick-53): add creator second line to Requests Created column
- b2fa42b — feat(quick-53): add creator second line to Jobs Created column

Build: passed with zero errors.
