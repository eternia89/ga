# REQUIREMENTS.md — GA Operations Tool (v1)

## Milestone 1: Full Operational Tool

All requirements below are scoped for v1 unless marked otherwise.

---

## Auth & Identity

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-AUTH-001 | Google OAuth login via Supabase Auth | v1 | Must |
| REQ-AUTH-002 | Email/password login (manual accounts) | v1 | Must |
| REQ-AUTH-003 | Admin-only user creation (no self-registration, disable Supabase signup) | v1 | Must |
| REQ-AUTH-004 | Auth middleware — redirect unauthenticated users to login | v1 | Must |
| REQ-AUTH-005 | Session management via Supabase SSR (cookie-based) | v1 | Must |
| REQ-AUTH-006 | Rate limiting on auth endpoints | v1 | Should |
| REQ-AUTH-007 | Remember me / persistent session | v1 | Should |
| REQ-AUTH-008 | Password reset via Supabase Auth email | v1 | Should |

## RBAC & Data Isolation

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-RBAC-001 | Five roles: General User, GA Staff, GA Lead, Finance Approver (CEO), Admin | v1 | Must |
| REQ-RBAC-002 | Division-scoped data visibility for General Users (only see own division) | v1 | Must |
| REQ-RBAC-003 | GA Staff/Lead/Admin see all company data (cross-division) | v1 | Must |
| REQ-RBAC-004 | Supabase RLS policies on all public tables enforcing company isolation | v1 | Must |
| REQ-RBAC-005 | RLS helper functions (auth.user_company_id, auth.user_division_id, auth.user_role) | v1 | Must |
| REQ-RBAC-006 | Application-level permission map (role → allowed actions) | v1 | Must |
| REQ-RBAC-007 | UI-level permission gates (show/hide based on role) | v1 | Must |
| REQ-RBAC-008 | Soft delete filter in all RLS SELECT policies (deleted_at IS NULL) | v1 | Must |

## Admin & System Configuration

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-ADMIN-001 | Company CRUD (admin only) | v1 | Must |
| REQ-ADMIN-002 | Division CRUD (admin only, scoped to company) | v1 | Must |
| REQ-ADMIN-003 | Location CRUD (admin only, scoped to company) | v1 | Must |
| REQ-ADMIN-004 | Category CRUD with type (request category, asset category) | v1 | Must |
| REQ-ADMIN-005 | User management — create, edit, deactivate, assign role and division | v1 | Must |
| REQ-ADMIN-006 | User profile page (self-service: name, avatar, notification preferences) | v1 | Should |
| REQ-ADMIN-007 | Soft delete on all admin entities | v1 | Must |

## Requests

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-REQ-001 | Submit request form: title, description, location, optional photo(s) | v1 | Must |
| REQ-REQ-002 | Auto-fill requester's division on submission | v1 | Must |
| REQ-REQ-003 | Auto-generate human-readable ID (REQ-YYYY-NNNN) | v1 | Must |
| REQ-REQ-004 | Request status workflow: Submitted → Triaged → [Pending Approval] → In Progress → Completed → Accepted → Closed | v1 | Must |
| REQ-REQ-005 | GA Lead triage: assign category, priority (Low/Med/High/Urgent), PIC | v1 | Must |
| REQ-REQ-006 | Request list with filters (status, priority, category, date range) and sorting | v1 | Must |
| REQ-REQ-007 | Request detail page with full history/timeline | v1 | Must |
| REQ-REQ-008 | 7-day auto-accept after completion (cron job) | v1 | Must |
| REQ-REQ-009 | Requester can accept or reject completed work (within 7-day window) | v1 | Must |
| REQ-REQ-010 | Requester feedback after acceptance (optional rating/comment) | v1 | Should |
| REQ-REQ-011 | Deduplication awareness — show similar requests to GA Lead during triage | v2 | Could |
| REQ-REQ-012 | Batch triage for GA Lead (select multiple, assign in bulk) | v2 | Could |

## Jobs

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-JOB-001 | Create job from request (linked) | v1 | Must |
| REQ-JOB-002 | Create standalone job (not linked to request) | v1 | Must |
| REQ-JOB-003 | Auto-generate human-readable ID (JOB-YYYY-NNNN) | v1 | Must |
| REQ-JOB-004 | Job status workflow: Created → Assigned → In Progress → Completed | v1 | Must |
| REQ-JOB-005 | GA Lead assigns/delegates jobs to GA Staff (PIC) | v1 | Must |
| REQ-JOB-006 | Comment thread on jobs (text + optional photo) | v1 | Must |
| REQ-JOB-007 | Job list with filters (status, assignee, date range) and sorting | v1 | Must |
| REQ-JOB-008 | Job detail page with timeline and comments | v1 | Must |
| REQ-JOB-009 | Link multiple requests to a single job | v1 | Should |
| REQ-JOB-010 | GPS capture on every job status change | v1 | Must |

