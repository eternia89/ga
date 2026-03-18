---
phase: quick
plan: 260318-bnb
subsystem: api
tags: [typescript, server-actions, type-safety, next-safe-action]

# Dependency graph
requires: []
provides:
  - "ActionResponse<T> base type system for all server actions"
  - "Explicit return type annotations on all 81 server actions across 15 files"
  - "ScheduleListItem and TemplateListItem interfaces for query action return shapes"
affects: [all action consumers, component type inference]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ActionResponse<T> base type for server action returns"
    - "Promise<ActionOk> annotation on void-like actions"
    - "Inline ActionResponse<{ fieldName: type }> for entity-specific returns"

key-files:
  created:
    - "lib/types/action-responses.ts"
  modified:
    - "app/actions/approval-actions.ts"
    - "app/actions/asset-actions.ts"
    - "app/actions/category-actions.ts"
    - "app/actions/company-actions.ts"
    - "app/actions/company-settings-actions.ts"
    - "app/actions/division-actions.ts"
    - "app/actions/job-actions.ts"
    - "app/actions/location-actions.ts"
    - "app/actions/pm-job-actions.ts"
    - "app/actions/profile-actions.ts"
    - "app/actions/request-actions.ts"
    - "app/actions/schedule-actions.ts"
    - "app/actions/template-actions.ts"
    - "app/actions/user-actions.ts"
    - "app/actions/user-company-access-actions.ts"

key-decisions:
  - "Used empty object {} as default generic parameter instead of Record<string, never> to avoid type conflicts with { success: true }"
  - "Defined ActionOk as concrete { success: true } rather than alias to ActionResponse to avoid intersection with never-type index signature"
  - "Created ScheduleListItem and TemplateListItem as file-local interfaces for complex query return shapes rather than adding to shared types"
  - "Actions without success field (getUsers, getCompanySettings, getUserCompanyAccess) annotated with their actual return shape instead of ActionResponse"
  - "Added return type to advanceFloatingScheduleCore plain function since safe-action wrapper inherits its type"

patterns-established:
  - "ActionResponse<T> pattern: all new actions use Promise<ActionResponse<{ fieldName: type }>> or Promise<ActionOk>"
  - "Type-only imports: use 'import type { ... }' for action response types"

requirements-completed: []

# Metrics
duration: 15min
completed: 2026-03-18
---

# Quick Task 260318-bnb: Standardize Server Action Response Shape

**ActionResponse<T> type system with explicit return annotations on all 81 server actions -- zero runtime changes, full IDE hover-to-discover**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-18T01:29:15Z
- **Completed:** 2026-03-18T01:44:23Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Created `lib/types/action-responses.ts` with ActionResponse<T> base type and 8 specific response types (ActionOk, BulkDeactivateResponse, PhotosResponse, InvoicesResponse, DeleteAttachmentsResponse, ChecklistProgressResponse, ChecklistCompleteResponse, AdvanceScheduleResponse)
- Added explicit `Promise<T>` return type annotations to all 81 `.action()` callbacks across 15 action files
- Zero runtime changes -- all return statements unchanged, only TypeScript type annotations added
- npm run build succeeds with zero type errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ActionResponse type system** - `6f4907c` (feat)
2. **Task 2: Add return type annotations to all 81 server actions** - `30970da` (feat)

## Files Created/Modified
- `lib/types/action-responses.ts` - ActionResponse<T> base type and 8 specific response types
- `app/actions/approval-actions.ts` - 4 actions annotated (all ActionOk)
- `app/actions/asset-actions.ts` - 10 actions annotated (create, update, status, transfer, photos, invoices)
- `app/actions/category-actions.ts` - 5 actions annotated (CRUD + bulk deactivate)
- `app/actions/company-actions.ts` - 5 actions annotated (CRUD + bulk deactivate)
- `app/actions/company-settings-actions.ts` - 2 actions annotated (get settings, update setting)
- `app/actions/division-actions.ts` - 6 actions annotated (CRUD + getCompanies + bulk deactivate)
- `app/actions/job-actions.ts` - 7 actions annotated (CRUD + status + comment + attachment)
- `app/actions/location-actions.ts` - 5 actions annotated (CRUD + bulk deactivate)
- `app/actions/pm-job-actions.ts` - 4 safe-actions + 1 core function annotated (checklist + advance)
- `app/actions/profile-actions.ts` - 2 actions annotated (update profile, change password)
- `app/actions/request-actions.ts` - 11 actions annotated (full lifecycle + photos)
- `app/actions/schedule-actions.ts` - 7 actions annotated (CRUD + get queries)
- `app/actions/template-actions.ts` - 6 actions annotated (CRUD + get queries)
- `app/actions/user-actions.ts` - 5 actions annotated (get, create, update, deactivate, reactivate)
- `app/actions/user-company-access-actions.ts` - 2 actions annotated (get access, update access)

## Decisions Made
- Used empty object `{}` as default generic parameter for ActionResponse instead of `Record<string, never>` -- the never-indexed type was too strict and rejected `{ success: true }` at compile time
- Defined `ActionOk` as a concrete `{ success: true }` type rather than an alias to `ActionResponse<{}>` to avoid TypeScript intersection issues
- Actions that don't return `{ success }` (getUsers, getCompanySettings, getUserCompanyAccess) were annotated with their actual return shapes as inline types rather than forcing them into the ActionResponse pattern
- Added AdvanceScheduleResponse return type to the `advanceFloatingScheduleCore` plain function (not a safe-action) because the safe-action wrapper `advanceFloatingSchedule` returns its result directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ActionResponse default generic parameter**
- **Found during:** Task 2 (build verification)
- **Issue:** `Record<string, never>` as the default generic means every property must be `never`, but `{ success: true }` has a `true` property, causing type incompatibility
- **Fix:** Changed default to `{}` (empty object) and defined ActionOk as concrete `{ success: true }`
- **Files modified:** lib/types/action-responses.ts
- **Verification:** npm run build passes
- **Committed in:** 30970da (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed duplicate ChecklistItem import in schedule-actions.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** `ChecklistItem` was already imported on line 7; adding `ScheduleDisplayStatus` import from the same module created a duplicate identifier
- **Fix:** Merged both imports into a single import statement
- **Files modified:** app/actions/schedule-actions.ts
- **Verification:** npm run build passes
- **Committed in:** 30970da (Task 2 commit)

**3. [Rule 1 - Bug] Added return type to advanceFloatingScheduleCore**
- **Found during:** Task 2 (build verification)
- **Issue:** TypeScript inferred `success` as `boolean` (not literal `true`) in the core function, causing the safe-action wrapper's AdvanceScheduleResponse annotation to fail
- **Fix:** Added explicit `Promise<AdvanceScheduleResponse>` return type to the core function
- **Files modified:** app/actions/pm-job-actions.ts
- **Verification:** npm run build passes
- **Committed in:** 30970da (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for type correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Self-Check: PASSED

- lib/types/action-responses.ts: FOUND
- 260318-bnb-SUMMARY.md: FOUND
- Commit 6f4907c: FOUND
- Commit 30970da: FOUND

---
*Plan: quick-260318-bnb*
*Completed: 2026-03-18*
