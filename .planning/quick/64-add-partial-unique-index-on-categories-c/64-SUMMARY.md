---
phase: quick-64
plan: 01
subsystem: database
tags: [postgres, supabase, migrations, unique-index, categories]

# Dependency graph
requires:
  - phase: quick-60
    provides: company-scoped category uniqueness enforcement in application layer
provides:
  - DB-level case-insensitive partial unique index closing TOCTOU race in category write paths
affects: [categories, category-actions]

# Tech tracking
tech-stack:
  added: []
  patterns: [expression index using lower() for case-insensitive uniqueness at DB level]

key-files:
  created:
    - supabase/migrations/00021_categories_partial_unique_index_lower_name.sql
  modified: []

key-decisions:
  - "DROP old case-sensitive partial index (categories_company_name_type_unique_active) and replace with lower(name) expression index — the old index could allow concurrent case-variant duplicates through"
  - "No application code changes: app-layer ilike checks in category-actions.ts remain as user-friendly first line of defense; the DB index is the TOCTOU backstop"

patterns-established:
  - "Case-insensitive uniqueness: use lower(name) expression index rather than citext or application-only checks for concurrent-safe enforcement"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-03-13
---

# Quick Task 64: Add Partial Unique Index on Categories Summary

**Partial unique index on (company_id, lower(name), type) WHERE deleted_at IS NULL replaces case-sensitive index to close TOCTOU race in category create/update/restore write paths**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T05:00:00Z
- **Completed:** 2026-03-13T05:03:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Dropped case-sensitive partial index `categories_company_name_type_unique_active` that allowed concurrent case-variant duplicates (e.g., "Pompa" + "pompa" both inserted simultaneously)
- Created `categories_company_lower_name_type_unique_active` on `(company_id, lower(name), type) WHERE deleted_at IS NULL` — any concurrent INSERT/UPDATE with the same case-insensitive name+type in the same company now receives a DB-level unique constraint violation
- Application-layer uniqueness checks in `category-actions.ts` intentionally preserved as the friendly first line of defense for non-concurrent cases

## Task Commits

1. **Task 1: Create migration with case-insensitive partial unique index** - `d8ec77e` (feat)

## Files Created/Modified
- `supabase/migrations/00021_categories_partial_unique_index_lower_name.sql` - Drops old case-sensitive active index; creates new lower(name) expression index with WHERE deleted_at IS NULL predicate

## Decisions Made
- Old index uses `name` (plain text match) — the app's `.ilike()` check and the index disagreed on case, meaning concurrent requests could bypass the ilike guard and both pass the DB index. Replacing with `lower(name)` aligns DB enforcement with app behavior.
- DEFERRABLE full index (`categories_company_name_type_unique`) left untouched — still needed for FK deferral purposes during soft-delete operations.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
Migration must be applied to the remote Supabase instance:
```
supabase db push
```
Or apply via Supabase Dashboard SQL editor.

## Next Phase Readiness
- Categories table now has correct DB-level uniqueness guarantee matching application-layer ilike checks
- No application code changes required

---
*Phase: quick-64*
*Completed: 2026-03-13*
