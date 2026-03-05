# Quick Task 10: Unify table row view links to modal pattern across all pages - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Task Boundary

Audit and ensure consistency of the modal view pattern across all table/list pages. Every table that shows entity rows should have a single "View" link that opens a modal with permalink support, sticky action bar, and dirty state tracking. Previously implemented in request pages, now needs to be verified across all pages.

</domain>

<decisions>
## Implementation Decisions

### Admin Entities Scope
- Admin pages (Users, Companies, Divisions, Locations, Categories) keep their existing FormDialog pattern
- These entities are too simple for a full view modal — no changes needed
- Audit Trail is view-only, no detail view needed

### Cross-Entity Links
- Cross-links (job → request, schedule → asset) keep as navigation links
- These are intentional context switches, not primary row actions

### Sticky Bar Actions
- Keep per-entity actions in sticky bars (e.g. Approve/Reject for requests, Transfer for assets)
- Ensure Save Changes + Cancel are consistent across all modals that support editing
- Save Changes button should be active only when there are dirty changes

### Claude's Discretion
- Specific consistency checks (button ordering, styling, dirty state implementation) across the 5 existing modal pages

</decisions>

<specifics>
## Specific Ideas

- The 5 pages with modal view pattern: Requests, Assets/Inventory, Jobs, Maintenance Templates, Maintenance Schedules
- Verify each has: View link in table, modal with permalink, sticky bar, dirty state tracking where applicable
- Ensure "View" is the only action link in the table row (simplify, consistency)
- Report any missing implementations or inconsistencies

</specifics>
