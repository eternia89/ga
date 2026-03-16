---
phase: quick-81
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/exports/inventory/route.ts
  - app/api/exports/jobs/route.ts
  - app/api/exports/requests/route.ts
  - app/api/exports/maintenance/route.ts
  - supabase/migrations/00027_rls_multi_company_writes.sql
  - app/actions/job-actions.ts
  - app/actions/pm-job-actions.ts
  - app/actions/asset-actions.ts
  - app/actions/approval-actions.ts
  - app/api/uploads/entity-photos/route.ts
  - app/api/uploads/job-photos/route.ts
  - app/api/uploads/asset-invoices/route.ts
  - app/(dashboard)/requests/page.tsx
  - app/(dashboard)/jobs/page.tsx
  - app/(dashboard)/inventory/page.tsx
  - app/(dashboard)/inventory/new/page.tsx
autonomous: true
requirements: [MULTI-COMPANY-EXPORT, MULTI-COMPANY-RLS-WRITES, MULTI-COMPANY-ACTION-CLEANUP, MULTI-COMPANY-PAGE-DROPDOWNS]

must_haves:
  truths:
    - "Export routes only export data from the user's accessible companies, not all companies"
    - "Users with multi-company access can INSERT/UPDATE entities in their granted companies via RLS"
    - "Action-level company filters removed so multi-company users can operate on granted companies"
    - "Page dropdowns (users, locations, divisions) show data from all accessible companies, not just primary"
  artifacts:
    - path: "supabase/migrations/00027_rls_multi_company_writes.sql"
      provides: "Multi-company INSERT/UPDATE RLS expansion for 8 tables"
      contains: "user_company_access"
    - path: "app/api/exports/inventory/route.ts"
      provides: "Company-scoped inventory export"
      contains: "allAccessibleCompanyIds"
    - path: "app/api/exports/jobs/route.ts"
      provides: "Company-scoped jobs export"
      contains: "allAccessibleCompanyIds"
    - path: "app/api/exports/requests/route.ts"
      provides: "Company-scoped requests export"
      contains: "allAccessibleCompanyIds"
    - path: "app/api/exports/maintenance/route.ts"
      provides: "Company-scoped maintenance export"
      contains: "allAccessibleCompanyIds"
  key_links:
    - from: "app/api/exports/*.ts"
      to: "user_company_access table"
      via: "supabase query for extra company IDs"
      pattern: "user_company_access.*company_id"
    - from: "supabase/migrations/00027"
      to: "INSERT/UPDATE RLS policies"
      via: "OR EXISTS subquery on user_company_access"
      pattern: "EXISTS.*user_company_access"
    - from: "app/actions/*.ts"
      to: "RLS layer"
      via: "removed .eq('company_id', profile.company_id) — RLS handles scoping"
      pattern: "single()"
---

<objective>
Fix 4 multi-company data isolation bugs found during comprehensive audit: (1) export routes leak all companies' data, (2) RLS INSERT/UPDATE policies block multi-company writes, (3) redundant action-level company filters prevent cross-company operations, (4) page dropdowns only show primary company data.

Purpose: Complete multi-company access model so users granted access to multiple companies can fully operate (read, write, export, filter) across all their accessible companies.
Output: 4 export routes scoped, 1 RLS migration, ~19 redundant filters removed, 4 page components updated.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@supabase/migrations/00026_rls_supporting_tables_multi_company.sql
@supabase/migrations/00005_role_rls_refinements.sql
@supabase/migrations/00009_inventory_phase6.sql
@supabase/migrations/00008_jobs_phase5.sql
@supabase/migrations/00011_job_status_changes.sql
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add company scoping to all 4 export API routes</name>
  <files>
    app/api/exports/inventory/route.ts,
    app/api/exports/jobs/route.ts,
    app/api/exports/requests/route.ts,
    app/api/exports/maintenance/route.ts
  </files>
  <action>
In each of the 4 export route files, after fetching the user profile (the `profile` variable already exists), add a query to fetch the user's extra company access and build the accessible company IDs array. Then add `.in('company_id', allAccessibleCompanyIds)` to the main data query.

For each file, insert after the role check block (after the `if (!EXPORT_ROLES.includes(profile.role))` block):

```typescript
// Fetch user's extra company access for multi-company scoping
const { data: companyAccessRows } = await supabase
  .from('user_company_access')
  .select('company_id')
  .eq('user_id', profile.id);
const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];
```

Then modify the main data query in each file to add company scoping:

