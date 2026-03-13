---
phase: quick-67
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/tests/quick-62-66-asset-transfer-and-ux/transfer-and-ux.spec.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Location-mode transfer ('Move Asset' button) closes dialog and asset shows no In Transit / pending state after submit"
    - "New Asset dialog (create flow) shows a Company field that is pre-filled"
    - "Assets table has a 'Created' column header"
    - "Schedules table has a 'Created' column header"
    - "Breadcrumb on /inventory/new shows 'Assets' (not 'Inventory') as the first crumb"
    - "Assets sidebar nav item is visible to ga_lead users"
    - "Template name cell uses whitespace-normal break-words (not truncate) — verified structurally"
  artifacts:
    - path: "e2e/tests/quick-62-66-asset-transfer-and-ux/transfer-and-ux.spec.ts"
      provides: "E2E test file covering quick-62 through quick-66 behaviours"
  key_links:
    - from: "e2e/tests/quick-62-66-asset-transfer-and-ux/transfer-and-ux.spec.ts"
      to: "e2e/fixtures/index.ts"
      via: "import { test, expect } from '../../fixtures'"
      pattern: "from '../../fixtures'"
    - from: "transfer-and-ux.spec.ts"
      to: "e2e/helpers/seed.ts (TestData)"
      via: "getTestData() for companyId, locations, categories, users"
      pattern: "getTestData"
---

<objective>
Write a single Playwright E2E spec file covering the observable behaviours introduced in quick-62 through quick-66.

Purpose: Provide regression coverage so future changes can't silently break location-only auto-accept transfers, company field presence in the asset create dialog, table column additions (Created on assets/schedules), breadcrumb label correctness, and Assets sidebar visibility.

Output: `e2e/tests/quick-62-66-asset-transfer-and-ux/transfer-and-ux.spec.ts`
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@e2e/fixtures/index.ts
@e2e/fixtures/authenticated-page.ts
@e2e/fixtures/test-data.ts
@e2e/helpers/seed.ts
@e2e/helpers/selectors.ts
@e2e/tests/phase-06-inventory/asset-status-transfer.spec.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Write E2E spec for quick-62 through quick-66</name>
  <files>e2e/tests/quick-62-66-asset-transfer-and-ux/transfer-and-ux.spec.ts</files>
  <action>
Create the directory and spec file. Follow the exact patterns from `e2e/tests/phase-06-inventory/asset-status-transfer.spec.ts`:
- Import: `import { test, expect } from '../../fixtures';`
- Import: `import { createClient } from '@supabase/supabase-js';`
- Import: `import { getTestData } from '../../fixtures/test-data';`
- Admin client helper inline (same pattern as asset-status-transfer.spec.ts)
- `test.describe.serial(...)` wrapper for the full suite

Structure five describe blocks (one per quick task). All DB setup via admin client insert in `beforeAll`; cleanup in `afterAll`.

**Describe 1 — quick-62: Location-mode transfer auto-accepts**

beforeAll: Create test asset via admin client (table: `inventory_items`, fields: company_id, display_id (use uniqueDisplayId helper), name, category_id=data.categories.furniture, location_id=data.locations.headOffice, status='active', acquisition_date='2026-01-15').
afterAll: Delete inventory_movements then inventory_items for test asset.

Test "location-mode transfer completes immediately (no pending state)":
- Use `gaLeadPage`, navigate to `/inventory/{assetId}`
- Click button with name /transfer/i
- Dialog opens — verify heading /Transfer Asset/i
- The dialog has two mode buttons. Click the button containing text "Move to Location" (i.e. `dialog.getByRole('button', { name: /Move to Location/i })`). This switches to location mode.
- Wait 200ms, then select first option from the location combobox (`dialog.locator('button[role="combobox"]').first()` → click → wait 300ms → `page.locator('[cmdk-item]').first().click()`)
- Photo upload section should NOT be visible in location mode (no `input[type="file"]` inside dialog, or it is hidden). Assert: `await expect(dialog.locator('input[type="file"]')).not.toBeVisible()` (use `{ timeout: 2000 }`).
- Submit button text is /Move Asset/i. Click it.
- Dialog closes: `await expect(dialog).not.toBeVisible({ timeout: 10_000 })`
- Reload page, wait networkidle
- Assert NO "In Transit" text: `await expect(gaLeadPage.locator('text=/In Transit/i')).not.toBeVisible({ timeout: 5_000 })`
- Assert no "Transfer in Progress" banner: `await expect(gaLeadPage.locator('text=/Transfer in Progress/i')).not.toBeVisible({ timeout: 5_000 })`

**Describe 2 — quick-65: Asset create dialog shows Company field**

No DB setup needed (navigation-only test).

