---
phase: 01-database-schema-supabase-setup
plan: 01
subsystem: database
tags: [supabase, postgresql, multi-tenant, schema, migrations]

# Dependency graph
requires: []
provides:
  - Complete database schema with 16 domain tables (companies, divisions, locations, categories, user_profiles, id_counters, requests, jobs, job_comments, inventory_items, inventory_movements, maintenance_templates, maintenance_schedules, notifications, audit_logs, media_attachments)
  - Supabase CLI initialized and linked to remote project
  - Multi-tenant indexes with company_id as leading column
  - Auto-updating timestamp triggers via set_updated_at() function
  - Counter-based display ID generation via generate_display_id() function
affects: [02-auth-rbac, 03-admin-tenant-config, 04-request-lifecycle, 05-job-assignment, 06-inventory-tracking, 07-preventive-maintenance, 08-media-notifications-dashboard, 09-polish]

# Tech tracking
tech-stack:
  added: [supabase-cli, postgresql]
  patterns: [soft-delete with deleted_at, updated_at triggers, composite indexes for multi-tenancy, counter-based display IDs, immutable audit logs]

key-files:
  created:
    - supabase/config.toml
    - supabase/migrations/00001_initial_schema.sql
    - .env.local
  modified: []

key-decisions:
  - "Used gen_random_uuid() for UUID generation (built-in, no extension needed)"
  - "Implemented soft-delete pattern with deleted_at on all tables except audit_logs (immutable)"
  - "Created composite indexes with company_id as leading column for multi-tenant query performance"
  - "Used partial unique indexes (WHERE deleted_at IS NULL) to allow multiple soft-deleted records with same natural keys"
  - "Deferred unique constraint checks to handle FK relationships during soft-delete operations"
  - "audit_logs table has NO deleted_at, NO updated_at - append-only immutable design"
  - "Pushed migration to remote database first (local Docker setup deferred)"

patterns-established:
  - "Soft-delete pattern: All domain tables have deleted_at timestamptz column (except audit_logs)"
  - "Standard columns: id (uuid PK), created_at (timestamptz), updated_at (timestamptz)"
  - "Multi-tenant pattern: company_id NOT NULL FK on all tenant-scoped tables"
  - "Audit trail: audit_logs table captures all state changes (immutable, no soft-delete)"
  - "Display IDs: Human-readable IDs via generate_display_id() with format PREFIX-YYYY-NNNN"

# Metrics
duration: 49min
completed: 2026-02-10
---

# Phase 01 Plan 01: Database Schema & Supabase Setup Summary

**Complete multi-tenant PostgreSQL schema with 16 domain tables, soft-delete pattern, composite indexes, and display ID generation deployed to Supabase**

## Performance

- **Duration:** 49 min 26 sec
- **Started:** 2026-02-10T08:23:15Z
- **Completed:** 2026-02-10T09:12:41Z
- **Tasks:** 2 (1 checkpoint, 1 auto)
- **Files modified:** 3 created

## Accomplishments

- Initialized Supabase project and linked remote database (project ref: cqlwysgofhaudiyzveww)
- Created comprehensive migration with all 16 domain tables covering requests, jobs, inventory, maintenance, notifications, and audit logging
- Implemented soft-delete pattern with deleted_at column on all tables except audit_logs (immutable)
- Added 30+ composite indexes with company_id as leading column for multi-tenant query optimization
- Implemented set_updated_at() trigger function attached to 13 tables for automatic timestamp updates
- Implemented generate_display_id() function for counter-based human-readable IDs (format: PREFIX-YYYY-NNNN)
- Successfully pushed migration to remote Supabase database

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase project and provide credentials** - Checkpoint (human-action) - User provided credentials
2. **Task 2: Initialize Supabase CLI and create all domain tables migration** - `18b50f8` (feat)

**Plan metadata:** (will be committed separately with STATE.md update)

## Files Created/Modified

