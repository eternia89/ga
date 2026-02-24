---
phase: 05-jobs-approvals
plan: 02
subsystem: ui
tags: [nextjs, react, tanstack-table, nuqs, react-hook-form, zod, shadcn-ui, tailwind]

# Dependency graph
requires:
  - phase: 05-01
    provides: createJob/cancelJob server actions, createJobSchema, JobWithRelations type, JOB_STATUS_LABELS/COLORS/STATUSES, PRIORITIES constants
  - phase: 04-requests
    provides: request-submit-form pattern, request-table/filters/columns pattern, Combobox component, InlineFeedback component, DataTable component

provides:
  - /jobs/new page — GA Lead/Admin job creation with multi-request linking, prefill from request, PIC assignment
  - /jobs list page — server component fetching all company jobs with full relations
  - JobForm component — react-hook-form with multi-request chip selector and auto-priority calculation
  - JobTable component — client-side filtered TanStack Table with URL-synced nuqs state
  - JobFilters component — 7 filter controls (status, priority, PIC combobox, date range, search, My Assigned)
  - jobColumns TanStack column definitions — 7 columns with status/priority badges and actions dropdown
  - JobStatusBadge and JobPriorityBadge pill badge components
  - JobCancelDialog AlertDialog for safe cancellation
  - Job detail scaffold — JobDetailInfo, JobDetailActions, JobDetailClient, JobTimeline, JobCommentForm for /jobs/[id]

