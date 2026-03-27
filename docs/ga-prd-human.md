# GA Operations Tool — How It Works
### A guide for humans (and machines that need to think like humans)

> This document describes what the system does, why, how it feels, and what can go wrong.
> For database schemas and technical specs, see `.planning/PROJECT.md` and `CLAUDE.md`.
> Claude reads this PRD before every task to validate feasibility and common sense.

---

## The Big Idea

This is an internal operations tool for a corporate group's General Affairs (GA) department. Office workers submit maintenance requests ("the AC is broken in room 301"), GA staff receive and execute jobs, and management has full visibility into what's happening across all subsidiaries.

Everything revolves around **physical things in physical places**: equipment that breaks, assets that move between people, maintenance that needs scheduling. The GA team is a shared service — a small team (5-15 people) serving 5-15 subsidiary companies with 100-500 total users.

Three design rules shape everything:

- **Desktop-first.** This is a back-office tool used on office computers. Mobile is supported but not the primary experience. Default styles target desktop; `max-*` breakpoints override for smaller screens.
- **Soft delete everything.** Nothing is ever permanently removed. Every "delete" sets `deleted_at`. This preserves audit trails and prevents accidental data loss. FK constraints never fire ON DELETE because rows are never actually removed.
- **Detail pages ARE edit pages.** No separate "view" and "edit" modes. If you have permission, fields are directly editable. No "edit" button that navigates to a form.

And one more: **every entity is company-scoped.** Every request, job, asset, schedule belongs to a company. Users see data from their primary company plus any secondary companies they've been granted access to. RLS enforces this at the database level.

---

## Who Uses This App

There are five roles. Each sees a different version of the same app.

### The General User
An office worker. They care about two things: **submitting requests when something breaks** and **receiving company assets**.

They open the app, see the request form, describe the problem ("AC unit in meeting room B not cooling"), attach a photo, and submit. Done. They can track their request's progress, and when the GA team marks the work complete, they get 7 days to accept or reject the result. If they don't respond, it auto-accepts.

On the inventory side, general users only see **assets assigned to them** (where they are the `holder_id`) and **assets being transferred to them** (pending transfers where they are the receiver). They don't see the full inventory — that's for GA staff. When a transfer arrives, they see a "Respond" button on their inventory page, review the asset details and sender's condition photos, then accept or reject.

**What general users can NOT do:**
- See assets they don't hold
- Transfer assets (only GA staff initiates transfers)
- Change asset status
- Create jobs
- Triage requests
- Access admin settings

### The GA Staff
A field technician who goes to locations and fixes things. They care about **their assigned jobs and the assets they manage**.

They see all requests assigned to them, all jobs they're PIC (Person In Charge) for, and the full inventory of assets in their company. They can:
- Self-assign submitted requests and start working
- Create standalone jobs
- Update job status with GPS capture (proving they were at the location)
- Transfer assets between any users in the company
- Change asset status (active, under repair, broken, sold/disposed)
- Take condition photos when transferring or changing status

**Key rule:** A job cannot be completed without an assigned PIC. Someone must be accountable.

### The GA Lead
Operations manager. Same capabilities as GA Staff, plus:
- Triage requests (assign category, priority, PIC)
- Delegate jobs to GA Staff
- Cancel transfers
- Full operational visibility across the company

They're the traffic controller — requests come in, they assign them to the right person, and monitor progress.

### The Finance Approver (CEO)
They only care about money. When a job's estimated cost exceeds the company's budget threshold, it lands in their approval queue. They approve or reject with a reason. They see:
- The approval queue (pending budget + completion approvals)
- The dashboard with KPI metrics
- Nothing else

### The Admin
System administrator. Configures everything:
- Companies, divisions, locations, categories
- User accounts (admin-only creation, no self-registration)
- Multi-company access grants
- Company settings (budget thresholds)

Admins see everything. They manage the system, not the operations.

---

## The Request Flow: From Problem to Resolution

This is the core workflow. Everything else supports it.

### 1. Submit
A general user describes the problem. Required: description, location, at least one photo. The system auto-generates a human-readable ID (e.g., `RQ-JN26-001` for the first Jaknot request of 2026).

**No title field.** Users don't write titles — that's a GA Lead decision during triage. The description IS the request.

### 2. Triage
GA Lead reviews new requests. They assign:
- **Category** (e.g., "Electrical", "Plumbing", "AC/HVAC")
- **Priority** (low, medium, high, urgent)
- **PIC** (which GA Staff handles it)

