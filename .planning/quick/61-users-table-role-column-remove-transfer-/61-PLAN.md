---
phase: quick-61
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/admin/users/user-columns.tsx
  - components/assets/asset-columns.tsx
  - components/sidebar.tsx
  - app/(dashboard)/inventory/page.tsx
  - app/(dashboard)/inventory/[id]/page.tsx
  - app/(dashboard)/inventory/[id]/error.tsx
  - components/assets/asset-transfer-dialog.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Users settings table shows a dedicated Role column separate from the Name column"
    - "Asset table rows show only View and Change Status buttons — no Transfer button"
    - "Sidebar section header and page heading say 'Assets' instead of 'Inventory'"
    - "Transfer dialog shows two mode tabs: transfer-to-user and transfer-to-location"
    - "Transfer dialog no-users state shows a helpful message rather than an empty combobox"
  artifacts:
    - path: "components/admin/users/user-columns.tsx"
      provides: "Role column added as separate column"
    - path: "components/assets/asset-columns.tsx"
      provides: "Transfer button removed from row actions"
    - path: "components/sidebar.tsx"
      provides: "Inventory section title renamed to Assets"
    - path: "components/assets/asset-transfer-dialog.tsx"
      provides: "Two-mode transfer: user-receiver or location-only"
  key_links:
    - from: "components/admin/users/user-columns.tsx"
      to: "UserRow.role"
      via: "new dedicated Role column cell using roleDisplay map"
      pattern: "accessorKey.*role"
    - from: "components/assets/asset-transfer-dialog.tsx"
      to: "createTransfer action"
      via: "mode-aware submit: user mode passes receiver_id + to_location_id; location mode passes only to_location_id"
      pattern: "createTransfer"
---

<objective>
Five targeted UI improvements: add Role column to users table, remove Transfer button from asset table rows, rename Inventory section to Assets, fix transfer "no users found" state, and add two-mode transfer dialog (user vs location).

Purpose: Cleaner table layouts, consistent naming, and a more flexible asset transfer flow that works even when no GA users are available.
Output: Updated user-columns.tsx, asset-columns.tsx, sidebar.tsx, inventory pages, and asset-transfer-dialog.tsx.
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
  <name>Task 1: Users table role column, remove Transfer row button, rename Inventory to Assets</name>
  <files>
    components/admin/users/user-columns.tsx,
    components/assets/asset-columns.tsx,
    components/sidebar.tsx,
    app/(dashboard)/inventory/page.tsx,
    app/(dashboard)/inventory/[id]/page.tsx,
    app/(dashboard)/inventory/[id]/error.tsx
  </files>
  <action>
**A. Users table: extract Role into its own column**

In `components/admin/users/user-columns.tsx`:
- Remove the `<Badge>` role display from inside the `full_name` cell. The Name cell should render only `<span className="font-medium">{name}</span>` and `<span className="block text-xs text-muted-foreground">{email}</span>` — no badge.
- Add a new column after `full_name` with `accessorKey: 'role'`, header "Role", that renders the role badge:
  ```tsx
  <Badge variant="secondary" className={roleColors[value] || roleColors.general_user}>
    {roleDisplay[value] || value}
  </Badge>
  ```
  Size it at 160. Keep `roleColors` and `roleDisplay` maps exactly as they are.
- Column order: select → full_name → role → location → company_id (hidden) → company_name → actions.

**B. Asset table: remove Transfer button from row actions**

In `components/assets/asset-columns.tsx`:
- Remove the `canTransfer` computed variable and the Transfer `<Button>` block from the actions cell.
- Keep only the "View" and "Change Status" buttons.
- The `onTransfer` meta prop can remain typed on `AssetTableMeta` (it is still used by the view modal path) but is no longer rendered in columns. Actually, it is only used by `AssetTable` via `meta`, which is fine to leave. Simply remove the Transfer button from the cell JSX.
- Adjust `size` of the actions column from 220 to 160 to match the narrower button set.

**C. Rename Inventory to Assets in UI labels**

In `components/sidebar.tsx`:
- Change the section title from `'Inventory'` to `'Assets'` (line ~57: `title: 'Inventory'`).
- Keep the href `/inventory` unchanged (URL path stays the same).

