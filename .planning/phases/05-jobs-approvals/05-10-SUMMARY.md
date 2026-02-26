---
phase: 05-jobs-approvals
plan: 10
subsystem: approvals
tags: [dual-approval, completion-approval, budget-approval, job-lifecycle, finance]
dependency_graph:
  requires: ["05-09"]
  provides: ["pending_completion_approval status", "approveCompletion action", "rejectCompletion action"]
  affects: ["job-detail-actions", "approval-queue", "approvals/page", "job-status-timeline"]
tech_stack:
  added: []
  patterns:
    - "Dual approval flow: budget approval (before work) + completion approval (after work)"
    - "Mark Complete routes through pending_completion_approval when cost >= budget_threshold"
    - "Approval queue emits separate row per approval type for same job"
key_files:
  created:
    - supabase/migrations/00013_completion_approval.sql
  modified:
    - lib/constants/job-status.ts
    - lib/types/database.ts
    - lib/dashboard/queries.ts
    - app/actions/job-actions.ts
    - app/actions/approval-actions.ts
    - components/jobs/job-detail-actions.tsx
    - app/(dashboard)/approvals/page.tsx
    - components/approvals/approval-queue.tsx
    - app/(dashboard)/jobs/[id]/page.tsx
decisions:
  - "completion approval mirrors budget approval threshold check: same company budget_threshold setting"
  - "Mark Complete routes through pending_completion_approval when cost >= threshold; below threshold completes directly"
  - "Approval queue emits separate ApprovalJob row per approval type allowing a job to appear twice (once for budget, once for completion)"
  - "completion_approved_by/completion_rejected_by names fetched via secondary query (not FK join) since Supabase FK alias conflicts with budget approval columns"
  - "Timeline classification adds pending_completion_approval → approval_submitted event and completion_approved_at → approval event"
metrics:
  duration: 9min
  completed: 2026-02-26
  tasks_completed: 2
  files_modified: 9
---

# Phase 05 Plan 10: Completion Approval Summary

Dual approval flow: DB migration, server actions, and full UI for completion approval as a second independent approval type alongside budget approval.

## What Was Built

**Migration (00013_completion_approval.sql):**
- Added `pending_completion_approval` to jobs status CHECK constraint
- Added 6 completion tracking columns: `completion_submitted_at`, `completion_approved_at`, `completion_approved_by`, `completion_rejected_at`, `completion_rejected_by`, `completion_rejection_reason`

**Constants and Types:**
- Added `pending_completion_approval` to `JOB_STATUS_LABELS`, `JOB_STATUS_COLORS`, `JOB_STATUSES`
- Added orange color scheme: `bg-orange-100 text-orange-700` (distinct from purple budget approval)
- Added `#f97316` hex color to `JOB_STATUS_HEX_COLORS` in dashboard queries
- Added 6 completion columns to `Job` interface in `database.ts`

**Server Actions:**
- `updateJobStatus`: When marking complete, fetches `budget_threshold` and if `estimated_cost >= threshold` routes to `pending_completion_approval` + sets `completion_submitted_at` instead of directly completing. Notifies finance approvers.
- `approveCompletion`: Transitions `pending_completion_approval → completed`, sets `completed_at` + `completion_approved_at/by`, moves linked requests to `pending_acceptance`, notifies requesters and job team.
- `rejectCompletion`: Transitions back to `in_progress`, clears `completion_submitted_at`, sets `completion_rejected_at/by/reason`, notifies job team.

**Job Detail UI (`job-detail-actions.tsx`):**
- `canApproveCompletion` flag for `finance_approver/admin` when status is `pending_completion_approval`
- "Approve Completion" button (CheckCircle icon, green)
- "Reject Completion" button (ThumbsDown icon, red) opens dialog requiring reason (max 1000 chars)
- "Awaiting Completion Approval" read-only indicator for non-approvers
- Separate `rejectCompletionOpen` and `rejectCompletionReason` state for the dialog

**Approval Queue:**
- `ApprovalJob` type extended with `approval_type: 'budget' | 'completion'` and all completion approval fields
- New "Type" column showing purple "Budget" or orange "Completion" badge per row
- `getDecisionDate` and `getDecidedBy` helpers dispatch on `approval_type`
- Page fetches jobs matching both `pending_approval` and `pending_completion_approval` status, plus historical completion columns
- Page emits separate row per approval type — a job that went through both appears twice

**Timeline:**
- Added classification for `completion_rejection_reason` changed → `approval_rejection` event
- Added classification for `completion_approved_at` set → `approval` event
- Added classification for `status = pending_completion_approval` → `approval_submitted` event

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - TypeScript] Fixed actualStatus type in updateJobStatus**
- **Found during:** Task 1 TypeScript check
- **Issue:** `let actualStatus = parsedInput.status` inferred as the enum type, blocking assignment of `'pending_completion_approval'`
- **Fix:** Explicitly typed as `let actualStatus: string = parsedInput.status`
- **Files modified:** app/actions/job-actions.ts

**2. [Rule 2 - Missing functionality] Added JOB_STATUS_HEX_COLORS update**
- **Found during:** Task 1 — plan mentioned checking for STATUS_HEX_COLORS; found it in dashboard/queries.ts
- **Fix:** Added `pending_approval` and `pending_completion_approval` to both `JOB_STATUS_HEX_COLORS` and `JOB_STATUS_LABELS` in dashboard queries (they were missing `pending_approval` too)
- **Files modified:** lib/dashboard/queries.ts

**3. [Rule 2 - Missing functionality] Secondary fetch for completion approver names**
- **Found during:** Task 2 — Supabase FK joins for `completion_approved_by` and `completion_rejected_by` would conflict with existing join aliases
- **Fix:** Fetch `completion_approved_by` and `completion_rejected_by` as UUID columns in the main query, then resolve names via a separate batch fetch with `completionActorMap`
- **Files modified:** app/(dashboard)/approvals/page.tsx

## Self-Check: PASSED

All key files verified present. Commits `53e3236` (Task 1) and `3b5b475` (Task 2) confirmed. TypeScript noEmit passes. Production build succeeds.