Status moves from `submitted` → `triaged`. GA Staff who self-assign skip this step.

### 3. Job Creation
A job is created from the request (or standalone for proactive work). Jobs track:
- Estimated cost (triggers approval if above threshold)
- Assigned PIC
- Status progression with GPS on every transition
- Photo documentation
- Comment threads

**One request can link to one job.** One-to-one, not many-to-many.

### 4. Budget Approval
If estimated cost ≥ company's budget threshold, the job goes to `pending_approval`. The Finance Approver reviews and approves/rejects. Rejected jobs return to `assigned` status — the PIC is preserved.

### 5. Execution
GA Staff works the job. They update status: `assigned` → `in_progress` → `completed`. Each transition captures GPS coordinates (proving they were on-site). They add comments and photos along the way.

### 6. Completion & Acceptance
When the job is marked complete, linked requests move to `pending_acceptance`. The original requester gets 7 days to accept or reject the work:
- **Accept:** Request moves to `accepted` → optional feedback → `closed`
- **Reject:** Requester provides reason + evidence photos. Job returns to the PIC.
- **No response after 7 days:** Auto-accepted by system cron

### 7. What Can Go Wrong
- **Requester submits duplicate:** No automated dedup in v1. GA Lead handles manually during triage.
- **PIC can't reach the location:** They add a comment explaining. GA Lead reassigns.
- **Budget rejected:** Job stays alive at `assigned`. PIC can adjust estimate and resubmit.
- **Request cancelled by requester:** Linked job is NOT auto-cancelled (work may have started). GA Lead decides.

---

## The Asset Lifecycle: Physical Custody Chains

Assets are physical equipment — ACs, generators, filters, tools. They sit at locations and are held by specific people.

### Asset States
| Status | Meaning | Can Transfer? | Can Edit? |
|--------|---------|---------------|-----------|
| `active` | Working normally | Yes | Yes |
| `under_repair` | Being fixed | **No** | Yes |
| `broken` | Non-functional | **No** | Yes |
| `sold_disposed` | Gone forever (terminal) | No | No |

### The Holder Model
Every asset has an optional `holder_id` — the person physically responsible for it. Key rules:
- **Starts null.** New assets have no holder until someone accepts a transfer.
- **Set on transfer acceptance.** When a user accepts a transfer, `holder_id` = their user ID.
- **Cleared on location-only moves.** Moving an asset to a location (without a designated receiver) clears the holder — no specific person is receiving it.
- **General users see only their assets.** The inventory page filters by `holder_id = current user` OR `pending transfer receiver = current user`.

### Transfers: Moving Physical Custody

Two modes:
1. **Transfer to User** — Designate a specific receiver. Creates a `pending` movement. Receiver must accept with condition photos. Once accepted: asset location updates, holder updates, custody transferred.
2. **Move to Location** — No receiver. Auto-accepts immediately. Asset location updates, holder cleared. Used for warehouse storage moves.

**Transfer rules:**
- Can't transfer `under_repair` or `broken` assets (fix them first)
- Can't transfer `sold_disposed` assets (they're gone)
- Can't move to the same location (pointless)
- Can't transfer to a deactivated user
- Can't transfer cross-company
- One pending transfer per asset at a time (DB constraint)
- Sender must take condition photos (required)

**When an asset is in transit:**
- Status badge shows "In Transit" (replaces the normal status)
- "Change Status" and "Transfer" buttons are hidden
- Table shows receiver name under the location
- The receiver sees a "Respond" action button to accept/reject
- Admins see "Edit Transfer" to view details or cancel

**Transfer response (receiver):**
- Accept: optional condition photos, asset moves to receiver's location, holder updated
- Reject: required reason + optional evidence photos, asset stays at sender's location

### Status Changes
- Status changes require condition photos (documenting why)
- **Cannot change status while a transfer is pending** (cancel the transfer first)
- `sold_disposed` is terminal — irreversible, auto-pauses all linked maintenance schedules
- `broken` status auto-pauses linked maintenance schedules and cancels pending PM jobs
- Returning to `active` from `broken`/`under_repair` resumes auto-paused schedules (but not manually paused ones)

---

## Preventive Maintenance: Keeping Things Running

### Templates
Reusable checklists for maintenance tasks. **Global** — shared across all companies. Examples:
- "Monthly APAR Inspection" — check seal, pressure gauge, physical condition
- "Quarterly AC Filter Replacement" — inspect, clean, replace filter

