---
phase: quick-68
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00023_templates_shared_global.sql
  - app/actions/template-actions.ts
  - app/actions/schedule-actions.ts
  - app/(dashboard)/maintenance/templates/page.tsx
  - app/(dashboard)/maintenance/templates/[id]/page.tsx
  - app/(dashboard)/maintenance/page.tsx
  - components/maintenance/template-create-form.tsx
  - components/maintenance/template-create-dialog.tsx
  - components/maintenance/template-detail.tsx
autonomous: true
requirements: [QUICK-68]

must_haves:
  truths:
    - "All authenticated users can see all active maintenance templates regardless of company"
    - "Only ga_lead and admin roles can create, update, deactivate, or reactivate templates"
    - "Templates are created without company_id assignment (global resource)"
    - "Schedule creation no longer validates template company matches user company"
    - "Template create and detail forms no longer show a Company field"
  artifacts:
    - path: "supabase/migrations/00023_templates_shared_global.sql"
      provides: "Migration making company_id nullable and updating RLS to global SELECT"
      contains: "DROP NOT NULL"
    - path: "app/actions/template-actions.ts"
      provides: "Server actions without company_id filtering on reads or writes"
    - path: "app/actions/schedule-actions.ts"
      provides: "createSchedule without template company validation"
  key_links:
    - from: "supabase/migrations/00023_templates_shared_global.sql"
      to: "maintenance_templates table"
      via: "ALTER COLUMN company_id DROP NOT NULL + new RLS policies"
      pattern: "DROP NOT NULL"
    - from: "app/actions/template-actions.ts"
      to: "maintenance_templates table"
      via: "Supabase queries without company_id filter"
      pattern: "from.*maintenance_templates"
    - from: "app/actions/schedule-actions.ts"
      to: "maintenance_templates table"
      via: "Template fetch without company_id check"
      pattern: "from.*maintenance_templates"
---

<objective>
Make maintenance templates a shared/global resource visible to all authenticated users, not scoped to a single company.

Purpose: Templates define reusable maintenance checklists and should be available across all companies. Currently they are company-scoped with RLS restricting visibility by company_id.

Output: Migration making company_id nullable, updated RLS policies (global SELECT, role-only INSERT/UPDATE), updated server actions and UI removing company filtering and Company field.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@./supabase/migrations/00001_initial_schema.sql (lines 220-232 — maintenance_templates table definition)
@./supabase/migrations/00003_rls_policies.sql (lines 190-205 — original RLS policies)
@./supabase/migrations/00010_pm_phase7.sql (lines 180-203 — refined INSERT/UPDATE policies)
@./supabase/migrations/00021_rls_maintenance_multi_company.sql (full file — current SELECT policy)
@./app/actions/template-actions.ts
@./app/actions/schedule-actions.ts
@./app/(dashboard)/maintenance/templates/page.tsx
@./app/(dashboard)/maintenance/templates/[id]/page.tsx
@./app/(dashboard)/maintenance/page.tsx
@./components/maintenance/template-create-form.tsx
@./components/maintenance/template-create-dialog.tsx
@./components/maintenance/template-detail.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migration + RLS — make templates globally readable</name>
  <files>supabase/migrations/00023_templates_shared_global.sql</files>
  <action>
Create migration `supabase/migrations/00023_templates_shared_global.sql` with:

1. Make company_id nullable:
```sql
ALTER TABLE public.maintenance_templates ALTER COLUMN company_id DROP NOT NULL;
```

2. Drop ALL existing RLS policies on maintenance_templates (there are 3 active: `maintenance_templates_select_policy` from migration 00021, `maintenance_templates_insert_ga_lead` from migration 00010, `maintenance_templates_update_ga_lead` from migration 00010):
```sql
DROP POLICY IF EXISTS "maintenance_templates_select" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_select_policy" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_insert" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_insert_ga_lead" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_update" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_update_ga_lead" ON public.maintenance_templates;
```

3. Create new policies:
- SELECT: All authenticated users can read all non-deleted templates (no company filter):
```sql
CREATE POLICY "maintenance_templates_select_global" ON public.maintenance_templates
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);
```