1. **inventory/route.ts**: Add `.in('company_id', allAccessibleCompanyIds)` to the `inventory_items` query (between `.select(...)` and `.is('deleted_at', null)`)
2. **jobs/route.ts**: Add `.in('company_id', allAccessibleCompanyIds)` to the `jobs` query
3. **requests/route.ts**: Add `.in('company_id', allAccessibleCompanyIds)` to the `requests` query
4. **maintenance/route.ts**: Add `.in('company_id', allAccessibleCompanyIds)` to the `maintenance_schedules` query

Remove the "no filter" comments (e.g., `// Fetch ALL inventory items with joined FK names (no filter — export everything)`) since we now filter by company.
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>All 4 export routes query user_company_access and filter main data query by allAccessibleCompanyIds. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Create RLS migration for multi-company INSERT/UPDATE policies</name>
  <files>supabase/migrations/00027_rls_multi_company_writes.sql</files>
  <action>
Create migration file `supabase/migrations/00027_rls_multi_company_writes.sql` that expands INSERT and UPDATE RLS policies to allow users with `user_company_access` rows to write to granted companies.

**Section A — Expand INSERT/UPDATE policies on main entity tables:**

For each table below, DROP the existing single-company policy and CREATE a replacement that adds the `OR EXISTS (SELECT 1 FROM public.user_company_access WHERE user_id = auth.uid() AND company_id = <table>.company_id)` check. Preserve existing role restrictions.

1. **requests INSERT** — Drop `requests_insert_general_user`, create replacement:
   ```sql
   CREATE POLICY "requests_insert_multi_company" ON public.requests
     FOR INSERT TO authenticated
     WITH CHECK (
       (
         company_id = public.current_user_company_id()
         OR EXISTS (
           SELECT 1 FROM public.user_company_access
           WHERE user_id = auth.uid() AND company_id = requests.company_id
         )
       )
       AND (
         public.current_user_role() != 'general_user'
         OR division_id = public.current_user_division_id()
       )
     );
   ```

2. **requests UPDATE** — Drop `requests_update_role_aware`, create replacement with same role-aware logic + multi-company in both USING and WITH CHECK.

3. **jobs INSERT** — Drop `jobs_insert`, create replacement with multi-company check (no role restriction on original).

4. **jobs UPDATE** — Drop `jobs_update`, create replacement with multi-company check in both USING and WITH CHECK.

5. **inventory_items INSERT** — Drop `inventory_items_insert_ga_staff_lead_admin`, create replacement preserving `current_user_role() IN ('ga_staff', 'ga_lead', 'admin')` restriction + multi-company.

6. **inventory_items UPDATE** — Drop `inventory_items_update_ga_staff_lead_admin`, create replacement preserving role restriction + multi-company.

7. **inventory_movements INSERT** — Drop `inventory_movements_insert_ga_staff_lead_admin`, create replacement preserving role restriction + multi-company.

8. **inventory_movements UPDATE** — Drop `inventory_movements_update_initiator_receiver_lead_admin`, create replacement preserving initiator/receiver/lead/admin logic + multi-company.

9. **media_attachments INSERT** — Drop `media_attachments_insert`, create replacement with multi-company.

10. **media_attachments UPDATE** — Drop `media_attachments_update`, create replacement with multi-company in both USING and WITH CHECK.

11. **job_comments INSERT** — There are TWO insert policies: `job_comments_insert` (from 00003) and `job_comments_insert_lead_admin_pic` (from 00008). Drop BOTH, create single replacement that combines company check (multi-company) with role/PIC check:
    ```sql
    CREATE POLICY "job_comments_insert_multi_company" ON public.job_comments
      FOR INSERT TO authenticated
      WITH CHECK (
        (
          company_id = public.current_user_company_id()
          OR EXISTS (
            SELECT 1 FROM public.user_company_access
            WHERE user_id = auth.uid() AND company_id = job_comments.company_id
          )
        )
      );
    ```
    Note: The role/PIC check from 00008 is redundant since any authenticated user in the company should be able to comment (the 00005 migration already notes "all authenticated company users can comment").

**Section B — Add multi-company SELECT and INSERT to missed tables:**

12. **job_requests SELECT** — Drop `job_requests_select_own_company`, create replacement with multi-company check.

13. **job_requests INSERT** — Drop `job_requests_insert_lead_admin_staff`, create replacement preserving `('ga_lead', 'admin', 'ga_staff')` role restriction + multi-company.

