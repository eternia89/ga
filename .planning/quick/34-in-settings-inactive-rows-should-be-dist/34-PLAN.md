---
phase: quick-34
plan: 34
type: execute
wave: 1
depends_on: []
files_modified:
  - components/data-table/data-table.tsx
  - components/admin/companies/company-columns.tsx
  - components/admin/companies/company-table.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/divisions/division-table.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/locations/location-table.tsx
  - components/admin/categories/category-columns.tsx
  - components/admin/categories/category-table.tsx
  - components/admin/users/user-columns.tsx
  - components/admin/users/user-table.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Inactive (deactivated) rows in all 5 settings tables have a visually distinct grey background"
    - "Active rows use the default white background — no background class applied"
    - "No Status column exists in any settings table"
    - "The showDeactivated toggle still works — inactive rows appear when enabled, hidden when disabled"
  artifacts:
    - path: "components/data-table/data-table.tsx"
      provides: "getRowClassName prop wired into TableRow className"
    - path: "components/admin/companies/company-columns.tsx"
      provides: "Status column removed"
    - path: "components/admin/divisions/division-columns.tsx"
      provides: "Status column removed"
    - path: "components/admin/locations/location-columns.tsx"
      provides: "Status column removed"
    - path: "components/admin/categories/category-columns.tsx"
      provides: "Status column removed"
    - path: "components/admin/users/user-columns.tsx"
      provides: "Status column removed"
  key_links:
    - from: "company-table.tsx (and other *-table.tsx)"
      to: "DataTable getRowClassName prop"
      via: "passes (row) => row.deleted_at ? 'bg-muted/40' : ''"
    - from: "DataTable"
      to: "TableRow"
      via: "className={getRowClassName?.(row.original)}"
---

<objective>
Replace the Status badge column in all 5 settings tables (Companies, Divisions, Locations, Categories, Users) with row-level background color. Inactive rows get a slight grey background (`bg-muted/40`). Active rows keep default white. The Status column is removed entirely.

Purpose: Cleaner table layout — status is communicated visually through row background rather than a dedicated column, freeing up horizontal space.
Output: Updated DataTable component with getRowClassName support + 10 updated files (5 column files, 5 table files).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add getRowClassName prop to DataTable and remove Status columns from all 5 column files</name>
  <files>
    components/data-table/data-table.tsx,
    components/admin/companies/company-columns.tsx,
    components/admin/divisions/division-columns.tsx,
    components/admin/locations/location-columns.tsx,
    components/admin/categories/category-columns.tsx,
    components/admin/users/user-columns.tsx
  </files>
  <action>
**1. Update `components/data-table/data-table.tsx`:**

Add `getRowClassName` to the `DataTableProps` interface:
```ts
getRowClassName?: (row: TData) => string;
```

Destructure it in the function signature. In the `table.getRowModel().rows.map((row) => ...)` render, apply it to `TableRow`:
```tsx
<TableRow
  key={row.id}
  data-state={row.getIsSelected() && "selected"}
  className={getRowClassName?.(row.original)}
>
```

**2. Remove the `deleted_at` Status column from all 5 column files:**

For each of these files, delete the entire column definition block that has `accessorKey: "deleted_at"` (the Status badge column). Also remove the `Badge` import if it is only used by that column (check: category-columns, company-columns, division-columns, location-columns all import Badge solely for the Status column — remove those imports; user-columns uses Badge for the role badge in the Name cell, so keep that import there).

Files to update:
- `components/admin/companies/company-columns.tsx` — remove Status column + `import { Badge }` line
- `components/admin/divisions/division-columns.tsx` — remove Status column + `import { Badge }` line
- `components/admin/locations/location-columns.tsx` — remove Status column + `import { Badge }` line
- `components/admin/categories/category-columns.tsx` — remove Status column + `import { Badge }` line
- `components/admin/users/user-columns.tsx` — remove Status column only (keep Badge import, used for role badge in Name cell)
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>No TypeScript errors. No Status column ColumnDef with accessorKey "deleted_at" remains in any settings column file. DataTable accepts and applies getRowClassName prop.</done>
</task>

<task type="auto">
  <name>Task 2: Wire getRowClassName in all 5 settings table components</name>
  <files>
    components/admin/companies/company-table.tsx,
    components/admin/divisions/division-table.tsx,
    components/admin/locations/location-table.tsx,
    components/admin/categories/category-table.tsx,
    components/admin/users/user-table.tsx
  </files>
  <action>
In each table component, add `getRowClassName` to the `<DataTable>` call:

```tsx
getRowClassName={(row) => (row.deleted_at ? "bg-muted/40" : "")}
```

The `row` type in each table is the entity type for that table (Company, Division, Location, Category, UserRow). All have a `deleted_at: string | null` field.

Apply to all 5 `<DataTable>` usages:
- `company-table.tsx` — `<DataTable ... getRowClassName={(row) => (row.deleted_at ? "bg-muted/40" : "")} />`
- `division-table.tsx` — same pattern
- `location-table.tsx` — same pattern
- `category-table.tsx` — same pattern
- `user-table.tsx` — same pattern

Do NOT add `getRowClassName` to any non-settings DataTable usage (requests, jobs, assets etc.). This prop is only wired in the 5 admin settings tables.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>All 5 settings table components pass getRowClassName. Build succeeds with no errors. When showDeactivated is toggled on, inactive rows render with bg-muted/40 background; active rows have no extra background class.</done>
</task>

</tasks>

<verification>
After both tasks complete, open the app at `/admin/settings` and toggle "Show Deactivated" on.

Expected:
- Active rows: white/default background
- Deactivated rows: subtle grey background (bg-muted/40)
- No "Status" column header visible in any of the 5 tabs (Companies, Divisions, Locations, Categories, Users)
- Tables still filter correctly with the showDeactivated toggle
</verification>

<success_criteria>
- Zero Status columns in all 5 settings tables
- Inactive rows visually distinct via grey row background
- Active rows unchanged (white/default)
- `npm run build` passes with no errors
- `npm run lint` passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/34-in-settings-inactive-rows-should-be-dist/34-SUMMARY.md` with what was done, files changed, and any decisions made.
</output>
