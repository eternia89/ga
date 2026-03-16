---
phase: quick-79
verified: 2026-03-16T02:15:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Quick Task 79: Fix 7 Security/Correctness Bugs — Verification Report

**Task Goal:** Fix 7 security/correctness bugs: RFC4122 UUID fix, .single() to .maybeSingle() standardization, duplicate email check on reactivate, company access validation on createUser, error handling on .maybeSingle() queries, company-settings .single() fix, reset-database.sql UUID fix.
**Verified:** 2026-03-16T02:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | RLS fallback UUID is RFC 4122 v4 compliant (version=4 at pos 13, variant=a at pos 17) | VERIFIED | `00002_rls_helper_functions.sql` line 21: `'00000000-0000-4000-a000-000000000000'::uuid` |
| 2 | Company access checks in request/job/asset actions use .maybeSingle() instead of .single() | VERIFIED | All three files (line 34, 36, 47 respectively) use `.maybeSingle()` on `user_company_access` query |
| 3 | reactivateUser checks for duplicate email among active users before proceeding | VERIFIED | `user-actions.ts` lines 232-241: queries `user_profiles` with `.eq('email', ...)`, `.is('deleted_at', null)`, `.neq('id', ...)`, `.maybeSingle()` before clearing `deleted_at` |
| 4 | createUser validates that admin has access to the target company | VERIFIED | `user-actions.ts` line 48: `async ({ parsedInput, ctx })`, line 52: `const { profile } = ctx`, lines 53-63: company access check via `user_company_access` with `.maybeSingle()` |
| 5 | schedule-actions .maybeSingle() queries check for Supabase error before checking null data | VERIFIED | 10 occurrences across 5 functions (createSchedule, updateSchedule, deactivateSchedule, activateSchedule, deleteSchedule): each destructures `error: accessError` and throws before null check |
| 6 | company-settings existence check uses .maybeSingle() instead of .single() | VERIFIED | `company-settings-actions.ts` line 58: `.maybeSingle()` on `company_settings` existence check |
| 7 | reset-database.sql uses valid RFC 4122 v4 UUIDs for instance_id | VERIFIED | All 5 `auth.users` INSERT statements (lines 65, 85, 105, 125, 145) use `instance_id = '00000000-0000-4000-a000-000000000000'` |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00002_rls_helper_functions.sql` | RFC 4122 compliant fallback UUID | VERIFIED | Contains `'00000000-0000-4000-a000-000000000000'::uuid` at line 21 |
| `app/actions/request-actions.ts` | .maybeSingle() on company access check | VERIFIED | `.maybeSingle()` at line 34, no `.single()` on `user_company_access` |
| `app/actions/job-actions.ts` | .maybeSingle() on company access check | VERIFIED | `.maybeSingle()` at line 36, no `.single()` on `user_company_access` |
| `app/actions/asset-actions.ts` | .maybeSingle() on company access check | VERIFIED | `.maybeSingle()` at line 47, no `.single()` on `user_company_access` |
| `app/actions/user-actions.ts` | Duplicate email check on reactivate + company access validation on create | VERIFIED | Both bugs fixed; `ctx` destructured in createUser; email duplicate check in reactivateUser |
| `app/actions/schedule-actions.ts` | Error destructuring on .maybeSingle() queries | VERIFIED | 10 lines across 5 functions (destructure + throw pattern), all before null check |
| `app/actions/company-settings-actions.ts` | .maybeSingle() on existence check | VERIFIED | `.maybeSingle()` at line 58 |
| `scripts/reset-database.sql` | Valid v4 UUIDs for instance_id | VERIFIED | All 5 `instance_id` values are `'00000000-0000-4000-a000-000000000000'` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `supabase/migrations/00002_rls_helper_functions.sql` | RLS policies | `current_user_company_id()` fallback — `00000000-0000-4000-a000-000000000000` | WIRED | Pattern found at line 21; function is the canonical RLS helper |
| `app/actions/user-actions.ts` | `user_profiles` table | Duplicate email check before reactivate — `.eq('email', ...).is('deleted_at', null).neq('id', ...)` | WIRED | Lines 232-241; check runs before `deleted_at` is cleared at line 248 |

### Requirements Coverage

No `requirements:` field declared in PLAN frontmatter — no requirement IDs to cross-reference.

### Anti-Patterns Found

None found in the modified files. No TODO/FIXME/placeholder comments, no stub implementations, no empty handlers, no ignored errors.

### Human Verification Required

None. All fixes are logic/code changes with programmatically verifiable outcomes.

## Gaps Summary

No gaps. All 7 bugs are fixed as specified. Each fix is substantive and wired correctly:

- BUG 1: RLS fallback UUID replaced with valid v4 (`00000000-0000-4000-a000-000000000000`)
- BUG 2: All three action files (request, job, asset) use `.maybeSingle()` on `user_company_access` queries
- BUG 3: `reactivateUser` queries for duplicate email among active users before proceeding
- BUG 4: `createUser` destructures `ctx`, extracts `profile`, and validates company access
- BUG 5: All 5 company access `.maybeSingle()` queries in `schedule-actions.ts` destructure and check `accessError` before the null check
- BUG 6: `company-settings-actions.ts` existence check uses `.maybeSingle()`
- BUG 7: All 5 `instance_id` values in `reset-database.sql` use valid v4 UUID

---

_Verified: 2026-03-16T02:15:00Z_
_Verifier: Claude (gsd-verifier)_