## Approvals

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-APR-001 | CEO approval required when request involves money/budget | v1 | Must |
| REQ-APR-002 | Approval queue page for Finance Approver | v1 | Must |
| REQ-APR-003 | Approve/reject with required reason on rejection | v1 | Must |
| REQ-APR-004 | Show estimated cost prominently in approval view | v1 | Must |
| REQ-APR-005 | Approval delegation (CEO designates temp approver) | v2 | Could |

## Inventory

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-INV-001 | Asset CRUD with auto-generated ID (AST-YYYY-NNNN) | v1 | Must |
| REQ-INV-002 | Asset fields: name, category, location, status, warranty info, invoice | v1 | Must |
| REQ-INV-003 | Asset status lifecycle: Active → Under Repair → Broken → Sold/Disposed | v1 | Must |
| REQ-INV-004 | Asset list with search, filters (status, category, location), and sorting | v1 | Must |
| REQ-INV-005 | Asset detail page with movement history | v1 | Must |
| REQ-INV-006 | Movement tracking: transfer asset between locations | v1 | Must |
| REQ-INV-007 | Receiver acceptance workflow for asset movements | v1 | Must |
| REQ-INV-008 | Invoice upload for assets (PDF/image) | v1 | Should |
| REQ-INV-009 | Warranty info visible on asset detail (expiry date) | v1 | Should |
| REQ-INV-010 | Broken/sold status auto-pauses linked maintenance schedules | v1 | Must |
| REQ-INV-011 | Condition images — upload photos to document asset condition (create, status change, movement) | v1 | Must |

## Preventive Maintenance

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-PM-001 | Category-specific maintenance templates (linear form builder) | v1 | Must |
| REQ-PM-002 | Template checklist item types: checkbox, pass/fail, numeric, text, photo, dropdown | v1 | Must |
| REQ-PM-003 | Multiple templates allowed per asset category | v1 | Must |
| REQ-PM-004 | Maintenance schedule: assign template to asset with interval (days) | v1 | Must |
| REQ-PM-005 | Fixed and floating interval support (default: floating) | v1 | Must |
| REQ-PM-006 | Auto-generate jobs from schedules (daily cron) | v1 | Must |
| REQ-PM-007 | Auto-pause schedule when asset is broken or sold | v1 | Must |
| REQ-PM-008 | Resume schedule from pause date when asset is repaired | v1 | Must |
| REQ-PM-009 | Prevent duplicate job generation (skip if previous PM job still open) | v1 | Must |
| REQ-PM-010 | Overdue PM jobs flagged prominently | v1 | Should |

## Media & Image Handling

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-MEDIA-001 | Client-side image compression before upload (WebP, max 800KB) | v1 | Must |
| REQ-MEDIA-002 | Image upload to Supabase Storage (company-scoped paths) | v1 | Must |
| REQ-MEDIA-003 | WhatsApp-style image annotation (draw, text overlay) before upload | v1 | Should |
| REQ-MEDIA-004 | Google Vision API for auto-generating image descriptions | v1 | Should |
| REQ-MEDIA-005 | Multiple image upload (up to 10 per entity) | v1 | Must |
| REQ-MEDIA-006 | Image gallery/lightbox on detail pages | v1 | Should |

## Notifications

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-NOTIF-001 | In-app notification system (database + polling) | v1 | Must |
| REQ-NOTIF-002 | Bell icon with unread count badge in header | v1 | Must |
| REQ-NOTIF-003 | Notification dropdown (recent 10-20 items) | v1 | Must |
| REQ-NOTIF-004 | Full notification center page with filters and mark-all-read | v1 | Must |
| REQ-NOTIF-005 | Click notification → navigate to relevant entity | v1 | Must |
| REQ-NOTIF-006 | Notification events: status changes, assignments, approvals, completions, auto-accept warnings | v1 | Must |
| REQ-NOTIF-007 | Never notify the actor about their own action | v1 | Must |
| REQ-NOTIF-008 | Email notifications for high-priority events | v2 | Should |
| REQ-NOTIF-009 | Configurable notification preferences per user | v2 | Could |
| REQ-NOTIF-010 | @mention in comments triggers notification | v2 | Could |

