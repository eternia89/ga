---
phase: quick-64
verified: 2026-03-13T06:00:00Z
status: passed
score: 2/2 must-haves verified
---

# Quick Task 64: Add Partial Unique Index on Categories — Verification Report

**Task Goal:** Add partial unique index on categories (company_id, lower(name), type) WHERE deleted_at IS NULL to prevent TOCTOU race condition
**Verified:** 2026-03-13T06:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                                                                                              | Status     | Evidence                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Two concurrent requests creating a category with the same name (case-insensitive) and type in the same company cannot both succeed — the second receives a unique constraint violation | ✓ VERIFIED | `CREATE UNIQUE INDEX categories_company_lower_name_type_unique_active ON public.categories (company_id, lower(name), type) WHERE deleted_at IS NULL` present in migration 00021 |
| 2   | The application-layer uniqueness check in category-actions.ts continues to produce user-friendly error messages for the common (non-concurrent) case                               | ✓ VERIFIED | All three write paths (createCategory, updateCategory, restoreCategory) retain `.ilike()` checks with descriptive error messages; no modifications made |

**Score:** 2/2 truths verified

### Required Artifacts

| Artifact                                                                       | Expected                                                            | Status     | Details                                                                                                                                                                             |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/00021_categories_partial_unique_index_lower_name.sql`     | Partial unique index on (company_id, lower(name), type) WHERE deleted_at IS NULL | ✓ VERIFIED | File exists, 15 lines, contains both DROP INDEX and CREATE UNIQUE INDEX statements exactly as specified in the plan |

### Key Link Verification

| From                                                                       | To                | Via                                                                    | Status     | Details                                                                                                                                               |
| -------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/00021_categories_partial_unique_index_lower_name.sql` | categories table  | partial unique index enforces case-insensitive uniqueness at DB level  | ✓ WIRED    | `CREATE UNIQUE INDEX categories_company_lower_name_type_unique_active ON public.categories (company_id, lower(name), type) WHERE deleted_at IS NULL` confirmed at line 13-15 |

### Migration Content Verification

The migration file at `supabase/migrations/00021_categories_partial_unique_index_lower_name.sql` was verified line-by-line:

1. `DROP INDEX IF EXISTS public.categories_company_name_type_unique_active` — correctly removes the superseded case-sensitive partial index from 00001_initial_schema.sql (line 78-80 of that file confirms it existed using plain `name`).
2. `CREATE UNIQUE INDEX categories_company_lower_name_type_unique_active ON public.categories (company_id, lower(name), type) WHERE deleted_at IS NULL` — new expression index uses `lower(name)` matching the app-layer `.ilike()` behavior, partial predicate restricts to active rows only.
3. The DEFERRABLE full index `categories_company_name_type_unique` is correctly left untouched (not mentioned in DROP).

### Application Code Preservation Verification

`app/actions/category-actions.ts` was scanned and confirmed unchanged. All three write paths retain their `.ilike()` pre-checks:

- `createCategory` (line 21): `.ilike("name", parsedInput.name)` + friendly error message
- `updateCategory` (line 76): `.ilike("name", data.name)` + friendly error message
- `restoreCategory` (line 185): `.ilike("name", category.name)` + friendly error message

### Requirements Coverage

No formal requirement IDs were declared in the plan (`requirements: []`). This task addresses the TOCTOU race condition identified as a gap from quick-60.

### Anti-Patterns Found

None. The migration file is a clean 15-line SQL file with no TODOs, placeholders, or empty implementations.

### Human Verification Required

The migration has been committed (`d8ec77e`) but not yet applied to the remote Supabase instance. The actual enforcement of the constraint requires applying the migration:

**Test:** Run `supabase db push` or apply via Supabase Dashboard SQL editor
**Expected:** Migration 00021 applies cleanly; attempting two concurrent INSERTs with the same (company_id, lower(name), type) and deleted_at IS NULL produces a unique constraint violation on the second
**Why human:** Requires access to the live Supabase instance; cannot verify remote DB state programmatically from this codebase

### Commit Verification

Commit `d8ec77e` confirmed to exist and reference the correct file:
- `feat(quick-64): add case-insensitive partial unique index on categories`
- Modifies only `supabase/migrations/00021_categories_partial_unique_index_lower_name.sql`

---

_Verified: 2026-03-13T06:00:00Z_
_Verifier: Claude (gsd-verifier)_
