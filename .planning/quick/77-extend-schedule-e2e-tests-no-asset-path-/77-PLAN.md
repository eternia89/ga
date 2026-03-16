---
phase: quick-77
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/tests/phase-07-maintenance/schedule-crud.spec.ts
autonomous: true
requirements: [QUICK-77]

must_haves:
  truths:
    - "A schedule can be created without selecting an asset (non-asset path), and it persists with correct company_id"
    - "auto_create_days_before set to a non-zero value during creation is visible on the schedule detail page"
    - "Creating a schedule for a company the user lacks access to is rejected with an error"
  artifacts:
    - path: "e2e/tests/phase-07-maintenance/schedule-crud.spec.ts"
      provides: "3 new E2E test cases extending existing schedule test suite"
      contains: "without asset"
  key_links:
    - from: "e2e/tests/phase-07-maintenance/schedule-crud.spec.ts"
      to: "app/actions/schedule-actions.ts"
      via: "createSchedule server action invoked through UI form submission"
      pattern: "create.*schedule"
    - from: "e2e/tests/phase-07-maintenance/schedule-crud.spec.ts"
      to: "components/maintenance/schedule-form.tsx"
      via: "auto_create_days_before form field interaction"
      pattern: "auto.create"
---

<objective>
Add 3 new E2E test cases to the existing schedule-crud.spec.ts file that guard the authorization fix from quick-75 (company access validation on createSchedule non-asset branch) and the auto_create_days_before feature from quick-70.

Purpose: Prevent regressions on the no-asset schedule creation path, the auto_create_days_before field persistence, and the cross-company authorization guard.
Output: Extended E2E test file with 3 new passing test cases.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@e2e/tests/phase-07-maintenance/schedule-crud.spec.ts
@app/actions/schedule-actions.ts
@components/maintenance/schedule-form.tsx
@components/maintenance/schedule-detail.tsx
@e2e/fixtures/index.ts
@e2e/fixtures/authenticated-page.ts
@e2e/fixtures/test-data.ts
@e2e/fixtures/supabase-admin.ts
@e2e/pages/maintenance/schedule-new.page.ts
@e2e/pages/maintenance/schedule-detail.page.ts
@e2e/pages/maintenance/schedule-list.page.ts
@e2e/pages/shared/combobox.page.ts
@e2e/pages/shared/inline-feedback.page.ts
@e2e/helpers/seed.ts
@lib/validations/schedule-schema.ts
@e2e/tests/quick-54-rls/multi-company-rls.spec.ts

<interfaces>
<!-- Key types and contracts the executor needs -->

From e2e/fixtures/authenticated-page.ts:
```typescript
type RoleFixtures = {
  adminPage: Page;
  gaLeadPage: Page;
  gaStaffPage: Page;
  financeApproverPage: Page;
  generalUserPage: Page;
  testData: TestData;
};
```

From e2e/helpers/seed.ts:
```typescript
export interface TestData {
  companyId: string;
  divisions: { engineering: string; operations: string };
  locations: { headOffice: string; branchA: string; branchB: string };
  categories: { electrical: string; plumbing: string; furniture: string; electronics: string };
  users: {
    admin: { id: string; email: string; password: string };
    gaLead: { id: string; email: string; password: string };
    gaStaff: { id: string; email: string; password: string };
    financeApprover: { id: string; email: string; password: string };
    generalUser: { id: string; email: string; password: string };
  };
}
```

From e2e/pages/maintenance/schedule-new.page.ts:
```typescript
export class ScheduleNewPage {
  async goto(): Promise<void>;
  async selectTemplate(name: string): Promise<void>;
  async selectAsset(name: string): Promise<void>;
  async fillIntervalDays(days: string): Promise<void>;
  async selectIntervalType(type: 'Fixed' | 'Floating'): Promise<void>;
  async fillStartDate(date: string): Promise<void>;
  async submit(): Promise<void>;
}
```

From e2e/fixtures/supabase-admin.ts:
```typescript
export function getAdminClient(): SupabaseClient;
```

From lib/validations/schedule-schema.ts:
```typescript
export const scheduleCreateSchema = z.object({
  template_id: z.string().uuid(),
  item_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().optional(),
  interval_days: z.number().int().min(1).max(365),
  interval_type: z.enum(['fixed', 'floating']).default('floating'),
  auto_create_days_before: z.number().int().min(0).max(30).default(0),
  start_date: z.string().max(10).optional(),
});
```

Key detail: On the schedule detail page, auto_create_days_before renders as:
- `"{N} days before"` when > 0
- `"On due date"` when 0

The schedule form hides the Asset combobox and shows "This is a general template (no asset category). No asset required." when a general template (null category_id) is selected.

The createSchedule action (schedule-actions.ts lines 62-79) validates company access for non-asset schedules:
- Falls back to `profile.company_id` when no `company_id` is provided
- Checks `user_company_access` table when `company_id` differs from `profile.company_id`
- Throws "You do not have access to the selected company." on unauthorized
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add 3 new E2E test cases to schedule-crud.spec.ts</name>
  <files>e2e/tests/phase-07-maintenance/schedule-crud.spec.ts</files>
  <action>
Add a NEW test.describe block at the end of the file (after the existing serial block) named "Phase 07 — Schedule Extended Tests (quick-70, quick-75)". This block should contain 3 tests:

