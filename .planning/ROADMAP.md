# Roadmap: GA Operations Tool

## Overview

This roadmap delivers a complete GA operations tool in 9 phases, progressing from database foundation through auth, admin configuration, core request/job workflows, approvals, inventory, preventive maintenance, cross-cutting concerns (media, notifications, dashboards), and final polish. Each phase delivers a coherent, testable capability that builds on the previous. The dependency chain reflects the domain reality: you need users before requests, requests before jobs, inventory before maintenance, and data from all domains before dashboards.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Database Schema & Supabase Setup** - Foundation tables, RLS infrastructure, and project configuration *(completed 2026-02-10)*
- [x] **Phase 2: Auth & RBAC** - User authentication, role-based access control, and session management *(completed 2026-02-11)*
- [x] **Phase 3: Admin & System Configuration** - Company, division, location, category, and user management *(completed 2026-02-11)*
- [x] **Phase 4: Requests** - Request submission, triage, listing, and detail views *(completed 2026-02-19)*
- [x] **Phase 5: Jobs & Approvals** - Job creation/execution, CEO approval workflow, completion, and auto-accept (completed 2026-02-24)
- [x] **Phase 6: Inventory** - Asset registry, movement tracking, and receiver acceptance (completed 2026-02-25)
- [ ] **Phase 7: Preventive Maintenance** - Templates, scheduling, auto-job generation, and auto-pause
- [ ] **Phase 8: Media, Notifications & Dashboards** - Image handling, in-app notifications, dashboard metrics, and exports
- [ ] **Phase 9: Polish & Integration** - GPS capture, audit trail viewer, remaining UI refinements, cross-cutting quality

## Phase Details

### Phase 1: Database Schema & Supabase Setup
**Goal**: Every database table, RLS helper function, and Supabase project configuration exists so that all subsequent phases can build on a stable foundation.
**Depends on**: Nothing (first phase)
**Requirements**: REQ-RBAC-004, REQ-RBAC-005, REQ-RBAC-008, REQ-DATA-001, REQ-DATA-003
**Estimated Complexity**: High
**Success Criteria** (what must be TRUE):
  1. Supabase project is provisioned with all tables matching the domain model (companies, divisions, locations, categories, users/profiles, requests, jobs, assets, maintenance templates/schedules, notifications, audit log)
  2. RLS is enabled on every public table with baseline policies that enforce company isolation and soft-delete filtering
  3. RLS helper functions (auth.user_company_id, auth.user_division_id, auth.user_role) are deployed and return correct values from JWT claims
  4. Every table has deleted_at column and all SELECT RLS policies filter on deleted_at IS NULL
  5. An audit_log table exists with a trigger or function pattern ready to capture create/update/delete/transition events
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Supabase project initialization, all 16 domain tables, indexes, utility functions
- [x] 01-02-PLAN.md — RLS helper functions, baseline RLS policies (company isolation + soft-delete), audit trigger infrastructure

### Phase 2: Auth & RBAC
**Goal**: Users can log in (Google OAuth or email/password), sessions persist across browser reloads, unauthenticated users are redirected, and the application enforces role-based permissions at every layer.
**Depends on**: Phase 1
**Requirements**: REQ-AUTH-001, REQ-AUTH-002, REQ-AUTH-003, REQ-AUTH-004, REQ-AUTH-005, REQ-AUTH-006, REQ-AUTH-007, REQ-AUTH-008, REQ-RBAC-001, REQ-RBAC-002, REQ-RBAC-003, REQ-RBAC-006, REQ-RBAC-007
**Estimated Complexity**: High
**Success Criteria** (what must be TRUE):
  1. A user can log in via Google OAuth and land on the authenticated dashboard shell
  2. A user can log in via email/password and the session persists across browser reloads (remember me)
  3. Visiting any protected route while unauthenticated redirects to the login page
  4. A General User can only see data from their own division; GA Staff/Lead/Admin see all company data
  5. UI elements are conditionally shown/hidden based on the logged-in user's role (e.g., Admin sees user management nav, General User does not)
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Supabase Auth integration, login page (Google OAuth + email/password), password reset, auth middleware, session management
- [x] 02-02-PLAN.md — RBAC permission map, role-specific RLS refinements, app shell with sidebar, UI permission gates, seed script

