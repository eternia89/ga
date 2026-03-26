---
phase: quick-260326-ok9
plan: 01
subsystem: api
tags: [rollback, data-integrity, server-actions, bulk-operations, diff-update]

requires:
  - phase: none
    provides: existing server action files
provides:
  - createUser rollback on metadata failure (profile + auth user cleanup)
  - updateUser rollback on metadata failure (profile restore to snapshot)
  - Diff-based company access update (updateUserCompanyAccess)
  - BulkDeactivateResponse with failed count tracking
  - rejectCompletedWork request status rollback on job revert failure
  - Corrected acceptTransfer rollback log prefix
affects: [user-management, admin-settings, request-lifecycle, asset-transfers]

tech-stack:
  added: []
  patterns:
    - "Snapshot-before-mutate for multi-step rollback (updateUser)"
    - "Diff-based update instead of delete-all-then-insert (updateUserCompanyAccess)"
    - "Separate failed tracking in bulk operations alongside blocked"

key-files:
  created: []
  modified:
    - app/actions/user-actions.ts
    - app/actions/user-company-access-actions.ts
    - lib/types/action-responses.ts
    - app/actions/company-actions.ts
    - app/actions/category-actions.ts
    - app/actions/location-actions.ts
    - app/actions/division-actions.ts
    - app/actions/request-actions.ts
    - app/actions/asset-actions.ts
    - components/admin/companies/company-table.tsx
    - components/admin/categories/category-table.tsx
    - components/admin/locations/location-table.tsx
    - components/admin/divisions/division-table.tsx
    - __tests__/lib/types/action-responses.test.ts

key-decisions:
  - "createUser treats metadata as critical for RLS -- full rollback instead of log-and-continue"
  - "updateUser snapshots profile before mutation to enable rollback on metadata failure"
  - "updateUserCompanyAccess uses diff strategy to prevent total access loss on insert failure"
  - "Bulk deactivate tracks failed items separately from blocked for accurate error reporting"
  - "rejectCompletedWork rolls back request status on job revert failure instead of silent inconsistency"

patterns-established:
  - "Snapshot-restore pattern: fetch current values before multi-step mutation, restore on later step failure"
  - "Diff-based update pattern: compute toAdd/toRemove from current vs desired, apply surgically"
  - "Failed tracking pattern: bulk operations distinguish blocked (dependency) from failed (error)"

requirements-completed: []

duration: 4min
completed: 2026-03-26
---

# Quick Task 260326-ok9: Bug Fix Protocol Sweep 4 Summary

**Hardened 8 server actions with rollback, diff-based updates, and accurate bulk error tracking to prevent silent data inconsistency**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T10:49:21Z
- **Completed:** 2026-03-26T10:53:06Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- createUser now fully rolls back (deletes profile + auth user) when metadata update fails, preventing broken accounts with no RLS data
- updateUser snapshots profile values before mutation and restores them if metadata update fails, preventing profile/JWT mismatch
- updateUserCompanyAccess uses diff strategy (delete removed, insert added) instead of delete-all-then-insert, preventing total access loss on insert failure
- All 4 bulk deactivate functions now track and report failed items separately from blocked items with accurate counts
- All 4 admin table UIs display failed count in feedback messages when failures occur
- rejectCompletedWork rolls back request status to pending_acceptance when job revert fails, preventing request/job state mismatch
- acceptTransfer rollback log message corrected from [rejectTransfer] to [acceptTransfer]

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix user action rollback gaps** - `ce37008` (fix)
2. **Task 2: Fix bulk deactivate error tracking and rejectCompletedWork/acceptTransfer** - `51ea61e` (fix)

## Files Created/Modified
- `app/actions/user-actions.ts` - createUser rollback + updateUser snapshot/rollback on metadata failure
- `app/actions/user-company-access-actions.ts` - Diff-based company access update
- `lib/types/action-responses.ts` - BulkDeactivateResponse with failed field
- `app/actions/company-actions.ts` - Failed tracking in bulkDeactivateCompanies
- `app/actions/category-actions.ts` - Failed tracking in bulkDeactivateCategories
- `app/actions/location-actions.ts` - Failed tracking in bulkDeactivateLocations
- `app/actions/division-actions.ts` - Failed tracking in bulkDeactivateDivisions
- `app/actions/request-actions.ts` - rejectCompletedWork rollback on job revert failure
- `app/actions/asset-actions.ts` - acceptTransfer log message typo fix
- `components/admin/companies/company-table.tsx` - Display failed count in feedback
- `components/admin/categories/category-table.tsx` - Display failed count in feedback
- `components/admin/locations/location-table.tsx` - Display failed count in feedback
- `components/admin/divisions/division-table.tsx` - Display failed count in feedback
- `__tests__/lib/types/action-responses.test.ts` - Updated test for failed field

## Decisions Made
- Treated metadata as critical for createUser/updateUser (RLS depends on it) -- full rollback instead of log-and-continue
- Used diff strategy for company access updates -- if insert fails, user retains existing access minus intentional removals
- Kept bulk deactivate as per-item loops (plan didn't call for batch `.in()` conversion, only error tracking)
- Added rollback to rejectCompletedWork instead of just logging -- state mismatch between requests and jobs is user-visible

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed BulkDeactivateResponse test missing `failed` field**
- **Found during:** Task 2 (BulkDeactivateResponse type change)
- **Issue:** Existing test in `__tests__/lib/types/action-responses.test.ts` used old type without `failed` field, causing tsc error
- **Fix:** Added `failed: 0` to test object and assertion
- **Files modified:** `__tests__/lib/types/action-responses.test.ts`
- **Verification:** tsc compiles cleanly
- **Committed in:** 51ea61e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary type propagation fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 10 data integrity bugs from sweep 4 research are fixed
- Server actions are hardened with proper rollback patterns
- Remaining lower-priority findings (changeAssetStatus schedule hooks, deleteAssetPhotos storage orphans, deactivateSchedule job cleanup) documented in research as acceptable patterns

## Self-Check: PASSED

All 15 files verified present. Both task commits (ce37008, 51ea61e) verified in git log.

---
*Phase: quick-260326-ok9*
*Completed: 2026-03-26*
