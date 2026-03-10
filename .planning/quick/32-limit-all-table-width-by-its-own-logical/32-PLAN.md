---
phase: quick-32
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/data-table/data-table.tsx
  - components/admin/categories/category-columns.tsx
  - components/admin/companies/company-columns.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/users/user-columns.tsx
  - components/requests/request-columns.tsx
  - components/jobs/job-columns.tsx
  - components/assets/asset-columns.tsx
  - components/maintenance/template-columns.tsx
  - components/maintenance/schedule-columns.tsx
  - components/audit-trail/audit-trail-columns.tsx
autonomous: true
requirements: [QUICK-32]

must_haves:
  truths:
    - "Each table renders with consistent column widths regardless of the data loaded"
    - "The actions column always appears rightmost at a fixed width"
    - "The second-to-last column (before actions) grows to fill remaining horizontal space"
    - "All other columns are fixed-width and do not change size when data changes"
  artifacts:
    - path: "components/data-table/data-table.tsx"
      provides: "Renders fixed columns with explicit width/minWidth/maxWidth, growing column with only minWidth"
    - path: "components/requests/request-columns.tsx"
      provides: "All columns have explicit size; title column is the growing one (no maxWidth override)"
    - path: "components/jobs/job-columns.tsx"
      provides: "All columns have explicit size; title column is the growing one"
    - path: "components/assets/asset-columns.tsx"
      provides: "All columns have explicit size; name column is the growing one"
  key_links:
    - from: "column definitions (size property)"
      to: "data-table.tsx TableHead/TableCell style"
      via: "header.column.columnDef.size"
      pattern: "column\\.columnDef\\.size"
---

<objective>
Give every table in the app a stable, consistent column layout by assigning explicit widths to all columns and letting only the penultimate column (the main content column) grow to fill remaining space.

Purpose: Tables currently shift column widths depending on row data length, creating a jarring experience as data changes. Pinning all columns except one main content column to fixed widths and letting that column grow ensures visual stability.
Output: All 11 column definition files updated with explicit sizes; DataTable renderer updated to enforce fixed vs. flex-grow rendering.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md

Current situation:
- `DataTable` at `components/data-table/data-table.tsx` already applies `{ width, minWidth, maxWidth }` inline styles when `column.columnDef.size` is defined.
- Columns WITHOUT a `size` fall back to browser default (stretch to fill), causing inconsistent widths.
- Goal: every column gets a `size` (fixed) EXCEPT the "growing" column (penultimate — the main content/name/title column) which gets only a `minWidth` so it can expand to fill leftover space.

Column inventory and planned growing column per table:
| Table | Growing Column | All other columns |
|-------|---------------|-------------------|
| requests | title (currently size:200 — remove maxWidth cap) | all others: fixed |
| jobs | title (currently size:220) | all others: fixed |
| assets | name (currently size:200) | all others: fixed |
| categories | name (no size) | description, status, created_at, select, actions |
| companies | name (no size) | code, email, phone, status, created_at, select, actions |
| divisions | description (no size) | name→fixed, code, company, status, created_at, select, actions |
| locations | address (no size) | name→fixed, company, status, created_at, select, actions |
| users | full_name (no size) | role, division, status, company, last_login, created_at, select, actions |
| templates | name (currently size:260) | category, items, created_at, status, actions |
| schedules | template_name (currently size:200) | asset, interval, type, status, next_due, last_completed, actions |
| audit-trail | entity (currently size:120 — last content col before no-actions) | performed_at, user, action, entity_type |

For the growing column: set `size` as minWidth value only, remove `maxWidth` enforcement in DataTable for that column. Implementation approach: introduce a `meta.grow` column id field OR use a TanStack `columnDef` meta field to mark the growing column, then in DataTable skip setting `maxWidth` for it.

Simplest approach (no new DataTable props): use TanStack column `meta` field. Each column can have `meta: { grow: true }`. In DataTable, apply `{ width: size, minWidth: size }` for grow columns (omit maxWidth), and `{ width: size, minWidth: size, maxWidth: size }` for fixed columns.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update DataTable to support growing column via columnDef meta</name>
  <files>components/data-table/data-table.tsx</files>
  <action>