### Phase 3: Admin & System Configuration
**Goal**: Admins can manage the organizational hierarchy (companies, divisions, locations, categories) and create/edit/deactivate users, providing the reference data that all operational workflows depend on.
**Depends on**: Phase 2
**Requirements**: REQ-ADMIN-001, REQ-ADMIN-002, REQ-ADMIN-003, REQ-ADMIN-004, REQ-ADMIN-005, REQ-ADMIN-006, REQ-ADMIN-007, REQ-UI-001, REQ-UI-002, REQ-UI-005
**Estimated Complexity**: Medium
**Success Criteria** (what must be TRUE):
  1. An Admin can create, edit, and soft-delete companies, divisions (scoped to company), locations (scoped to company), and categories (with type: request or asset)
  2. An Admin can create a new user, assign them a role and division, and that user can subsequently log in
  3. An Admin can deactivate a user and that user can no longer access the system
  4. A user can edit their own profile (name, avatar, notification preferences)
  5. The application has a desktop-first sidebar layout using shadcn/ui with breadcrumb navigation, toast notifications for action feedback, and responsive behavior
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md — shadcn/ui setup, reusable data table components, Settings page with tab navigation, sidebar updates
- [x] 03-02-PLAN.md — Company, division, location, and category CRUD (Zod schemas, Server Actions, data tables, modal forms)
- [x] 03-03-PLAN.md — User management page and self-service profile drawer with password change

### Phase 4: Requests
**Goal**: General Users can submit maintenance requests with minimal friction, GA Leads can triage and manage them, and everyone with access can track request status through a complete workflow.
**Depends on**: Phase 3
**Requirements**: REQ-REQ-001, REQ-REQ-002, REQ-REQ-003, REQ-REQ-004, REQ-REQ-005, REQ-REQ-006, REQ-REQ-007, REQ-DATA-004
**Estimated Complexity**: High
**Success Criteria** (what must be TRUE):
  1. A General User can submit a request (title, description, location, optional photos) in under 60 seconds, and the request appears with an auto-generated REQ-YYYY-NNNN ID
  2. The requester's division is auto-filled on submission without manual selection
  3. A GA Lead can triage a request by assigning category, priority (Low/Medium/High/Urgent), and PIC (person in charge)
  4. The request list page supports filtering by status, priority, category, and date range, with sorting
  5. A request detail page shows the full status history/timeline and all monetary values are formatted in IDR
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — DB migration (cancelled status, 2-digit-year ID function, storage bucket), server actions, photo upload API, Combobox, and request submission form at /requests/new
- [x] 04-02-PLAN.md — Request list page (filters, sorting, triage/reject/cancel dialogs) and request detail page (two-column layout, timeline, inline triage, edit form)

