---
phase: quick-37
plan: 01
subsystem: assets
tags: [ui, modal, refactor, consolidation]
dependency_graph:
  requires: []
  provides: [asset-view-modal-sticky-bar-only-actions]
  affects: [components/assets/asset-view-modal.tsx]
tech_stack:
  added: []
  patterns: [sticky-bar-actions, dialogs-outside-dialog-content]
key_files:
  created: []
  modified:
    - components/assets/asset-view-modal.tsx
decisions:
  - "Removed AssetDetailActions inline render; all transfer dialogs now wired directly in modal"
  - "Cancel Transfer AlertDialog rendered outside DialogContent alongside other transfer dialogs for correct z-index stacking"
  - "Cancel Transfer permission check: pendingTransfer.initiated_by === currentUserId || currentUserRole === 'admin'"
metrics:
  duration: 5min
  completed: 2026-03-10
---

# Phase quick-37 Plan 01: Asset View Modal Action Consolidation Summary

**One-liner:** Removed duplicate inline action buttons from asset view modal left column; all asset mutation actions now exclusively in the sticky bottom bar.

## What Was Built

The `AssetDetailActions` component was being rendered twice — once inline in the modal left column and once implicitly through the sticky bar buttons. This caused visual duplication and inconsistency with other view modals (request, job, schedule) which only show actions in the sticky bar.

This task eliminated the inline `AssetDetailActions` render and wired all dialog components directly into `asset-view-modal.tsx`:

- `AssetDetailActions` import and render removed from the left column scrollable area
- `AssetTransferDialog`, `AssetTransferRespondDialog`, and Cancel Transfer `AlertDialog` added outside `DialogContent` for correct z-index stacking
- Cancel Transfer button added to the sticky bar with proper permission check (initiator or admin)
- Cancel Transfer state and handler managed directly in the modal component
- Left column now contains only `AssetDetailInfo` (zero action buttons)

## Sticky Bar Button Logic (Final State)

| Button | Condition |
|--------|-----------|
| Save Changes | ga_staff+ AND not sold_disposed AND no pendingTransfer |
| Change Status | ga_staff+ AND not sold_disposed AND no pendingTransfer |
| Transfer | ga_staff+ AND not sold_disposed AND no pendingTransfer |
| Accept Transfer | pendingTransfer AND receiver_id === currentUserId |
| Reject Transfer | pendingTransfer AND receiver_id === currentUserId |
| Cancel Transfer | pendingTransfer AND (initiated_by === currentUserId OR admin) |

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check

- [x] `components/assets/asset-view-modal.tsx` modified — AssetDetailActions removed, dialogs wired directly
- [x] Commit bd61fcd exists
- [x] `npm run build` passes with no TypeScript errors

## Self-Check: PASSED
