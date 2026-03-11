---
phase: quick-49
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00020_rls_multi_company_access.sql
  - supabase/seed.sql
autonomous: true
requirements: []

must_haves:
  truths:
    - "Admin can save user company access without schema cache error"
    - "GA Staff user with multi-company access can read requests/jobs/assets from their granted companies"
    - "Single-company users still see only their primary company data (no regressions)"
    - "Seed data includes at least one GA Staff user with access to a second company for manual testing"
  artifacts:
    - path: "supabase/migrations/00020_rls_multi_company_access.sql"
      provides: "DROP/CREATE replacement SELECT policies for requests, jobs, inventory_items that OR-check user_company_access"
      exports: ["requests_select_policy", "jobs_select_policy", "inventory_items_select_policy"]
    - path: "supabase/seed.sql"
      provides: "user_company_access seed rows granting Eva (Jaknot GA Staff) access to Jakmall"
      contains: "user_company_access"
  key_links:
    - from: "supabase/migrations/00020_rls_multi_company_access.sql"
      to: "public.user_company_access"
      via: "EXISTS subquery in USING clause"
      pattern: "EXISTS.*user_company_access"
    - from: "supabase/seed.sql"
      to: "public.user_company_access"
      via: "INSERT row for Eva → Jakmall"
      pattern: "user_company_access"
---

<objective>
Fix three interconnected company-based data isolation issues:
1. `user_company_access` table missing from schema cache — migrations 00012–00019 not yet pushed to Supabase remote
2. RLS SELECT policies only check primary company JWT — extended company access via `user_company_access` is ignored at DB level
3. Seed data has no `user_company_access` rows — multi-company scenario cannot be tested

Purpose: GA Staff users granted additional company access must be able to read that company's requests, jobs, and assets. Single-company users must be unaffected.

Output: `supabase db push` run, migration 00020 with updated RLS SELECT policies, updated seed data with multi-company test rows.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

<!-- Key architecture facts for executor:
  - current_user_company_id() extracts company_id from JWT app_metadata (migration 00002)
  - user_company_access table: user_id, company_id, granted_by, granted_at (migration 00018)
  - Migration numbering: follow 000NN_snake_case.sql pattern
  - Migrations 00012-00019 exist locally but have NOT been pushed to Supabase remote
  - The schema cache error ("Could not find the table 'public.user_company_access'") confirms
    migrations 00018+ are not applied to the remote DB
  - adminActionClient uses service_role key (bypasses RLS) — the error in updateUserCompanyAccess
    is a PostgREST schema cache miss, not an RLS rejection
  - Existing SELECT policies that need replacing:
      requests:         "requests_select" (00003) — company_id = current_user_company_id() AND deleted_at IS NULL
      jobs:             "jobs_select" (00003) — company_id = current_user_company_id() AND deleted_at IS NULL
      inventory_items:  "inventory_items_select_own_company" (00009) — company_id = current_user_company_id()
  - job_requests and job_comments also scoped to company but not listed as primary concern in CONTEXT.md
  - Seed users: Eva (00000000-0000-4000-a004-000000000004) is ga_staff at Jaknot (company 001)
    Samuel (00000000-0000-4000-a004-000000000001) is admin at Jakmall (company 002)
  - RFC 4122 UUID convention in seed: version=4 (pos 13), variant=a (pos 17)
    Namespace for user_company_access: a005 → 00000000-0000-4000-a005-000000000XXX
-->
</context>

<tasks>

<task type="auto">
  <name>Task 1: Push pending migrations to Supabase remote</name>
  <files>supabase/migrations/</files>
  <action>
Run `supabase db push` from the project root to apply all local migrations (00012–00019) to the Supabase remote database. This applies migration 00018_user_company_access.sql which creates the `user_company_access` table, resolving the PostgREST schema cache error.

Command: `supabase db push`

If prompted to confirm applying migrations, confirm with `y`. After the push completes, Supabase automatically reloads the PostgREST schema cache within ~30 seconds.

If the CLI is not authenticated, run `supabase login` first (this will create a dynamic checkpoint for the user to provide credentials). If migrations are already applied ("Nothing to push"), proceed to Task 2.
  </action>
  <verify>
`supabase db push` exits with code 0. Output confirms migrations applied or "No migrations to push".
  </verify>
  <done>All 19 local migrations are applied to the Supabase remote database. The `user_company_access` table exists in the remote schema.</done>
</task>

<task type="auto">
  <name>Task 2: Migration 00020 — expand RLS SELECT policies to include multi-company access</name>
  <files>supabase/migrations/00020_rls_multi_company_access.sql</files>
  <action>
