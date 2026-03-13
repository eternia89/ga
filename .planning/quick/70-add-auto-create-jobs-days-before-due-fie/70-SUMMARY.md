---
phase: quick-70
plan: 01
subsystem: database, ui
tags: [maintenance, schedules, pm-jobs, postgresql]

requires:
  - phase: quick-69
    provides: maintenance_schedules with nullable item_id, generate_pm_jobs with LEFT JOIN

provides:
  - auto_create_days_before column on maintenance_schedules
  - Updated generate_pm_jobs function with advance job creation logic
  - Full CRUD for auto_create_days_before through the UI

affects: [maintenance, schedules, pm-jobs]

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - supabase/migrations/00025_schedules_auto_create_days_before.sql
  modified:
    - lib/types/maintenance.ts
    - lib/validations/schedule-schema.ts
    - app/actions/schedule-actions.ts
    - app/(dashboard)/maintenance/page.tsx
    - app/(dashboard)/maintenance/schedules/[id]/page.tsx
    - components/maintenance/schedule-form.tsx
    - components/maintenance/schedule-detail.tsx
    - components/maintenance/schedule-view-modal.tsx

key-decisions:
  - "auto_create_days_before range 0-30: 0 = backward compatible (create on due date), max 30 days lead time"
  - "generate_pm_jobs WHERE uses COALESCE for null safety: COALESCE(ms.auto_create_days_before, 0)"
  - "Field always included in updatePayload (not conditional on interval change)"

requirements-completed: [QUICK-70]

duration: 5min
completed: 2026-03-13
---

# Quick 70: Auto-create Days Before Due Field Summary

**Per-schedule auto_create_days_before field (0-30 days) with updated generate_pm_jobs WHERE clause and full CRUD UI**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T10:49:06Z
- **Completed:** 2026-03-13T10:54:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Migration 00025 adds auto_create_days_before integer DEFAULT 0 and updates generate_pm_jobs WHERE clause
- Full CRUD: create form, edit form, detail page read-only view, and view modal all handle the new field
- Backward compatible: existing schedules default to 0 (create job on due date, unchanged behavior)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration + Types + Schema + Actions** - `73f94cd` (feat)
2. **Task 2: UI -- Create Form, Edit Form, Detail Page, View Modal** - `712df5d` (feat)

## Files Created/Modified
- `supabase/migrations/00025_schedules_auto_create_days_before.sql` - ALTER TABLE + updated generate_pm_jobs function
- `lib/types/maintenance.ts` - Added auto_create_days_before to MaintenanceSchedule type
- `lib/validations/schedule-schema.ts` - Added field to both create (0-30, default 0) and edit (0-30) schemas
- `app/actions/schedule-actions.ts` - Insert, update, and all read queries include auto_create_days_before
- `app/(dashboard)/maintenance/page.tsx` - Select query includes auto_create_days_before
- `app/(dashboard)/maintenance/schedules/[id]/page.tsx` - Detail page select includes auto_create_days_before
- `components/maintenance/schedule-form.tsx` - Number input in both create and edit forms
- `components/maintenance/schedule-detail.tsx` - Read-only view displays "X days before" or "On due date"
- `components/maintenance/schedule-view-modal.tsx` - Header shows auto-create info when > 0

## Decisions Made
- auto_create_days_before range is 0-30: provides up to a month of lead time without excessive advance creation
- generate_pm_jobs uses COALESCE(ms.auto_create_days_before, 0) for null safety on existing rows
- updateSchedule always includes auto_create_days_before in payload (not gated behind intervalChanged check)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added auto_create_days_before to maintenance page select query**
- **Found during:** Task 1
- **Issue:** maintenance/page.tsx has its own Supabase select query not mentioned in the plan that also casts to MaintenanceSchedule, causing TypeScript error
- **Fix:** Added auto_create_days_before to the maintenance page select column list
- **Files modified:** app/(dashboard)/maintenance/page.tsx
- **Verification:** TypeScript compiles cleanly
- **Committed in:** 73f94cd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to include all Supabase select queries that cast to MaintenanceSchedule. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- auto_create_days_before is fully functional end-to-end
- Migration 00025 needs to be pushed to Supabase: `supabase db push`

## Self-Check: PASSED

All 9 files verified present. Both task commits (73f94cd, 712df5d) verified in git log.

---
*Phase: quick-70*
*Completed: 2026-03-13*
