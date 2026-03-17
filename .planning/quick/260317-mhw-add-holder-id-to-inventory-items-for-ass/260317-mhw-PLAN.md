---
phase: quick-260317-mhw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00028_inventory_items_holder_id.sql
  - lib/types/database.ts
  - app/actions/asset-actions.ts
  - app/(dashboard)/inventory/page.tsx
  - app/(dashboard)/inventory/[id]/page.tsx
  - components/assets/asset-columns.tsx
  - components/assets/asset-view-modal.tsx
  - components/assets/asset-detail-client.tsx
  - components/assets/asset-detail-info.tsx
  - app/api/exports/inventory/route.ts
autonomous: true
requirements: [QUICK-260317-MHW]

must_haves:
  truths:
    - "inventory_items table has a holder_id column (nullable FK to user_profiles)"
    - "When a transfer is accepted, holder_id on the item is set to the receiver"
    - "General users see assets where they are the holder OR have pending transfers to them"
    - "Asset table shows holder name under location in small muted text"
    - "View modal and detail page show Current Holder card section with name, division, location"
    - "When holder is NULL, display shows dash or Unassigned"
    - "Export includes Holder column"
  artifacts:
    - path: "supabase/migrations/00028_inventory_items_holder_id.sql"
      provides: "holder_id column + FK constraint"
      contains: "holder_id"
    - path: "lib/types/database.ts"
      provides: "holder_id field on InventoryItem interface"
      contains: "holder_id"
    - path: "app/actions/asset-actions.ts"
      provides: "acceptTransfer sets holder_id on inventory_items"
      contains: "holder_id"
  key_links:
    - from: "app/actions/asset-actions.ts (acceptTransfer)"
      to: "supabase inventory_items.holder_id"
      via: "update({holder_id: profile.id, location_id: ...})"
      pattern: "holder_id.*profile\\.id"
    - from: "app/(dashboard)/inventory/page.tsx"
      to: "supabase inventory_items query"
      via: "holder_id filter for general users"
      pattern: "holder_id\\.eq"
    - from: "components/assets/asset-columns.tsx"
      to: "holder relation data"
      via: "holder_name display under location"
      pattern: "holder_name"
---

<objective>
Add holder_id column to inventory_items for asset custody tracking.

Purpose: Track who physically holds an asset. Currently the system only tracks asset location and uses pending transfer receiver as a proxy for custody. With holder_id, custody is explicit: set when someone accepts a transfer.

Output: DB migration, updated types, backend logic (acceptTransfer sets holder_id), general user filter uses holder_id, table shows holder name, view modal/detail page show Current Holder section, export includes holder.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260317-mhw-add-holder-id-to-inventory-items-for-ass/260317-mhw-CONTEXT.md

<interfaces>
<!-- Key types and contracts the executor needs -->

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
```

From components/assets/asset-columns.tsx:
```typescript
export interface PendingTransfer {
  id: string;
  to_location: { name: string } | null;
  receiver_id: string | null;
  receiver_name: string | null;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: DB migration + types + backend logic (holder_id column, acceptTransfer sets it, general user filter)</name>
  <files>
    supabase/migrations/00028_inventory_items_holder_id.sql,
    lib/types/database.ts,
    app/actions/asset-actions.ts,
    app/(dashboard)/inventory/page.tsx,
    app/(dashboard)/inventory/[id]/page.tsx,
    app/api/exports/inventory/route.ts
  </files>
  <action>
    **1. Create migration `supabase/migrations/00028_inventory_items_holder_id.sql`:**
    ```sql
    ALTER TABLE public.inventory_items
      ADD COLUMN IF NOT EXISTS holder_id uuid REFERENCES public.user_profiles(id);
    ```
    That's it -- nullable FK, no default. Per user decision: holder starts NULL, only set on transfer acceptance.

    **2. Update `lib/types/database.ts`:**
    Add `holder_id: string | null;` to the `InventoryItem` interface (after `location_id` line).
    Add holder relation to `InventoryItemWithRelations`:
    ```typescript
    export interface InventoryItemWithRelations extends InventoryItem {
      category: { name: string } | null;
      location: { name: string } | null;
      company: { name: string } | null;
      holder: { full_name: string; division: { name: string } | null; location: { name: string } | null } | null;
    }
    ```

