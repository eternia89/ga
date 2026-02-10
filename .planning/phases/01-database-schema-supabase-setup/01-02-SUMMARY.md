---
phase: 01-database-schema-supabase-setup
plan: 02
subsystem: database
tags: [supabase, postgresql, rls, multi-tenant, audit, security]

# Dependency graph
requires: [01-01]
provides:
  - RLS enabled on all 16 public tables
  - JWT claim extraction functions (current_user_company_id, current_user_division_id, current_user_role)
  - 47 baseline RLS policies enforcing company isolation and soft-delete filtering
  - Generic audit trigger infrastructure capturing all state changes
  - 14 domain tables with audit triggers attached
affects: [02-auth-rbac, 03-admin-tenant-config, 04-request-lifecycle, 05-job-assignment, 06-inventory-tracking, 07-preventive-maintenance, 08-media-notifications-dashboard, 09-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [RLS policies for multi-tenancy, SECURITY DEFINER functions, audit triggers with JSONB capture, soft-delete aware policies]

key-files:
  created:
    - supabase/migrations/00002_rls_helper_functions.sql
    - supabase/migrations/00003_rls_policies.sql
    - supabase/migrations/00004_audit_triggers.sql
  modified: []

key-decisions:
  - "Placed JWT helper functions in public schema (Supabase doesn't allow custom functions in auth schema)"
  - "Used SECURITY DEFINER on helper functions with SET search_path for safe JWT access"
  - "UPDATE policies omit deleted_at check to enable soft-delete operations"
  - "SELECT policies include deleted_at IS NULL (except audit_logs which has no deleted_at column)"
  - "No DELETE policies = hard deletes blocked at RLS level"
  - "Notifications are user-scoped (user_id = auth.uid()) not company-scoped"
  - "audit_logs is read-only for authenticated users (writes via SECURITY DEFINER trigger)"
  - "id_counters has SELECT/UPDATE only (no direct client INSERT/DELETE)"

patterns-established:
  - "RLS policy naming: {table}_{operation} (e.g., requests_select, requests_insert)"
  - "Standard policy pattern: SELECT uses company_id + deleted_at, UPDATE uses company_id only"
  - "Audit trigger pattern: SECURITY DEFINER + SET search_path = public for security"
  - "Special-case triggers for tables without company_id (e.g., companies table)"

# Metrics
duration: 6min
completed: 2026-02-10
---

# Phase 01 Plan 02: RLS Policies & Audit Triggers Summary

**Complete multi-tenant security layer with Row-Level Security policies enforcing company isolation, soft-delete filtering, and immutable audit logging infrastructure**

## Performance

- **Duration:** 6 min 5 sec
- **Started:** 2026-02-10T09:17:14Z
- **Completed:** 2026-02-10T09:23:19Z
- **Tasks:** 3 (all auto)
- **Files created:** 3 migrations

## Accomplishments

- Enabled Row-Level Security on all 16 public tables (companies through media_attachments)
- Created three JWT claim extraction helper functions in public schema for RLS policy use
- Implemented 47 baseline RLS policies across all tables enforcing company-scoped access
- SELECT policies filter on company_id + deleted_at IS NULL (except audit_logs and id_counters)
- UPDATE policies omit deleted_at check to allow soft-delete operations
- No DELETE policies exist (hard deletes blocked at RLS level)
- Created generic audit_trigger() function with SECURITY DEFINER to capture all state changes
- Created special audit_trigger_companies() for companies table (no company_id column)
- Attached audit triggers to 14 domain tables (excludes audit_logs and id_counters)
- All audit entries capture: table_name, record_id, operation, old/new data, changed fields, user context

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RLS helper functions and enable RLS on all tables** - `9819a46` (feat)
2. **Task 2: Create baseline RLS policies for all tables** - `c123b5d` (feat)
3. **Task 3: Create audit trigger function and attach to all domain tables** - `efc0878` (feat)

**Plan metadata:** (will be committed separately with STATE.md update)

## Files Created/Modified

- `supabase/migrations/00002_rls_helper_functions.sql` - JWT helper functions + RLS enablement (72 lines)
- `supabase/migrations/00003_rls_policies.sql` - 47 RLS policies for all tables (276 lines)
- `supabase/migrations/00004_audit_triggers.sql` - Audit triggers for 14 domain tables (191 lines)

## Decisions Made

**1. Used public schema for JWT helper functions**
- Issue: Supabase managed instances don't allow creating functions in auth schema
- Solution: Placed current_user_company_id(), current_user_division_id(), current_user_role() in public schema
- Functions use SECURITY DEFINER with SET search_path = public for safe JWT access

**2. UPDATE policies omit deleted_at check**
- Critical for soft-delete functionality: allows users to set deleted_at = now()
- USING clause checks company_id only (no deleted_at filter)
- Enables soft-delete without RLS blocking the operation

**3. SELECT policies include soft-delete filter**
- All SELECT policies filter on deleted_at IS NULL (except audit_logs)
- audit_logs has no deleted_at column (immutable, append-only design from Plan 01-01)
- id_counters omits deleted_at check (internal utility table)

**4. No DELETE policies = hard deletes blocked**
- Only soft deletes allowed through UPDATE operations
- service_role key can still hard delete (bypasses RLS for admin operations)

**5. User-scoped notifications**
- Notifications use user_id = auth.uid() (not company_id)
- Users can only see/update their own notifications
- No INSERT policy (server-side triggers create notifications via service_role)

**6. Audit trigger uses SECURITY DEFINER**
- Bypasses RLS on audit_logs table to write entries
- SET search_path = public prevents search_path hijacking attacks
- Special trigger for companies table (uses id as company_id)

**7. Baseline policies for all roles**
- These are BASELINE policies (company isolation + soft-delete filtering)
- Role-specific refinements (e.g., GA Lead sees all divisions, General User only sees own division) deferred to Phase 2 (RBAC)
- Ensures security from day one while simplifying initial implementation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] JWT helper function schema placement**
- **Found during:** Task 1
- **Issue:** Plan specified creating functions in auth schema (auth.user_company_id(), etc.), but Supabase managed instances prohibit creating custom functions in the auth schema (permission denied error)
- **Fix:** Placed functions in public schema with different names (public.current_user_company_id(), etc.) and used SECURITY DEFINER with SET search_path for security
- **Files modified:** supabase/migrations/00002_rls_helper_functions.sql
- **Commit:** 9819a46
- **Impact:** None on functionality. RLS policies reference public.current_user_company_id() instead of auth.user_company_id(). Both approaches are secure and functionally equivalent.

