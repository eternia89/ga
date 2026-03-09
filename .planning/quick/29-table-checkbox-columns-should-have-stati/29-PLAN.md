---
phase: quick-29
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/admin/companies/company-columns.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/categories/category-columns.tsx
  - components/admin/users/user-columns.tsx
autonomous: true
requirements: [QUICK-29]

must_haves:
  truths:
    - "All table checkbox/select columns render at exactly 40px width regardless of tab or page"
    - "Switching between admin settings tabs causes no horizontal layout shift in the checkbox column"
  artifacts:
    - path: "components/admin/companies/company-columns.tsx"
      provides: "Select column with fixed size"
      contains: "size: 40"
    - path: "components/admin/divisions/division-columns.tsx"
      provides: "Select column with fixed size"
      contains: "size: 40"
    - path: "components/admin/locations/location-columns.tsx"
      provides: "Select column with fixed size"
      contains: "size: 40"
    - path: "components/admin/categories/category-columns.tsx"
      provides: "Select column with fixed size"
      contains: "size: 40"
    - path: "components/admin/users/user-columns.tsx"
      provides: "Select column with fixed size"
      contains: "size: 40"
  key_links:
    - from: "components/data-table/data-table.tsx"
      to: "columnDef.size"
      via: "inline style width/minWidth/maxWidth"
      pattern: "width.*columnDef\\.size"
---

<objective>
Ensure all table checkbox/select columns have a fixed width (`size: 40`) to prevent UI shifting when switching between tabs or pages in the admin settings area.

Purpose: Eliminate layout jitter caused by checkbox columns without fixed widths.
Output: All select column definitions consistently use `size: 40`.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/data-table/data-table.tsx
@components/admin/companies/company-columns.tsx
@components/admin/divisions/division-columns.tsx
@components/admin/locations/location-columns.tsx
@components/admin/categories/category-columns.tsx
@components/admin/users/user-columns.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Audit and fix all select column definitions to have size: 40</name>
  <files>
    components/admin/companies/company-columns.tsx,
    components/admin/divisions/division-columns.tsx,
    components/admin/locations/location-columns.tsx,
    components/admin/categories/category-columns.tsx,
    components/admin/users/user-columns.tsx
  </files>
  <action>
    1. Grep all column definition files under `components/` for `id: "select"` or `id: 'select'` to find every checkbox column definition.
    2. For each match, verify it has `size: 40` property set. If missing, add `size: 40` to the column definition object.
    3. Based on current audit, these 5 admin column files have select columns: company-columns, division-columns, location-columns, category-columns, user-columns. Non-admin tables (requests, jobs, assets, templates, schedules, audit-trail) do NOT have select columns.
    4. Verify the DataTable component at `components/data-table/data-table.tsx` applies `width`, `minWidth`, and `maxWidth` from `columnDef.size` on both `TableHead` and `TableCell` elements -- it already does this.
    5. If all files already have `size: 40` (which current audit suggests they do), confirm the fix is already in place and no changes are needed.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && grep -A 20 'id:.*select' components/**/*-columns.tsx | grep -c 'size: 40'</automated>
  </verify>
  <done>Every select/checkbox column definition across all table column files has `size: 40` set, and the DataTable component enforces fixed width/minWidth/maxWidth from that size value. Count of `size: 40` occurrences matches count of `id: "select"` occurrences (currently 5).</done>
</task>

</tasks>

<verification>
- Grep for `id: "select"` or `id: 'select'` in all column files returns exactly 5 matches
- Each match has a corresponding `size: 40` within the same column definition block
- `npm run build` passes without errors
</verification>

<success_criteria>
All checkbox/select columns across every table have `size: 40` enforced, preventing layout shift when switching between admin settings tabs or navigating between pages.
</success_criteria>

<output>
After completion, create `.planning/quick/29-table-checkbox-columns-should-have-stati/29-SUMMARY.md`
</output>
