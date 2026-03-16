---
phase: quick-83
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-columns.tsx
  - components/assets/asset-view-modal.tsx
autonomous: true
requirements: [quick-83]

must_haves:
  truths:
    - "Transfer button appears in the asset table row actions beside View and Change Status"
    - "Transfer button in table row uses same visibility condition as Change Status (ga_staff/ga_lead/admin, non-terminal status, no pending transfer)"
    - "Transfer button is removed from the asset view modal sticky bar"
    - "Clicking Transfer in table row opens the transfer dialog (existing onTransfer callback)"
  artifacts:
    - path: "components/assets/asset-columns.tsx"
      provides: "Transfer button in actions cell"
      contains: "Transfer"
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Modal sticky bar without Transfer button"
  key_links:
    - from: "components/assets/asset-columns.tsx"
      to: "components/assets/asset-table.tsx"
      via: "meta.onTransfer callback already wired"
      pattern: "meta\\.onTransfer"
---

<objective>
Move the Transfer button from the asset view modal sticky bar to the asset table row actions column, placing it beside View and Change Status.

Purpose: Transfer is a quick action that should be accessible directly from the table without opening the modal first, consistent with how Change Status already works as a table row action.
Output: Updated asset-columns.tsx with Transfer button; updated asset-view-modal.tsx with Transfer button removed from sticky bar.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-columns.tsx
@components/assets/asset-view-modal.tsx
@components/assets/asset-table.tsx

<interfaces>
<!-- From asset-columns.tsx — the meta type already has onTransfer -->
```typescript
export type AssetTableMeta = {
  onView?: (asset: InventoryItemWithRelations) => void;
  onTransfer?: (asset: InventoryItemWithRelations) => void;
  onChangeStatus?: (asset: InventoryItemWithRelations) => void;
  pendingTransfers?: Record<string, PendingTransfer>;
  currentUserRole?: string;
  photosByAsset?: Record<string, PhotoItem[]>;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
};
```

<!-- From asset-table.tsx — onTransfer is already passed in meta (line 146) -->
```typescript
meta={{
  onView: handleView,
  onTransfer: handleTransfer,
  onChangeStatus: handleChangeStatus,
  pendingTransfers,
  currentUserRole,
  photosByAsset,
  onPhotoClick: handlePhotoClick,
}}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Transfer button to table row actions and remove from modal</name>
  <files>components/assets/asset-columns.tsx, components/assets/asset-view-modal.tsx</files>
  <action>
**In `components/assets/asset-columns.tsx`** (actions column, lines 160-202):

Add a "Transfer" ghost button after the "Change Status" button, using the SAME `canChangeStatus` condition. The button:
- Uses `variant="ghost"` with `size="sm"` and class `"h-7 px-2 text-sm text-blue-600 hover:underline"` (matching existing row action styling per CLAUDE.md)
- Calls `meta?.onTransfer?.(asset)` on click (callback already exists in AssetTableMeta and is already wired in asset-table.tsx)
- Is wrapped in the same `{canChangeStatus && (...)}` guard as Change Status
- Calls `e.stopPropagation()` in onClick handler (matching existing pattern)

Increase the actions column `size` from 160 to 240 to accommodate the third button.

**In `components/assets/asset-view-modal.tsx`** (sticky bar, lines 536-539):

Remove the Transfer button block entirely:
```tsx
{['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) && asset.status !== 'sold_disposed' && !pendingTransfer && (
  <Button variant="outline" size="sm" onClick={() => setShowTransferDialog(true)}>
    Transfer
  </Button>
)}
```

Keep the Save Changes button, Accept/Reject Transfer buttons, and Cancel Transfer button in the sticky bar -- only the "Transfer" button moves out.

NOTE: The modal still has its own AssetTransferDialog instance (lines 567-576) which is used when the modal's internal transfer flow is triggered. Since we removed the Transfer button from the modal sticky bar, the `showTransferDialog` state and the modal's `AssetTransferDialog` can be left in place for now -- they cause no harm and may be used if Transfer is re-added to the modal in the future. Alternatively, clean them up if it simplifies the code. Use your judgment.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
- Transfer ghost button appears in asset table row actions beside View and Change Status
- Transfer button in table row has same visibility condition as Change Status (ga_staff/ga_lead/admin, non-sold_disposed, no pending transfer)
- Transfer button removed from asset view modal sticky bar
- TypeScript compiles without errors
- No functional regression: clicking Transfer in table row still opens AssetTransferDialog via existing onTransfer callback
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run lint` passes
3. Visual check: asset table row shows View | Change Status | Transfer buttons for eligible assets
4. Visual check: asset view modal sticky bar no longer shows Transfer button
</verification>

<success_criteria>
- Transfer button visible in asset table row actions for ga_staff/ga_lead/admin users on non-terminal, non-transferring assets
- Transfer button removed from asset view modal sticky bar
- TypeScript and lint pass
</success_criteria>

<output>
After completion, create `.planning/quick/83-move-transfer-button-out-from-modal-stic/83-SUMMARY.md`
</output>
