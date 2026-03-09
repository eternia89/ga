---
phase: quick-21
verified: 2026-03-09T02:10:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Quick Task 21: Fix Deadlock Analysis Issues Verification Report

**Phase Goal:** Fix 4 issues from deadlock analysis: wire advanceFloatingSchedule, rework Start Work flow, fix budget threshold consistency, remove unused request statuses.
**Verified:** 2026-03-09T02:10:00Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When a PM job completes, floating schedule next_due_at advances to now + interval_days | VERIFIED | `job-actions.ts:484-486` calls `advanceFloatingScheduleCore(supabase, parsedInput.id)` when `actualStatus === 'completed' && job.job_type === 'preventive_maintenance'`; core function at `pm-job-actions.ts:253-320` correctly advances floating schedules |
| 2 | PIC clicks Start Work and always transitions to in_progress regardless of estimated_cost | VERIFIED | `job-actions.ts:410` shows `assigned: ['in_progress']` with no `pending_approval` option; no intercept block exists |
| 3 | Budget approval auto-triggers only when PIC saves cost while in_progress AND cost >= budget_threshold | VERIFIED | `updateJobBudget` (line 624) and `updateJob` (line 235) both check `budgetThreshold !== null && cost >= budgetThreshold` before routing to `pending_approval` |
| 4 | If no budget_threshold configured, cost saves do NOT route to pending_approval | VERIFIED | Both paths set `budgetThreshold = null` when no company_settings row found; null check prevents routing |
| 5 | Request filter dropdown no longer shows pending_approval, approved, or completed options | VERIFIED | `request-status.ts` has exactly 8 statuses; grep confirms zero matches for removed statuses |
| 6 | Dashboard Completed KPI queries accepted and closed request statuses (not the removed completed) | VERIFIED | `queries.ts:183,192` use `.in('status', ['accepted', 'closed'])`; KPI href at line 247 uses `accepted,closed` |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/actions/pm-job-actions.ts` | advanceFloatingScheduleCore plain async function | VERIFIED | Exported at line 253, takes SupabaseClient + jobId, handles floating and fixed schedule types |
| `app/actions/job-actions.ts` | PM completion wiring, reworked Start Work flow, threshold-gated budget routing | VERIFIED | advanceFloatingScheduleCore called on PM completion (L484), no pending_approval intercept on Start Work, threshold checks in both updateJobBudget and updateJob |
| `lib/constants/request-status.ts` | Clean request status constants without unused statuses | VERIFIED | 8 statuses only: submitted, triaged, in_progress, pending_acceptance, accepted, closed, rejected, cancelled |
| `lib/types/database.ts` | Updated RequestRow type without removed statuses | VERIFIED | Line 67: 8-member union type, no pending_approval/approved/completed |
| `lib/dashboard/queries.ts` | Cleaned dashboard queries without removed request statuses | VERIFIED | STATUS_HEX_COLORS has 8 request statuses; JOB status maps correctly retain pending_approval and completed as job-specific statuses |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `job-actions.ts` | `pm-job-actions.ts` | `import advanceFloatingScheduleCore` | WIRED | Import at line 10, called at line 485 |
| `job-actions.ts` | `company_settings budget_threshold` | supabase query in updateJobBudget and updateJob | WIRED | updateJobBudget fetches at L616-621, updateJob fetches at L226-231 |

### Anti-Patterns Found

None found. No TODOs, FIXMEs, or placeholder implementations in modified files.

### Human Verification Required

None required. All changes are server-side logic verifiable through code inspection.

---

_Verified: 2026-03-09T02:10:00Z_
_Verifier: Claude (gsd-verifier)_
