---
phase: quick
plan: 260317-fhv
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-columns.tsx
  - components/assets/asset-table.tsx
  - components/assets/asset-transfer-respond-modal.tsx
autonomous: true
requirements: [QUICK-EDIT-TRANSFER-ADMIN]

must_haves:
  truths:
    - "GA Lead and Admin users see 'Edit Transfer' button in asset table row when asset has a pending transfer"
    - "Edit Transfer modal shows same asset details and transfer info as the Respond modal"
    - "Edit Transfer modal has 'Cancel Transfer' button instead of Accept/Reject"
    - "Cancel Transfer calls the existing cancelTransfer server action"
  artifacts:
    - path: "components/assets/asset-columns.tsx"
      provides: "onEditTransfer callback in meta, Edit Transfer button for GA lead/admin"
      contains: "onEditTransfer"
    - path: "components/assets/asset-table.tsx"
      provides: "editTransferAsset state, renders modal in admin variant"
      contains: "editTransferAsset"
    - path: "components/assets/asset-transfer-respond-modal.tsx"
      provides: "variant prop: respond (accept/reject) vs admin (cancel transfer)"
      contains: "variant"
  key_links:
    - from: "components/assets/asset-columns.tsx"
      to: "components/assets/asset-table.tsx"
      via: "meta.onEditTransfer callback"
      pattern: "onEditTransfer"
    - from: "components/assets/asset-table.tsx"
      to: "components/assets/asset-transfer-respond-modal.tsx"
      via: "variant='admin' prop"
      pattern: "variant.*admin"
---

<objective>
Add "Edit Transfer" button in asset table row actions for GA Lead/Admin when an asset is in transit. Opens the existing respond modal in admin mode — same asset details + transfer info, but with "Cancel Transfer" button instead of Accept/Reject.

Purpose: Give admins visibility into pending transfer details and cancel ability directly from the table.
Output: New variant of AssetTransferRespondModal, new Edit Transfer button in table row.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-columns.tsx
@components/assets/asset-table.tsx
@components/assets/asset-transfer-respond-modal.tsx

<interfaces>
Current AssetTableMeta (asset-columns.tsx):
```typescript
export type AssetTableMeta = {
  onView?: (asset: InventoryItemWithRelations) => void;
  onTransfer?: (asset: InventoryItemWithRelations) => void;
  onChangeStatus?: (asset: InventoryItemWithRelations) => void;
  onRespond?: (asset: InventoryItemWithRelations) => void;
  pendingTransfers?: Record<string, PendingTransfer>;
  currentUserRole?: string;
  currentUserId?: string;
  photosByAsset?: Record<string, PhotoItem[]>;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
};
```

AssetTransferRespondModal props (asset-transfer-respond-modal.tsx):
```typescript
interface AssetTransferRespondModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: InventoryItemWithRelations | null;
  pendingTransfer?: PendingTransfer;
  onSuccess: () => void;
}
```

cancelTransfer action (asset-actions.ts line 393):
```typescript
export const cancelTransfer = authActionClient.schema(transferCancelSchema).action(...)
// Takes { movement_id: string }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add variant prop to AssetTransferRespondModal for admin mode</name>
  <files>components/assets/asset-transfer-respond-modal.tsx</files>
  <action>
1. Add `variant?: 'respond' | 'admin'` prop (default `'respond'`) to `AssetTransferRespondModalProps`.

2. Import `cancelTransfer` from `@/app/actions/asset-actions`.

3. Update `DialogTitle` to show "Respond to Transfer" for respond variant, "Transfer Details" for admin variant.

4. Update the `ModalMode` type to include `'cancel'`: `type ModalMode = 'default' | 'accept' | 'reject' | 'cancel'`.

5. In the bottom action area (the `{mode === 'default' && ...}` block), conditionally render:
   - **variant='respond'** (existing): Accept Transfer + Reject Transfer buttons (no change)
   - **variant='admin'**: Single "Cancel Transfer" button (destructive variant) that sets mode to 'cancel'

6. Add a `{mode === 'cancel' && ...}` block (similar to accept/reject blocks):
   - Show a confirmation message: "Are you sure you want to cancel this pending transfer? The asset will remain at its current location."
   - InlineFeedback for errors
   - "Back" button + "Cancel Transfer" confirm button (destructive)
   - On confirm: call `cancelTransfer({ movement_id: movement.id })`, handle errors, on success close dialog + call onSuccess + router.refresh()

7. Reset mode to 'default' when dialog closes (add 'cancel' handling to the reset useEffect).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    - variant prop controls whether modal shows respond or admin buttons
    - Admin variant shows "Cancel Transfer" button
    - Cancel flow has confirmation step with error handling
    - Dialog title changes based on variant
  </done>
</task>

<task type="auto">
  <name>Task 2: Add Edit Transfer button to table columns and wire in AssetTable</name>
  <files>components/assets/asset-columns.tsx, components/assets/asset-table.tsx</files>
  <action>
**asset-columns.tsx:**
1. Add `onEditTransfer?: (asset: InventoryItemWithRelations) => void` to `AssetTableMeta`.
2. Add `canEditTransfer` condition in actions column:
   ```typescript
   const canEditTransfer =
     !!pendingTransfer &&
     meta?.currentUserRole &&
     ['ga_lead', 'admin'].includes(meta.currentUserRole);
   ```
3. Add "Edit Transfer" button after Respond, before Change Status:
   ```tsx
   {canEditTransfer && (
     <Button variant="ghost" size="sm" className="h-7 px-2 text-sm text-blue-600 hover:underline"
       onClick={(e) => { e.stopPropagation(); meta?.onEditTransfer?.(asset); }}>
       Edit Transfer
     </Button>
   )}
   ```

**asset-table.tsx:**
1. Add `editTransferAsset` state: `useState<InventoryItemWithRelations | null>(null)`.
2. Add `handleEditTransfer` handler: `setEditTransferAsset(asset)`.
3. Pass `onEditTransfer: handleEditTransfer` in DataTable meta object.
4. Render `AssetTransferRespondModal` for edit transfer (separate from the respond one):
   ```tsx
   {editTransferAsset && (
     <AssetTransferRespondModal
       open={!!editTransferAsset}
       onOpenChange={(open) => { if (!open) setEditTransferAsset(null); }}
       asset={editTransferAsset}
       pendingTransfer={pendingTransfers[editTransferAsset.id]}
       onSuccess={handleModalActionSuccess}
       variant="admin"
     />
   )}
   ```
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    - Edit Transfer button visible for GA lead/admin when asset is in transit
    - Button opens AssetTransferRespondModal in admin variant
    - Edit Transfer state managed separately from respond state
  </done>
</task>

</tasks>

<output>
After completion, create `.planning/quick/260317-fhv-add-edit-transfer-button-for-admins-with/260317-fhv-SUMMARY.md`
</output>
