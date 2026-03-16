---
phase: quick-80
plan: 01
subsystem: api
tags: [refactoring, dry, zod, supabase, multi-company]

# Dependency graph
requires:
  - phase: quick-79
    provides: "maybeSingle() pattern and company access checks"
provides:
  - "assertCompanyAccess shared helper for multi-company access validation"
  - "isoDateString shared Zod helper for YYYY-MM-DD date fields"
affects: [all-action-files, validation-schemas]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared assertCompanyAccess helper replaces inline company access checks"
    - "Shared isoDateString helper replaces bare z.string() for date fields"

key-files:
  created:
    - "lib/auth/company-access.ts"
    - "lib/validations/helpers.ts"
  modified:
    - "app/actions/request-actions.ts"
    - "app/actions/job-actions.ts"
    - "app/actions/asset-actions.ts"
    - "app/actions/schedule-actions.ts"
    - "app/actions/user-actions.ts"
    - "lib/validations/asset-schema.ts"
    - "lib/validations/schedule-schema.ts"

key-decisions:
  - "assertCompanyAccess accepts generic SupabaseClient for both RLS-bound and service role clients"
  - "Schedule action error messages standardized from obfuscated 'Schedule not found' to explicit 'You do not have access to the selected company.'"

patterns-established:
  - "assertCompanyAccess pattern: use shared helper instead of inline user_company_access queries for mutation guards"
  - "isoDateString pattern: use shared helper instead of bare z.string() for YYYY-MM-DD date fields"

requirements-completed: [QUICK-80]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Quick Task 80: Extract Shared Helpers Summary

**assertCompanyAccess and isoDateString shared helpers replacing 8 inline access checks and 3 bare date schemas**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T02:29:40Z
- **Completed:** 2026-03-16T02:33:23Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Created assertCompanyAccess helper that works with both RLS-bound and admin Supabase clients
- Created isoDateString Zod helper for consistent YYYY-MM-DD date validation
- Replaced all 8 inline company access check patterns across 5 action files
- Replaced 3 bare z.string() date fields with isoDateString in 2 schema files
- Net reduction: 78 lines removed (23 added, 101 removed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared helpers** - `7d149f6` (refactor)
2. **Task 2: Replace inline patterns** - `4a4e1ef` (refactor)

## Files Created/Modified
- `lib/auth/company-access.ts` - assertCompanyAccess shared helper (new)
- `lib/validations/helpers.ts` - isoDateString shared Zod helper (new)
- `app/actions/request-actions.ts` - Replaced createRequest inline access check
- `app/actions/job-actions.ts` - Replaced createJob inline access check
- `app/actions/asset-actions.ts` - Replaced createAsset inline access check
- `app/actions/schedule-actions.ts` - Replaced 5 inline access checks (create, update, deactivate, activate, delete)
- `app/actions/user-actions.ts` - Replaced createUser inline access check
- `lib/validations/asset-schema.ts` - Replaced acquisition_date and warranty_expiry with isoDateString
- `lib/validations/schedule-schema.ts` - Replaced start_date with isoDateString

## Decisions Made
- assertCompanyAccess accepts generic SupabaseClient so it works with both RLS-bound (supabase) and service role (adminSupabase) clients
- Schedule action error messages standardized: changed from obfuscated 'Schedule not found' to explicit 'You do not have access to the selected company.' for consistency with other action files
- Read-access fetches in getSchedules/getSchedulesByAssetId left unchanged (they gather accessible company ID lists, not mutation guards)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All company access checks now use the shared helper
- Future action files should import assertCompanyAccess instead of writing inline checks
- Future date string schemas should use isoDateString instead of bare z.string()

---
*Phase: quick-80*
*Completed: 2026-03-16*