## Dashboards

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-DASH-001 | GA Lead dashboard: KPI cards (open requests, overdue jobs, untriaged count) | v1 | Must |
| REQ-DASH-002 | Request status distribution chart | v1 | Must |
| REQ-DASH-003 | Job status distribution chart | v1 | Must |
| REQ-DASH-004 | Staff workload view (open jobs per GA Staff) | v1 | Should |
| REQ-DASH-005 | Maintenance due/overdue summary | v1 | Must |
| REQ-DASH-006 | Inventory count by status/category | v1 | Should |
| REQ-DASH-007 | Request aging (requests open > X days) | v1 | Should |
| REQ-DASH-008 | Average response/resolution time metrics | v2 | Could |
| REQ-DASH-009 | Per-subsidiary/division breakdown | v2 | Could |
| REQ-DASH-010 | Trend charts (volume over time) | v2 | Could |

## Data Management & Reporting

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-DATA-001 | Soft delete across all entities (deleted_at column) | v1 | Must |
| REQ-DATA-002 | Excel export for requests, jobs, inventory, maintenance | v1 | Must |
| REQ-DATA-003 | Audit trail — log all create/update/delete/transition actions | v1 | Must |
| REQ-DATA-004 | IDR currency formatting throughout | v1 | Must |
| REQ-DATA-005 | Audit trail viewer (admin) | v1 | Should |

## UI & Layout

| REQ-ID | Requirement | Scope | Priority |
|--------|------------|-------|----------|
| REQ-UI-001 | Desktop-first responsive layout with sidebar navigation | v1 | Must |
| REQ-UI-002 | shadcn/ui component library with Tailwind v4 | v1 | Must |
| REQ-UI-003 | Light/dark mode support | v1 | Could |
| REQ-UI-004 | Loading skeletons for all data pages | v1 | Should |
| REQ-UI-005 | Toast notifications for action feedback (success/error) | v1 | Must |
| REQ-UI-006 | Breadcrumb navigation | v1 | Should |
| REQ-UI-007 | Mobile-responsive for field workflows (job status update, photo upload) | v1 | Must |

---

## Requirement Counts

| Scope | Must | Should | Could | Total |
|-------|------|--------|-------|-------|
| v1 | 63 | 18 | 2 | 83 |
| v2 | 0 | 1 | 6 | 7 |
| **Total** | **63** | **19** | **8** | **90** |

## Out of Scope (Do Not Build)

