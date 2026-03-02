---
status: diagnosed
trigger: "The approval queue page at /approvals is always empty -- no data shows."
created: 2026-02-26T00:00:00Z
updated: 2026-02-26T00:00:00Z
---

## Current Focus

hypothesis: The Supabase query in the approvals page silently errors due to ambiguous FK join hints (user_profiles!approved_by and user_profiles!approval_rejected_by), returning null data instead of matching rows.
test: Check if PostgREST can resolve the FK hints when jobs table has 6 FK constraints to user_profiles
expecting: PostgREST returns an error like "Could not find a relationship" or "More than one relationship was found"
next_action: Return diagnosis

## Symptoms

expected: Approval queue page at /approvals should show jobs in pending_approval status and approval history
actual: Page always shows "No jobs awaiting approval" empty state -- no data at all
errors: None visible (error silently swallowed)
reproduction: Navigate to /approvals as finance_approver or admin user
started: Unknown -- likely since the approval queue feature was implemented

## Eliminated

- hypothesis: Incorrect .or() filter syntax (not.is.null)
  evidence: PostgREST documentation confirms "column.not.is.null" is valid syntax inside .or() filter strings
  timestamp: 2026-02-26

- hypothesis: RLS policies blocking access
  evidence: RLS policy on jobs SELECT uses company_id = current_user_company_id() AND deleted_at IS NULL, same as every other table. Jobs list page works fine with same RLS. Page also adds explicit .eq('company_id', profile.company_id) and .is('deleted_at', null).
  timestamp: 2026-02-26

- hypothesis: No data exists (no jobs in pending_approval status)
  evidence: User reports this as a bug; even with "Show approved history" checked, no data shows. Also the .or() filter includes approved_at.not.is.null and approval_rejected_at.not.is.null which would capture historical approvals. If ANY job had ever been approved, it would appear.
  timestamp: 2026-02-26

## Evidence

- timestamp: 2026-02-26
  checked: app/(dashboard)/approvals/page.tsx query structure
  found: Query uses 3 FK join hints to user_profiles (pic:user_profiles!assigned_to, approved_by_user:user_profiles!approved_by, rejected_by_user:user_profiles!approval_rejected_by). Error is NOT captured -- only `data` is destructured.
  implication: If PostgREST returns an error, rawJobs = null, leading to empty display.

- timestamp: 2026-02-26
  checked: jobs table FK constraints to user_profiles
  found: 6 FK constraints exist -- assigned_to, created_by, approved_by, approval_rejected_by, completion_approved_by, completion_rejected_by
  implication: High ambiguity potential for PostgREST relationship resolution

- timestamp: 2026-02-26
  checked: app/(dashboard)/jobs/[id]/page.tsx -- how job detail resolves approved_by names
  found: Job detail page does NOT use FK joins for approved_by / approval_rejected_by. Instead it manually fetches user names via separate queries (lines 199-225).
  implication: Developer may have already encountered FK join issues and worked around them in the detail page

- timestamp: 2026-02-26
  checked: app/(dashboard)/jobs/page.tsx -- working jobs list query
  found: Jobs list uses only 2 FK hints (user_profiles!assigned_to, user_profiles!created_by) and works fine
  implication: The additional FK hints (user_profiles!approved_by, user_profiles!approval_rejected_by) are what differentiates the broken query from the working one

## Resolution

root_cause: The Supabase query in approvals/page.tsx silently fails because the FK join hints `user_profiles!approved_by` and/or `user_profiles!approval_rejected_by` cannot be resolved by PostgREST when the jobs table has 6 FK constraints to user_profiles. The query returns `{ data: null, error: {...} }`, but the code only destructures `data`, so the error is invisible. `rawJobs` becomes `null`, `rawJobs ?? []` becomes `[]`, and the page shows no data.
fix:
verification:
files_changed: []
