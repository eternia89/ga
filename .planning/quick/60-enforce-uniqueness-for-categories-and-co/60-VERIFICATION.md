---
phase: quick-60
verified: 2026-03-12T00:00:00Z
status: passed
score: 5/5 must-haves verified
---

# Quick Task 60: Enforce Company-Scoped Category Name Uniqueness — Verification Report

**Task Goal:** Enforce category uniqueness per company (not global) on all three write paths: create, update, restore.
**Verified:** 2026-03-12
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                                          | Status     | Evidence                                                                              |
|----|----------------------------------------------------------------------------------------------------------------|------------|---------------------------------------------------------------------------------------|
| 1  | Creating a request category with a name already used by an active request category in the same company is blocked | VERIFIED   | `createCategory` query: `.ilike("name") + .eq("type") + .eq("company_id", profile.company_id) + .is("deleted_at", null)` (lines 21-25) |
| 2  | Creating an asset category with a name already used by an active asset category in the same company is blocked  | VERIFIED   | Same query covers asset type via `.eq("type", parsedInput.type)` (line 22)            |
| 3  | Updating a category to a name already used by another active category of the same type in the same company is blocked | VERIFIED | `updateCategory` fetches `select("type, company_id")` (line 68) then checks `.eq("company_id", current.company_id)` (line 78) |
| 4  | Reactivating a category whose name conflicts with an existing active category of the same type in the same company is blocked | VERIFIED | `restoreCategory` fetches `select("name, type, company_id")` (line 174) then checks `.eq("company_id", category.company_id)` (line 187) |
| 5  | Company name uniqueness checks remain intact (no change to company-actions.ts)                                 | VERIFIED   | Only `app/actions/category-actions.ts` modified; `company-actions.ts` untouched      |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                              | Expected                                                      | Status     | Details                                                              |
|---------------------------------------|---------------------------------------------------------------|------------|----------------------------------------------------------------------|
| `app/actions/category-actions.ts`     | Company-scoped duplicate name checks on create, update, restore | VERIFIED | All three actions contain `.eq("company_id", ...)` in their duplicate-check queries |

### Key Link Verification

| From              | To                 | Via                                                          | Status  | Details                                                                             |
|-------------------|--------------------|--------------------------------------------------------------|---------|-------------------------------------------------------------------------------------|
| `createCategory`  | `categories` table | `.eq("company_id") + .ilike("name") + .eq("type") + .is("deleted_at", null)` | WIRED   | Lines 21-25: all four filters present in duplicate-check query                     |
| `updateCategory`  | `categories` table | same filters + `.neq("id", id)` self-exclusion              | WIRED   | Lines 66-81: fetches `company_id` from current row, applies to conflict check      |
| `restoreCategory` | `categories` table | same filters + `.neq("id", id)` self-exclusion              | WIRED   | Lines 172-190: fetches `company_id` alongside `name` and `type`, applies to conflict check |

### Anti-Patterns Found

None. No TODOs, FIXMEs, placeholder returns, or stub implementations found in the modified file.

### Human Verification Required

Manual smoke test recommended (per plan's own verification section):

**Test 1 — Create blocked within same company**
Test: Create a request category named "Test Cat" for Company A. Then try to create another request category with the same name for Company A.
Expected: Second create is blocked with error "A request category named 'Test Cat' already exists".
Why human: Requires live Supabase session with admin credentials.

**Test 2 — Cross-company create allowed**
Test: Create a request category named "Test Cat" for Company B (different company from Test 1).
Expected: Succeeds — different company, no conflict.
Why human: Requires two separate admin sessions for different companies.

**Test 3 — Update blocked within same company**
Test: Rename an existing category to a name already used by another active category of the same type in the same company.
Expected: Update blocked with error.
Why human: Requires live session.

**Test 4 — Restore blocked on name conflict**
Test: Deactivate a category. Create a new category with the same name and type. Attempt to reactivate the original.
Expected: Restore blocked with "Cannot reactivate — an active ... category named ... already exists".
Why human: Requires live session.

### Gaps Summary

No gaps. All three write paths (create, update, restore) correctly scope their duplicate-name guard queries to `company_id`. The implementation matches the plan exactly:

- `createCategory`: uses `profile.company_id` from action context
- `updateCategory`: fetches `company_id` from the existing row alongside `type`, then filters by it
- `restoreCategory`: fetches `company_id` from the target row alongside `name` and `type`, then filters by it

---

_Verified: 2026-03-12_
_Verifier: Claude (gsd-verifier)_
