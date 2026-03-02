---
status: diagnosed
trigger: "General users can see all jobs on /jobs page, but should only see jobs assigned to them"
created: 2026-02-26T00:00:00Z
updated: 2026-02-26T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Jobs list page has no role-based filtering at either the RLS or application query level
test: Read jobs page query, RLS policies, and compared with requests page pattern
expecting: Missing role-based filter on jobs query and/or RLS policy
next_action: Return diagnosis

## Symptoms

expected: General users (role "user" or "ga_staff") should only see jobs where they are the assigned PIC. Admin/GA Lead can see all jobs.
actual: General users can see all jobs on /jobs page
errors: None (functional bug, not error)
reproduction: Log in as a general user, navigate to /jobs, observe all jobs visible
started: Unknown - likely always been this way (no role-based filtering was ever implemented)

## Eliminated

## Evidence

- timestamp: 2026-02-26T00:01:00Z
  checked: app/(dashboard)/jobs/page.tsx lines 36-52 - jobs query
  found: Query filters only by company_id and deleted_at IS NULL. No role-based filtering exists. All jobs for the company are returned regardless of user role.
  implication: Application layer does not restrict jobs by role or assignment.

- timestamp: 2026-02-26T00:02:00Z
  checked: supabase/migrations/00003_rls_policies.sql lines 126-137 - jobs RLS policies
  found: The "jobs_select" RLS policy only enforces company_id = current_user_company_id() AND deleted_at IS NULL. No role-based restriction. All authenticated users in the same company can read all jobs.
  implication: RLS layer does not restrict jobs by role or assignment either.

- timestamp: 2026-02-26T00:03:00Z
  checked: app/(dashboard)/requests/page.tsx lines 44-47 - requests page comparison
  found: The requests page DOES have role-based filtering: `if (profile.role === 'general_user') { requestQuery.eq('requester_id', profile.id); }`. This pattern is completely absent from the jobs page.
  implication: The requests page has the correct pattern implemented; the jobs page simply never got equivalent filtering logic.

- timestamp: 2026-02-26T00:04:00Z
  checked: lib/auth/permissions.ts - role permissions
  found: general_user has JOB_VIEW_ALL permission (line 58), which grants route access to /jobs. The permission name "view:all" is misleading — per requirements, general users should only see assigned jobs.
  implication: Permission naming may be intentionally broad (grants route access), but the actual data scoping needs to happen at the query level, not the permission level.

- timestamp: 2026-02-26T00:05:00Z
  checked: app/(dashboard)/jobs/[id]/page.tsx - job detail page
  found: The job detail page also has no role-based access check. Any authenticated user in the same company can view any job by navigating to /jobs/[id] directly, regardless of whether they are assigned to it.
  implication: Both the list page AND the detail page are affected.

## Resolution

root_cause: The jobs list page query (app/(dashboard)/jobs/page.tsx) fetches ALL company jobs without any role-based filtering. Unlike the requests page which checks `profile.role === 'general_user'` and filters to only the user's own requests, the jobs page has no equivalent logic. Additionally, the Supabase RLS policy on the jobs table (migration 00003) only enforces company-level isolation, not role-based access. Both layers (application query + RLS) lack role-based scoping for jobs.
fix:
verification:
files_changed: []
