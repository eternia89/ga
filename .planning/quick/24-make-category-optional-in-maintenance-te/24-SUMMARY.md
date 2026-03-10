---
phase: quick-24
plan: 01
subsystem: maintenance
tags: [zod, validation, optional-field, maintenance-templates]

requires:
  - phase: 07-preventive-maintenance
    provides: maintenance templates and schedules infrastructure
provides:
  - General-purpose maintenance templates (no category required)
  - Category-optional template creation and editing
  - Schedule form includes general templates alongside category-matched ones
affects: [maintenance, schedules, templates]

tech-stack:
  added: []
  patterns:
    - "z.input<> for form types when schema has .transform()"
    - "Prepend 'None (General)' option to Combobox for nullable FK fields"

key-files:
  created: []
  modified:
    - lib/validations/template-schema.ts
    - app/actions/template-actions.ts
    - app/actions/schedule-actions.ts
    - components/maintenance/template-create-form.tsx
    - components/maintenance/template-detail.tsx
    - components/maintenance/schedule-form.tsx

key-decisions:
  - "Used z.input<> instead of z.infer<> for form data types to handle .transform() compatibility with react-hook-form"
  - "Empty string transformed to null via Zod .transform(val => val || null) for clean DB storage"

patterns-established:
  - "Optional FK with Combobox: prepend [{ label: 'None (...)', value: '' }] + schema .or(z.literal('')) + .transform()"

requirements-completed: [QUICK-24]

duration: 5min
completed: 2026-03-09
---

# Quick Task 24: Make Category Optional in Maintenance Templates Summary

**Optional nullable category_id on maintenance templates enabling general-purpose checklists paired with any asset**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-09T06:22:18Z
- **Completed:** 2026-03-09T06:27:59Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- category_id is now optional/nullable in Zod schema with empty-string-to-null transform
- Server actions skip category validation when category_id is null (general templates)
- Schedule creation allows general templates (null category_id) to pair with any asset
- Schedule form shows general templates alongside category-matched templates when filtering by asset
- Category field shows as optional in create and edit forms with "None (General)" Combobox option
- Read-only view already handles null category gracefully (shows dash)

## Task Commits

Each task was committed atomically:

1. **Task 1: Make category_id optional in schema and server actions** - `e636610` (feat)
2. **Task 2: Update UI forms and display for optional category** - `57465be` (feat)

## Files Created/Modified
- `lib/validations/template-schema.ts` - category_id now optional/nullable with transform; form types use z.input
- `app/actions/template-actions.ts` - Conditional category validation in create and update actions
- `app/actions/schedule-actions.ts` - Skip category match check when template has no category_id
- `components/maintenance/template-create-form.tsx` - Removed required asterisk, added "None (General)" option
- `components/maintenance/template-detail.tsx` - Removed required asterisk, added "None (General)" option
- `components/maintenance/schedule-form.tsx` - Include general templates in filtered list; prevent clearing general template on asset switch

## Decisions Made
- Used `z.input<>` instead of `z.infer<>` for form data types because the `.transform()` on category_id makes output type differ from input type, which breaks react-hook-form resolver typing
- Empty string transformed to null via `.transform(val => val || null)` so the Combobox empty-string value maps cleanly to DB null

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript type mismatch from .transform()**
- **Found during:** Task 1 (schema change)
- **Issue:** Adding `.transform()` to category_id made `z.infer` return the output type, breaking react-hook-form resolver compatibility (input type has `string | undefined | null`, output has `string | null`)
- **Fix:** Changed exported form types from `z.infer<>` to `z.input<>` and added `?? ''` coercion on Combobox value props
- **Files modified:** lib/validations/template-schema.ts, components/maintenance/template-create-form.tsx, components/maintenance/template-detail.tsx
- **Verification:** `npm run build` passes
- **Committed in:** e636610 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type fix necessary for build to pass. No scope creep.

## Issues Encountered
None beyond the auto-fixed type issue above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- General templates fully supported end-to-end
- Category-specific templates continue to enforce category match in schedules

---
*Plan: quick-24*
*Completed: 2026-03-09*
