---
phase: quick-44
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-columns.tsx
  - components/assets/asset-table.tsx
  - components/assets/asset-view-modal.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Asset table rows show a 'Change Status' action button alongside View and Transfer"
    - "Clicking 'Change Status' in the table row opens AssetStatusChangeDialog without opening the view modal"
    - "AssetStatusChangeDialog is no longer accessible from the view modal sticky bar"
    - "Transfer button remains in the table row actions unchanged"
    - "View modal still works correctly without the Change Status button"
  artifacts:
    - path: "components/assets/asset-columns.tsx"
      provides: "onChangeStatus callback in AssetTableMeta, Change Status button in actions cell"
    - path: "components/assets/asset-table.tsx"
      provides: "AssetStatusChangeDialog mounted at table level, wired to onChangeStatus handler"
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Change Status button removed from sticky bar"
  key_links:
    - from: "components/assets/asset-columns.tsx"
      to: "components/assets/asset-table.tsx"
      via: "onChangeStatus in AssetTableMeta passed through DataTable meta"
      pattern: "onChangeStatus"
    - from: "components/assets/asset-table.tsx"
      to: "components/assets/asset-status-change-dialog.tsx"
      via: "AssetStatusChangeDialog mounted with statusChangeAsset state"
      pattern: "statusChangeAsset"
---

<objective>
Move the "Change Status" action for assets from the view modal sticky bar to the table row actions column, consistent with how "Transfer" already exists as a row-level shortcut action.

Purpose: Reduce clicks — users should be able to change an asset's status directly from the list without opening the view modal first. Matches the existing pattern where Transfer is a table row action.
Output: Change Status button in table row actions, AssetStatusChangeDialog mounted at AssetTable level, Change Status removed from view modal sticky bar.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key existing patterns to follow:
- Transfer is already a table row action in asset-columns.tsx (lines 184-196) — Change Status follows the exact same pattern
- AssetTransferDialog is mounted in asset-table.tsx with `transferAsset` state — do the same for AssetStatusChangeDialog with `statusChangeAsset` state
- The "Change Status" button in view modal sticky bar is at lines 533-537 of asset-view-modal.tsx — remove this block
- AssetStatusChangeDialog accepts: open, onOpenChange, asset (InventoryItemWithRelations), onSuccess
- Visibility guard for Change Status: `['ga_staff', 'ga_lead', 'admin'].includes(role) && asset.status !== 'sold_disposed' && !pendingTransfer`
  - In the table row, pendingTransfer is available via `meta?.pendingTransfers?.[row.original.id]`

<interfaces>
From components/assets/asset-columns.tsx (AssetTableMeta):
```typescript
export type AssetTableMeta = {
  onView?: (asset: InventoryItemWithRelations) => void;
  onTransfer?: (asset: InventoryItemWithRelations) => void;
  pendingTransfers?: Record<string, PendingTransfer>;
  currentUserRole?: string;
  photosByAsset?: Record<string, PhotoItem[]>;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
};
```

From components/assets/asset-status-change-dialog.tsx:
```typescript
interface AssetStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: InventoryItemWithRelations;
  onSuccess: () => void;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Change Status to table row actions and wire at table level</name>
  <files>components/assets/asset-columns.tsx, components/assets/asset-table.tsx</files>
  <action>
**asset-columns.tsx:**
1. Add `onChangeStatus?: (asset: InventoryItemWithRelations) => void` to `AssetTableMeta` type.
2. In the `actions` column cell, add a "Change Status" button after the existing "Transfer" button. Same visibility guard as Transfer: `canChangeStatus = meta?.currentUserRole && ['ga_staff', 'ga_lead', 'admin'].includes(meta.currentUserRole) && asset.status !== 'sold_disposed' && !meta?.pendingTransfers?.[row.original.id]`. Button style matches Transfer: `variant="ghost" size="sm" className="h-7 px-2 text-sm text-blue-600 hover:underline"`. On click: `e.stopPropagation(); meta?.onChangeStatus?.(asset)`.
3. Update `size` of actions column from `160` to `220` to accommodate the extra button.

**asset-table.tsx:**
1. Add `statusChangeAsset` state: `const [statusChangeAsset, setStatusChangeAsset] = useState<InventoryItemWithRelations | null>(null)`.
2. Add handler: `const handleChangeStatus = (asset: InventoryItemWithRelations) => { setStatusChangeAsset(asset); }`.
3. Add `onChangeStatus: handleChangeStatus` to the DataTable `meta` object.
4. Import `AssetStatusChangeDialog` from `./asset-status-change-dialog`.
5. Mount `AssetStatusChangeDialog` below the existing `AssetTransferDialog` block:
   ```tsx
   {statusChangeAsset && (
     <AssetStatusChangeDialog
       open={!!statusChangeAsset}
       onOpenChange={(open) => { if (!open) setStatusChangeAsset(null); }}
       asset={statusChangeAsset}
       onSuccess={handleModalActionSuccess}
     />
   )}
   ```
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Table rows for eligible assets show "View", "Transfer" (when applicable), and "Change Status" buttons. Clicking "Change Status" opens the dialog without opening the view modal. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Remove Change Status button from view modal sticky bar</name>
  <files>components/assets/asset-view-modal.tsx</files>
  <action>
In the sticky action bar (the `div` with class `border-t px-6 py-3`), remove the "Change Status" button block entirely. This is the block at lines ~533-537:
```tsx
{['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) && asset.status !== 'sold_disposed' && !pendingTransfer && (
  <Button variant="outline" size="sm" onClick={() => setShowStatusDialog(true)}>
    Change Status
  </Button>
)}
```

The `showStatusDialog` state, `setShowStatusDialog` usages, and the `AssetStatusChangeDialog` rendered below the sticky bar (lines ~564-572) should also be removed since Change Status is no longer accessible from the modal. Clean up the now-unused `showStatusDialog` state declaration and its reset in the `useEffect` cleanup block.

Keep all other buttons and state (Transfer, Save Changes, Accept/Reject Transfer, Cancel Transfer) unchanged.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>View modal sticky bar no longer shows "Change Status" button. AssetStatusChangeDialog is not imported/used in asset-view-modal.tsx. Build passes with no TypeScript errors.</done>
</task>

</tasks>

<verification>
1. `npm run build` completes with 0 errors.
2. `npm run lint` passes cleanly.
3. Manual: Navigate to /inventory — asset table rows show "Change Status" button for eligible assets (not sold_disposed, no pending transfer, role is ga_staff/ga_lead/admin).
4. Manual: Click "Change Status" — dialog opens immediately without the view modal appearing.
5. Manual: Open view modal via "View" — sticky bar shows Save Changes and Transfer only (no Change Status button).
6. Manual: Complete a status change from the table row — success feedback appears, table refreshes.
</verification>

<success_criteria>
- "Change Status" action appears in table row actions for eligible assets
- Clicking it opens AssetStatusChangeDialog directly (no view modal)
- View modal sticky bar no longer has "Change Status" button
- Build and lint pass clean
</success_criteria>

<output>
After completion, create `.planning/quick/44-move-change-status-action-for-assets-fro/44-SUMMARY.md`
</output>
