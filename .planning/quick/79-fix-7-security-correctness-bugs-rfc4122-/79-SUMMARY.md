---
phase: quick-79
plan: 79
subsystem: api, database
tags: [rls, uuid, rfc4122, maybeSingle, supabase, authorization, security]

requires:
  - phase: quick-71
    provides: "Multi-company write action pattern with company access validation"
provides:
  - "RFC 4122 v4 compliant fallback UUID in RLS helper function"
  - ".maybeSingle() on all user_company_access queries"
  - "Error handling on schedule-actions company access queries"
  - "Duplicate email check on user reactivation"
  - "Company access validation on user creation"
affects: [auth, rls, user-management, schedules, company-settings]

tech-stack:
  added: []
  patterns:
    - ".maybeSingle() for optional row queries that may return null"
    - "accessError check before null data check on .maybeSingle()"

key-files:
  created: []
  modified:
    - supabase/migrations/00002_rls_helper_functions.sql
    - scripts/reset-database.sql
    - app/actions/request-actions.ts
    - app/actions/job-actions.ts
    - app/actions/asset-actions.ts
    - app/actions/schedule-actions.ts
    - app/actions/company-settings-actions.ts
    - app/actions/user-actions.ts

key-decisions:
  - "Used 00000000-0000-4000-a000-000000000000 as canonical nil-like v4 UUID for fallback values"

patterns-established:
  - "Always use .maybeSingle() for optional FK row lookups (user_company_access, company_settings by key)"
  - "Always destructure and check error before null data on .maybeSingle() queries"

requirements-completed: []

duration: 3min
completed: 2026-03-16
---

# Quick Task 79: Fix 7 Security & Correctness Bugs Summary

**RFC 4122 UUID compliance, .maybeSingle() migration, duplicate email guard on reactivate, and company access validation on createUser across 8 files**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T02:03:45Z
- **Completed:** 2026-03-16T02:06:16Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- All hardcoded UUIDs now RFC 4122 v4 compliant (RLS helper fallback + reset-database instance_id)
- Replaced .single() with .maybeSingle() on 4 company_access queries and 1 company_settings query to prevent throws on missing rows
- Added error destructuring and checking on 5 schedule-actions .maybeSingle() queries
- reactivateUser now checks for duplicate email among active users before clearing deleted_at
- createUser now validates admin has access to the target company via ctx

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix SQL files -- RFC 4122 UUID compliance (BUG 1 + BUG 7)** - `cda120b` (fix)
2. **Task 2: Fix .single() to .maybeSingle() and add error handling (BUG 2 + BUG 5 + BUG 6)** - `f5a399a` (fix)
3. **Task 3: Fix user-actions -- duplicate email check on reactivate + company access on create (BUG 3 + BUG 4)** - `53352a7` (fix)

## Files Created/Modified
- `supabase/migrations/00002_rls_helper_functions.sql` - RLS fallback UUID fixed to valid v4
- `scripts/reset-database.sql` - 5 instance_id UUIDs fixed to valid v4
- `app/actions/request-actions.ts` - Company access query .single() -> .maybeSingle()
- `app/actions/job-actions.ts` - Company access query .single() -> .maybeSingle()
- `app/actions/asset-actions.ts` - Company access query .single() -> .maybeSingle()
- `app/actions/schedule-actions.ts` - 5 company access queries now check error before null
- `app/actions/company-settings-actions.ts` - Settings existence check .single() -> .maybeSingle()
- `app/actions/user-actions.ts` - Duplicate email guard on reactivate + company access on create

## Decisions Made
- Used 00000000-0000-4000-a000-000000000000 as the canonical nil-like v4 UUID (version=4, variant=a) for all fallback/placeholder values

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 7 bugs fixed, build passes
- No remaining .single() calls on optional row queries

---
*Quick Task: 79*
*Completed: 2026-03-16*
