---
phase: quick
plan: 260318-fv3
subsystem: api
tags: [optimistic-locking, concurrency, server-actions, zod]

# Dependency graph
requires: []
provides:
  - Optimistic locking on updateAsset, updateJob, updateRequest server actions
affects: [asset-actions, job-actions, request-actions, asset-edit-form, job-detail-info, request-edit-form]

# Tech tracking
tech-stack:
  added: []
  patterns: [optimistic-locking-via-updated-at-timestamp]

key-files:
  created: []
  modified:
    - app/actions/asset-actions.ts
    - app/actions/job-actions.ts
    - app/actions/request-actions.ts
    - lib/validations/job-schema.ts
    - components/assets/asset-edit-form.tsx
    - components/jobs/job-detail-info.tsx
    - components/requests/request-edit-form.tsx

key-decisions:
  - "Used application-level timestamp comparison instead of DB-level WHERE clause for clearer error messages"
  - "Made updated_at optional in schemas so existing callers without it continue working"

patterns-established:
  - "Optimistic locking pattern: pass entity.updated_at from form, compare against DB value before update, throw descriptive error on mismatch"

requirements-completed: [QUICK-260318-FV3]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Quick Task 260318-fv3: Optimistic Locking Summary

**Optimistic locking via updated_at timestamp comparison on updateAsset, updateJob, and updateRequest to detect and reject concurrent edits**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T04:28:43Z
- **Completed:** 2026-03-18T04:31:51Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- All three update server actions now check `updated_at` before applying changes
- All three form components pass `updated_at` from the entity object to the action
- Stale writes produce a clear error: "This record was modified by another user. Please refresh the page and re-apply your changes."
- Normal single-user edits are unaffected (timestamps match, check passes transparently)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add optimistic locking to all three update server actions** - `99a9928` (feat)
2. **Task 2: Pass updated_at from form components to update actions** - `6c51454` (feat)

## Files Created/Modified
- `app/actions/asset-actions.ts` - Added updated_at to schema, select, and lock check in updateAsset
- `app/actions/job-actions.ts` - Added updated_at to select and lock check in updateJob
- `app/actions/request-actions.ts` - Added updated_at to schema, select, and lock check in updateRequest
- `lib/validations/job-schema.ts` - Added updated_at field to updateJobSchema
- `components/assets/asset-edit-form.tsx` - Passes asset.updated_at to updateAsset
- `components/jobs/job-detail-info.tsx` - Passes job.updated_at to updateJob
- `components/requests/request-edit-form.tsx` - Passes request.updated_at to updateRequest

## Decisions Made
- Used application-level timestamp comparison (`if (parsedInput.updated_at && existing.updated_at !== parsedInput.updated_at)`) instead of adding `.eq('updated_at', ...)` to the Supabase WHERE clause. This gives a clear, specific error message rather than confusing "not found" when timestamps don't match.
- Made `updated_at` optional (`.optional()`) in all schemas so any existing callers that don't provide it will skip the check gracefully.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

---
*Plan: quick-260318-fv3*
*Completed: 2026-03-18*
