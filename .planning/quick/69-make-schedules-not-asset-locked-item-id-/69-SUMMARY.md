---
phase: quick-69
plan: 1
subsystem: database, api, ui
tags: [supabase, maintenance, schedules, nullable-fk, next.js]

requires:
  - phase: 07-preventive-maintenance
    provides: maintenance_schedules table, generate_pm_jobs function, schedule CRUD actions
  - phase: quick-68
    provides: templates shared globally (nullable company_id on templates)
provides:
  - Nullable item_id on maintenance_schedules (asset-free schedules)
  - Updated generate_pm_jobs function with LEFT JOIN for null item_id
  - Schedule create form hides asset field for general templates
  - All schedule views handle null asset gracefully
affects: [maintenance, schedules, seed-data]

tech-stack:
  added: []
  patterns: [conditional-fk-nullable, template-driven-form-visibility]

key-files:
  created:
    - supabase/migrations/00024_schedules_nullable_item_id.sql
  modified:
    - lib/types/maintenance.ts
    - lib/validations/schedule-schema.ts
    - app/actions/schedule-actions.ts
    - components/maintenance/schedule-form.tsx
    - components/maintenance/schedule-columns.tsx
    - components/maintenance/schedule-detail.tsx
    - app/(dashboard)/maintenance/schedules/[id]/page.tsx
    - scripts/seed-ops.ts

key-decisions:
  - "company_id for asset-free schedules derived from form input (multi-company user) or profile.company_id fallback"
  - "Asset field visibility driven by selectedTemplate.category_id: hidden when null (general template), shown when present"
  - "Auto-pause notice only relevant for asset-linked schedules; hidden for general schedules"

requirements-completed: [QUICK-69]

duration: 5min
completed: 2026-03-13
---

# Quick 69: Make Schedules Not Asset-Locked Summary

**Nullable item_id on maintenance_schedules enabling asset-free schedules for routine tasks with general templates**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T10:29:37Z
- **Completed:** 2026-03-13T10:35:30Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Migration makes item_id nullable and updates generate_pm_jobs with LEFT JOIN to handle null assets
- Schedule create form conditionally shows/hides Asset field based on template's category
- All schedule views (table, detail page, view modal) handle null asset gracefully with dash or descriptive text
- Seed data includes 2 asset-free schedules demonstrating the feature

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration + types + schema + actions (backend)** - `55ce845` (feat)
2. **Task 2: Form + columns + detail + view modal (frontend)** - `44fe0b6` (feat)

## Files Created/Modified
- `supabase/migrations/00024_schedules_nullable_item_id.sql` - ALTER item_id DROP NOT NULL, recreate generate_pm_jobs with LEFT JOIN
- `lib/types/maintenance.ts` - MaintenanceSchedule.item_id changed to string | null
- `lib/validations/schedule-schema.ts` - item_id nullable/optional, added company_id optional field
- `app/actions/schedule-actions.ts` - createSchedule handles both asset-linked and asset-free; all actions conditional revalidatePath
- `components/maintenance/schedule-form.tsx` - Asset field hidden for general templates, company_id passed for asset-free
- `components/maintenance/schedule-columns.tsx` - Null-safe asset link in table cell
- `components/maintenance/schedule-detail.tsx` - "No asset (general schedule)" text, auto-pause guard
- `app/(dashboard)/maintenance/schedules/[id]/page.tsx` - Conditional asset link in page header
- `scripts/seed-ops.ts` - 2 asset-free schedules added using general templates

## Decisions Made
- company_id for asset-free schedules derived from form input (multi-company user) or profile.company_id fallback
- Asset field visibility driven by selectedTemplate.category_id: hidden when null (general), shown when present
- Auto-pause notice only relevant for asset-linked schedules; hidden for general schedules

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schedules can now be created without an asset when using general templates
- Push migration 00024 to Supabase: `supabase db push`

---
*Phase: quick-69*
*Completed: 2026-03-13*
