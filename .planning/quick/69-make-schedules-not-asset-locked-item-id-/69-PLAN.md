---
phase: quick-69
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00024_schedules_nullable_item_id.sql
  - lib/validations/schedule-schema.ts
  - lib/types/maintenance.ts
  - app/actions/schedule-actions.ts
  - components/maintenance/schedule-form.tsx
  - components/maintenance/schedule-detail.tsx
  - components/maintenance/schedule-columns.tsx
  - components/maintenance/schedule-view-modal.tsx
  - app/(dashboard)/maintenance/schedules/[id]/page.tsx
  - supabase/migrations/00010_pm_phase7.sql
  - scripts/seed-ops.ts
autonomous: true
requirements: [QUICK-69]

must_haves:
  truths:
    - "Schedules can be created without an asset when the template has no category (general template)"
    - "Schedules created from a template with a category still require an asset"
    - "When item_id is provided, company_id is auto-set from the asset's company"
    - "When item_id is null, company_id comes from the user's selected company"
    - "Schedule list table shows dash for asset column when no asset linked"
    - "Schedule detail page handles null asset gracefully (no broken links or errors)"
    - "generate_pm_jobs function handles null item_id (uses LEFT JOIN, skips asset name)"
  artifacts:
    - path: "supabase/migrations/00024_schedules_nullable_item_id.sql"
      provides: "ALTER item_id to nullable, update generate_pm_jobs function"
    - path: "lib/validations/schedule-schema.ts"
      provides: "item_id as optional/nullable in create schema"
    - path: "lib/types/maintenance.ts"
      provides: "item_id as string | null in MaintenanceSchedule type"
    - path: "app/actions/schedule-actions.ts"
      provides: "createSchedule handling null item_id with company_id logic"
    - path: "components/maintenance/schedule-form.tsx"
      provides: "Conditional asset field visibility based on template category"
  key_links:
    - from: "components/maintenance/schedule-form.tsx"
      to: "app/actions/schedule-actions.ts"
      via: "createSchedule action"
      pattern: "createSchedule"
    - from: "app/actions/schedule-actions.ts"
      to: "supabase maintenance_schedules"
      via: "insert with nullable item_id"
      pattern: "item_id.*null"
    - from: "supabase/migrations/00024_schedules_nullable_item_id.sql"
      to: "maintenance_schedules.item_id"
      via: "ALTER COLUMN DROP NOT NULL"
      pattern: "DROP NOT NULL"
---

<objective>
Make maintenance schedules not locked to a specific asset (item_id optional). Schedules can be created for routine tasks (e.g., routine cleaning every 30 days) without requiring an asset. When creating from a general-type template (no category), the asset field is hidden. When creating from an asset-specific template (has category), the asset field remains required.

Purpose: Enable non-asset-tied maintenance schedules for routine operational tasks.
Output: Migration, updated schema/types/actions/forms/columns/detail views.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@lib/validations/schedule-schema.ts
@lib/types/maintenance.ts
@app/actions/schedule-actions.ts
@components/maintenance/schedule-form.tsx
@components/maintenance/schedule-detail.tsx
@components/maintenance/schedule-columns.tsx
@components/maintenance/schedule-view-modal.tsx
@app/(dashboard)/maintenance/schedules/[id]/page.tsx
@app/(dashboard)/maintenance/page.tsx
@supabase/migrations/00010_pm_phase7.sql
@scripts/seed-ops.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migration + types + schema + actions (backend)</name>
  <files>
    supabase/migrations/00024_schedules_nullable_item_id.sql,
    lib/types/maintenance.ts,
    lib/validations/schedule-schema.ts,
    app/actions/schedule-actions.ts,
    supabase/migrations/00010_pm_phase7.sql,
    scripts/seed-ops.ts
  </files>
  <action>
1. **Create migration `supabase/migrations/00024_schedules_nullable_item_id.sql`:**
   - `ALTER TABLE public.maintenance_schedules ALTER COLUMN item_id DROP NOT NULL;`
   - Drop and recreate `generate_pm_jobs()` function with `LEFT JOIN inventory_items ii ON ii.id = ms.item_id` instead of the current `JOIN`. Update the job title construction to handle null asset name: `v_schedule.template_name || COALESCE(' - ' || v_schedule.asset_name, '')`. The rest of the function logic stays the same.

2. **Update `lib/types/maintenance.ts`:**
   - Change `MaintenanceSchedule.item_id` from `string` to `string | null`.

3. **Update `lib/validations/schedule-schema.ts`:**
   - Change `scheduleCreateSchema.item_id` from `z.string().uuid(...)` to `z.string().uuid().nullable().optional()`. Keep the field in the schema but make it optional and nullable.

