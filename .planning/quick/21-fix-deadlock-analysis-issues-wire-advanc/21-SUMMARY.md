---
phase: quick-21
plan: 01
subsystem: api
tags: [server-actions, supabase, maintenance, budget-approval, request-status]

requires:
  - phase: quick-20
    provides: deadlock analysis identifying 4 issues to fix

provides:
  - advanceFloatingScheduleCore plain async function for PM schedule advancement
  - Reworked Start Work flow (always in_progress, no pending_approval intercept)
  - Threshold-gated budget approval in updateJobBudget and updateJob
  - Cleaned request status constants (8 statuses, removed 3 unused)

affects: [jobs, approvals, dashboard, requests]

tech-stack:
  added: []
  patterns:
    - "Core function extraction pattern: authActionClient wraps plain async function for reuse across server actions"
    - "Threshold-gated transitions: fetch company_settings before auto-routing to approval status"

key-files:
  created: []
  modified:
    - app/actions/pm-job-actions.ts
    - app/actions/job-actions.ts
    - lib/constants/request-status.ts
    - lib/types/database.ts
    - lib/dashboard/queries.ts

key-decisions:
  - "advanceFloatingScheduleCore extracted as plain async function (not authActionClient) so it can be called from updateJobStatus without auth overhead"
  - "Start Work always transitions to in_progress regardless of estimated_cost; budget approval triggers only on cost save when >= threshold"
  - "Budget threshold check added to both updateJobBudget and updateJob cost-change paths for consistency"
  - "Dashboard Completed KPI uses accepted+closed (not accepted+completed since completed was removed as request status)"

requirements-completed: [DEADLOCK-ISSUE-1, DEADLOCK-ISSUE-4, DEADLOCK-ISSUE-6, DEADLOCK-EDGE-6.1]

duration: 4min
completed: 2026-03-09
---

# Quick Task 21: Fix Deadlock Analysis Issues Summary

**Wire PM floating schedule advancement into job completion, rework Start Work to never intercept, add budget threshold gates, remove 3 dead request statuses**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-09T01:44:18Z
- **Completed:** 2026-03-09T01:48:15Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- PM floating schedules now advance when PM jobs complete (advanceFloatingScheduleCore wired into updateJobStatus)
- Start Work always transitions to in_progress (removed silent redirect to pending_approval)
- Budget approval only triggers when estimated_cost >= configured budget_threshold in both updateJobBudget and updateJob
- Removed 3 unused request statuses (pending_approval, approved, completed) from constants, types, and dashboard queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract advanceFloatingScheduleCore, wire into updateJobStatus, rework Start Work flow and budget threshold consistency** - `b7cf7cc` (feat)
2. **Task 2: Remove unused request statuses from constants, types, and dashboard queries** - `7584eed` (fix)

## Files Created/Modified
- `app/actions/pm-job-actions.ts` - Extracted advanceFloatingScheduleCore as plain async function; kept authActionClient wrapper as thin shell
- `app/actions/job-actions.ts` - Wired PM completion, removed Start Work intercept, added threshold checks to updateJobBudget and updateJob
- `lib/constants/request-status.ts` - Removed pending_approval, approved, completed from STATUS_LABELS, STATUS_COLORS, REQUEST_STATUSES
- `lib/types/database.ts` - Updated Request.status type union to 8 members
- `lib/dashboard/queries.ts` - Removed unused statuses from hex colors, updated Completed KPI to accepted+closed

## Decisions Made
- advanceFloatingScheduleCore extracted as plain async function (not authActionClient) so it can be called from updateJobStatus without auth overhead
- Start Work always transitions to in_progress regardless of estimated_cost; budget approval triggers only on cost save when >= threshold
- Budget threshold check added to both updateJobBudget and updateJob cost-change paths for consistency
- Dashboard Completed KPI uses accepted+closed (not accepted+completed since completed was removed as request status)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

---
*Phase: quick-21*
*Completed: 2026-03-09*
