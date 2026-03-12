---
phase: quick-57
plan: 57
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-columns.tsx
  - components/assets/asset-columns.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Requests table shows ID as column 1 (mono text only, no status badge inline) and Status as column 2 (badge only)"
    - "Assets table shows ID as column 1 and Status as column 2 (immediately after ID, before photo)"
    - "Jobs table is unchanged — it already has ID col 1, Status col 2"
    - "Schedules and Templates tables are unchanged — they have no display_id column"
  artifacts:
    - path: "components/requests/request-columns.tsx"
      provides: "Requests table columns with ID and Status separated"
      contains: "display_id column with font-mono only (no RequestStatusBadge inline), separate status column"
    - path: "components/assets/asset-columns.tsx"
      provides: "Assets table columns with Status moved to position 2"
      contains: "display_id column at pos 1, status column at pos 2, then photo, name, category, location"
  key_links:
    - from: "components/requests/request-columns.tsx"
      to: "RequestStatusBadge"
      via: "status column cell render"
      pattern: "RequestStatusBadge.*status"
    - from: "components/assets/asset-columns.tsx"
      to: "AssetStatusBadge"
      via: "status column cell render at position 2"
      pattern: "AssetStatusBadge"
---

<objective>
Separate ID and Status into distinct, consistently-ordered columns across entity tables where they are currently combined or out of order.

Purpose: Consistent column order (ID col 1, Status col 2) improves scannability across all entity list views.
Output: Updated request-columns.tsx and asset-columns.tsx. Jobs already correct. Schedules/Templates have no display_id — no change needed.
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
  <name>Task 1: Fix requests table — split ID and Status into separate columns</name>
  <files>components/requests/request-columns.tsx</files>
  <action>
Currently the `display_id` column cell renders both the ID and a `<RequestStatusBadge>` inline:
```tsx
cell: ({ row }) => (
  <div className="flex items-center gap-2">
    <span className="font-mono text-xs">{row.getValue('display_id')}</span>
    <RequestStatusBadge status={row.original.status} />
  </div>
),
```

Change it to render ONLY the ID (no badge):
```tsx
cell: ({ row }) => (
  <span className="font-mono text-xs">{row.getValue('display_id')}</span>
),
size: 160,
```

Then insert a new `status` column immediately after the `display_id` column (before the `photo` column):
```tsx
{
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => (
    <RequestStatusBadge status={row.original.status} />
  ),
  size: 150,
  enableSorting: false,
},
```

Final column order: display_id → status → photo → title → location → priority → pic → created_at → actions.

The `RequestStatusBadge` import is already present at the top of the file — no new import needed.
  </action>
  <verify>
Grep confirms no `RequestStatusBadge` inside the `display_id` column cell:
```
grep -n "RequestStatusBadge" components/requests/request-columns.tsx
```
Should show the import line and exactly one occurrence inside the new `status` column cell (not inside `display_id` cell). Also confirm a standalone `accessorKey: 'status'` column exists:
```
grep -n "accessorKey: 'status'" components/requests/request-columns.tsx
```
  </verify>
  <done>Requests table has ID-only col 1 (font-mono, no badge) and a separate Status badge col 2. Build passes: `npm run build` exits 0.</done>
</task>

<task type="auto">
  <name>Task 2: Fix assets table — move Status column from position 6 to position 2</name>
  <files>components/assets/asset-columns.tsx</files>
  <action>
Currently `asset-columns.tsx` has this column order: display_id → photo → name → category → location → status → warranty_expiry → actions.

The `status` column object (with `AssetStatusBadge`, `pendingTransfers` lookup, size 140) needs to be moved to position 2 — immediately after `display_id` and before the `photo` column.

The status column renders the `AssetStatusBadge` with `showInTransit` prop — keep this logic exactly as-is, just change its position in the array.

Final column order: display_id → status → photo → name → category → location → warranty_expiry → actions.

Do NOT change any column definitions, sizes, or logic — only reorder the array entries.
  </action>
  <verify>
Verify `status` column appears between `display_id` and `photo` by checking line order in the file:
```
grep -n "accessorKey\|id:" components/assets/asset-columns.tsx | head -20
```
The `status` entry should appear before `photo` in the output. Also confirm build passes: `npm run build`.
  </verify>
  <done>Assets table column array has display_id at index 0, status at index 1, photo at index 2. All other column definitions are unchanged. Build passes.</done>
</task>

</tasks>

<verification>
After both tasks complete, run:
```
npm run build
```
Build must exit 0 with no TypeScript errors. No runtime changes needed — these are column array reorderings and a simple split of combined cell content.
</verification>

<success_criteria>
- Requests table: ID col (font-mono text only) and Status col (badge only) are separate adjacent columns, ID first
- Assets table: Status column is immediately after ID, not after location
- Jobs table: unchanged (already correct)
- Schedules/Templates: unchanged (no display_id column, so no ID/Status ordering issue)
- `npm run build` exits 0
</success_criteria>

<output>
After completion, create `.planning/quick/57-separate-id-and-status-into-first-two-co/57-SUMMARY.md`
</output>