In `app/(dashboard)/inventory/page.tsx`:
- Change `<h1>` text from `"Inventory"` to `"Assets"`.
- Change breadcrumb label from `{ label: 'Inventory' }` to `{ label: 'Assets' }`.
- Change the `<p>` subtitle from `"View and manage all company assets"` to `"View and manage all assets"` (already correct conceptually, minor tweak).
- Change `ExportButton exportUrl` from `"/api/exports/inventory"` — leave this unchanged (it's a backend route, not a label).

In `app/(dashboard)/inventory/[id]/page.tsx`:
- Change breadcrumb from `{ label: 'Inventory', href: '/inventory' }` to `{ label: 'Assets', href: '/inventory' }`.

In `app/(dashboard)/inventory/[id]/error.tsx`:
- Change `"Back to Inventory"` link text to `"Back to Assets"`.
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>
    - Users settings table has a standalone Role column showing colored badges
    - Asset table rows show only View and Change Status (no Transfer button)
    - Sidebar section header reads "Assets", page h1 reads "Assets", breadcrumbs read "Assets"
    - Build passes with no TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Two-mode transfer dialog (user vs location) + fix no-users-found state</name>
  <files>
    components/assets/asset-transfer-dialog.tsx
  </files>
  <action>
Redesign `AssetTransferDialog` to support two modes: **User Transfer** (transfer to a GA user, receiver's location auto-derived) and **Location Transfer** (move asset to a specific location directly, no receiver required).

**Mode toggle**: Add a `mode` state defaulting to `'user'`. Render two toggle buttons at the top of the dialog using shadcn `<Button>` variants — active mode uses `variant="default"`, inactive uses `variant="outline"`:
```
[Transfer to User]  [Move to Location]
```

**User Transfer mode** (existing behavior, cleaned up):
- Shows Receiver combobox (GA users excluding current user).
- Auto-derives destination location from selected user's `location_id`.
- Shows warning if selected receiver has no location.
- Submit requires: receiverId + resolvedLocationId + photos.length > 0.
- On submit: calls `createTransfer` with `{ asset_id, to_location_id: resolvedLocationId, receiver_id: receiverId, notes }`.

**No users found fix**: When `userOptions` is empty (after filtering out current user), show an `<InlineFeedback type="error">` inside the Receiver section explaining "No eligible users found in this company. Use 'Move to Location' instead." — do NOT show an empty combobox.

**Location Transfer mode** (new):
- Hides Receiver combobox entirely.
- Shows a Location Combobox using `locationNames` — convert `locationNames: Record<string, string>` into options array: `Object.entries(locationNames).map(([value, label]) => ({ value, label }))`.
- Add `toLocationId` state for this mode.
- Notes field remains (optional in both modes).
- Photos field remains required in both modes.
- Submit requires: toLocationId + photos.length > 0.
- On submit: calls `createTransfer` with `{ asset_id, to_location_id: toLocationId, receiver_id: undefined, notes }` — no receiver.

**Reset on mode switch**: When user switches mode, clear the other mode's selection state (receiverId when switching to location, toLocationId when switching to user).

**Reset on dialog open**: `useEffect` on `open` already resets; extend to reset both `receiverId` and `toLocationId` and reset `mode` to `'user'`.

**Dialog title**: Keep "Transfer Asset" as title. Add a subtitle below the title showing the asset's current location.

**canSubmit logic**:
```ts
const canSubmit = mode === 'user'
  ? receiverId !== '' && resolvedLocationId !== '' && photos.length > 0
  : toLocationId !== '' && photos.length > 0;
```

**Submit button label**:
- User mode: "Initiate Transfer"
- Location mode: "Move Asset"

Keep all existing photo upload, notes, and feedback patterns unchanged.
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>
    - Transfer dialog shows two mode toggle buttons at top
    - User mode: works as before, shows helpful message when no users available
    - Location mode: shows location combobox, allows transfer to location without a receiver
    - Switching modes clears the other mode's selection
    - Build passes with no TypeScript errors
  </done>
</task>

</tasks>

<verification>
After both tasks: `npm run build` passes cleanly.
- Visit `/admin/settings?tab=users` — Role column visible as separate column with colored badges.
- Visit `/inventory` — page heading reads "Assets", sidebar section reads "Assets".
- Asset table row shows View and Change Status only — no Transfer button.
- Click Transfer from view modal sticky bar — dialog opens with two mode toggle buttons at top.
- Switching to "Move to Location" shows location combobox instead of user combobox.
</verification>

<success_criteria>
- Users table: Role is a standalone column, not embedded in Name cell
- Asset rows: Only View + Change Status buttons (Transfer removed)
- All "Inventory" UI labels updated to "Assets" (sidebar, page heading, breadcrumbs, error page)
- Transfer dialog: two modes (user and location), no-users-found handled gracefully
- Build passes with no TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/61-users-table-role-column-remove-transfer-/61-SUMMARY.md`
</output>