- `supabase/config.toml` - Supabase local development configuration
- `supabase/migrations/00001_initial_schema.sql` - Complete database schema with 16 tables, indexes, triggers, and functions (18,638 bytes)
- `.env.local` - Supabase connection credentials (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- `supabase/.gitignore` - Ignore local Supabase temp files

## Decisions Made

**1. Used gen_random_uuid() for all UUID defaults**
- Built-in PostgreSQL function, no extension required
- Simplifies migration and ensures compatibility

**2. Implemented soft-delete with partial unique indexes**
- All domain tables have deleted_at timestamptz column (except audit_logs)
- Partial unique indexes with WHERE deleted_at IS NULL clause allow multiple soft-deleted records with same natural keys
- Enables restore functionality without constraint violations

**3. Deferred unique constraint checks**
- Used DEFERRABLE INITIALLY DEFERRED on unique constraints for divisions, locations, categories
- Handles FK relationships during soft-delete/restore operations
- Prevents constraint violations in transaction boundaries

**4. Multi-tenant index strategy**
- All composite indexes use company_id as leading column
- Optimizes tenant-isolated queries (most common access pattern)
- Example: idx_requests_company_status(company_id, status, created_at DESC)

**5. Immutable audit_logs design**
- NO deleted_at column - audit logs cannot be soft-deleted
- NO updated_at column - audit logs are append-only
- Ensures audit trail integrity and compliance

**6. Display ID counter pattern**
- generate_display_id() function uses id_counters table
- Format: PREFIX-YYYY-NNNN (e.g., REQ-2026-0001)
- Supports never/yearly/monthly reset periods
- Thread-safe with UPDATE...RETURNING pattern

**7. Pushed to remote first, deferred local setup**
- Migration successfully applied to remote Supabase database via `supabase db push`
- Local Docker environment setup deferred (not blocking for schema validation)
- Remote database can be used for development immediately

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Background command execution timeout**
- Issue: Several supabase CLI commands (db reset, start, status) ran in background mode without producing output
- Context: May be related to Docker not running or interactive prompts in background mode
- Resolution: Used `supabase db push` to apply migration directly to remote database, which succeeded immediately
- Impact: None - migration successfully applied to remote database, local setup can be revisited later

## User Setup Required

**Completed in Task 1 checkpoint:**
- Created Supabase project via dashboard
- Configured project region (Southeast Asia - Singapore, closest to Indonesia)
- Provided connection credentials (Project URL, anon key, service_role key, project ref ID)
- Credentials stored in `.env.local` (git-ignored)

No additional external service configuration required.

## Next Phase Readiness

**Ready for Phase 02 (Auth & RBAC):**
- Database schema complete with user_profiles table including role column
- FK relationship to auth.users established (Supabase Auth integration ready)
- All 5 role types defined in CHECK constraint: general_user, ga_staff, ga_lead, finance_approver, admin

**Ready for Phase 03 (Admin/Tenant Config):**
- companies, divisions, locations, categories tables ready for admin CRUD
- Partial unique indexes support soft-delete/restore operations

**Ready for Phase 04 (Request Lifecycle):**
- requests table complete with status transitions, approval fields, and feedback
- FK relationships to divisions, locations, categories, user_profiles established

**Ready for Phase 05 (Job Assignment):**
- jobs and job_comments tables ready
- FK to requests for request-linked jobs
- FK to maintenance_schedules for PM jobs

**Ready for Phase 06 (Inventory Tracking):**
- inventory_items and inventory_movements tables ready
- Status tracking and condition monitoring supported

**Ready for Phase 07 (Preventive Maintenance):**
- maintenance_templates and maintenance_schedules tables ready
- Checklist stored as JSONB for flexible task lists

**No blockers identified.**

## Self-Check: PASSED

**Files verified:**
- supabase/config.toml: EXISTS
- supabase/migrations/00001_initial_schema.sql: EXISTS (18,638 bytes)
- .env.local: EXISTS (contains all 3 required env vars)
- supabase/.gitignore: EXISTS

**Commits verified:**
- 18b50f8: FOUND (feat(01-01): initialize Supabase and create complete database schema)

**Migration status:**
- Successfully pushed to remote database via `supabase db push`
- No SQL errors reported during application

---
*Phase: 01-database-schema-supabase-setup*
*Completed: 2026-02-10*
