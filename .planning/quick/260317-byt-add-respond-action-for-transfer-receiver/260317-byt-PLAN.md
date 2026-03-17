---
phase: quick
plan: 260317-byt
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-columns.tsx
  - components/assets/asset-table.tsx
  - components/assets/asset-transfer-respond-modal.tsx
autonomous: true
requirements: [QUICK-RESPOND-ACTION]

must_haves:
  truths:
    - "General users who are transfer receivers see 'Respond' button in the asset table row actions"
    - "GA users who are also transfer receivers see both 'View' and 'Respond' buttons in table row"
    - "Respond modal shows full asset details (display_id, name, category, location, brand, model, serial_number, condition photos)"
    - "Respond modal shows transfer details (from/to location, initiator, date, notes, sender photos)"
    - "Respond modal has Accept and Reject buttons that work correctly"
    - "Change Status and Transfer buttons remain hidden when asset is in transit (already implemented)"
  artifacts:
    - path: "components/assets/asset-transfer-respond-modal.tsx"
      provides: "New respond modal with asset details + accept/reject"
      min_lines: 100
    - path: "components/assets/asset-columns.tsx"
      provides: "Updated actions column with Respond button for receivers"
      contains: "onRespond"
    - path: "components/assets/asset-table.tsx"
      provides: "Respond modal state management and rendering"
      contains: "respondAsset"
  key_links:
    - from: "components/assets/asset-columns.tsx"
      to: "components/assets/asset-table.tsx"
      via: "meta.onRespond callback"
      pattern: "onRespond.*asset"
    - from: "components/assets/asset-table.tsx"
      to: "components/assets/asset-transfer-respond-modal.tsx"
      via: "respondAsset state renders modal"
      pattern: "AssetTransferRespondModal"
    - from: "components/assets/asset-transfer-respond-modal.tsx"
      to: "app/actions/asset-actions.ts"
      via: "acceptTransfer/rejectTransfer server actions"
      pattern: "acceptTransfer|rejectTransfer"
---

<objective>
Add a "Respond" action button in the asset table row for users who are the receiver of a pending transfer. Clicking "Respond" opens a new detail modal showing full asset information, transfer details, sender condition photos, and Accept/Reject buttons.

Purpose: General users currently have no way to respond to transfers from the table. They must navigate to the view modal which GA users see. This gives receivers a direct, informative action path.
Output: New AssetTransferRespondModal component, updated table columns and table component.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-columns.tsx
@components/assets/asset-table.tsx
@components/assets/asset-transfer-respond-dialog.tsx
@components/assets/asset-view-modal.tsx
@app/(dashboard)/inventory/page.tsx
@lib/types/database.ts

<interfaces>
<!-- Key types the executor needs -->

From lib/types/database.ts:
```typescript
export interface InventoryItem {
  id: string;
  company_id: string;
  location_id: string | null;
  category_id: string | null;
  display_id: string;
  name: string;
  description: string | null;
  status: AssetStatus;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  acquisition_date: string | null;
  warranty_expiry: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemWithRelations extends InventoryItem {
  category: { name: string } | null;
  location: { name: string } | null;
  company: { name: string } | null;
}

export interface InventoryMovementWithRelations extends InventoryMovement {
  from_location: { name: string } | null;
  to_location: { name: string } | null;
  initiator: { full_name: string } | null;
  receiver: { full_name: string } | null;
}
```

From components/assets/asset-columns.tsx:
```typescript
export interface PendingTransfer {
  id: string;
  to_location: { name: string } | null;
  receiver_id: string | null;
}

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

From app/actions/asset-actions.ts:
```typescript
export const acceptTransfer = authActionClient.schema(...).action(...)
export const rejectTransfer = authActionClient.schema(...).action(...)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Respond button to table columns and wire state in AssetTable</name>
  <files>components/assets/asset-columns.tsx, components/assets/asset-table.tsx</files>
  <action>
**asset-columns.tsx:**
1. Add `currentUserId?: string` and `onRespond?: (asset: InventoryItemWithRelations) => void` to `AssetTableMeta`.
2. In the `actions` column cell, add a "Respond" button that appears when:
   - `meta?.pendingTransfers?.[row.original.id]` exists (asset has pending transfer), AND
   - `meta?.pendingTransfers?.[row.original.id]?.receiver_id === meta.currentUserId` (current user is the receiver)
3. The "Respond" button uses the same ghost button styling as View/Change Status/Transfer: `variant="ghost" size="sm" className="h-7 px-2 text-sm text-blue-600 hover:underline"`.
4. View button: Currently only shows for GA users (guarded by `canChangeStatus`). Fix this: The View button should ALWAYS render (no role guard). It is already outside the `canChangeStatus` block but verify it remains unconditional.
5. The Respond button should appear AFTER View but BEFORE Change Status/Transfer (so the order is: View, Respond, Change Status, Transfer).

