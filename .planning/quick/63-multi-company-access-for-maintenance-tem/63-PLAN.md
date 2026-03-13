---
phase: quick-63
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00021_rls_maintenance_multi_company.sql
  - app/(dashboard)/maintenance/page.tsx
  - app/(dashboard)/maintenance/templates/page.tsx
  - app/(dashboard)/maintenance/templates/[id]/page.tsx
  - app/(dashboard)/maintenance/schedules/[id]/page.tsx
  - app/actions/template-actions.ts
  - app/actions/schedule-actions.ts
autonomous: true
requirements: [QUICK-63]

must_haves:
  truths:
    - "User with multi-company access can see maintenance templates from all accessible companies"
    - "User with multi-company access can see maintenance schedules from all accessible companies"
    - "User with multi-company access can view template detail pages for any accessible company"
    - "User with multi-company access can view schedule detail pages for any accessible company"
    - "Mutation actions (create, update, deactivate) still enforce primary company ownership"
  artifacts:
    - path: "supabase/migrations/00021_rls_maintenance_multi_company.sql"
      provides: "RLS SELECT policy expansion for maintenance_templates and maintenance_schedules"
      contains: "user_company_access"
    - path: "app/(dashboard)/maintenance/page.tsx"
      provides: "Multi-company schedule list query"
      contains: "allAccessibleCompanyIds"
    - path: "app/(dashboard)/maintenance/templates/page.tsx"
      provides: "Multi-company template list query"
      contains: "allAccessibleCompanyIds"
  key_links:
    - from: "supabase/migrations/00021_rls_maintenance_multi_company.sql"
      to: "public.user_company_access"
      via: "EXISTS subquery in RLS USING clause"
      pattern: "EXISTS.*user_company_access"
    - from: "app/(dashboard)/maintenance/page.tsx"
      to: "maintenance_schedules"
      via: ".in('company_id', allAccessibleCompanyIds)"
      pattern: "\\.in\\('company_id'"
---

<objective>
Expand multi-company read access to maintenance_templates and maintenance_schedules, matching the pattern established in migration 00020 for requests, jobs, and inventory_items.

Purpose: Users with entries in user_company_access can currently see requests, jobs, and assets from their granted companies, but maintenance templates and schedules are still restricted to primary company only. This is an oversight from migration 00020.

