---
phase: quick-71
plan: 01
subsystem: api
tags: [supabase, rls, multi-company, maintenance-schedules]

requires:
  - phase: quick-55
    provides: "Multi-company user access via user_company_access table"
provides:
  - "Multi-company-aware schedule write actions (update, deactivate, activate, delete)"
affects: [maintenance, schedules]

tech-stack:
  added: []
  patterns: [multi-company access check pattern for write actions]

key-files:
  created: []
  modified:
    - app/actions/schedule-actions.ts

key-decisions:
  - "Fast-path primary company check before querying user_company_access table"
  - "Same 'Schedule not found' error for unauthorized access (no information leakage)"

patterns-established:
  - "Multi-company write action pattern: fetch by ID only, then verify access via primary company_id OR user_company_access row"

requirements-completed: [QUICK-71]

duration: 1min
completed: 2026-03-13
---

# Quick Task 71: Fix Schedule Write Actions for Multi-Company Access

**Multi-company access check replaces single-company filter in all four schedule write actions (update, deactivate, activate, delete)**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-13T11:01:05Z
- **Completed:** 2026-03-13T11:02:20Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Fixed updateSchedule, deactivateSchedule, activateSchedule, and deleteSchedule to support multi-company users
- Replaced `.eq('company_id', profile.company_id)` with post-fetch access verification using user_company_access table
- Fast-path optimization: skip user_company_access query when schedule belongs to user's primary company
- Security maintained: unauthorized users still get "Schedule not found" (no information leakage)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix multi-company access check in all schedule write actions** - `b38238f` (fix)
2. **Task 2: Build verification** - no commit (verification only, build passed)

## Files Created/Modified
- `app/actions/schedule-actions.ts` - Updated all four write actions to use multi-company access check pattern instead of single-company filter

## Decisions Made
- Used fast-path check (primary company_id match) before querying user_company_access table to avoid unnecessary DB queries in the common case
- Kept identical error message "Schedule not found" for both non-existent schedules and unauthorized access to prevent information leakage about schedule existence

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All schedule write actions now correctly support multi-company access
- Read actions (getSchedules, getSchedulesByAssetId) were already multi-company aware
- Helper functions (pauseSchedulesForAsset, resumeSchedulesForAsset, deactivateSchedulesForAsset) remain unchanged as they operate via admin/service-role clients

---
*Quick Task: 71*
*Completed: 2026-03-13*