## Issues Encountered

None. All migrations applied successfully on first attempt after schema fix.

## User Setup Required

None. All security infrastructure is server-side.

## Next Phase Readiness

**Ready for Phase 02 (Auth & RBAC):**
- RLS policies in place, ready for role-specific refinements
- JWT claim extraction functions ready to be populated during auth flow
- User profiles table has RLS policies enforcing company isolation

**Ready for Phase 03 (Admin/Tenant Config):**
- All admin tables (companies, divisions, locations, categories) have RLS policies
- Soft-delete safe UPDATE policies allow admin UI to soft-delete/restore records

**Ready for Phase 04-09 (All subsequent phases):**
- All domain tables protected with company-scoped RLS policies
- Audit trail infrastructure captures all state changes for compliance
- Multi-tenant security boundary fully established

**Blockers identified:** None

**Requirements satisfied:**
- REQ-RBAC-004: RLS policies on all public tables enforce company isolation
- REQ-RBAC-005: JWT claim extraction functions deployed (current_user_company_id, current_user_division_id, current_user_role)
- REQ-RBAC-008: All SELECT RLS policies filter on deleted_at IS NULL (except audit_logs which is immutable)
- REQ-DATA-001: Soft-delete pattern supported by RLS-safe UPDATE policies
- REQ-DATA-003: audit_logs table with triggers captures all create/update/delete events

## Self-Check: PASSED

**Files verified:**
- supabase/migrations/00002_rls_helper_functions.sql: EXISTS (72 lines)
- supabase/migrations/00003_rls_policies.sql: EXISTS (276 lines)
- supabase/migrations/00004_audit_triggers.sql: EXISTS (191 lines)

**Commits verified:**
- 9819a46: FOUND (feat(01-02): create RLS helper functions and enable RLS on all tables)
- c123b5d: FOUND (feat(01-02): create baseline RLS policies for all tables)
- efc0878: FOUND (feat(01-02): create audit trigger function and attach to all domain tables)

**Migration status:**
- All three migrations successfully pushed to remote database via `supabase db push`
- No SQL errors reported during application

**Key assertions:**
- RLS enabled on 16 tables: Cannot verify directly (no local psql), but migration applied without errors
- 47 RLS policies created: Verified by counting policies in migration file
- 14 audit triggers attached: Verified by counting triggers in migration file
- No UPDATE policy references deleted_at: Verified by inspection of migration file
- All SELECT policies (except audit_logs, id_counters) reference deleted_at: Verified by inspection

---
*Phase: 01-database-schema-supabase-setup*
*Completed: 2026-02-10*
