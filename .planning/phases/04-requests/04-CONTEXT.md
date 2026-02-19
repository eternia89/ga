# Phase 4: Requests - Context

**Gathered:** 13-02-2026
**Status:** Ready for planning

<domain>
## Phase Boundary

General Users submit maintenance requests with minimal friction, GA Leads triage and manage them, and everyone with access can track request status. This phase delivers the request lifecycle from submission through triage to tracking. Jobs, approvals, cost estimation, and comments are Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Request Form & Submission
- **Form page:** Full page at `/requests/new` (not modal) — URL will be shared, often opened on mobile, should feel like a proper form
- **Fields:** Description (required, textarea) + Location (required, dropdown from admin-configured locations) — minimal form
- **No user-facing title:** Title is auto-generated from description on insert (DB trigger or server action). Used as short label in tables.
- **No category/priority on form:** Category, priority, PIC assigned by GA Lead during triage
- **Photos:** Basic upload, up to 3 images. Store originals in Supabase Storage. Phase 8 adds compression/annotation/gallery later.
- **Post-submit:** Redirect to request list page (not detail page)
- **Access:** "New Request" button on the request list toolbar

### Request ID Format
- **Format:** `[COMPANYCODE]-[YY]-[XXXX]` (e.g., `ABC-26-0001`)
- **Scope:** Per-company sequential numbering
- **Year:** 2-digit year from creation date
- **Sequence:** 4-digit zero-padded, resets per company per year

### Status Workflow
- **Statuses:** New → Triaged → In Progress → Completed → Accepted / Rejected
- **Additional terminal states:** Cancelled (by requester), Rejected (by GA Lead at triage)
- **Cancellation:** Requester can cancel only while status is New. After triage, cannot cancel.
- **Rejection:** GA Lead can reject during triage. Reason is required. Rejected is final (no re-open).
- **In Progress:** NOT settable in Phase 4. Set automatically by Phase 5 when a job is created.
- **Completed/Accepted/Rejected (post-completion):** Built in Phase 5 with jobs and acceptance workflow.
- **Cost estimation:** Deferred to Phase 5 (approval workflow)

### Triage Workflow
- **Triage fields:** Category (from request categories), Priority (Low/Medium/High/Urgent), PIC (any active user in company)
- **All three required** to move from New → Triaged
- **Triage UI — from list:** Modal dialog (consistent with admin edit modals). Shows request description, location, all photo thumbnails (read-only) at top, triage fields below.
- **Triage UI — from detail:** Editable inline on the detail page (category/priority/PIC shown as editable fields for GA Lead)
- **Photo thumbnails in triage modal:** All shown at once, clickable to open fullscreen lightbox (100vw/vh, zoomable with native pinch behavior)
- **Reject action:** Available on both list (via modal) and detail page. Requires reason text.

### Request List & Filters
- **Component:** Reuse existing DataTable pattern (consistent with Settings/Users pages)
- **Default view by role:** General User sees own requests only. GA Staff/Lead/Admin see all company requests.
- **Columns:** ID, Title, Location, Status, Priority, Category, PIC, Created
- **Default sort:** Newest first (created_at descending)
- **Filters:** Status, Priority, Category, Date range
- **Quick filter:** "My Assigned" toggle for users who are PIC on requests
- **Search scope:** Title + description + request ID
- **Row click:** Navigates to request detail page (`/requests/[id]`)
- **Create button:** "New Request" in toolbar

### Request Detail Page
- **Layout:** Two columns — info left, timeline right. Stacks vertically on mobile.
- **Breadcrumb:** `Requests > ABC-26-0001` at top
- **Requester info:** Prominently displayed at top — name, division, submission date
- **Left column:** Description, location, photos (inline thumbnails, clickable for fullscreen lightbox), triage fields (editable for GA Lead, read-only for others)
- **Right column:** Timeline showing status changes (who + when), triage assignments (old → new values), rejection/cancellation reasons
- **Action buttons:** Prominent, context-sensitive based on status and role (e.g., "Triage" for GA Lead on New request, "Cancel" for requester on New request, "Reject" for GA Lead)
- **Edit:** Requester can edit description/location/photos while status is New. Locked after Triaged.

### Claude's Discretion
- Auto-generated title implementation (DB trigger vs server action, truncation length)
- Photo upload component implementation details (file input styling, preview before submit)
- Timeline component design (vertical timeline, icons per event type)
- Exact responsive breakpoint for two-column → stacked layout
- Status badge colors for each status
- Priority badge colors (likely: Low=gray, Medium=blue, High=orange, Urgent=red)
- Empty state design for request list
- Lightbox implementation approach

</decisions>

<specifics>
## Specific Ideas

- Request form should feel like a Google Form — simple, focused, works well when shared as a URL on mobile
- Photo thumbnails in triage modal and detail page must all show at once (not carousel), clickable to fullscreen with native pinch-to-zoom
- Fullscreen lightbox: 100vw x 100vh, dark background, zoomable
- Triage modal pattern: same dialog style as admin entity edit modals (Phase 3)
- DataTable pattern reused from Phase 3 for the request list

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-requests*
*Context gathered: 13-02-2026*
