---
phase: quick-64
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00021_categories_partial_unique_index_lower_name.sql
autonomous: true
requirements: []

must_haves:
  truths:
    - "Two concurrent requests creating a category with the same name (case-insensitive) and type in the same company cannot both succeed — the second one receives a unique constraint violation from the database"
    - "The application-layer uniqueness check in category-actions.ts continues to produce user-friendly error messages for the common (non-concurrent) case"
  artifacts:
    - path: "supabase/migrations/00021_categories_partial_unique_index_lower_name.sql"
      provides: "Partial unique index on (company_id, lower(name), type) WHERE deleted_at IS NULL"
      contains: "CREATE UNIQUE INDEX"
  key_links:
    - from: "supabase/migrations/00021_categories_partial_unique_index_lower_name.sql"
      to: "categories table"
      via: "partial unique index enforces case-insensitive uniqueness at DB level"
      pattern: "CREATE UNIQUE INDEX.*lower\\(name\\).*WHERE deleted_at IS NULL"
---

<objective>
Add a partial unique index on `categories (company_id, lower(name), type) WHERE deleted_at IS NULL` to eliminate the TOCTOU race condition in category write paths.

Purpose: The existing application-layer uniqueness checks in createCategory, updateCategory, and restoreCategory use SELECT-then-write patterns. Two concurrent requests can both pass the SELECT check and then both succeed on INSERT/UPDATE, producing duplicate category names within the same company. A database-level constraint is the only reliable guard.

Output: A new Supabase migration file containing the partial unique index. No application code changes are needed — the existing application checks remain as the first line of defense for user-friendly error messages; the DB index is the backstop for concurrent races.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Relevant prior decision from STATE.md:
- [03-02]: Categories are GLOBAL (shared across companies per LOCKED decision) — company_id used only for audit. However, quick task 67 REVERSED this: company-scoped uniqueness is now enforced per company_id in all three write paths.
- [01-01]: Used composite indexes with company_id as leading column for multi-tenant query optimization.
- [01-01]: Deferred unique constraints (DEFERRABLE INITIALLY DEFERRED) to handle FK relationships during soft-delete operations.

Existing index in 00001_initial_schema.sql (INSUFFICIENT — case-sensitive, plain text match):
```sql
CREATE UNIQUE INDEX categories_company_name_type_unique_active
  ON public.categories (company_id, name, type)
  WHERE deleted_at IS NULL;
```
This index uses `name` directly, so "Pompa" and "pompa" are treated as distinct — meaning the application's `.ilike()` check could block a case-variant while the DB index would allow it through concurrently. The new index must use `lower(name)` to match the ilike behavior and close the TOCTOU gap.

Next migration number: 00021 (last is 00020_rls_multi_company_access.sql).
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create migration with case-insensitive partial unique index</name>
  <files>supabase/migrations/00021_categories_partial_unique_index_lower_name.sql</files>
  <action>
Create the file with the following content:

1. Drop the existing case-sensitive partial unique index `categories_company_name_type_unique_active` (created in 00001) — it is superseded by the new case-insensitive one.

2. Create a new partial unique index using `lower(name)`:

```sql
-- Migration: replace case-sensitive partial unique index on categories
-- with a case-insensitive one using lower(name) to close the TOCTOU race
-- condition in createCategory / updateCategory / restoreCategory.

-- Drop the old case-sensitive partial index created in 00001_initial_schema.sql.
-- The DEFERRABLE full index (categories_company_name_type_unique) remains for
-- FK deferral purposes and is unaffected.
DROP INDEX IF EXISTS public.categories_company_name_type_unique_active;

-- Create case-insensitive partial unique index.
-- Enforces: no two active categories in the same company can share
-- the same name (case-insensitively) and type.
CREATE UNIQUE INDEX categories_company_lower_name_type_unique_active
  ON public.categories (company_id, lower(name), type)
  WHERE deleted_at IS NULL;
```

Do NOT modify any application code — the app-layer checks in category-actions.ts are intentionally kept as the first line of defense for friendly error messages. This index is purely the database backstop.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && cat supabase/migrations/00021_categories_partial_unique_index_lower_name.sql | grep -c "CREATE UNIQUE INDEX categories_company_lower_name_type_unique_active"</automated>
  </verify>
  <done>Migration file exists, contains DROP INDEX for old index and CREATE UNIQUE INDEX with lower(name) expression and WHERE deleted_at IS NULL partial predicate. Output of verify command is 1.</done>
</task>

</tasks>

<verification>
1. Migration file exists at `supabase/migrations/00021_categories_partial_unique_index_lower_name.sql`.
2. File contains `DROP INDEX IF EXISTS public.categories_company_name_type_unique_active`.
3. File contains `CREATE UNIQUE INDEX categories_company_lower_name_type_unique_active ON public.categories (company_id, lower(name), type) WHERE deleted_at IS NULL`.
4. No changes to `app/actions/category-actions.ts` — the existing SELECT-then-write checks are preserved.
5. Run `supabase db push` (or apply via Supabase Dashboard) to deploy the migration to the remote instance.
</verification>

<success_criteria>
- Migration file `00021_categories_partial_unique_index_lower_name.sql` created and syntactically correct.
- After applying to Supabase, concurrent INSERTs with the same (company_id, lower(name), type) where deleted_at IS NULL will produce a unique constraint violation, preventing duplicates regardless of race conditions.
- Existing application-layer error messages for the common non-concurrent case remain unchanged.
</success_criteria>

<output>
After completion, create `.planning/quick/64-add-partial-unique-index-on-categories-c/64-SUMMARY.md` using the summary template.
</output>