In the `DataTable` component, the `TableHead` and `TableCell` inline style logic currently applies `{ width, minWidth, maxWidth }` when `size` is defined. Update this logic to check for `column.columnDef.meta?.grow`:

- If `column.columnDef.size` is defined AND `column.columnDef.meta?.grow` is falsy: apply `{ width: size, minWidth: size, maxWidth: size }` (fully fixed)
- If `column.columnDef.size` is defined AND `column.columnDef.meta?.grow` is truthy: apply `{ minWidth: size }` only (column can expand, no cap)
- If no `size` defined: no inline style (existing behavior fallback)

Also add a TypeScript module augmentation for TanStack Table's ColumnMeta so `meta: { grow: true }` is typed. Add at the top of the file (after imports):

```typescript
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    grow?: boolean;
  }
}
```

Apply the same conditional style to BOTH `TableHead` and `TableCell` blocks. The Table element itself should remain `min-w-[600px]` and the wrapper keeps `overflow-x-auto`.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>DataTable renders: fixed columns stay exactly at their specified size, grow columns expand to fill remaining space. No TypeScript errors on ColumnMeta.</done>
</task>

<task type="auto">
  <name>Task 2: Add explicit sizes to all column definitions — mark growing columns</name>
  <files>
    components/admin/categories/category-columns.tsx,
    components/admin/companies/company-columns.tsx,
    components/admin/divisions/division-columns.tsx,
    components/admin/locations/location-columns.tsx,
    components/admin/users/user-columns.tsx,
    components/requests/request-columns.tsx,
    components/jobs/job-columns.tsx,
    components/assets/asset-columns.tsx,
    components/maintenance/template-columns.tsx,
    components/maintenance/schedule-columns.tsx,
    components/audit-trail/audit-trail-columns.tsx
  </files>
  <action>
Update every column definition file so that:
1. Every column has a `size` value (the minimum/fixed width in px)
2. The designated "growing" column additionally has `meta: { grow: true }` so DataTable omits its `maxWidth`
3. The `actions` column remains last and fixed

Specific sizes to add/update per file:

**category-columns.tsx** (growing: `name`)
- select: 40 (already set)
- name: `size: 200, meta: { grow: true }` (no size currently — add)
- description: `size: 280` (currently no size)
- deleted_at (Status): `size: 100` (no size)
- created_at: `size: 110` (no size)
- actions: 120 (already set)

**company-columns.tsx** (growing: `name`)
- select: 40 (already set)
- name: `size: 200, meta: { grow: true }` (no size)
- code: `size: 90` (no size)
- email: `size: 180` (no size)
- phone: `size: 130` (no size)
- deleted_at (Status): `size: 100` (no size)
- created_at: `size: 110` (no size)
- actions: 120 (already set)

**division-columns.tsx** (growing: `description`)
- select: 40 (already set)
- name: `size: 180` (no size — fixed)
- code: `size: 90` (no size)
- company_name: `size: 160` (no size)
- description: `size: 220, meta: { grow: true }` (no size)
- deleted_at (Status): `size: 100` (no size)
- created_at: `size: 110` (no size)
- actions: 120 (already set)

**location-columns.tsx** (growing: `address`)
- select: 40 (already set)
- name: `size: 180` (no size — fixed)
- address: `size: 240, meta: { grow: true }` (no size)
- company_name: `size: 160` (no size)
- deleted_at (Status): `size: 100` (no size)
- created_at: `size: 110` (no size)
- actions: 120 (already set)

**user-columns.tsx** (growing: `full_name` — the name+email cell)
- select: 40 (already set)
- full_name: `size: 220, meta: { grow: true }` (no size currently)
- role: `size: 150` (no size)
- division: `size: 150` (no size)
- deleted_at (Status): `size: 100` (no size)
- company_id (hidden): keep as-is (no size needed, hidden)
- company_name: `size: 160` (no size)
- last_sign_in_at: `size: 120` (no size)
- created_at: `size: 110` (no size)
- actions: keep (no size — add `size: 80`)

