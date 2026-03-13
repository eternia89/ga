---
phase: quick-66
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/maintenance/template-columns.tsx
  - components/assets/asset-columns.tsx
  - components/maintenance/schedule-columns.tsx
  - components/jobs/job-columns.tsx
  - app/(dashboard)/inventory/new/page.tsx
  - lib/auth/permissions.ts
  - components/sidebar.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Template name cell wraps text instead of truncating (matches all other tables)"
    - "Assets table has a Created column showing dd-MM-yyyy"
    - "Schedules table has a Created column showing dd-MM-yyyy"
    - "Job title cell has no extra text-sm class (font size inherits like other content columns)"
    - "inventory/new breadcrumb first segment reads 'Assets' not 'Inventory'"
    - "PERMISSIONS.ASSETS_VIEW_ALL is used in sidebar.tsx and permissions.ts (renamed from INVENTORY_VIEW_ALL)"
  artifacts:
    - path: "components/maintenance/template-columns.tsx"
      provides: "Fixed name cell: whitespace-normal break-words replaces truncate"
    - path: "components/assets/asset-columns.tsx"
      provides: "New Created column (date only — inventory_items has no created_by column in DB)"
    - path: "components/maintenance/schedule-columns.tsx"
      provides: "New Created column (date only — maintenance_schedules has no created_by column in DB)"
    - path: "components/jobs/job-columns.tsx"
      provides: "Title span without text-sm"
    - path: "app/(dashboard)/inventory/new/page.tsx"
      provides: "Breadcrumb label 'Assets'"
    - path: "lib/auth/permissions.ts"
      provides: "INVENTORY_VIEW_ALL renamed to ASSETS_VIEW_ALL"
    - path: "components/sidebar.tsx"
      provides: "Uses PERMISSIONS.ASSETS_VIEW_ALL"
  key_links:
    - from: "components/sidebar.tsx"
      to: "lib/auth/permissions.ts"
      via: "PERMISSIONS.ASSETS_VIEW_ALL"
      pattern: "ASSETS_VIEW_ALL"
---

<objective>
Fix 6 UI/UX inconsistencies: template name truncation, missing Created columns on assets/schedules tables, rogue text-sm on job title, wrong breadcrumb label, and outdated INVENTORY_VIEW_ALL permission constant name.

Purpose: Align all domain entity tables with the established display patterns (whitespace-normal break-words for name cells, Created column present on all tables) and bring permission constant naming in sync with the "Assets" rename done in phase 09.1.
Output: 7 files updated; all tables have consistent name wrapping and Created columns; breadcrumb and permission constant use "Assets" terminology.

Note on creator line: `inventory_items`, `maintenance_templates`, and `maintenance_schedules` DB tables have no `created_by` column (confirmed in migration 00001). Therefore the Created columns for assets, templates, and schedules show date only — no "by creator" line possible without a migration.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<interfaces>
<!-- Key patterns from existing files -->

Canonical name cell (no truncation) — from request-columns.tsx:
```tsx
<span className="whitespace-normal break-words block" title={title}>{title}</span>
```

template-columns.tsx current name cell (BUG — has `truncate`):
```tsx
className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block text-left"
```
Fix: replace `truncate` with `whitespace-normal break-words`.

job-columns.tsx current title span (BUG — has `text-sm`):
```tsx
<span className="whitespace-normal break-words text-sm" title={title}>
```
Fix: remove `text-sm`.

Canonical date-only Created column (for tables without DB created_by):
```tsx
{
  accessorKey: 'created_at',
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="Created" />
  ),
  cell: ({ row }) => {
    const date = row.getValue('created_at') as string;
    return <span>{format(new Date(date), 'dd-MM-yyyy')}</span>;
  },
  size: 120,
},
```

Permissions constant rename — from lib/auth/permissions.ts:
Current: `INVENTORY_VIEW_ALL: 'inventory:view:all'`
Rename key to: `ASSETS_VIEW_ALL: 'inventory:view:all'`  (runtime value unchanged)
All callsites that use `PERMISSIONS.INVENTORY_VIEW_ALL` must be updated to `PERMISSIONS.ASSETS_VIEW_ALL`.
Callsites (confirmed by grep):
  - lib/auth/permissions.ts lines 60, 72, 90, 112, 137 (role permission arrays + route map)
  - components/sidebar.tsx line 62
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix template name truncation, job title text-sm, and inventory/new breadcrumb</name>
  <files>
    components/maintenance/template-columns.tsx
    components/jobs/job-columns.tsx
    app/(dashboard)/inventory/new/page.tsx
  </files>
  <action>
    **components/maintenance/template-columns.tsx** (line 26):
    Find the button className for the name cell:
      `"font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block text-left"`
    Replace `truncate` with `whitespace-normal break-words`:
      `"font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-normal break-words block text-left"`

    **components/jobs/job-columns.tsx** (line 109):
    Find: `<span className="whitespace-normal break-words text-sm" title={title}>`
    Change to: `<span className="whitespace-normal break-words" title={title}>`

    **app/(dashboard)/inventory/new/page.tsx** (line 61):
    Find: `{ label: 'Inventory', href: '/inventory' }`
    Change to: `{ label: 'Assets', href: '/inventory' }`
  </action>
  <verify>
    `npm run build 2>&1 | grep -E "^.*error TS" | head -20`
    Expected: no TypeScript errors in these three files.
  </verify>
  <done>
    - template-columns.tsx name cell className: contains `whitespace-normal break-words`, no `truncate`
    - job-columns.tsx title span className: no `text-sm`
    - inventory/new/page.tsx breadcrumb: label is 'Assets'
  </done>
