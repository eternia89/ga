---
phase: quick-21
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/pm-job-actions.ts
  - app/actions/job-actions.ts
  - lib/constants/request-status.ts
  - lib/types/database.ts
  - lib/dashboard/queries.ts
autonomous: true
requirements: [DEADLOCK-ISSUE-1, DEADLOCK-ISSUE-4, DEADLOCK-ISSUE-6, DEADLOCK-EDGE-6.1]

must_haves:
  truths:
    - "When a PM job completes, floating schedule next_due_at advances to now + interval_days"
    - "PIC clicks Start Work and always transitions to in_progress regardless of estimated_cost"
    - "Budget approval auto-triggers only when PIC saves cost while in_progress AND cost >= budget_threshold"
    - "If no budget_threshold configured, cost saves do NOT route to pending_approval"
    - "Request filter dropdown no longer shows pending_approval, approved, or completed options"
    - "Dashboard Completed KPI queries accepted and closed request statuses (not the removed completed)"
  artifacts:
    - path: "app/actions/pm-job-actions.ts"
      provides: "advanceFloatingScheduleCore plain async function"
      contains: "async function advanceFloatingScheduleCore"
    - path: "app/actions/job-actions.ts"
      provides: "PM completion wiring, reworked Start Work flow, threshold-gated budget routing"
    - path: "lib/constants/request-status.ts"
      provides: "Clean request status constants without unused statuses"
    - path: "lib/types/database.ts"
      provides: "Updated RequestRow type without removed statuses"
    - path: "lib/dashboard/queries.ts"
      provides: "Cleaned dashboard queries without removed request statuses"
  key_links:
    - from: "app/actions/job-actions.ts"
      to: "app/actions/pm-job-actions.ts"
      via: "import advanceFloatingScheduleCore"
      pattern: "advanceFloatingScheduleCore"
    - from: "app/actions/job-actions.ts"
      to: "company_settings budget_threshold"
      via: "supabase query in updateJobBudget and updateJob"
      pattern: "budget_threshold"
---

<objective>
Fix 4 issues from deadlock analysis: (1) Wire advanceFloatingSchedule into job completion path, (2) Rework Start Work to never intercept to pending_approval -- PIC starts freely, budget approval auto-triggers on cost save when >= threshold, (3) Fix budget threshold consistency across all cost-save paths, (4) Remove unused request statuses from constants/types/queries.

Purpose: Eliminate a functional bug (floating schedules never advance), fix a confusing UX flow (Start Work silently redirecting), and clean dead code.
Output: Updated server actions, constants, types, and dashboard queries.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/actions/pm-job-actions.ts
@app/actions/job-actions.ts
@lib/constants/request-status.ts
@lib/types/database.ts
@lib/dashboard/queries.ts
@.planning/quick/21-fix-deadlock-analysis-issues-wire-advanc/21-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extract advanceFloatingScheduleCore, wire into updateJobStatus, rework Start Work flow and budget threshold consistency</name>
  <files>app/actions/pm-job-actions.ts, app/actions/job-actions.ts</files>
  <action>
**pm-job-actions.ts:**
1. Extract the DB logic from `advanceFloatingSchedule` authActionClient into a plain exported async function `advanceFloatingScheduleCore(supabaseClient, jobId)` that takes a Supabase client and jobId as params. Move ALL the query/update logic there (fetching job, checking job_type, fetching schedule, advancing next_due_at for floating, updating last_completed_at for fixed).
2. Refactor the existing `advanceFloatingSchedule` authActionClient to be a thin wrapper that calls `advanceFloatingScheduleCore(ctx.supabase, parsedInput.jobId)`.

**job-actions.ts — Wire PM completion (Issue 6):**
1. Add `job_type, maintenance_schedule_id` to the initial job select on line 377 (the `.select(...)` in updateJobStatus).
2. Replace the TODO comment block (lines 475-484) with actual implementation: after the job status is set to `completed` (check `actualStatus === 'completed'`), call `advanceFloatingScheduleCore(supabase, parsedInput.id)` if `job.job_type === 'preventive_maintenance'`. Import `advanceFloatingScheduleCore` from `@/app/actions/pm-job-actions`.

**job-actions.ts — Rework Start Work flow (Issue 4 fix):**
1. Remove the `assigned -> pending_approval` intercept in `updateJobStatus` (lines 412-416). The block `if (parsedInput.status === 'in_progress' && (job.estimated_cost ?? 0) > 0) { actualStatus = 'pending_approval'; }` must be deleted entirely.
2. Remove `'pending_approval'` from `assigned`'s valid transitions array (line 397). It should be: `assigned: ['in_progress']`.
3. Set `started_at = now` when transitioning from `assigned` to `in_progress` (the existing block at lines 441-444 needs adjustment: only set `started_at` when going to `in_progress`, do NOT set `approval_submitted_at` here anymore).
4. Remove the block at lines 441-444 that sets `approval_submitted_at` and `started_at` when actualStatus is `pending_approval` from a Start Work path — this path no longer exists.