Templates have a linear checklist (checkbox, text, number fields). GA Staff fills them out during the PM job.

### Schedules
Link a template to an asset (or run without an asset for general maintenance). Configure:
- Interval type: `fixed` (cron-based, calendar dates) or `floating` (interval from last completion)
- Interval days (e.g., 30 for monthly)
- Auto-create days before due (0-30 — how early to generate the job)

**Schedule lifecycle:**
- `active` → generates PM jobs automatically
- `paused` → stops generating (manual or auto-paused by broken/sold asset)
- `deactivated` → soft-deleted

### PM Job Generation
A cron function runs periodically. For each active schedule where `next_due_at` is within `auto_create_days_before`:
- Create a job with `job_type = 'preventive_maintenance'`
- Copy the checklist from the template
- Link to the asset (if any)
- Advance `next_due_at` for fixed schedules (floating waits for completion)

---

## Multi-Company: One Team, Many Subsidiaries

The GA team serves multiple companies. Key mechanics:

### User Company Access
- Every user has a **primary company** (`company_id` on user_profiles)
- Admins can grant **secondary company access** via `user_company_access` table
- RLS policies check both primary and secondary access
- Multi-company users see a company selector in create modals

### Data Isolation
- Every entity has `company_id` (NOT NULL)
- RLS enforces: you can only see/edit data in companies you have access to
- Categories are **global** (shared across companies)
- Templates are **global** (shared across companies)
- Locations, divisions, users are **company-scoped**
- Transfers cannot cross company boundaries

### UI Behavior
- Single-company users: company field shown but disabled (read-only)
- Multi-company users: company field is an interactive dropdown
- All create modals show the company field for transparency

---

## The Dashboard: Operational Visibility

### KPI Cards (clickable → filtered page)
- Open Requests (untriaged)
- Overdue Requests (open > 7 days)
- Active Jobs
- Overdue Jobs (in_progress > 7 days)
- Assets in Transit

### Charts
- Request status distribution (bar chart, clickable bars)
- Job status distribution

### Date Range Filter
- URL-synced via `from` and `to` query params
- Default: current month
- Trend comparison: current period vs same-duration previous period

---

## Notifications: Who Needs to Know

Fire-and-forget with error logging (not blocking). Channels:
- **In-app** bell icon + notification inbox
- **No email in v1** (future consideration)

| Event | Recipients |
|-------|-----------|
| Request triaged | Requester |
| Job assigned | PIC |
| Job status change | Requester + PIC |
| Budget approval needed | Finance Approvers |
| Budget approved/rejected | Job creator + PIC |
| Completion approval needed | Finance Approvers |
| Work completed | Requester |
| Auto-accept warning | Requester (day 5 of 7) |

Actor (person who triggered the action) is always excluded from notifications.

---

## Excel Exports

Every list page has an Export button. Downloads all data regardless of current filters.

Format: `.xlsx` via ExcelJS (server-side, Node.js runtime only). Columns match the table view plus additional detail fields.

---

## What This System Does NOT Do

- **Payroll calculation** — We track costs, not salaries
- **Real-time chat** — Comment threads on jobs only
- **Asset depreciation** — No financial tracking beyond purchase price
- **Automated scheduling optimization** — Schedules are manual
- **Self-registration** — Admins create all accounts
- **Email notifications** — In-app only for v1
- **Hard deletes** — Everything is soft-deleted
- **Mobile-first design** — Desktop-first, mobile-responsive

---

## Technical Invariants (Non-Negotiable Rules)

These rules must be preserved across all changes:

