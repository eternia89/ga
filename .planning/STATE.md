# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Centralize GA operations -- requests, jobs, inventory, maintenance -- with full traceability and real-time visibility for a corporate group.
**Current focus:** Phase 7 - Maintenance

## Current Position

Phase: 6 of 9 (Inventory) — COMPLETE
Plan: 3 of 3 in phase complete — Phase 6 done, advancing to Phase 7
Status: Phase 6 complete — asset list, creation, detail, status changes, transfers all built
Last activity: 2026-02-25 -- Completed 06-03-PLAN.md (Asset Detail Page)

Progress: [█████████████] (Phase 6 complete — 3/3 plans done)

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 8.7 min
- Total execution time: 1.94 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-schema-supabase-setup | 2/2 | 55min | 28min |
| 02-auth-rbac | 2/2 | 11min | 6min |
| 03-admin-system-configuration | 3/3 | 25min | 8min |
| 04-requests | 2/2 | 13min | 6.5min |
| 05-jobs-approvals | 5/5 | 32min | 6.4min |
| 06-inventory | 3/3 | 17min | 5.7min |

**Recent Trend:**
- Last 5 plans: 05-05 (7min), 06-01 (4min), 06-02 (4min), 06-03 (9min)
- Trend: Consistent — 4-12 min per plan (excellent velocity)

*Updated after each plan completion*
| Phase 06-inventory P01 | 4 | 2 tasks | 7 files |
| Phase 06-inventory P02 | 4 | 2 tasks | 8 files |
| Phase 06-inventory P03 | 9 | 2 tasks | 10 files |

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
- [05-01]: auto_accept_completed_requests sets status to 'accepted' (not 'completed') to match existing DB schema STATUS_LABELS
- [05-01]: pg_cron schedule left as manual step with comments due to migration failure risk if extension not yet enabled
- [05-01]: company_id added to job_requests join table for consistent RLS pattern (no subquery join needed in policies)
- [05-01]: submitForApproval re-fetches company_settings in action body to prevent frontend bypass of threshold check
- [05-01]: rejectJob sends job back to 'assigned' status (not 'created') so PIC is preserved after rejection
- [05-02]: JobTimelineEvent uses { type, at, by, details } structure matching the jobs/[id]/page.tsx audit log processor
- [05-02]: in_progress requests included in eligible requests dropdown annotated with linked job display_id
- [05-02]: job-detail scaffold files (job-detail-*.tsx, job-timeline, job-comment-form, jobs/[id]/page.tsx) incorporated from pre-existing untracked state to resolve TS blocking errors
- [05-03]: addJobComment returns commentId for two-step photo upload — previously returned only success:true
- [05-03]: JobTimeline upgraded with ScrollArea, date-fns formatting, type-specific icons, and PhotoLightbox for comment photo viewing
- [05-04]: Approval queue uses simple shadcn Table (not TanStack) since data is pre-sorted server-side with no client filtering needed
- [05-04]: updateCompanySetting uses select-then-insert/update pattern for explicit control; Company Settings page uses extensible card layout for future settings
- [05-04]: LinkedJobRow type fix: Supabase returns FK relations as arrays via select('job:jobs(...)'), cast via unknown to handle polymorphic type
- [Phase 05-05]: RequestAcceptanceDialog uses mode prop (accept/reject) to dual-purpose one component instead of two
- [Phase 05-05]: submitFeedback transitions request to closed status — final terminal state indicating feedback received
- [Phase 05-05]: acceptance_rejected_reason field distinguishes work-rejection from GA-level request rejection
- [Phase 06-inventory]: sold_disposed is single terminal state merging old sold+disposed; movements use pending/accepted/rejected/cancelled
- [Phase 06-inventory]: unique partial index idx_one_pending_movement enforces one pending transfer per asset at DB level plus code-level guard for clean error messages
- [Phase 06-inventory]: maintenance_schedules auto-pause fires on both broken and sold_disposed status transitions from changeAssetStatus action
- [Phase 06-inventory]: photo upload API uses photo_type field mapped to 5 distinct entity_types for polymorphic media_attachments (asset_creation, asset_status_change, asset_transfer_send, asset_transfer_receive, asset_transfer_reject)
- [06-02]: In Transit as virtual filter option (value 'in_transit_virtual') in status dropdown — keeps filter bar compact, no separate filter control needed
- [06-02]: pendingTransfers map fetched server-side, passed to AssetTable, propagated via TanStack Table meta for per-row lookup in column cells
- [06-02]: AssetPhotoUpload is a controlled component — photos state lives in parent form, onPhotosChange callback syncs upward
- [06-02]: Invoice upload uses file list UI (not thumbnail grid) since PDFs cannot show preview thumbnails
- [Phase 06-03]: AssetDetailInfo renders status badge as button wrapper — cursor/disabled controls clickability without forking badge component
- [Phase 06-03]: Timeline merges audit_logs and inventory_movements client-side into single sorted chronological array
- [Phase 06-03]: Sidebar Inventory nav item activated at plan 03 completion — list + detail both functional

### Pending Todos

- Push migrations 00007 through 00009 to Supabase: `supabase db push`
- Enable pg_cron extension in Supabase Dashboard and run schedule manually (see 05-01-SUMMARY.md)

### Blockers/Concerns

- ~~Verify pg_cron availability on chosen Supabase plan~~ RESOLVED: pg_cron available on all tiers but must be enabled manually in Dashboard before cron.schedule() can run
- Verify Supabase Auth hooks / JWT claims custom fields availability by plan tier
- ~~Confirm shadcn/ui CLI compatibility with Tailwind v4~~ RESOLVED: shadcn/ui v3.8.4 works with Tailwind v4, detected v4 automatically during init

## Session Continuity

Last session: 2026-02-25
Stopped at: Completed 06-03-PLAN.md (Asset Detail Page) — Phase 6 complete (3/3 plans)
Resume file: .planning/phases/06-inventory/06-03-SUMMARY.md
Next: Execute Phase 7 (Maintenance)
