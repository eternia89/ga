---
phase: quick-68
verified: 2026-03-13T08:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Quick Task 68: Make Maintenance Templates Shared Across Companies — Verification Report

**Task Goal:** Make maintenance templates shared across all companies (global resource). Remove company_id NOT NULL constraint and RLS company-scoping. All authenticated users can read all templates; only ga_lead/admin can write.
**Verified:** 2026-03-13T08:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All authenticated users can see all active maintenance templates regardless of company | VERIFIED | `maintenance_templates_select_global` RLS policy uses `USING (deleted_at IS NULL)` with no company filter. Server actions `getTemplates` and `getTemplateById` have no `.eq('company_id',...)` or `.in('company_id',...)` filter. Pages fetch without company filter. |
| 2 | Only ga_lead and admin roles can create, update, deactivate, or reactivate templates | VERIFIED | All four write actions (`createTemplate`, `updateTemplate`, `deactivateTemplate`, `reactivateTemplate`) guard with `if (!['ga_lead', 'admin'].includes(profile.role))`. RLS INSERT/UPDATE policies enforce `current_user_role() IN ('ga_lead', 'admin')`. |
| 3 | Templates are created without company_id assignment (global resource) | VERIFIED | `createTemplate` `.insert({...})` payload contains no `company_id` field. Migration 00023 sets all existing `company_id` values to NULL. `company_id` column is nullable post-migration. |
| 4 | Schedule creation no longer validates template company matches user company | VERIFIED | `createSchedule` in `schedule-actions.ts` fetches template with only `.eq('id', parsedInput.template_id)`, `.eq('is_active', true)`, `.is('deleted_at', null)` — no `.eq('company_id', profile.company_id)`. |
| 5 | Template create and detail forms no longer show a Company field | VERIFIED | `template-create-form.tsx`, `template-create-dialog.tsx`, and `template-detail.tsx` have zero references to "company", "Company", `primaryCompanyName`, `extraCompanies`, or `selectedCompanyId`. |

**Score:** 5/5 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00023_templates_shared_global.sql` | Migration making company_id nullable and updating RLS to global SELECT | VERIFIED | Contains `ALTER COLUMN company_id DROP NOT NULL`, 6 `DROP POLICY IF EXISTS` statements, 3 new policies (`_select_global`, `_insert_role`, `_update_role`), and `UPDATE ... SET company_id = NULL`. |
| `app/actions/template-actions.ts` | Server actions without company_id filtering on reads or writes | VERIFIED | `getTemplates` and `getTemplateById` have no company_id filter clauses. `createTemplate` insert omits company_id. `updateTemplate`, `deactivateTemplate`, `reactivateTemplate` ownership checks use only `.eq('id',...)` without company_id. `company_id` field is still selected for type compatibility (value is NULL). |
| `app/actions/schedule-actions.ts` | createSchedule without template company validation | VERIFIED | Template fetch (lines 22-28) has no `.eq('company_id',...)`. Assets and schedules remain correctly company-scoped. |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `supabase/migrations/00023_templates_shared_global.sql` | `maintenance_templates` table | `ALTER COLUMN company_id DROP NOT NULL` + new RLS policies | VERIFIED | File contains exact `DROP NOT NULL` clause and all three new policy `CREATE POLICY` statements. |
| `app/actions/template-actions.ts` | `maintenance_templates` table | Supabase queries without company_id filter | VERIFIED | `from('maintenance_templates')` in both `getTemplates` and `getTemplateById` — no `.eq('company_id',...)` or `.in('company_id',...)` present. Only company_id usage is in the SELECT field list. |
| `app/actions/schedule-actions.ts` | `maintenance_templates` table | Template fetch without company_id check | VERIFIED | `from('maintenance_templates')` in `createSchedule` fetches by id, is_active, deleted_at only. |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| QUICK-68 | Make maintenance templates shared across all companies | SATISFIED | Migration makes company_id nullable, RLS updated to global SELECT + role-only write, all server actions and UI remove company scoping. |

---

## Anti-Patterns Found

None. No TODOs, placeholders, stub implementations, or empty handlers found in modified files.

**TypeScript compilation:** One pre-existing error in `e2e/tests/phase-06-inventory/asset-crud.spec.ts` (line 107, type cast issue) — predates quick-68 commits, present before `a5e3984`. Production app code (non-e2e) compiles clean.

---

## Human Verification Required

### 1. Global Visibility Across Company Boundaries

**Test:** Log in as a user from Company A. Navigate to `/maintenance/templates`. Note the template list. Log in as a user from Company B. Navigate to `/maintenance/templates`.
**Expected:** Both users see the same full template list regardless of their company affiliation.
**Why human:** Cross-company session testing requires live Supabase RLS evaluation.

### 2. Write Access Restriction

**Test:** Log in as a user with role `staff` or `viewer`. Attempt to create a new template via the UI.
**Expected:** The "New Template" CTA button should not be visible (hidden behind role check `['ga_lead', 'admin'].includes(profile.role)`).
**Why human:** Role-based UI rendering requires authenticated session.

---

## Summary

All 5 observable truths are fully verified against the codebase. The migration (00023) correctly makes `company_id` nullable, drops the 6 old policy names, and creates 3 new policies: global SELECT for all authenticated users, role-restricted INSERT, and role-restricted UPDATE. Server actions are free of company_id filtering. The schedule `createSchedule` action fetches templates globally. All three template UI components (create form, create dialog, detail) have zero company-related props, state, or UI elements. The `MaintenanceTemplate` type was updated to allow `company_id: string | null`. The `template-view-modal.tsx` client-side fetch also uses no company filter. Goal fully achieved.

---

_Verified: 2026-03-13T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
