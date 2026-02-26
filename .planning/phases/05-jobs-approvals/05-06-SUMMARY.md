---
phase: 05-jobs-approvals
plan: 06
subsystem: jobs
tags: [job-comments, rbac, ux, bugfix, approval]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: job-actions.ts, job-detail-actions.tsx, job-comment-form.tsx, job-detail-info.tsx
provides:
  - addJobComment with company_id in insert payload (blocker fix)
  - Expanded canReassign covering in_progress and pending_approval statuses
  - Approval buttons labeled "Approve Budget" / "Reject Budget"
  - finance_approver excluded from Cancel button
  - Comment form hidden on completed/cancelled jobs
  - Single non-duplicated job detail header
affects: [jobs, approvals]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isFinanceApproverOnly helper flag for role-specific UI gating in job actions"
    - "jobStatus prop on JobCommentForm for terminal-status visibility guard"

key-files:
  created: []
  modified:
    - app/actions/job-actions.ts
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-comment-form.tsx
    - components/jobs/job-detail-client.tsx
    - components/jobs/job-detail-info.tsx
    - app/(dashboard)/jobs/[id]/page.tsx

key-decisions:
  - "isFinanceApproverOnly derived from currentUserRole === 'finance_approver'; admin (who has both roles) still sees cancel since isGaLeadOrAdmin check runs first"
  - "JobCommentForm returns null at top of render (before any hooks) when jobStatus is terminal — no conditional hook usage"
  - "PM badge and overdue badge moved into job-detail-info.tsx so header is self-contained; page.tsx now only has breadcrumb + JobDetailClient"

patterns-established:
  - "Terminal-status guard in form components: return null when status in ['completed','cancelled'] before rendering"

requirements-completed:
  - REQ-JOB-004
  - REQ-JOB-005
  - REQ-JOB-006
  - REQ-JOB-008
  - REQ-APR-003

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 05 Plan 06: UAT Gap Closure (6 fixes) Summary

**6 UAT gaps resolved: addJobComment company_id blocker, duplicate header, reassign scope expansion, Approve/Reject Budget labels, finance_approver cancel exclusion, and comment form hidden on terminal jobs**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-26T03:46:26Z
- **Completed:** 2026-02-26T03:48:xx Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Fixed the only code blocker preventing comment creation: `company_id` added to `job_comments` insert payload in `addJobComment`
- Resolved all 5 remaining UX gaps: header deduplication, reassign scope, approval button labels, finance role scope, and comment form visibility
- Build passes cleanly with zero TypeScript errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix addJobComment blocker and job detail header duplication** - `2815aad` (fix)
2. **Task 2: Fix reassign scope, approval button labels, comment visibility, and approval page scope** - `2beeb63` (fix)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/actions/job-actions.ts` - Added `company_id: job.company_id` to job_comments insert
- `components/jobs/job-detail-actions.tsx` - Expanded canReassign, added isFinanceApproverOnly, renamed approval buttons
- `components/jobs/job-comment-form.tsx` - Added jobStatus prop; returns null on completed/cancelled
- `components/jobs/job-detail-client.tsx` - Passes job.status as jobStatus to JobCommentForm
- `components/jobs/job-detail-info.tsx` - Added PM badge, overdue badge, and creator subtitle to header
- `app/(dashboard)/jobs/[id]/page.tsx` - Removed duplicate header section; kept breadcrumb only

## Decisions Made
- `isFinanceApproverOnly` uses strict role equality (`=== 'finance_approver'`) so admin users (who also have finance capabilities) still see the Cancel button since they pass the `isGaLeadOrAdmin` check
- `JobCommentForm` returns `null` before any state is used when status is terminal — avoids conditional hook issues
- PM badge and overdue badge consolidated into `job-detail-info.tsx` so all job identity information is in one component; page.tsx now purely orchestrates data fetching + layout

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Moved PM and overdue badges from page.tsx into job-detail-info.tsx**
- **Found during:** Task 1 (header deduplication)
- **Issue:** Simply removing the page.tsx header would have lost PM type badge and overdue badge rendering, which were only in page.tsx
- **Fix:** Added OverdueBadge import and PM/overdue badge rendering to job-detail-info.tsx header section before removing page.tsx header; also added creator/date subtitle to info component
- **Files modified:** components/jobs/job-detail-info.tsx
- **Verification:** TypeScript passes, build passes
- **Committed in:** 2815aad (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical: preserving PM/overdue badge rendering during header deduplication)
**Impact on plan:** Required to prevent regression; no scope creep.

## Issues Encountered

- Migration 00008 (`supabase/migrations/00008_jobs_phase5.sql`) confirmed to contain `generate_job_display_id` RPC. **Note for user:** This migration must be applied to the remote Supabase database. Run `supabase db push` to push all pending migrations if not already done.

## User Setup Required

None beyond the pre-existing note: push migrations 00007-00011 via `supabase db push` (documented in STATE.md Pending Todos).

## Next Phase Readiness
- 6 UAT gaps from phase 05 UAT are resolved
- Job comment creation now works end-to-end (company_id blocker lifted)
- Job detail page shows clean single header with all relevant badges
- Finance approver has correct scope: approve/reject budget only, no cancel

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-26*