Output: New RLS migration + updated app-level queries across 6 files.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@supabase/migrations/00020_rls_multi_company_access.sql
@supabase/migrations/00003_rls_policies.sql (lines 192-222 for current maintenance policies)
@app/(dashboard)/maintenance/page.tsx
@app/(dashboard)/maintenance/templates/page.tsx
@app/(dashboard)/maintenance/templates/[id]/page.tsx
@app/(dashboard)/maintenance/schedules/[id]/page.tsx
@app/actions/template-actions.ts
@app/actions/schedule-actions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: RLS migration and app-level query updates for multi-company maintenance access</name>
  <files>
    supabase/migrations/00021_rls_maintenance_multi_company.sql,
    app/(dashboard)/maintenance/page.tsx,
    app/(dashboard)/maintenance/templates/page.tsx,
    app/(dashboard)/maintenance/templates/[id]/page.tsx,
    app/(dashboard)/maintenance/schedules/[id]/page.tsx,
    app/actions/template-actions.ts,
    app/actions/schedule-actions.ts
  </files>
  <action>
    **1. Create migration `supabase/migrations/00021_rls_maintenance_multi_company.sql`:**

    Follow the exact pattern from migration 00020. For each table (maintenance_templates, maintenance_schedules):
    - DROP POLICY IF EXISTS "{table}_select" ON public.{table};
    - CREATE POLICY "{table}_select_policy" with USING clause:
      `(company_id = public.current_user_company_id() OR EXISTS (SELECT 1 FROM public.user_company_access WHERE user_id = auth.uid() AND company_id = {table}.company_id)) AND deleted_at IS NULL`
    - Do NOT touch INSERT or UPDATE policies — multi-company access is read-only.

    **2. Update page-level queries — replace `.eq('company_id', profile.company_id)` with `.in('company_id', allAccessibleCompanyIds)` for SELECT/list queries only:**

    **`app/(dashboard)/maintenance/page.tsx`** (schedules index):
    - The page already fetches `companyAccessRows` and computes `allAccessibleCompanyIds` (lines 64-70) but does NOT use it for the main queries.
    - Line 60: Change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)` on the schedules list query.
    - Move the `companyAccessRows` / `allAccessibleCompanyIds` computation ABOVE the schedules query (currently it's below on lines 64-70) so `allAccessibleCompanyIds` is available.
    - Line 77: Change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)` on the templates-for-create query.
    - Line 84: Change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)` on the assets-for-create query.

    **`app/(dashboard)/maintenance/templates/page.tsx`** (templates list):
    - Line 87: Change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)` on the main templates query.
    - The page already computes `allAccessibleCompanyIds` at lines 35-40. Ensure the templates query uses it.

    **`app/(dashboard)/maintenance/templates/[id]/page.tsx`** (template detail):
    - Line 50: Change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`.
    - Add the `companyAccessRows` / `allAccessibleCompanyIds` computation (same pattern as templates list page lines 35-40) before the template query.
    - Also update the company name fetch (line 79) to use the template's actual `company_id` instead of `profile.company_id` — since the user might be viewing a template from an extra company: `.eq('id', templateData.company_id)`.

    **`app/(dashboard)/maintenance/schedules/[id]/page.tsx`** (schedule detail):
    - Line 59: Change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`.
    - Add the `companyAccessRows` / `allAccessibleCompanyIds` computation before the schedule query.
    - Also update the company name fetch (line 92) to use `scheduleRaw.company_id` instead of `profile.company_id`.

    **3. Update read-only server actions — `getTemplates`, `getTemplateById`, `getSchedules`, `getSchedulesByAssetId`:**

    **`app/actions/template-actions.ts`:**
    - `getTemplates` (line 263): Add `user_company_access` fetch, compute `allAccessibleCompanyIds`, change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`.
    - `getTemplateById` (line 307): Same pattern — fetch access, use `.in(...)`.

    **`app/actions/schedule-actions.ts`:**
    - `getSchedules` (line 311): Change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)` after fetching user_company_access.
    - `getSchedulesByAssetId` (line 372): Same pattern.

    **DO NOT change mutation actions** (createSchedule, updateSchedule, deactivateSchedule, activateSchedule, deleteSchedule, createTemplate, updateTemplate, deactivateTemplate, reactivateTemplate). These correctly enforce primary company ownership. Multi-company access is read-only.

    **DO NOT change** `pauseSchedulesForAsset`, `resumeSchedulesForAsset`, `deactivateSchedulesForAsset` — these are internal helpers called by asset status change with admin client, not user-facing reads.
  </action>
  <verify>
    <automated>npx supabase db diff --use-migra 2>&1 | head -5; grep -c "allAccessibleCompanyIds" app/\(dashboard\)/maintenance/page.tsx app/\(dashboard\)/maintenance/templates/page.tsx app/\(dashboard\)/maintenance/templates/\[id\]/page.tsx app/\(dashboard\)/maintenance/schedules/\[id\]/page.tsx app/actions/template-actions.ts app/actions/schedule-actions.ts; npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Migration 00021 exists with DROP+CREATE for both maintenance_templates and maintenance_schedules SELECT policies including user_company_access OR clause
    - All 4 maintenance page files use `.in('company_id', allAccessibleCompanyIds)` for their main data queries
    - All 4 read-only server actions (getTemplates, getTemplateById, getSchedules, getSchedulesByAssetId) use `.in('company_id', allAccessibleCompanyIds)`
    - All mutation actions still use `.eq('company_id', profile.company_id)` for ownership checks
    - Detail pages fetch company name using the record's company_id (not profile.company_id)
    - Build passes with no TypeScript errors
  </done>
</task>

</tasks>

<verification>
- Migration file 00021 follows exact pattern from 00020 (DROP IF EXISTS + CREATE POLICY with user_company_access OR clause)
- grep confirms no remaining `.eq('company_id', profile.company_id)` in SELECT/read paths of maintenance pages and read actions
- `npm run build` passes
</verification>

<success_criteria>
A user with multi-company access (entries in user_company_access) can see maintenance templates and schedules from all their accessible companies, both on list pages and detail pages. Mutations remain restricted to primary company.
</success_criteria>

<output>
After completion, create `.planning/quick/63-multi-company-access-for-maintenance-tem/63-SUMMARY.md`
</output>
