---
phase: quick-54
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/tests/quick-54-rls/multi-company-rls.spec.ts
  - __tests__/actions/user-company-access.test.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "A general_user from Company A cannot read requests, jobs, or inventory_items belonging to Company B"
    - "A general_user from Company A can read their own company's requests, jobs, and inventory_items"
    - "INSERT into requests/jobs/inventory_items is rejected when company_id does not match the user's primary company"
    - "updateUserCompanyAccess schema rejects non-UUID user IDs"
    - "updateUserCompanyAccess schema rejects non-UUID values in the companyIds array"
    - "updateUserCompanyAccess schema accepts an empty companyIds array (clearing all access)"
  artifacts:
    - path: "e2e/tests/quick-54-rls/multi-company-rls.spec.ts"
      provides: "Playwright API-level E2E tests for multi-company RLS isolation"
    - path: "__tests__/actions/user-company-access.test.ts"
      provides: "Vitest unit tests for updateUserCompanyAccess Zod schema validation"
  key_links:
    - from: "e2e/tests/quick-54-rls/multi-company-rls.spec.ts"
      to: "supabase/migrations/00020_rls_multi_company_access.sql"
      via: "Supabase anon-key client authenticated as user A, queries rows owned by company B"
      pattern: "supabase.*from.*requests.*eq.*company_id"
    - from: "__tests__/actions/user-company-access.test.ts"
      to: "app/actions/user-company-access-actions.ts"
      via: "Direct schema.parse() calls on updateUserCompanyAccessSchema extracted from action definition"
      pattern: "updateUserCompanyAccessSchema.*parse"
---

<objective>
Add two automated test files: an API-level E2E test verifying multi-company RLS isolation, and a Vitest unit test for the updateUserCompanyAccess action schema.

Purpose: Provide regression coverage for the multi-company RLS policies in migration 00020 and the input validation logic in user-company-access-actions.ts.
Output: Two test files executable via `npm test` (Vitest) and `npm run test:e2e` (Playwright).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/54-add-multi-company-rls-e2e-test-and-updat/54-PLAN.md

<interfaces>
<!-- Key contracts the executor needs. No codebase exploration required. -->

From app/actions/user-company-access-actions.ts:
```typescript
// updateUserCompanyAccess uses adminActionClient with this schema:
z.object({
  userId: z.string().uuid(),
  companyIds: z.array(z.string().uuid()),
})
// Note: companyIds CAN be empty array (clears all access).
// No .min(1) constraint — empty array is intentional and valid.
```

From e2e/fixtures/supabase-admin.ts:
```typescript
export function getAdminClient(): SupabaseClient
// Uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars
// Bypasses RLS (service role)
```

From e2e/helpers/seed.ts — TestData shape:
```typescript
export interface TestData {
  companyId: string; // E2E Test Corp company ID
  users: {
    admin: { id: string; email: string; password: string };
    gaLead: { id: string; email: string; password: string };
    gaStaff: { id: string; email: string; password: string };
    generalUser: { id: string; email: string; password: string };
  };
}
```

RLS pattern (migration 00020):
- requests SELECT: company_id = current_user_company_id() OR EXISTS in user_company_access
- jobs SELECT: same pattern
- inventory_items SELECT: same pattern
- INSERT/UPDATE: still restricted to current_user_company_id() only (no multi-company writes)

From supabase/migrations/00018_user_company_access.sql:
```sql
-- user_company_access has no INSERT/UPDATE/DELETE policies
-- Only service role can write; users can SELECT own rows
```

Vitest config: include pattern is `__tests__/**/*.test.ts`
Playwright config: testDir is `.` (e2e/), tests in e2e/tests/
E2E uses `e2e/.env.local` via dotenv for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Unit test — updateUserCompanyAccess schema validation</name>
  <files>__tests__/actions/user-company-access.test.ts</files>
  <behavior>
    - Test 1: valid input {userId: valid UUID, companyIds: [valid UUID]} passes schema
    - Test 2: non-UUID userId (e.g., "not-a-uuid") fails schema with validation error
    - Test 3: companyIds array containing a non-UUID string fails schema
    - Test 4: empty companyIds array is valid (clearing all access is intentional)
    - Test 5: missing userId field fails schema
    - Test 6: companyIds not an array (e.g., string) fails schema
    - Test 7: null companyIds fails schema
  </behavior>
  <action>
Create `__tests__/actions/user-company-access.test.ts`.

Extract the Zod schema inline — do NOT import from the action file (it uses 'use server' and next-safe-action, which would pull in server-side deps). Instead, redeclare the schema directly in the test:

```typescript
import { z } from 'zod';

const updateUserCompanyAccessSchema = z.object({
  userId: z.string().uuid(),
  companyIds: z.array(z.string().uuid()),
});
```

Write a RED test first (run `npm test -- --reporter=verbose 2>&1 | head -30` to confirm failure), then implement to pass. Use `describe` + `it` blocks matching the behavior list above. Use `safeParse` to check validity without throwing.

