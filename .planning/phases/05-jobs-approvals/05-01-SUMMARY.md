---
phase: 05-jobs-approvals
plan: 01
subsystem: database
tags: [supabase, postgres, typescript, zod, next-safe-action, server-actions, rls, pg-cron]

# Dependency graph
requires:
  - phase: 04-requests
    provides: authActionClient pattern, request-actions pattern, request-photos upload route pattern, db migration pattern

provides:
  - DB migration 00008 with job_requests join table, company_settings table, approval/feedback columns, generate_job_display_id function, auto_accept_completed_requests cron function, job-photos storage bucket
  - Job, JobWithRelations, JobComment, CompanySetting TypeScript types
  - JOB_STATUS_LABELS/COLORS/STATUSES constants; pending_acceptance/pending_approval added to request status constants
  - 7 Zod schemas: createJobSchema, updateJobSchema, jobCommentSchema, approvalDecisionSchema, acceptanceDecisionSchema, feedbackSchema, companySettingsSchema
  - 6 job server actions: createJob, updateJob, assignJob, updateJobStatus, cancelJob, addJobComment
  - 3 approval server actions: submitForApproval, approveJob, rejectJob
  - job-photos upload API route mirroring request-photos pattern

affects: [05-02-job-list-ui, 05-03-job-detail-ui, 05-04-approval-queue-ui, 05-05-acceptance-cycle-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - generate_job_display_id SECURITY DEFINER function for atomic job ID counter
    - job_requests join table with company_id for consistent RLS
    - company_settings key-value table for extensible per-company config
    - auto_accept_completed_requests PLPGSQL function for pg_cron scheduling
    - Two-step job photo upload: insert comment first, then POST to /api/uploads/job-photos with comment_id
    - Priority auto-computed from highest-priority linked request

key-files:
  created:
    - supabase/migrations/00008_jobs_phase5.sql
    - lib/constants/job-status.ts
    - lib/validations/job-schema.ts
    - app/actions/job-actions.ts
    - app/actions/approval-actions.ts
    - app/api/uploads/job-photos/route.ts
  modified:
    - lib/types/database.ts
    - lib/constants/request-status.ts

key-decisions:
  - "auto_accept_completed_requests sets status to 'accepted' (not 'completed') to match existing DB schema STATUS_LABELS"
  - "pg_cron schedule left as manual step with comments due to migration failure risk if extension not yet enabled"
  - "company_id added to job_requests join table for consistent RLS pattern (no subquery join needed in policies)"
  - "submitForApproval re-fetches company_settings in action body to prevent frontend bypass of threshold check"
  - "rejectJob sends job back to 'assigned' (not 'created') so PIC is preserved after rejection"
  - "Job status transition from pending_approval -> in_progress handled by approveJob action (not updateJobStatus)"
  - "Request status type union updated to include all statuses matching DB CHECK constraint"

patterns-established:
  - "Pattern 1: Job photo upload — POST to /api/uploads/job-photos with comment_id after creating comment record"
  - "Pattern 2: Budget threshold check — always server-side in submitForApproval action, never trust frontend"
  - "Pattern 3: cascading status updates — updateJobStatus and cancelJob cascade to linked requests via job_requests join"
  - "Pattern 4: Priority auto-compute — highestPriority() helper used in createJob and updateJob when linked_request_ids change"

requirements-completed:
  - REQ-JOB-001
  - REQ-JOB-002
  - REQ-JOB-003
  - REQ-JOB-004
  - REQ-JOB-005
  - REQ-JOB-006
  - REQ-JOB-009
  - REQ-APR-001
  - REQ-APR-003
  - REQ-REQ-008

# Metrics
duration: 4min
completed: 2026-02-25
---

# Phase 5 Plan 1: Data Foundation Summary

**DB migration + TypeScript types/constants/schemas + 9 server actions + job-photos upload API for Phase 5 jobs and approvals data layer**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-24T22:25:12Z
- **Completed:** 2026-02-24T22:29:14Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- DB migration 00008 covering 12 schema items: job_requests join table, company_settings table, jobs status CHECK update, requests status CHECK update, approval columns on jobs, feedback/acceptance columns on requests, generate_job_display_id function, auto_accept_completed_requests cron function, job-photos storage bucket, and RLS policies for all new tables
- Complete TypeScript type definitions for Job domain (Job, JobWithRelations, JobComment, CompanySetting) and updated Request type with full status union
- 7 Zod schemas plus 9 server actions implementing the complete job lifecycle with role guards, multi-request linking, status cascade, and budget threshold enforcement

## Task Commits

1. **Task 1: DB migration 00008** - `e4ce329` (chore)
2. **Task 2: Types, constants, schemas, actions, photo upload API** - `27048db` (feat)

## Files Created/Modified

- `supabase/migrations/00008_jobs_phase5.sql` - Phase 5 schema changes with all 12 items, RLS policies, pg_cron instructions
- `lib/types/database.ts` - Added Job, JobWithRelations, JobComment, CompanySetting interfaces; updated Request status union
- `lib/constants/job-status.ts` - JOB_STATUS_LABELS, JOB_STATUS_COLORS, JOB_STATUSES, re-exports PRIORITIES from request-status
- `lib/constants/request-status.ts` - Added pending_acceptance, pending_approval, approved, closed statuses
- `lib/validations/job-schema.ts` - 7 Zod schemas: createJob, updateJob, jobComment, approvalDecision, acceptanceDecision, feedback, companySettings
- `app/actions/job-actions.ts` - createJob, updateJob, assignJob, updateJobStatus, cancelJob, addJobComment with role guards
- `app/actions/approval-actions.ts` - submitForApproval (threshold check), approveJob, rejectJob with finance_approver role guard
- `app/api/uploads/job-photos/route.ts` - Single-photo upload for job comments, mirrors request-photos pattern

## Decisions Made

- `auto_accept_completed_requests` sets status to `accepted` (not `completed`) to match existing STATUS_LABELS mapping and DB schema — CONTEXT.md's "Completed" is the user-facing label for the accepted state
- pg_cron schedule is left as a commented-out manual step because `cron.schedule` fails in migration if extension is not yet enabled in the Supabase Dashboard
- `company_id` added to `job_requests` join table for consistent RLS pattern (avoids subquery joins in policies, matches all other tables in codebase)
- `submitForApproval` re-fetches `company_settings.budget_threshold` in the server action body to prevent frontend bypass of the approval gate
- `rejectJob` returns job to `assigned` status (not `created`) so the PIC assignment is preserved and Lead doesn't need to re-assign after rejection
- Transition from `pending_approval` to `in_progress` is handled exclusively by `approveJob` action; `updateJobStatus` allows `pending_approval -> in_progress` for the case where approval is bypassed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added all request statuses to STATUS_LABELS and STATUS_COLORS**
- **Found during:** Task 2 (request-status.ts update)
- **Issue:** The plan specified adding only `pending_acceptance` but `pending_approval`, `approved`, and `closed` statuses were also in the DB CHECK constraint without corresponding labels/colors, which would cause display failures in Phase 5 UI
- **Fix:** Added pending_approval, approved, closed with appropriate labels and color classes
- **Files modified:** lib/constants/request-status.ts
- **Verification:** All DB statuses have corresponding labels and colors
- **Committed in:** 27048db (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added acceptance_rejected_reason field to Request type**
- **Found during:** Task 2 (types update)
- **Issue:** Migration adds `acceptance_rejected_reason` column to requests table but the TypeScript type definition didn't include it — would cause type errors in acceptance cycle UI
- **Fix:** Added `acceptance_rejected_reason: string | null` field to Request type
- **Files modified:** lib/types/database.ts
- **Verification:** TypeScript compiles clean
- **Committed in:** 27048db (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both auto-fixes necessary for correctness of downstream UI phases. No scope creep.

## Issues Encountered

None — plan executed smoothly. All TypeScript compilation checks passed clean.

## User Setup Required

**pg_cron schedule requires manual configuration.**

After pushing migration 00008, run in Supabase Dashboard SQL Editor:

```sql
-- First, enable pg_cron in Dashboard -> Database -> Extensions -> pg_cron -> Enable
-- Then run:
SELECT cron.schedule(
  'auto-accept-completed-requests',
  '0 1 * * *',
  'SELECT public.auto_accept_completed_requests()'
);
-- Verify: SELECT * FROM cron.job;
```

## Next Phase Readiness

- Complete data layer is ready for Phase 5 UI plans (02-05)
- Plan 02 (Job List + Create UI) can start immediately
- Plan 03 (Job Detail + Timeline UI) can start immediately
- Plan 04 (Approval Queue UI) depends on Plan 02/03 pattern establishment
- Plan 05 (Acceptance Cycle UI) depends on Plan 03 request detail changes

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-25*
