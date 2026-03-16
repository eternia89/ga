---
phase: quick-81
plan: 01
subsystem: database, api, auth
tags: [rls, multi-company, supabase, export, company-scoping]

requires:
  - phase: quick-55
    provides: "Multi-company user access model (user_company_access table)"
  - phase: quick-58
    provides: "RLS SELECT policy expansion for multi-company"
provides:
  - "Multi-company scoped export routes (4 routes)"
  - "RLS INSERT/UPDATE policies for 8 tables allowing cross-company writes"
  - "17 redundant action-level company filters removed from 7 files"
  - "Page dropdowns showing data from all accessible companies"
affects: [multi-company, exports, inventory, jobs, requests, maintenance]

tech-stack:
  added: []
  patterns:
    - "allAccessibleCompanyIds pattern for export routes"
    - "OR EXISTS user_company_access in RLS INSERT/UPDATE policies"

key-files:
  created:
    - supabase/migrations/00027_rls_multi_company_writes.sql
  modified:
    - app/api/exports/inventory/route.ts
    - app/api/exports/jobs/route.ts
    - app/api/exports/requests/route.ts
    - app/api/exports/maintenance/route.ts
    - app/actions/job-actions.ts
    - app/actions/pm-job-actions.ts
    - app/actions/asset-actions.ts
    - app/actions/approval-actions.ts
    - app/api/uploads/entity-photos/route.ts
    - app/api/uploads/job-photos/route.ts
    - app/api/uploads/asset-invoices/route.ts
    - app/(dashboard)/requests/page.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/new/page.tsx

key-decisions:
  - "job_comments INSERT policies consolidated from 2 (00003 + 00008) into 1 multi-company policy -- role/PIC check was redundant since any authenticated company user can comment"
  - "company_settings budget_threshold query intentionally stays single-company (per-primary-company business rule)"
  - "asset-actions.ts retains 2 .eq('company_id') occurrences: createTransfer (already fixed) and deleteAssetPhotos (adminSupabase security guard)"

patterns-established:
  - "Export routes use allAccessibleCompanyIds pattern for multi-company data scoping"
  - "RLS INSERT/UPDATE policies use OR EXISTS on user_company_access for granted company writes"

requirements-completed: [MULTI-COMPANY-EXPORT, MULTI-COMPANY-RLS-WRITES, MULTI-COMPANY-ACTION-CLEANUP, MULTI-COMPANY-PAGE-DROPDOWNS]

duration: 8min
completed: 2026-03-16
---

# Quick Task 81: Multi-Company Comprehensive Fix Summary

**RLS INSERT/UPDATE expansion for 8 tables, export route scoping, 17 redundant action filters removed, and page dropdowns updated for multi-company access**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-16T06:24:20Z
- **Completed:** 2026-03-16T06:32:41Z
- **Tasks:** 5
- **Files modified:** 16

## Accomplishments
- All 4 export routes (inventory, jobs, requests, maintenance) now scope data to user's accessible companies via allAccessibleCompanyIds
- Migration 00027 adds 15 RLS policies expanding INSERT/UPDATE on 6 main tables + SELECT/INSERT on 2 missed supporting tables
- 17 redundant `.eq('company_id', profile.company_id)` filters removed from 7 action/upload files -- RLS now handles company scoping
- 4 page components updated to fetch dropdown data (users, locations, divisions) from all accessible companies

## Task Commits

Each task was committed atomically:

1. **Task 1: Add company scoping to all 4 export API routes** - `38269ca` (fix)
2. **Task 2: Create RLS migration for multi-company INSERT/UPDATE policies** - `b21d0dc` (feat)
3. **Task 3: Remove redundant action-level company filters from server actions and upload routes** - `cb5850c` (fix)
4. **Task 4: Update page dropdowns to fetch from all accessible companies** - `93a26f4` (fix)
5. **Task 5: TypeScript compilation and lint verification** - verification only (no code changes)

## Files Created/Modified
- `supabase/migrations/00027_rls_multi_company_writes.sql` - 15 new RLS policies for multi-company INSERT/UPDATE
- `app/api/exports/inventory/route.ts` - Company-scoped inventory export
- `app/api/exports/jobs/route.ts` - Company-scoped jobs export
- `app/api/exports/requests/route.ts` - Company-scoped requests export
- `app/api/exports/maintenance/route.ts` - Company-scoped maintenance export
- `app/actions/job-actions.ts` - 6 redundant company filters removed
- `app/actions/pm-job-actions.ts` - 3 redundant company filters removed
- `app/actions/asset-actions.ts` - 2 redundant company filters removed
- `app/actions/approval-actions.ts` - 4 redundant company filters removed
- `app/api/uploads/entity-photos/route.ts` - 1 redundant company filter removed
- `app/api/uploads/job-photos/route.ts` - 1 redundant company filter removed
- `app/api/uploads/asset-invoices/route.ts` - 1 redundant company filter removed (count correction: plan counted 17 across 7 files but asset-invoices is the 7th file making total correct)
- `app/(dashboard)/requests/page.tsx` - user_profiles and locations queries use allAccessibleCompanyIds
- `app/(dashboard)/jobs/page.tsx` - PIC filter, locations, PIC assignment, eligible requests use allAccessibleCompanyIds
- `app/(dashboard)/inventory/page.tsx` - locations and GA users queries use allAccessibleCompanyIds
- `app/(dashboard)/inventory/new/page.tsx` - Added user_company_access fetch, locations query uses allAccessibleCompanyIds

## Decisions Made
- job_comments INSERT policies consolidated from 2 into 1 multi-company policy (role/PIC check was redundant since any authenticated company user can comment per 00005 migration decision)
- company_settings budget_threshold query intentionally stays single-company (per-primary-company business rule)
- asset-actions.ts retains 2 `.eq('company_id')` occurrences: createTransfer (already fixed in commit 3002cb1) and deleteAssetPhotos (uses adminSupabase, filter is security-critical)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in e2e/tests/phase-06-inventory/asset-crud.spec.ts (HTMLInputElement cast) -- not caused by this task, out of scope
- Pre-existing ESLint errors (prefer-const in inventory/page.tsx and jobs/page.tsx) -- not caused by this task, out of scope

## User Setup Required
Migration `supabase/migrations/00027_rls_multi_company_writes.sql` needs to be pushed via `supabase db push`.

## Next Phase Readiness
- Multi-company access model is now complete: read, write, export, and filter across all accessible companies
- All RLS policies updated for INSERT/UPDATE on main entity and supporting tables
- Ready for next task

---
*Quick Task: 81*
*Completed: 2026-03-16*
