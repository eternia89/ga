---
phase: quick-25
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-transfer-dialog.tsx
  - components/assets/asset-columns.tsx
  - components/assets/asset-table.tsx
  - components/assets/asset-detail-client.tsx
  - components/assets/asset-view-modal.tsx
  - components/maintenance/template-builder-item.tsx
  - components/maintenance/template-detail.tsx
  - components/maintenance/template-create-form.tsx
  - lib/validations/asset-schema.ts
  - app/actions/asset-actions.ts
  - app/(dashboard)/inventory/page.tsx
autonomous: true
requirements: [QUICK-25]

must_haves:
  truths:
    - "Transfer dialog asks only for receiver; destination location auto-derives from receiver's location_id"
    - "Asset status is shown directly on asset detail page as a visible status indicator, not behind a button"
    - "Asset table rows show both View and Transfer action links"
    - "Template checklist sections use plain text headers without bordered card wrappers"
    - "Numeric checklist items have no unit field"
  artifacts:
    - path: "components/assets/asset-transfer-dialog.tsx"
      provides: "Transfer dialog with receiver-only field and auto-derived location"
    - path: "components/assets/asset-columns.tsx"
      provides: "Asset table columns with Transfer action alongside View"
    - path: "components/maintenance/template-builder-item.tsx"
      provides: "Template builder items with no unit field for numeric type"
  key_links:
    - from: "components/assets/asset-transfer-dialog.tsx"
      to: "app/actions/asset-actions.ts"
      via: "createTransfer action with receiver_id, auto-resolved to_location_id"
      pattern: "createTransfer.*receiver_id"
    - from: "components/assets/asset-columns.tsx"
      to: "components/assets/asset-transfer-dialog.tsx"
      via: "Transfer button in table row actions triggers transfer dialog"
---

<objective>
Refine asset location tracking, transfer flow, status display, and template checklist UI.

Purpose: Simplify the transfer flow (only ask for receiver, auto-derive location), make status more visible on detail pages, add Transfer shortcut to table rows, and clean up template checklist UI.
Output: Updated asset transfer dialog, table columns, detail page, and template builder components.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@components/assets/asset-transfer-dialog.tsx
@components/assets/asset-columns.tsx
@components/assets/asset-detail-client.tsx
@components/assets/asset-view-modal.tsx
@components/assets/asset-detail-actions.tsx
@components/maintenance/template-builder-item.tsx
@components/maintenance/template-detail.tsx
@components/maintenance/template-create-form.tsx
@lib/validations/asset-schema.ts
@app/actions/asset-actions.ts
@lib/types/maintenance.ts
@lib/constants/asset-status.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Simplify transfer flow and add Transfer action to asset table</name>
  <files>
    components/assets/asset-transfer-dialog.tsx
    components/assets/asset-columns.tsx
    components/assets/asset-table.tsx
    components/assets/asset-detail-client.tsx
    components/assets/asset-view-modal.tsx
    lib/validations/asset-schema.ts
    app/actions/asset-actions.ts
    app/(dashboard)/inventory/page.tsx
  </files>
  <action>
    **1. Transfer dialog: receiver-only, auto-derive location.**

    In `asset-transfer-dialog.tsx`:
    - Remove the "Destination Location" Combobox field entirely. The transfer should only ask for Receiver.
    - Update `gaUsers` prop to include `location_id` in each user object: `{ id: string; name: string; location_id: string | null }[]`.
    - When receiver is selected, auto-resolve `to_location_id` from the selected user's `location_id`. Show the resolved location name as read-only text below the receiver field (e.g., "Location: Jakarta Office").
    - If receiver has no location_id, show a warning: "Selected receiver has no assigned location. Please assign a location to this user first." and disable submit.
    - Remove `locations` from props (no longer needed for destination selection; keep for showing current location name).
    - Update `canSubmit` to check `receiverId !== '' && resolvedLocationId !== '' && photos.length > 0`.
    - In `handleSubmit`, pass `to_location_id: resolvedLocationId` to `createTransfer`.
    - Remove `locations` from the interface (not needed for destination picker anymore) but keep passing locations for displaying current location name. Actually simplify: just pass `currentLocationName: string` instead of the full locations array since it's only used for the "Current Location" label.

    In `lib/validations/asset-schema.ts`:
    - `assetTransferSchema` stays the same (still needs `to_location_id` for the DB insert). No schema changes needed.

    In `app/actions/asset-actions.ts`:
    - No changes to `createTransfer` action. It already accepts `to_location_id` and `receiver_id`. The auto-derivation happens client-side.

    **2. Add "Transfer" action to asset table rows.**

    In `components/assets/asset-columns.tsx`:
    - Add `onTransfer?: (asset: InventoryItemWithRelations) => void` to `AssetTableMeta`.
    - In the `actions` column cell, add a "Transfer" button next to "View". Only show Transfer when:
      - `meta?.currentUserRole` is ga_staff, ga_lead, or admin
      - asset.status !== 'sold_disposed'
      - No pending transfer exists for this asset (`!meta?.pendingTransfers?.[row.original.id]`)
    - Style: same ghost button pattern as View: `text-blue-600 hover:underline`.

    In `components/assets/asset-table.tsx`:
    - Pass `onTransfer` through table meta.

    In `app/(dashboard)/inventory/page.tsx`:
    - Wire up the Transfer action: when clicked from table row, open the transfer dialog for that asset.
    - Fetch gaUsers with location_id included: modify the query to `select('id, full_name, location_id')` and map to `{ id, name: full_name, location_id }`.
    - Also update locations query to include name for resolving receiver locations.
    - Pass a `gaUsersWithLocation` array to the transfer dialog.

    **3. Asset status displayed directly on detail page.**

    In `components/assets/asset-detail-client.tsx`:
    - The status badge is already shown in the header next to display_id (line ~104-116). The user wants it listed directly without wrapping in a "change status" button.
    - Remove the `<button>` wrapper around `<AssetStatusBadge>` in the header. Instead, render the badge as a plain element.
    - Add a separate "Change Status" text button (ghost, text-blue-600 hover:underline, small) next to the badge if `canChangeStatus` is true. This separates the status display from the action.
    - Default status label: The constant already has 'active' = 'Active' which means "Normal/working". Add a comment but no label change needed since "Active" already conveys normal operation per existing ASSET_STATUS_LABELS.

    In `components/assets/asset-view-modal.tsx`:
    - Same pattern: status badge is already displayed in the header (line ~441). It's already a plain element (not a button). No change needed here.
    - In the sticky action bar (bottom), the "Change Status" button already exists. Leave as-is.
  </action>
  <verify>
    npm run build passes with no TypeScript errors.
  </verify>
  <done>
    - Transfer dialog only shows Receiver field; destination location auto-populates from receiver's location
    - Asset table rows show both "View" and "Transfer" actions
    - Asset detail page shows status badge directly (not wrapped in clickable button), with separate "Change Status" link
  </done>
