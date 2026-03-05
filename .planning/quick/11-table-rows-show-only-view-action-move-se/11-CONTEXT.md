# Quick Task 11: Table rows show only View action, move secondary actions into modal sticky bar - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Task Boundary

Table list rows should display only 1 action: "View" (opens the detail modal). All secondary/lifecycle actions move into the modal's sticky bottom bar. This applies to all 5 entity tables (Requests, Assets, Jobs, Templates, Schedules).

</domain>

<decisions>
## Implementation Decisions

### Job Cancel Button
- Move Cancel to modal-only — already exists in job modal sticky bar
- Remove Cancel button from job-columns.tsx table row actions

### Template/Schedule Lifecycle Actions
- Move all to modal-only — remove Deactivate/Reactivate from template-columns.tsx, remove Pause/Resume/Deactivate from schedule-columns.tsx
- Fix: Add missing Deactivate button to schedule-view-modal.tsx sticky bar

### Asset Sticky Bar
- Add status change and transfer action buttons to asset modal sticky bar
- Currently info-only — needs action buttons for consistency with other modals

### Already Correct
- Request table already shows only View (no secondary actions in table row)

</decisions>

<specifics>
## Specific Ideas

- After changes, ALL 5 table action columns render only the View button
- All secondary actions must exist in their respective modal sticky bars before removing from table
- Schedule modal needs Deactivate added (currently missing)
- Asset modal needs status change + transfer buttons added to sticky bar

</specifics>
