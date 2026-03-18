---
phase: 260318-fm0-fix-3-security-issues-updateuser-company
verified: 2026-03-18T11:20:00Z
status: passed
score: 3/3 must-haves verified
---

# Quick Task: Fix 3 Security Issues — Verification Report

**Goal:** Fix 3 security issues: (1) updateUser adds assertCompanyAccess before updating company_id. (2) createTransfer removes hardcoded .eq('company_id', profile.company_id) and uses asset.company_id for movement insert. (3) deleteAssetPhotos removes hardcoded company filter and validates access via assertCompanyAccess per attachment company.
**Verified:** 2026-03-18T11:20:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | updateUser calls assertCompanyAccess before writing company_id | VERIFIED | `user-actions.ts` line 141: `await assertCompanyAccess(adminSupabase, ctx.profile.id, parsedInput.company_id, ctx.profile.company_id)` immediately before the `.update()` call |
| 2 | createTransfer inserts movement with asset.company_id, not profile.company_id | VERIFIED | `asset-actions.ts` line 292: `company_id: asset.company_id` (asset fetched from DB at line 227). No `.eq('company_id', profile.company_id)` filter anywhere in this function |
| 3 | deleteAssetPhotos validates access per unique attachment company via assertCompanyAccess | VERIFIED | `asset-actions.ts` lines 627-630: de-dupes company IDs from fetched attachments and calls `assertCompanyAccess` for each; no hardcoded `profile.company_id` filter on the initial fetch |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/actions/user-actions.ts` | assertCompanyAccess in updateUser | VERIFIED | Line 141 — called with `ctx.profile.id`, `parsedInput.company_id`, `ctx.profile.company_id` |
| `app/actions/asset-actions.ts` | createTransfer uses asset.company_id | VERIFIED | Line 292 — `company_id: asset.company_id`; asset fetched from DB with company_id column (line 229) |
| `app/actions/asset-actions.ts` | deleteAssetPhotos uses assertCompanyAccess loop | VERIFIED | Lines 627-630 — Set of unique company IDs extracted, assertCompanyAccess called per ID |
| `lib/auth/company-access.ts` | assertCompanyAccess helper exists and is real | VERIFIED | 27-line implementation; skips check if same company, queries `user_company_access` for cross-company, throws on no access |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `user-actions.ts` updateUser | `assertCompanyAccess` | import line 8 + call line 141 | WIRED | Import present; call placed before the `.update()` write |
| `asset-actions.ts` createTransfer | `asset.company_id` | DB fetch at line 229 selects `company_id` | WIRED | `select('id, status, location_id, company_id')` then used in insert |
| `asset-actions.ts` deleteAssetPhotos | `assertCompanyAccess` | import line 22 + loop lines 628-630 | WIRED | Import present; loop covers all unique company IDs from returned attachments |

### Anti-Patterns Found

No anti-patterns detected in the three modified areas.

Notable: `cancelTransfer` contains `.eq('company_id', movement.company_id)` at line 472 — this is correct: it uses `movement.company_id` (fetched from DB), not `profile.company_id`. Not a security issue.

### Human Verification Required

None. All three security fixes are verifiable from static code analysis.

### Gaps Summary

No gaps. All three security fixes are correctly implemented:

1. **updateUser** — `assertCompanyAccess` is called on line 141 before the `user_profiles` update and before the `auth.admin.updateUserById` metadata update. An admin cannot assign a user to a company they don't have access to.

2. **createTransfer** — The movement insert at line 292 uses `asset.company_id` (derived from the DB record). The `profile.company_id` hardcoded filter that previously existed here has been removed. The asset is fetched via RLS-scoped `supabase` (line 227), so the company value is trusted.

3. **deleteAssetPhotos** — The function fetches attachments without a company filter (relying on the `photo_ids` list), then validates each distinct `company_id` present in the result via `assertCompanyAccess`. This prevents a user from deleting attachments belonging to a company they have no access to, even if they know the attachment UUIDs.

---

_Verified: 2026-03-18T11:20:00Z_
_Verifier: Claude (gsd-verifier)_
