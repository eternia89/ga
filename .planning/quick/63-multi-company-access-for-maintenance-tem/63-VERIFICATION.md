---
phase: quick-63
verified: 2026-03-13T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase quick-63: Multi-Company Access for Maintenance Verification Report

**Phase Goal:** Expand RLS SELECT policies and app-level queries for maintenance_templates and maintenance_schedules to include user_company_access, matching the pattern from migration 00020 (requests, jobs, inventory_items). New migration 00021 + updated app queries in pages and actions.
**Verified:** 2026-03-13
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User with multi-company access can see maintenance templates from all accessible companies | VERIFIED | `templates/page.tsx` line 87 uses `.in('company_id', allAccessibleCompanyIds)`; `getTemplates` action line 271 same; `getTemplateById` action line 323 same |
| 2 | User with multi-company access can see maintenance schedules from all accessible companies | VERIFIED | `maintenance/page.tsx` line 68 uses `.in('company_id', allAccessibleCompanyIds)`; `getSchedules` action line 319 same; `getSchedulesByAssetId` action line 388 same |
| 3 | User with multi-company access can view template detail pages for any accessible company | VERIFIED | `templates/[id]/page.tsx` lines 33-39 fetch `user_company_access`, line 58 uses `.in('company_id', allAccessibleCompanyIds)`; company name fetched using `templateData.company_id` (line 87) not `profile.company_id` |
| 4 | User with multi-company access can view schedule detail pages for any accessible company | VERIFIED | `schedules/[id]/page.tsx` lines 35-41 fetch `user_company_access`, line 67 uses `.in('company_id', allAccessibleCompanyIds)`; company name fetched using `scheduleRaw.company_id` (line 100) not `profile.company_id` |
| 5 | Mutation actions (create, update, deactivate) still enforce primary company ownership | VERIFIED | `template-actions.ts` lines 86, 154, 213 retain `.eq('company_id', profile.company_id)`; `schedule-actions.ts` lines 26, 40, 109, 163, 213, 257 same; no `.in()` in mutation paths |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00021_rls_maintenance_multi_company.sql` | RLS SELECT policy expansion for maintenance_templates and maintenance_schedules | VERIFIED | Exists, 50 lines, DROP IF EXISTS + CREATE POLICY with `user_company_access` OR clause and `deleted_at IS NULL` for both tables |
| `app/(dashboard)/maintenance/page.tsx` | Multi-company schedule list query | VERIFIED | `allAccessibleCompanyIds` computed at lines 38-43, used in `.in('company_id', ...)` at lines 68, 77, 84 |
| `app/(dashboard)/maintenance/templates/page.tsx` | Multi-company template list query | VERIFIED | `allAccessibleCompanyIds` computed at lines 35-40, used in `.in('company_id', ...)` at line 87 |
| `app/(dashboard)/maintenance/templates/[id]/page.tsx` | Template detail accessible across companies | VERIFIED | `allAccessibleCompanyIds` added, `.in('company_id', ...)` at line 58, company name via `templateData.company_id` at line 87 |
| `app/(dashboard)/maintenance/schedules/[id]/page.tsx` | Schedule detail accessible across companies | VERIFIED | `allAccessibleCompanyIds` added, `.in('company_id', ...)` at line 67, company name via `scheduleRaw.company_id` at line 100 |
| `app/actions/template-actions.ts` | `getTemplates` and `getTemplateById` multi-company | VERIFIED | Both actions fetch `user_company_access` and use `.in('company_id', allAccessibleCompanyIds)` |
| `app/actions/schedule-actions.ts` | `getSchedules` and `getSchedulesByAssetId` multi-company | VERIFIED | Both actions fetch `user_company_access` and use `.in('company_id', allAccessibleCompanyIds)` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `supabase/migrations/00021_rls_maintenance_multi_company.sql` | `public.user_company_access` | EXISTS subquery in RLS USING clause | WIRED | Lines 25 and 44: `SELECT 1 FROM public.user_company_access WHERE user_id = auth.uid() AND company_id = {table}.company_id` — present for both maintenance_templates and maintenance_schedules |
| `app/(dashboard)/maintenance/page.tsx` | `maintenance_schedules` | `.in('company_id', allAccessibleCompanyIds)` | WIRED | Line 68: `.in('company_id', allAccessibleCompanyIds)` on schedules query; also used on templates (line 77) and assets (line 84) for create dialog |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| QUICK-63 | 63-PLAN.md | Multi-company access for maintenance_templates and maintenance_schedules | SATISFIED | Migration 00021 + 6 app files updated, all read paths use `.in('company_id', allAccessibleCompanyIds)`, mutations retain `.eq()` ownership check |

### Anti-Patterns Found

No anti-patterns detected in any of the 7 modified files. No TODO/FIXME/placeholder comments, no stub returns, no empty handlers in the changed code paths.

### Human Verification Required

None required. All changes are data-query modifications (SQL policy + Supabase client filter) that can be fully verified statically.

### Gaps Summary

No gaps. All five observable truths are fully verified:

- Migration 00021 correctly extends RLS SELECT for both maintenance tables using the `user_company_access` OR clause, matching the migration 00020 pattern exactly.
- All four page components compute `allAccessibleCompanyIds` from `user_company_access` and pass it to `.in('company_id', ...)` for every read query.
- All four read-only server actions (`getTemplates`, `getTemplateById`, `getSchedules`, `getSchedulesByAssetId`) follow the same pattern.
- Detail pages use the record's own `company_id` for company name lookup, not `profile.company_id`, ensuring correct display for cross-company records.
- Mutation actions retain `.eq('company_id', profile.company_id)` — multi-company access is correctly read-only.

---

_Verified: 2026-03-13_
_Verifier: Claude (gsd-verifier)_