**Test A: "Create schedule WITHOUT asset (non-asset path)"**
- Navigate to `/maintenance/schedules/new` via gaLeadPage
- Select a template by clicking the template combobox and picking the first option
- Wait 500ms for the form to update after template selection
- Check if the "general template" hint text is visible (`text=/no asset required/i`). If yes (general template selected), the Asset field should be hidden — confirm it. If no, try selecting a different template that is general, or skip if none available.
- Actually, the simpler approach: Use the admin Supabase client (`getAdminClient()`) in a `beforeAll` to create a guaranteed general template (category_id = null) with a unique name like `E2E General Tmpl ${Date.now()}`. Then in the test, select that template by name.
- After selecting the general template, confirm the hint "This is a general template" or "No asset required" is visible
- Set interval_days to 14
- Set auto_create_days_before to 0 (leave default)
- Click the create/submit button
- Wait for redirect to `/maintenance`
- Verify the schedule list contains an entry (the created schedule should appear)
- Then navigate to the first schedule in the table, confirm the detail page loads
- Clean up: delete the created template and schedule in `afterAll` using the admin client

**Test B: "auto_create_days_before persists with non-zero value"**
- Use the same general template created in `beforeAll`
- Navigate to `/maintenance/schedules/new`
- Select the general template
- Set interval_days to 30
- Fill the auto_create_days_before input with value `7` — locate via `getByLabel(/auto.create/i)` or the input with `name="auto_create_days_before"` (the form field label is "Auto-create job (days before due)")
- Submit the form
- Wait for redirect to `/maintenance`
- Navigate to the schedule list, find the most recently created schedule (first row in table)
- Click into its detail page
- On the detail page, verify the text `7 days before` is visible (this is how `auto_create_days_before: 7` renders — see schedule-detail.tsx line 326-327)
- This confirms the value round-trips through create -> DB -> detail page

**Test C: "Reject schedule creation for unauthorized company (API-level)"**
- This is an API-level test (no browser UI needed), following the same pattern as `e2e/tests/quick-54-rls/multi-company-rls.spec.ts`
- In `beforeAll`, create a Company B (or find existing "E2E Schedule Auth Test Co B") with the admin client, and note its ID
- Create a Supabase anon client and sign in as ga_lead (Company A user)
- Directly call the createSchedule server action... Actually, server actions cannot be called from outside Next.js. Instead, test at the Supabase DB level:
  - As the ga_lead (Company A user), attempt to INSERT directly into `maintenance_schedules` with `company_id = companyBId`, a valid template_id, interval_days=30
  - Expect the RLS INSERT policy to reject the insert (error should not be null)
  - This validates that RLS prevents cross-company schedule creation at the DB layer
  - The server action validation from quick-75 adds an additional application-level guard, but the RLS policy is the ultimate enforcement layer
- Clean up Company B in `afterAll` if created by us

**Implementation structure:**
Use `test.describe.serial` for Tests A and B (they share the same template created in beforeAll, and Test B depends on Test A having run to avoid flakiness). Test C can be in a separate `test.describe` block since it is API-only and independent.

Create the general template and Company B in a single `test.beforeAll` at the describe level. Track IDs for cleanup. Use `test.afterAll` to delete: the template, any schedules created, and Company B (if created by us).

For navigation patterns, use the same style as existing tests in the file:
- `gaLeadPage.goto('/maintenance/schedules/new')`
- `gaLeadPage.waitForLoadState('networkidle')`
- Template selection via combobox: click trigger -> wait -> search for name -> click option
- Use `[cmdk-item]` selector for combobox options (matches existing pattern)

For the RLS cross-company test (Test C), follow the exact pattern from `e2e/tests/quick-54-rls/multi-company-rls.spec.ts`:
- Create anon client: `createClient(supabaseUrl, supabaseAnonKey, { auth: { autoRefreshToken: false, persistSession: false } })`
- Sign in as ga_lead: `client.auth.signInWithPassword({ email, password })`
- Attempt insert: `client.from('maintenance_schedules').insert({ company_id: companyBId, template_id, interval_days: 30, ... })`
- Assert: `expect(error).not.toBeNull()`

Import `createClient` from `@supabase/supabase-js` (only needed for Test C block). Import `getAdminClient` from `../../fixtures/supabase-admin` and `getTestData` from `../../fixtures/test-data`.

Do NOT modify the existing tests (Tests 10, 11, 12, 13, 14, 15, 21). Only append new describe blocks after line 197.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx playwright test e2e/tests/phase-07-maintenance/schedule-crud.spec.ts --reporter=list 2>&1 | tail -30</automated>
  </verify>
  <done>
All existing tests (10, 11, 12, 13, 14, 21) continue to pass. Three new tests pass:
1. Schedule created without asset, detail page loads showing template name
2. auto_create_days_before=7 persists and shows "7 days before" on detail page
3. RLS rejects cross-company schedule INSERT (error is not null)
  </done>
</task>

</tasks>

<verification>
Run the full schedule-crud spec to confirm all tests pass (both existing and new):
```bash
cd /Users/melfice/code/ga && npx playwright test e2e/tests/phase-07-maintenance/schedule-crud.spec.ts --reporter=list
```

Expected: All tests pass with no failures. The new test describe blocks should show 3 additional passing tests beyond the existing 6.
</verification>

<success_criteria>
- 3 new E2E tests added to schedule-crud.spec.ts
- Test A: Creates schedule without asset, verifies it exists on detail page
- Test B: Sets auto_create_days_before=7, verifies "7 days before" on detail page
- Test C: RLS blocks cross-company schedule INSERT at DB level
- All existing tests (10, 11, 12, 13, 14, 21) remain green
- Proper cleanup in afterAll (no leaked test data)
</success_criteria>

<output>
After completion, create `.planning/quick/77-extend-schedule-e2e-tests-no-asset-path-/77-SUMMARY.md`
</output>