1. **Dates:** Always `dd-MM-yyyy` format. Never `MMM d, yyyy`.
2. **Currency:** IDR with Rp prefix, dot thousands separator.
3. **Soft delete:** `deleted_at` on all tables. Never `DELETE FROM`.
4. **Desktop-first:** Default styles = desktop. Use `max-*` breakpoints.
5. **Display IDs:** Always rendered with `font-mono` class.
6. **Feedback:** Never auto-dismiss success/error messages. User dismisses manually.
7. **Forms:** Always react-hook-form + Zod. Never raw useState for form state.
8. **Actions:** Always next-safe-action with typed client chains.
9. **Dropdowns:** Use Combobox for large lists, Select for short fixed lists.
10. **Terminology:** "Deactivate"/"Reactivate" for soft-delete. Never "Delete"/"Restore".
11. **Auth:** `getUser()` for server-side JWT validation. Never `getSession()`.
12. **RLS:** Let RLS handle access control where possible. Only use `adminSupabase` when RLS is insufficient and you verify authorization in code first.
13. **Optimistic locking:** Update actions compare `updated_at` to prevent concurrent edit overwrites.
14. **Action responses:** All server actions return `ActionResponse<T>` typed responses with explicit return type annotations.
15. **Accessibility:** Skip-to-content link, focus restoration on lightbox close, aria-live on form errors.
16. **Role constants:** All role checks must use `ROLES.*`, `GA_ROLES`, or `LEAD_ROLES` from `lib/constants/roles.ts`. Never inline role string arrays.
17. **Operational roles:** Dashboard visibility, approval pages, and export routes must use `OPERATIONAL_ROLES` from `lib/constants/roles.ts`. Never redefine inline.
18. **Status constants:** All status arrays (terminal, active, linkable, triageable) must use semantic constants from `lib/constants/job-status.ts` and `lib/constants/request-status.ts`. Never inline status arrays.
19. **safeCreateNotifications:** All fire-and-forget notification calls must use `safeCreateNotifications()` from `lib/notifications/helpers.ts`. Never use raw `createNotifications().catch()`.
20. **Schema completeness:** Every `z.string()` must have `.max(N)`, every UUID field must have `.uuid()`, every `z.array()` must have `.max(N)`. No unbounded fields.

---

## Change Log

### 27-Mar-2026 — Codebase Hardening Mega-Batch (81 commits, 177 files, ~11K lines)

Largest single-day change batch in project history. 20 separate quick-task sweeps addressed security, validation, error handling, type safety, DRY violations, and UI consistency.

**Security Hardening (4 sweeps):**
- Vision API route now validates company access before updating attachments; API key moved from URL query param to `x-goog-api-key` header
- `assertCompanyAccess` added to all 4 approval actions, user/settings/access actions, and media upload routes
- `getSession()` replaced with `getUser()` for server-validated auth on update-password page
- Defense-in-depth `company_id` filters added to media mutations and upload routes

**Schema Validation (2 sweeps):**
- Added missing `.max()` constraints across 12 Zod schemas (profile passwords, pm-job photoUrls/itemIds, job linked_request_ids, template checklist)
- Added `.uuid()` validation to all UUID-accepting fields
- Asset and template `name` fields reduced from max=100 to max=60 per convention
- Created `optionalUuid()` Zod helper — unified 3 divergent optional UUID patterns
- Synced UI `<Input maxLength>` attributes with schema `.max()` values

**Error Handling (2 sweeps):**
- Added error handling to 12 fire-and-forget Supabase mutations across 5 action files
- Added signedUrl error logging and empty-URL filtering across 11 files
- Added error handling to all 7 storage upload routes
- Added user-visible error feedback to 4 unchecked fetch calls (export, job form, job modal, request submit)

**Data Integrity (1 sweep):**
- Added failed tracking to bulk deactivate operations (company, division, location, category)
- Added rollback logic to `createUser`, `updateUser`, `updateUserCompanyAccess`
- Cascading request status guards changed from denylist to allowlist using `REQUEST_LINKABLE_STATUSES`

**DRY Extractions (4 sweeps):**
- Extracted `safeCreateNotifications()` wrapper; converted all 15 notification call sites
- Extracted 6 semantic status constants (`JOB_TERMINAL_STATUSES`, `JOB_ACTIVE_STATUSES`, `REQUEST_LINKABLE_STATUSES`, etc.) — replaced 36 inline arrays
- Extracted `roleColors`/`roleDisplay` to `lib/constants/role-display.ts` — deduplicated from 4 components
- Extracted `TYPE_COLORS` to `lib/constants/checklist-types.ts` — deduplicated from 3 components

**Type Safety (1 sweep):**
- Removed all 11 `as any` casts across 10 files; added `UserProfileWithJoins` type

**UI Consistency (3 sweeps):**
- Migrated 18 inline `font-mono` display IDs to `<DisplayId>` component across 16 files
- Standardized all link hover colors to `hover:text-blue-700`; fixed CSV export date format
- Added `pb-20` to asset detail page; redirected `/inventory/new` to `?action=create` modal

**Code Cleanup (1 sweep):**
- Replaced all string literal role checks with `ROLES` constants across 17 files
- Fixed wrong table name in entity-photos route; removed dead `template_name` fallback