- Real-time chat (comment threads suffice)
- Drag-and-drop form builder (linear field list is sufficient)
- IoT/sensor integration
- AI-powered auto-assignment
- Native mobile app
- Vendor/contractor portal
- Barcode/QR scanning
- Gantt charts
- Multi-language i18n
- Custom approval chains (beyond CEO approval)
- Meter-based or condition-based maintenance
- Push notifications / SMS / WhatsApp integration

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-AUTH-001 | Phase 2 | Pending |
| REQ-AUTH-002 | Phase 2 | Pending |
| REQ-AUTH-003 | Phase 2 | Pending |
| REQ-AUTH-004 | Phase 2 | Pending |
| REQ-AUTH-005 | Phase 2 | Pending |
| REQ-AUTH-006 | Phase 2 | Pending |
| REQ-AUTH-007 | Phase 2 | Pending |
| REQ-AUTH-008 | Phase 2 | Pending |
| REQ-RBAC-001 | Phase 2 | Pending |
| REQ-RBAC-002 | Phase 2 | Complete |
| REQ-RBAC-003 | Phase 2 | Pending |
| REQ-RBAC-004 | Phase 1 | Pending |
| REQ-RBAC-005 | Phase 1 | Pending |
| REQ-RBAC-006 | Phase 2 | Pending |
| REQ-RBAC-007 | Phase 2 | Pending |
| REQ-RBAC-008 | Phase 1 | Pending |
| REQ-ADMIN-001 | Phase 3 | Pending |
| REQ-ADMIN-002 | Phase 3 | Pending |
| REQ-ADMIN-003 | Phase 3 | Pending |
| REQ-ADMIN-004 | Phase 3 | Pending |
| REQ-ADMIN-005 | Phase 3 | Pending |
| REQ-ADMIN-006 | Phase 3 | Pending |
| REQ-ADMIN-007 | Phase 3 | Pending |
| REQ-REQ-001 | Phase 4 | Pending |
| REQ-REQ-002 | Phase 4 | Pending |
| REQ-REQ-003 | Phase 4 | Pending |
| REQ-REQ-004 | Phase 4 | Pending |
| REQ-REQ-005 | Phase 4 | Pending |
| REQ-REQ-006 | Phase 4 | Pending |
| REQ-REQ-007 | Phase 4 | Complete |
| REQ-REQ-008 | Phase 5 | Complete |
| REQ-REQ-009 | Phase 5 | Complete |
| REQ-REQ-010 | Phase 5 | Complete |
| REQ-JOB-001 | Phase 5 | Complete |
| REQ-JOB-002 | Phase 5 | Complete |
| REQ-JOB-003 | Phase 5 | Complete |
| REQ-JOB-004 | Phase 5 | Complete |
| REQ-JOB-005 | Phase 5 | Complete |
| REQ-JOB-006 | Phase 5 | Complete |
| REQ-JOB-007 | Phase 5 | Complete |
| REQ-JOB-008 | Phase 5 | Complete |
| REQ-JOB-009 | Phase 5 | Complete |
| REQ-JOB-010 | Phase 9 | Complete |
| REQ-APR-001 | Phase 5 | Complete |
| REQ-APR-002 | Phase 5 | Complete |
| REQ-APR-003 | Phase 5 | Complete |
| REQ-APR-004 | Phase 5 | Complete |
| REQ-INV-001 | Phase 6 | Complete |
| REQ-INV-002 | Phase 6 | Complete |
| REQ-INV-003 | Phase 6 | Complete |
| REQ-INV-004 | Phase 6 | Complete |
| REQ-INV-005 | Phase 6 | Complete |
| REQ-INV-006 | Phase 6 | Complete |
| REQ-INV-007 | Phase 6 | Complete |
| REQ-INV-008 | Phase 6 | Complete |
| REQ-INV-009 | Phase 6 | Complete |
| REQ-INV-010 | Phase 6 | Complete |
| REQ-PM-001 | Phase 7 | Complete |
| REQ-PM-002 | Phase 7 | Complete |
| REQ-PM-003 | Phase 7 | Complete |
| REQ-PM-004 | Phase 7 | Complete |
| REQ-PM-005 | Phase 7 | Complete |
| REQ-PM-006 | Phase 7 | Complete |
| REQ-PM-007 | Phase 7 | Complete |
| REQ-PM-008 | Phase 7 | Complete |
| REQ-PM-009 | Phase 7 | Complete |
| REQ-PM-010 | Phase 7 | Complete |
| REQ-MEDIA-001 | Phase 8 | Complete |
| REQ-MEDIA-002 | Phase 8 | Complete |
| REQ-MEDIA-003 | Phase 8 | Complete |
| REQ-MEDIA-004 | Phase 8 | Complete |
| REQ-MEDIA-005 | Phase 8 | Complete |
| REQ-MEDIA-006 | Phase 8 | Complete |
| REQ-NOTIF-001 | Phase 8 | Complete |
| REQ-NOTIF-002 | Phase 8 | Complete |
| REQ-NOTIF-003 | Phase 8 | Complete |
| REQ-NOTIF-004 | Phase 8 | Complete |
| REQ-NOTIF-005 | Phase 8 | Complete |
| REQ-NOTIF-006 | Phase 8 | Complete |
| REQ-NOTIF-007 | Phase 8 | Complete |
| REQ-DASH-001 | Phase 8 | Complete |
| REQ-DASH-002 | Phase 8 | Complete |
| REQ-DASH-003 | Phase 8 | Complete |
| REQ-DASH-004 | Phase 8 | Complete |
| REQ-DASH-005 | Phase 8 | Complete |
| REQ-DASH-006 | Phase 8 | Complete |
| REQ-DASH-007 | Phase 8 | Complete |
| REQ-DATA-001 | Phase 1 | Pending |
| REQ-DATA-002 | Phase 8 | Complete |
| REQ-DATA-003 | Phase 1 | Pending |
| REQ-DATA-004 | Phase 4 | Complete |
| REQ-DATA-005 | Phase 9 | Complete |
| REQ-UI-001 | Phase 3 | Pending |
| REQ-UI-002 | Phase 3 | Pending |
| REQ-UI-003 | Phase 9 | Complete |
| REQ-UI-004 | Phase 9 | Complete |
| REQ-UI-005 | Phase 3 | Pending |
| REQ-UI-006 | Phase 9 | Complete |
| REQ-UI-007 | Phase 9 | Complete |
