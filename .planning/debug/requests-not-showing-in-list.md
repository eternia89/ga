---
status: diagnosed
trigger: "Requests exist in Supabase but don't appear in the request list page at /requests"
created: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:00:00Z
---

## Current Focus

hypothesis: The Supabase query on the requests page selects `name` from user_profiles, but the column is `full_name`. PostgREST returns an error (or empty result) when a non-existent column is referenced in an embedded resource select.
test: Compare column names in migration schema vs query select strings
expecting: Column mismatch confirmed
next_action: Report diagnosis

## Symptoms

expected: Requests visible in the /requests page list
actual: Request list page shows no requests ("No requests found"), despite rows in Supabase
errors: None reported (silent failure -- Supabase returns empty data or error swallowed by `??[]`)
reproduction: Navigate to /requests while logged in; requests exist in database
started: Since phase 04-02 implementation

## Eliminated

(none needed -- root cause found on first hypothesis)

## Evidence

- timestamp: 2026-02-21
  checked: Database schema (00001_initial_schema.sql line 88)
  found: user_profiles table column is `full_name text NOT NULL` -- there is NO column named `name`
  implication: Any Supabase query selecting `name` from user_profiles will fail

- timestamp: 2026-02-21
  checked: Request list page query (app/(dashboard)/requests/page.tsx line 30-31)
  found: Query uses `requester:user_profiles!requester_id(name, email)` and `assigned_user:user_profiles!assigned_to(name, email)` -- both reference non-existent `name` column
  implication: PostgREST embedded select on non-existent column causes the entire query to error

- timestamp: 2026-02-21
  checked: Request list page error handling (page.tsx line 59)
  found: `const requests = requestsResult.data ?? [];` -- if query errors, `.data` is null, falls back to empty array silently
  implication: The error is swallowed; user sees "No requests found" instead of error

- timestamp: 2026-02-21
  checked: Same bug pattern in other request files
  found: Multiple files have the same issue:
    - app/(dashboard)/requests/[id]/page.tsx line 49: same `name` in join select
    - app/(dashboard)/requests/[id]/page.tsx lines 90, 133, 218: `.select('id, name')` and `.select('name')` from user_profiles
    - app/(dashboard)/requests/page.tsx line 53: `.select('id, name')` for users list
  implication: Widespread `name` vs `full_name` mismatch across all request pages

- timestamp: 2026-02-21
  checked: Other pages using user_profiles correctly
  found: Admin user pages (user-actions.ts) correctly use `full_name` in queries and `.order('full_name')`
  implication: The bug is specific to the Phase 04 request pages, not a global issue

- timestamp: 2026-02-21
  checked: TypeScript types (lib/types/database.ts line 88-93)
  found: `RequestWithRelations` type expects `requester: { name: string; email: string }` -- TypeScript type also says `name` but DB has `full_name`
  implication: The type definition masks the bug at compile time

## Resolution

root_cause: |
  The `user_profiles` table has a column `full_name` (NOT `name`), but the Supabase queries in the request pages use `name` in their PostgREST embedded select strings. When PostgREST encounters a non-existent column in an embedded resource, the entire query fails and returns an error. The error is silently swallowed by the `?? []` fallback, resulting in an empty request list.

fix: (not applied -- research only)
verification: (not applied)
files_changed: []