</task>

<task type="auto">
  <name>Task 2: Add Created columns to assets and schedules tables + rename INVENTORY_VIEW_ALL</name>
  <files>
    components/assets/asset-columns.tsx
    components/maintenance/schedule-columns.tsx
    lib/auth/permissions.ts
    components/sidebar.tsx
  </files>
  <action>
    **components/assets/asset-columns.tsx:**
    Add a new column definition for `created_at` BEFORE the `actions` column (after the `warranty_expiry` column, around line 161).
    The `inventory_items` table has no `created_by` column so show date only:
    ```tsx
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return <span>{format(new Date(date), 'dd-MM-yyyy')}</span>;
      },
      size: 120,
    },
    ```
    `date-fns` `format` is already imported at the top of the file.

    **components/maintenance/schedule-columns.tsx:**
    Add a new column definition for `created_at` BEFORE the `actions` column (after the `last_completed_at` column, around line 161).
    The `maintenance_schedules` table has no `created_by` column so show date only:
    ```tsx
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return <span>{format(new Date(date), 'dd-MM-yyyy')}</span>;
      },
      size: 120,
    },
    ```
    `date-fns` `format` and `DataTableColumnHeader` are already imported in this file.

    **lib/auth/permissions.ts:**
    Rename the constant key only (keep the string value unchanged):
    Find: `INVENTORY_VIEW_ALL: 'inventory:view:all',`
    Replace with: `ASSETS_VIEW_ALL: 'inventory:view:all',`

    Then update ALL references in the same file from `PERMISSIONS.INVENTORY_VIEW_ALL` to `PERMISSIONS.ASSETS_VIEW_ALL`.
    Also update the route map entry on line 137:
    Find: `'/inventory': PERMISSIONS.INVENTORY_VIEW_ALL,`
    Replace with: `'/inventory': PERMISSIONS.ASSETS_VIEW_ALL,`

    **components/sidebar.tsx:**
    Find: `permission: PERMISSIONS.INVENTORY_VIEW_ALL,`
    Replace with: `permission: PERMISSIONS.ASSETS_VIEW_ALL,`
  </action>
  <verify>
    `npm run build 2>&1 | grep -E "^.*error TS" | head -20`
    Expected: zero TypeScript errors — ASSETS_VIEW_ALL must be recognized as a valid PERMISSIONS key.

    Confirm rename is complete:
    `grep -r "INVENTORY_VIEW_ALL" /Users/melfice/code/ga/components /Users/melfice/code/ga/lib /Users/melfice/code/ga/app 2>/dev/null`
    Expected: no matches (all references updated to ASSETS_VIEW_ALL).
  </verify>
  <done>
    - asset-columns.tsx: has `created_at` column (date only, size 120) before actions column
    - schedule-columns.tsx: has `created_at` column (date only, size 120) before actions column
    - permissions.ts: key is `ASSETS_VIEW_ALL` (not `INVENTORY_VIEW_ALL`)
    - sidebar.tsx: uses `PERMISSIONS.ASSETS_VIEW_ALL`
    - Zero remaining references to `INVENTORY_VIEW_ALL` in app/components/lib directories
  </done>
</task>

</tasks>

<verification>
`npm run build` — zero errors.
`npm run lint` — zero errors.

Grep sanity check: `grep -r "INVENTORY_VIEW_ALL" . --include="*.ts" --include="*.tsx" | grep -v ".planning"` — no results.
</verification>

<success_criteria>
- `npm run build` passes with zero TypeScript errors
- `npm run lint` passes
- template-columns.tsx: name cell uses `whitespace-normal break-words`, no `truncate`
- job-columns.tsx: title span has no `text-sm`
- asset-columns.tsx: `created_at` column present before actions
- schedule-columns.tsx: `created_at` column present before actions
- inventory/new/page.tsx: breadcrumb label is 'Assets'
- permissions.ts: key is `ASSETS_VIEW_ALL`, runtime value still `'inventory:view:all'`
- No remaining `INVENTORY_VIEW_ALL` references in source files
</success_criteria>

<output>
After completion, create `.planning/quick/66-fix-ui-ux-table-inconsistencies-template/66-SUMMARY.md` with:
- Files changed and what was changed in each
- Note: creator line on Created columns not implemented (inventory_items, maintenance_templates, maintenance_schedules have no created_by column in DB schema — would require a migration)
- Build/lint status
</output>
