---
phase: quick-260326-h9c
plan: 01
subsystem: ui, validations
tags: [constants, DRY, zod, role-display, checklist-types, job-status]

# Dependency graph
requires: []
provides:
  - "ROLE_COLORS and ROLE_DISPLAY shared constants in lib/constants/role-display.ts"
  - "CHECKLIST_TYPE_COLORS shared constant in lib/constants/checklist-types.ts"
  - "optionalUuid() validation helper in lib/validations/helpers.ts"
affects: [any-component-using-role-badges, template-components, schedule-components, validation-schemas]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared color/display constants for badge rendering"
    - "optionalUuid() helper for form-bound nullable UUID fields"

key-files:
  created:
    - "lib/constants/role-display.ts"
    - "__tests__/lib/validations/helpers.test.ts"
  modified:
    - "lib/constants/checklist-types.ts"
    - "lib/validations/helpers.ts"
    - "components/profile/profile-sheet.tsx"
    - "components/admin/users/user-columns.tsx"
    - "components/user-menu.tsx"
    - "app/(dashboard)/page.tsx"
    - "components/maintenance/template-builder-item.tsx"
    - "components/maintenance/template-view-modal.tsx"
    - "components/maintenance/template-detail.tsx"
    - "components/maintenance/schedule-view-modal.tsx"
    - "components/maintenance/schedule-detail.tsx"
    - "lib/validations/template-schema.ts"
    - "lib/validations/user-schema.ts"
    - "lib/validations/schedule-schema.ts"

key-decisions:
  - "Typed ROLE_COLORS/ROLE_DISPLAY as Record<Role, string> instead of Record<string, string> for compile-time safety"
  - "Moved test to __tests__/lib/validations/ to match existing vitest include pattern"
  - "Replaced stale schedule job status copies with canonical imports, accepting intentional color changes (yellow->amber for in_progress, red->stone for cancelled)"

patterns-established:
  - "Role display: always import from lib/constants/role-display.ts, never inline"
  - "Checklist type colors: always import CHECKLIST_TYPE_COLORS from lib/constants/checklist-types.ts"
  - "Job status labels/colors: always import from lib/constants/job-status.ts"
  - "Optional UUID validation: use optionalUuid() from lib/validations/helpers.ts"

requirements-completed: [DRY-roleColors, DRY-typeColors, DRY-jobStatus, DRY-optionalUuid]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Quick Task 260326-h9c: DRY Extractions Summary

**Extracted 4 duplicated constant sets into shared canonical files with optionalUuid() validation helper and 6 unit tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T06:09:03Z
- **Completed:** 2026-03-26T06:14:29Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Created shared ROLE_COLORS/ROLE_DISPLAY constants typed as Record<Role, string>, fixing "Ga Lead" display bug in user-menu and dashboard (computed split produced wrong casing)
- Added CHECKLIST_TYPE_COLORS to existing checklist-types.ts and removed 3 inline duplicates
- Replaced stale job status copies in schedule components with canonical imports, adding support for 2 missing statuses (pending_approval, pending_completion_approval) and fixing divergent colors
- Created optionalUuid() helper with 6 passing tests, adopted in 3 schema files replacing 4 ad-hoc patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract role and checklist type color constants, update 7 consumer files** - `af381b8` (refactor)
2. **Task 2 RED: Add failing test for optionalUuid helper** - `4029e3d` (test)
3. **Task 2 GREEN: Implement optionalUuid + replace stale job status + adopt in schemas** - `6dc1020` (feat)

## Files Created/Modified
- `lib/constants/role-display.ts` - NEW: ROLE_COLORS and ROLE_DISPLAY typed as Record<Role, string>
- `lib/constants/checklist-types.ts` - Added CHECKLIST_TYPE_COLORS constant
- `lib/validations/helpers.ts` - Added optionalUuid() helper
- `__tests__/lib/validations/helpers.test.ts` - NEW: 6 unit tests for optionalUuid
- `components/profile/profile-sheet.tsx` - Replaced inline roleColors/roleDisplay with imports
- `components/admin/users/user-columns.tsx` - Replaced inline roleColors/roleDisplay with imports
- `components/user-menu.tsx` - Replaced inline roleColors/roleDisplay with imports
- `app/(dashboard)/page.tsx` - Replaced inline roleColors/roleDisplay with imports
- `components/maintenance/template-builder-item.tsx` - Replaced inline TYPE_COLORS with CHECKLIST_TYPE_COLORS import
- `components/maintenance/template-view-modal.tsx` - Replaced inline TYPE_COLORS with CHECKLIST_TYPE_COLORS import
- `components/maintenance/template-detail.tsx` - Replaced inline TYPE_COLORS with CHECKLIST_TYPE_COLORS import
- `components/maintenance/schedule-view-modal.tsx` - Replaced stale JOB_STATUS_LABELS/jobStatusColor with canonical imports
- `components/maintenance/schedule-detail.tsx` - Replaced stale JOB_STATUS_LABELS/jobStatusColor with canonical imports
- `lib/validations/template-schema.ts` - Replaced ad-hoc optional UUID chain with optionalUuid()
- `lib/validations/user-schema.ts` - Replaced ad-hoc optional UUID chain with optionalUuid()
- `lib/validations/schedule-schema.ts` - Replaced ad-hoc optional UUID chain with optionalUuid()

## Decisions Made
- Used Record<Role, string> instead of Record<string, string> for ROLE_COLORS/ROLE_DISPLAY to get compile-time exhaustiveness
- Placed test in __tests__/lib/validations/ instead of co-located (vitest config restricts to __tests__/**)
- Accepted color changes in schedule components (in_progress: yellow->amber, cancelled: red->stone) as the canonical source uses these colors consistently across the app

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test file location adjusted for vitest config**
- **Found during:** Task 2 (TDD RED phase)
- **Issue:** Plan specified `lib/validations/helpers.test.ts` but vitest config only includes `__tests__/**/*.test.ts`
- **Fix:** Created test at `__tests__/lib/validations/helpers.test.ts` instead
- **Files modified:** __tests__/lib/validations/helpers.test.ts
- **Verification:** Tests discovered and run correctly by vitest
- **Committed in:** 4029e3d (Task 2 RED commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor file path adjustment to match existing test infrastructure. No scope change.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 constant sets now have single canonical sources
- Future additions to role colors, checklist type colors, or job status colors only need one file update
- optionalUuid() available for any new optional UUID form fields

## Self-Check: PASSED

All created files verified present. All 3 commit hashes verified in git log.

---
*Phase: quick-260326-h9c*
*Completed: 2026-03-26*
