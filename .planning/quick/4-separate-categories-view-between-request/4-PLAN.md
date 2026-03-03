---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(dashboard)/admin/settings/settings-content.tsx
  - app/(dashboard)/admin/settings/page.tsx
  - components/admin/categories/category-table.tsx
  - components/admin/categories/category-columns.tsx
autonomous: true
requirements: [QUICK-4]

must_haves:
  truths:
    - "Admin sees 'Request Categories' and 'Asset Categories' as separate sub-tabs within the Categories settings tab"
    - "Each sub-tab only shows categories of that type (no mixing)"
    - "Creating a category from a sub-tab pre-selects the correct type and hides the type selector"
    - "'Categories' top-level tab still works via URL param ?tab=categories"
  artifacts:
    - path: "app/(dashboard)/admin/settings/settings-content.tsx"
      provides: "Two sub-tabs within Categories tab content — request-categories and asset-categories"
      contains: "requestCategories"
    - path: "components/admin/categories/category-table.tsx"
      provides: "CategoryTable accepts categoryType prop to scope data and pre-fill create dialog type"
    - path: "components/admin/categories/category-columns.tsx"
      provides: "Category columns without the Type column (redundant when scoped by sub-tab)"
  key_links:
    - from: "app/(dashboard)/admin/settings/settings-content.tsx"
      to: "components/admin/categories/category-table.tsx"
      via: "Passes filtered categories array and categoryType prop"
      pattern: "categoryType.*request|asset"
    - from: "components/admin/categories/category-table.tsx"
      to: "components/admin/categories/category-form-dialog.tsx"
      via: "Passes defaultType from categoryType prop"
      pattern: "defaultType.*categoryType"
---

<objective>
Split the single Categories tab in admin settings into two sub-tabs: "Request Categories" and "Asset Categories". The database remains unchanged (single `categories` table with `type` column), but the UI separates them so admins are not confused by seeing request categories mixed with asset categories.

Purpose: Improve admin UX by clearly separating request-type and asset-type categories into distinct views.
Output: Updated settings content with nested tabs for categories, scoped category table and columns.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@app/(dashboard)/admin/settings/settings-content.tsx
@app/(dashboard)/admin/settings/page.tsx
@components/admin/categories/category-table.tsx
@components/admin/categories/category-columns.tsx
@components/admin/categories/category-form-dialog.tsx
@lib/validations/category-schema.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From lib/types/database.ts:
```typescript
export interface Category {
  id: string;
  company_id: string;
  name: string;
  type: "request" | "asset";
  description: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
```

From components/admin/categories/category-form-dialog.tsx:
```typescript
interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  defaultType?: "request" | "asset";
  onSuccess?: () => void;
}
```

The CategoryFormDialog already accepts `defaultType` prop. When creating from a type-scoped sub-tab, pass the type and hide the type selector in the form.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scope CategoryTable and columns by type</name>
  <files>
    components/admin/categories/category-table.tsx
    components/admin/categories/category-columns.tsx
    components/admin/categories/category-form-dialog.tsx
  </files>
  <action>
    1. **category-columns.tsx** — Remove the "type" column from the `categoryColumns` array entirely. When categories are shown in a type-scoped sub-tab, displaying a "Type" badge on every row is redundant. Also remove the "type" filter from the filterable columns in the table (handled in category-table.tsx).

    2. **category-table.tsx** — Add a required `categoryType` prop (`"request" | "asset"`) to `CategoryTableProps`. Changes:
       - Remove the `filterableColumns` prop from DataTable (no more type filter needed since data is pre-scoped).
       - Update the header text from "Categories" to use `categoryType === "request" ? "Request Categories" : "Asset Categories"`.
       - Pass `defaultType={categoryType}` to both CategoryFormDialog instances (create and edit).
       - Update bulk export CSV: remove the "Type" column since it is now implicit.
       - The `data` prop will already be filtered by the parent (settings-content.tsx), so no additional filtering by type is needed inside this component.

    3. **category-form-dialog.tsx** — When `defaultType` is provided AND the dialog is for creating (no `category` prop), hide the Type field entirely (do not render the FormField for "type"). The form still submits `type` via the default value set in `defaultValues`. When editing, type is already disabled — keep that behavior but also hide the Type field since it is redundant (user is already in the correct sub-tab). Show the "Type cannot be changed" note is no longer needed since the field is hidden.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>CategoryTable accepts categoryType prop, columns exclude Type column, form dialog hides type field when defaultType is provided</done>
</task>

<task type="auto">
  <name>Task 2: Add sub-tabs for Request/Asset categories in settings</name>
  <files>
    app/(dashboard)/admin/settings/settings-content.tsx
    app/(dashboard)/admin/settings/page.tsx
  </files>
  <action>
    1. **settings-content.tsx** — Within the "categories" TabsContent, replace the single `<CategoryTable data={categories} />` with nested Tabs component containing two sub-tabs:
       - Use a second `Tabs` component (shadcn) with `defaultValue="request"`. Do NOT sync sub-tab to URL (keep it simple — only top-level tab uses nuqs).
       - Sub-tab triggers: "Request Categories" and "Asset Categories".
       - Each sub-tab content renders `<CategoryTable data={requestCategories} categoryType="request" />` and `<CategoryTable data={assetCategories} categoryType="asset" />` respectively.
       - Derive `requestCategories` and `assetCategories` from the `categories` prop using `.filter()` in the component body (not useMemo needed — this is a simple filter).
       - Update `SettingsContentProps` — no changes needed since `categories` is already typed as `Category[]`.

    2. **page.tsx** — No changes needed. The server component already fetches all categories. The client-side split happens in settings-content.tsx.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Categories tab shows two sub-tabs (Request Categories, Asset Categories). Each sub-tab shows only its type. Creating from a sub-tab pre-selects the correct type with no type selector visible.</done>
</task>

</tasks>

<verification>
1. `npm run build` completes without errors
2. Navigate to /admin/settings?tab=categories — see two sub-tabs: "Request Categories" and "Asset Categories"
3. Click "Request Categories" sub-tab — only request-type categories shown, no Type column
4. Click "Asset Categories" sub-tab — only asset-type categories shown, no Type column
5. Click "Create Category" from Request sub-tab — form shows Name and Description only (no Type selector), submits as type "request"
6. Click "Create Category" from Asset sub-tab — form shows Name and Description only (no Type selector), submits as type "asset"
7. Edit a category — Type field hidden (type is immutable and implicit from the sub-tab)
</verification>

<success_criteria>
- Categories tab has two clearly labeled sub-tabs separating request and asset categories
- No request categories appear in the Asset sub-tab and vice versa
- Type column removed from table (redundant information)
- Create dialog pre-fills and hides type based on active sub-tab
- Build passes with no TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/4-separate-categories-view-between-request/4-SUMMARY.md`
</output>
