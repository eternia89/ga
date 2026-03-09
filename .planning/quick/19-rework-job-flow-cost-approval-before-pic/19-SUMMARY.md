---
phase: quick-19
plan: 01
subsystem: jobs
tags: [job-workflow, approval, cost, pic-assignment]
dependency_graph:
  requires: []
  provides: [requestApproval-action, cost-approval-before-work-gate]
  affects: [job-actions, approval-actions, job-modal, job-form, job-detail-actions]
tech_stack:
  added: []
  patterns: [status-dependent-bottom-bar, auto-approve-zero-cost]
key_files:
  created: []
  modified:
    - lib/validations/job-schema.ts
    - app/actions/job-actions.ts
    - app/actions/approval-actions.ts
    - components/jobs/job-form.tsx
    - components/jobs/job-modal.tsx
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-detail-client.tsx
decisions:
  - "requestApproval action is PIC-only, auto-approves cost=0 without going to pending_approval"
  - "approveJob transitions to assigned (not in_progress) so PIC must click Start Work"
  - "rejectJob transitions to assigned so PIC can re-enter cost"
  - "canStartWork requires approved_at to be set"
  - "Form uses different Zod schema per mode (createJobSchema vs updateJobSchema)"
metrics:
  duration_minutes: 7
  completed: 2026-03-09
---

# Quick Task 19: Rework Job Flow — Cost Approval Before Work Starts

Reworked job lifecycle so PIC enters cost and requests approval before starting work. New flow: Create -> Assign PIC (bottom bar) -> PIC enters cost + Request Approval -> Finance approves -> PIC clicks Start Work.

## Tasks Completed

### Task 1: Update server actions and schema for new job flow
**Commit:** a7cf71e

- Removed `assigned_to` and `estimated_cost` from `createJobSchema` (kept in updateJobSchema for edit mode)
- Removed `assigned_to` and `estimated_cost` from `createJob` insert and auto-transition block
- Removed PIC/cost auto-transition and notification logic from `updateJob`
- Added `approved_at` to `updateJobStatus` select query; replaced auto-routing to pending_approval with approved_at gate that throws error if not set
- Created new `requestApproval` action: PIC-only, validates status=assigned, auto-approves cost=0 (sets approved_at without status change), routes cost>0 to pending_approval with finance notification
- Changed `approveJob` to transition pending_approval -> assigned (not in_progress), updated notification body
- Changed `rejectJob` to transition pending_approval -> assigned (not in_progress)
- Updated job-form.tsx to use mode-based schema resolver and hide PIC/cost fields in create mode

### Task 2: Update UI — form fields and bottom bar workflow actions
**Commit:** dee9adc

- Added `canAssignPIC` and `canRequestApproval` permission flags to job-modal.tsx and job-detail-actions.tsx
- Updated `canStartWork` to require `approved_at` in both modal and detail actions
- Modal bottom bar: PIC Combobox + Assign button when status=created (GA Lead/Admin)
- Modal bottom bar: cost input (Rp prefix) + Request Approval button when status=assigned and not approved (PIC)
- Detail page bottom bar: same PIC assign and cost approval sections with identical handlers
- Updated reject budget dialog text from "In Progress" to "Assigned"
- Passed users prop to JobDetailActions via JobDetailClient

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Form schema mismatch after removing fields from createJobSchema**
- **Found during:** Task 1
- **Issue:** Removing assigned_to/estimated_cost from createJobSchema caused TypeScript errors in job-form.tsx since form fields still referenced these schema fields
- **Fix:** Changed form to use mode-based schema resolver (createJobSchema for create, updateJobSchema for edit) and wrapped PIC/cost FormField blocks in `{mode === 'edit' && (...)}` conditionals. Used `any` type for form to handle dual schema.
- **Files modified:** components/jobs/job-form.tsx

## Known Issues

- Pre-existing TypeScript error in `components/admin/categories/category-form-dialog.tsx` (SafeActionResult type mismatch) blocks `npm run build`. This is unrelated to this task's changes and exists on main branch.

## Self-Check: PASSED