14. **job_status_changes SELECT** — Drop `job_status_changes_select`, create replacement with multi-company check.

15. **job_status_changes INSERT** — Drop `job_status_changes_insert`, create replacement with multi-company check.

Use consistent naming: `{table}_{operation}_multi_company` for all new policies.

Add a header comment block explaining the migration purpose (same style as migration 00026).
  </action>
  <verify>
    <automated>cat supabase/migrations/00027_rls_multi_company_writes.sql | grep -c "CREATE POLICY"</automated>
  </verify>
  <done>Migration file exists with 15 new policies covering INSERT/UPDATE on 8 tables and SELECT/INSERT on 2 missed tables. All policies include the user_company_access OR EXISTS check. Existing role restrictions preserved.</done>
</task>

<task type="auto">
  <name>Task 3: Remove redundant action-level company filters from server actions and upload routes</name>
  <files>
    app/actions/job-actions.ts,
    app/actions/pm-job-actions.ts,
    app/actions/asset-actions.ts,
    app/actions/approval-actions.ts,
    app/api/uploads/entity-photos/route.ts,
    app/api/uploads/job-photos/route.ts,
    app/api/uploads/asset-invoices/route.ts
  </files>
  <action>
Remove `.eq('company_id', profile.company_id)` lines from entity-by-ID SELECT queries in the following files. These are redundant because RLS now handles company scoping (including multi-company). Simply delete each line — do NOT add a replacement comment.

**app/actions/job-actions.ts** — Remove the `.eq('company_id', profile.company_id)` line at each of these locations (6 total):
- Line ~202: in updateJob (fetch existing job)
- Line ~381: in approveJob (fetch job)
- Line ~445: in updateJobStatus (fetch job)
- Line ~638: in cancelJob (fetch job)
- Line ~706: in addJobComment (fetch job to verify access)
- Line ~775: in deleteJobAttachment (verify parent job)

**app/actions/pm-job-actions.ts** — Remove 3 occurrences:
- Line ~29: first action's entity fetch
- Line ~118: second action's entity fetch
- Line ~195: third action's entity fetch

**app/actions/asset-actions.ts** — Remove 4 occurrences:
- Line ~104: changeAssetStatus (fetch asset)
- Line ~159: recordAssetDisposal (fetch asset)
- Line ~232: createInventoryMovement (fetch asset)
- Line ~574: fetchEntityMedia (fetch media)

Do NOT touch the 3 transfer actions (acceptTransfer/rejectTransfer/cancelTransfer) — those were already fixed in commit 3002cb1.

**app/actions/approval-actions.ts** — Remove 4 occurrences:
- Line ~21: first approval action
- Line ~89: second approval action
- Line ~157: third approval action
- Line ~269: fourth approval action

**app/api/uploads/entity-photos/route.ts** — Remove 1 occurrence at line ~93.

**app/api/uploads/job-photos/route.ts** — Remove 1 occurrence at line ~59.

**app/api/uploads/asset-invoices/route.ts** — Remove 1 occurrence at line ~48.

Total: 19 removals across 7 files.
  </action>
  <verify>
    <automated>grep -rn "\.eq('company_id', profile\.company_id)" app/actions/job-actions.ts app/actions/pm-job-actions.ts app/actions/asset-actions.ts app/actions/approval-actions.ts app/api/uploads/entity-photos/route.ts app/api/uploads/job-photos/route.ts app/api/uploads/asset-invoices/route.ts | wc -l</automated>
  </verify>
  <done>grep returns 0 lines — all 19 redundant `.eq('company_id', profile.company_id)` filters removed from the 7 specified files. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 4: Update page dropdowns to fetch from all accessible companies</name>
  <files>
    app/(dashboard)/requests/page.tsx,
    app/(dashboard)/jobs/page.tsx,
    app/(dashboard)/inventory/page.tsx,
    app/(dashboard)/inventory/new/page.tsx
  </files>
  <action>
Update supporting table queries (users, locations, divisions) in page server components to use `.in('company_id', allAccessibleCompanyIds)` instead of `.eq('company_id', profile.company_id)` so dropdowns show data from all accessible companies.

