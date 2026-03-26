---
phase: quick-260326-o5f
verified: 2026-03-26T10:45:00Z
status: passed
score: 5/5 must-haves verified
---

# Quick Task 260326-o5f: Bug Fix Protocol Sweep 3 — Security Verification Report

**Task Goal:** Bug Fix Protocol Sweep 3 — Security: Fix 7 adminSupabase/company-scoping issues. Add assertCompanyAccess to user deactivate/reactivate, fix company-settings multi-company, add defense-in-depth company_id filters to media mutations and upload routes.
**Verified:** 2026-03-26T10:45:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | deactivateUser and reactivateUser enforce company access before mutating | VERIFIED | `user-actions.ts` lines 192-198 (deactivate) and 225-236 (reactivate): both fetch target user's `company_id`, call `assertCompanyAccess(adminSupabase, ctx.profile.id, targetUser.company_id, ctx.profile.company_id)` before the update mutation |
| 2 | company-settings-actions accept optional company_id for multi-company admin workflows | VERIFIED | `company-settings-actions.ts`: schema includes `company_id: z.string().uuid().optional()`, computes `effectiveCompanyId`, calls `assertCompanyAccess` when company_id differs from profile, uses adminSupabase for cross-company reads/writes |
| 3 | updateUserCompanyAccess validates admin has access to target user's company | VERIFIED | `user-company-access-actions.ts` line 47: fetches target user's `company_id` and calls `assertCompanyAccess(adminSupabase, ctx.profile.id, targetUser.company_id, ctx.profile.company_id)` before delete+insert |
| 4 | deleteMediaAttachment and deleteJobAttachment include company_id filter on adminSupabase update | VERIFIED | `request-actions.ts` line 415: `.eq('company_id', request.company_id)` on adminSupabase media soft-delete; `job-actions.ts` line 823: `.eq('company_id', job.company_id)` on adminSupabase media soft-delete |
| 5 | Upload routes use entity's company_id for media_attachment inserts, not profile.company_id | VERIFIED | No `profile.company_id` remains in any upload route. `asset-photos/route.ts` uses `entityCompanyId` (from `inventory_movements` or `inventory_items`). `asset-invoices/route.ts` uses `asset.company_id` at lines 118 and 138. `entity-photos/route.ts` uses `entityCompanyId` captured from `requestRecord.company_id` or `entityRecord.company_id` at lines 166 and 186. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/actions/user-actions.ts` | assertCompanyAccess in deactivateUser and reactivateUser | VERIFIED | Import at line 8; calls at lines 198 and 236; both functions use `ctx` param |
| `app/actions/company-settings-actions.ts` | Optional company_id input with assertCompanyAccess | VERIFIED | Import at line 8; schema at line 15; `assertCompanyAccess` calls at lines 24 and 70; `effectiveCompanyId` used throughout |
| `app/actions/user-company-access-actions.ts` | assertCompanyAccess for target user's company | VERIFIED | Import at line 9; call at line 47 after fetching target user at line 43 |
| `app/actions/request-actions.ts` | company_id filter on adminSupabase media soft-delete | VERIFIED | Request select includes `company_id` at line 399; `.eq('company_id', request.company_id)` at line 415 |
| `app/actions/job-actions.ts` | company_id filter on adminSupabase media soft-delete | VERIFIED | Job select includes `company_id` at line 808; `.eq('company_id', job.company_id)` at line 823 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/actions/user-actions.ts` | `lib/auth/company-access.ts` | `assertCompanyAccess` import + call with `adminSupabase` | WIRED | Import confirmed at line 8; pattern `assertCompanyAccess(adminSupabase` found at lines 198 and 236 |
| `app/actions/company-settings-actions.ts` | `lib/auth/company-access.ts` | `assertCompanyAccess` import + call | WIRED | Import at line 8; calls at lines 24 and 70 with inline cross-company guard |
| `app/actions/request-actions.ts` | `media_attachments` | adminSupabase update with `.eq('company_id')` filter | WIRED | `request.company_id` selected at line 399; `.eq('company_id', request.company_id)` applied at line 415 on adminSupabase update |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| SECURITY-SWEEP-3 | Fix 7 adminSupabase/company-scoping security issues | SATISFIED | All 7 fixes confirmed present: deactivateUser, reactivateUser, updateUserCompanyAccess, getCompanySettings, updateCompanySetting, deleteMediaAttachment, deleteJobAttachment, asset-photos, asset-invoices, entity-photos routes |

### Anti-Patterns Found

None. No TODOs, placeholders, empty implementations, or stub patterns found in the modified files.

### Human Verification Required

None. All security fixes are logic-level and fully verifiable by code inspection and build check.

### Build Verification

`npm run build` completed successfully with no TypeScript errors. All 8 modified files compile cleanly.

### Commits Verified

Both task commits confirmed in git history:
- `b02087c` — fix: add assertCompanyAccess to user, settings, and access actions
- `5266119` — fix: add defense-in-depth company_id filters to media mutations and upload routes

---

## Summary

All 7 security fixes are fully implemented and wired:

1. **deactivateUser** — fetches `targetUser.company_id`, calls `assertCompanyAccess` before mutation (lines 192-198)
2. **reactivateUser** — selects `company_id` alongside `email`, calls `assertCompanyAccess` before duplicate check and mutation (lines 225-236)
3. **updateUserCompanyAccess** — fetches target user's `company_id`, calls `assertCompanyAccess` before delete+insert (line 47)
4. **getCompanySettings** — accepts optional `company_id`, validates via `assertCompanyAccess`, uses adminSupabase for cross-company reads (lines 15-31)
5. **updateCompanySetting** — accepts optional `company_id`, validates via `assertCompanyAccess`, uses adminSupabase when company differs (lines 51-104)
6. **deleteMediaAttachment** — `.eq('company_id', request.company_id)` defense-in-depth filter on adminSupabase update (line 415)
7. **deleteJobAttachment** — `.eq('company_id', job.company_id)` defense-in-depth filter on adminSupabase update (line 823)
8. **asset-photos, asset-invoices, entity-photos upload routes** — all now use entity-sourced `company_id` (never `profile.company_id`) for storage paths and `media_attachments` inserts.

The cross-company admin client pattern is consistent across all fixes: inline `if (parsedInput.company_id && parsedInput.company_id !== profile.company_id)` guard enables TypeScript narrowing before passing to `assertCompanyAccess`.

---

_Verified: 2026-03-26T10:45:00Z_
_Verifier: Claude (gsd-verifier)_