### Phase 5: Jobs & Approvals
**Goal**: GA Leads can create and assign jobs (from requests or standalone), GA Staff can execute them through a tracked workflow, the CEO can approve/reject budget-related requests, and completed work flows through the acceptance cycle.
**Depends on**: Phase 4
**Requirements**: REQ-JOB-001, REQ-JOB-002, REQ-JOB-003, REQ-JOB-004, REQ-JOB-005, REQ-JOB-006, REQ-JOB-007, REQ-JOB-008, REQ-JOB-009, REQ-APR-001, REQ-APR-002, REQ-APR-003, REQ-APR-004, REQ-REQ-008, REQ-REQ-009, REQ-REQ-010
**Estimated Complexity**: High
**Success Criteria** (what must be TRUE):
  1. A GA Lead can create a job linked to a request, or create a standalone job, with an auto-generated JOB-YYYY-NNNN ID
  2. A GA Lead can assign/delegate a job to a GA Staff member, and the job progresses through Created -> Assigned -> In Progress -> Completed
  3. Users can post comments (text + optional photo) on a job, and the job detail page shows a timeline with all status changes and comments
  4. When a request involves money, it routes to the CEO approval queue; the Finance Approver can approve or reject (with required reason) from a dedicated approval page showing estimated cost
  5. After a job is completed, the requester has 7 days to accept or reject; if no response, a cron job auto-accepts and the request closes
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — DB migration (schema changes, job_requests join table, company_settings, display ID, auto-accept cron), types, constants, Zod schemas, server actions, photo upload API
- [x] 05-02-PLAN.md — Job creation form with multi-request linking and job list page with filters/data table
- [x] 05-03-PLAN.md — Job detail page with info panel, unified timeline (audit events + comments), comment form
- [x] 05-04-PLAN.md — Approval queue page (pending/history tabs), Company Settings page (budget threshold), sidebar activation
- [ ] 05-05-PLAN.md — Requester acceptance cycle (accept/reject completed work), feedback star rating, linked jobs on request detail

### Phase 6: Inventory
**Goal**: GA Staff can manage a complete asset registry with tracked movements between locations, including receiver confirmation, so the organization has accurate visibility into what assets exist and where they are.
**Depends on**: Phase 3
**Requirements**: REQ-INV-001, REQ-INV-002, REQ-INV-003, REQ-INV-004, REQ-INV-005, REQ-INV-006, REQ-INV-007, REQ-INV-008, REQ-INV-009, REQ-INV-010, REQ-INV-011
**Estimated Complexity**: Medium
**Success Criteria** (what must be TRUE):
  1. GA Staff can create, edit, and view assets with auto-generated AST-YYYY-NNNN IDs, including fields for name, category, location, status, warranty info, invoice upload, and condition photos
  2. Assets follow a status lifecycle (Active -> Under Repair -> Broken -> Sold/Disposed) and status changes are tracked with condition images
  3. The asset list supports search, filtering by status/category/location, and sorting
  4. GA Staff can transfer an asset to a new location, and the receiver must accept the transfer before it completes
  5. When an asset is marked broken or sold, any linked maintenance schedules are automatically paused
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — DB migration (schema changes, display ID function, storage buckets, RLS), types, constants, schemas, server actions, photo/invoice upload API routes
- [ ] 06-02-PLAN.md — Asset list page (columns, filters, sorting, In Transit indicator) and asset creation form (all fields, required condition photos, optional invoices)
- [ ] 06-03-PLAN.md — Asset detail page (info panel, status change dialog, edit form, unified timeline), transfer dialogs (initiate, accept/reject, cancel), sidebar activation

### Phase 7: Preventive Maintenance
**Goal**: GA Leads can define maintenance templates with flexible checklists, assign them to assets on configurable schedules, and the system auto-generates jobs when maintenance is due -- eliminating manual scheduling and missed maintenance.
**Depends on**: Phase 5, Phase 6
**Requirements**: REQ-PM-001, REQ-PM-002, REQ-PM-003, REQ-PM-004, REQ-PM-005, REQ-PM-006, REQ-PM-007, REQ-PM-008, REQ-PM-009, REQ-PM-010
**Estimated Complexity**: High
**Success Criteria** (what must be TRUE):
  1. A GA Lead can create a maintenance template with a linear form builder supporting checklist item types: checkbox, pass/fail, numeric, text, photo, and dropdown
  2. Multiple templates can be assigned to the same asset category, and a schedule can be created linking a template to a specific asset with a configurable interval (days)
  3. A daily cron job auto-generates PM jobs from schedules that are due, with deduplication (skips if previous PM job is still open)
  4. Schedules support both fixed and floating intervals, with floating as the default
  5. When an asset is broken or sold, linked schedules auto-pause; when repaired, schedules resume from the pause date. Overdue PM jobs are flagged prominently in the UI