affects: [05-03-job-detail-ui, 05-04-approval-queue-ui, 05-05-acceptance-cycle-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Multi-request chip selector: Combobox adds to linked list, displayed as dismissible chips below
    - Auto-priority calculation: useEffect computes highest priority from linked request list
    - URL-synced job filters with nuqs jobFilterParsers (mirror of request filterParsers pattern)
    - JobTimelineEvent type with 8 event types (created, status_change, assignment, approval, approval_rejection, approval_submitted, cancellation, field_update)

key-files:
  created:
    - app/(dashboard)/jobs/new/page.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/jobs/[id]/page.tsx
    - components/jobs/job-form.tsx
    - components/jobs/job-table.tsx
    - components/jobs/job-columns.tsx
    - components/jobs/job-filters.tsx
    - components/jobs/job-status-badge.tsx
    - components/jobs/job-priority-badge.tsx
    - components/jobs/job-cancel-dialog.tsx
    - components/jobs/job-detail-info.tsx
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-detail-client.tsx
    - components/jobs/job-timeline.tsx
    - components/jobs/job-comment-form.tsx
  modified: []

key-decisions:
  - "JobTimelineEvent uses { type, at, by, details } structure matching the jobs/[id]/page.tsx audit log processor rather than { id, label, actor, timestamp, detail }"
  - "In-progress requests are included in eligibleRequests dropdown (not just triaged) so linked requests from other jobs can be re-linked without losing context"
  - "job-timeline.tsx, job-comment-form.tsx, job-detail-*.tsx included in plan 02 commit to fix TypeScript errors caused by pre-existing job-detail-client.tsx scaffold"

patterns-established:
  - "Pattern: Multi-request linking — Combobox adds to state array, useEffect syncs to RHF linked_request_ids field, chips rendered below dropdown"
  - "Pattern: PIC filter via Combobox — jobFilterParsers.pic_id synced to URL, client-side job.assigned_to comparison"

requirements-completed:
  - REQ-JOB-001
  - REQ-JOB-002
  - REQ-JOB-003
  - REQ-JOB-005
  - REQ-JOB-007
  - REQ-JOB-009

# Metrics
duration: 5min
completed: 2026-02-25
---

# Phase 5 Plan 2: Job Create and List UI Summary

**Next.js /jobs/new creation form with multi-request chip linking and auto-priority, and /jobs list page with 7-column TanStack Table and URL-synced nuqs filters**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-24T22:32:38Z
- **Completed:** 2026-02-24T22:37:38Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- `/jobs/new` server component fetches locations, categories, GA staff/lead users, and eligible requests (triaged + in_progress); passes all to JobForm with optional prefill via `?request_id=` query param
- JobForm implements multi-request linking with searchable Combobox that adds requests as dismissible chips, auto-computes priority from highest among linked requests using a `useEffect`, and shows `(linked to JOB-XX-XXXX)` annotation on already-linked requests
- `/jobs` list page + JobTable + JobFilters implements full request-module pattern: server-side data fetch, client-side nuqs filter state, DataTable with 7 columns, "New Job" button for GA Lead/Admin, cancel confirmation dialog

## Task Commits

1. **Task 1: Job creation form page with multi-request linking** - `d20873f` (feat)
2. **Task 2: Job list page with filters, data table, and status/priority badges** - `301e5bb` (feat)

## Files Created/Modified

- `app/(dashboard)/jobs/new/page.tsx` — Server component: fetches all reference data, job links for in-progress requests, optional prefill from request_id query param; role guard for ga_lead/admin
- `components/jobs/job-form.tsx` — Client form with react-hook-form + zod, multi-request chip selector, auto-priority calc, Rp prefix cost input, InlineFeedback on error
- `app/(dashboard)/jobs/page.tsx` — Server component: parallel fetch jobs+users, passes to JobTable; shows breadcrumb and description
- `components/jobs/job-table.tsx` — Client table with nuqs filter state, client-side filtering logic, cancel dialog integration, "New Job" create button for leads/admins
- `components/jobs/job-columns.tsx` — TanStack column defs: ID (mono), Title (truncated), Status (badge), PIC (Unassigned fallback), Priority (badge), Linked Request (first + "+N" count, clickable link), Created (dd-MM-yyyy), Actions (dropdown)
- `components/jobs/job-filters.tsx` — Filter bar: search (debounced), status Select, priority Select, PIC Combobox, date range inputs, My Assigned checkbox, Clear button
- `components/jobs/job-status-badge.tsx` — Pill badge using JOB_STATUS_LABELS/COLORS
- `components/jobs/job-priority-badge.tsx` — Pill badge using PRIORITY_LABELS/COLORS, renders "—" for null
- `components/jobs/job-cancel-dialog.tsx` — AlertDialog for cancel confirmation with cascade warning
- `app/(dashboard)/jobs/[id]/page.tsx` — Job detail server component: full audit log → timeline events conversion, comment photo signed URLs, parallel data fetching
- `components/jobs/job-detail-info.tsx` — Detail view: display_id, status/priority badges, IDR cost, core fields grid, linked requests list
- `components/jobs/job-detail-actions.tsx` — Action panel: assign, start work, submit approval, approve/reject, mark complete, cancel with appropriate role guards
- `components/jobs/job-detail-client.tsx` — Two-column layout coordinator for job detail page
- `components/jobs/job-timeline.tsx` — Audit log event renderer with 8 event types + comment interleaving
- `components/jobs/job-comment-form.tsx` — Comment submission form with addJobComment server action

## Decisions Made

- `JobTimelineEvent` type uses `{ type, at, by, details }` to match the existing `jobs/[id]/page.tsx` audit log processor which was already created before this plan — changed from the initial `{ id, label, actor, timestamp, detail }` stub to make TypeScript pass
- Included `in_progress` requests in the eligible requests dropdown (not just `triaged`) so that requests already linked to other jobs remain searchable and can be added — annotated with `(linked to JOB-XX-XXXX)` to inform the user
- Job detail scaffold files (job-detail-*.tsx, job-timeline.tsx, job-comment-form.tsx, jobs/[id]/page.tsx) were pre-existing untracked files with forward references — included in plan 02 commit to resolve TypeScript blocking errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created job-timeline.tsx and job-comment-form.tsx stubs**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** `components/jobs/job-detail-client.tsx` was a pre-existing untracked file that imported `./job-timeline` and `./job-comment-form` which didn't exist, causing TypeScript errors that blocked the build
- **Fix:** Created `job-timeline.tsx` with proper `JobTimelineEvent` type matching the `jobs/[id]/page.tsx` usage (8 event types, `at`/`by`/`details` structure), and `job-comment-form.tsx` with `addJobComment` integration
- **Files modified:** `components/jobs/job-timeline.tsx`, `components/jobs/job-comment-form.tsx`
- **Verification:** `npx tsc --noEmit` passes clean, `npm run build` succeeds
- **Committed in:** 301e5bb (Task 2 commit)

**2. [Rule 1 - Bug] Fixed Supabase join type casting in jobs/[id]/page.tsx**
- **Found during:** Task 2 (pre-existing file review)
- **Issue:** Pre-existing `jobs/[id]/page.tsx` used Supabase's nested select which returns complex union types; `job.assigned_to` foreign key used as both column and relation alias causing TS inference issues in the existing file
- **Fix:** Used `as unknown as JobWithRelations` cast at the jobs page fetch site — same pattern used elsewhere in codebase
- **Files modified:** Pre-existing `app/(dashboard)/jobs/[id]/page.tsx` (untracked, included in commit)
- **Verification:** TypeScript compiles clean
- **Committed in:** 301e5bb (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary to unblock compilation. No scope creep — all created files were either required by the plan or needed to fix pre-existing forward references.

## Issues Encountered

- Pre-existing untracked job scaffold files in `components/jobs/` (job-detail-client.tsx, job-detail-actions.tsx, job-detail-info.tsx, job-status-badge.tsx, job-priority-badge.tsx) and `app/(dashboard)/jobs/[id]/page.tsx` were already partially created, likely from a prior incomplete execution. These were incorporated without modification for badge components; only the missing stubs were created.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 03 (Job Detail + Timeline UI) can start immediately — all scaffolding is in place, job-timeline.tsx and job-comment-form.tsx provide working implementations
- Plan 04 (Approval Queue UI) can start after Plan 03 establishes detail page patterns
- The `/jobs` and `/jobs/new` routes are fully functional

## Self-Check: PASSED

All files exist and commits verified:
- `app/(dashboard)/jobs/new/page.tsx` — FOUND
- `components/jobs/job-form.tsx` — FOUND
- `app/(dashboard)/jobs/page.tsx` — FOUND
- `components/jobs/job-table.tsx` — FOUND
- `components/jobs/job-columns.tsx` — FOUND
- `components/jobs/job-filters.tsx` — FOUND
- `components/jobs/job-status-badge.tsx` — FOUND
- `components/jobs/job-priority-badge.tsx` — FOUND
- Commit `d20873f` — FOUND
- Commit `301e5bb` — FOUND

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-25*