**app/(dashboard)/requests/page.tsx** — The page already builds `allAccessibleCompanyIds`. Update 2 queries:
- Line ~70: `user_profiles` query — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
- Line ~77: `locations` query (for create dialog, primary company) — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`

**app/(dashboard)/jobs/page.tsx** — The page already builds `allAccessibleCompanyIds`. Update 5 queries:
- Line ~73: `user_profiles` for PIC filter — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
- Line ~82: `locations` for create dialog — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
- Line ~97: `user_profiles` for PIC assignment in create dialog — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
- Line ~105: `requests` for eligible requests — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
- Line ~114: `company_settings` for budget threshold — this one stays as-is (budget threshold is per-company, uses primary company_id intentionally)

So 4 changes in jobs/page.tsx (NOT the company_settings query).

**app/(dashboard)/inventory/page.tsx** — The page already builds `allAccessibleCompanyIds`. Update 2 queries:
- Line ~92: `locations` for filter/create dialog — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
- Line ~135: `user_profiles` for GA users in transfer dialog — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`

**app/(dashboard)/inventory/new/page.tsx** — This page does NOT currently build `allAccessibleCompanyIds`. Add the standard pattern:
1. After fetching `profile`, add:
   ```typescript
   const { data: companyAccessRows } = await supabase
     .from('user_company_access')
     .select('company_id')
     .eq('user_id', profile.id);
   const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
   const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];
   ```
2. Update line ~46: `locations` query — change `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
  </action>
  <verify>
    <automated>grep -rn "\.eq('company_id', profile\.company_id)" app/\(dashboard\)/requests/page.tsx app/\(dashboard\)/jobs/page.tsx app/\(dashboard\)/inventory/page.tsx app/\(dashboard\)/inventory/new/page.tsx | grep -v company_settings | wc -l</automated>
  </verify>
  <done>grep returns 0 lines (excluding company_settings which correctly stays single-company) — all supporting table queries now use `.in('company_id', allAccessibleCompanyIds)`. Dropdowns show data from all accessible companies.</done>
</task>

<task type="auto">
  <name>Task 5: TypeScript compilation and lint verification</name>
  <files>
    app/api/exports/inventory/route.ts,
    app/api/exports/jobs/route.ts,
    app/api/exports/requests/route.ts,
    app/api/exports/maintenance/route.ts,
    app/actions/job-actions.ts,
    app/actions/pm-job-actions.ts,
    app/actions/asset-actions.ts,
    app/actions/approval-actions.ts,
    app/api/uploads/entity-photos/route.ts,
    app/api/uploads/job-photos/route.ts,
    app/api/uploads/asset-invoices/route.ts,
    app/(dashboard)/requests/page.tsx,
    app/(dashboard)/jobs/page.tsx,
    app/(dashboard)/inventory/page.tsx,
    app/(dashboard)/inventory/new/page.tsx
  </files>
  <action>
Run full TypeScript compilation and ESLint to verify all changes compile and pass linting.

1. Run `npx tsc --noEmit` — must pass with zero errors
2. Run `npm run lint` — must pass with zero errors

If any errors, fix them in the affected files. Common issues to watch for:
- Unused imports after removing `.eq()` lines
- Type mismatches from `.in()` vs `.eq()` (unlikely but check)
- Any `profile.company_id` references that were part of a chain and now leave a dangling method call
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -5 && npm run lint 2>&1 | tail -5</automated>
  </verify>
  <done>TypeScript compiles with 0 errors. ESLint passes with 0 errors. All 16 modified files are clean.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with 0 errors
2. `npm run lint` passes with 0 errors
3. `grep -rn "\.eq('company_id', profile\.company_id)" app/actions/job-actions.ts app/actions/pm-job-actions.ts app/actions/asset-actions.ts app/actions/approval-actions.ts app/api/uploads/entity-photos/route.ts app/api/uploads/job-photos/route.ts app/api/uploads/asset-invoices/route.ts` returns 0 lines
4. All 4 export routes contain `allAccessibleCompanyIds` and `.in('company_id'`
5. Migration 00027 contains 15 CREATE POLICY statements
6. All 4 page components use `.in('company_id', allAccessibleCompanyIds)` for supporting queries
</verification>

<success_criteria>
- Export routes only return data from the user's primary company + granted companies
- RLS INSERT/UPDATE policies on 8 tables allow writes to granted companies via user_company_access
- 19 redundant `.eq('company_id', profile.company_id)` filters removed from 7 action/upload files
- 4 page components fetch dropdown data from all accessible companies
- TypeScript and ESLint pass cleanly
- Migration file ready for `supabase db push`
</success_criteria>

<output>
After completion, create `.planning/quick/81-multi-company-comprehensive-fix-rls-expa/81-SUMMARY.md`
</output>
