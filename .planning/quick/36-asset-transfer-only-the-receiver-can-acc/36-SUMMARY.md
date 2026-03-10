---
phase: quick-36
plan: "01"
subsystem: inventory/asset-transfers
tags: [permissions, asset-transfer, rbac, server-actions, ui-guards]
dependency_graph:
  requires: []
  provides: [receiver-only-accept-reject, admin-only-cancel-ga-lead]
  affects: [asset-detail-actions, asset-view-modal, asset-actions]
tech_stack:
  added: []
  patterns: [authActionClient, role-based-guard, sticky-action-bar]
key_files:
  modified:
    - app/actions/asset-actions.ts
    - components/assets/asset-detail-actions.tsx
    - components/assets/asset-view-modal.tsx
decisions:
  - "Removed isLeadOrAdmin bypass from acceptTransfer and rejectTransfer — receiver-only enforcement at server level"
  - "cancelTransfer now uses isAdmin (role === 'admin') not isLeadOrAdmin — GA Lead loses cancel bypass"
  - "isGaLeadOrAdmin removed from asset-detail-actions.tsx (was used only for canRespond/canCancel, now unused)"
metrics:
  duration: "5 min"
  completed: "2026-03-10"
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 36: Asset Transfer — Only the Receiver Can Accept/Reject Summary

**One-liner:** Tightened asset transfer permissions so only the designated receiver can accept/reject, and only the initiator or admin can cancel (ga_lead bypass removed at both server and UI layers).

## What Was Done

Restricted asset transfer respond permissions at two layers:

1. **Server actions** (`app/actions/asset-actions.ts`): Removed the `isLeadOrAdmin` bypass from `acceptTransfer` and `rejectTransfer`. Both actions now throw unless the caller is the exact `receiver_id`. `cancelTransfer` was updated to check `isAdmin` (role === 'admin') rather than `isLeadOrAdmin`.

2. **Detail page UI** (`components/assets/asset-detail-actions.tsx`): `canRespond` now evaluates to `pendingTransfer && isReceiver` only. `canCancel` uses `pendingTransfer && (isInitiator || isAdmin)`. Removed the `isGaLeadOrAdmin` constant entirely (was only used in those two guards).

3. **View modal UI** (`components/assets/asset-view-modal.tsx`): The sticky bar accept/reject block changed from `(currentUserId === pendingTransfer.receiver_id || ['ga_lead', 'admin'].includes(currentUserRole))` to `currentUserId === pendingTransfer.receiver_id` only.

## Truths Verified

- Only the designated receiver can accept a pending transfer — confirmed in action + UI
- Only the designated receiver can reject a pending transfer — confirmed in action + UI
- Admin can still cancel a pending transfer — `isAdmin` check preserved in cancelTransfer and canCancel
- GA Lead cannot accept, reject, or cancel a transfer they did not initiate — all bypass paths removed
- Transfer initiator can still cancel their own pending transfer — `isInitiator` check preserved

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `app/actions/asset-actions.ts` — no `isLeadOrAdmin` variable remains; `isReceiver`-only guard on accept/reject; `isAdmin`-only guard on cancel
- [x] `components/assets/asset-detail-actions.tsx` — `canRespond = pendingTransfer && isReceiver`; `canCancel = pendingTransfer && (isInitiator || isAdmin)`; `isGaLeadOrAdmin` removed
- [x] `components/assets/asset-view-modal.tsx` — accept/reject block condition is `currentUserId === pendingTransfer.receiver_id`
- [x] Build passes with no TypeScript errors
- [x] Commits: 8e7d474 (server actions), f2e241a (UI guards)

## Self-Check: PASSED
