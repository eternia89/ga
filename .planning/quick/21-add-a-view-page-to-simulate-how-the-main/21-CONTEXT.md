# Quick Task 21: Add a view page to simulate how the maintenance template will look like when the schedule is due - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Add a view page to simulate how the maintenance template will look like when the schedule is due, so the user can try to fill the form as users would.

</domain>

<decisions>
## Implementation Decisions

### Page Location & Access
- Add a "Preview Form" button on the schedule detail page
- Uses that schedule's template + asset context to populate the preview
- No standalone route or template-level access needed

### Form Interactivity
- Fully interactive inputs: fill text, toggle pass/fail, enter numbers, select dropdowns, upload photos
- No submit/save button — purely for testing the UX and seeing what users will experience
- Values entered are ephemeral (not persisted anywhere)

### Data Context
- Use real schedule data: actual asset name, template name, due date, assigned user from the selected schedule
- Renders the template's checklist items with real context so the GA Lead can evaluate the form experience

### Claude's Discretion
- None — all areas discussed

</decisions>

<specifics>
## Specific Ideas

- Entry point: "Preview Form" button on schedule detail page (`/maintenance/schedules/[id]`)
- Preview should render as a new page or modal showing the form as a technician would see it when the schedule is due
- All 6 checklist item types must be rendered with appropriate input controls (checkbox, pass/fail toggle, numeric input with unit, text input, photo upload area, dropdown select)
- Header should show asset name, template name, due date, and assigned user
- No save/submit action — form is for preview purposes only

</specifics>
