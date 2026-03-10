---
phase: quick-28
plan: 01
subsystem: jobs
tags: [validation, request-linking, access-control]
dependency_graph:
  requires: []
  provides: [request-job-linking-rules]
  affects: [job-creation, job-editing, eligible-requests-dropdown]
tech_stack:
  added: []
  patterns: [server-side-validation, defense-in-depth-filtering]
key_files:
  created: []
  modified:
    - app/actions/job-actions.ts
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/jobs/new/page.tsx
    - components/jobs/job-modal.tsx
decisions:
  - "PIC filter applied at data layer AND server action for defense in depth"
  - "Edit modal preserves current job's own linked requests in dropdown (so user can see/unlink them)"
  - "requestJobLinks fetch removed from create flows since already-linked requests are excluded"
metrics:
  duration: 7min
  completed: "2026-03-09"
---

# Quick Task 28: Request-Job Linking Rules Summary

Server-side validation + data-layer filtering enforcing 3 request-job linking rules: PIC-only linking, status restriction (triaged/in_progress only), and one-request-per-job uniqueness.

## What Was Done

### Task 1: Server-side validation in createJob and updateJob
- Added 3-rule validation block in `createJob` before job insert:
  - Rule 2: Rejects requests not in triaged/in_progress status
  - Rule 3: Rejects requests already linked to another job
  - Rule 1: Rejects requests not assigned to current user as PIC
- Added same 3-rule validation in `updateJob` for `toAdd` array only (newly linked requests)
  - Rule 3 excludes current job's own links when checking duplicates
- Changed request status update to only move `triaged` requests to `in_progress` (skip already `in_progress`)
- **Commit:** b2d5d3d

### Task 2: Filter eligible requests in all 3 data-fetching locations
- Added `assigned_to` to eligible requests select query in all 3 locations
- `jobs/page.tsx`: Fetches all linked request IDs, filters out already-linked, then filters by PIC
- `jobs/new/page.tsx`: Same filtering logic as jobs page
- `job-modal.tsx`: Same filtering but preserves current job's own linked requests in edit mode
- Removed unnecessary `requestJobLinks` fetch in create flows (no linked requests will appear)
- **Commit:** c79afce

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors (only pre-existing e2e test error unrelated to changes)
- Full `npm run build` passes successfully
- All 3 rules enforced at both server action and data layer (defense in depth)

## Self-Check: PASSED
