---
phase: quick-83
plan: 01
subsystem: ui
tags: [asset-table, view-modal, transfer, table-actions]

requires:
  - phase: quick-53
    provides: "Change Status button already in asset table row actions pattern"
provides:
  - "Transfer button accessible directly from asset table row actions"
  - "Modal sticky bar simplified (Save, Accept/Reject/Cancel Transfer only)"
affects: [asset-table, asset-view-modal]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - components/assets/asset-columns.tsx
    - components/assets/asset-view-modal.tsx

key-decisions:
  - "Kept showTransferDialog state and AssetTransferDialog in modal for potential future reuse"
  - "Transfer button uses same canChangeStatus guard as Change Status button"

patterns-established: []

requirements-completed: [quick-83]

duration: 3min
completed: 2026-03-16
---

# Quick 83: Move Transfer Button from Modal to Table Row Summary

**Transfer button moved from asset view modal sticky bar to table row actions beside View and Change Status**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T07:24:46Z
- **Completed:** 2026-03-16T07:27:46Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Transfer ghost button added to asset table row actions with same styling and visibility condition as Change Status
- Transfer button removed from asset view modal sticky bar
- Actions column width increased from 160 to 240 to accommodate three buttons

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Transfer button to table row actions and remove from modal** - `9290332` (feat)

## Files Created/Modified
- `components/assets/asset-columns.tsx` - Added Transfer ghost button in actions cell, increased column size to 240
- `components/assets/asset-view-modal.tsx` - Removed Transfer button from sticky bar

## Decisions Made
- Kept `showTransferDialog` state and `AssetTransferDialog` instance in modal (causes no harm, available for future use)
- Transfer button reuses the exact same `canChangeStatus` guard: ga_staff/ga_lead/admin role, non-sold_disposed status, no pending transfer

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ga_lead missing from cancel transfer permission**
- **Found during:** Task 1
- **Issue:** Cancel Transfer button only showed for admin, but ga_lead should also be able to cancel transfers (consistent with quick-44 decision)
- **Fix:** Changed `currentUserRole === 'admin'` to `['ga_lead', 'admin'].includes(currentUserRole)`
- **Files modified:** `components/assets/asset-view-modal.tsx`
- **Committed in:** 9290332

**2. [Rule 1 - Bug] Fixed AlertDialogAction auto-closing before async handler**
- **Found during:** Task 1
- **Issue:** Cancel Transfer AlertDialogAction clicked would auto-close the dialog before the async `handleCancelTransfer` completed
- **Fix:** Added `e.preventDefault()` in onClick handler to prevent premature dialog closure
- **Files modified:** `components/assets/asset-view-modal.tsx`
- **Committed in:** 9290332

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both were pre-existing bugs in asset-view-modal.tsx found during the Transfer button removal. Minor correctness fixes, no scope creep.

## Issues Encountered
- Pre-existing TypeScript error in `e2e/tests/phase-06-inventory/asset-crud.spec.ts` (unrelated to this task) -- confirmed present before changes

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Asset table now shows all three quick actions: View, Change Status, Transfer
- Modal sticky bar is simplified to Save Changes + transfer response/cancel actions only

---
*Phase: quick-83*
*Completed: 2026-03-16*
