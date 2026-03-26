---
phase: quick
plan: 260326-nmx
subsystem: api
tags: [supabase, error-handling, storage, signed-urls]

# Dependency graph
requires: []
provides:
  - "Error handling for all fire-and-forget Supabase mutations in action files"
  - "Error logging for storage .remove() cleanup in upload routes"
  - "Error destructuring and logging for all createSignedUrls calls"
  - "Empty-URL filtering in all component/page files using signed URLs"
affects: [actions, upload-routes, photo-display]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CRITICAL mutations throw on error; HIGH/MEDIUM mutations console.error with [ActionName] prefix"
    - "Storage cleanup .remove() in error paths uses { error: cleanupError } destructuring"
    - "createSignedUrls always destructures { error: signedUrlError } and logs failures"
    - ".filter((p) => p.url !== '') after every signedUrl map to prevent broken images"

key-files:
  created: []
  modified:
    - app/actions/job-actions.ts
    - app/actions/schedule-actions.ts
    - app/actions/request-actions.ts
    - app/actions/asset-actions.ts
    - app/actions/approval-actions.ts
    - app/api/auth/signout/route.ts
    - app/api/uploads/request-photos/route.ts
    - app/api/uploads/asset-photos/route.ts
    - app/api/uploads/asset-invoices/route.ts
    - app/api/uploads/entity-photos/route.ts
    - app/api/uploads/job-photos/route.ts
    - components/assets/asset-view-modal.tsx
    - components/assets/asset-transfer-respond-modal.tsx
    - components/jobs/job-modal.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/jobs/[id]/page.tsx
    - app/(dashboard)/requests/[id]/page.tsx
    - app/(dashboard)/requests/page.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/[id]/page.tsx

key-decisions:
  - "CRITICAL mutations (approval gate bypass, link creation) throw to prevent data inconsistency"
  - "HIGH/MEDIUM mutations use console.error without throw since the primary operation already committed"
  - "approval-actions intentional log-without-throw pattern documented inline"

patterns-established:
  - "Error variable naming convention: use descriptive names (approvalError, linkError, reqStatusError) to avoid shadowing"
  - "Storage cleanup error handling: destructure { error: cleanupError } in error paths"
  - "createSignedUrls pattern: always destructure error, log with component/action prefix, filter empty URLs"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-03-26
---

# Quick Plan 260326-nmx: Bug Fix Protocol Sweep 2 Summary

**Added error handling to 18 fire-and-forget Supabase mutations, storage cleanup calls, and signedUrl operations across 20 files**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T10:10:08Z
- **Completed:** 2026-03-26T10:17:45Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments
- Fixed 2 CRITICAL fire-and-forget mutations (approval gate bypass, orphaned job-request links) -- now throw on error
- Fixed 10 HIGH fire-and-forget mutations across job-actions, schedule-actions, request-actions, asset-actions, and signout route -- now log on error
- Fixed 4 MEDIUM gaps: storage .remove() error handling (6 locations), asset-invoices partial flag, approval-actions documentation
- Fixed 2 LOW gaps: createSignedUrls error destructuring in 16 locations, empty-URL filtering in 13 component/page locations

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix CRITICAL + HIGH error handling in action files** - `6120711` (fix)
2. **Task 2: Fix MEDIUM gaps in storage cleanup, upload routes, and approval docs** - `7486861` (fix)
3. **Task 3: Fix LOW signedUrl error handling and empty-string filtering** - `0dc5420` (fix)

## Files Created/Modified
- `app/actions/job-actions.ts` - C-1, C-2, H-1, H-2, H-3, H-4 error handling
- `app/actions/schedule-actions.ts` - H-5, H-6 error handling for PM job cancellation
- `app/actions/request-actions.ts` - H-7 error handling + L-2 signedUrl error
- `app/actions/asset-actions.ts` - H-8, H-9 rollback error handling + M-1 storage remove + L-2 signedUrl errors (2)
- `app/actions/approval-actions.ts` - M-4 inline documentation of intentional log-without-throw
- `app/api/auth/signout/route.ts` - H-10 signOut error handling
- `app/api/uploads/request-photos/route.ts` - M-2 storage cleanup error handling
- `app/api/uploads/asset-photos/route.ts` - M-2 storage cleanup error handling
- `app/api/uploads/asset-invoices/route.ts` - M-2 storage cleanup + M-3 partial flag
- `app/api/uploads/entity-photos/route.ts` - M-2 storage cleanup error handling
- `app/api/uploads/job-photos/route.ts` - M-2 storage cleanup error handling
- `components/assets/asset-view-modal.tsx` - L-1, L-2 signedUrl error + empty-URL filter (3 locations)
- `components/assets/asset-transfer-respond-modal.tsx` - L-1, L-2 signedUrl error + empty-URL filter (2 locations)
- `components/jobs/job-modal.tsx` - L-1, L-2 signedUrl error + empty-URL filter (2 locations)
- `app/(dashboard)/jobs/page.tsx` - L-1, L-2 signedUrl error + empty-URL filter
- `app/(dashboard)/jobs/[id]/page.tsx` - L-1, L-2 signedUrl error + empty-URL filter (2 locations)
- `app/(dashboard)/requests/[id]/page.tsx` - L-1, L-2 signedUrl error + empty-URL filter
- `app/(dashboard)/requests/page.tsx` - L-1, L-2 signedUrl error + empty-URL filter
- `app/(dashboard)/inventory/page.tsx` - L-1, L-2 signedUrl error + empty-URL filter
- `app/(dashboard)/inventory/[id]/page.tsx` - L-1, L-2 signedUrl error + empty-URL filter (3 locations)

## Decisions Made
- CRITICAL mutations (C-1 approval gate, C-2 link creation) throw on error because silent failure causes data integrity violations
- HIGH mutations log but don't throw because the primary operation already committed successfully
- approval-actions M-4: documented the existing intentional log-without-throw as a design decision (approval more important than linked request status update)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `e2e/tests/phase-06-inventory/asset-crud.spec.ts:107` (type cast issue) -- unrelated to changes, not fixed
- Pre-existing lint warnings in several files (prefer-const, no-img-element, react-hooks) -- unrelated, not fixed

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All error handling gaps from Sweep 2 are resolved
- Codebase has consistent error handling patterns across all action files and upload routes
- No remaining fire-and-forget Supabase mutations without error checks

---
## Self-Check: PASSED

All 15 modified files verified present. All 3 task commits verified in git log.

---
*Plan: quick-260326-nmx*
*Completed: 2026-03-26*