**asset-table.tsx:**
1. Add `respondAsset` state: `useState<InventoryItemWithRelations | null>(null)`.
2. Add `handleRespond` handler: `setRespondAsset(asset)`.
3. Pass `currentUserId` and `onRespond: handleRespond` to DataTable meta object alongside the existing meta props.
4. Import and render `AssetTransferRespondModal` (created in Task 2) below the existing dialogs, passing:
   - `open={!!respondAsset}`
   - `onOpenChange={(open) => { if (!open) setRespondAsset(null); }}`
   - `asset={respondAsset}` (the InventoryItemWithRelations)
   - `pendingTransfer={respondAsset ? pendingTransfers[respondAsset.id] : undefined}`
   - `onSuccess={handleModalActionSuccess}`
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
- Respond button visible in table row for users who are receivers of pending transfers
- GA users who are receivers see View + Respond + Change Status + Transfer
- General users who are receivers see View + Respond
- currentUserId flows from AssetTable meta to column cell
  </done>
</task>

<task type="auto">
  <name>Task 2: Create AssetTransferRespondModal with asset details and accept/reject</name>
  <files>components/assets/asset-transfer-respond-modal.tsx</files>
  <action>
Create a new client component `AssetTransferRespondModal` that provides a rich detail view of the asset and transfer, with accept/reject functionality.

**Props:**
```typescript
interface AssetTransferRespondModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: InventoryItemWithRelations | null;
  pendingTransfer?: PendingTransfer;
  onSuccess: () => void;
}
```

**On open (when `asset` is set and `open` is true):**
Use client-side Supabase (`createClient()`) to fetch:
1. Full movement details: query `inventory_movements` with relations (from_location, to_location, initiator, receiver) where `id === pendingTransfer.id` and `status === 'pending'`.
2. Sender condition photos: query `media_attachments` where `entity_type = 'asset_transfer_send'` and `entity_id = movement.id`, then sign URLs from `asset-photos` bucket.
3. Latest asset condition photos: query `media_attachments` where `entity_type IN ('asset_creation', 'asset_status_change')` and `entity_id = asset.id`, sign URLs, take latest 4.

Use `useState` + `useEffect` pattern (similar to `AssetViewModal.fetchData`). Show `Skeleton` loading state.

**Modal layout (Dialog, max-w-[600px]):**
- `DialogHeader` with `DialogTitle`: "Respond to Transfer"
- **Asset Information section** (rounded border bg-muted/30 p-4):
  - Display ID (font-mono) + asset name on first line
  - Grid (2 cols) showing: Category, Location, Brand, Model, Serial Number — each with uppercase tracking-wide label + value. Skip null fields.
  - If asset condition photos exist, show thumbnails row (max 4, h-16 w-16 rounded, clickable for PhotoLightbox)
- **Transfer Details section** (rounded border bg-muted/30 p-4, mt-4):
  - From Location -> To Location (arrow)
  - Initiated By: initiator name
  - Date: format(created_at, 'dd-MM-yyyy')
  - Notes: movement.notes (if any)
  - If sender photos exist, show thumbnails row (same style as above)
- **Accept/Reject mode toggle + forms:**
  - Default state: show two buttons side-by-side at the bottom: "Accept Transfer" (green) and "Reject Transfer" (destructive outline).
  - When "Accept Transfer" is clicked: show an optional `PhotoUpload` for receiver condition photos (maxPhotos=5, enableAnnotation=false) + confirm "Accept Transfer" button + "Back" button.
  - When "Reject Transfer" is clicked: show required `Textarea` for rejection reason (maxLength=1000, required) + optional `PhotoUpload` for evidence (maxPhotos=5) + confirm "Reject Transfer" button + "Back" button.
  - "Back" returns to the two-button default state.

**Submit logic (reuse from AssetTransferRespondDialog):**
- Accept: call `acceptTransfer({ movement_id })`, then upload photos to `/api/uploads/asset-photos` with `photo_type: 'transfer_receive'`.
- Reject: call `rejectTransfer({ movement_id, reason })`, then upload photos with `photo_type: 'transfer_reject'`.
- On success: call `onOpenChange(false)` then `onSuccess()`.
- On error: show InlineFeedback with error message.

**Import PhotoLightbox** for expanding thumbnails. Use same pattern as AssetViewModal.

**Important:** Use `useRouter().refresh()` after success (same as existing `AssetTransferRespondDialog`). Import `acceptTransfer`, `rejectTransfer` from `@/app/actions/asset-actions`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
- AssetTransferRespondModal renders asset details (display_id, name, category, location, brand, model, serial_number)
- Modal shows transfer details (from/to location, initiator, date, notes)
- Sender condition photos displayed as thumbnails with lightbox
- Accept flow: optional receiver photos + accept action
- Reject flow: required reason + optional photos + reject action
- InlineFeedback on error, dialog closes on success
- Skeleton loading state while fetching movement/photo data
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run lint` passes
3. Manual: Log in as a general user who is the receiver of a pending transfer. Verify "Respond" button appears in asset table row. Click it, verify modal shows asset details and transfer details. Test accept and reject flows.
4. Manual: Log in as a GA user who is also a transfer receiver. Verify both "View" and "Respond" appear. Verify "Change Status" and "Transfer" are hidden for in-transit assets (pre-existing behavior).
</verification>

<success_criteria>
- General users see "Respond" button on assets where they are the transfer receiver
- GA users see "View" + "Respond" (and "Change Status"/"Transfer" hidden during transit)
- Respond modal shows full asset info + transfer details + sender photos
- Accept and Reject flows work correctly with photo upload
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260317-byt-add-respond-action-for-transfer-receiver/260317-byt-SUMMARY.md`
</output>