**Plans**: 4 plans

Plans:
- [ ] 07-01-PLAN.md — DB migration (checklist_responses, is_active, unique index, generate_pm_jobs cron function, RLS), types, constants, Zod schemas, template + schedule server actions
- [ ] 07-02-PLAN.md — Template builder UI (dnd-kit sortable, 6 item types), template list/create/detail pages, sidebar Templates activation
- [ ] 07-03-PLAN.md — Schedule form (category-filtered dropdowns, fixed/floating toggle), schedule list/detail pages, status badge (4 states), sidebar Schedules activation
- [ ] 07-04-PLAN.md — PM job checklist completion UI (save-as-you-go, 6 input types), overdue badge, PM type badge, floating schedule advancement on completion

### Phase 8: Media, Notifications & Dashboards
**Goal**: The application handles images intelligently (compression, annotation, AI descriptions), keeps users informed through in-app notifications, and provides management with operational dashboards and data exports.
**Depends on**: Phase 5, Phase 6, Phase 7
**Requirements**: REQ-MEDIA-001, REQ-MEDIA-002, REQ-MEDIA-003, REQ-MEDIA-004, REQ-MEDIA-005, REQ-MEDIA-006, REQ-NOTIF-001, REQ-NOTIF-002, REQ-NOTIF-003, REQ-NOTIF-004, REQ-NOTIF-005, REQ-NOTIF-006, REQ-NOTIF-007, REQ-DASH-001, REQ-DASH-002, REQ-DASH-003, REQ-DASH-004, REQ-DASH-005, REQ-DASH-006, REQ-DASH-007, REQ-DATA-002
**Estimated Complexity**: High
**Success Criteria** (what must be TRUE):
  1. Images are compressed client-side (WebP, max 800KB) before upload to Supabase Storage with company-scoped paths, and users can upload up to 10 images per entity with lightbox viewing on detail pages
  2. Users can annotate images (draw, text overlay) WhatsApp-style before uploading, and Google Vision API auto-generates image descriptions
  3. Users see a bell icon with unread count, a notification dropdown (recent 10-20 items), and a full notification center page with filters and mark-all-read. Clicking a notification navigates to the relevant entity
  4. Notifications fire for: status changes, assignments, approvals, completions, and auto-accept warnings. The actor is never notified about their own action
  5. The GA Lead dashboard shows KPI cards (open requests, overdue jobs, untriaged count), request/job status distribution charts, staff workload view, maintenance due/overdue summary, inventory counts, and request aging. Excel export is available for requests, jobs, inventory, and maintenance data
**Plans**: 7 plans

Plans:
- [ ] 08-01-PLAN.md — Image compression (WebP), generalized entity upload route, freehand annotation dialog, reusable photo upload component
- [ ] 08-02-PLAN.md — Google Vision API proxy, enhanced lightbox with AI descriptions, thumbnail grid component
- [ ] 08-03-PLAN.md — Notification creation helper, server actions, polling hook, bell icon + dropdown in header
- [ ] 08-04-PLAN.md — Notification center page with filters, notification event triggers in request server actions
- [ ] 08-05-PLAN.md — Dashboard KPI cards with trend indicators, date range filter, dashboard page foundation
- [ ] 08-06-PLAN.md — Status distribution charts, staff workload table, request aging, maintenance summary, inventory counts
- [ ] 08-07-PLAN.md — Excel export for requests, jobs, inventory, maintenance with styled spreadsheets

