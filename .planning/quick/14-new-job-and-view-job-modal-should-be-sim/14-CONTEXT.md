# Quick Task 14: Unified Job Create/View Modal - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

New job and view job modal should be similar in UI, hence use same component if possible. The difference is, after creation, the modal will have timeline on the right side, and sticky action on the bottom side.

</domain>

<decisions>
## Implementation Decisions

### Post-create transition
- Modal closes after creation. No morphing to view mode. User clicks the new job in the table to open the view modal.

### Edit layout in view mode
- Unify into one form: both create and view modes use the same form layout (JobForm). View mode pre-fills with existing data. This means JobDetailInfo's compact grid layout is replaced by the standard form layout in the view modal.

### Modal sizing
- Adaptive width: 700px for create mode (form only), 800px for view mode (split layout with timeline on the right).

### Claude's Discretion
- Component architecture: how to structure the shared modal shell (single component with mode prop vs. wrapper)
- How to handle the JobForm in edit mode (adding update capability to the existing create-only form)

</decisions>

<specifics>
## Specific Ideas

- Current `JobCreateDialog` wraps `JobForm` in a 700px dialog
- Current `JobViewModal` is a 1083-line component with data fetching, split layout (JobDetailInfo left, JobTimeline right), sticky action bar, and sub-dialogs
- The unified component should share the modal shell, header area, and use JobForm for both create and edit
- View mode adds: timeline panel on right, sticky action bar on bottom, prev/next navigation
- JobForm currently only supports create mode; needs to be extended with edit/update support

</specifics>
