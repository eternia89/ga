---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed quick-260326-fca (Vision API security fix)
last_updated: "2026-03-26T04:11:16.822Z"
last_activity: "2026-03-20 - Completed quick task 126: Centralize inline role arrays into OPERATIONAL_ROLES"
progress:
  total_phases: 10
  completed_phases: 10
  total_plans: 48
  completed_plans: 48
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-10)

**Core value:** Centralize GA operations -- requests, jobs, inventory, maintenance -- with full traceability and real-time visibility for a corporate group.
**Current focus:** Phase 09.1 - UI Improvements

## Current Position

Phase: 09.1 (UI Improvements) — COMPLETE
Plan: 5 of 5 in phase complete
Status: Completed 09.1-04-PLAN.md — CTA and export buttons moved to page headers
Last activity: 2026-03-20 - Completed quick task 126: Centralize inline role arrays into OPERATIONAL_ROLES

Progress: [████████████████████████] (Phase 09.1 — 5/5 plans done)

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: 7.9 min
- Total execution time: 2.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-schema-supabase-setup | 2/2 | 55min | 28min |
| 02-auth-rbac | 2/2 | 11min | 6min |
| 03-admin-system-configuration | 3/3 | 25min | 8min |
| 04-requests | 2/2 | 13min | 6.5min |
| 05-jobs-approvals | 5/5 | 32min | 6.4min |
| 06-inventory | 3/3 | 17min | 5.7min |
| 07-preventive-maintenance | 4/4 | 20min | 5min |

**Recent Trend:**
- Last 5 plans: 06-01 (4min), 06-02 (4min), 06-03 (9min), 07-01 (5min)
- Trend: Consistent — 4-12 min per plan (excellent velocity)

