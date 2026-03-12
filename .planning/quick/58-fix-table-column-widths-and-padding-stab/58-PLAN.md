---
phase: quick-58
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-columns.tsx
  - components/jobs/job-columns.tsx
  - components/assets/asset-columns.tsx
  - components/maintenance/schedule-columns.tsx
autonomous: true
requirements: [QUICK-58]

must_haves:
  truths:
    - "Long titles and names in the grow column wrap to multiple lines instead of truncating"
    - "Location, PIC, and Category column text wraps within its fixed column width"
    - "Column widths do not shift when data values change — layout is stable across all rows"
    - "ID, date, badge, and interval columns remain single-line (no wrapping)"
    - "No text visually overflows or clips into an adjacent column"
  artifacts:
    - path: "components/requests/request-columns.tsx"
      provides: "Request table columns with wrapping title, location, and PIC cells"
    - path: "components/jobs/job-columns.tsx"
      provides: "Job table columns with wrapping title, location, and PIC cells"
    - path: "components/assets/asset-columns.tsx"
      provides: "Asset table columns with wrapping name, category, and location cells"
    - path: "components/maintenance/schedule-columns.tsx"
      provides: "Schedule table columns with wrapping template and asset name cells"
  key_links:
    - from: "components/ui/table.tsx TableCell"
      to: "whitespace-nowrap default class"
      via: "cell className cn()"
      pattern: "whitespace-nowrap"
    - from: "column cell renderer"
      to: "whitespace-normal break-words override"
      via: "span/div className"
      pattern: "whitespace-normal"
---

<objective>
Fix text overflow and truncation in entity table columns so content wraps correctly within its column boundaries.

Purpose: The shadcn `TableCell` component has `whitespace-nowrap` as a default class. All content columns currently use `truncate block` which adds ellipsis but still clips text at one line. Content columns (Title, Name, Template, Location, PIC, Category, Asset) should wrap to multiple lines so no information is hidden. Fixed-size columns already have stable widths via the DataTable's `width/minWidth/maxWidth` inline styles — the column layout is already stable. Only the cell content rendering needs fixing.

