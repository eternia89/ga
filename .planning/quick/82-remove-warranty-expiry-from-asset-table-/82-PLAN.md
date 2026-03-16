---
phase: quick-82
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-columns.tsx
autonomous: true
requirements:
  - QUICK-82

must_haves:
  truths:
    - "Warranty Expiry column does NOT appear in the asset inventory table"
    - "All other asset table columns remain intact and functional"
    - "Warranty expiry data remains accessible on asset detail page, edit form, create form, and exports"
  artifacts:
    - path: "components/assets/asset-columns.tsx"
      provides: "Asset table column definitions without warranty_expiry"
      contains: "assetColumns"
  key_links:
    - from: "components/assets/asset-columns.tsx"
      to: "asset table rendering"
      via: "TanStack Table column definitions"
      pattern: "assetColumns"
---

<objective>
Remove the warranty_expiry column from the asset inventory table.

Purpose: The warranty expiry date clutters the table view — it is rarely useful at a glance and is accessible on the detail page.
Output: Updated asset-columns.tsx with the warranty_expiry column definition removed.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-columns.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove warranty_expiry column from asset table columns</name>
  <files>components/assets/asset-columns.tsx</files>
  <action>
Remove the warranty_expiry column definition object from the `assetColumns` array (lines 149-160). This is the object with `accessorKey: 'warranty_expiry'`. Remove only that column definition — do NOT touch any other columns, types, imports, or exports.

Do NOT remove warranty_expiry from:
- The asset detail page
- The asset edit form
- The asset create form
- Timeline entries
- Export routes
- Database schema or types

The `date-fns` format import may still be used by the `created_at` column, so keep it.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30 && echo "---" && grep -c "warranty_expiry" components/assets/asset-columns.tsx; test $? -eq 1 && echo "PASS: warranty_expiry removed from columns" || echo "FAIL: warranty_expiry still present"</automated>
  </verify>
  <done>The warranty_expiry column definition is removed from assetColumns array. TypeScript compiles without errors. All other columns remain unchanged.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes (no type errors)
- `npm run build` succeeds
- `grep "warranty_expiry" components/assets/asset-columns.tsx` returns no matches
- Asset table still renders all other columns: ID, Status, Photo, Name, Category, Location, Created, Actions
</verification>

<success_criteria>
The warranty_expiry column no longer appears in the asset inventory table. All other columns and functionality remain intact. The warranty_expiry field continues to exist in the database, types, detail page, forms, and exports.
</success_criteria>

<output>
After completion, create `.planning/quick/82-remove-warranty-expiry-from-asset-table-/82-SUMMARY.md`
</output>
