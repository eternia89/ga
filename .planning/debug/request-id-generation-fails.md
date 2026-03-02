---
status: diagnosed
trigger: "Submitting a new request fails with 'Failed to generate request ID. Please try again.'"
created: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:00:00Z
---

## Current Focus

hypothesis: Migration 00007 was never pushed to remote database, so generate_request_display_id function does not exist
test: Ran `supabase migration list` to check remote status
expecting: 00007 shows in Remote column if applied
next_action: Return diagnosis — root cause confirmed

## Symptoms

expected: Submitting a new request generates a display ID (e.g., ABC-26-0001) and creates the request
actual: Form submission fails with error "Failed to generate request ID. Please try again."
errors: "Failed to generate request ID. Please try again." (thrown from app/actions/request-actions.ts:26)
reproduction: Submit any new request via the request form
started: Since Phase 4 deployment (requests feature)

## Eliminated

- hypothesis: RLS policy blocks id_counters INSERT (no INSERT policy exists)
  evidence: Function is SECURITY DEFINER — runs as postgres superuser, bypasses RLS entirely
  timestamp: 2026-02-21

- hypothesis: Missing GRANT EXECUTE permissions on function
  evidence: Not relevant because the function doesn't exist in remote DB at all
  timestamp: 2026-02-21

- hypothesis: Bug in generate_request_display_id SQL logic
  evidence: Logic is sound (handles NULL company code, handles first-time INSERT vs UPDATE)
  timestamp: 2026-02-21

- hypothesis: profile.company_id is null causing function to fail
  evidence: company_id is NOT NULL in user_profiles schema, and profile existence is verified before RPC call
  timestamp: 2026-02-21

## Evidence

- timestamp: 2026-02-21
  checked: app/actions/request-actions.ts lines 22-27
  found: Error thrown when rpcError is truthy OR displayId is falsy from supabase.rpc('generate_request_display_id')
  implication: Either the function errors out or returns null

- timestamp: 2026-02-21
  checked: supabase/migrations/00007_requests_phase4.sql
  found: Contains CREATE OR REPLACE FUNCTION public.generate_request_display_id — SECURITY DEFINER, RETURNS text
  implication: Function definition exists locally and is correct

- timestamp: 2026-02-21
  checked: RLS policies in 00003_rls_policies.sql for id_counters
  found: Only SELECT and UPDATE policies exist — no INSERT policy
  implication: Would block non-superuser INSERT, but SECURITY DEFINER bypasses RLS

- timestamp: 2026-02-21
  checked: `supabase migration list` output
  found: Migration 00007 shows in Local column but NOT in Remote column (empty)
  implication: CONFIRMED — migration 00007 was never pushed to the remote Supabase database

- timestamp: 2026-02-21
  checked: lib/safe-action.ts
  found: authActionClient uses createClient() (anon key), not admin client
  implication: RPC calls go through PostgREST with user JWT — function must exist in remote DB

## Resolution

root_cause: Migration 00007_requests_phase4.sql was never pushed to the remote Supabase database. The `generate_request_display_id` Postgres function does not exist in the remote database. When the server action calls `supabase.rpc('generate_request_display_id', ...)`, PostgREST returns an error (likely PGRST202 — function not found), which triggers the "Failed to generate request ID" error message.
fix: Run `supabase db push` to apply migration 00007 to the remote database
verification: []
files_changed: []
