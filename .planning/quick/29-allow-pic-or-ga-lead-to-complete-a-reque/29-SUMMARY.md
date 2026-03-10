---
phase: quick-29
plan: 01
subsystem: requests
tags: [server-action, request-lifecycle, pending-acceptance]

provides:
  - completeRequest server action for direct request completion
  - Complete Request button in detail page and modal
affects: [requests]

key-files:
  modified:
    - app/actions/request-actions.ts
    - components/requests/request-detail-actions.tsx
    - components/requests/request-view-modal.tsx

key-decisions:
  - "PIC or GA Lead/Admin permission check inline in action body (not adminActionClient)"
  - "Green styling for Complete Request button consistent with Accept Work button"
  - "window.confirm used for completion confirmation (matches existing reject/cancel pattern)"

requirements-completed: [QUICK-29]

duration: 3min
completed: 2026-03-09
---

# Quick Task 29: Allow PIC or GA Lead to Complete a Request Summary

**completeRequest server action with Complete Request button in detail page and modal for direct request completion bypassing job flow**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T08:50:26Z
- **Completed:** 2026-03-09T08:53:41Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- New completeRequest server action that moves triaged/in_progress requests to pending_acceptance
- Complete Request button in both detail page and modal view for PIC and GA Lead/Admin users
- Notification sent to requester on completion so they can accept/reject the work

## Task Commits

Each task was committed atomically:

1. **Task 1: Create completeRequest server action** - `e51166a` (feat)
2. **Task 2: Wire Complete Request button into detail page and modal** - `d25debc` (feat)

## Files Modified
- `app/actions/request-actions.ts` - Added completeRequest server action with PIC/GA Lead permission check, status validation, and requester notification
- `components/requests/request-detail-actions.tsx` - Added Complete Request button with confirm dialog and inline feedback
- `components/requests/request-view-modal.tsx` - Added Complete Request button in sticky action bar

## Decisions Made
- PIC or GA Lead/Admin permission check done inline in action body (consistent with triageRequest pattern)
- Green styling for Complete Request button to match Accept Work button visual weight
- window.confirm for completion confirmation to match existing action patterns in the codebase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Self-Check: PASSED

---
*Quick Task: 29-allow-pic-or-ga-lead-to-complete-a-reque*
*Completed: 2026-03-09*