*Updated after each plan completion*
| Phase 06-inventory P01 | 4 | 2 tasks | 7 files |
| Phase 06-inventory P02 | 4 | 2 tasks | 8 files |
| Phase 06-inventory P03 | 9 | 2 tasks | 10 files |
| Phase 07-preventive-maintenance P01 | 5 | 2 tasks | 9 files |
| Phase 07-preventive-maintenance P02 | 4 | 2 tasks | 11 files |
| Phase 07-preventive-maintenance P03 | 6 | 2 tasks | 9 files |
| Phase 07-preventive-maintenance P04 | 4 | 2 tasks | 11 files |
| Phase 08-media-notifications-dashboards P01 | 8 | 2 tasks | 7 files |
| Phase 08-media-notifications-dashboards P07 | 3 | 2 tasks | 8 files |
| Phase 08 P03 | 3 | 2 tasks | 7 files |
| Phase 08-media-notifications-dashboards P05 | 3 | 2 tasks | 6 files |
| Phase 08-media-notifications-dashboards P02 | 2 | 2 tasks | 4 files |
| Phase 08-media-notifications-dashboards P04 | 3 | 2 tasks | 5 files |
| Phase 08 P06 | 3 | 2 tasks | 7 files |
| Phase 08-media-notifications-dashboards P08 | 5 | 2 tasks | 2 files |
| Phase 09-polish-integration P01 | 8 | 2 tasks | 9 files |
| Phase 09-polish-integration P03 | 14 | 2 tasks | 65 files |
| Phase 05-jobs-approvals P06 | 2 | 2 tasks | 6 files |
| Phase 05-jobs-approvals P07 | 3 | 1 tasks | 4 files |
| Phase 05-jobs-approvals P08 | 8 | 2 tasks | 4 files |
| Phase 05-jobs-approvals P09 | 2 | 1 tasks | 2 files |
| Phase 05-jobs-approvals P10 | 9 | 2 tasks | 9 files |
| Phase 05-jobs-approvals P12 | 3 | 2 tasks | 4 files |
| Phase 05-jobs-approvals P13 | 6 | 2 tasks | 8 files |
| Phase 05-jobs-approvals P11 | 10 | 2 tasks | 1 files |
| Phase 05-jobs-approvals P14 | 2 | 2 tasks | 4 files |
| Phase 05-jobs-approvals P15 | 3 | 2 tasks | 3 files |
| Phase 09.1-ui-improvements P03 | 2 | 2 tasks | 4 files |
| Phase 09.1-ui-improvements P01 | 3 | 2 tasks | 6 files |
| Phase 09.1-ui-improvements P02 | 5 | 2 tasks | 8 files |
| Phase 09.1-ui-improvements P05 | 2 | 1 tasks | 3 files |
| Phase 09.1-ui-improvements P04 | 6 | 2 tasks | 17 files |

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
- [07-01]: generate_pm_jobs cron registration commented out pending pg_cron extension enable in Supabase Dashboard (consistent with Phase 5 pattern)
- [07-01]: pauseSchedulesForAsset/resumeSchedulesForAsset/deactivateSchedulesForAsset exported as plain async functions not authActionClient — called internally by changeAssetStatus as helpers
- [07-01]: changeAssetStatus in asset-actions.ts updated to use auto: prefix convention and handle all 3 branches: sold_disposed (deactivate), broken/under_repair (pause + cancel jobs), active (resume auto-paused only)
- [Phase 07-02]: TemplateCreateForm and TemplateDetail are separate components for clarity — create navigates away, edit stays on page with inline toggle
- [Phase 07-02]: Sidebar Templates nav item activated at plan 02 completion; Schedules remains built: false until plan 03
- [Phase 07-03]: ScheduleForm split into ScheduleCreateForm and ScheduleEditForm sub-components to avoid TypeScript type union issues between useForm instances with different Zod schema types
- [Phase 07-03]: Used z.output<typeof scheduleCreateSchema> as useForm type to avoid Resolver mismatch caused by interval_type .default('floating') making input type optional but output type required
- [Phase 07-03]: Sidebar Schedules nav item activated at plan 03 completion — both Maintenance nav items (Templates, Schedules) now active
- [Phase 07-04]: savePMChecklistItem uses fetch-modify-replace on checklist_responses JSONB — fetch full PMJobChecklist, find item by item_id, update value + completed_at, write back full object
- [Phase 07-04]: advanceFloatingSchedule differentiates fixed vs floating: floating sets next_due_at = now + interval_days on completion; fixed only updates last_completed_at (cron already advanced next_due_at)
- [Phase 07-04]: completePMChecklist does NOT change job status — only sets checklist_completed_at metadata; PIC uses normal job status change flow
- [Phase 07-04]: OverdueBadge is a pure presentational component comparing next_due_at < now at render time, no grace period
- [Phase 07-04]: PM type badge inline in title cell of job-columns.tsx (not a separate column) to keep table compact
- [Phase 08-01]: ENTITY_CONFIGS map centralizes per-entity-type bucket/maxFiles/table — adding a new entity type requires one line change
- [Phase 08-01]: Freehand-only annotation (ReactSketchCanvas) — no text overlay, shapes, or arrows per phase decision
- [Phase 08-01]: Compression runs client-side via useWebWorker:true (non-blocking WebP conversion before preview)
- [Phase 08-01]: job_comment shares job-photos bucket with maxFiles:3; existing RequestPhotoUpload left untouched for backward compat
- [Phase 08-07]: ExcelJS on Node.js runtime only — no edge runtime on export routes
- [Phase 08-07]: Export always fetches ALL data regardless of active client-side filters
- [Phase 08-07]: fetch+blob+createObjectURL pattern for browser download in toolbar export button
- [Phase 08-03]: createNotifications uses admin client for INSERT - notifications table has no INSERT RLS policy for regular users
- [Phase 08-03]: Actor always excluded from recipients via filter in createNotifications (REQ-NOTIF-007)
- [Phase 08-03]: Notification polling uses 30s interval with useCallback+clearInterval cleanup to prevent memory leaks
- [Phase 08-05]: KpiCard uses trendIsGood prop to invert color coding — up=red for backlog metrics (Open Requests, Untriaged, Overdue, Open Jobs), up=green for completion metrics
- [Phase 08-05]: getDashboardKpis runs 10 parallel Supabase count queries for 5 KPIs (current + previous period each)
- [Phase 08-05]: Previous period = same duration shifted back from dateRange.from; Overdue Jobs heuristic = in_progress jobs older than 7 days
- [Phase 08-05]: DateRangeFilter syncs from/to to URL via nuqs; server component reads them from searchParams with This Month default
- [Phase 08-02]: Vision API called directly in upload route (not HTTP self-call) — simpler, avoids auth cookie forwarding complexity
- [Phase 08-02]: GOOGLE_VISION_API_KEY is server-side only (no NEXT_PUBLIC_ prefix) — key never exposed to browser
- [Phase 08-02]: AI descriptions displayed inside lightbox only (not under thumbnails) — per REQ-MEDIA-006
- [Phase 08-media-notifications-dashboards]: getAllNotifications uses cursor pagination (cursor = last item's created_at) rather than offset pagination for consistent results with live data
- [Phase 08-media-notifications-dashboards]: cancelRequest fetches GA Lead/Admin recipients server-side to prevent frontend bypass
- [Phase 08-media-notifications-dashboards]: Notification fire-and-forget pattern documented in helpers.ts for future phases (jobs, inventory, maintenance)
- [Phase 08]: STATUS_HEX_COLORS map added for recharts (parallel to STATUS_COLORS Tailwind map) -- recharts Cell requires hex/rgb, not Tailwind class strings
- [Phase 08]: Bar onClick uses any-typed barData parameter -- recharts BarMouseEvent type does not include custom data fields from data array
- [Phase 08]: Dashboard page fetches all 7 data sources via single Promise.all for operational roles in 08-06
- [Phase 08-08]: All five notification types now used across codebase: status_change, assignment, approval, completion, auto_accept_warning — job and approval actions fully wired
- [Phase 08-08]: completionRecipients includes both created_by and assigned_to — job creator and PIC both notified on completion
- [Phase 08-08]: cancelJob notification guarded by if job.assigned_to — unassigned jobs have no PIC to notify
- [Phase 09-01]: GPS capture is blocking — capturePosition() must succeed before updateJobStatus is called; GPS denial shows error and status change does not proceed
- [Phase 09-01]: GPS columns nullable in job_status_changes — pre-existing transitions (no GPS) handled gracefully by checking latitude != null in timeline
- [Phase 09-01]: Timeline GPS correlation uses from_status->to_status string key map; latest record kept per pair for jobs with repeated transitions
- [Phase 09-01]: ENTITY_ROUTES maps settings entities to /admin/settings base path (no individual detail pages); entities with no detail page return '#'
- [Phase 09-02]: audit_logs table uses user_id (UUID) and user_email columns — AuditLogRow type uses user_id matching actual DB schema (not performed_by as plan suggested)
- [Phase 09-02]: AUDIT_VIEW permission added to ga_lead role in permissions.ts — was missing despite being defined as a PERMISSIONS constant; admin already has all permissions
- [Phase 09-02]: Audit trail sidebar item uses PERMISSIONS.AUDIT_VIEW (not PERMISSIONS.ADMIN_PANEL) so ga_lead users also see it
- [Phase 09-04]: MobileMenu as client island imported in server layout — avoids converting layout to 'use client'
- [Phase 09-04]: Two file inputs (desktop no-capture + mobile capture=environment) for camera vs file picker — no hydration mismatch
- [Phase 09-04]: Full-screen dialogs on mobile use max-md: Tailwind classes on DialogContent — no separate mobile component
- [Phase 09-04]: Table horizontal scroll uses overflow-x-auto on wrapper + min-w-[600px] — tables stay as tables on mobile per prior user decision
- [Phase 09-03]: Extended dark mode cleanup to all 50+ files (not just 25 in plan) to achieve true zero dark: count; batch-processed with Python regex
- [Phase 09-03]: Used Next.js loading.tsx pattern with custom skeleton components per route; skeletons mirror exact page layouts for smooth loading UX
- [Phase 05-jobs-approvals]: isFinanceApproverOnly derived from strict role equality so admin still sees cancel; terminal-status guard in JobCommentForm returns null before hooks
- [Phase 05-jobs-approvals]: Inline budget editing moved into cost panel (not actions); canEdit restricted to GA Lead/Admin for field editing while PIC retains budget editing only
- [Phase 05-jobs-approvals]: onAccepted called before onSuccess in acceptance dialog — state must be set before router.refresh() triggers re-render
- [Phase 05-jobs-approvals]: JobPreviewDialog uses client-side Supabase fetch on open — same pattern as RequestPreviewDialog on job detail; linked job display_id rendered as button to open modal instead of navigating away
- [Phase 05-09]: Unified server-side data fetch for approval queue: single OR query (pending_approval + approved_at + rejection), computed decision field, avoids two separate queries
- [Phase 05-09]: ApprovalJob type exported from approval-queue.tsx; Supabase FK join arrays unwrapped via Array.isArray guards in page.tsx
- [Phase 05-10]: completion approval mirrors budget approval: same budget_threshold, pending_completion_approval routes through when cost >= threshold
- [Phase 05-10]: Approval queue emits separate row per approval type — same job can appear twice (once Budget, once Completion)
- [Phase 05-12]: Role-based job filtering: general_user and ga_staff see only jobs assigned to them; GA Lead/Admin/Finance see all
- [Phase 05-12]: Page-level header pattern on job detail: display_id, status badge, priority badge, PM badge — matches request detail
- [Phase 05-12]: max-w-[1000px] on both job and request detail pages for consistent content width
- [Phase 05-13]: Shared formatIDR/formatNumber/parseIDR in lib/utils.ts replaces all local copies
- [Phase 05-13]: PIC assignment via inline Combobox in edit mode; separate assign dialog removed from job-detail-actions
- [Phase 05-13]: Estimated cost normalized to regular dl grid field; special bg-muted/50 section with lock badges removed
- [Phase 05-13]: Currency inputs use type=text + inputMode=numeric with live dot-separator formatting
- [Phase 05-jobs-approvals]: FK join hints fail silently when jobs table has 6 FK constraints to user_profiles; fix is plain UUID columns + batch actor name lookup via actorNameMap
- [Phase 05-14]: INTERNAL_FIELDS blocklist includes approval/completion/feedback timestamps specific to each page context
- [Phase 05-14]: calc(100vh - 200px) for timeline max-height instead of fixed pixel value to adapt to viewport
- [Phase 05-14]: Job comment form stays outside scroll container for constant visibility
- [Phase 05-15]: pendingOnly state (default false) replaces showHistory -- approval queue shows all statuses by default with flat date-descending sort
- [Phase 05-15]: feedbackOpen state lifted from RequestDetailActions to RequestDetailClient to survive router.refresh() remount; 300ms delay before opening
- [Phase 09.1-03]: Ghost icon buttons replace three-dot dropdown for user table row actions — faster, more discoverable
- [Phase 09.1-03]: User detail permalink uses window.history.replaceState for shareable links without triggering full page navigation
- [Phase 09.1-01]: Ghost icon buttons with title attributes for row actions instead of dropdown menus; CTA buttons in server page headers; job edit navigates to detail page (inline editing)
- [Phase 09.1-02]: react-day-picker v9 Calendar with Popover for date range picking; applied to both job and request filters; ISO params in URL, dd-MM-yyyy display
- [Phase 09.1-05]: Text labels replace icons entirely (no icon+text combo) for table row action buttons -- cleaner, more compact, no guessing
- [Phase 09.1-04]: ExportButton as standalone reusable client component; admin tab headers use h2+Create button pattern above DataTable; toolbar simplified to search/filters/bulk-actions only
- [Phase quick-68]: Templates made global: nullable company_id + global SELECT RLS + role-only INSERT/UPDATE; company_id kept in type as nullable for backward compatibility
- [Phase quick-69]: Schedules not asset-locked: item_id nullable, generate_pm_jobs uses LEFT JOIN; asset field hidden in form for general templates (no category); company_id derived from form/profile when no asset
- [Phase quick-71]: Multi-company write action pattern: fetch by ID, then verify access via primary company_id OR user_company_access row; same error message for unauthorized
- [Phase quick]: Unified transfer respond UX: AssetTransferRespondModal with variant prop replaces old dialog + AlertDialog across all surfaces
- [Phase quick-260317-mhw]: holder_id starts NULL, only set on transfer acceptance; general user filter uses holder_id instead of location_id
- [Phase quick]: Vision describe route: used adminClient for assertCompanyAccess (consistent with schedule-actions.ts); return 403 for cross-company access, return description silently for missing attachments

### Roadmap Evolution

- Phase 09.1 inserted after Phase 9: UI Improvements (URGENT)

### Pending Todos

- Push migrations 00007 through 00011 to Supabase: `supabase db push`
- Enable pg_cron extension in Supabase Dashboard and run schedule manually (see 05-01-SUMMARY.md and 07-01-SUMMARY.md)

### Blockers/Concerns

- ~~Verify pg_cron availability on chosen Supabase plan~~ RESOLVED: pg_cron available on all tiers but must be enabled manually in Dashboard before cron.schedule() can run
- Verify Supabase Auth hooks / JWT claims custom fields availability by plan tier
- ~~Confirm shadcn/ui CLI compatibility with Tailwind v4~~ RESOLVED: shadcn/ui v3.8.4 works with Tailwind v4, detected v4 automatically during init

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 1 | Extract context menu to ghost buttons on all table rows | 2026-03-02 | 57ef422 | | [1-extract-context-menu-to-be-shown-directl](./quick/1-extract-context-menu-to-be-shown-directl/) |
| 2 | Audit redundant UI components (research only) | 2026-03-02 | — | | [2-check-for-any-redundant-implementation-o](./quick/2-check-for-any-redundant-implementation-o/) |
| 3 | Consolidate priority badges into single generic component | 2026-03-02 | — | | — |
| 4 | Consolidate request/job status badges into generic StatusBadge | 2026-03-02 | — | | — |
| 5 | Consolidate 3 photo upload components into single PhotoUpload | 2026-03-02 | b5766af | | — |
| 6 | Extract EntityFormDialog to DRY admin form dialogs | 2026-03-02 | — | | — |
| 7 | Consistent Deactivate/Reactivate terminology for soft-delete | 2026-03-03 | 6f91547 | Verified | [3-check-consistency-between-delete-and-dea](./quick/3-check-consistency-between-delete-and-dea/) |
| 8 | Separate categories view between request and asset types | 2026-03-03 | bdc86a8 | Verified | [4-separate-categories-view-between-request](./quick/4-separate-categories-view-between-request/) |
| 9 | Consolidate content max-width to dashboard layout | 2026-03-04 | d05c640 | Verified | [5-ensure-that-implementation-of-max-width-](./quick/5-ensure-that-implementation-of-max-width-/) |
| 10 | Change display ID convention to globally unique format | 2026-03-04 | afd9d29 | Verified | [6-change-display-id-convention-to-globally](./quick/6-change-display-id-convention-to-globally/) |
| 11 | Fix photo upload bugs: duplicate thumbnails, black icon, RLS delete | 2026-03-04 | 96f6330 | Complete | [7-fix-photo-upload-bugs-duplicate-thumbnai](./quick/7-fix-photo-upload-bugs-duplicate-thumbnai/) |
| 12 | Implement modal view pattern on all table list pages | 2026-03-05 | f856883 | Verified | [9-implement-modal-view-pattern-on-all-tabl](./quick/9-implement-modal-view-pattern-on-all-tabl/) |
| 13 | Unify table row view links to modal pattern | 2026-03-05 | 071b7c9 | Verified | [10-unify-table-row-view-links-to-modal-patt](./quick/10-unify-table-row-view-links-to-modal-patt/) |
| 14 | Strip table row actions to View only, add modal action buttons | 2026-03-05 | 785dd14 | Verified | [11-table-rows-show-only-view-action-move-se](./quick/11-table-rows-show-only-view-action-move-se/) |
| 15 | Strip admin settings table rows to Edit-only, move deactivate/reactivate to FormDialog | 2026-03-05 | d6b13af | Verified | [12-strip-admin-settings-table-rows-to-view-](./quick/12-strip-admin-settings-table-rows-to-view-/) |
| 16 | Convert CTA create buttons to modal dialogs | 2026-03-06 | 4b5eabd | Verified | [13-convert-cta-create-buttons-to-modal-dial](./quick/13-convert-cta-create-buttons-to-modal-dial/) |
| 17 | Find and fix UI/UX inconsistencies across all pages | 2026-03-06 | 72e0ed1 | Verified | [14-find-any-inconsistencies-in-ui-and-ux-im](./quick/14-find-any-inconsistencies-in-ui-and-ux-im/) |
| 18 | Table action buttons blue link styling | 2026-03-06 | d733641 | Verified | [15-table-action-should-have-the-same-size-a](./quick/15-table-action-should-have-the-same-size-a/) |
| 19 | Simplify new asset modal form layout | 2026-03-06 | 2603c0b | Verified | [16-simplify-new-asset-modal-form-layout-sim](./quick/16-simplify-new-asset-modal-form-layout-sim/) |
| 20 | Unify asset detail page to match new asset form | 2026-03-06 | dc938bf | Verified | [17-unify-asset-detail-page-to-match-new-ass](./quick/17-unify-asset-detail-page-to-match-new-ass/) |
| 21 | Asset detail modal cleanup — remove duplication, collapse sections | 2026-03-06 | 0bf54ff | Verified | [18-asset-detail-modal-is-overloaded-and-dup](./quick/18-asset-detail-modal-is-overloaded-and-dup/) |
| 22 | Move Save button to sticky bottom bar, remove info text | 2026-03-06 | d052605 | Verified | [19-move-save-button-to-sticky-bottom-bar-an](./quick/19-move-save-button-to-sticky-bottom-bar-an/) |
| 23 | Audit all flows for deadlocks (analysis only) | 2026-03-06 | 92af395 | Verified | [20-test-all-flow-of-request-jobs-approvals-](./quick/20-test-all-flow-of-request-jobs-approvals-/) |
| 24 | Fix deadlock analysis issues: wire advanceFloatingSchedule, rework Start Work, threshold gates, remove dead statuses | 2026-03-09 | 7584eed | Verified | [21-fix-deadlock-analysis-issues-wire-advanc](./quick/21-fix-deadlock-analysis-issues-wire-advanc/) |
| 25 | Add permalink support (?action=create) to all 5 create modals | 2026-03-09 | d6258a7 | Verified | [22-add-permalink-support-to-all-5-create-mo](./quick/22-add-permalink-support-to-all-5-create-mo/) |
| 26 | Replace Start Work with Activate Location two-step flow | 2026-03-09 | 99a9bbc | Verified | [23-replace-start-work-with-activate-locatio](./quick/23-replace-start-work-with-activate-locatio/) |
| 27 | Make category optional in maintenance templates | 2026-03-09 | 57465be | Verified | [24-make-category-optional-in-maintenance-te](./quick/24-make-category-optional-in-maintenance-te/) |
| 28 | Fix RLS policy error when deactivating maintenance schedules | 2026-03-09 | 64b2135 | Verified | [25-fix-rls-policy-error-when-deactivating-m](./quick/25-fix-rls-policy-error-when-deactivating-m/) |
| 29 | Move PM checklist preview from schedules to templates | 2026-03-09 | 84c44d1 | Verified | [26-move-pm-checklist-preview-from-maintenan](./quick/26-move-pm-checklist-preview-from-maintenan/) |
| 30 | Rework job lifecycle: budget at creation, creator-based approval | 2026-03-09 | 8600294 | Verified | [27-rework-job-lifecycle-budget-approval-by-](./quick/27-rework-job-lifecycle-budget-approval-by-/) |
| 31 | Enforce request-job linking rules: PIC-only, status filter, one-to-one | 2026-03-09 | c79afce | Verified | [28-request-job-linking-rules-only-pic-handl](./quick/28-request-job-linking-rules-only-pic-handl/) |
| 32 | Allow PIC or GA Lead to complete a request directly | 2026-03-09 | d25debc | Verified | [29-allow-pic-or-ga-lead-to-complete-a-reque](./quick/29-allow-pic-or-ga-lead-to-complete-a-reque/) |
| 33 | Add photo attachments to job creation form and detail page | 2026-03-09 | 064a282 | Verified | [30-add-photo-attachments-to-job-creation-fo](./quick/30-add-photo-attachments-to-job-creation-fo/) |
| 34 | Fix DialogTitle accessibility warning in all 5 view modals | 2026-03-09 | af12391 | Verified | [31-fix-dialogtitle-accessibility-warning-in](./quick/31-fix-dialogtitle-accessibility-warning-in/) |
| 35 | Only request creator can accept/reject completed work | 2026-03-09 | — | Verified | [32-only-the-user-who-created-the-request-ca](./quick/32-only-the-user-who-created-the-request-ca/) |
| 36 | Stable column widths on all tables (fixed sizes + grow column + actions last) | 2026-03-10 | 72bbd71 | Verified | [32-limit-all-table-width-by-its-own-logical](./quick/32-limit-all-table-width-by-its-own-logical/) |
| 37 | Inactive settings rows grey background, remove Status column from all settings tables | 2026-03-10 | d989b61 | Verified | [34-in-settings-inactive-rows-should-be-dist](./quick/34-in-settings-inactive-rows-should-be-dist/) |
| 38 | Move save changes button to sticky bottom bar on asset detail page | 2026-03-10 | ddde5b8 | Verified | [35-move-all-save-changes-buttons-to-the-sti](./quick/35-move-all-save-changes-buttons-to-the-sti/) |
| 39 | Estimated cost in job timeline displays IDR thousand separator formatting | 2026-03-10 | 74eb908 | Verified | [36-estimated-cost-in-job-timeline-should-di](./quick/36-estimated-cost-in-job-timeline-should-di/) |
| 40 | Post Comment button uses outline variant instead of CTA | 2026-03-10 | 1e0c68b | Verified | [37-post-comment-button-should-use-outline-v](./quick/37-post-comment-button-should-use-outline-v/) |
| 41 | Photo attachments displayed and editable in job detail modal | 2026-03-10 | 8e1d745 | Verified | [38-photo-attachments-should-be-displayed-an](./quick/38-photo-attachments-should-be-displayed-an/) |
| 42 | Approval queue: View button opens JobViewModal with permalink support | 2026-03-10 | 79b9a55 | Verified | [34-approval-detail-should-use-modal-with-pe](./quick/34-approval-detail-should-use-modal-with-pe/) |
| 43 | add proper spacing between icon and text in timeline, so it doesn't look that cramped | 2026-03-10 | a9f1f76 | Needs Review | [35-add-proper-spacing-between-icon-and-text](./quick/35-add-proper-spacing-between-icon-and-text/) |
| 44 | asset transfer: only the receiver can accept or reject the transfer. admin can still cancel the transfer | 2026-03-10 | 8e7d474 | Verified | [36-asset-transfer-only-the-receiver-can-acc](./quick/36-asset-transfer-only-the-receiver-can-acc/) |
| 45 | Consolidate asset view modal action buttons to sticky bar only (remove duplicate inline AssetDetailActions) | 2026-03-10 | bd61fcd | Verified | [37-detail-modal-move-all-form-field-action-](./quick/37-detail-modal-move-all-form-field-action-/) |
| 46 | inventory transit status should only be displayed once beside the active status badge, not shown in the location field | 2026-03-10 | 558bcae | Verified | [38-inventory-transit-status-should-only-be-](./quick/38-inventory-transit-status-should-only-be-/) |
| 47 | Default acquisition_date to today in new asset form | 2026-03-10 | dc06a0e | Verified | [39-asset-default-acquisition-date-to-today-](./quick/39-asset-default-acquisition-date-to-today-/) |
| 48 | Asset table: photo thumbnail column with lightbox | 2026-03-10 | 2e9485f | Verified | [40-asset-table-list-display-latest-conditio](./quick/40-asset-table-list-display-latest-conditio/) |
| 49 | Job table: photo thumbnail column with lightbox | 2026-03-10 | 66b0d2c | Verified | [41-job-table-list-display-job-photos-thumbn](./quick/41-job-table-list-display-job-photos-thumbn/) |
| 50 | Approval queue estimated cost text-base removed, matches table cell size | 2026-03-10 | 783110e | Verified | [42-approval-queue-estimated-costs-should-di](./quick/42-approval-queue-estimated-costs-should-di/) |
| 51 | photos should be before save changes button. remain consistent throughout the app. clicking save changes will save the photos, and other edited fields | 2026-03-10 | 4e450ce | | [39-photos-should-be-before-save-changes-but](./quick/39-photos-should-be-before-save-changes-but/) |
| 52 | clear icon in photo upload modal is black and invisible against the dark/black background — fix icon color to be visible | 2026-03-11 | 4b00700 | Verified | [43-clear-icon-in-photo-upload-modal-is-blac](./quick/43-clear-icon-in-photo-upload-modal-is-blac/) |
| 53 | Move Change Status action for assets from view modal sticky bar to table row actions | 2026-03-11 | a5a9b78 | Complete | [44-move-change-status-action-for-assets-fro](./quick/44-move-change-status-action-for-assets-fro/) |

| 54 | All view modals implement consistent two-line header: identifier on line 1, badges + created by on line 2 | 2026-03-11 | 4dd4341 | Verified | [45-all-view-modals-should-implement-a-consi](./quick/45-all-view-modals-should-implement-a-consi/) |
| 55 | Multi-company user access: admin grants extra company access in user settings; Company selector in New Request/Job/Asset modals | 2026-03-11 | a866a24 | Verified | [46-multi-company-user-access-in-user-settin](./quick/46-multi-company-user-access-in-user-settin/) |
| 56 | Add permalink URL sync (?action=create) to New Job and New Asset create modals — bidirectional sync on open and close | 2026-03-11 | dd971dc | Needs Review | [47-add-permalink-support-to-new-job-and-new](./quick/47-add-permalink-support-to-new-job-and-new/) |
| 57 | GA Staff can self-assign submitted requests and create jobs; status guard prevents overriding GA Lead assignments | 2026-03-11 | c415b94 | Needs Review | [48-ga-staff-should-be-able-to-self-assign-r](./quick/48-ga-staff-should-be-able-to-self-assign-r/) |
| 58 | Fix company-based data isolation: push migrations, expand RLS SELECT policies for multi-company access, seed test data | 2026-03-11 | 849ffbb | Verified | [49-fix-company-based-data-isolation-user-co](./quick/49-fix-company-based-data-isolation-user-co/) |
| 59 | All insertion modals always show Company field — disabled Input for single-company, interactive Combobox for multi-company | 2026-03-11 | b4037e3 | Verified | [50-all-insertion-modals-show-company-field-](./quick/50-all-insertion-modals-show-company-field-/) |
| 60 | Company field on Schedule/Template create modals and all edit/detail pages for all 5 entity types | 2026-03-12 | 978dd28 | Verified | [51-add-company-field-to-all-creation-and-ed](./quick/51-add-company-field-to-all-creation-and-ed/) |
| 61 | Add ?action=create permalink URL sync to New Request modal — bidirectional sync on open and close | 2026-03-12 | ad826f3 | Verified | [52-add-action-create-permalink-support-to-n](./quick/52-add-action-create-permalink-support-to-n/) |
| 62 | Multi-company RLS E2E test (5 Playwright API cases) + updateUserCompanyAccess unit test (7 Vitest cases) | 2026-03-12 | c63fe2c | Verified | [54-add-multi-company-rls-e2e-test-and-updat](./quick/54-add-multi-company-rls-e2e-test-and-updat/) |
| 63 | Fix inconsistent status badge colors: canonical palette (green/stone/violet), approval constants, PM badge constant, dashboard hex colors | 2026-03-12 | 5ddd0ba | Complete | [55-fix-inconsistent-status-badge-colors-acr](./quick/55-fix-inconsistent-status-badge-colors-acr/) |
| 64 | Jobs table: split ID/Status into separate columns, add Location column, remove Linked Requests, fix column order | 2026-03-12 | 15a7208 | Complete | [56-jobs-table-add-location-column-and-fix-c](./quick/56-jobs-table-add-location-column-and-fix-c/) |
| 65 | Requests and assets tables: separate ID (font-mono only) and Status (badge only) into first two columns | 2026-03-12 | cc22879 | Complete | [57-separate-id-and-status-into-first-two-co](./quick/57-separate-id-and-status-into-first-two-co/) |
| 66 | Seed ops data: 4 asset categories (APAR, AC Split, Genset, Filter Air FRP), 4 equipment assets, 6 maintenance templates, 14 schedules | 2026-03-12 | 3c2c139 | Complete | [59-seed-ops-data-asset-categories-assets-ma](./quick/59-seed-ops-data-asset-categories-assets-ma/) |
| 67 | Enforce company-scoped uniqueness for category names (create, update, restore) | 2026-03-12 | 991fcb6 | Complete | [60-enforce-uniqueness-for-categories-and-co](./quick/60-enforce-uniqueness-for-categories-and-co/) |
| 68 | Users table role column, remove Transfer row button, rename Inventory to Assets, two-mode transfer dialog | 2026-03-12 | 78d05c0 | Verified | [61-users-table-role-column-remove-transfer-](./quick/61-users-table-role-column-remove-transfer-/) |
| 69 | Location-only asset transfers auto-accept (no pending state, no photo requirement) | 2026-03-13 | 88690b2 | Verified | [62-location-only-asset-transfers-are-auto-a](./quick/62-location-only-asset-transfers-are-auto-a/) |
| 70 | Show persistent InlineFeedback error on photo upload failure in AssetTransferDialog | 2026-03-13 | 511de7c | Verified | [63-show-persistent-error-when-photo-upload-](./quick/63-show-persistent-error-when-photo-upload-/) |
| 71 | Add case-insensitive partial unique index on categories (company_id, lower(name), type) WHERE deleted_at IS NULL | 2026-03-13 | d8ec77e | Verified | [64-add-partial-unique-index-on-categories-c](./quick/64-add-partial-unique-index-on-categories-c/) |
| 72 | Make company_id required in asset create schema; wire primaryCompanyId to form defaultValues; fix AssetEditForm | 2026-03-13 | c8884b3 | Verified | [65-make-company-id-required-in-asset-create](./quick/65-make-company-id-required-in-asset-create/) |
| 73 | Fix UI/UX table inconsistencies: template name truncation, job title text-sm, breadcrumb label, Created columns on assets/schedules, INVENTORY_VIEW_ALL rename | 2026-03-13 | 74c414a | Verified | [66-fix-ui-ux-table-inconsistencies-template](./quick/66-fix-ui-ux-table-inconsistencies-template/) |
| 74 | E2E regression tests for quick-62 through quick-66 (location transfer, company field, Created columns, breadcrumb, sidebar, template name) | 2026-03-13 | ba1261d | Verified | [67-e2e-tests-for-quick-62-to-quick-66-locat](./quick/67-e2e-tests-for-quick-62-to-quick-66-locat/) |
| 75 | Make maintenance templates shared across companies (global resource) | 2026-03-13 | f0cdff4 | Verified | [68-make-maintenance-templates-shared-across](./quick/68-make-maintenance-templates-shared-across/) |
| 76 | Make schedules not asset-locked (item_id optional for general templates) | 2026-03-13 | 44fe0b6 | Verified | [69-make-schedules-not-asset-locked-item-id-](./quick/69-make-schedules-not-asset-locked-item-id-/) |
| 77 | Add auto_create_days_before field to maintenance schedules (0-30 days advance job creation) | 2026-03-13 | 712df5d | Verified | [70-add-auto-create-jobs-days-before-due-fie](./quick/70-add-auto-create-jobs-days-before-due-fie/) |
| 78 | Fix schedule write actions for multi-company access (deactivate/activate/update/delete) | 2026-03-13 | b38238f | Verified | [71-fix-deactivating-schedule-returns-schedu](./quick/71-fix-deactivating-schedule-returns-schedu/) |
| 79 | Remove rounded border section separators from maintenance schedule components | 2026-03-13 | 9611087 | Verified | [72-remove-rounded-border-separators-from-ma](./quick/72-remove-rounded-border-separators-from-ma/) |
| 80 | Move asset name from schedule detail header to body section | 2026-03-14 | 98257dd | Verified | [73-move-asset-name-from-schedule-detail-hea](./quick/73-move-asset-name-from-schedule-detail-hea/) |
| 81 | Add Company column to maintenance schedules table for multi-company visibility | 2026-03-14 | 55c2f04 | Verified | [74-fix-schedule-company-scoping-duplication](./quick/74-fix-schedule-company-scoping-duplication/) |
| 82 | Add company access validation to createSchedule non-asset branch | 2026-03-14 | 575736b | Verified | [75-add-company-access-validation-to-creates](./quick/75-add-company-access-validation-to-creates/) |
| 83 | Add .max(10) to unbounded start_date string in scheduleCreateSchema | 2026-03-14 | 2b9510e | Verified | [76-add-max-10-to-unbounded-start-date-strin](./quick/76-add-max-10-to-unbounded-start-date-strin/) |
| 84 | E2E tests for schedule non-asset path, auto_create_days_before, and RLS cross-company INSERT | 2026-03-14 | 6f40606 | Verified | [77-extend-schedule-e2e-tests-no-asset-path-](./quick/77-extend-schedule-e2e-tests-no-asset-path-/) |
| 85 | Standardize text-sm on Created column date spans in asset and schedule tables | 2026-03-14 | fba2a18 | Verified | [78-standardize-text-sm-on-created-column-da](./quick/78-standardize-text-sm-on-created-column-da/) |
| 86 | Fix 7 security/correctness bugs: RFC 4122 UUIDs, .maybeSingle(), duplicate email, company access | 2026-03-16 | 53352a7 | Verified | [79-fix-7-security-correctness-bugs-rfc4122-](./quick/79-fix-7-security-correctness-bugs-rfc4122-/) |
| 87 | Extract shared helpers for company access and date validation | 2026-03-16 | 4a4e1ef | Verified | [80-extract-shared-helpers-for-company-acces](./quick/80-extract-shared-helpers-for-company-acces/) |
| 88 | Multi-company comprehensive fix: RLS expansion, exports, actions, dropdowns | 2026-03-16 | 93a26f4 | Verified | [81-multi-company-comprehensive-fix-rls-expa](./quick/81-multi-company-comprehensive-fix-rls-expa/) |
| 89 | Remove warranty_expiry column from asset table | 2026-03-16 | 0a94e11 | Verified | [82-remove-warranty-expiry-from-asset-table-](./quick/82-remove-warranty-expiry-from-asset-table-/) |
| 90 | Move Transfer button from modal sticky bar to table row actions | 2026-03-16 | 9290332 | Verified | [83-move-transfer-button-out-from-modal-stic](./quick/83-move-transfer-button-out-from-modal-stic/) |
| 91 | Fix asset transfer dialog to only show users/locations from asset's company | 2026-03-17 | 7b5f094 | Verified | [260317-bnu-fix-asset-transfer-to-only-show-users-fr](./quick/260317-bnu-fix-asset-transfer-to-only-show-users-fr/) |
| 92 | Add Respond action for transfer receiver in asset table | 2026-03-17 | 5b181cf | Needs Review | [260317-byt-add-respond-action-for-transfer-receiver](./quick/260317-byt-add-respond-action-for-transfer-receiver/) |
| 93 | Fix fire-and-forget createNotifications -- add error logging to all 15 call sites | 2026-03-17 | 060c822 | Verified | [260317-ccy-fix-fire-and-forget-createnotifications-](./quick/260317-ccy-fix-fire-and-forget-createnotifications-/) |
| 94 | Asset status badge: in-transit overwrites active status instead of showing both | 2026-03-17 | f8e3bfd | Verified | [260317-ffi-asset-status-badge-in-transit-overwrites](./quick/260317-ffi-asset-status-badge-in-transit-overwrites/) |
| 95 | Add Edit Transfer button for admins with cancel transfer flow | 2026-03-17 | 076f292 | Verified | [260317-fhv-add-edit-transfer-button-for-admins-with](./quick/260317-fhv-add-edit-transfer-button-for-admins-with/) |
| 96 | Block asset transfer for under_repair status in UI and server action | 2026-03-17 | 1a429c0 | Verified | [260317-fot-block-asset-transfer-for-under-repair-st](./quick/260317-fot-block-asset-transfer-for-under-repair-st/) |
| 97 | Prevent moving asset to same location as current in transfer dialog and server action | 2026-03-17 | f7ba2df | Verified | [260317-fri-prevent-moving-asset-to-same-location-as](./quick/260317-fri-prevent-moving-asset-to-same-location-as/) |
| 98 | Show receiver name under location in asset table for in-transit assets | 2026-03-17 | 4eab589 | Verified | [260317-fu4-show-receiver-name-under-location-in-ass](./quick/260317-fu4-show-receiver-name-under-location-in-ass/) |
| 99 | Block asset transfer for broken status in UI and server action | 2026-03-17 | 1280929 | Verified | [260317-g1o-block-asset-transfer-for-broken-status-i](./quick/260317-g1o-block-asset-transfer-for-broken-status-i/) |
| 100 | Consolidate respond components: switch view modal and detail page to AssetTransferRespondModal | 2026-03-17 | 02576da | Verified | [260317-g4o-consolidate-respond-components-switch-vi](./quick/260317-g4o-consolidate-respond-components-switch-vi/) |
| 101 | Validate receiver is active in createTransfer and acceptTransfer | 2026-03-17 | c63825e | Verified | [260317-gf7-validate-receiver-is-active-in-accepttra](./quick/260317-gf7-validate-receiver-is-active-in-accepttra/) |
| 102 | Add initialMode prop to respond modal to skip redundant mode selection | 2026-03-17 | d529054 | Verified | [260317-l6v-add-initialmode-prop-to-assettransferres](./quick/260317-l6v-add-initialmode-prop-to-assettransferres/) |
| 103 | Replace generic success message with action-specific messages in asset table | 2026-03-17 | a65d447 | Verified | [260317-ldp-replace-generic-success-message-with-act](./quick/260317-ldp-replace-generic-success-message-with-act/) |
| 104 | UI audit fixes: remove auto-redirect, fix blue shade, improve error messages | 2026-03-17 | 6d823e0 | Verified | — |
| 105 | Fix photo lightbox z-index stacking behind modals | 2026-03-17 | 15c7cc1 | Verified | [260317-lqo-fix-photo-lightbox-z-index-stacking-behi](./quick/260317-lqo-fix-photo-lightbox-z-index-stacking-behi/) |
| 106 | Add consistent asset info header to Change Status and Transfer dialogs | 2026-03-17 | 5c8a30d | Verified | [260317-lu3-add-consistent-asset-info-header-to-chan](./quick/260317-lu3-add-consistent-asset-info-header-to-chan/) |
| 107 | Remove Edit Transfer from view modal, brand/model/serial in 1 row | 2026-03-17 | 50f7b61 | Verified | — |
| 108 | Filter inventory for general users: only assets at their location or in transit to them | 2026-03-17 | 45b4a45 | Superseded | [260317-lxl-filter-inventory-page-for-general-users-](./quick/260317-lxl-filter-inventory-page-for-general-users-/) |
| 109 | Add holder_id to inventory_items for asset custody tracking | 2026-03-17 | c96f57e | Verified | [260317-mhw-add-holder-id-to-inventory-items-for-ass](./quick/260317-mhw-add-holder-id-to-inventory-items-for-ass/) |
| 110 | Update seed data to set holder_id on inventory_items | 2026-03-17 | 81d05ef | Verified | [260317-n9i-update-seed-data-to-set-holder-id-on-inv](./quick/260317-n9i-update-seed-data-to-set-holder-id-on-inv/) |
| 111 | Allow transferring assets to any user in company, not just GA roles | 2026-03-17 | 94ae114 | Verified | [260317-njk-allow-transferring-assets-to-any-user-in](./quick/260317-njk-allow-transferring-assets-to-any-user-in/) |
| 112 | Fix 5 security/correctness issues in asset transfer actions | 2026-03-18 | 54a3b7d | Verified | [260318-bah-fix-5-security-and-correctness-issues-in](./quick/260318-bah-fix-5-security-and-correctness-issues-in/) |
| 113 | Standardize server action response shapes with ActionResponse type | 2026-03-18 | 30970da | Verified | [260318-bnb-standardize-server-action-response-shape](./quick/260318-bnb-standardize-server-action-response-shape/) |
| 114 | Fix 4 UI consistency: CreatedAtCell, DisplayId, any types, hover colors | 2026-03-18 | 5c2f46a | Verified | [260318-cbb-fix-4-ui-consistency-issues-createdatcel](./quick/260318-cbb-fix-4-ui-consistency-issues-createdatcel/) |
| 115 | Fix 3 security issues: updateUser company access, createTransfer multi-company, deleteAssetPhotos | 2026-03-18 | 2388ef9 | Verified | [260318-fm0-fix-3-security-issues-updateuser-company](./quick/260318-fm0-fix-3-security-issues-updateuser-company/) |
| 116 | Expand company_settings RLS for multi-company access | 2026-03-18 | 0f90cb1 | Verified | [260318-fra-fix-company-settings-multi-company-rls-a](./quick/260318-fra-fix-company-settings-multi-company-rls-a/) |
| 117 | Add optimistic locking to updateAsset, updateJob, updateRequest | 2026-03-18 | 6c51454 | Verified | [260318-fv3-add-optimistic-locking-to-updateasset-up](./quick/260318-fv3-add-optimistic-locking-to-updateasset-up/) |

| 118 | Fix 5 accessibility issues: keyboard, aria-labels, focus, skip-link, error announcements | 2026-03-18 | 851ce1f | Verified | [260318-g3x-fix-5-accessibility-issues-keyboard-aria](./quick/260318-g3x-fix-5-accessibility-issues-keyboard-aria/) |
| 119 | Fix N+1 timeline queries in request and job detail pages | 2026-03-18 | 49a41b1 | Verified | [260318-g8o-fix-n-1-timeline-queries-in-request-and-](./quick/260318-g8o-fix-n-1-timeline-queries-in-request-and-/) |
| 120 | Fix 2 data integrity: block status change during transfer + block completion without PIC | 2026-03-18 | 7827974 | Verified | [260318-gdy-fix-2-data-integrity-issues-block-status](./quick/260318-gdy-fix-2-data-integrity-issues-block-status/) |
| 121 | Fix 7 code quality: error checks, null safety, rollback, PII logging, empty URLs | 2026-03-19 | c6de326 | Verified | [260319-np2-fix-7-code-quality-issues-error-checks-n](./quick/260319-np2-fix-7-code-quality-issues-error-checks-n/) |
| 122 | Extract role constants, migrate DisplayId and CreatedAtCell adoption | 2026-03-19 | 4b015c6 | Verified | [260319-nye-extract-role-constants-migrate-displayid](./quick/260319-nye-extract-role-constants-migrate-displayid/) |
| 123 | Unit tests: optimistic locking, ActionResponse types, fix permissions test | 2026-03-19 | 9b09547 | Verified | [260319-oet-unit-tests-for-optimistic-locking-and-ac](./quick/260319-oet-unit-tests-for-optimistic-locking-and-ac/) |
| 124 | Fix semantic bug: RequestStatusBadge used for job status — replace with JobStatusBadge | 2026-03-20 | b9a7306 | Verified | [260320-9ki-fix-semantic-bug-requeststatusbadge-used](./quick/260320-9ki-fix-semantic-bug-requeststatusbadge-used/) |
| 125 | Remove auto-dismissing setTimeout in password-change and triage dialogs | 2026-03-20 | 54dcb47 | Verified | [260320-eww-remove-auto-dismissing-settimeout-in-pas](./quick/260320-eww-remove-auto-dismissing-settimeout-in-pas/) |
| 126 | Centralize inline role arrays into OPERATIONAL_ROLES constant | 2026-03-20 | c36f229 | Verified | [260320-f5l-centralize-inline-role-arrays-into-lib-c](./quick/260320-f5l-centralize-inline-role-arrays-into-lib-c/) |
| 127 | Schema validation hardening: .max() on passwords, .uuid() on itemId, .max() on arrays | 2026-03-26 | 4c88642 | Verified | [260326-f3u-schema-validation-hardening-add-max-to-p](./quick/260326-f3u-schema-validation-hardening-add-max-to-p/) |

## Session Continuity

Last session: 2026-03-26T04:11:14.274Z
Stopped at: Completed quick-260326-fca (Vision API security fix)
Resume file: None
Next: Ready for next task