**New Technical Invariants (#18–#20):** Status constants, safeCreateNotifications, schema completeness (see above).

---

### 23-Mar-2026 — Feedback & Role Constant Fixes (6 commits, 10 files)

**Feedback Persistence (2 fixes):**
- Removed `setTimeout` auto-close from `password-change-dialog.tsx` (was 1500ms) and `request-triage-dialog.tsx` (was 800ms). Both now require manual user dismissal, per Technical Invariant #6.

**Role Constants Expansion:**
- Added `OPERATIONAL_ROLES` constant to `lib/constants/roles.ts` (ga_lead + admin + finance_approver).
- Replaced 7 remaining inline role arrays in dashboard, approvals, jobs, requests pages, and 2 export routes with `OPERATIONAL_ROLES`/`GA_ROLES` imports.

**New Technical Invariant (#17):**
- `OPERATIONAL_ROLES` constant: Dashboard visibility, approval pages, and export routes must use `OPERATIONAL_ROLES` from `lib/constants/roles.ts`. Never redefine inline.

---

### 21-Mar-2026 — Semantic Bug Fix (2 commits, 1 file)

**Bug Fix:**
- Fixed `RequestStatusBadge` incorrectly used to render job status in request detail page (`request-detail-info.tsx`). Replaced with `JobStatusBadge` — displays correct colors/labels for job lifecycle states.

---

### 20-Mar-2026 — Consistency & Testing Hardening (11 commits, 55 files)

**Code Quality (7 fixes):**
- Error checks added to approval-actions bulk request update, job-actions delete link, entity-photos upload path
- Null safety for signed URL failures in request/asset photo getters (returns empty string instead of crash)
- Rollback logic placeholder for acceptTransfer two-step update
- PII reduction: auth callback `console.log` changed to `console.error` for sensitive data
- Empty URL guard in entity-photos route

**Role Constants:**
- Extracted `ROLES`, `GA_ROLES`, `LEAD_ROLES` to `lib/constants/roles.ts`
- Replaced 60+ inline role array checks across 36 files (actions, components, pages, API routes)
- Type-safe readonly arrays for role checking

**UI Component Adoption:**
- `DisplayId` component adopted in 10 additional locations (asset/job/request columns, transfer dialogs, schedule components)
- `CreatedAtCell` adopted for schedule `last_completed_at` column

**Testing:**
- Added optimistic locking tests (`assertNotStale` utility tests)
- Added `ActionResponse<T>` shape validation tests (116 lines covering ok/fail/type guards)
- Fixed permissions test for `assertNotStale` import
- Extracted `assertNotStale` utility to `lib/utils/optimistic-lock.ts`

**New Technical Invariant (#16):**
- Role constants: All role checks must use `ROLES.*`, `GA_ROLES`, or `LEAD_ROLES` from `lib/constants/roles.ts`. Never inline role string arrays.

---

### 18-Mar-2026 — Autonomous Audit Session (30 commits, 58 files)

**Security Hardening (6 fixes):**
- `updateUser` now validates company access before reassignment
- `createTransfer` removed hardcoded company filter (relies on RLS), uses `asset.company_id` for movement
- `deleteAssetPhotos` uses `assertCompanyAccess` instead of hardcoded filter
- Asset transfer: added concurrent transfer guard, receiver active status validation, company boundary check
- `company_settings` RLS expanded for multi-company budget threshold lookups (migration 00029)

**Type System:**
- Created `ActionResponse<T>` type system (`lib/types/action-responses.ts`) with `ActionOk<T>` and `ActionFail` discriminated union
- Added explicit return type annotations to all 81 server actions across 15 files

**UI Consistency:**
- Extracted shared `CreatedAtCell` and `DisplayId` components for consistent rendering
- Removed `any` types from `job-form.tsx` and `status-bar-chart.tsx`
- Standardized link hover colors to `hover:text-blue-700`

**Data Integrity:**
- Added optimistic locking (`updated_at` comparison) to `updateAsset`, `updateJob`, `updateRequest`
- Blocked asset status change while transfer is pending (server-side validation)
- Blocked job completion without assigned PIC

**Performance:**
- Batch N+1 sequential DB queries in request/job detail timeline processing

**Accessibility:**
- Skip-to-content link in dashboard layout
- KPI cards converted from div+onClick to semantic Link elements
- PhotoLightbox restores focus on close
- Password toggle buttons have proper aria-labels
- Form errors announced to screen readers via aria-live

**Documentation:**
- Created `docs/ga-prd-human.md` (this document) with mandatory PRD reference in CLAUDE.md
- Created `docs/db_schema.md` consolidating all 29 migrations into readable format
