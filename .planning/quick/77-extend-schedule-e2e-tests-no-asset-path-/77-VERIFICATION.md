---
phase: quick-77
verified: 2026-03-14T17:00:00Z
status: passed
score: 3/3 must-haves verified
re_verification: false
---

# Quick Task 77: Extend Schedule E2E Tests (Non-Asset Path) Verification Report

**Task Goal:** Extend phase-07 schedule E2E tests with 3 new test cases: (1) Create schedule without asset, (2) Set auto_create_days_before to non-zero and verify persistence, (3) Negative test rejecting cross-company schedule creation.
**Verified:** 2026-03-14T17:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A schedule can be created without selecting an asset (non-asset path), and it persists with correct company_id | VERIFIED | Test A (line 253) opens `/maintenance?action=create`, selects a general template (category_id=null created in beforeAll), asserts "no asset required" hint visible, Asset label not visible, submits form, then navigates directly to detail page by ID |
| 2 | auto_create_days_before set to a non-zero value during creation is visible on the schedule detail page | VERIFIED | Test B (line 322) fills auto_create_days_before=7 in dialog, submits, navigates to detail page, asserts `toHaveValue('7')` on the auto-create input field |
| 3 | Creating a schedule for a company the user lacks access to is rejected with an error | VERIFIED | Test C (line 488) signs in as Company A ga_lead via anon client, attempts INSERT into `maintenance_schedules` with Company B's `company_id`, asserts `baseExpect(error).not.toBeNull()` |

**Score:** 3/3 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `e2e/tests/phase-07-maintenance/schedule-crud.spec.ts` | 3 new E2E test cases extending existing schedule test suite | VERIFIED | 509 lines; two new `test.describe` blocks appended after line 207; contains Tests A, B, C with full setup (beforeAll with admin client, afterAll cleanup) |

**Artifact level checks:**

- **Level 1 (Exists):** File present at correct path — confirmed.
- **Level 2 (Substantive):** 509 lines total; original tests (10, 11, 12, 13, 14, 21) preserved unchanged at lines 17-206; new `test.describe.serial` block for Tests A+B at lines 213-387; new `baseTest.describe` block for Test C at lines 393-509. No placeholders, no TODO comments, no empty handlers.
- **Level 3 (Wired):** Tests exercise the actual UI (modal dialog via `?action=create`), the `getAdminClient()` for seeding, the `getTestData()` for user credentials, and `createClient` from `@supabase/supabase-js` for the API-level RLS test. All imports declared at lines 11-15.

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `schedule-crud.spec.ts` | `app/actions/schedule-actions.ts` | createSchedule server action through UI form submit | WIRED | Test A submits the create dialog; `createSchedule` action (schedule-actions.ts lines 34-112) handles the `item_id=null` branch, falls back to `profile.company_id` at line 65, verified by DB query after submit |
| `schedule-crud.spec.ts` | `components/maintenance/schedule-form.tsx` | auto_create_days_before form field interaction | WIRED | Test B fills `getByLabel(/auto.create/i)` which maps to `name="auto_create_days_before"` input at schedule-form.tsx line 408; the value is saved through the action (line 98: `auto_create_days_before: parsedInput.auto_create_days_before ?? 0`) and verified on the detail page edit form |

**Supporting action verification:**
- `schedule-actions.ts` line 65: `companyId = parsedInput.company_id ?? profile.company_id` — company_id fallback for non-asset path confirmed.
- `schedule-actions.ts` line 76: `throw new Error('You do not have access to the selected company.')` — application-level guard confirmed.
- `schedule-actions.ts` line 98: `auto_create_days_before: parsedInput.auto_create_days_before ?? 0` — field persisted to DB confirmed.
- `schedule-form.tsx` line 323: `"This is a general template (no asset category). No asset required."` — hint text matched by Test A's `text=/no asset required/i` assertion.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| QUICK-77 | 77-PLAN.md | Add 3 E2E tests guarding quick-75 (company access) and quick-70 (auto_create_days_before) | SATISFIED | All 3 tests exist, are substantive, and pass per SUMMARY test results |

Note: QUICK-77 does not appear in `.planning/REQUIREMENTS.md` (it is an ad-hoc quick task requirement). The plan's `requirements: [QUICK-77]` field self-describes the task's own ID.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No anti-patterns found |

Scans performed: TODO/FIXME/XXX/HACK, placeholder text, empty `return null/[]/{}`, console.log-only implementations. All clear.

---

### Structural Observations (Non-blocking)

1. **Test describe name mismatch:** The new serial describe block is titled `'Phase 07 — Schedule Extended Tests (quick-70, quick-75)'` (line 213), omitting quick-77 from the title despite being added in quick-77. This is cosmetic and does not affect test execution.

2. **Deviation noted in SUMMARY:** Tests A and B use `?action=create` dialog (not `/maintenance/schedules/new`) because that route does not exist. This is a correct adaptation. Test B asserts `toHaveValue('7')` rather than text `"7 days before"` because the detail page IS the edit page (CLAUDE.md convention). Both deviations are appropriate.

3. **Pre-existing test failures:** The SUMMARY notes Tests 10, 11, 12 (original tests) navigate to `/maintenance/schedules/new` which no longer exists. These failures are pre-existing and outside the scope of quick-77. Quick-77 explicitly avoids modifying existing tests.

---

### Human Verification Required

#### 1. Test A/B UI dialog interaction

**Test:** Run `npx playwright test e2e/tests/phase-07-maintenance/schedule-crud.spec.ts --headed` and observe Tests A and B.
**Expected:** Dialog opens, general template is found and selected, "No asset required" hint appears, form submits, detail page loads with correct interval and auto_create_days_before values.
**Why human:** E2E tests require a running dev server, seeded test database, and Playwright browser — cannot run in verification context. Test results in SUMMARY claim 8 passed (20.5s), but live run would confirm.

#### 2. Test C RLS enforcement

**Test:** Run the Playwright tests and observe Test C in the `Phase 07 — Schedule RLS Cross-Company` describe block.
**Expected:** `baseExpect(error).not.toBeNull()` passes, confirming Supabase RLS WITH CHECK policy blocks cross-company INSERT.
**Why human:** Requires live Supabase instance with RLS policies applied. Cannot verify RLS policy state programmatically in this context.

---

## Summary

Quick task 77 successfully extended the schedule E2E test suite with all 3 required test cases:

- **Test A** (non-asset path): Creates a general template in beforeAll, navigates to the create dialog, confirms the "no asset required" hint and hidden Asset field, submits, and navigates to the detail page by ID.
- **Test B** (auto_create_days_before persistence): Creates a schedule with value 7, navigates to detail page, asserts the edit input has value "7" — correctly adapted for the "detail page IS edit page" convention.
- **Test C** (RLS cross-company rejection): API-level test signing in as Company A user and attempting a direct INSERT with Company B's company_id — asserts the error is not null.

All three tests include proper setup (beforeAll with admin client seeding) and cleanup (afterAll deleting created schedules and templates). The original tests (10, 11, 12, 13, 14, 21) are untouched. Commit `6f40606` contains all changes. No anti-patterns detected.

---

_Verified: 2026-03-14T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
