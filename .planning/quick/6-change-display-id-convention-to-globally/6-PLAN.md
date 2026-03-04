---
phase: quick-6
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00015_display_id_new_convention.sql
  - app/actions/request-actions.ts
  - app/actions/job-actions.ts
  - app/actions/asset-actions.ts
  - e2e/pages/requests/request-detail.page.ts
  - e2e/pages/jobs/job-detail.page.ts
  - e2e/pages/inventory/asset-detail.page.ts
  - e2e/tests/phase-04-requests/request-submit.spec.ts
  - e2e/tests/phase-04-requests/request-detail.spec.ts
  - e2e/tests/phase-05-jobs/job-crud.spec.ts
  - e2e/tests/phase-05-jobs/job-detail.spec.ts
  - e2e/tests/phase-05-jobs/approval-flow.spec.ts
  - e2e/tests/phase-06-inventory/asset-crud.spec.ts
  - e2e/tests/phase-06-inventory/asset-status-transfer.spec.ts
  - e2e/tests/phase-06-inventory/asset-timeline.spec.ts
  - e2e/tests/phase-08-media-notifications/photo-upload.spec.ts
autonomous: true
requirements: [QUICK-6]

must_haves:
  truths:
    - "New requests get display IDs in format R{CC}-{YY}-{NNN} where CC=2-digit company code"
    - "New jobs get display IDs in format J{CC}-{YY}-{NNN}"
    - "New inventory items get display IDs in format I{CC}-{YY}-{NNN}"
    - "Display IDs are globally unique (not company-scoped)"
    - "Counter is 3-digit alphanumeric (001-999, then 00A-ZZZ)"
    - "PM auto-generated jobs also use the new format"
    - "Existing display IDs in the database are NOT retroactively changed"
  artifacts:
    - path: "supabase/migrations/00015_display_id_new_convention.sql"
      provides: "New unified generate_entity_display_id function, updated generate_pm_jobs, global unique constraints"
    - path: "app/actions/request-actions.ts"
      provides: "Updated RPC call to new function"
    - path: "app/actions/job-actions.ts"
      provides: "Updated RPC call to new function"
    - path: "app/actions/asset-actions.ts"
      provides: "Updated RPC call to new function"
  key_links:
    - from: "app/actions/request-actions.ts"
      to: "generate_entity_display_id"
      via: "supabase.rpc call"
      pattern: "rpc.*generate_entity_display_id.*request"
    - from: "app/actions/job-actions.ts"
      to: "generate_entity_display_id"
      via: "supabase.rpc call"
      pattern: "rpc.*generate_entity_display_id.*job"
    - from: "app/actions/asset-actions.ts"
      to: "generate_entity_display_id"
      via: "supabase.rpc call"
      pattern: "rpc.*generate_entity_display_id.*asset"
    - from: "supabase/migrations/00010_pm_phase7.sql (generate_pm_jobs)"
      to: "generate_entity_display_id"
      via: "SQL function call in generate_pm_jobs"
      pattern: "generate_entity_display_id"
---

<objective>
Change the display ID convention from entity-prefix format (REQ-26-0001, JOB-26-0001, AST-26-0001) to a globally unique format: {R/J/I}{2-digit-company-code}-{YY}-{3-digit-alphanumeric-counter}.

Examples: RAB-25-001 (request), JAB-25-002 (job), IAB-25-003 (inventory item).

Purpose: Make IDs shorter, globally unique, and immediately identifiable by entity type and company.
Output: New DB migration, updated server actions, updated E2E test patterns.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@supabase/migrations/00007_requests_phase4.sql
@supabase/migrations/00008_jobs_phase5.sql
@supabase/migrations/00009_inventory_phase6.sql
@supabase/migrations/00010_pm_phase7.sql
@supabase/migrations/00014_display_id_company_scoped.sql
@app/actions/request-actions.ts
@app/actions/job-actions.ts
@app/actions/asset-actions.ts

<interfaces>
<!-- Current DB functions being replaced -->

From supabase/migrations/00007_requests_phase4.sql:
```sql
-- generate_request_display_id(p_company_id uuid) -> text
-- Format: {company_code}-{YY}-{0001} (e.g., REQ-26-0001 or AB-26-0001)
-- Uses id_counters with entity_type = 'request_{YY}', company-scoped
```

From supabase/migrations/00008_jobs_phase5.sql:
```sql
-- generate_job_display_id(p_company_id uuid) -> text
-- Format: JOB-{YY}-{0001} (hardcoded prefix, no company code)
-- Uses id_counters with entity_type = 'job_{YY}', company-scoped
```