</task>

<task type="auto">
  <name>Task 2: Simplify template checklist UI - sections and numeric fields</name>
  <files>
    components/maintenance/template-builder-item.tsx
    components/maintenance/template-detail.tsx
    components/maintenance/template-create-form.tsx
    lib/types/maintenance.ts
  </files>
  <action>
    **1. Remove unit field from numeric checklist items.**

    In `components/maintenance/template-builder-item.tsx`:
    - Remove the `handleUnitChange` function entirely.
    - Remove the `{item.type === 'numeric' && (...)}` block that renders the unit Input field (lines 122-130).
    - Numeric items now just have a label, same as checkbox/pass_fail/text/photo types.

    In `lib/types/maintenance.ts`:
    - Remove `unit?: string` from `NumericItem` type. Change to just `ChecklistItemBase & { type: 'numeric' }`.
    - Note: existing data in DB may have `unit` in JSONB. This is fine -- unused fields in JSONB are harmlessly ignored at read time. No migration needed.

    In `components/maintenance/template-detail.tsx`:
    - In the read-only checklist preview, remove the `{item.type === 'numeric' && item.unit && (...)}` block (line 379-381) that shows "Unit: {unit}".

    **2. Simplify section styling in template checklist areas.**

    In `components/maintenance/template-detail.tsx`:
    - The "Template Information" and "Checklist Items" sections are currently wrapped in `<div className="rounded-lg border border-border p-6 space-y-4">`. Per user request, sections should be simpler: no border with padding, just a header to separate sections.
    - Replace the bordered card wrapper with just the section header + content. Use the existing `<h2>` header as a section divider with bottom margin, and a simple `<Separator />` underneath it instead of the card border.
    - For the editable form: change `<div className="rounded-lg border border-border p-6 space-y-4">` to `<div className="space-y-4">` for both the "Template Information" section and the "Checklist Items" section.
    - For the read-only view: same change -- remove `rounded-lg border border-border p-6` wrapper, keep just `space-y-4`.
    - Keep the `<Separator />` below each section heading to visually separate.

    In `components/maintenance/template-create-form.tsx`:
    - Check if it uses the same bordered section pattern. If so, apply the same simplification: remove border/padding wrapper, keep heading + separator.

    In `components/maintenance/template-builder.tsx` (if needed):
    - The builder itself renders items in a `space-y-2` div. Each item in `template-builder-item.tsx` has `rounded-lg border border-border bg-background p-3`. These are individual items, not sections -- keep them as-is since users need clear item boundaries for drag-and-drop.
  </action>
  <verify>
    npm run build passes with no TypeScript errors.
  </verify>
  <done>
    - Numeric checklist items no longer show a unit field in template builder or detail view
    - Template sections (Template Information, Checklist Items) use plain headers with separators instead of bordered card wrappers
    - NumericItem type no longer has unit property
  </done>
</task>

</tasks>

<verification>
- `npm run build` completes with zero errors
- `npm run lint` passes
</verification>

<success_criteria>
1. Transfer dialog asks only for receiver; destination location auto-resolves from receiver's assigned location
2. Asset table shows "Transfer" link alongside "View" for eligible rows
3. Asset detail page displays status badge directly, not behind a clickable button
4. Template checklist sections use simple headers, no bordered card wrappers
5. Numeric checklist items have no unit field
</success_criteria>

<output>
After completion, create `.planning/quick/25-asset-location-tracking-transfer-flow-st/25-SUMMARY.md`
</output>
