---
phase: quick
plan: 260317-bnu
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-transfer-dialog.tsx
  - app/(dashboard)/inventory/page.tsx
  - components/assets/asset-table.tsx
autonomous: true
requirements: [QUICK-FIX-TRANSFER-COMPANY-SCOPE]

must_haves:
  truths:
    - "Transfer dialog user dropdown only shows users from the same company as the selected asset"
    - "Transfer dialog location dropdown only shows locations from the same company as the selected asset"
    - "Multi-company users see correct company-scoped users/locations per asset when transferring different assets"
  artifacts:
    - path: "components/assets/asset-transfer-dialog.tsx"
      provides: "GAUserWithLocation type with optional company_id field"
      contains: "company_id"
    - path: "app/(dashboard)/inventory/page.tsx"
      provides: "User and location queries include company_id in select"
      contains: "company_id"
    - path: "components/assets/asset-table.tsx"
      provides: "Filters gaUsers and locations by transferAsset.company_id before passing to dialog"
      contains: "transferAsset.company_id"
  key_links:
    - from: "app/(dashboard)/inventory/page.tsx"
      to: "components/assets/asset-table.tsx"
      via: "gaUsers and locations props now include company_id"
      pattern: "company_id"
    - from: "components/assets/asset-table.tsx"
      to: "components/assets/asset-transfer-dialog.tsx"
      via: "filters gaUsers/locations by transferAsset.company_id before passing as props"
      pattern: "filter.*company_id.*transferAsset"
---

<objective>
Fix asset transfer dialog on the inventory list page to only show users and locations from the same company as the asset being transferred.

Purpose: The `createTransfer` action enforces same-company transfers, but the list page fetches users/locations across ALL accessible companies. This causes users to see receiver options that will fail validation. The detail page and view modal already do this correctly using `asset.company_id`.

Output: Transfer dialog shows only company-matched users and locations when opened from table row actions.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-transfer-dialog.tsx
@app/(dashboard)/inventory/page.tsx
@components/assets/asset-table.tsx

<interfaces>
<!-- Current types and contracts -->

From components/assets/asset-transfer-dialog.tsx:
```typescript
export interface GAUserWithLocation {
  id: string;
  name: string;
  location_id: string | null;
}
// Currently has NO company_id field
```

From components/assets/asset-table.tsx:
```typescript
interface AssetTableProps {
  locations: { id: string; name: string }[];
  gaUsers: GAUserWithLocation[];
  // Currently passes gaUsers and locations unfiltered to AssetTransferDialog
}
```

From lib/types/database.ts:
```typescript
export interface InventoryItem {
  id: string;
  company_id: string;  // <-- already available on transferAsset
  // ...
}
```

From app/(dashboard)/inventory/page.tsx:
```typescript
// Line 89-94: locations query selects 'id, name' -- no company_id
// Line 134: gaUsers query selects 'id, full_name, location_id' -- no company_id
// Both use .in('company_id', allAccessibleCompanyIds) -- fetches ALL companies
```

Correct pattern (from asset-view-modal.tsx lines 220, 227):
```typescript
// Locations: .eq('company_id', companyId) where companyId = fetchedAsset.company_id
// GA users:  .eq('company_id', companyId) where companyId = fetchedAsset.company_id
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add company_id to user/location data and types</name>
  <files>components/assets/asset-transfer-dialog.tsx, app/(dashboard)/inventory/page.tsx, components/assets/asset-table.tsx</files>
  <action>
1. In `components/assets/asset-transfer-dialog.tsx`, add optional `company_id` to the `GAUserWithLocation` interface:
   ```typescript
   export interface GAUserWithLocation {
     id: string;
     name: string;
     location_id: string | null;
     company_id?: string;
   }
   ```
   No other changes to this file -- the dialog itself does not need to filter; it receives pre-filtered data.

2. In `app/(dashboard)/inventory/page.tsx`:
   - Line 134: Add `company_id` to the gaUsers query select: change `'id, full_name, location_id'` to `'id, full_name, location_id, company_id'`
   - Line 140-144: Include `company_id` in the mapped gaUsers array:
     ```typescript
     const gaUsers = (gaUsersData ?? []).map((u) => ({
       id: u.id,
       name: u.full_name,
       location_id: u.location_id,
       company_id: u.company_id,
     }));
     ```
   - Line 89-94: Add `company_id` to the locations query select: change `'id, name'` to `'id, name, company_id'`

3. In `components/assets/asset-table.tsx`:
   - Update the `AssetTableProps` locations type from `{ id: string; name: string }[]` to `{ id: string; name: string; company_id?: string }[]`
   - Filter `gaUsers` by `transferAsset.company_id` before passing to `AssetTransferDialog`. Inside the `{transferAsset && (...)}` block, compute filtered lists:
     ```typescript
     const filteredGaUsers = gaUsers.filter(u => u.company_id === transferAsset.company_id);
     const filteredLocations = locations.filter(l => l.company_id === transferAsset.company_id);
     const filteredLocationNames = Object.fromEntries(
       filteredLocations.map(l => [l.id, l.name])
     );
     ```
   - Pass `filteredGaUsers` instead of `gaUsers` to `AssetTransferDialog`'s `gaUsers` prop
   - Pass `filteredLocationNames` instead of `locationNames` to `AssetTransferDialog`'s `locationNames` prop
   - Move the existing `locationNames` useMemo ABOVE the transfer dialog block (it is already above, so keep it for filter bar usage) and compute `filteredLocationNames` separately inside the conditional render block

Note: The `locations` prop is also used by `AssetFilters` which should still show ALL locations for filtering. Only the transfer dialog needs company-scoped data. So keep the unfiltered `locations` for `AssetFilters`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - GAUserWithLocation type includes optional company_id field
    - Inventory page query includes company_id in both gaUsers and locations selects
    - AssetTable filters gaUsers and locations by transferAsset.company_id before passing to transfer dialog
    - AssetFilters still receives unfiltered locations for the filter dropdown
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` completes successfully
3. Manual: Open inventory list page with a multi-company user. Click Transfer on an asset from Company A -- dropdown should only show Company A users. Click Transfer on an asset from Company B -- dropdown should only show Company B users.
</verification>

<success_criteria>
- Transfer dialog opened from inventory list only shows users belonging to the same company as the asset
- Transfer dialog opened from inventory list only shows locations belonging to the same company as the asset
- Filter dropdowns on the inventory list page still show all locations across accessible companies
- No TypeScript errors, build passes
</success_criteria>

<output>
After completion, create `.planning/quick/260317-bnu-fix-asset-transfer-to-only-show-users-fr/260317-bnu-SUMMARY.md`
</output>
