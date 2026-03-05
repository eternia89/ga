# Quick Task 9: Implement modal view pattern on all table list pages - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Task Boundary

Apply the RequestViewModal pattern to all pages that have table list views with detail pages. The modal replaces the current detail page pattern — all detail page functionality moves into the modal opened from the list page.

**Target pages:**
1. **Jobs** (`/jobs`) — currently navigates to `/jobs/[id]`
2. **Inventory/Assets** (`/inventory`) — currently navigates to `/inventory/[id]`
3. **Maintenance Templates** (`/maintenance/templates`) — currently navigates to `/maintenance/templates/[id]`
4. **Maintenance Schedules** (`/maintenance/schedules`) — currently navigates to `/maintenance/schedules/[id]`

**NOT in scope:**
- Admin settings tables (Companies, Divisions, Locations, Categories, Users) — already use form dialogs
- Audit Trail — read-only display, no detail view
- Approvals — specialized queue workflow
- Notifications — display/dismissal workflow
- Requests — already has RequestViewModal (the reference implementation)

</domain>

<decisions>
## Implementation Decisions

### Scope
- All pages with table list views that currently navigate to a separate detail page
- 4 entities: Jobs, Assets, Templates, Schedules

### Edit Mode
- Full detail page functionality inside the modal — replaces current detail pages
- All inline editing, status changes, comments, actions available in the modal
- Detail pages replaced by modal — clicking "View" opens modal from list page

### Layout
- Same layout for all entities: split view (details left, timeline right), 800px wide
- Consistent with the RequestViewModal pattern already implemented for Requests
- Sticky action bar at bottom with entity-specific actions

### Claude's Discretion
- Whether to create a shared/reusable base modal component or entity-specific modals
- How to handle entity-specific features (e.g., job comments, asset transfers, template checklists) within the consistent layout
- Whether existing detail page routes should redirect to list page with ?view= param or be removed entirely

</decisions>

<specifics>
## Specific Ideas

- Reference implementation: `components/requests/request-view-modal.tsx`
- URL sync pattern: `?view=entityId` for permalink support (same as requests)
- Prev/next navigation arrows in modal header (same as requests)
- 800px modal width, max-h-[90vh], full-screen on mobile (max-md:)

</specifics>
