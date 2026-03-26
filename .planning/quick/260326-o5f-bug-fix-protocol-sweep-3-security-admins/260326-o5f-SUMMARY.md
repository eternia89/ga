---
phase: quick-260326-o5f
plan: 01
subsystem: auth
tags: [security, adminSupabase, company-scoping, assertCompanyAccess, defense-in-depth]

# Dependency graph
requires:
  - phase: quick-260326-fca
    provides: "assertCompanyAccess pattern and vision API fix"
provides:
  - "assertCompanyAccess enforcement in deactivateUser and reactivateUser"
  - "Multi-company admin support for company-settings actions"
  - "assertCompanyAccess in updateUserCompanyAccess"
  - "Defense-in-depth company_id filters on all adminSupabase media mutations"
  - "Entity-sourced company_id in all upload route media inserts"
affects: [user-management, company-settings, media-attachments, upload-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Entity-sourced company_id pattern for upload routes (use entity's company_id, not profile.company_id)"
    - "Cross-company admin client pattern (assertCompanyAccess + adminSupabase when company_id differs)"

key-files:
  created: []
  modified:
    - app/actions/user-actions.ts
    - app/actions/company-settings-actions.ts
    - app/actions/user-company-access-actions.ts
    - app/actions/request-actions.ts
    - app/actions/job-actions.ts
    - app/api/uploads/asset-photos/route.ts
    - app/api/uploads/asset-invoices/route.ts
    - app/api/uploads/entity-photos/route.ts

key-decisions:
  - "Use inline if-check for cross-company detection instead of isCrossCompany const to satisfy TypeScript narrowing"
  - "For asset-photos route transfer types, fetch company_id from inventory_movements table instead of inventory_items"

patterns-established:
  - "Entity-sourced company_id: Upload routes must use the verified entity's company_id for media_attachment inserts and storage paths, never profile.company_id"
  - "Cross-company admin client: When an action accepts optional company_id and it differs from profile.company_id, create adminSupabase client for all DB operations in that invocation"

requirements-completed: [SECURITY-SWEEP-3]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Quick Task 260326-o5f: Bug Fix Protocol Sweep 3 Summary

**7 adminSupabase/company-scoping security fixes: assertCompanyAccess enforcement in user/settings/access actions + defense-in-depth company_id filters on media mutations and upload routes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-26T10:32:31Z
- **Completed:** 2026-03-26T10:36:31Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added assertCompanyAccess to deactivateUser, reactivateUser, and updateUserCompanyAccess -- closing MEDIUM-risk authorization gaps where admins could affect users in companies they don't have access to
- Added optional company_id support to company-settings actions enabling multi-company admin workflows with proper assertCompanyAccess validation
- Added defense-in-depth company_id filters to deleteMediaAttachment and deleteJobAttachment adminSupabase updates
- Fixed all 3 upload routes (asset-photos, asset-invoices, entity-photos) to use entity's verified company_id instead of profile.company_id for storage paths and media_attachment inserts

## Task Commits

Each task was committed atomically:

1. **Task 1: Add assertCompanyAccess to user + settings + access actions** - `b02087c` (fix)
2. **Task 2: Add defense-in-depth company_id filters to media mutations and upload routes** - `5266119` (fix)

## Files Created/Modified
- `app/actions/user-actions.ts` - Added assertCompanyAccess to deactivateUser and reactivateUser
- `app/actions/company-settings-actions.ts` - Added optional company_id input with assertCompanyAccess and adminSupabase for cross-company operations
- `app/actions/user-company-access-actions.ts` - Added assertCompanyAccess for target user's company before modifying access
- `app/actions/request-actions.ts` - Added company_id to request select and .eq('company_id') filter on adminSupabase media soft-delete
- `app/actions/job-actions.ts` - Added company_id to job select and .eq('company_id') filter on adminSupabase media soft-delete
- `app/api/uploads/asset-photos/route.ts` - Added entity verification (asset or movement), use entity's company_id for storage and insert
- `app/api/uploads/asset-invoices/route.ts` - Changed storage path and insert to use asset.company_id
- `app/api/uploads/entity-photos/route.ts` - Captured entity's company_id from request/entity record, used for storage and insert

## Decisions Made
- Used inline if-check (`if (parsedInput.company_id && parsedInput.company_id !== profile.company_id)`) instead of extracted `const isCrossCompany` to allow TypeScript to narrow the optional type correctly inside the block
- For the asset-photos upload route transfer types (transfer_send, transfer_receive, transfer_reject), fetched company_id from `inventory_movements` table since the entityId is a movementId, not an assetId

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type narrowing for optional company_id**
- **Found during:** Task 1 (company-settings-actions.ts)
- **Issue:** Using `const isCrossCompany = parsedInput.company_id && ...` and then passing `parsedInput.company_id` inside the if-block failed TypeScript narrowing -- `parsedInput.company_id` was still `string | undefined`
- **Fix:** Used direct `if (parsedInput.company_id && ...)` check without intermediate const, allowing TypeScript to narrow the type inside the block
- **Files modified:** app/actions/company-settings-actions.ts
- **Verification:** Build passes with no TypeScript errors
- **Committed in:** b02087c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor TypeScript adjustment. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All adminSupabase mutations now have proper company-scoping or assertCompanyAccess enforcement
- assertCompanyAccess adoption is now complete across all action files that use adminSupabase mutations
- Upload routes consistently use entity-sourced company_id

## Self-Check: PASSED

All 8 modified files verified on disk. Both task commits (b02087c, 5266119) confirmed in git history. Build compiles cleanly.

---
*Phase: quick-260326-o5f*
*Completed: 2026-03-26*
