# Phase 5: Jobs & Approvals - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

GA Leads create and assign jobs (from requests or standalone), GA Staff execute them through a tracked workflow, the CEO approves budget-related jobs above a configurable threshold, and completed work flows through a requester acceptance cycle with optional feedback. This phase also introduces a Company Settings page for configurable business rules.

**Key correction from requirements:** CEO approval is triggered by the **job** (where cost is determined), not the request. The job is where the GA Lead adds estimated cost and detail attachments — the request is just the user's need.

</domain>

<decisions>
## Implementation Decisions

### Job creation flow
- Full form with prefill when creating from a request (pre-fills title, description, location, category from request; Lead can edit everything before submitting)
- Standalone jobs use the same required fields as request-linked jobs: title, description, location, category
- Creating a job from a request automatically moves the request to "In Progress" status
- Jobs have a single estimated cost field (Rp) — no line item breakdown
- Jobs include a priority field: Low, Medium, High, Urgent
- Priority inherits from linked request; when multiple requests are linked, job takes the highest priority. Standalone jobs set priority manually

### Multi-request linking
- Searchable dropdown on job creation/edit form to add multiple requests to one job
- Requests already linked to other jobs are shown but marked
- No bulk-select from request list — linking only happens from the job form

### Assignment
- Single PIC (person in charge) per job — no multi-assignment
- Both PIC and GA Lead can progress the job status
- GA Lead can reassign to a different PIC anytime before completion (status does not reset)
- GA Lead can cancel a job at any status; linked requests go back to "Triaged"

### Job status workflow
- **Standard flow:** Created → Assigned → In Progress → Completed
- **With CEO approval:** Created → Assigned → Pending Approval → In Progress → Completed
- GA Lead manually moves to "Pending Approval" when the job has sufficient context and pricing detail for CEO review
- Not every job goes through approval — only those with estimated cost at or above the company's budget threshold
- CEO rejection sends job back to "Assigned" (Lead can revise cost/details and resubmit)

### Job detail page
- Full info panel at top: job ID, title, status badge, PIC name, category, location, priority, description, estimated cost, linked request(s), all dates (created, assigned, started, completed)
- Linked requests shown as compact inline previews on the job detail (title, status, requester)
- Request detail page shows linked job(s) as simple clickable links (job ID + title) — not inline previews
- Unified chronological timeline mixing status changes, comments, and system events (same pattern as request detail)

### Comments
- GA Lead + assigned PIC only can post comments (no other roles)
- Single optional photo per comment
- Comments are immutable — no editing or deleting after posting

### Job list page
- Same data table pattern as request list (columns, filters, sorting)
- Columns: ID, title, status, PIC, priority, linked request, created date

### CEO approval workflow
- Approval triggered on the **job** when estimated cost ≥ budget threshold (configurable per company)
- Dedicated approval queue page listing jobs pending approval (with pending + history tabs)
- Approve/reject action available only on the job detail page (not inline on the queue list)
- Rejection requires a reason; rejection reason visible to all involved parties as a timeline event

### Company Settings
- New "Company Settings" page under admin
- Super Admin only can configure
- First setting: budget threshold for CEO approval (Rp amount)
- Extensible for future company-level rules

### Acceptance cycle
- When job is completed, linked request(s) move to "Pending Acceptance" status
- Request list shows a badge/indicator on requests needing acceptance action
- Requester accepts or rejects from the request detail page
- Rejection requires a reason (shows in job timeline so PIC knows what to fix)
- Rejection sends job back to "In Progress" for rework — no limit on rejection cycles
- Accepted requests move to "Completed" status (final state)
- 7-day auto-accept cron: closes without feedback, timeline shows "Auto-accepted (no response within 7 days)"
- No countdown displayed on request detail — just the completion date
- Optional feedback after acceptance: 1-5 star rating + optional text comment

### Claude's Discretion
- Job form layout and field ordering
- Approval queue page column design and sorting
- Timeline event styling and icons
- Comment input component design
- Star rating component implementation
- Auto-accept cron implementation details

</decisions>

<specifics>
## Specific Ideas

- Approval is on the job level (where cost is determined), NOT the request level — this differs from REQ-APR-001's wording but matches the user's actual intent
- The Company Settings page is the first step toward a configurable rules system — start with just the budget threshold, designed to be extensible
- Job priority taking the highest from multiple linked requests is an automatic behavior, not user-selected

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-jobs-approvals*
*Context gathered: 2026-02-24*