    **3. Update `app/actions/asset-actions.ts` -- `acceptTransfer` action:**
    In the "Move asset to destination location" section (~line 366), update the `.update()` call to also set `holder_id`:
    ```typescript
    const { error: itemError } = await supabase
      .from('inventory_items')
      .update({ location_id: movement.to_location_id, holder_id: profile.id })
      .eq('id', movement.item_id);
    ```
    The receiver (who calls acceptTransfer) becomes the holder. `profile.id` is the current user (the receiver).

    Also update the `createTransfer` action: for location-only transfers (no receiver_id), the `.update()` on inventory_items (~line 308) should NOT change holder_id (leave it as-is). This is already correct behavior since location-only transfers don't assign a person.

    **4. Update `app/(dashboard)/inventory/page.tsx` -- general user filter:**
    Replace the location-based general user filter logic (lines 68-83) with holder_id-based filtering:
    ```typescript
    if (isGeneralUser) {
      if (inTransitAssetIds.length > 0) {
        assetsQuery = assetsQuery.or(
          `holder_id.eq.${profile.id},id.in.(${inTransitAssetIds.join(',')})`
        );
      } else {
        assetsQuery = assetsQuery.eq('holder_id', profile.id);
      }
    }
    ```
    This replaces the old `location_id.eq.{profile.location_id}` approach. General users now see assets they hold + assets being transferred to them.

    **5. Update inventory list query to join holder profile:**
    In `app/(dashboard)/inventory/page.tsx`, update the main assets query (~line 62) to include holder data:
    ```typescript
    .select('*, category:categories(name), location:locations(name), holder:user_profiles!holder_id(full_name)')
    ```
    This gives us holder_name for the table column. We only need full_name for the table; the detail view fetches more detail separately.

    **6. Update `app/(dashboard)/inventory/[id]/page.tsx` -- detail page query:**
    Update the asset select to include holder with division and location:
    ```typescript
    .select('*, category:categories(name), location:locations(name), company:companies(name), holder:user_profiles!holder_id(full_name, division:divisions(name), location:locations(name))')
    ```

    **7. Update `app/api/exports/inventory/route.ts`:**
    - Update the select query to include holder: `.select('*, category:categories(name), location:locations(name), holder:user_profiles!holder_id(full_name)')`
    - Add a "Holder" column to the workbook columns array: `{ header: 'Holder', key: 'holder_name', width: 25 }`
    - In the row loop, extract holder name: `const holder = item.holder as { full_name: string } | null;` and add `holder_name: holder?.full_name ?? ''` to the row data.
  </action>
  <verify>
    npm run build 2>&1 | tail -20
  </verify>
  <done>
    - Migration file exists with holder_id column addition
    - InventoryItem type includes holder_id
    - InventoryItemWithRelations includes holder relation
    - acceptTransfer sets holder_id to profile.id on the inventory_items row
    - General user filter uses holder_id.eq instead of location_id.eq
    - Export includes Holder column
    - Build passes
  </done>
</task>

<task type="auto">
  <name>Task 2: UI updates -- table column holder display + view modal/detail page Current Holder section</name>
  <files>
    components/assets/asset-columns.tsx,
    components/assets/asset-view-modal.tsx,
    components/assets/asset-detail-client.tsx,
    components/assets/asset-detail-info.tsx
  </files>
  <action>
    **1. Update `components/assets/asset-columns.tsx` -- location column:**
    In the `location_name` column definition (id: 'location_name', ~line 137), the cell currently shows `receiverName` under the location when in transit. Replace receiver_name with holder_name, but when in transit show the pending receiver name instead:

    Update the cell renderer:
    ```typescript
    cell: ({ row, table }) => {
      const locationName = row.original.location?.name;
      const meta = table.options.meta as AssetTableMeta | undefined;
      const pendingTransfer = meta?.pendingTransfers?.[row.original.id];
      // When in transit, show pending receiver; otherwise show current holder
      const holderName = pendingTransfer?.receiver_name
        ?? (row.original.holder as { full_name: string } | null)?.full_name
        ?? null;

      return (
        <div>
          {locationName ? (
            <span className="whitespace-normal break-words" title={locationName}>
              {locationName}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {holderName && (
            <p className="text-xs text-muted-foreground">{holderName}</p>
          )}
        </div>
      );
    },
    ```
    Per user decision: "When in transit, show the pending receiver name (existing pattern), not the current holder."

