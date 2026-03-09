---
phase: quick-18
plan: 1
subsystem: jobs
tags: [security, ui, server-guard]
dependency_graph:
  requires: []
  provides: [pic-lock-guard]
  affects: [job-form, job-modal, job-actions]
tech_stack:
  added: []
  patterns: [server-side-guard, prop-based-field-lock]
key_files:
  created: []
  modified:
    - app/actions/job-actions.ts
    - components/jobs/job-form.tsx
    - components/jobs/job-modal.tsx
decisions:
  - PIC_EDITABLE_STATUSES whitelist approach (created, assigned) rather than blacklist
  - picLocked as independent prop separate from readOnly for granular field control
metrics:
  duration: 1min
  completed: 2026-03-06T07:47:20Z
---

# Quick Task 18: Lock PIC Field Once Job Status Moves Past Assigned

Server-side guard in updateJob rejects PIC changes on in-progress+ jobs; UI locks PIC Combobox via new picLocked prop while keeping other fields editable.

## Changes Made

### Task 1: Add server-side guard and UI picLocked prop

**Server guard (app/actions/job-actions.ts):**
- Added `PIC_EDITABLE_STATUSES = ['created', 'assigned']` whitelist
- Guard throws "Cannot change PIC after work has started" when `assigned_to` is sent for jobs past assigned status
- Placed after field extraction, before any DB writes

**UI picLocked prop (components/jobs/job-form.tsx):**
- Added `picLocked?: boolean` to JobFormProps interface (defaults to false)
- PIC Combobox disabled condition: `disabled={disabled || picLocked}`
- Independent from readOnly -- other fields remain editable when only PIC is locked

**picLocked computation (components/jobs/job-modal.tsx):**
- `const picLocked = !!job && !['created', 'assigned'].includes(job.status)`
- Passed to JobForm alongside readOnly prop
- GA Lead editing in_progress job: other fields editable, PIC locked

**Commit:** ab78e9b

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- TypeScript: No errors in modified files (pre-existing errors in unrelated admin form dialogs unchanged)
- All three files compile cleanly

## Self-Check: PASSED
