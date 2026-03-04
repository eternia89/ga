---
phase: quick-6
plan: 1
subsystem: database
tags: [display-id, sql, rpc, migration, globally-unique]

requires:
  - phase: 01-database-schema-supabase-setup
    provides: id_counters table, companies.code column
  - phase: 04-requests
    provides: generate_request_display_id function
  - phase: 05-jobs-approvals
    provides: generate_job_display_id function
  - phase: 06-inventory
    provides: generate_asset_display_id function
  - phase: 07-preventive-maintenance
    provides: generate_pm_jobs function
provides:
  - "Unified generate_entity_display_id(p_company_id, p_entity_type) function"
  - "Global display ID format: {R/J/I}{CC}-{YY}-{NNN}"
  - "Global unique constraints on display_id columns"
affects: [all entity creation, PM job generation, E2E tests]

tech-stack:
  added: []
  patterns: ["Global counter via sentinel UUID for cross-company uniqueness"]

key-files:
  created:
    - supabase/migrations/00015_display_id_new_convention.sql
  modified:
    - app/actions/request-actions.ts
    - app/actions/job-actions.ts
    - app/actions/asset-actions.ts
    - e2e/pages/requests/request-detail.page.ts
    - e2e/pages/jobs/job-detail.page.ts
    - e2e/pages/inventory/asset-detail.page.ts
    - e2e/tests/phase-04-requests/request-submit.spec.ts
    - e2e/tests/phase-04-requests/request-detail.spec.ts
    - e2e/tests/phase-05-jobs/job-crud.spec.ts
    - e2e/tests/phase-05-jobs/job-detail.spec.ts
    - e2e/tests/phase-05-jobs/approval-flow.spec.ts
    - e2e/tests/phase-06-inventory/asset-crud.spec.ts
    - e2e/tests/phase-08-media-notifications/photo-upload.spec.ts

key-decisions:
  - "Global counter uses sentinel UUID (00000000-0000-0000-0000-000000000000) as company_id in id_counters to avoid per-company scoping"
  - "Counter key format: {entity_type}_global_{YY} to avoid conflicting with existing per-company counter rows"
  - "Old functions (generate_request_display_id, etc.) NOT dropped - can be cleaned up later"
  - "Company code must be exactly 2 characters - enforced with RAISE EXCEPTION"

patterns-established:
  - "Unified RPC: generate_entity_display_id(company_id, entity_type) replaces per-entity functions"

requirements-completed: []

duration: 5min
completed: 2026-03-04
---

# Quick Task 6: Change Display ID Convention Summary

**Unified generate_entity_display_id function producing globally unique R/J/I{CC}-{YY}-{NNN} display IDs with global counter via sentinel UUID**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-04T06:20:37Z
- **Completed:** 2026-03-04T06:25:57Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- New SQL function `generate_entity_display_id` produces format like RAB-26-001, JAB-26-002, IAB-26-003
- Global counter ensures cross-company uniqueness via sentinel UUID in id_counters
- PM auto-generated jobs (generate_pm_jobs) updated to use new function
- All 3 server actions and 10 E2E test files updated to match new format
- Build passes clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DB migration with new unified display ID function** - `a5a5681` (feat)
2. **Task 2: Update server actions and E2E tests for new display ID format** - `afd9d29` (feat)

## Files Created/Modified
- `supabase/migrations/00015_display_id_new_convention.sql` - New unified function, updated generate_pm_jobs, global unique constraints
- `app/actions/request-actions.ts` - RPC call changed to generate_entity_display_id with entity_type 'request'
- `app/actions/job-actions.ts` - RPC call changed to generate_entity_display_id with entity_type 'job'
- `app/actions/asset-actions.ts` - RPC call changed to generate_entity_display_id with entity_type 'asset'
- `e2e/pages/requests/request-detail.page.ts` - Locator updated from REQ- to R[A-Z0-9] pattern
- `e2e/pages/jobs/job-detail.page.ts` - Locator updated from JOB- to J[A-Z0-9] pattern
- `e2e/pages/inventory/asset-detail.page.ts` - Locator updated from AST- to (AST-|I[A-Z0-9]) pattern
- `e2e/tests/phase-04-requests/request-submit.spec.ts` - Pattern updated for new request ID format
- `e2e/tests/phase-04-requests/request-detail.spec.ts` - Pattern updated for new request ID format
- `e2e/tests/phase-05-jobs/job-crud.spec.ts` - Pattern updated for new job ID format
- `e2e/tests/phase-05-jobs/job-detail.spec.ts` - Pattern updated for new job ID format
- `e2e/tests/phase-05-jobs/approval-flow.spec.ts` - Both approval queue and detail patterns updated
- `e2e/tests/phase-06-inventory/asset-crud.spec.ts` - Heading pattern updated for both old/new format
- `e2e/tests/phase-08-media-notifications/photo-upload.spec.ts` - Request ID patterns updated

## Decisions Made
- Global counter uses sentinel UUID `00000000-0000-0000-0000-000000000000` as `company_id` in `id_counters` table to ensure globally unique counters without conflicting with existing per-company rows
- Counter key uses `{entity_type}_global_{YY}` format to coexist with old per-company counters
- Old display ID functions NOT dropped -- they may be referenced elsewhere and can be cleaned up in a future pass
- Company code validated to be exactly 2 characters with RAISE EXCEPTION for mismatches
- E2E test patterns use alternation `(AST-|I[A-Z0-9])` to match both old seeded test data (AST- prefix) and new format (I{CC}-) for assets

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- Push migration 00015 to Supabase: `supabase db push`

## Next Phase Readiness
- All new requests, jobs, and assets will use the new display ID format after migration is applied
- Existing data retains old format (no retroactive changes)

---
*Quick Task: 6 - Change Display ID Convention*
*Completed: 2026-03-04*
