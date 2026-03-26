---
phase: quick
plan: 260326-fca
subsystem: api
tags: [security, vision-api, company-access, authorization]

# Dependency graph
requires:
  - phase: none
    provides: n/a
provides:
  - "Secured vision describe endpoint with company access validation"
affects: [api-routes, media-attachments]

# Tech tracking
tech-stack:
  added: []
  patterns: [fetch-then-validate for admin client mutations]

key-files:
  created: []
  modified:
    - app/api/vision/describe/route.ts

key-decisions:
  - "Used adminClient (not user client) for assertCompanyAccess, consistent with schedule-actions.ts pattern"
  - "Return description without updating for missing/deleted attachments (non-fatal, matches route philosophy)"
  - "Return 403 Forbidden for cross-company access (deliberate security boundary, not graceful degradation)"

patterns-established:
  - "API routes using adminClient for business table mutations must validate company access before the mutation"

requirements-completed: [SECURITY-VISION-01]

# Metrics
duration: 2min
completed: 2026-03-26
---

# Quick Task 260326-fca: Vision API Security Fix Summary

**Closed cross-company data poisoning vulnerability in vision describe route by adding assertCompanyAccess validation before adminClient update**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-26T04:08:06Z
- **Completed:** 2026-03-26T04:10:21Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Fixed cross-company data poisoning vulnerability: any authenticated user could overwrite any attachment's description system-wide via the vision describe endpoint
- Added fetch-then-validate pattern: attachment is fetched with deleted_at filter, company access is validated via assertCompanyAccess, then update proceeds
- Audited all other API routes using admin client -- confirmed vision describe was the only unguarded business table mutation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add company access validation to vision describe route** - `6e38d96` (fix)
2. **Task 2: Verify no similar vulnerability in other API routes** - no code changes (audit-only task)

## Files Created/Modified
- `app/api/vision/describe/route.ts` - Added assertCompanyAccess import, expanded profile query to include company_id, added fetch-then-validate-then-update pattern with deleted_at filtering and 403 response for cross-company access

## Decisions Made
- Used `adminClient` (service role) for the `assertCompanyAccess` call, consistent with how schedule-actions.ts uses it -- the `user_company_access` SELECT policy allows users to see their own rows either way
- Return `{ description }` without updating for missing/deleted attachments -- non-fatal, matches the route's existing philosophy for downstream operations
- Return 403 Forbidden for cross-company access attempts -- this is a deliberate security boundary, not a graceful degradation scenario

## Deviations from Plan

None - plan executed exactly as written.

## Codebase Audit Findings (Task 2)

**Upload routes (5 routes):** All use adminClient for Supabase Storage uploads and media_attachments INSERTs with `company_id: profile.company_id` (user's own company). Safe -- creating data in own company context.

**entity-photos/route.ts:** Has a fire-and-forget Vision API call that updates `media_attachments.description` using adminClient. Safe -- the `attachmentId` comes from `insertedRow.id` (the row the route just created), not from user input.

**Vision describe route (this fix):** Was the only API route accepting a user-controlled `attachmentId` and using adminClient to update a business table without company access validation. Now secured.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Security fix is complete and self-contained
- No follow-up tasks needed

---
*Plan: quick-260326-fca*
*Completed: 2026-03-26*

## Self-Check: PASSED

- FOUND: app/api/vision/describe/route.ts
- FOUND: commit 6e38d96
- FOUND: assertCompanyAccess call in route
