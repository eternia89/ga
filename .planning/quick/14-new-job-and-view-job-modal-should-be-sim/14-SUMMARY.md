---
phase: quick-14
plan: 01
subsystem: jobs
tags: [ui, modal, unification, forms]
dependency_graph:
  requires: [job-form, job-view-modal, job-create-dialog, job-detail-info]
  provides: [unified-job-modal]
  affects: [jobs-page, job-table]
tech_stack:
  patterns: [unified-modal-pattern, thin-wrapper-delegation, form-mode-switching]
key_files:
  created:
    - components/jobs/job-modal.tsx
  modified:
    - components/jobs/job-form.tsx
    - components/jobs/job-create-dialog.tsx
    - components/jobs/job-view-modal.tsx
decisions:
  - "Single JobModal component handles both create (700px) and view (800px) modes"
  - "JobForm extended with edit mode using createJobSchema resolver for both modes (updateJob action called on submit in edit mode)"
  - "View mode fetches eligible requests and request-job links client-side for inline editing"
  - "LinkedRequestDetails in read-only mode rendered as clickable buttons with RequestPreviewDialog"
metrics:
  duration: 7min
  completed: 2026-03-06
---

# Quick Task 14: Unify Job Create and View Modals Summary

Unified JobModal component sharing same JobForm layout for create and view/edit modes, replacing separate JobCreateDialog form rendering and JobDetailInfo compact grid with a single consistent form.

## What Was Done

### Task 1: Extend JobForm for edit mode (f6be202)
- Added `jobId`, `initialData`, `readOnly`, `linkedRequestDetails` props
- Edit mode calls `updateJob` action instead of `createJob`
- `readOnly` prop disables all form fields for non-editable view
- Read-only linked requests render as clickable buttons opening `RequestPreviewDialog`
- Exported `EligibleRequest` type for reuse by JobModal
- Create mode behavior completely unchanged

### Task 2: Create unified JobModal (c7286e4)
- Built `JobModal` component with `mode` prop ('create' | 'view')
- Create mode: 700px dialog, JobForm only, closes on success
- View mode: 800px dialog with header (display_id, status/priority badges, prev/next nav), split layout (form left, timeline right), sticky action bar
- Full data fetching from Supabase: job + relations, audit logs, comments, comment photos, categories, locations, users, eligible requests, request-job links
- Expanded job_requests query to include description, priority, created_at, location, category, requester for RequestPreviewDialog compatibility
- All action handlers: Start Work, Approve/Reject Budget, Approve/Reject Completion, Mark Complete, Cancel
- Sub-dialogs: Reject Budget, Reject Completion, Cancel Job AlertDialog
- PM Checklist rendering for preventive_maintenance jobs
- GPS capture via useGeolocation hook for Start Work and Mark Complete
- URL sync, timeline scroll-to-bottom, loading/error states with skeleton UI

### Task 3: Convert wrappers to thin delegates (8d37a63)
- `JobCreateDialog`: manages open state + trigger Button, delegates to `<JobModal mode="create">`
- `JobViewModal`: passes all props through to `<JobModal mode="view">`
- Props interfaces unchanged -- no changes needed in consumers (job-table.tsx, jobs/page.tsx)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used createJobSchema for both modes instead of updateJobSchema.omit()**
- **Found during:** Task 1
- **Issue:** `updateJobSchema.omit({ id: true })` makes all fields optional, causing TS mismatch with submit handler expecting required fields
- **Fix:** Use `createJobSchema` as resolver for both modes (validation is the same for form fields); the edit mode just calls `updateJob` on submit instead
- **Files modified:** components/jobs/job-form.tsx

**2. [Rule 1 - Bug] Expanded job_requests select query for RequestPreviewDialog compatibility**
- **Found during:** Task 2
- **Issue:** Original view modal query only selected `id, display_id, title, status` for linked requests, but `RequestPreviewDialog` requires `description, priority, created_at, location, category, requester`
- **Fix:** Expanded the Supabase select to include all required fields
- **Files modified:** components/jobs/job-modal.tsx

## Decisions Made

1. Combined Tasks 2 and 3 into a single JobModal file since the action bar, sub-dialogs, and PM checklist are integral parts of the view mode layout
2. View mode fetches eligible requests and request-job links client-side (not passed from parent) to enable inline editing of linked requests

## Self-Check: PASSED

All files exist. All commits verified.
