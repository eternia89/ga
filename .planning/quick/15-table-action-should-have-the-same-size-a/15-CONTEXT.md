# Quick Task 15: Table action column blue link styling - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Table action buttons (View/Edit) should match the font size of other table cells and use blue color to indicate they're clickable links that open modals.

</domain>

<decisions>
## Implementation Decisions

### Blue Color
- Use `text-blue-600` with underline on hover (`hover:underline`)
- Classic link affordance: blue text that underlines when hovered

### Which Tables
- All 11 tables with action columns:
  - Operational: requests, jobs, assets, templates, schedules
  - Admin: companies, divisions, locations, categories, users
  - Audit trail (if it has actions)

### Action Rendering
- Keep Button component with `variant="ghost"` but override text color to blue
- Still has hover background, familiar pattern
- Must match font size of other table cells (same `text-sm` as cell content)

</decisions>

<specifics>
## Specific Ideas

- Current pattern: `Button variant="ghost" size="sm" className="h-7 px-2 text-xs"` — text-xs is smaller than table cells which use text-sm
- Target: same Button but with `text-blue-600 hover:underline` and matching cell font size
- Apply consistently across all 11 column files

</specifics>