From supabase/migrations/00009_inventory_phase6.sql:
```sql
-- generate_asset_display_id(p_company_id uuid) -> text
-- Format: AST-{YY}-{0001} (hardcoded prefix, no company code)
-- Uses id_counters with entity_type = 'asset_{YY}', company-scoped
```

From supabase/migrations/00001_initial_schema.sql:
```sql
-- generate_display_id(p_company_id uuid, p_entity_type text, p_prefix text) -> text
-- Generic function used by generate_pm_jobs in 00010_pm_phase7.sql
-- Format: {prefix}-{YYYY}-{0001}
```

From supabase/migrations/00010_pm_phase7.sql:
```sql
-- generate_pm_jobs() calls generate_display_id(company_id, 'job', 'JOB')
-- Must be updated to call new function
```

Current server action RPC calls:
```typescript
// request-actions.ts
supabase.rpc('generate_request_display_id', { p_company_id: profile.company_id });

// job-actions.ts
supabase.rpc('generate_job_display_id', { p_company_id: profile.company_id });

// asset-actions.ts
supabase.rpc('generate_asset_display_id', { p_company_id: profile.company_id });
```

Company table has `code text UNIQUE` column (e.g., 'AB', 'C1').
id_counters table: (id, company_id, entity_type, prefix, current_value, reset_period).
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create DB migration with new unified display ID function</name>
  <files>supabase/migrations/00015_display_id_new_convention.sql</files>
  <action>
Create migration `supabase/migrations/00015_display_id_new_convention.sql` that:

**1. Create new unified function `generate_entity_display_id(p_company_id uuid, p_entity_type text)`:**

- `p_entity_type` must be one of: 'request', 'job', 'asset' (validate with IF check, RAISE EXCEPTION if invalid)
- Map entity_type to prefix letter: 'request' -> 'R', 'job' -> 'J', 'asset' -> 'I'
- Look up company code: `SELECT code INTO v_company_code FROM companies WHERE id = p_company_id AND deleted_at IS NULL`
- If company code is NULL or empty, RAISE EXCEPTION 'Company code is required for display ID generation'
- The company code MUST be exactly 2 characters. If it is not, RAISE EXCEPTION.
- Get 2-digit year: `TO_CHAR(NOW(), 'YY')`
- Counter key: use `entity_type || '_' || v_year_key` as the entity_type in id_counters, but use a NEW row with `company_id = '00000000-0000-0000-0000-000000000000'::uuid` (a sentinel nil UUID) to make counters GLOBAL, not per-company. This ensures globally unique counters.
- Actually, simpler approach: use entity_type key `p_entity_type || '_global_' || v_year_key` in id_counters with a fixed sentinel company_id. This avoids conflicting with existing per-company counters.
- UPDATE id_counters SET current_value = current_value + 1 WHERE company_id = '00000000-0000-0000-0000-000000000000'::uuid AND entity_type = v_counter_key RETURNING current_value. If NOT FOUND, INSERT with current_value = 1.
- Counter is 3-digit with zero-padding: `LPAD(v_next_value::text, 3, '0')`. The counter is numeric (001, 002, ..., 999). For now, just use numeric zero-padded 3 digits. If it exceeds 999, it naturally becomes 4+ digits which is fine.
- Return format: `v_prefix_letter || v_company_code || '-' || v_year_key || '-' || LPAD(v_next_value::text, 3, '0')`
- Example: `RAB-26-001`, `JAB-26-002`, `IAB-26-003`
- Function must be SECURITY DEFINER SET search_path = public (same as existing functions)

**2. Update generate_pm_jobs() function:**
Replace the line `v_display_id := generate_display_id(v_schedule.company_id, 'job', 'JOB');` with `v_display_id := generate_entity_display_id(v_schedule.company_id, 'job');`

Use CREATE OR REPLACE FUNCTION to redefine generate_pm_jobs() with the updated call. Copy the FULL function body from 00010_pm_phase7.sql but change only the display_id generation line.

**3. Update unique constraints to be globally unique (not company-scoped):**
```sql
-- Requests: drop company-scoped, add global unique
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_display_id_company_unique;
ALTER TABLE public.requests ADD CONSTRAINT requests_display_id_key UNIQUE (display_id);

-- Jobs: drop company-scoped, add global unique
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_display_id_company_unique;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_display_id_key UNIQUE (display_id);

-- Assets: drop company-scoped, add global unique
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS assets_display_id_company_unique;
ALTER TABLE public.inventory_items ADD CONSTRAINT inventory_items_display_id_key UNIQUE (display_id);
```