### Phase 9: Polish & Integration
**Goal**: All remaining cross-cutting quality requirements are addressed -- GPS accountability, audit trail visibility, loading states, mobile responsiveness for field workers, and overall UI consistency -- bringing the tool to production readiness.
**Depends on**: Phase 8
**Requirements**: REQ-JOB-010, REQ-DATA-005, REQ-UI-003, REQ-UI-004, REQ-UI-006, REQ-UI-007
**Estimated Complexity**: Medium
**Success Criteria** (what must be TRUE):
  1. Every job status change captures the user's GPS coordinates and this data is visible on the job detail timeline
  2. Admins can view a searchable audit trail of all create/update/delete/transition actions across the system
  3. All data-loading pages display skeleton loading states (no dark mode -- REQ-UI-003 dropped)
  4. GA Staff can update job status and upload photos from a mobile device with a usable, responsive interface
  5. Breadcrumb navigation is present on all interior pages and the overall UI is consistent and polished
**Plans**: 4 plans

Plans:
- [ ] 09-01-PLAN.md — GPS capture infrastructure (migration, useGeolocation hook, job status integration)
- [ ] 09-02-PLAN.md — Audit trail viewer page with filterable DataTable and sidebar navigation
- [ ] 09-03-PLAN.md — Dark mode cleanup (remove all dark: classes) and loading skeletons for all data pages
- [ ] 09-04-PLAN.md — Mobile responsiveness (hamburger sidebar, full-screen dialogs, camera capture), breadcrumbs, UI polish

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9
(Phase 6 can begin after Phase 3 in parallel with Phases 4-5 if desired)

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Database Schema & Supabase Setup | 2/2 | ✓ Complete | 2026-02-10 |
| 2. Auth & RBAC | 2/2 | ✓ Complete | 2026-02-11 |
| 3. Admin & System Configuration | 3/3 | ✓ Complete | 2026-02-11 |
| 4. Requests | 2/2 | ✓ Complete | 2026-02-19 |
| 5. Jobs & Approvals | 5/5 | Complete    | 2026-02-25 |
| 6. Inventory | 3/3 | Complete   | 2026-02-25 |
| 7. Preventive Maintenance | 0/4 | Not started | - |
| 8. Media, Notifications & Dashboards | 0/7 | Not started | - |
| 9. Polish & Integration | 0/4 | Not started | - |

## Requirements Coverage Matrix

Every v1 requirement mapped to exactly one phase. No orphans.

