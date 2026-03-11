---
phase: quick-36
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/asset-actions.ts
  - components/assets/asset-detail-actions.tsx
  - components/assets/asset-view-modal.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Only the designated receiver can accept a pending transfer (ga_lead cannot bypass)"
    - "Only the designated receiver can reject a pending transfer (ga_lead cannot bypass)"
    - "Admin can still cancel a pending transfer"
    - "GA Lead cannot accept, reject, or cancel a transfer they did not initiate"
    - "The transfer initiator can still cancel their own pending transfer"
  artifacts:
    - path: "app/actions/asset-actions.ts"
      provides: "acceptTransfer, rejectTransfer, cancelTransfer server actions with updated permission checks"
      contains: "isReceiver"
    - path: "components/assets/asset-detail-actions.tsx"
      provides: "canRespond and canCancel UI gating updated"
    - path: "components/assets/asset-view-modal.tsx"
      provides: "sticky action bar permission checks updated"
  key_links:
    - from: "asset-detail-actions.tsx"
      to: "acceptTransfer / rejectTransfer"
      via: "canRespond flag"
      pattern: "canRespond"
    - from: "asset-view-modal.tsx"
      to: "acceptTransfer / rejectTransfer"
      via: "sticky bottom bar conditional"
      pattern: "pendingTransfer.*receiver_id"
---

<objective>
Tighten asset transfer permissions so only the designated receiver can accept or reject a transfer. Admin (not ga_lead) retains the ability to cancel any pending transfer.

Purpose: Prevent GA Leads from bypassing the receiver-only accept/reject workflow on asset transfers.
Output: Updated server actions + UI permission guards across asset-detail-actions and asset-view-modal.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restrict accept/reject/cancel in server actions</name>
  <files>app/actions/asset-actions.ts</files>
  <action>
    Update three server action permission checks in `app/actions/asset-actions.ts`:

    1. **`acceptTransfer`** (around line 293-298):
       Change from:
       ```
       const isReceiver = movement.receiver_id === profile.id;
       const isLeadOrAdmin = ['ga_lead', 'admin'].includes(profile.role);
       if (!isReceiver && !isLeadOrAdmin) {
         throw new Error('Only the designated receiver or a GA Lead/Admin can accept this transfer');
       }
       ```
       To:
       ```
       const isReceiver = movement.receiver_id === profile.id;
       if (!isReceiver) {
         throw new Error('Only the designated receiver can accept this transfer');
       }
       ```

    2. **`rejectTransfer`** (around line 351-355):
       Change from:
       ```
       const isReceiver = movement.receiver_id === profile.id;
       const isLeadOrAdmin = ['ga_lead', 'admin'].includes(profile.role);
       if (!isReceiver && !isLeadOrAdmin) {
         throw new Error('Only the designated receiver or a GA Lead/Admin can reject this transfer');
       }
       ```
       To:
       ```
       const isReceiver = movement.receiver_id === profile.id;
       if (!isReceiver) {
         throw new Error('Only the designated receiver can reject this transfer');
       }
       ```

    3. **`cancelTransfer`** (around line 397-401):
       Change from:
       ```
       const isInitiator = movement.initiated_by === profile.id;
       const isLeadOrAdmin = ['ga_lead', 'admin'].includes(profile.role);
       if (!isInitiator && !isLeadOrAdmin) {
         throw new Error('Only the transfer initiator or a GA Lead/Admin can cancel this transfer');
       }
       ```
       To:
       ```
       const isInitiator = movement.initiated_by === profile.id;
       const isAdmin = profile.role === 'admin';
       if (!isInitiator && !isAdmin) {
         throw new Error('Only the transfer initiator or an admin can cancel this transfer');
       }
       ```
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>Build passes. acceptTransfer and rejectTransfer allow only the designated receiver. cancelTransfer allows initiator or admin only.</done>
</task>

<task type="auto">
  <name>Task 2: Update UI permission guards</name>
  <files>components/assets/asset-detail-actions.tsx, components/assets/asset-view-modal.tsx</files>
  <action>
    Update the client-side permission checks that control whether action buttons are shown.

    **`components/assets/asset-detail-actions.tsx`** (around line 69-78):

    Change `canRespond` and `canCancel` derivations from:
    ```typescript
    const isReceiver = pendingTransfer && pendingTransfer.receiver_id === currentUserId;
    const canRespond =
      pendingTransfer &&
      (isReceiver || isGaLeadOrAdmin);

    const isInitiator = pendingTransfer && pendingTransfer.initiated_by === currentUserId;
    const canCancel =
      pendingTransfer &&
      (isInitiator || isGaLeadOrAdmin);
    ```
    To:
    ```typescript
    const isReceiver = pendingTransfer && pendingTransfer.receiver_id === currentUserId;
    const canRespond = pendingTransfer && isReceiver;

    const isInitiator = pendingTransfer && pendingTransfer.initiated_by === currentUserId;
    const isAdmin = currentUserRole === 'admin';
    const canCancel = pendingTransfer && (isInitiator || isAdmin);
    ```

    Note: `isGaLeadOrAdmin` const is still used by `canChangeStatus` logic elsewhere — check usages before removing it. If it is only used in the old canRespond/canCancel, remove it. If used elsewhere, keep it.

    **`components/assets/asset-view-modal.tsx`** sticky action bar (around lines 523-532):

    Change the pendingTransfer block from:
    ```typescript
    {pendingTransfer && (currentUserId === pendingTransfer.receiver_id || ['ga_lead', 'admin'].includes(currentUserRole)) && (
      <>
        <Button ... onClick={() => openTransferRespond('accept')}>Accept Transfer</Button>
        <Button ... onClick={() => openTransferRespond('reject')}>Reject Transfer</Button>
      </>
    )}
    ```
    To:
    ```typescript
    {pendingTransfer && currentUserId === pendingTransfer.receiver_id && (
      <>
        <Button ... onClick={() => openTransferRespond('accept')}>Accept Transfer</Button>
        <Button ... onClick={() => openTransferRespond('reject')}>Reject Transfer</Button>
      </>
    )}
    ```

    Also update the Cancel Transfer button visibility in `asset-view-modal.tsx` if it exists in the sticky bar — restrict to initiator or admin only (same pattern as asset-detail-actions.tsx change above).
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>Build passes. Accept/Reject buttons only appear for the designated receiver. Cancel button only appears for the initiator or admin. GA Lead no longer sees accept/reject/cancel buttons on transfers they did not initiate.</done>
</task>

</tasks>

<verification>
After both tasks, confirm:
- `npm run build` exits with no errors
- In `asset-actions.ts`: `acceptTransfer` and `rejectTransfer` have no `isLeadOrAdmin` check; `cancelTransfer` uses `isAdmin` (role === 'admin') not `isLeadOrAdmin`
- In `asset-detail-actions.tsx`: `canRespond` is `pendingTransfer && isReceiver` only; `canCancel` is `pendingTransfer && (isInitiator || isAdmin)`
- In `asset-view-modal.tsx`: sticky bar accept/reject block checks only `currentUserId === pendingTransfer.receiver_id`
</verification>

<success_criteria>
- Server-side: Only receiver can call acceptTransfer/rejectTransfer without error
- Server-side: Only initiator or admin can call cancelTransfer without error
- UI: Accept and Reject buttons hidden for ga_lead unless they are the designated receiver
- UI: Cancel button hidden for ga_lead unless they initiated the transfer
- Build: no TypeScript or lint errors
</success_criteria>

<output>
After completion, create `.planning/quick/36-asset-transfer-only-the-receiver-can-acc/36-SUMMARY.md`
</output>