Create `supabase/migrations/00020_rls_multi_company_access.sql`. This migration replaces the SELECT policies on `requests`, `jobs`, and `inventory_items` so they also permit access when `user_company_access` grants the user access to that row's company.

The OR EXISTS pattern to apply to each table:
```sql
DROP POLICY IF EXISTS "{existing_policy_name}" ON public.{table};
CREATE POLICY "{table}_select_policy" ON public.{table}
  FOR SELECT TO authenticated
  USING (
    (
      company_id = public.current_user_company_id()
      OR EXISTS (
        SELECT 1 FROM public.user_company_access
        WHERE user_id = auth.uid() AND company_id = {table}.company_id
      )
    )
    AND deleted_at IS NULL
  );
```

Apply this pattern to all three tables:

**requests table** — drop `"requests_select"` (created in 00003), create `"requests_select_policy"`

**jobs table** — drop `"jobs_select"` (created in 00003), create `"jobs_select_policy"`

**inventory_items table** — drop `"inventory_items_select_own_company"` (created in 00009), create `"inventory_items_select_policy"` (include `AND deleted_at IS NULL` — assets have soft delete even if 00009 omitted this check)

Include a header comment explaining this migration purpose. Do NOT modify INSERT or UPDATE policies — users create data in their primary company only; multi-company access is read-only.

After writing the file, also push it: `supabase db push` to apply migration 00020 to remote.
  </action>
  <verify>
`grep -c "user_company_access" supabase/migrations/00020_rls_multi_company_access.sql` returns 3 (one per table). File exists with DROP + CREATE for all 3 tables.
  </verify>
  <done>Migration file exists and is pushed to remote. Three SELECT policies now use OR EXISTS subquery against user_company_access for requests, jobs, and inventory_items.</done>
</task>

<task type="auto">
  <name>Task 3: Seed data — add user_company_access rows for multi-company testing</name>
  <files>supabase/seed.sql</files>
  <action>
Append a new section 8 to `supabase/seed.sql` after the company_settings block (the last INSERT in the file, currently line 293). Grant Eva (Jaknot GA Staff) read access to Jakmall for multi-company testing.

Append exactly this section:
```sql
-- ============================================================
-- 8. User company access (multi-company GA Staff test scenario)
-- ============================================================
-- Eva (eva@jaknot.com, ga_staff at Jaknot) gets read access to Jakmall.
-- Test: login as eva@jaknot.com → should see both Jaknot AND Jakmall
-- requests, jobs, and assets.
INSERT INTO public.user_company_access (id, user_id, company_id, granted_by) VALUES
  ('00000000-0000-4000-a005-000000000001',
   '00000000-0000-4000-a004-000000000004',  -- Eva (ga_staff, Jaknot)
   '00000000-0000-4000-a000-000000000002',  -- Jakmall
   '00000000-0000-4000-a004-000000000001'); -- Granted by Samuel (admin, Jakmall)
```

UUID namespace for user_company_access rows: `a005` (`00000000-0000-4000-a005-000000000XXX`) — RFC 4122 v4 compliant (pos 13 = '4', pos 17 = 'a').

Do not add id_counters rows unless grepping seed.sql confirms they are missing for companies 002-004 — the existing seed may already include them outside the visible range.
  </action>
  <verify>
`grep -c "user_company_access" supabase/seed.sql` returns at least 1.
  </verify>
  <done>seed.sql section 8 exists with INSERT granting Eva access to Jakmall. Running `supabase db reset` will produce a test environment where eva@jaknot.com can read both Jaknot and Jakmall data.</done>
</task>

</tasks>

<verification>
After all tasks complete:
1. Admin can save company access for a user without "Could not find table 'public.user_company_access'" error
2. Login as eva@jaknot.com (after `supabase db reset`) — Requests page shows requests from both Jaknot AND Jakmall
3. Login as agus@jaknot.com (GA Lead, no extra access) — shows ONLY Jaknot requests
4. Login as okka@jakmall.com — shows ONLY Jakmall data
</verification>

<success_criteria>
- `supabase db push` completes with no errors (all 19 migrations including 00018 applied to remote)
- `supabase/migrations/00020_rls_multi_company_access.sql` exists with 3 DROP + 3 CREATE POLICY statements, each using OR EXISTS subquery against user_company_access
- `supabase/seed.sql` has section 8 with at least one user_company_access INSERT for Eva → Jakmall
- INSERT and UPDATE policies are NOT modified (only SELECT policies expanded)
- Single-company users unaffected: OR EXISTS returns false when no access rows exist, primary company check passes normally
</success_criteria>

<output>
After completion, create `.planning/quick/49-fix-company-based-data-isolation-user-co/49-SUMMARY.md`
</output>
