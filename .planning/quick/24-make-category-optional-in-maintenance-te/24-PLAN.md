---
phase: quick-24
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/validations/template-schema.ts
  - app/actions/template-actions.ts
  - app/actions/schedule-actions.ts
  - components/maintenance/template-create-form.tsx
  - components/maintenance/template-detail.tsx
  - components/maintenance/template-view-modal.tsx
  - components/maintenance/schedule-form.tsx
autonomous: true
requirements: [QUICK-24]

must_haves:
  truths:
    - "User can create a template without selecting a category"
    - "User can edit an existing template and clear its category"
    - "A general template (no category) can be paired with any asset in the schedule form"
    - "Template list and detail show dash where category would appear when null"
    - "Category-specific templates still enforce category match with assets in schedules"
  artifacts:
    - path: "lib/validations/template-schema.ts"
      provides: "Optional nullable category_id in templateCreateSchema"
      contains: "optional"
    - path: "app/actions/template-actions.ts"
      provides: "Conditional category validation - skip when null"
    - path: "app/actions/schedule-actions.ts"
      provides: "Skip category match when template has no category_id"
    - path: "components/maintenance/schedule-form.tsx"
      provides: "No asset filtering when template has no category"
  key_links:
    - from: "app/actions/schedule-actions.ts"
      to: "template.category_id"
      via: "conditional category match check"
      pattern: "template\\.category_id.*&&.*template\\.category_id !== asset\\.category_id"
    - from: "components/maintenance/schedule-form.tsx"
      to: "selectedTemplate.category_id"
      via: "asset list filtering logic"
      pattern: "selectedTemplate\\?.category_id"
---

<objective>
Make category_id optional in maintenance templates so that templates without a category are "general" and can be paired with any asset.

Purpose: Allow creating general-purpose maintenance checklists not tied to a specific asset category.
Output: Updated schema, server actions, and UI components supporting optional category.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/validations/template-schema.ts
@app/actions/template-actions.ts
@app/actions/schedule-actions.ts
@components/maintenance/template-create-form.tsx
@components/maintenance/template-detail.tsx
@components/maintenance/template-view-modal.tsx
@components/maintenance/schedule-form.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make category_id optional in schema and server actions</name>
  <files>lib/validations/template-schema.ts, app/actions/template-actions.ts, app/actions/schedule-actions.ts</files>
  <action>
1. In `lib/validations/template-schema.ts`: Change `category_id` from `z.string().uuid({ message: 'Category is required' })` to `z.string().uuid().optional().nullable()`. Remove the "required" validation message.

2. In `app/actions/template-actions.ts` — `createTemplate` action:
   - Wrap the category validation block (lines 24-38) in a conditional: only validate category if `parsedInput.category_id` is truthy. When null/undefined, skip the category check entirely.
   - In the insert, use `category_id: parsedInput.category_id ?? null`.

3. In `app/actions/template-actions.ts` — `updateTemplate` action:
   - Same conditional wrapping for the category validation block (lines 91-105). Only validate if `parsedInput.data.category_id` is truthy.
   - In the update, use `category_id: parsedInput.data.category_id ?? null`.

4. In `app/actions/schedule-actions.ts` — `createSchedule` action:
   - Change the category matching validation (line 58) from:
     `if (template.category_id !== asset.category_id)`
     to:
     `if (template.category_id && template.category_id !== asset.category_id)`
   - This allows general templates (null category_id) to pair with any asset, while category-specific templates still enforce the match.
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>category_id is optional/nullable in Zod schema; server actions skip category validation when null; schedule creation allows general templates with any asset</done>
</task>

<task type="auto">
  <name>Task 2: Update UI forms and display for optional category</name>
  <files>components/maintenance/template-create-form.tsx, components/maintenance/template-detail.tsx, components/maintenance/template-view-modal.tsx, components/maintenance/schedule-form.tsx</files>
  <action>
1. In `components/maintenance/template-create-form.tsx`:
   - Remove the red asterisk `<span className="text-destructive">*</span>` from the Category FormLabel (line 127). Category is now optional.
   - Change the default value for `category_id` from `''` to `undefined` (or keep `''` but ensure Combobox can be cleared).
   - Ensure the Combobox allows clearing the selection. If the existing Combobox component does not support clearing, add a "None (General)" option with value `''` at the top of `categoryOptions`, and in onSubmit transform empty string to null/undefined before submission. The simplest approach: prepend `[{ label: 'None (General)', value: '' }]` to categoryOptions and let the empty string pass through — the Zod schema will handle it since `z.string().uuid().optional().nullable()` will reject empty string. Instead, use `.transform()` or handle in the form: if category_id is empty string, set it to `null` before submitting. Add `.or(z.literal(''))` to the schema's category_id and add `.transform(val => val || null)` so empty string becomes null. Specifically, update the Zod field to: `z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val || null)`.

2. In `components/maintenance/template-detail.tsx`:
   - Same change: remove the red asterisk from Category label (line 220).
   - The read-only view already shows `template.category?.name ?? '—'` (line 313) which handles null correctly. No change needed there.
   - The Combobox for edit mode needs to allow clearing. Same approach: prepend `[{ label: 'None (General)', value: '' }]` to categoryOptions.

3. In `components/maintenance/template-view-modal.tsx`:
   - The header subtitle (line 306) already handles null category gracefully with `template.category?.name && ...`. No change needed. Verify it renders cleanly when category is null (should just show item count and created date without category name).

4. In `components/maintenance/schedule-form.tsx`:
   - The `filteredAssets` logic (line 129) already handles this correctly: `selectedTemplate?.category_id ? assets.filter(...) : assets`. When template has no category_id, all assets are shown. No change needed.
   - The `filteredTemplates` logic (line 133) similarly handles null: `selectedAsset?.category_id ? templates.filter(...) : templates`. But this needs adjustment: when an asset has a category, the filtered templates should include BOTH templates matching that category AND general templates (null category_id). Update to: `selectedAssetId && selectedAsset?.category_id ? templates.filter((t) => !t.category_id || t.category_id === selectedAsset.category_id) : templates`.
   - Update the helper text under Template Combobox (line 233-236): the condition `selectedTemplate?.category_id &&` already guards it, so when a general template is selected, no filter text is shown. This is correct.
   - Update `handleTemplateChange` (line 161-168): the check `template?.category_id && selectedAsset?.category_id !== template.category_id` already handles null category_id (won't clear asset if template has no category). Correct as-is.
   - Update `handleAssetChange` (line 170-177): the check `asset?.category_id && selectedTemplate?.category_id !== asset.category_id` — when asset has a category but template is general (null category_id), this would clear the template. Fix: add `&& selectedTemplate?.category_id` to the condition so general templates are not cleared when switching assets: `if (asset?.category_id && selectedTemplate?.category_id && selectedTemplate.category_id !== asset.category_id)`.
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>Category field shows as optional in create/edit forms; general templates show dash in list/detail; schedule form shows all assets for general templates and includes general templates when filtering by asset category</done>
</task>

</tasks>

<verification>
- `npm run build` completes without errors
- `npm run lint` passes
</verification>

<success_criteria>
- Templates can be created and edited without a category (category_id is nullable)
- Server actions skip category validation when category_id is null
- Schedule creation allows pairing a general template with any asset
- Schedule form shows general templates alongside category-matched templates when an asset is selected
- Template list/detail display dash for null category
- Category-specific templates still enforce category match in schedules
</success_criteria>

<output>
After completion, create `.planning/quick/24-make-category-optional-in-maintenance-te/24-SUMMARY.md`
</output>
