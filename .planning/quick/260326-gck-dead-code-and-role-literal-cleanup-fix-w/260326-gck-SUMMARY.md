---
phase: quick-260326-gck
plan: 01
subsystem: code-hygiene
tags: [roles, constants, dead-code, bug-fix]

# Dependency graph
requires: []
provides:
  - "All role checks in application code use ROLES constants from lib/constants/roles.ts"
  - "Inventory photo uploads query correct table (inventory_items)"
  - "Maintenance export has no dead code referencing nonexistent columns"
affects: [any future role-related changes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ROLES.* constant usage for all role comparisons in application code"

key-files:
  created: []
  modified:
    - app/api/uploads/entity-photos/route.ts
    - app/api/exports/maintenance/route.ts
    - app/actions/company-settings-actions.ts
    - app/(dashboard)/admin/settings/page.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/requests/page.tsx
    - app/(dashboard)/admin/layout.tsx
    - app/(dashboard)/admin/company-settings/page.tsx
    - app/(dashboard)/admin/audit-trail/page.tsx
    - app/actions/user-company-access-actions.ts
    - lib/safe-action.ts
    - components/jobs/job-modal.tsx
    - components/jobs/job-detail-actions.tsx
    - components/requests/request-detail-actions.tsx
    - components/requests/request-detail-info.tsx
    - app/actions/request-actions.ts
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/jobs/[id]/page.tsx
    - lib/dashboard/queries.ts

key-decisions:
  - "Extended existing ROLES imports rather than adding duplicate import lines where files already imported from @/lib/constants/roles"

patterns-established:
  - "All role checks must use ROLES.* constants -- no string literals in application code"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-03-26
---

# Quick Task 260326-gck: Dead Code and Role Literal Cleanup Summary

**Fixed inventory photo upload bug (wrong table name), removed dead code (nonexistent column fallback), and replaced all 18 remaining string literal role checks with ROLES constants across 14 files**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-26T04:55:48Z
- **Completed:** 2026-03-26T05:01:19Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Fixed bug where inventory photo uploads failed because entity existence check queried nonexistent `assets` table instead of `inventory_items`
- Removed dead `schedule.template_name` fallback in maintenance export (column does not exist in schema)
- Replaced all 18 string literal role checks with ROLES constants: ADMIN (8), GENERAL_USER (3), GA_STAFF (3), FINANCE_APPROVER (2), mixed arrays (3)
- Comprehensive grep confirms zero remaining role string literals in application code (only intentional exclusions: type defs, Zod schemas, UI labels, asset variant strings)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix wrong table name and remove dead code** - `fa16864` (fix)
2. **Task 2: Replace all string literal role checks with ROLES constants** - `e182370` (refactor)

## Files Created/Modified
- `app/api/uploads/entity-photos/route.ts` - Fixed table name from 'assets' to 'inventory_items'
- `app/api/exports/maintenance/route.ts` - Removed dead schedule.template_name fallback
- `app/actions/company-settings-actions.ts` - ROLES.ADMIN
- `app/(dashboard)/admin/settings/page.tsx` - ROLES.ADMIN
- `app/(dashboard)/inventory/page.tsx` - ROLES.GENERAL_USER
- `app/(dashboard)/requests/page.tsx` - ROLES.GENERAL_USER (2 occurrences)
- `app/(dashboard)/admin/layout.tsx` - ROLES.ADMIN
- `app/(dashboard)/admin/company-settings/page.tsx` - ROLES.ADMIN
- `app/(dashboard)/admin/audit-trail/page.tsx` - ROLES.ADMIN, ROLES.GA_LEAD
- `app/actions/user-company-access-actions.ts` - ROLES.ADMIN
- `lib/safe-action.ts` - ROLES.ADMIN
- `components/jobs/job-modal.tsx` - ROLES.FINANCE_APPROVER
- `components/jobs/job-detail-actions.tsx` - ROLES.FINANCE_APPROVER
- `components/requests/request-detail-actions.tsx` - ROLES.GA_STAFF
- `components/requests/request-detail-info.tsx` - ROLES.GA_STAFF
- `app/actions/request-actions.ts` - ROLES.GA_STAFF
- `app/(dashboard)/jobs/page.tsx` - ROLES.GENERAL_USER, ROLES.GA_STAFF, ROLES.GA_LEAD (3 occurrences)
- `app/(dashboard)/jobs/[id]/page.tsx` - ROLES.GENERAL_USER, ROLES.GA_STAFF
- `lib/dashboard/queries.ts` - ROLES.GA_STAFF, ROLES.GA_LEAD

## Decisions Made
- Extended existing imports from `@/lib/constants/roles` (adding `ROLES` to existing `LEAD_ROLES`, `GA_ROLES`, or `OPERATIONAL_ROLES` imports) rather than creating duplicate import lines

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All role checks now use constants, enabling safe role renaming via single constant update
- No blockers

---
*Phase: quick-260326-gck*
*Completed: 2026-03-26*