| REQ-ID | Description | Phase | Priority |
|--------|-------------|-------|----------|
| REQ-AUTH-001 | Google OAuth login via Supabase Auth | 2 | Must |
| REQ-AUTH-002 | Email/password login (manual accounts) | 2 | Must |
| REQ-AUTH-003 | Admin-only user creation (no self-registration) | 2 | Must |
| REQ-AUTH-004 | Auth middleware -- redirect unauthenticated users | 2 | Must |
| REQ-AUTH-005 | Session management via Supabase SSR (cookie-based) | 2 | Must |
| REQ-AUTH-006 | Rate limiting on auth endpoints | 2 | Should |
| REQ-AUTH-007 | Remember me / persistent session | 2 | Should |
| REQ-AUTH-008 | Password reset via Supabase Auth email | 2 | Should |
| REQ-RBAC-001 | Five roles: General User, GA Staff, GA Lead, Finance Approver, Admin | 2 | Must |
| REQ-RBAC-002 | Division-scoped data visibility for General Users | 2 | Must |
| REQ-RBAC-003 | GA Staff/Lead/Admin see all company data | 2 | Must |
| REQ-RBAC-004 | Supabase RLS policies on all public tables | 1 | Must |
| REQ-RBAC-005 | RLS helper functions | 1 | Must |
| REQ-RBAC-006 | Application-level permission map | 2 | Must |
| REQ-RBAC-007 | UI-level permission gates | 2 | Must |
| REQ-RBAC-008 | Soft delete filter in all RLS SELECT policies | 1 | Must |
| REQ-ADMIN-001 | Company CRUD (admin only) | 3 | Must |
| REQ-ADMIN-002 | Division CRUD (admin only, scoped to company) | 3 | Must |
| REQ-ADMIN-003 | Location CRUD (admin only, scoped to company) | 3 | Must |
| REQ-ADMIN-004 | Category CRUD with type (request/asset) | 3 | Must |
| REQ-ADMIN-005 | User management -- create, edit, deactivate, assign role/division | 3 | Must |
| REQ-ADMIN-006 | User profile page (self-service) | 3 | Should |
| REQ-ADMIN-007 | Soft delete on all admin entities | 3 | Must |
| REQ-REQ-001 | Submit request form: title, description, location, optional photos | 4 | Must |
| REQ-REQ-002 | Auto-fill requester's division on submission | 4 | Must |
| REQ-REQ-003 | Auto-generate human-readable ID (REQ-YYYY-NNNN) | 4 | Must |
| REQ-REQ-004 | Request status workflow | 4 | Must |
| REQ-REQ-005 | GA Lead triage: assign category, priority, PIC | 4 | Must |
| REQ-REQ-006 | Request list with filters and sorting | 4 | Must |
| REQ-REQ-007 | Request detail page with full history/timeline | 4 | Must |
| REQ-REQ-008 | 7-day auto-accept after completion (cron job) | 5 | Must |
| REQ-REQ-009 | Requester accept or reject completed work | 5 | Must |
| REQ-REQ-010 | Requester feedback after acceptance | 5 | Should |
| REQ-JOB-001 | Create job from request (linked) | 5 | Must |
| REQ-JOB-002 | Create standalone job | 5 | Must |
| REQ-JOB-003 | Auto-generate human-readable ID (JOB-YYYY-NNNN) | 5 | Must |
| REQ-JOB-004 | Job status workflow | 5 | Must |
| REQ-JOB-005 | GA Lead assigns/delegates jobs to GA Staff | 5 | Must |
| REQ-JOB-006 | Comment thread on jobs (text + optional photo) | 5 | Must |
| REQ-JOB-007 | Job list with filters and sorting | 5 | Must |
| REQ-JOB-008 | Job detail page with timeline and comments | 5 | Must |
| REQ-JOB-009 | Link multiple requests to a single job | 5 | Should |
| REQ-JOB-010 | GPS capture on every job status change | 9 | Must |
| REQ-APR-001 | CEO approval required when request involves money | 5 | Must |
| REQ-APR-002 | Approval queue page for Finance Approver | 5 | Must |
| REQ-APR-003 | Approve/reject with required reason on rejection | 5 | Must |
| REQ-APR-004 | Show estimated cost in approval view | 5 | Must |
| REQ-INV-001 | Asset CRUD with auto-generated ID | 6 | Must |
| REQ-INV-002 | Asset fields: name, category, location, status, warranty, invoice | 6 | Must |
| REQ-INV-003 | Asset status lifecycle | 6 | Must |
| REQ-INV-004 | Asset list with search, filters, sorting | 6 | Must |
| REQ-INV-005 | Asset detail page with movement history | 6 | Must |
| REQ-INV-006 | Movement tracking: transfer asset between locations | 6 | Must |
| REQ-INV-007 | Receiver acceptance workflow for movements | 6 | Must |
| REQ-INV-008 | Invoice upload for assets | 6 | Should |
| REQ-INV-009 | Warranty info visible on asset detail | 6 | Should |
| REQ-INV-010 | Broken/sold status auto-pauses linked maintenance | 6 | Must |
| REQ-INV-011 | Condition images for assets | 6 | Must |
| REQ-PM-001 | Category-specific maintenance templates (linear form builder) | 7 | Must |
| REQ-PM-002 | Template checklist item types | 7 | Must |
| REQ-PM-003 | Multiple templates per asset category | 7 | Must |
| REQ-PM-004 | Maintenance schedule: assign template to asset with interval | 7 | Must |
| REQ-PM-005 | Fixed and floating interval support | 7 | Must |
| REQ-PM-006 | Auto-generate jobs from schedules (daily cron) | 7 | Must |
| REQ-PM-007 | Auto-pause schedule when asset broken/sold | 7 | Must |
| REQ-PM-008 | Resume schedule from pause date when repaired | 7 | Must |
| REQ-PM-009 | Prevent duplicate job generation | 7 | Must |
| REQ-PM-010 | Overdue PM jobs flagged prominently | 7 | Should |
| REQ-MEDIA-001 | Client-side image compression (WebP, max 800KB) | 8 | Must |
| REQ-MEDIA-002 | Image upload to Supabase Storage (company-scoped) | 8 | Must |
| REQ-MEDIA-003 | WhatsApp-style image annotation | 8 | Should |
| REQ-MEDIA-004 | Google Vision API for auto-generating descriptions | 8 | Should |
| REQ-MEDIA-005 | Multiple image upload (up to 10 per entity) | 8 | Must |
| REQ-MEDIA-006 | Image gallery/lightbox on detail pages | 8 | Should |
| REQ-NOTIF-001 | In-app notification system (database + polling) | 8 | Must |
| REQ-NOTIF-002 | Bell icon with unread count badge | 8 | Must |
| REQ-NOTIF-003 | Notification dropdown (recent 10-20) | 8 | Must |
| REQ-NOTIF-004 | Full notification center page | 8 | Must |
| REQ-NOTIF-005 | Click notification navigates to entity | 8 | Must |
| REQ-NOTIF-006 | Notification events: status changes, assignments, approvals, etc. | 8 | Must |
| REQ-NOTIF-007 | Never notify the actor about their own action | 8 | Must |
| REQ-DASH-001 | GA Lead dashboard: KPI cards | 8 | Must |
| REQ-DASH-002 | Request status distribution chart | 8 | Must |
| REQ-DASH-003 | Job status distribution chart | 8 | Must |
| REQ-DASH-004 | Staff workload view | 8 | Should |
| REQ-DASH-005 | Maintenance due/overdue summary | 8 | Must |
| REQ-DASH-006 | Inventory count by status/category | 8 | Should |
| REQ-DASH-007 | Request aging (open > X days) | 8 | Should |
| REQ-DATA-001 | Soft delete across all entities | 1 | Must |
| REQ-DATA-002 | Excel export for requests, jobs, inventory, maintenance | 8 | Must |
| REQ-DATA-003 | Audit trail -- log all actions | 1 | Must |
| REQ-DATA-004 | IDR currency formatting throughout | 4 | Must |
| REQ-DATA-005 | Audit trail viewer (admin) | 9 | Should |
| REQ-UI-001 | Desktop-first responsive layout with sidebar navigation | 3 | Must |
| REQ-UI-002 | shadcn/ui component library with Tailwind v4 | 3 | Must |
| REQ-UI-003 | Light/dark mode support | 9 | Could |
| REQ-UI-004 | Loading skeletons for all data pages | 9 | Should |
| REQ-UI-005 | Toast notifications for action feedback | 3 | Must |
| REQ-UI-006 | Breadcrumb navigation | 9 | Should |
| REQ-UI-007 | Mobile-responsive for field workflows | 9 | Must |

**Coverage: 83/83 v1 requirements mapped. No orphans.**

## v2 Requirements (Not in Scope)

These are tracked but not mapped to any phase in this milestone:

| REQ-ID | Description | Scope |
|--------|-------------|-------|
| REQ-REQ-011 | Deduplication awareness | v2 |
| REQ-REQ-012 | Batch triage for GA Lead | v2 |
| REQ-APR-005 | Approval delegation | v2 |
| REQ-NOTIF-008 | Email notifications for high-priority events | v2 |
| REQ-NOTIF-009 | Configurable notification preferences per user | v2 |
| REQ-NOTIF-010 | @mention in comments triggers notification | v2 |
| REQ-DASH-008 | Average response/resolution time metrics | v2 |
| REQ-DASH-009 | Per-subsidiary/division breakdown | v2 |
| REQ-DASH-010 | Trend charts (volume over time) | v2 |
