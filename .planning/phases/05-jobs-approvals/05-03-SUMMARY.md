---
phase: 05-jobs-approvals
plan: 03
subsystem: ui
tags: [nextjs, react, typescript, supabase, shadcn-ui, timeline, comments, photo-upload]

# Dependency graph
requires:
  - phase: 05-01
    provides: job types, server actions, photo upload API
  - phase: 05-02
    provides: job detail page scaffold, badge components, action button stubs

provides:
  - Full job detail page /jobs/[id] with two-column layout
  - Unified timeline merging audit events + comments chronologically with type-specific icons
  - Comment form with optional single photo upload (5MB limit, JPEG/PNG/WebP)
  - Context-sensitive action buttons for all job statuses and roles
  - PhotoLightbox integration for comment photos in timeline

affects: [05-04-approval-queue-ui, 05-05-acceptance-cycle-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Unified timeline pattern: merge audit events + job comments, sort by getTime(), render with ScrollArea
    - Two-step photo upload: addJobComment returns commentId, then POST to /api/uploads/job-photos
    - Context-sensitive action matrix: role x status determines available buttons

key-files:
  created: []
  modified:
    - app/(dashboard)/jobs/[id]/page.tsx
    - components/jobs/job-detail-client.tsx
    - components/jobs/job-detail-info.tsx
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-timeline.tsx
    - components/jobs/job-comment-form.tsx
    - components/jobs/job-status-badge.tsx
    - components/jobs/job-priority-badge.tsx
    - app/actions/job-actions.ts

key-decisions:
  - "Plan 02 had already created full stubs of job detail page, info, client, actions, badges — plan 03 upgraded them"
  - "addJobComment updated to return commentId for two-step photo upload (previously returned only success:true)"
  - "JobTimeline upgraded from simple list to ScrollArea with type-specific icons, date-fns formatting, and photo lightbox"
  - "JobCommentForm upgraded with single photo upload: file input, preview, remove, and two-step submit pattern"
  - "Pending Approval indicator (non-approver roles) shows animated spinner to communicate awaiting state"

# Metrics
duration: 12min
completed: 2026-02-25
---

# Phase 5 Plan 3: Job Detail Page with Unified Timeline Summary

**Upgraded job detail UI from plan 02 stubs to full implementation: unified timeline with icons/lightbox, comment form with photo upload, and addJobComment returning commentId for two-step upload**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-24T22:33:25Z
- **Completed:** 2026-02-24T22:45:23Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Full job detail page at `/jobs/[id]` with two-column layout (info panel left, timeline+comments right), breadcrumb navigation, IDR-formatted estimated cost, and linked request inline previews
- Unified chronological timeline merging audit log events and job comments with 8 event type icons, color-coded badges, approval rejection reason highlighted prominently, and ScrollArea for overflow
- Comment form with optional single photo upload (JPEG/PNG/WebP, max 5MB): file picker, preview thumbnail, remove button, two-step submit (create comment → upload photo with commentId)
- Context-sensitive action buttons covering all status transitions: Assign/Reassign (dialog + combobox), Start Work, Submit for Approval, Approve, Reject (dialog + textarea), Mark Complete, Cancel (AlertDialog)

## Task Commits

1. **Tasks 1 & 2: Job detail page, timeline, comment form** - `18a18ba` (feat)

## Files Created/Modified

- `app/(dashboard)/jobs/[id]/page.tsx` - Full server component: parallel fetch (audit logs, comments, media, users), audit log classification into timeline events, resolved performer names, breadcrumb, JobDetailClient
- `components/jobs/job-detail-client.tsx` - Two-column layout wrapper: left (info + actions), right (timeline + comment form), router.refresh on action success
- `components/jobs/job-detail-info.tsx` - Full info panel: IDR cost display, dl grid of all fields, linked request inline previews with status badges, rejection reason callout
- `components/jobs/job-detail-actions.tsx` - Role+status action matrix: Assign/Reassign dialog, Start Work, Submit for Approval, Approve, Reject dialog, Mark Complete, Cancel AlertDialog — all with InlineFeedback
- `components/jobs/job-timeline.tsx` - Upgraded from basic list to ScrollArea + icons + date-fns + PhotoLightbox for comment photos
- `components/jobs/job-comment-form.tsx` - Added photo upload: file input (accept image/*), FileReader preview, 5MB validation, two-step submit with commentId
- `components/jobs/job-status-badge.tsx` - Job status badge using JOB_STATUS_LABELS/COLORS
- `components/jobs/job-priority-badge.tsx` - Job priority badge using PRIORITY_LABELS/COLORS
- `app/actions/job-actions.ts` - addJobComment now returns `{ success: true, commentId: comment.id }` for photo upload

## Decisions Made

- Plan 02 had pre-created stubs for the job detail page — plan 03's job was to upgrade them to full production quality
- `addJobComment` was updated to return `commentId` (was returning only `success: true`) — required for the two-step photo upload pattern established in plan 01
- Timeline uses `JobTimelineEventType` from plan 02 definition which includes all 8 event types (created, assignment, status_change, approval_submitted, approval, approval_rejection, cancellation, field_update)
- The `comment` type entry in `JobTimelineEventType` is not used as a separate event — comments are rendered directly from the `comments` prop with their own icon style

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] addJobComment returns commentId for photo upload**
- **Found during:** Task 2 (comment form implementation)
- **Issue:** `addJobComment` returned only `{ success: true }` but the two-step photo upload pattern (established in 05-01) requires the `commentId` to attach media as `entity_id='job_comment'` in the upload API
- **Fix:** Updated insert to use `.select('id').single()`, returns `{ success: true, commentId: comment.id }`
- **Files modified:** app/actions/job-actions.ts
- **Verification:** TypeScript clean; photo upload flow in comment form now correctly passes commentId
- **Committed in:** 18a18ba

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential fix for the two-step photo upload pattern. Without commentId, comment photos could not be uploaded.

## Issues Encountered

None — plan 02 had created solid stubs. Plan 03 focused on upgrading them to full quality. TypeScript compilation passed clean.

## Self-Check: PASSED

Files verified:
- FOUND: app/(dashboard)/jobs/[id]/page.tsx (366 lines)
- FOUND: components/jobs/job-detail-client.tsx (89 lines)
- FOUND: components/jobs/job-detail-info.tsx (241 lines)
- FOUND: components/jobs/job-detail-actions.tsx (442 lines)
- FOUND: components/jobs/job-timeline.tsx (307 lines)
- FOUND: components/jobs/job-comment-form.tsx (204 lines)

Commits verified:
- FOUND: 18a18ba feat(05-03): job detail page with full info panel, actions, and timeline
