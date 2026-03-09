# Quick Task 23: Remove duplication of information in detail pages, save button in bottom bar, fix UI inconsistencies - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Remove duplication of information in detail pages, ensure save button exists in a sticky bottom bar, and fix UI inconsistencies across pages. Applies to: Request detail, Job detail, Template detail, Schedule detail.

</domain>

<decisions>
## Implementation Decisions

### What counts as "duplicated info"
- Remove **Created By** and **Created At** fields from core fields grids on detail pages — the header already shows "Creator · Created dd-MM-yyyy", so repeating these in the grid is redundant
- Status/priority badges in the header are NOT considered duplication — leave those alone

### Save button placement
- All detail pages must use a **sticky bottom bar** fixed to the bottom of the viewport
- Bar only appears when the form has unsaved changes (dirty state)
- Shows "Unsaved changes" text + Save button
- Disappears after successful save
- Uses `form={formId}` pattern for external submit (consistent with request detail pattern)

### Consistency reference page
- **Request detail page** is the gold standard for layout pattern
- Key patterns to match: `formId` prop, `onDirtyChange`/`onSubmittingChange` callbacks, two-column layout `grid-cols-[1fr_380px] max-lg:grid-cols-1`
- Other pages (Jobs, Templates, Schedules) should align to this pattern

</decisions>

<specifics>
## Specific Ideas

- Job detail currently has an inline save button inside `JobDetailInfo` — replace with sticky bottom bar using formId pattern
- Template detail has a form submit button inside the component — replace with sticky bottom bar
- Request detail already uses formId pattern but the sticky bottom bar needs to be added to the detail page wrapper
- Schedule detail needs to be checked for any editable state and aligned

</specifics>
