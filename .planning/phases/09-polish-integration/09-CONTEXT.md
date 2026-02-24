# Phase 9: Polish & Integration - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

All remaining cross-cutting quality requirements: GPS accountability on job status changes, audit trail visibility for admins, loading skeletons for all data pages, mobile responsiveness for field workers, breadcrumb navigation, and overall UI consistency. No dark mode (REQ-UI-003 dropped as "Could" priority).

</domain>

<decisions>
## Implementation Decisions

### GPS capture behavior
- GPS permission requested on first job status change (browser remembers choice)
- If GPS is denied or unavailable, block the status change — user cannot proceed without granting permission
- GPS captured for all users on all job status changes (not just GA Staff)
- GPS displayed on job detail timeline as a clickable Google Maps link (opens to captured coordinates)

### Audit trail viewer
- Filterable data table format (like request/job list pages)
- Columns: timestamp, user, action, entity type, entity ID
- Filters: by user, action type, entity type, date range
- Summary-level detail only — no field-level change diffs
- Entity ID is a clickable link navigating to the affected entity's detail page
- Accessible to Admin and GA Lead roles

### Mobile field experience
- Primary mobile use case: update job status + upload photos (core field workflow)
- Responsive desktop layout adapted with max-* breakpoints (no separate mobile layout)
- Sidebar collapses to hamburger menu on mobile
- Photo upload on mobile uses native camera capture directly (not file picker)
- Tables remain as horizontally scrollable tables on mobile (no card stacking)
- Form dialogs become full-screen sheets on mobile instead of centered modals
- All pages responsive, including admin/settings pages

### Loading skeletons
- Skeletons on all list pages and all detail pages (every page that fetches data)
- Each page has a custom skeleton matching its exact final layout (not generic patterns)
- Dashboard, request list, job list, asset list, all detail pages — all get custom skeletons

### Breadcrumb navigation
- Full path breadcrumbs on all interior pages (e.g., Dashboard > Requests > REQ-2026-0042)
- Detail pages use the entity's display ID (not title) in the breadcrumb

### UI consistency pass
- Full audit across all pages from all phases (1-8), not just Phase 9 pages
- Fix inconsistencies in spacing, typography, colors, button styles
- Standardize error states: consistent error pages (404, 500, permission denied) and inline error patterns
- Empty states use text + icon only (no custom illustrations) — icon with short message and CTA button if applicable
- No dark mode — light mode only

### Claude's Discretion
- Specific skeleton component designs per page
- GPS timeout duration and retry behavior
- Audit trail pagination and default sort
- Exact breakpoints for mobile adaptations
- Error page layout and copy
- Which consistency issues to prioritize

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-polish-integration*
*Context gathered: 2026-02-24*
