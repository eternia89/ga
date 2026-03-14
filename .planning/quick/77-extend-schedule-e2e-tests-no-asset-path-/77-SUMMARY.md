---
phase: quick-77
plan: 1
subsystem: e2e-testing
tags: [e2e, maintenance, schedules, rls, testing]
dependency_graph:
  requires: [quick-69, quick-70, quick-75]
  provides: [regression-guard-schedule-non-asset, regression-guard-auto-create-days-before, regression-guard-rls-cross-company-schedule]
  affects: [e2e/tests/phase-07-maintenance/schedule-crud.spec.ts]
tech_stack:
  added: []
  patterns: [baseTest-for-api-tests, modal-dialog-form-e2e, direct-detail-page-navigation]
key_files:
  created: []
  modified:
    - e2e/tests/phase-07-maintenance/schedule-crud.spec.ts
    - supabase/migrations/00022_categories_partial_unique_index_lower_name.sql
decisions:
  - Used modal dialog (?action=create) instead of /schedules/new route for schedule creation tests
  - Used direct URL navigation (/maintenance/schedules/{id}) to verify detail page content
  - Verified auto_create_days_before via input value assertion (detail page IS edit page)
  - Used baseTest from @playwright/test for API-only RLS test (no browser fixtures needed)
metrics:
  duration: 17
  completed: "2026-03-14T16:36:00Z"
---

# Quick Task 77: Extend Schedule E2E Tests (Non-Asset Path) Summary

3 new E2E tests covering non-asset schedule creation, auto_create_days_before persistence, and cross-company RLS enforcement

## What Was Done

### Task 1: Add 3 new E2E test cases to schedule-crud.spec.ts

Added two new `test.describe` blocks at the end of the existing file:

**Test A: Create schedule WITHOUT asset (non-asset path)**
- Opens schedule create dialog via `/maintenance?action=create` permalink
- Selects a general template (null category_id) created in beforeAll via admin client
- Confirms "No asset required" hint text appears and Asset field is hidden
- Fills interval_days=14, submits form
- Verifies dialog closes and schedule appears in list
- Navigates to schedule detail page by ID, confirms template info renders

**Test B: auto_create_days_before persists with non-zero value**
- Creates schedule with auto_create_days_before=7 via modal dialog
- Navigates directly to detail page by schedule ID
- Asserts the auto_create_days_before input field has value "7"
- Confirms the value round-trips: form -> createSchedule action -> DB -> detail page

**Test C: RLS rejects cross-company schedule INSERT**
- API-level test using Supabase anon client (no browser)
- Signs in as Company A ga_lead
- Attempts INSERT into maintenance_schedules with Company B's company_id
- Asserts RLS WITH CHECK policy rejects the insert (error is not null)
- Uses the same pattern as quick-54-rls/multi-company-rls.spec.ts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Local DB missing migrations 00022-00025**
- **Found during:** Test execution
- **Issue:** Local Supabase DB did not have migrations 00022-00025 applied (nullable company_id on templates, nullable item_id on schedules, auto_create_days_before column). Tests failed with NOT NULL constraint violations.
- **Fix:** Ran `npx supabase db reset` to apply all migrations to local DB. Also fixed migration 00022 to use `CREATE UNIQUE INDEX IF NOT EXISTS` for idempotent execution.
- **Files modified:** supabase/migrations/00022_categories_partial_unique_index_lower_name.sql
- **Commit:** 6f40606

**2. [Rule 1 - Bug] Plan assumed /maintenance/schedules/new route exists**
- **Found during:** Test A execution
- **Issue:** The plan directed tests to navigate to `/maintenance/schedules/new`, but this route does not exist. Schedule creation uses a modal dialog opened via `?action=create` URL param on `/maintenance`.
- **Fix:** Changed Tests A and B to use `/maintenance?action=create` to open the dialog, and interact with the form within the dialog element.
- **Files modified:** e2e/tests/phase-07-maintenance/schedule-crud.spec.ts

**3. [Rule 1 - Bug] Plan expected "7 days before" text on detail page**
- **Found during:** Test B execution
- **Issue:** The plan expected to find "7 days before" text on the detail page. However, the schedule detail page IS the edit page (per CLAUDE.md convention), showing an input field with value "7", not the read-only "7 days before" text.
- **Fix:** Changed assertion to verify the auto_create_days_before input has value "7" via `toHaveValue('7')`.
- **Files modified:** e2e/tests/phase-07-maintenance/schedule-crud.spec.ts

## Test Results

All 3 new tests pass. Pre-existing test failures (Tests 10, 11, 12) are unrelated -- they navigate to `/maintenance/schedules/new` which was replaced by a modal dialog in an earlier quick task.

```
8 passed (20.5s)
- Test A: Create schedule WITHOUT asset (non-asset path) - 5.7s
- Test B: auto_create_days_before persists with non-zero value - 5.8s
- Test C: RLS rejects cross-company schedule INSERT - 6ms
```

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 6f40606 | 3 new E2E tests + migration 00022 IF NOT EXISTS fix |
