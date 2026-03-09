---
phase: quick-22
plan: 01
subsystem: ui
tags: [nextjs, searchparams, dialog, permalink]

requires:
  - phase: 09.1-ui-improvements
    provides: CTA create buttons as modal dialogs

provides:
  - "Permalink support (?action=create) on all 5 create modals"
  - "initialOpen prop pattern for dialog auto-open from URL"

affects: [requests, jobs, inventory, maintenance]

tech-stack:
  added: []
  patterns:
    - "initialOpen prop pattern: server reads searchParam, passes boolean to client dialog"

key-files:
  created: []
  modified:
    - components/requests/request-create-dialog.tsx
    - components/jobs/job-create-dialog.tsx
    - components/assets/asset-create-dialog.tsx
    - components/maintenance/template-create-dialog.tsx
    - components/maintenance/schedule-create-dialog.tsx
    - app/(dashboard)/requests/page.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/maintenance/templates/page.tsx
    - app/(dashboard)/maintenance/page.tsx

key-decisions:
  - "initialOpen uses useState default value (not useEffect) for simpler implementation"
  - "Permission gating relies on existing render guards -- no new permission checks needed"

patterns-established:
  - "action searchParam pattern: extensible for future actions like ?action=triage"

requirements-completed: [QUICK-22]

duration: 1min
completed: 2026-03-09
---

# Quick Task 22: Add Permalink Support to All 5 Create Modals Summary

**URL permalink ?action=create auto-opens create dialogs on requests, jobs, inventory, templates, and schedules pages**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-09T02:27:54Z
- **Completed:** 2026-03-09T02:29:15Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- All 5 create dialog components accept initialOpen prop for URL-driven auto-open
- All 5 page.tsx files read ?action=create searchParam and pass it to dialogs
- Unauthorized users see the page normally with no dialog (existing permission guards handle this)
- Coexists with existing ?view={id} param

## Task Commits

Each task was committed atomically:

1. **Task 1: Add initialOpen prop to all 5 create dialog components** - `a8b5c5c` (feat)
2. **Task 2: Wire action searchParam from page.tsx to create dialogs** - `d6258a7` (feat)

## Files Created/Modified
- `components/requests/request-create-dialog.tsx` - Added initialOpen prop, useState default
- `components/jobs/job-create-dialog.tsx` - Added initialOpen prop, useState default
- `components/assets/asset-create-dialog.tsx` - Added initialOpen prop, useState default
- `components/maintenance/template-create-dialog.tsx` - Added initialOpen prop, useState default
- `components/maintenance/schedule-create-dialog.tsx` - Added initialOpen prop, useState default
- `app/(dashboard)/requests/page.tsx` - Read action searchParam, pass initialOpen
- `app/(dashboard)/jobs/page.tsx` - Read action searchParam, pass initialOpen
- `app/(dashboard)/inventory/page.tsx` - Read action searchParam, pass initialOpen
- `app/(dashboard)/maintenance/templates/page.tsx` - Read action searchParam, pass initialOpen
- `app/(dashboard)/maintenance/page.tsx` - Read action searchParam, pass initialOpen

## Decisions Made
- Used useState(initialOpen ?? false) instead of useEffect for simpler, synchronous initialization
- Permission gating handled by existing render guards (dialog only renders inside role checks)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Permalink pattern extensible for future actions (e.g., ?action=triage)
- All existing functionality (view modal, filters) unaffected

---
*Quick Task: 22-add-permalink-support-to-all-5-create-mo*
*Completed: 2026-03-09*
