# Quick Task 26: Move PM checklist preview from schedules to templates - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Move the PM checklist form preview from maintenance schedules to maintenance templates. The preview should exist where the template is created/edited, not in schedules. Remove the preview from schedules entirely.

</domain>

<decisions>
## Implementation Decisions

### Preview content
- Show checklist items with interactive controls, plus placeholder text for schedule-specific fields (e.g., "Asset Name", "Due Date", "Assigned User"). Gives a realistic preview of what PIC will see when filling out the form.

### Schedule preview removal
- Remove the "Preview Form" button from schedules entirely. Delete the schedule preview page route (/maintenance/schedules/[id]/preview). Preview only lives on templates now.

### Preview location
- Open preview in a large modal/dialog on the template detail page. No separate page route — no navigation needed.

### Claude's Discretion
- None — all areas discussed.

</decisions>

<specifics>
## Specific Ideas

- Reuse/adapt the existing `PMChecklistPreview` component with placeholder props
- Add "Preview Form" button to template detail page (and optionally template create form)
- Remove: schedule detail "Preview Form" button, `/maintenance/schedules/[id]/preview/page.tsx`
- Modal should be large enough to show the full checklist comfortably

</specifics>