Test "New Asset dialog shows Company field pre-filled":
- Use `gaLeadPage`, navigate to `/inventory`
- Click the "New Asset" button (CTA in page header): `gaLeadPage.getByRole('button', { name: /New Asset/i })`
- Dialog opens
- Verify a label with text "Company" is visible inside the dialog: `await expect(dialog.locator('text=/Company/i').first()).toBeVisible()`
- Verify a non-empty input or display element is associated with Company. The field renders either a disabled Input (single-company user) or a Combobox. The GA Lead is a single-company user, so it should be a disabled input. Assert: `await expect(dialog.locator('input[disabled]').first()).toBeVisible()` — OR more specifically, locate the company label then check its sibling for content.
  Use: `const companyInput = dialog.locator('label:has-text("Company") ~ * input, label:has-text("Company") + div input').first()` — if not found, fall back to checking the dialog contains a filled value via `dialog.locator('text=/E2E Test Corp/i')`.

**Describe 3 — quick-66 (a): Assets table has Created column**

Test "Assets table shows Created column header":
- Use `gaLeadPage`, navigate to `/inventory`
- Wait for table: `await expect(gaLeadPage.locator('table')).toBeVisible()`
- Get all column header texts: `await gaLeadPage.locator('thead th').allTextContents()`
- Assert at least one header includes "Created" (case-insensitive check on joined string)

**Describe 4 — quick-66 (b): Schedules table has Created column**

Test "Schedules table shows Created column header":
- Use `gaLeadPage`, navigate to `/maintenance/schedules`
- Wait for table
- Get all column header texts
- Assert at least one includes "Created"

**Describe 5 — quick-66 (c): Breadcrumb and sidebar**

Test "Breadcrumb on /inventory/new shows Assets":
- Use `gaLeadPage`, navigate to `/inventory/new`
- Locate the breadcrumb. Breadcrumb is rendered by `SetBreadcrumbs`. Check for a breadcrumb link: `await expect(gaLeadPage.locator('nav[aria-label="breadcrumb"] a', { hasText: /^Assets$/i }).or(gaLeadPage.locator('a[href="/inventory"]:has-text("Assets")'))).toBeVisible({ timeout: 5_000 })`

Test "Assets nav item visible to ga_lead in sidebar":
- Use `gaLeadPage`, navigate to `/inventory`
- Sidebar `aside` should contain an anchor linking to `/inventory` with text containing "Assets": `await expect(gaLeadPage.locator('aside a[href="/inventory"]')).toBeVisible()`

**uniqueDisplayId helper** — define at top of file (same as phase-06 spec):
```ts
function uniqueDisplayId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AST-E2E-${prefix}-${rand}`;
}
```

**Type safety:** Use `let testAssetId: string | null = null;` declared outside describe, set in beforeAll.

**Skip guards:** Use `test.skip(!testAssetId, 'No test asset created');` at top of any test that requires DB-created data.

Do NOT test quick-63 (photo upload failure — requires network interception, not worth the fragility). Do NOT test quick-64 DB-level uniqueness (not E2E testable). The app-layer duplicate category check is already covered in admin settings tests.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --project tsconfig.json 2>&1 | grep -i "e2e/tests/quick-62-66" | head -20; echo "TSC exit: $?"</automated>
  </verify>
  <done>
File exists at `e2e/tests/quick-62-66-asset-transfer-and-ux/transfer-and-ux.spec.ts`. TypeScript compiles without errors on that file. Test count: 7 tests across 5 describe blocks covering quick-62 (location transfer), quick-65 (company field), quick-66 (Created columns ×2, breadcrumb, sidebar nav).
  </done>
</task>

</tasks>

<verification>
After the spec is written, run TypeScript check:

```bash
cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | tail -5
```

Zero errors = ready to commit.

Optionally smoke-run one test (if dev server is up):
```bash
cd /Users/melfice/code/ga && npx playwright test e2e/tests/quick-62-66-asset-transfer-and-ux/ --reporter=line 2>&1 | tail -20
```
</verification>

<success_criteria>
- `e2e/tests/quick-62-66-asset-transfer-and-ux/transfer-and-ux.spec.ts` exists
- File imports from `../../fixtures` and `../../fixtures/test-data` (correct relative paths)
- TypeScript compiles without errors (`npx tsc --noEmit`)
- 7 distinct tests defined: location transfer auto-accept, company field visible, assets Created column, schedules Created column, breadcrumb label "Assets", sidebar Assets link visible
- Tests use `test.describe.serial`, `beforeAll`/`afterAll` with admin client for DB setup/teardown
- No test depends on mocking or network interception
</success_criteria>

<output>
After completion, create `.planning/quick/67-e2e-tests-for-quick-62-to-quick-66-locat/67-SUMMARY.md` with what was implemented, files created, and any notable decisions made.
</output>