- INSERT: Only ga_lead/admin roles, no company check:
```sql
CREATE POLICY "maintenance_templates_insert_role" ON public.maintenance_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('ga_lead', 'admin')
  );
```

- UPDATE: Only ga_lead/admin roles, no company check:
```sql
CREATE POLICY "maintenance_templates_update_role" ON public.maintenance_templates
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('ga_lead', 'admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('ga_lead', 'admin')
  );
```

4. Set existing templates' company_id to NULL (clean up legacy data):
```sql
UPDATE public.maintenance_templates SET company_id = NULL WHERE company_id IS NOT NULL;
```
  </action>
  <verify>
    <automated>cat supabase/migrations/00023_templates_shared_global.sql | grep -c "DROP POLICY\|CREATE POLICY\|DROP NOT NULL"</automated>
  </verify>
  <done>Migration file exists with: company_id made nullable, all old RLS policies dropped, 3 new global/role-based policies created, existing data cleaned up.</done>
</task>

<task type="auto">
  <name>Task 2: Update server actions — remove company scoping from template reads/writes</name>
  <files>app/actions/template-actions.ts, app/actions/schedule-actions.ts</files>
  <action>
**template-actions.ts** — Remove all company_id filtering:

1. `createTemplate` (line 46): Remove `company_id: profile.company_id` from the `.insert({...})` payload. The insert should NOT include company_id at all (templates are global).

2. `updateTemplate` (lines 82-88): Remove the ownership verification query that checks `.eq('company_id', profile.company_id)`. Keep the `.eq('id', parsedInput.id)` and `.is('deleted_at', null)` checks. Remove `.select('id, company_id')` — just select `id`.

3. `deactivateTemplate` (lines 150-155): Remove `.eq('company_id', profile.company_id)` from the ownership check. Keep `.eq('id', parsedInput.id)` and `.is('deleted_at', null)`. Remove `company_id` from the `.select(...)`.

4. `reactivateTemplate` (lines 209-214): Same as deactivateTemplate — remove `.eq('company_id', profile.company_id)` and `company_id` from `.select(...)`.

5. `getTemplates` (lines 243-288): Remove the entire user_company_access fetch block (lines 249-254). Remove `.in('company_id', allAccessibleCompanyIds)` from the query (line 271). The query should just be:
```typescript
.from('maintenance_templates')
.select(`id, category_id, name, description, checklist, is_active, deleted_at, created_at, updated_at, category:categories(name, type)`)
.is('deleted_at', null)
.order('name', { ascending: true });
```
Also remove `company_id` from the select fields since it is no longer relevant.

6. `getTemplateById` (lines 294-339): Remove the entire user_company_access fetch block (lines 300-305). Remove `.in('company_id', allAccessibleCompanyIds)` from the query (line 323). Remove `company_id` from the select fields. The query should just filter by `.eq('id', parsedInput.id)` and `.is('deleted_at', null)`.

**schedule-actions.ts** — Remove template company validation:

1. `createSchedule` (lines 22-29): Remove `.eq('company_id', profile.company_id)` from the template fetch query. The template just needs to be active and not deleted — it is a global resource. Keep the `.eq('id', parsedInput.template_id)`, `.eq('is_active', true)`, and `.is('deleted_at', null)` checks. Remove `company_id` from the `.select(...)`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>template-actions.ts has zero company_id references in queries. schedule-actions.ts createSchedule fetches template without company filter. TypeScript compiles clean.</done>
</task>

<task type="auto">
  <name>Task 3: Update pages and UI — remove Company field and company-scoped queries</name>
  <files>app/(dashboard)/maintenance/templates/page.tsx, app/(dashboard)/maintenance/templates/[id]/page.tsx, app/(dashboard)/maintenance/page.tsx, components/maintenance/template-create-form.tsx, components/maintenance/template-create-dialog.tsx, components/maintenance/template-detail.tsx</files>
  <action>
