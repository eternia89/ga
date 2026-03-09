# Quick Task 22: Add permalink support to all 5 create modals - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Add URL-based permalink support to the 5 create modals (request, job, asset, template, schedule) so they auto-open on page load when `?action=create` is present in the URL.

</domain>

<decisions>
## Implementation Decisions

### URL Parameter
- Use `?action=create` as the trigger param (more extensible for future actions like ?action=triage)
- Param stays in URL after modal opens (consistent with existing ?view={id} pattern)
- Combine with existing view param: searchParams type becomes `{ view?: string; action?: string }`

### Permission Gating
- If user lacks create permission, silently ignore the param — modal doesn't open, no error shown
- Same behavior as if the CTA button is hidden for that role

### Pattern
- Follow the existing initialViewId pattern: server page reads searchParam, passes as prop to client component
- Client component checks `action === 'create'` and auto-opens dialog on mount
- Each page's CTA button already has permission checks — reuse the same permission logic

</decisions>

<specifics>
## Specific Ideas

- 5 pages to update: /requests, /jobs, /inventory, /maintenance/templates, /maintenance (schedules)
- Each page.tsx already destructures searchParams — just add `action` to the type
- The create dialog components already accept `open` and `onOpenChange` props
- No new components needed — just wiring searchParam to initial dialog state

</specifics>