**job-actions.ts — Budget threshold consistency in updateJobBudget (Issue 6.1):**
1. In `updateJobBudget`, before routing to `pending_approval`, fetch `budget_threshold` from `company_settings`.
2. Only route to `pending_approval` if `budget_threshold` is configured AND `estimated_cost >= budget_threshold`.
3. If threshold is not configured OR cost is below threshold, just update the `estimated_cost` field without changing status. Still clear previous rejection data.

**job-actions.ts — Budget threshold consistency in updateJob (Issue 6.1):**
1. In `updateJob`, the cost-change auto-transition block (lines 219-230) must also fetch `budget_threshold` and apply the same threshold check.
2. Only route to `pending_approval` if `budget_threshold` is configured AND `newCost >= budget_threshold`.
3. If threshold not configured or cost below threshold, update cost without changing status.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
- advanceFloatingScheduleCore exists as plain async function, called from updateJobStatus on PM job completion
- Start Work always transitions to in_progress (no pending_approval intercept)
- updateJobBudget and updateJob only route to pending_approval when cost >= budget_threshold (and threshold exists)
- No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove unused request statuses from constants, types, and dashboard queries</name>
  <files>lib/constants/request-status.ts, lib/types/database.ts, lib/dashboard/queries.ts</files>
  <action>
**lib/constants/request-status.ts:**
1. Remove `pending_approval` from STATUS_LABELS (line 6), STATUS_COLORS (line 21), and REQUEST_STATUSES array (line 50).
2. Remove `approved` from STATUS_LABELS (line 7), STATUS_COLORS (line 22), and REQUEST_STATUSES array (line 51).
3. Remove `completed` from STATUS_LABELS (line 8), STATUS_COLORS (line 23), and REQUEST_STATUSES array (line 52).
4. The remaining request statuses should be: submitted, triaged, in_progress, pending_acceptance, accepted, closed, rejected, cancelled.

**lib/types/database.ts:**
1. Update the `RequestRow.status` type union (line 67) to remove `'pending_approval' | 'approved' | 'completed'`.
2. Final type: `'submitted' | 'triaged' | 'in_progress' | 'pending_acceptance' | 'accepted' | 'closed' | 'rejected' | 'cancelled'`.

**lib/dashboard/queries.ts:**
1. Remove `pending_approval` from `REQUEST_STATUS_HEX_COLORS` (the first hex color map, around line 10). Remove the `approved` and `completed` entries from the same map. Note: the `completed` entry in JOB_STATUS_HEX_COLORS (second map, around line 26) must STAY — that is a job status.
2. Remove `pending_approval` from `REQUEST_STATUS_LABELS` (around line 34) if it exists there as a request-specific label map. Keep job status labels intact.
3. Update the "Completed This Period" KPI query (lines 186, 195): change `.in('status', ['accepted', 'completed'])` to `.in('status', ['accepted', 'closed'])` — since `completed` is being removed as a request status, the correct terminal success states are `accepted` and `closed`.
4. Update the KPI card href (line 250): change `'/requests?status=accepted,completed'` to `'/requests?status=accepted,closed'`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | head -30 && npm run lint 2>&1 | tail -10</automated>
  </verify>
  <done>
- REQUEST_STATUSES has exactly 8 entries (no pending_approval, approved, completed)
- STATUS_LABELS and STATUS_COLORS have no entries for removed statuses
- RequestRow type union has 8 members
- Dashboard KPI "Completed" queries use accepted+closed instead of accepted+completed
- No TypeScript errors, no lint errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with zero errors
2. `npm run lint` passes
3. `npm run build` succeeds
4. Grep confirms no remaining TODO(PM-INTEGRATION) in job-actions.ts
5. Grep confirms `advanceFloatingScheduleCore` is imported and called in job-actions.ts
6. Grep confirms no `pending_approval` or `approved` in request-status.ts constants
7. Grep confirms `assigned -> in_progress` transition has no pending_approval intercept
</verification>

<success_criteria>
- PM floating schedules advance when PM jobs complete (advanceFloatingScheduleCore wired)
- Start Work always goes to in_progress (no silent redirect)
- Budget approval only triggers when cost >= configured threshold
- Three dead request statuses removed from all constants, types, and queries
- Build succeeds, no TypeScript or lint errors
</success_criteria>

<output>
After completion, create `.planning/quick/21-fix-deadlock-analysis-issues-wire-advanc/21-SUMMARY.md`
</output>
