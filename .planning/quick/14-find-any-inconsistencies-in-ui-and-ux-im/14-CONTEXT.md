# Quick Task 14: Find and fix UI/UX inconsistencies across all pages - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Audit all pages in the application for UI and UX inconsistencies, then fix every issue found. Uses web-design-guidelines skill to inform the audit criteria.

</domain>

<decisions>
## Implementation Decisions

### Audit Scope
- All pages: auth (login, password reset), dashboard, requests, jobs, inventory, maintenance (templates, schedules), settings (all admin tabs), audit trail, notifications, user profile

### Fix Scope
- Identify and fix all inconsistencies in one pass — no research-only output
- Every inconsistency found should be fixed, not deferred

### Priority Focus
- All dimensions equally: spacing, interactions, typography, colors, states, feedback, loading patterns
- No single dimension prioritized over others

### Claude's Discretion
- Ordering of fixes (can batch by page or by inconsistency type)
- Severity classification for reporting purposes

</decisions>

<specifics>
## Specific Ideas

- Use web-design-guidelines skill to establish audit criteria
- Check against CLAUDE.md conventions (desktop-first, date formats, currency, max-width, validation limits)
- Cross-reference common patterns: button styles, dialog behavior, table layouts, form patterns, feedback messages, empty states, loading skeletons

</specifics>
