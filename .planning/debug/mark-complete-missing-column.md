---
status: diagnosed
trigger: "Clicking 'Mark Complete' on a job throws: 'Could not find the completion_submitted_at column of jobs in the schema cache'"
created: 2026-02-26T15:00:00Z
updated: 2026-02-26T15:00:00Z
---

## Current Focus

hypothesis: Migration 00013_completion_approval.sql was created but never applied to the live Supabase database
test: Check if the columns added by migration 00013 exist in the actual database
expecting: Columns do not exist because migration was not run
next_action: Return diagnosis — user must apply the migration

## Symptoms

expected: Clicking "Mark Complete" on an in_progress job should transition it to pending_completion_approval (when cost >= budget_threshold) or directly to completed
actual: Error thrown: "Could not find the 'completion_submitted_at' column of 'jobs' in the schema cache"
errors: Supabase PostgREST schema cache error — column does not exist in the database
reproduction: Click "Mark Complete" on any in_progress job where estimated_cost >= budget_threshold
started: After plans 05-09/05-10 were implemented (completion approval flow)

## Eliminated

(none — root cause identified on first hypothesis)

## Evidence

- timestamp: 2026-02-26T15:00:00Z
  checked: server action code in app/actions/job-actions.ts (lines 346-378)
  found: updateJobStatus action sets `jobUpdate.completion_submitted_at = now` on line 370 when requiresCompletionApproval is true. This triggers the Supabase update that fails.
  implication: The code references a column that must exist in the jobs table

- timestamp: 2026-02-26T15:00:00Z
  checked: migration file supabase/migrations/00013_completion_approval.sql
  found: Migration adds 6 new columns to jobs table (completion_submitted_at, completion_approved_at, completion_approved_by, completion_rejected_at, completion_rejected_by, completion_rejection_reason) and updates the status CHECK constraint to include 'pending_completion_approval'
  implication: The migration file exists in the codebase but must be applied to the database

- timestamp: 2026-02-26T15:00:00Z
  checked: TypeScript types in lib/types/database.ts (lines 136-141)
  found: The Job interface already includes all 6 completion columns — types were updated when the code was written
  implication: Code and types are in sync; only the actual DB schema is missing the columns

- timestamp: 2026-02-26T15:00:00Z
  checked: approval-actions.ts (approveCompletion on line 239, rejectCompletion on line 345)
  found: Both actions also reference completion_submitted_at, completion_approved_at, completion_approved_by, completion_rejected_at, completion_rejected_by, completion_rejection_reason columns
  implication: The entire completion approval flow (approve, reject, and the initial "mark complete" path) depends on migration 00013

- timestamp: 2026-02-26T15:00:00Z
  checked: The error message pattern "Could not find the X column of Y in the schema cache"
  found: This is a Supabase PostgREST error that occurs when application code tries to write to a column that does not exist in the actual PostgreSQL database schema
  implication: The column physically does not exist in the DB — not a caching issue, but a missing schema issue

## Resolution

root_cause: Migration 00013_completion_approval.sql was created in the codebase but never applied to the live Supabase database. This migration adds 6 columns to the jobs table (completion_submitted_at, completion_approved_at, completion_approved_by, completion_rejected_at, completion_rejected_by, completion_rejection_reason) and updates the status CHECK constraint to include 'pending_completion_approval'. Without these columns, any code path that attempts to set completion_submitted_at — triggered when a user clicks "Mark Complete" on a job with estimated_cost >= budget_threshold — fails with a PostgREST schema cache error.

fix: Run migration 00013_completion_approval.sql against the live Supabase database (either via `npx supabase db push` or by pasting the SQL into the Supabase Dashboard SQL Editor)

verification: ""
files_changed: []
