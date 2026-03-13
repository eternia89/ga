---
phase: quick-68
plan: 01
subsystem: database, api, ui
tags: [supabase, rls, maintenance-templates, multi-company]

# Dependency graph
requires:
  - phase: 07-preventive-maintenance
    provides: "maintenance_templates table, RLS policies, template CRUD actions"
  - phase: quick-60
    provides: "Company field on template create/edit forms"
provides:
  - "Global maintenance_templates: all authenticated users can read all templates"
  - "Role-only INSERT/UPDATE: ga_lead/admin can create/edit templates without company scoping"
  - "Templates no longer have company_id (nullable, set to NULL)"
affects: [maintenance, schedules, templates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global shared resource pattern: nullable company_id + global SELECT RLS + role-only write RLS"

key-files:
  created:
    - "supabase/migrations/00023_templates_shared_global.sql"
  modified:
    - "app/actions/template-actions.ts"
    - "app/actions/schedule-actions.ts"
    - "app/(dashboard)/maintenance/templates/page.tsx"
    - "app/(dashboard)/maintenance/templates/[id]/page.tsx"
    - "app/(dashboard)/maintenance/page.tsx"
    - "components/maintenance/template-create-form.tsx"
    - "components/maintenance/template-create-dialog.tsx"
    - "components/maintenance/template-detail.tsx"
    - "components/maintenance/template-view-modal.tsx"
    - "lib/types/maintenance.ts"

key-decisions:
  - "company_id kept as nullable column (not dropped) to preserve historical data and avoid schema breakage"
  - "company_id still selected in queries to satisfy MaintenanceTemplate type, but value is always NULL"
  - "Existing template rows updated to NULL company_id in migration"

patterns-established:
  - "Global resource pattern: nullable company_id + global SELECT + role-only write"

requirements-completed: [QUICK-68]

# Metrics
duration: 6min
completed: 2026-03-13
---

# Quick Task 68: Make Maintenance Templates Shared Across Companies Summary

**Global maintenance templates with nullable company_id, role-only write RLS, and Company field removed from all template UI**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-13T07:32:35Z
- **Completed:** 2026-03-13T07:38:15Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Migration 00023 makes company_id nullable, drops 6 old RLS policies, creates 3 new global/role-based policies
- All template server actions operate without company_id filtering (create, update, deactivate, reactivate, list, getById)
- Schedule creation validates template existence and active status but not company ownership
- Template UI has no Company field in create form, create dialog, or detail page
- Template list and detail pages fetch templates globally (no company filter)
- MaintenanceTemplate type updated to allow null company_id

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration + RLS -- make templates globally readable** - `a5e3984` (feat)
2. **Task 2: Update server actions -- remove company scoping** - `f6711b1` (feat)
3. **Task 3: Update pages and UI -- remove Company field** - `f0cdff4` (feat)

## Files Created/Modified
- `supabase/migrations/00023_templates_shared_global.sql` - Migration making company_id nullable, new RLS policies
- `app/actions/template-actions.ts` - Removed all company_id filtering from template CRUD
- `app/actions/schedule-actions.ts` - Removed company_id filter from template fetch in createSchedule
- `app/(dashboard)/maintenance/templates/page.tsx` - Removed company access blocks and company props
- `app/(dashboard)/maintenance/templates/[id]/page.tsx` - Removed company access blocks and company name fetch
- `app/(dashboard)/maintenance/page.tsx` - Removed company filter from templates query for schedule dialog
- `components/maintenance/template-create-form.tsx` - Removed Company field, company props, selectedCompanyId state
- `components/maintenance/template-create-dialog.tsx` - Removed company props from interface and passthrough
- `components/maintenance/template-detail.tsx` - Removed companyName prop and Company display section
- `components/maintenance/template-view-modal.tsx` - Kept company_id in select for type compatibility
- `lib/types/maintenance.ts` - Made company_id nullable (string | null)

## Decisions Made
- Kept company_id as nullable column rather than dropping it entirely -- avoids schema migration complexity and foreign key issues
- company_id is still selected in Supabase queries to satisfy the MaintenanceTemplate type definition, but its value is always NULL for new templates
- Existing template rows cleaned up to NULL company_id in the migration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Restored company_id to SELECT fields to fix TypeScript errors**
- **Found during:** Task 3 (UI updates)
- **Issue:** Removing company_id from Supabase SELECT caused TypeScript errors because MaintenanceTemplate type requires the field
- **Fix:** Kept company_id in SELECT queries (value is NULL), made the type allow null
- **Files modified:** template-actions.ts, templates/page.tsx, templates/[id]/page.tsx, template-view-modal.tsx, lib/types/maintenance.ts
- **Verification:** TypeScript compilation passes clean
- **Committed in:** f0cdff4 (Task 3 commit)

**2. [Rule 2 - Missing Critical] Updated template-view-modal.tsx query**
- **Found during:** Task 3 (UI updates)
- **Issue:** template-view-modal.tsx also fetches templates directly via client-side Supabase query -- plan did not mention this file
- **Fix:** Ensured company_id is included in its SELECT for type compatibility
- **Files modified:** components/maintenance/template-view-modal.tsx
- **Verification:** TypeScript compilation passes clean
- **Committed in:** f0cdff4 (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for TypeScript type safety. No scope creep.

## Issues Encountered
None -- execution was straightforward after handling the TypeScript type compatibility issue.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Templates are now global -- any user can browse all templates
- Schedules still remain company-scoped (correct behavior)
- Migration 00023 needs to be pushed to Supabase: `supabase db push`

---
*Phase: quick-68*
*Completed: 2026-03-13*