Output: Four column definition files updated so text-wrapping content columns use `whitespace-normal break-words` and remove `truncate`. ID, status, date, badge, interval columns keep their single-line display.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<!-- Key architectural facts for executor: -->
<!-- 1. components/ui/table.tsx TableCell has `whitespace-nowrap` as a default Tailwind class -->
<!-- 2. components/data-table/data-table.tsx applies fixed width/minWidth/maxWidth inline styles from column `size` -->
<!--    - Columns with `meta: { grow: true }` get only `minWidth` (they expand to fill space) -->
<!--    - All other columns get `width + minWidth + maxWidth` (locked stable widths) -->
<!-- 3. The table uses `table-fixed` layout, so column widths are respected -->
<!-- 4. To allow text to wrap inside a cell: add `whitespace-normal` to the cell content element -->
<!-- 5. To prevent text from breaking in the middle of a word: add `break-words` -->
<!-- 6. `truncate` = `overflow-hidden + whitespace-nowrap + text-overflow: ellipsis` — removes this for wrapping columns -->
<!-- 7. `max-w-[Npx]` inline on spans inside fixed-size cells is redundant (DataTable already sets maxWidth) — remove these -->
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix requests and jobs table column wrapping</name>
  <files>components/requests/request-columns.tsx, components/jobs/job-columns.tsx</files>
  <action>
    In both files, update cell renderers for content columns to use `whitespace-normal break-words` instead of `truncate block`.

    **request-columns.tsx changes:**

    Title column (accessorKey: 'title', the grow column):
    - Remove: `className="truncate block"` from the `<span>`
    - Add: `className="whitespace-normal break-words block"`
    - Keep `title={title}` tooltip as-is

    Location column (id: 'location_name'):
    - Remove: `className="truncate block max-w-[130px]"` from the `<span>`
    - Add: `className="whitespace-normal break-words"`
    - Keep `title={name}` tooltip as-is
    - Keep the `size: 130` on the column definition (DataTable already locks width)

    PIC column (id: 'assigned_user_name'):
    - Remove: `className="truncate block max-w-[120px]"` from the `<span>`
    - Add: `className="whitespace-normal break-words"`
    - Keep `title={name}` tooltip as-is

    **job-columns.tsx changes:**

    Title column (accessorKey: 'title', the grow column):
    - Remove: `className="truncate block text-sm"` from the `<span>`
    - Add: `className="whitespace-normal break-words text-sm"`
    - Keep `title={title}` tooltip as-is

    Location column (id: 'location_name'):
    - Remove: `className="truncate block max-w-[130px]"` from the `<span>`
    - Add: `className="whitespace-normal break-words"`
    - Keep `title={name}` tooltip as-is

    PIC column (id: 'pic_name'):
    - Remove: `className="truncate block max-w-[120px]"` from the `<span>`
    - Add: `className="whitespace-normal break-words"`
    - Keep `title={name}` tooltip as-is

    Do NOT change: ID column (font-mono text-xs), status columns, priority badge, photo column, created_at column, actions column. These must remain single-line.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - `truncate` class removed from title, location, and PIC spans in both files
    - `whitespace-normal break-words` applied to those same spans
    - Inline `max-w-[...]` removed from location and PIC spans (redundant with DataTable column size)
    - Build passes with no TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix assets and schedules table column wrapping</name>
  <files>components/assets/asset-columns.tsx, components/maintenance/schedule-columns.tsx</files>
  <action>
    **asset-columns.tsx changes:**

    Name column (accessorKey: 'name', the grow column):
    - Remove: `className="truncate block font-medium"` from the `<span>`
    - Add: `className="whitespace-normal break-words font-medium"`
    - Keep `title={name}` tooltip as-is

    Category column (id: 'category_name'):
    - Remove: `className="truncate block max-w-[140px]"` from the `<span>`
    - Add: `className="whitespace-normal break-words"`
    - Keep `title={name}` tooltip as-is

    Location column (id: 'location_name'):
    - Remove: `className="truncate block max-w-[160px]"` from the `<span>`
    - Add: `className="whitespace-normal break-words"`
    - Keep `title={locationName}` tooltip as-is

    Do NOT change: ID column (font-mono text-xs), status column (AssetStatusBadge), photo column, warranty_expiry date column, actions column.

    **schedule-columns.tsx changes:**

    Template name column (id: 'template_name', the grow column):
    - The cell renders a `<button>` element with `className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block text-left"`
    - Remove `truncate` from that className
    - Add `whitespace-normal break-words` to that className
    - Result: `className="font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-normal break-words text-left"`
    - Keep `title={name}` tooltip as-is

    Asset name column (id: 'asset_name'):
    - The cell renders a `<Link>` with `className="max-w-[200px] truncate block hover:underline"`
    - Remove `max-w-[200px]` and `truncate` from the Link className
    - Add `whitespace-normal break-words` to the Link className
    - Result: `className="whitespace-normal break-words hover:underline"`
    - Keep `title={asset.name}` on the Link as-is

    Do NOT change: Interval column (tabular-nums), Type column (badge spans), Status column (ScheduleStatusBadge), Next Due column, Last Completed column, actions column.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - `truncate` class removed from name, category, location spans in asset-columns.tsx
    - `whitespace-normal break-words` applied to those spans
    - Inline `max-w-[...]` removed from category and location spans in assets
    - `truncate` removed from template button and asset Link in schedule-columns.tsx
    - `whitespace-normal break-words` applied to template button and asset Link
    - Inline `max-w-[200px]` removed from asset Link (DataTable's size: 200 already locks width)
    - Build passes with no TypeScript errors
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npm run build` passes with zero TypeScript errors
2. `npm run lint` passes with no new lint errors
3. Verify the following classes do NOT appear in content columns (title/name/location/pic/category/template/asset): `truncate`
4. Verify the following classes DO appear on those same content column spans/buttons/links: `whitespace-normal`
5. Verify the following classes still appear on single-line columns (ID, date cells): `font-mono` on ID spans; no `whitespace-normal` on date spans
</verification>

<success_criteria>
- Content columns (title, name, template, location, PIC, category, asset name) use `whitespace-normal break-words` — text wraps within the column boundary
- No content column uses `truncate` — text is never cut with ellipsis
- Inline `max-w-[...]` removed from fixed-size column spans (redundant with DataTable's `maxWidth` inline style)
- Fixed-size column `size` values unchanged — column layout remains stable
- `npm run build` and `npm run lint` pass clean
</success_criteria>

<output>
After completion, create `.planning/quick/58-fix-table-column-widths-and-padding-stab/58-SUMMARY.md` with:
- What was changed and in which files
- List of columns changed from truncate to wrap behavior
- Any edge cases found
</output>
