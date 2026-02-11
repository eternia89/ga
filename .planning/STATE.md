# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Centralize GA operations -- requests, jobs, inventory, maintenance -- with full traceability and real-time visibility for a corporate group.
**Current focus:** Phase 2 - Auth & RBAC

## Current Position

Phase: 2 of 9 (Auth & RBAC)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-11 -- Completed 02-01-PLAN.md (Supabase Auth Integration)

Progress: [██▓.......] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 20 min
- Total execution time: 1.00 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-schema-supabase-setup | 2/2 | 55min | 28min |
| 02-auth-rbac | 1/2 | 5min | 5min |

**Recent Trend:**
- Last 5 plans: 01-01 (49min), 01-02 (6min), 02-01 (5min)
- Trend: Accelerating rapidly (02-01 was 10x faster than average)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 9 phases derived from 82 v1 requirements. Phase 6 (Inventory) can run in parallel with Phases 4-5 since it only depends on Phase 3.
- [Roadmap]: Media handling, notifications, and dashboards consolidated into Phase 8 as cross-cutting concerns that touch all prior domains.
- [Roadmap]: GPS capture and audit trail viewer deferred to Phase 9 (polish) since core workflows function without them.
- [01-01]: Implemented soft-delete pattern with deleted_at on all tables except audit_logs (immutable, append-only)
- [01-01]: Used composite indexes with company_id as leading column for multi-tenant query optimization
- [01-01]: Deferred unique constraints (DEFERRABLE INITIALLY DEFERRED) to handle FK relationships during soft-delete operations
- [01-01]: audit_logs table has NO deleted_at, NO updated_at - ensures immutable audit trail for compliance
- [01-01]: Pushed migration to remote Supabase first; local Docker setup deferred (not blocking)
- [01-02]: Placed JWT helper functions in public schema (Supabase doesn't allow custom functions in auth schema)
- [01-02]: UPDATE policies omit deleted_at check to enable soft-delete operations
- [01-02]: No DELETE policies = hard deletes blocked at RLS level (soft delete only)
- [01-02]: Notifications are user-scoped (user_id = auth.uid()) not company-scoped
- [01-02]: Audit triggers use SECURITY DEFINER to bypass RLS for immutable audit log writes
- [UAT-01]: Request title is NOT a user-facing field. Keep column in DB but auto-generate it (e.g., from description or category+location). Users only fill description, location, photos on the submit form. Affects Phase 4 UI.
- [02-01]: Used Supabase auth.getUser() instead of getSession() for server-side JWT validation
- [02-01]: Google OAuth as primary auth method with prominent placement above email/password
- [02-01]: Deactivation check queries user_profiles.deleted_at on every protected route navigation
- [02-01]: Rate limiting handled by Supabase built-in (60 req/min per IP) with progressive slowdown

### Pending Todos

None yet.

### Blockers/Concerns

- Verify pg_cron availability on chosen Supabase plan (needed for Phase 5 auto-accept and Phase 7 PM job generation)
- Verify Supabase Auth hooks / JWT claims custom fields availability by plan tier
- Confirm shadcn/ui CLI compatibility with Tailwind v4

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed Plan 02-01 (Supabase Auth Integration) — ready for Plan 02-02
Resume file: .planning/phases/02-auth-rbac/02-01-SUMMARY.md
Next: /gsd:execute-phase 02 --plan 02
