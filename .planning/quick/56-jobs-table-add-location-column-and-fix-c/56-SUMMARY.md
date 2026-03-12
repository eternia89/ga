---
phase: quick-56
plan: 01
subsystem: jobs-table
tags: [table, columns, jobs, ui]
key-files:
  modified:
    - components/jobs/job-columns.tsx
decisions:
  - "Status column fixed at size 150 to accommodate longest label (Pending Completion Approval) without wrapping"
  - "Linked Requests column removed — not part of target column pattern, clutters table"
  - "Location column uses accessorFn so TanStack Table can still sort/filter on the value while cell renders via row.original"
metrics:
  duration: "3min"
  completed: "2026-03-12"
  tasks: 1
  files: 1
---

# Quick Task 56: Jobs Table — Split ID/Status, Add Location, Fix Column Order Summary

**One-liner:** Jobs table restructured with separate ID/Status columns, new Location column, and Linked Requests removed — matching the Requests table pattern.

## What Was Done

### Task 1: Restructure job-columns.tsx

Rewrote the `jobColumns` array in `components/jobs/job-columns.tsx`:

**Before:**
- Column order: ID+Status (combined cell), Photo, Title, PIC, Priority, Linked Requests, Created, Actions
- ID column rendered both `font-mono` display_id AND `JobStatusBadge` in one cell
- No Location column

**After:**
- Column order: ID, Status, Photo, Title, Location, Priority, PIC, Created, Actions
- ID column (size 160): renders only `<span className="font-mono text-xs">` — no badge
- Status column (size 150, enableSorting: false): renders `<JobStatusBadge />` standalone
- Location column (id: location_name, size 130): renders `location?.name` or `—` dash
- Linked Requests column removed entirely

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `components/jobs/job-columns.tsx` modified
- [x] Build passes with 0 TypeScript errors
- [x] jobColumns has 9 columns in correct order
- [x] Status is a standalone column with `accessorKey: 'status'`
- [x] Location column renders `row.original.location?.name` or `—`
- [x] Linked Requests column removed

## Self-Check: PASSED
