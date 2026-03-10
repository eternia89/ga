# Quick Task 24: Make category optional in maintenance templates - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Make category_id optional in maintenance templates. When no category is selected, the template is "general" — not tied to any specific asset category. This affects the Zod schema, create/edit forms, server actions (category validation), and schedule-template matching logic.

</domain>

<decisions>
## Implementation Decisions

### Schedule matching
- A general (no category) template can be paired with ANY asset regardless of category. When a general template is selected in the schedule form, no category filter is applied to the asset list. The existing `template.category_id !== asset.category_id` check must skip when template has no category.

### UI display
- Show dash or empty where category would normally appear. No special "General" badge or label. Minimal approach.

### Claude's Discretion
- None — all areas discussed.

</decisions>

<specifics>
## Specific Ideas

- Zod schema: change `category_id` from required UUID to `.optional().nullable()`
- Server action: skip asset-type category validation when category_id is null
- Schedule form: when template has no category_id, show all assets (no category filter)
- Template list/detail: show "—" where category would appear when null

</specifics>
