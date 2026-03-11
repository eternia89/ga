---
phase: quick-45
plan: 01
subsystem: ui/view-modals
tags: [ui, consistency, headers, badges, creator]
dependency_graph:
  requires: []
  provides: [consistent-two-line-modal-headers]
  affects: [request-view-modal, job-modal, asset-view-modal, schedule-view-modal, template-view-modal]
tech_stack:
  added: []
  patterns: [two-line-header-pattern]
key_files:
  created: []
  modified:
    - components/requests/request-view-modal.tsx
    - components/jobs/job-modal.tsx
    - components/assets/asset-view-modal.tsx
    - components/maintenance/schedule-view-modal.tsx
    - components/maintenance/template-view-modal.tsx
decisions:
  - "Asset/schedule/template creator name fetched via Supabase FK join (created_by_user:user_profiles!created_by) and stored in local creatorName state rather than modifying InventoryItemWithRelations type"
  - "Schedule/template context info (asset name, interval, category, checklist count) kept as 3rd line (p.text-sm.text-muted-foreground.mt-0.5) below the two-line header for additional context"
metrics:
  duration: 8min
  completed_date: 2026-03-11
  tasks: 2
  files_modified: 5
---

# Quick Task 45: Consistent Two-Line View Modal Headers — Summary

**One-liner:** Standardized all 5 view modal headers to display primary identifier alone on line 1 and status badge + "Created by" on line 2.

## What Was Built

Applied identical two-line header structure across all 5 domain entity view modals:

- **Line 1:** Primary identifier only (`h2 font-mono` for display IDs, plain `h2` for names) — no badges
- **Line 2:** Status/active badge + priority badge (if applicable) + PM badge (jobs only) + `"Created dd-MM-yyyy by Name"` text

Additionally:
- Added `created_by_user:user_profiles!created_by(full_name)` to Supabase select queries for asset, schedule, and template modals (previously missing)
- Added `creatorName` state (with reset on close) to the three modals that needed it

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Fix request and job view modal headers | 7e5c573 |
| 2 | Fix asset, schedule, template modal headers + creator data | 4dd4341 |

## Header Structure Per Modal

| Modal | Line 1 | Line 2 |
|-------|--------|--------|
| Request | `display_id` (font-mono) | `RequestStatusBadge` + `PriorityBadge` + "Created by Name · Division" |
| Job | `display_id` (font-mono) | `JobStatusBadge` + `PriorityBadge` + PM badge + "Created by Name" |
| Asset | `display_id` (font-mono) | `AssetStatusBadge` + "Created by Name" |
| Schedule | template `name` | `ScheduleStatusBadge` + "Created by Name" |
| Template | template `name` | Active/Inactive badge span + "Created by Name" |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

Files exist:
- components/requests/request-view-modal.tsx: FOUND
- components/jobs/job-modal.tsx: FOUND
- components/assets/asset-view-modal.tsx: FOUND
- components/maintenance/schedule-view-modal.tsx: FOUND
- components/maintenance/template-view-modal.tsx: FOUND

Commits exist:
- 7e5c573: FOUND
- 4dd4341: FOUND

Build: PASSED (zero TypeScript errors)

## Self-Check: PASSED