4. **Update `app/actions/schedule-actions.ts` `createSchedule`:**
   - The current logic always fetches an asset and validates it. Refactor to:
     - If `parsedInput.item_id` is provided (not null/undefined): fetch asset, validate status, validate category match, set `company_id` to `asset.company_id`.
     - If `parsedInput.item_id` is null/undefined: skip asset fetch/validation entirely. For `company_id`, use `parsedInput.company_id` if provided (multi-company user), otherwise fall back to `profile.company_id`.
   - Add `company_id` as an optional field to `scheduleCreateSchema`: `z.string().uuid().optional()` (used only when no asset selected).
   - In the insert payload, set `item_id: parsedInput.item_id ?? null`.
   - For `revalidatePath`: only revalidate `/inventory/${parsedInput.item_id}` when item_id is provided.
   - Update `updateSchedule`: the `revalidatePath` for the asset detail page should be conditional on `existing.item_id` being non-null.
   - Update `deactivateSchedule`, `activateSchedule`, `deleteSchedule`: same pattern - only revalidate asset page when `item_id` exists.
   - Update `getSchedules`: the category join `category:inventory_items(category:categories(name))` will return null for schedules without an asset. This is fine, no code change needed there since the nested join already handles null gracefully with Supabase.

5. **Update `scripts/seed-ops.ts`:**
   - Add 2 sample schedules with `item_id: null` using general templates (those with null `category_id`). This demonstrates the non-asset schedule feature. Use the existing company ID constant and pick general templates.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - Migration file creates nullable item_id and updates generate_pm_jobs function
    - MaintenanceSchedule type has item_id: string | null
    - Schedule create schema allows null/optional item_id
    - createSchedule action handles both asset-linked and asset-free schedules
    - company_id derived from asset when item_id present, from user/input when not
    - All schedule actions conditionally revalidate asset paths
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Form + columns + detail + view modal (frontend)</name>
  <files>
    components/maintenance/schedule-form.tsx,
    components/maintenance/schedule-columns.tsx,
    components/maintenance/schedule-detail.tsx,
    components/maintenance/schedule-view-modal.tsx,
    app/(dashboard)/maintenance/schedules/[id]/page.tsx
  </files>
  <action>
1. **Update `components/maintenance/schedule-form.tsx` `ScheduleCreateForm`:**
   - Track whether the selected template has a category: `const templateHasCategory = selectedTemplate?.category_id != null;`
   - When template has NO category (general), hide the Asset field entirely. Set `form.setValue('item_id', null)` when switching to a general template (clear any previously selected asset).
   - When template HAS a category, show and require the Asset field (current behavior).
   - Update the section heading from "Template & Asset" to just "Template" when asset is hidden. Or keep the section heading and just conditionally render the asset FormField.
   - When no asset selected and multi-company user, pass the selected company_id into the form submission: add a hidden field or pass `company_id` alongside the form data. The cleanest approach: add `company_id` to the form's default values and set it from the company selector. Then it flows through to `createSchedule` automatically.
   - Clear asset selection when template changes to a general one (no category).

2. **Update `components/maintenance/schedule-columns.tsx`:**
   - The `asset_name` column cell already handles null asset with a dash (`<span className="text-muted-foreground">--</span>`). Verify this works when `item_id` is null (it should since `row.original.asset` will be null). The `assetId` in the Link href uses `row.original.item_id` -- wrap the entire Link in a null check: if no asset, show dash only (no link).

3. **Update `components/maintenance/schedule-detail.tsx`:**
   - The read-only "Asset" field in the schedule details grid: wrap in a conditional check. If `schedule.item_id` is null, show "No asset (general schedule)" text instead of a link.
   - The auto-pause notice references "the asset" -- add a guard: only show auto-pause notice if schedule has an asset (`schedule.item_id`). Auto-pause for non-asset schedules does not apply.

4. **Update `components/maintenance/schedule-view-modal.tsx`:**
   - In the header section, the line `Asset: {schedule.asset.name}...` is already conditionally rendered with `{schedule.asset?.name && (...)}`. This handles null correctly. Verify no changes needed here.
   - The fetch query uses `asset:inventory_items(name, display_id)` join which will return null for null item_id. The normalization already handles null assetRaw. No changes needed.

5. **Update `app/(dashboard)/maintenance/schedules/[id]/page.tsx`:**
   - The page header shows "Asset:" with a Link to the asset. Wrap in conditional: only show when `schedule.item_id` is not null.
   - The breadcrumb title construction already handles null assetName: `assetName ? ... : templateName`. No change needed.
   - The `revalidatePath` for the asset detail page after actions should be conditional on `schedule.item_id`. But this is in the server page, not actions. The server page does not call revalidatePath. No change needed.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30 && npm run lint 2>&1 | tail -5</automated>
  </verify>
  <done>
    - Asset field hidden in create form when selected template has no category
    - Asset field shown and required when template has a category
    - Schedule table shows dash for asset column when no asset linked
    - Schedule detail page handles null asset gracefully
    - Schedule view modal handles null asset gracefully
    - Schedule detail page does not show broken asset links for assetless schedules
    - TypeScript compiles and lint passes
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes
2. `npm run lint` passes
3. `npm run build` succeeds
</verification>

<success_criteria>
- Migration exists making item_id nullable and updating generate_pm_jobs
- Schedules can be created without an asset when template has no category
- Schedules with asset-specific templates still require an asset
- Table, detail page, and view modal all handle null asset gracefully
- TypeScript compiles, lint passes, build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/69-make-schedules-not-asset-locked-item-id-/69-SUMMARY.md`
</output>