**request-columns.tsx** (growing: `title`)
- display_id: 200 (already set — keep)
- photo: 50 (already set — keep)
- title: currently `size: 200` — change to `size: 200, meta: { grow: true }` (remove hard maxWidth from the truncate div too, change `max-w-[200px]` to just `truncate block`)
- location_name: 130 (already set — keep)
- priority: 90 (already set — keep)
- assigned_user_name: 120 (already set — keep)
- created_at: 100 (already set — keep)
- actions: 80 (already set — keep)

**job-columns.tsx** (growing: `title`)
- display_id: 200 (already set — keep)
- title: currently `size: 220` — change to `size: 220, meta: { grow: true }` (the `max-w-[220px]` div wrapper: change to no max-w constraint, just `space-y-0.5`)
- pic_name: 120 (already set — keep)
- priority: 90 (already set — keep)
- linked_request: 130 (already set — keep)
- created_at: 100 (already set — keep)
- actions: 80 (already set — keep)

**asset-columns.tsx** (growing: `name`)
- display_id: 140 (already set — keep)
- name: currently `size: 200` — change to `size: 200, meta: { grow: true }` (remove `max-w-[200px]` from the span, keep `truncate block font-medium`)
- category_name: 140 (already set — keep)
- location_name: 160 (already set — keep)
- status: 140 (already set — keep)
- warranty_expiry: 130 (already set — keep)
- actions: 120 (already set — keep)

**template-columns.tsx** (growing: `name`)
- name: currently `size: 260` — change to `size: 260, meta: { grow: true }` (remove `max-w-[260px]` from the button className, keep `truncate block text-left`)
- category_name: 160 (already set — keep)
- item_count: 80 (already set — keep)
- created_at: 120 (already set — keep)
- is_active (Status): 100 (already set — keep)
- actions: 80 (already set — keep)

**schedule-columns.tsx** (growing: `template_name`)
- template_name: currently `size: 200` — change to `size: 200, meta: { grow: true }` (remove `max-w-[200px]` from button className)
- asset_name: 200 (already set — keep)
- interval_days: 100 (already set — keep)
- interval_type: 100 (already set — keep)
- status: 140 (already set — keep)
- next_due_at: 120 (already set — keep)
- last_completed_at: 140 (already set — keep)
- actions: 80 (already set — keep)

**audit-trail-columns.tsx** (growing: `entity` — the last content col, no actions column)
The audit trail has no actions column. The "entity" column is last and should grow.
- performed_at: 165 (already set — keep)
- user: 160 (already set — keep)
- action: 120 (already set — keep)
- entity_type: 110 (already set — keep)
- entity: currently `size: 120` — change to `size: 120, meta: { grow: true }` (remove `max-w` from any truncate spans)

For all growing columns: remove `max-w-[Npx]` Tailwind classes from the cell content wrapper (the DataTable will handle width, not the inner element). Keep `truncate block` for text overflow safety.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -30</automated>
  </verify>
  <done>All 11 column files have explicit sizes on every column. Growing columns have `meta: { grow: true }`. Build passes with no TypeScript errors. Tables load with stable column widths that do not shift when data length varies.</done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npm run build` passes cleanly (no TS errors, no lint errors)
2. Spot-check 3 tables visually: requests list, jobs list, assets list — column widths stay stable when browsing pages with different data volumes
3. The "View" / "Edit" actions column is rightmost and fixed width on all tables
4. The main content column (title/name/description) expands when the browser window is wide
</verification>

<success_criteria>
- `npm run build` exits 0
- Every column definition file has `size` on every column
- Growing columns (one per table) have `meta: { grow: true }` and no hardcoded max-width in their cell content
- DataTable applies `{ width, minWidth, maxWidth }` for fixed columns and `{ minWidth }` for grow columns
- Actions column is always rightmost and fixed
</success_criteria>

<output>
No SUMMARY file needed for quick tasks.
</output>
