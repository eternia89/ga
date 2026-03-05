---
phase: quick-11
plan: 01
subsystem: ui-tables-modals
tags: [tables, modals, actions, ux-consistency]
dependency-graph:
  requires: []
  provides: [view-only-table-actions, modal-action-bars]
  affects: [job-columns, template-columns, schedule-columns, schedule-view-modal, asset-view-modal]
tech-stack:
  added: []
  patterns: [view-only-table-rows, modal-action-bars]
key-files:
  created: []
  modified:
    - components/jobs/job-columns.tsx
    - components/jobs/job-table.tsx
    - components/maintenance/template-columns.tsx
    - components/maintenance/template-list.tsx
    - components/maintenance/schedule-columns.tsx
    - components/maintenance/schedule-list.tsx
    - components/maintenance/schedule-view-modal.tsx
    - components/assets/asset-view-modal.tsx
decisions:
  - Table rows show only View button; all other actions moved to modals
  - Schedule modal Deactivate uses deleteSchedule (soft-delete) not deactivateSchedule (pause)
  - Asset modal sticky bar shows contextual buttons based on role + asset state + transfer state
metrics:
  duration: 3min
  completed: 2026-03-05
---

# Quick 11: Strip Table Row Actions, Add Modal Action Buttons

Consistent UX pattern: table rows only show View button; all entity actions (cancel, deactivate, pause, resume, transfer, status change) live in modal sticky bars.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Strip secondary actions from job, template, and schedule table columns | a71f72c | Removed Cancel/Deactivate/Reactivate/Pause/Resume buttons from 3 table action columns; cleaned up meta types and list components |
| 2 | Add Deactivate to schedule modal and action buttons to asset modal sticky bar | 785dd14 | Added Deactivate button to schedule modal; replaced asset modal info-only bar with Change Status, Transfer, Accept/Reject Transfer buttons |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript errors from removed meta type fields**
- **Found during:** Task 1
- **Issue:** schedule-list.tsx, template-list.tsx, and job-table.tsx passed removed fields to strictly-typed meta objects, causing TS compilation errors
- **Fix:** Cleaned up meta object literals in all 3 list/table components to only pass `onView`
- **Files modified:** components/maintenance/schedule-list.tsx, components/maintenance/template-list.tsx, components/jobs/job-table.tsx
- **Commit:** a71f72c

## Verification

- Build passes with zero errors
- Job table: only View button in actions column
- Template table: only View button in actions column
- Schedule table: only View button in actions column
- Schedule modal sticky bar: Pause/Resume + Deactivate buttons
- Asset modal sticky bar: Change Status, Transfer, Accept/Reject Transfer (contextual)

## Self-Check: PASSED
