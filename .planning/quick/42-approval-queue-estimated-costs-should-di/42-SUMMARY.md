---
phase: quick-42
plan: "01"
subsystem: approvals
tags: [styling, table, quick-fix]
dependency_graph:
  requires: []
  provides: []
  affects: [components/approvals/approval-queue.tsx]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - components/approvals/approval-queue.tsx
decisions:
  - "Removed text-base from estimated cost span; font-semibold retained for visual weight without size mismatch"
metrics:
  duration: "2 min"
  completed_date: "2026-03-10"
---

# Phase quick-42 Plan 01: Approval Queue Estimated Cost Font Size Fix Summary

**One-liner:** Removed `text-base` from the estimated cost table cell span so it inherits the table default `text-sm`, matching all other columns while preserving `font-semibold`.

## What Was Done

Removed the `text-base` class from the `<span>` wrapping `formatIDR(job.estimated_cost)` in `components/approvals/approval-queue.tsx`. The cost value was rendering one font size larger than all surrounding table cells (Job ID, Title, PIC, Date), breaking the visual rhythm of the table. The fix was surgical — only the class attribute on the span was changed. `font-semibold` was preserved.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Remove text-base from estimated cost cell | 783110e | components/approvals/approval-queue.tsx |

## Verification

- `grep -n "estimated_cost"` confirmed `font-semibold` only in span className (no `text-base`)
- `npm run build` completed successfully with no type errors

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] `components/approvals/approval-queue.tsx` modified and committed
- [x] Commit 783110e exists
- [x] Build passes
