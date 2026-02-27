---
phase: 05-jobs-approvals
plan: 11
subsystem: api
tags: [supabase, postgrest, fk-joins, sql-migration, approval-queue]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: Approval queue page, completion approval flow (plans 04, 10)
provides:
  - Working approval queue data fetch (no empty results from silent FK join failures)
  - Applied migration 00013 enabling completion_submitted_at column and pending_completion_approval status
affects: [05-jobs-approvals, UAT]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Batch actor name lookup: collect UUIDs from query result, single batch fetch from user_profiles, build lookup map — avoids FK join ambiguity when multiple FKs point to same table
    - plain UUID columns in Supabase select + separate batch fetch preferred over FK join hints when ambiguous FK count > 2

key-files:
  created: []
  modified:
    - app/(dashboard)/approvals/page.tsx

key-decisions:
  - "FK join hints (user_profiles!approved_by) fail silently when jobs table has 6 FK constraints to user_profiles — PostgREST cannot disambiguate; fix is to select plain UUID columns + batch fetch names separately"
  - "actorNameMap batch fetch combines all actor ID types (budget approver, budget rejecter, completion approver, completion rejecter) into a single query for efficiency"

patterns-established:
  - "Batch actor lookup pattern: collect all actor UUIDs, single .in('id', [...]) query, Map<string, string> for O(1) lookup in normalization loop"

requirements-completed: [REQ-APR-002, REQ-APR-004]

# Metrics
duration: 10min
completed: 2026-02-27
---

# Phase 5 Plan 11: Gap Closure - Approval Queue FK Fix + Migration 00013 Summary

**Fixed silent approval queue empty-result bug by replacing ambiguous FK join hints with batch actor name lookup; applied migration 00013 to enable completion approval flow**

## Performance

- **Duration:** ~10 min (split across checkpoint)
- **Started:** 2026-02-26T12:35:00Z
- **Completed:** 2026-02-27T00:00:00Z
- **Tasks:** 2
- **Files modified:** 1 (code) + 1 (migration already existed, applied to DB)

## Accomplishments
- Approval queue now returns data correctly — replaced FK join hints that silently failed due to 6 FK constraints on the jobs table with a batch actor name lookup pattern
- Added proper `{ data, error }` destructuring with `console.error` logging on the main query so failures surface instead of silently returning null
- Migration 00013 applied to live Supabase database, enabling `completion_submitted_at` and related columns plus `pending_completion_approval` status — unblocks UAT Test 11 (Mark Complete flow)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix approval queue FK join failure** - `3925bb5` (fix)
2. **Task 2: Apply migration 00013 to live Supabase database** - Human action (no code commit — DB-only operation)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `app/(dashboard)/approvals/page.tsx` - Replaced broken FK join hints with batch actor name lookup using combined actorNameMap; added error destructuring on main query

## Decisions Made
- FK join hints (`user_profiles!approved_by`, `user_profiles!approval_rejected_by`) silently fail when the referenced table has more than 2 FK relationships from the source table. PostgREST cannot disambiguate. Fix: select plain UUID columns, then batch-fetch names from user_profiles in a single `.in()` query and build a lookup Map.
- All four actor ID types (budget approver, budget rejecter, completion approver, completion rejecter) are merged into a single batch fetch for efficiency rather than four separate queries.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Task 2 was a `checkpoint:human-action` requiring the user to apply migration 00013 via Supabase Dashboard SQL Editor. User confirmed completion. No code changes were needed — the migration file already existed in the codebase, it just hadn't been applied to the live database.

## User Setup Required
Migration 00013 applied manually by user via Supabase Dashboard SQL Editor. Unblocks `pending_completion_approval` status and `completion_submitted_at` column availability.

## Next Phase Readiness
- Approval queue displays budget and completion approval rows with correct actor names
- Mark Complete flow (job status -> pending_completion_approval) works without schema cache error
- UAT Tests 9 and 11 are unblocked
- Phase 5 gap closure plans (11-13) are all complete

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-27*