**4. Do NOT drop the old functions** (generate_request_display_id, generate_job_display_id, generate_asset_display_id, generate_display_id) — they may be referenced elsewhere and can be cleaned up later. Just stop calling them.

**5. Do NOT retroactively update existing display_ids** — old records keep their existing IDs.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && cat supabase/migrations/00015_display_id_new_convention.sql | head -5 && grep -c "generate_entity_display_id" supabase/migrations/00015_display_id_new_convention.sql && grep -c "generate_pm_jobs" supabase/migrations/00015_display_id_new_convention.sql</automated>
  </verify>
  <done>Migration file exists with: (1) generate_entity_display_id function producing R/J/I{CC}-{YY}-{NNN} format, (2) updated generate_pm_jobs using new function, (3) global unique constraints on display_id columns.</done>
</task>

<task type="auto">
  <name>Task 2: Update server actions and E2E tests for new display ID format</name>
  <files>
    app/actions/request-actions.ts
    app/actions/job-actions.ts
    app/actions/asset-actions.ts
    e2e/pages/requests/request-detail.page.ts
    e2e/pages/jobs/job-detail.page.ts
    e2e/pages/inventory/asset-detail.page.ts
    e2e/tests/phase-04-requests/request-submit.spec.ts
    e2e/tests/phase-04-requests/request-detail.spec.ts
    e2e/tests/phase-05-jobs/job-crud.spec.ts
    e2e/tests/phase-05-jobs/job-detail.spec.ts
    e2e/tests/phase-05-jobs/approval-flow.spec.ts
    e2e/tests/phase-06-inventory/asset-crud.spec.ts
    e2e/tests/phase-06-inventory/asset-status-transfer.spec.ts
    e2e/tests/phase-06-inventory/asset-timeline.spec.ts
    e2e/tests/phase-08-media-notifications/photo-upload.spec.ts
  </files>
  <action>
**Server actions — change RPC calls to use new unified function:**

In `app/actions/request-actions.ts` (createRequest action, around line 24-25):
- Change: `.rpc('generate_request_display_id', { p_company_id: profile.company_id })`
- To: `.rpc('generate_entity_display_id', { p_company_id: profile.company_id, p_entity_type: 'request' })`

In `app/actions/job-actions.ts` (createJob action, around line 24-25):
- Change: `.rpc('generate_job_display_id', { p_company_id: profile.company_id })`
- To: `.rpc('generate_entity_display_id', { p_company_id: profile.company_id, p_entity_type: 'job' })`

In `app/actions/asset-actions.ts` (createAsset action, around line 38-39):
- Change: `.rpc('generate_asset_display_id', { p_company_id: profile.company_id })`
- To: `.rpc('generate_entity_display_id', { p_company_id: profile.company_id, p_entity_type: 'asset' })`

**E2E page objects — update regex patterns to match new format:**

The new format starts with R, J, or I followed by a 2-char company code, dash, 2-digit year, dash, counter.
Pattern examples: `RAB-26-001`, `JAB-26-002`, `IAB-26-003`

Both old (REQ-xx-xxxx, JOB-xx-xxxx, AST-xx-xxxx) and new format IDs may coexist in the DB, so regex patterns must match BOTH formats.

In `e2e/pages/requests/request-detail.page.ts` line 20:
- Change: `await expect(this.page.locator('text=/REQ-/')).toContainText(pattern);`
- To: `await expect(this.page.locator('text=/R[A-Z0-9]/')).toContainText(pattern);`
  (Matches both REQ- old format and R{CC}- new format since both start with R followed by alphanumeric)

In `e2e/pages/jobs/job-detail.page.ts` line 20:
- Change: `await expect(this.page.locator('text=/JOB-/')).toContainText(pattern);`
- To: `await expect(this.page.locator('text=/J[A-Z0-9]/')).toContainText(pattern);`
  (Matches both JOB- old format and J{CC}- new format)

In `e2e/pages/inventory/asset-detail.page.ts` line 20:
- Change: `await expect(this.page.locator('text=/AST-/')).toContainText(pattern);`
- To: `await expect(this.page.locator('text=/I[A-Z0-9]/')).toContainText(pattern);`
  (But old assets use AST- which starts with A not I. Since old data may still exist, use a broader pattern)
- Actually better: `await expect(this.page.locator('text=/(AST|I[A-Z0-9])/')).toContainText(pattern);`

**E2E test specs — update all hardcoded regex patterns:**

