# Quick Task 21: Fix deadlock analysis issues - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Fix 4 issues from deadlock analysis (quick task 20):
1. Wire advanceFloatingSchedule into updateJobStatus completion path
2. Rework job flow so Start Work never intercepts to pending_approval
3. Fix budget threshold consistency — only trigger approval when estimated_cost >= budget_threshold
4. Remove unused request statuses (pending_approval, approved, completed) from constants

</domain>

<decisions>
## Implementation Decisions

### Start Work Flow Rework
- Remove the `assigned -> pending_approval` intercept in updateJobStatus (lines 412-416)
- PIC clicks Start Work freely — always transitions to `in_progress` regardless of estimated_cost
- Budget approval is triggered automatically when PIC saves estimated_cost while in_progress: if cost >= budget_threshold, auto-route to `pending_approval`
- This means updateJobBudget (or equivalent cost-save path) must check threshold and reroute
- Remove `pending_approval` from `assigned` valid transitions (only `in_progress` remains)
- The `approval_submitted_at` and `started_at` fields need adjustment: `started_at` set on Start Work, `approval_submitted_at` set when auto-routed to pending_approval

### advanceFloatingSchedule Wiring
- Extract the core DB logic from the authActionClient into a plain async function (e.g., `advanceFloatingScheduleCore`)
- Call the plain function directly from updateJobStatus completion block
- Keep the authActionClient wrapper as a thin shell calling the core function (for any standalone use)
- The job already has `job_type` selected in the initial fetch — check `job.job_type === 'preventive_maintenance'` before calling

### Unused Request Status Cleanup
- Remove `pending_approval`, `approved`, `completed` from REQUEST_STATUSES array, STATUS_LABELS, STATUS_COLORS
- Remove from any filter dropdowns, dashboard queries, DB TypeScript types
- These statuses were never set by any server action — no data exists with them
- Remove everywhere with no safety net

### Budget Threshold Consistency
- When saving estimated_cost on an in_progress job, fetch budget_threshold from company_settings
- Only route to pending_approval if estimated_cost >= budget_threshold AND budget_threshold is configured
- If no budget_threshold is configured, cost saves proceed without approval gate
- This aligns the cost-save path with the completion approval path behavior

</decisions>

<specifics>
## Specific Ideas

- The updateJobBudget action in job-actions.ts currently always routes to pending_approval — must add threshold check
- The updateJob action also handles cost changes and may need the same threshold logic
- advanceFloatingSchedule in pm-job-actions.ts is an authActionClient — extract core to async function
- Remove the TODO comment block (lines 475-484) after wiring the actual call
- Check dashboard queries in lib/dashboard/queries.ts for references to removed statuses
- Check hex color maps (STATUS_HEX_COLORS) for removed statuses too

</specifics>
