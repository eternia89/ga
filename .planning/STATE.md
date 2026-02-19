# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Centralize GA operations -- requests, jobs, inventory, maintenance -- with full traceability and real-time visibility for a corporate group.
**Current focus:** Phase 4 - Requests (complete)

## Current Position

Phase: 4 of 9 (Requests)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-02-19 -- Completed 04-02-PLAN.md (Request List and Triage UI)

Progress: [█████.....] 100% (Phase 4 complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 9
- Average duration: 10 min
- Total execution time: 1.73 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-schema-supabase-setup | 2/2 | 55min | 28min |
| 02-auth-rbac | 2/2 | 11min | 6min |
| 03-admin-system-configuration | 3/3 | 25min | 8min |
| 04-requests | 2/2 | 13min | 6.5min |

**Recent Trend:**
- Last 5 plans: 03-02 (8min), 03-03 (9min), 04-01 (5min), 04-02 (8min)
- Trend: Consistent — 6-8 min per plan (excellent velocity)

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
- [02-02]: Five roles with distinct permission sets: general_user (read-all, write-own-division), ga_staff (inventory ops), ga_lead (full ops), finance_approver (approval-only), admin (all permissions)
- [02-02]: Permission map uses resource:action naming pattern for clarity and consistency
- [02-02]: RLS policies refined: general_user can only INSERT requests for own division, UPDATE own requests; admin-only INSERT/UPDATE on config tables
- [02-02]: Navigation items hidden entirely for unauthorized roles; unbuilt features shown grayed/disabled with "Coming soon" indicator
- [02-02]: App shell established: fixed sidebar (company at top, nav in middle, user menu at bottom), main content area with AuthProvider context
- [03-01]: shadcn/ui as design system foundation with new-york style and neutral base color for consistent, accessible UI primitives
- [03-01]: TanStack Table for data table state management (industry-standard, excellent TypeScript support)
- [03-01]: nuqs for URL-synced query state in Settings page tabs (type-safe, App Router compatible)
- [03-01]: next-safe-action for type-safe server actions with middleware pattern (actionClient → authActionClient → adminActionClient layers)
- [03-01]: Inline feedback over toasts for action feedback (simpler pattern, minimal UI noise)
- [03-01]: DeleteConfirmDialog blocks deletion when dependencyCount > 0 (no text input shown, button disabled entirely)
- [03-01]: Entity counts fetched in dashboard layout and passed to sidebar for admin users only (badge display capability)
- [03-02]: Categories are GLOBAL (shared across companies per LOCKED decision) - company_id used only for audit, ALL SELECT queries fetch all categories without company filter
- [03-02]: Category type (request/asset) is immutable after creation to prevent data integrity issues
- [03-02]: Soft-delete with dependency checking prevents deletion when active references exist; error shows count and type (e.g., "Cannot delete -- 5 users assigned")
- [03-02]: Settings page split into server component (parallel data fetching) and client component (tab navigation)
- [03-03]: New users created without password (must use OAuth or forgot-password flow for initial password)
- [03-03]: Created users are immediately active (no approval workflow)
- [03-03]: Email is immutable after user creation (cannot be changed)
- [03-03]: Role changes take effect immediately without confirmation
- [03-03]: User list defaults to admin's company with dropdown to select other companies
- [03-03]: Supabase Admin client uses service_role key for user management operations that bypass RLS
- [04-01]: Two-step photo upload: create request first (returns requestId), then upload photos via /api/uploads/request-photos — prevents orphaned files in Storage
- [04-01]: API route used for file uploads (not server action) to handle multipart/form-data without body size limits
- [04-01]: generate_request_display_id uses SECURITY DEFINER SET search_path = public for atomic counter updates across RLS boundaries
- [04-01]: authActionClient for ALL request mutations; triage/reject check role inside action body (not adminActionClient)
- [04-01]: STATUS_LABELS maps DB value 'submitted' to user-facing label 'New' — always use this for display
- [04-02]: Client-side filtering in request list (not server re-query) — data fetched once server-side, filtered in-memory via nuqs URL state
- [04-02]: Audit log event classification: rejection check first (has rejection_reason), then cancellation (status=cancelled), then triage (category_id/priority/assigned_to changed), then status_change, then field_update
- [04-02]: RequestDetailClient wrapper coordinates edit state between server component page and client component children (avoids server/client state mismatch)
- [04-02]: Inline triage on detail page: GA Lead sees editable form on submitted requests rather than a separate dialog, matches CONTEXT.md locked decision

### Pending Todos

- Push migration 00007_requests_phase4.sql to Supabase: `supabase db push`

### Blockers/Concerns

- Verify pg_cron availability on chosen Supabase plan (needed for Phase 5 auto-accept and Phase 7 PM job generation)
- Verify Supabase Auth hooks / JWT claims custom fields availability by plan tier
- ~~Confirm shadcn/ui CLI compatibility with Tailwind v4~~ RESOLVED: shadcn/ui v3.8.4 works with Tailwind v4, detected v4 automatically during init

## Session Continuity

Last session: 2026-02-19
Stopped at: Phase 4 complete — verification passed (5/5 must-haves)
Resume file: .planning/phases/04-requests/04-VERIFICATION.md
Next: /gsd:plan-phase 5 (Jobs & Approvals)