In `e2e/tests/phase-04-requests/request-submit.spec.ts` (line 22-23):
- Change: `await expect(generalUserPage.locator('text=/REQ-/')).toBeVisible(...)`
- To: `await expect(generalUserPage.locator('text=/R[A-Z0-9]/')).toBeVisible(...)`
- Update comment: `// Verify request ID was generated (R{CC}-{YY}-{NNN} format)`

In `e2e/tests/phase-04-requests/request-detail.spec.ts` (line 22):
- Change: `await expect(generalUserPage.locator('text=/REQ-/')).toBeVisible()`
- To: `await expect(generalUserPage.locator('text=/R[A-Z0-9]/')).toBeVisible()`

In `e2e/tests/phase-05-jobs/job-crud.spec.ts` (line 25):
- Change: `await expect(gaLeadPage.locator('text=/JOB-/')).toBeVisible(...)`
- To: `await expect(gaLeadPage.locator('text=/J[A-Z0-9]/')).toBeVisible(...)`

In `e2e/tests/phase-05-jobs/job-detail.spec.ts` (line 37):
- Change: `await expect(gaLeadPage.locator('text=/JOB-/')).toBeVisible()`
- To: `await expect(gaLeadPage.locator('text=/J[A-Z0-9]/')).toBeVisible()`

In `e2e/tests/phase-05-jobs/approval-flow.spec.ts` (line 51):
- Change: `await approvals.expectApprovalInList(/JOB-/)`
- To: `await approvals.expectApprovalInList(/J[A-Z0-9]/)`

In `e2e/tests/phase-05-jobs/approval-flow.spec.ts` (line 101):
- Change: `await expect(gaLeadPage.locator('text=/JOB-/')).toBeVisible()`
- To: `await expect(gaLeadPage.locator('text=/J[A-Z0-9]/')).toBeVisible()`

In `e2e/tests/phase-06-inventory/asset-crud.spec.ts`:
- Line 27 comment: Change `AST-YY-NNNN` to `I{CC}-{YY}-{NNN}`
- Line 150: Change `heading, { name: /AST-/ }` to `heading, { name: /(AST-|I[A-Z0-9])/ }`
- Line 167: Same change
- Line 201-202: Update comment and change `heading, { name: /AST-/ }` to same pattern

In `e2e/tests/phase-06-inventory/asset-status-transfer.spec.ts` (line 66):
- Change: `` return `AST-E2E-${prefix}-${rand}`; ``
- To: `` return `IE2-26-${rand.slice(0,3)}`; ``
  (Use a format that matches the new convention for test data)
- Actually, this is for directly inserted test data (not via the RPC function), so it just needs to be unique. Keep it as-is since it's test seed data that won't conflict.
- BUT the unique constraint is now global on display_id, so it still needs to be unique. The existing format `AST-E2E-ST-XXXX` is fine for uniqueness since it won't collide with the new `I{CC}-{YY}-{NNN}` format.
- Leave this file unchanged.

In `e2e/tests/phase-06-inventory/asset-timeline.spec.ts` (line 25):
- The `display_id: 'AST-E2E-TL-${rand}'` is directly inserted test data. Leave as-is (won't collide with new format).

In `e2e/tests/phase-08-media-notifications/photo-upload.spec.ts`:
- Line 123 comment: Update `REQ-ID` to `Request ID`
- Line 125: Change `'text=/REQ-/'` to `'text=/R[A-Z0-9]/'`
- Line 139-140: Change comment and `'text=/REQ-/'` to `'text=/R[A-Z0-9]/'`
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -c "generate_entity_display_id" app/actions/request-actions.ts app/actions/job-actions.ts app/actions/asset-actions.ts && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>All three server actions call generate_entity_display_id with appropriate entity_type parameter. All E2E test patterns updated to match new R/J/I-prefixed display ID format. Build succeeds.</done>
</task>

</tasks>

<verification>
1. Migration file exists at `supabase/migrations/00015_display_id_new_convention.sql`
2. `generate_entity_display_id` function produces format `{R/J/I}{CC}-{YY}-{NNN}`
3. All three server actions (request, job, asset) call `generate_entity_display_id`
4. PM job generation function updated to use new function
5. E2E test patterns match both old and new display ID formats
6. `npm run build` passes
</verification>

<success_criteria>
- New requests/jobs/assets created via the app get display IDs in the format R{CC}-YY-NNN / J{CC}-YY-NNN / I{CC}-YY-NNN
- Counter is globally unique (not company-scoped)
- PM auto-generated jobs also use the new format
- Build passes without errors
- Existing old-format display IDs are not modified
</success_criteria>

<output>
After completion, create `.planning/quick/6-change-display-id-convention-to-globally/6-SUMMARY.md`
</output>
