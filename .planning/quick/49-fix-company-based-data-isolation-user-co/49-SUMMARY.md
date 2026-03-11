---
phase: quick-49
plan: 01
subsystem: database
tags: [rls, postgres, supabase, multi-tenant, user_company_access]

# Dependency graph
requires:
  - phase: quick-46
    provides: user_company_access table (migration 00018) and admin UI for granting access
provides:
  - RLS SELECT policies on requests, jobs, inventory_items that honor user_company_access grants
  - Seed data enabling multi-company test scenario (Eva → Jakmall access)
affects: [requests, jobs, inventory, seed-data]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-company RLS: OR EXISTS (SELECT 1 FROM user_company_access WHERE user_id = auth.uid() AND company_id = table.company_id)"
    - "Migration naming: DROP old policy + CREATE new policy with _policy suffix"

key-files:
  created:
    - supabase/migrations/00020_rls_multi_company_access.sql
  modified:
    - supabase/seed.sql

key-decisions:
  - "Remote DB was already up to date — migrations 00012-00019 were previously pushed; no separate db push needed for Task 1"
  - "inventory_items policy (00009) lacked deleted_at IS NULL — added it in the replacement policy for consistency"
  - "Policy naming convention: new policies use _policy suffix (requests_select_policy, jobs_select_policy, inventory_items_select_policy)"
  - "Multi-company access is read-only — INSERT/UPDATE policies unchanged, only SELECT expanded"

patterns-established:
  - "OR EXISTS pattern for multi-company RLS: grants extra company access without modifying JWT claims"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-11
---

# Quick Task 49: Fix Company-Based Data Isolation Summary

**RLS SELECT policies for requests, jobs, and inventory_items expanded to OR-check user_company_access, enabling GA Staff to read data from additional granted companies**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-11T07:00:00Z
- **Completed:** 2026-03-11T07:05:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Migration 00020 replaces three SELECT policies to include OR EXISTS subquery against user_company_access
- Migration pushed to Supabase remote (00020 applied, remote was already current for 00012-00019)
- Seed section 8 grants Eva (Jaknot GA Staff) read access to Jakmall for multi-company testing

## Task Commits

Each task was committed atomically:

1. **Task 1: Push pending migrations** — Remote DB already up to date (no commit needed; Task 2 commit covers this)
2. **Task 2: Migration 00020 — expand RLS SELECT policies** - `f66d031` (feat)
3. **Task 3: Seed data — user_company_access rows** - `849ffbb` (feat)

## Files Created/Modified

- `supabase/migrations/00020_rls_multi_company_access.sql` — DROP + CREATE for requests_select_policy, jobs_select_policy, inventory_items_select_policy with OR EXISTS against user_company_access
- `supabase/seed.sql` — Section 8 added: INSERT granting Eva (a004-004) access to Jakmall (a000-002), granted by Samuel (a004-001)

## Decisions Made

- Remote DB was already up to date — migrations 00012-00019 had been pushed previously. Task 1 confirmed "Remote database is up to date" with no action needed.
- inventory_items select policy in migration 00009 did not include `AND deleted_at IS NULL`. Added it in the replacement policy for correctness.
- New policy names use `_policy` suffix to distinguish from old ones: `requests_select_policy`, `jobs_select_policy`, `inventory_items_select_policy`.
- INSERT and UPDATE policies intentionally unchanged — multi-company access is read-only by design.

## Deviations from Plan

None - plan executed exactly as written. The "nothing to push" outcome for Task 1 is explicitly handled in the plan ("If migrations are already applied, proceed to Task 2").

## Issues Encountered

None.

## User Setup Required

To test multi-company access:
1. Run `supabase db reset` to apply seed data with section 8
2. Login as eva@jaknot.com
3. Requests/Jobs/Assets pages should show data from both Jaknot AND Jakmall

## Next Phase Readiness

- Multi-company RLS data isolation is complete for the three primary entity tables
- Single-company users are unaffected (OR EXISTS returns false when no access rows exist)
- Future entity tables (e.g., notifications, media_attachments) may need similar expansion if multi-company access is required there

## Self-Check: PASSED

All files exist and commits verified:
- `supabase/migrations/00020_rls_multi_company_access.sql` — FOUND
- `49-SUMMARY.md` — FOUND
- Commit f66d031 — FOUND
- Commit 849ffbb — FOUND

---
*Phase: quick-49*
*Completed: 2026-03-11*