Use RFC 4122-compliant test UUIDs: `00000000-0000-4000-a000-000000000001`, `00000000-0000-4000-a000-000000000002`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npm test -- --reporter=verbose 2>&1 | tail -20</automated>
  </verify>
  <done>All 7 schema tests pass. `npm test` exits 0.</done>
</task>

<task type="auto">
  <name>Task 2: E2E test — multi-company RLS isolation (API-level)</name>
  <files>e2e/tests/quick-54-rls/multi-company-rls.spec.ts</files>
  <action>
Create `e2e/tests/quick-54-rls/multi-company-rls.spec.ts`.

This is an API-level Playwright test — no browser UI needed, uses Supabase JS client directly. Place within the e2e/tests directory so it is picked up by the main Playwright config (`testDir: '.'`).

**Test structure:**

```typescript
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { getAdminClient } from '../../fixtures/supabase-admin';
```

**Setup (beforeAll):**
1. Use admin client to create a second company: `E2E Company B` — use `findOrCreate` pattern (SELECT first, INSERT if missing). Store `companyBId`.
2. Create a user `rls-user-b@gmail.com` with role `general_user`, `company_id = companyBId` via `supabase.auth.admin.createUser()`. Store `userBId`.
3. Use admin client to insert one test row in each of `requests`, `jobs`, `inventory_items` belonging to `companyBId`. Store the inserted row IDs.
4. Create an anon-key Supabase client authenticated as `gaLead` (from `process.env` or hardcoded E2E creds: `ga-lead@gmail.com` / `asdf1234`) pointing to Company A — this represents a Company A user.

**Tests:**

Test 1: "Company A user cannot SELECT Company B's requests"
- Sign in as ga_lead (Company A user) using anon key + `signInWithPassword`
- Query `requests` WHERE `id = companyBRequestId`
- Expect result `data` to be empty array (RLS blocks cross-company read)

Test 2: "Company A user cannot SELECT Company B's jobs"
- Same auth, query `jobs` WHERE `id = companyBJobId`
- Expect empty array

Test 3: "Company A user cannot SELECT Company B's inventory_items"
- Same auth, query `inventory_items` WHERE `id = companyBAssetId`
- Expect empty array

Test 4: "Company A user CAN SELECT their own company's requests"
- Query `requests` WHERE `company_id = companyAId` (from existing seed data)
- Expect at least 0 rows and no RLS error (i.e., `error` is null — the query succeeds even if empty)

Test 5: "Company A user cannot INSERT a request with Company B's company_id"
- Attempt INSERT into `requests` with `company_id = companyBId`, minimum required fields
- Expect `error` is not null (RLS blocks cross-company writes)

**Cleanup (afterAll):**
- Delete the test rows inserted in setup using admin client
- Delete `rls-user-b@gmail.com` via `supabase.auth.admin.deleteUser(userBId)`
- Delete Company B if it was freshly created (SELECT deleted_at IS NULL guard)

**Important notes:**
- Use anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) for the authenticated client, not service role
- `signInWithPassword` on anon client returns session; set `auth.session` on the client
- Company A's companyId is available from the seed `.auth/test-data.json` — load via `getTestData()` from `../../fixtures/test-data`
- For requests INSERT: use minimum required fields only — `company_id`, `description` (text, max 200), `status: 'submitted'`. Do NOT add `category_id`, `location_id` etc. as foreign keys that would fail before RLS check. Check actual requests table schema by looking at what the seed inserts.
- Use `test.describe('quick-54 — Multi-Company RLS Isolation')` wrapper

**To check what fields requests/jobs/inventory_items require, grep the migration files:**
Run: `grep -n "NOT NULL" /Users/melfice/code/ga/supabase/migrations/00001_initial_schema.sql | head -40` to discover required columns before writing INSERT payloads.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx playwright test e2e/tests/quick-54-rls/multi-company-rls.spec.ts --config e2e/playwright.config.ts --reporter=list 2>&1 | tail -30</automated>
  </verify>
  <done>All 5 RLS isolation tests pass. Cross-company SELECT returns empty results. Cross-company INSERT returns an error. Tests are self-cleaning (no orphaned data).</done>
</task>

</tasks>

<verification>
- `npm test` exits 0, all unit tests pass including the 7 new schema tests
- `npx playwright test e2e/tests/quick-54-rls/` passes all 5 RLS tests
- No orphaned test data left in DB after test run (cleanup in afterAll)
- `npm run lint` reports no new lint errors
</verification>

<success_criteria>
- Unit test: 7 cases cover valid input, non-UUID userId, non-UUID in companyIds, empty array, missing userId, wrong type for companyIds, null companyIds
- E2E test: 5 cases confirm Company A user is blocked from Company B reads (3 tables) and cross-company INSERT, and can successfully query their own company's data
- Both test files are self-contained and runnable without manual setup beyond the existing global-setup seed
</success_criteria>

<output>
After completion, create `.planning/quick/54-add-multi-company-rls-e2e-test-and-updat/54-SUMMARY.md` documenting what was built, any gotchas encountered, and the final test counts.
</output>
