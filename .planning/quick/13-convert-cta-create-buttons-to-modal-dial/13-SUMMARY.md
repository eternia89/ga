---
phase: quick-13
plan: 01
subsystem: ui
tags: [dialog, modal, next.js, react, shadcn]

requires:
  - phase: 09.1-ui-improvements
    provides: CTA buttons in page headers, EntityFormDialog pattern
provides:
  - "5 create dialog wrappers (Request, Job, Asset, Template, Schedule)"
  - "onSuccess callback pattern on all 5 create form components"
  - "Server-side form data fetching on list pages for dialog use"
affects: [requests, jobs, inventory, maintenance]

tech-stack:
  added: []
  patterns: ["Create dialog wrapper: client component wrapping form with Dialog + onSuccess callback"]

key-files:
  created:
    - components/requests/request-create-dialog.tsx
    - components/jobs/job-create-dialog.tsx
    - components/assets/asset-create-dialog.tsx
    - components/maintenance/template-create-dialog.tsx
    - components/maintenance/schedule-create-dialog.tsx
  modified:
    - components/requests/request-submit-form.tsx
    - components/jobs/job-form.tsx
    - components/assets/asset-submit-form.tsx
    - components/maintenance/template-create-form.tsx
    - components/maintenance/schedule-form.tsx
    - app/(dashboard)/requests/page.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/maintenance/templates/page.tsx
    - app/(dashboard)/maintenance/page.tsx

key-decisions:
  - "onSuccess is optional to maintain backward compat with /new pages"
  - "Cancel buttons hidden when onSuccess provided (dialog has its own close)"
  - "max-w-2xl on forms removed when inside dialog (dialog controls width)"
  - "/new pages preserved as fallback navigation targets"

patterns-established:
  - "Create dialog pattern: Button trigger + Dialog + existing form with onSuccess prop"

requirements-completed: [QUICK-13]

duration: 6min
completed: 2026-03-06
---

# Quick Task 13: Convert CTA Create Buttons to Modal Dialogs Summary

**All 5 list page "New X" buttons now open modal dialogs instead of navigating to /new pages, with scrollable content and mobile-responsive sizing**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-06T00:29:33Z
- **Completed:** 2026-03-06T00:35:38Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Added optional onSuccess callback to all 5 create form components (Request, Job, Asset, Template, Schedule)
- Created 5 dialog wrapper components with responsive sizing and scrollable content
- Updated all 5 list pages to fetch form data server-side and render dialogs instead of Link CTAs
- Build and TypeScript compilation pass clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Add onSuccess callback to forms and create dialog wrappers** - `7a6d331` (feat)
2. **Task 2: Update list pages to use dialog wrappers** - `4b5eabd` (feat)

## Files Created/Modified
- `components/requests/request-create-dialog.tsx` - Dialog wrapper for request creation (max-w-600px)
- `components/jobs/job-create-dialog.tsx` - Dialog wrapper for job creation (max-w-700px)
- `components/assets/asset-create-dialog.tsx` - Dialog wrapper for asset creation (max-w-700px)
- `components/maintenance/template-create-dialog.tsx` - Dialog wrapper for template creation (max-w-700px)
- `components/maintenance/schedule-create-dialog.tsx` - Dialog wrapper for schedule creation (max-w-600px)
- `components/requests/request-submit-form.tsx` - Added onSuccess prop
- `components/jobs/job-form.tsx` - Added onSuccess prop, hide Cancel in dialog
- `components/assets/asset-submit-form.tsx` - Added onSuccess prop
- `components/maintenance/template-create-form.tsx` - Added onSuccess prop, hide Cancel in dialog
- `components/maintenance/schedule-form.tsx` - Added onSuccess prop to create sub-form, hide Cancel in dialog
- `app/(dashboard)/requests/page.tsx` - Fetch locations, use RequestCreateDialog
- `app/(dashboard)/jobs/page.tsx` - Fetch locations/categories/users/requests, use JobCreateDialog
- `app/(dashboard)/inventory/page.tsx` - Reuse existing data, use AssetCreateDialog
- `app/(dashboard)/maintenance/templates/page.tsx` - Fetch asset categories, use TemplateCreateDialog
- `app/(dashboard)/maintenance/page.tsx` - Fetch templates/assets, use ScheduleCreateDialog

## Decisions Made
- onSuccess callback is optional to preserve backward compatibility with existing /new pages
- Cancel buttons hidden when form is inside dialog (dialog provides its own close mechanism)
- Form max-width constraint removed when inside dialog (dialog DialogContent controls sizing)
- /new pages kept as fallback for direct navigation and request-prefill job creation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 create flows work via modals
- /new pages still work for direct navigation
- Pattern established for future dialog-based creation forms

---
*Quick Task: 13-convert-cta-create-buttons-to-modal-dial*
*Completed: 2026-03-06*
