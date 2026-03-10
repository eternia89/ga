---
phase: quick-25
plan: 01
subsystem: api
tags: [supabase, rls, next-safe-action, middleware]

requires:
  - phase: 03-admin-system-configuration
    provides: "authActionClient and adminActionClient middleware pattern"
provides:
  - "gaLeadActionClient middleware for ga_lead+admin with RLS bypass"
  - "Schedule mutations free of RLS WITH CHECK policy errors"
affects: [schedule-actions, safe-action]

tech-stack:
  added: []
  patterns: ["gaLeadActionClient middleware for ga_lead/admin operations needing RLS bypass"]

key-files:
  created: []
  modified:
    - lib/safe-action.ts
    - app/actions/schedule-actions.ts

key-decisions:
  - "gaLeadActionClient placed between authActionClient and adminActionClient in middleware chain"
  - "Read actions remain on authActionClient (RLS works fine for SELECT)"

patterns-established:
  - "gaLeadActionClient: use for any ga_lead+admin mutation that hits RLS WITH CHECK issues"

requirements-completed: [QUICK-25]

duration: 6min
completed: 2026-03-09
---

# Quick Task 25: Fix RLS Policy Error When Deactivating Maintenance Schedules

**New gaLeadActionClient middleware bypasses RLS via adminSupabase for schedule mutations, fixing current_user_company_id() WITH CHECK failures**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-09T13:49:08Z
- **Completed:** 2026-03-09T13:55:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added gaLeadActionClient middleware to safe-action.ts allowing ga_lead+admin roles with adminSupabase (service_role)
- Switched all 5 schedule mutation actions (create, update, deactivate, activate, delete) to gaLeadActionClient
- Removed redundant manual role checks from mutation actions (middleware handles enforcement)
- Read actions (getSchedules, getSchedulesByAssetId) remain on authActionClient with user's supabase client
- Helper functions (pauseSchedulesForAsset, resumeSchedulesForAsset, deactivateSchedulesForAsset) unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add gaLeadActionClient to safe-action.ts** - `4591fec` (feat)
2. **Task 2: Switch schedule mutation actions to gaLeadActionClient** - `64b2135` (fix)

## Files Created/Modified
- `lib/safe-action.ts` - Added gaLeadActionClient middleware between authActionClient and adminActionClient
- `app/actions/schedule-actions.ts` - Switched 5 mutation actions to gaLeadActionClient with adminSupabase, removed manual role checks

## Decisions Made
- gaLeadActionClient placed between authActionClient and adminActionClient in the middleware chain -- does not modify adminActionClient which remains admin-only for settings/config actions
- Read actions kept on authActionClient since RLS SELECT policies work fine with user's supabase client

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

---
*Quick Task: 25-fix-rls-policy-error-when-deactivating-m*
*Completed: 2026-03-09*
