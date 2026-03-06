---
phase: quick-17
plan: 01
subsystem: jobs
tags: [permissions, security, jobs]
dependency_graph:
  requires: []
  provides: [pic-only-start-work]
  affects: [job-modal, job-detail-actions, job-actions]
tech_stack:
  added: []
  patterns: [defense-in-depth-permissions]
key_files:
  created: []
  modified:
    - components/jobs/job-modal.tsx
    - components/jobs/job-detail-actions.tsx
    - app/actions/job-actions.ts
decisions:
  - "canStartWork restricted to isPIC only (removed isGaLeadOrAdmin) in both UI components"
  - "Server-side PIC check added before valid-transitions check for defense in depth"
metrics:
  duration_minutes: 2
  completed: 2026-03-06
---

# Quick Task 17: Restrict Start Work Action to PIC Only - Summary

PIC-only Start Work enforcement via UI button hiding plus server-side in_progress transition rejection for non-PIC users.

## What Was Done

### Task 1: Restrict canStartWork to PIC-only in both UI components
**Commit:** d1529b3

Changed `canStartWork` computation in both `job-modal.tsx` and `job-detail-actions.tsx` from `(isGaLeadOrAdmin || isPIC) && status === 'assigned'` to `isPIC && status === 'assigned'`. GA Lead/Admin who are not the PIC no longer see the Start Work button. All other permission checks (canMarkComplete, canEdit, canCancel, etc.) remain unchanged.

**Files modified:**
- `components/jobs/job-modal.tsx` (line 576)
- `components/jobs/job-detail-actions.tsx` (line 85)

### Task 2: Add server-side PIC enforcement for in_progress transition
**Commit:** 9bbd4f0

Added server-side guard in `updateJobStatus` action that rejects `in_progress` status transitions from non-PIC users with error message "Permission denied -- only the assigned PIC can start work". The check runs after the general permission gate (which allows GA Lead/Admin for other transitions) but before the valid-transitions check. Also updated the function comment to note the PIC-only restriction.

**Files modified:**
- `app/actions/job-actions.ts` (lines 356, 392-395)

## Deviations from Plan

None - plan executed exactly as written.

## Verification

1. grep confirms canStartWork uses isPIC only (no isGaLeadOrAdmin) in both UI files
2. grep confirms server-side PIC check for in_progress in job-actions.ts
3. TypeScript check on modified files passes cleanly (pre-existing build error in category-form-dialog.tsx is unrelated)

## Self-Check: PASSED