    **2. Update `components/assets/asset-view-modal.tsx` -- fetch holder data + display Current Holder section:**
    In the `fetchData` callback, update the asset select query (~line 125) to include holder with division and location:
    ```typescript
    .select('*, category:categories(name), location:locations(name), company:companies(name), holder:user_profiles!holder_id(full_name, division:divisions(name), location:locations(name))')
    ```

    In the modal header area (~line 456, after the subtitle line showing name/category/location), add a "Current Holder" display. If there is a pending transfer, show the pending receiver name instead. If no holder and no pending transfer, show "Unassigned":

    After the existing `<p className="text-sm text-muted-foreground mt-0.5">` block (~line 460), add:
    ```tsx
    {/* Current Holder section */}
    {!pendingTransfer && (
      <div className="mt-3 rounded-md border p-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Current Holder</h4>
        {asset.holder ? (
          <div className="text-sm">
            <p className="font-medium">{asset.holder.full_name}</p>
            {asset.holder.division?.name && (
              <p className="text-muted-foreground text-xs">{asset.holder.division.name}</p>
            )}
            {asset.holder.location?.name && (
              <p className="text-muted-foreground text-xs">{asset.holder.location.name}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Unassigned</p>
        )}
      </div>
    )}
    ```
    When `pendingTransfer` exists, the existing "Transfer in Progress" banner (in asset-detail-client.tsx) already shows the receiver, so we skip the holder section.

    **3. Update `components/assets/asset-detail-client.tsx` -- detail page Current Holder section:**
    In the detail page layout, after the `{pendingTransfer && (...)}` block (~line 134), add the same "Current Holder" card when there is no pending transfer:
    ```tsx
    {!pendingTransfer && (
      <div className="rounded-md border p-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Current Holder</h4>
        {asset.holder ? (
          <div className="text-sm">
            <p className="font-medium">{asset.holder.full_name}</p>
            {asset.holder.division?.name && (
              <p className="text-muted-foreground text-xs">{asset.holder.division.name}</p>
            )}
            {asset.holder.location?.name && (
              <p className="text-muted-foreground text-xs">{asset.holder.location.name}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Unassigned</p>
        )}
      </div>
    )}
    ```

    **4. In `components/assets/asset-detail-info.tsx`:**
    No changes needed to the read-only detail view or the edit form. The holder is only set by transfer acceptance, not by manual edit. The holder display lives in the parent container (detail-client and view-modal).

    **IMPORTANT:** The holder relation joins through `user_profiles!holder_id` which returns `full_name`. The type assertion `row.original.holder as { full_name: string } | null` is needed in the columns file since the Supabase query result doesn't match the full `InventoryItemWithRelations` holder type. In the view modal and detail page, the full `InventoryItemWithRelations` type covers it.
  </action>
  <verify>
    npm run build 2>&1 | tail -20
  </verify>
  <done>
    - Table location column shows holder name (or pending receiver when in transit) as small muted text under location
    - View modal shows "Current Holder" card section with name, division, location when no pending transfer
    - Detail page shows "Current Holder" card section with name, division, location when no pending transfer
    - When holder is NULL and no pending transfer, shows "Unassigned"
    - Build passes with no type errors
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes without errors
2. Migration file exists at `supabase/migrations/00028_inventory_items_holder_id.sql`
3. `grep -r "holder_id" lib/types/database.ts` shows the field in InventoryItem
4. `grep -r "holder_id.*profile" app/actions/asset-actions.ts` confirms acceptTransfer sets holder_id
5. `grep -r "holder_id.eq" app/(dashboard)/inventory/page.tsx` confirms general user filter
6. `grep -r "holder_name\|holder.*full_name" components/assets/` confirms UI display
7. `grep -r "Holder" app/api/exports/inventory/route.ts` confirms export column
</verification>

<success_criteria>
- holder_id nullable UUID column added to inventory_items via migration
- InventoryItem type updated with holder_id field
- InventoryItemWithRelations includes holder relation with full_name, division, location
- acceptTransfer action sets holder_id = profile.id on the asset
- General user filter uses holder_id instead of location_id
- Table shows holder name under location (or pending receiver name when in transit)
- View modal + detail page show "Current Holder" card with name, division, location
- NULL holder shows "Unassigned" or dash
- Export includes Holder column
- Build passes
</success_criteria>

<output>
After completion, create `.planning/quick/260317-mhw-add-holder-id-to-inventory-items-for-ass/260317-mhw-SUMMARY.md`
</output>
