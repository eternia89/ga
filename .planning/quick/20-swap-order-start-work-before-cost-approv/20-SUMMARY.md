---
phase: quick-20
plan: 01
subsystem: jobs
tags: [workflow, job-flow, approval]
dependency_graph:
  requires: []
  provides: [swapped-job-flow]
  affects: [job-actions, approval-actions, job-modal, job-detail-actions, job-form]
tech_stack:
  added: []
  patterns: [start-work-before-approval]
key_files:
  created: []
  modified:
    - app/actions/job-actions.ts
    - app/actions/approval-actions.ts
    - components/jobs/job-modal.tsx
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-form.tsx
decisions:
  - Removed approved_at gate from updateJobStatus to allow assigned -> in_progress without approval
  - requestApproval now requires in_progress status (PIC fills cost while working)
  - approveJob and rejectJob both return to in_progress (not assigned)
  - estimated_cost field removed from job form body entirely (cost handled in bottom bar only)
metrics:
  duration: 5min
  completed: 2026-03-09
---

# Quick Task 20: Swap Order -- Start Work Before Cost Approval

Swapped job flow from Assign->Cost->Approval->Work to Assign->Work->Cost->Approval so PIC can start immediately.

## Changes Made

### Task 1: Server Actions (cba1016)

**job-actions.ts:**
- Removed `approved_at` gate from `updateJobStatus` -- PIC can now transition assigned -> in_progress without budget approval
- Changed `requestApproval` status guard from `assigned` to `in_progress` -- PIC requests approval while working
- Updated status change record from_status to `in_progress` (was `assigned`)

**approval-actions.ts:**
- `approveJob`: Changed target status from `assigned` to `in_progress` -- after approval, work continues
- `rejectJob`: Changed target status from `assigned` to `in_progress` -- after rejection, PIC revises while working
- Updated notification text to reflect new flow

### Task 2: UI Components (707719c)

**job-modal.tsx & job-detail-actions.tsx:**
- `canStartWork` = `isPIC && status === 'assigned'` (removed `approved_at` requirement)
- `canRequestApproval` = `isPIC && status === 'in_progress' && !approved_at`
- Reordered bottom bar: Start Work button first, cost input + Request Approval second
- Updated reject dialog text: "return to In Progress" (was "return to Assigned")
- Updated auto-approve message (removed "You can now start work")

**job-form.tsx:**
- Removed estimated_cost FormField entirely -- cost is handled exclusively in bottom bar
- Removed unused `formatNumber` import

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript compilation passes for all modified files (zero errors in our files)
- Pre-existing build error in category-form-dialog.tsx (unrelated, out of scope)
- Flow logic verified: assigned PIC can start work without approval
- Flow logic verified: in_progress PIC can fill cost and request approval
- Flow logic verified: approved/rejected jobs return to in_progress
- estimated_cost field not present in job form body

## Self-Check: PASSED
