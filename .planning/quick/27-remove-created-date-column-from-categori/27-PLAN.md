---
phase: quick-27
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/admin/categories/category-columns.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/companies/company-columns.tsx
autonomous: true
requirements: [QUICK-27]

must_haves:
  truths:
    - "Categories table (both asset and request tabs) shows no Created column"
    - "Divisions table shows no Created column"
    - "Locations table shows no Created column"
    - "Companies table shows no Created column"
  artifacts:
    - path: "components/admin/categories/category-columns.tsx"
      provides: "Category columns without created_at"
    - path: "components/admin/divisions/division-columns.tsx"
      provides: "Division columns without created_at"
    - path: "components/admin/locations/location-columns.tsx"
      provides: "Location columns without created_at"
    - path: "components/admin/companies/company-columns.tsx"
      provides: "Company columns without created_at"
  key_links: []
---

<objective>
Remove the "Created" date column from all four admin settings tables: categories, divisions, locations, and companies. These columns add clutter without providing value in list views.

Purpose: Cleaner admin settings tables with less visual noise.
Output: Four updated column definition files with created_at column removed.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/admin/categories/category-columns.tsx
@components/admin/divisions/division-columns.tsx
@components/admin/locations/location-columns.tsx
@components/admin/companies/company-columns.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove created_at column from all admin settings tables</name>
  <files>
    components/admin/categories/category-columns.tsx
    components/admin/divisions/division-columns.tsx
    components/admin/locations/location-columns.tsx
    components/admin/companies/company-columns.tsx
  </files>
  <action>
In each of the four column definition files, remove the entire `created_at` column object (the block with `accessorKey: "created_at"` including its header and cell renderer). Also remove the `import { format } from "date-fns"` import since it is only used by the created_at column cell in each file. Keep all other columns (select, name, description/code/address/etc, status, actions) untouched.

Files and their created_at column line ranges:
- category-columns.tsx: lines 68-76 (column), line 4 (format import)
- division-columns.tsx: lines 83-91 (column), line 4 (format import)
- location-columns.tsx: lines 78-86 (column), line 4 (format import)
- company-columns.tsx: lines 68-76 (column), line 4 (format import)
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30 && grep -rn "created_at" components/admin/categories/category-columns.tsx components/admin/divisions/division-columns.tsx components/admin/locations/location-columns.tsx components/admin/companies/company-columns.tsx; echo "Exit: $?"</automated>
  </verify>
  <done>No created_at column definition exists in any of the four admin column files. No TypeScript errors. No unused date-fns import.</done>
</task>

</tasks>

<verification>
- `grep -rn "created_at" components/admin/{categories,divisions,locations,companies}/*-columns.tsx` returns no matches
- `grep -rn "date-fns" components/admin/{categories,divisions,locations,companies}/*-columns.tsx` returns no matches
- `npx tsc --noEmit` passes with no errors
- `npm run build` succeeds
</verification>

<success_criteria>
All four admin settings tables (categories, divisions, locations, companies) no longer define a "Created" column. No unused imports remain. Build passes.
</success_criteria>

<output>
After completion, create `.planning/quick/27-remove-created-date-column-from-categori/27-SUMMARY.md`
</output>
