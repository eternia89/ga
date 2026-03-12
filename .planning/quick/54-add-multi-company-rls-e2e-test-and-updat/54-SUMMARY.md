---
phase: quick-54
plan: 01
subsystem: testing
tags: [rls, multi-company, e2e, unit-test, zod, playwright, supabase]
dependency_graph:
  requires: [migration-00020_rls_multi_company_access, app/actions/user-company-access-actions.ts]
  provides: [regression coverage for multi-company RLS, schema validation coverage for updateUserCompanyAccess]
  affects: []
tech_stack:
  added: []
  patterns: [API-level Playwright test with Supabase JS client, inline Zod schema redeclaration for unit tests]
key_files:
  created:
    - __tests__/actions/user-company-access.test.ts
    - e2e/tests/quick-54-rls/multi-company-rls.spec.ts
  modified: []
decisions:
  - Redeclare Zod schema inline in unit test to avoid importing 'use server' action file with next-safe-action deps
  - Use listUsers(perPage:1000) instead of default page size to reliably detect pre-existing test users across runs
  - Use upsert+updateUserById for user B when already exists — handles partial cleanup from interrupted prior runs
  - Display_id for seeded rows uses Date.now() suffix to guarantee uniqueness across repeated test runs
metrics:
  duration: "18 min"
  completed: "2026-03-12"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Quick Task 54: Multi-Company RLS E2E Test and Unit Test — Summary

**One-liner:** Vitest schema validation for updateUserCompanyAccess + Playwright API-level RLS isolation tests across requests, jobs, and inventory_items.

## What Was Built

### Task 1: Vitest unit tests for updateUserCompanyAccess schema
- File: `__tests__/actions/user-company-access.test.ts`
- 7 test cases covering the `z.object({ userId: z.string().uuid(), companyIds: z.array(z.string().uuid()) })` schema
- Schema is redeclared inline (not imported from action file) to avoid pulling in server-side dependencies (`'use server'`, `next-safe-action`)
- Tests validate: valid input, non-UUID userId, non-UUID in companyIds array, empty array (allowed), missing userId, wrong type for companyIds, null companyIds
- All 7 tests pass

### Task 2: Playwright API-level E2E tests for multi-company RLS isolation
- File: `e2e/tests/quick-54-rls/multi-company-rls.spec.ts`
- 5 test cases using Supabase JS client directly (no browser UI)
- beforeAll seeds: Company B, division for Company B, user B (rls-user-b@gmail.com), one row each in requests/jobs/inventory_items for Company B
- Tests: Company A ga_lead cannot SELECT Company B rows (3 tables), can query own company without error, cannot INSERT with cross-company company_id
- afterAll cleans up all seeded data (rows, user B, Company B if freshly created)
- All 5 tests pass

## Verification Results

- `npm test` — 7/7 new schema tests pass (1 pre-existing failure in permissions.test.ts, out of scope)
- `npx playwright test e2e/tests/quick-54-rls/` — 5/5 RLS tests pass
- `npx eslint __tests__/actions/user-company-access.test.ts e2e/tests/quick-54-rls/multi-company-rls.spec.ts` — no new lint errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] listUsers pagination causing false-negative user lookup**
- **Found during:** Task 2 — first run failed with "Database error creating new user" despite user existing
- **Issue:** `admin.auth.admin.listUsers()` uses default page size; with 17 users the pagination was not the cause, but the root cause was a partially cleaned up user from an interrupted prior run
- **Fix:** Changed to `listUsers({ perPage: 1000 })` and added `updateUserById` to re-sync app_metadata when user already exists, making beforeAll idempotent across interrupted runs
- **Files modified:** `e2e/tests/quick-54-rls/multi-company-rls.spec.ts`
- **Commit:** c63fe2c

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 66242ea | test(quick-54): add updateUserCompanyAccess schema validation tests |
| 2 | c63fe2c | test(quick-54): add API-level E2E tests for multi-company RLS isolation |

## Self-Check: PASSED

- `__tests__/actions/user-company-access.test.ts` — EXISTS
- `e2e/tests/quick-54-rls/multi-company-rls.spec.ts` — EXISTS
- Commit 66242ea — EXISTS
- Commit c63fe2c — EXISTS