**templates/page.tsx** (templates list page):
1. Remove the user_company_access fetch block (lines 35-40) and `allAccessibleCompanyIds` computation.
2. Remove `.in('company_id', allAccessibleCompanyIds)` from the template query (line 87). Templates are globally visible now.
3. Remove `company_id` from the template select fields.
4. Remove `primaryCompanyResult` and `extraCompaniesResult` from the Promise.all (lines 50-64) — templates no longer need company info.
5. Remove `primaryCompanyName` and `extraCompanies` variables and their usage.
6. Remove `primaryCompanyName` and `extraCompanies` props from `<TemplateCreateDialog>` component invocation.

**templates/[id]/page.tsx** (template detail page):
1. Remove the user_company_access fetch block (lines 34-39) and `allAccessibleCompanyIds`.
2. Remove `.in('company_id', allAccessibleCompanyIds)` from the template query (line 58). Just filter by `.eq('id', id)` and `.is('deleted_at', null)`.
3. Remove `company_id` from the template select fields.
4. Remove the `companyResult` fetch from Promise.all (lines 86-88) — no company name needed.
5. Remove `companyName` variable and prop passed to `<TemplateDetail>`.

**maintenance/page.tsx** (schedules list page):
1. In the templates fetch for the schedule create dialog (lines 73-80): Remove `.in('company_id', allAccessibleCompanyIds)` from the templates query. Templates are global — just fetch all active non-deleted templates. Keep the company filtering for assets and schedules (those remain company-scoped).

**template-create-dialog.tsx**:
1. Remove `primaryCompanyName` and `extraCompanies` from the `TemplateCreateDialogProps` interface (lines 18-19).
2. Remove `primaryCompanyName` and `extraCompanies` from the destructured function parameters (lines 25-26).
3. Remove `primaryCompanyName={primaryCompanyName ?? ''}` and `extraCompanies={extraCompanies}` props from the `<TemplateCreateForm>` invocation (lines 44-45). Only pass `categories` and `onSuccess`.

**template-create-form.tsx**:
1. Remove the entire Company field section (lines 96-115) — the `<div className="space-y-2">` containing the Company label, Combobox/Input.
2. Remove `primaryCompanyName` and `extraCompanies` from the `TemplateCreateFormProps` interface (lines 34-35) and function parameters.
3. Remove the `selectedCompanyId` state (line 42).

**template-detail.tsx**:
1. Remove the `companyName` prop from `TemplateDetailProps` interface (line 59) and function parameters.
2. Remove the entire Company section (lines 227-233) — the `<div className="space-y-2">` containing the Company label and disabled Input.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Template pages fetch all templates without company filter. Template create/edit forms have no Company field. Template create dialog passes no company props. Template detail page has no company name display. Schedule create dialog fetches all global templates. TypeScript compiles clean.</done>
</task>

</tasks>

<verification>
1. TypeScript compilation: `npx tsc --noEmit` passes with zero errors
2. ESLint: `npm run lint` passes
3. Migration file review: Confirm 00023 has DROP NOT NULL, drops all 6 possible old policy names, creates 3 new policies
4. Grep verification: `grep -rn "company_id" app/actions/template-actions.ts` returns zero results
5. Grep verification: `grep -rn "companyName\|primaryCompanyName\|extraCompanies" components/maintenance/template-create-form.tsx components/maintenance/template-create-dialog.tsx components/maintenance/template-detail.tsx` returns zero results
6. Grep verification: `grep -rn "company_id.*profile\|profile.*company_id" app/actions/schedule-actions.ts` should NOT match in the template fetch section (only in asset/schedule sections)
</verification>

<success_criteria>
- Migration 00023 makes maintenance_templates.company_id nullable and updates RLS to allow all authenticated users to SELECT, only ga_lead/admin to INSERT/UPDATE
- All template server actions (CRUD) operate without company_id filtering
- Schedule creation validates template existence and active status but not company ownership
- Template UI has no Company field in create, dialog, or detail forms
- Template list and detail pages fetch templates globally (no company filter)
- All TypeScript compiles clean
</success_criteria>

<output>
After completion, create `.planning/quick/68-make-maintenance-templates-shared-across/68-SUMMARY.md`
</output>
