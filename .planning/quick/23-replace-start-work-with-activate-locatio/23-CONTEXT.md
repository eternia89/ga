# Quick Task 23: Replace Start Work with Activate Location - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Replace the "Start Work" button with an "Activate Location" button when the browser hasn't granted geolocation permission yet. This makes it mandatory for the PIC (Person In Charge) to activate their location before they can start work on a job.

</domain>

<decisions>
## Implementation Decisions

### Post-activation flow
- After PIC clicks "Activate Location" and grants browser permission, the button changes to "Start Work" — PIC clicks again to actually start. Clear two-step flow.

### Mark Complete gating
- Only gate "Start Work" behind location activation. "Mark Complete" is NOT gated — by the time PIC marks complete, they already activated location when starting work.

### Permission revoked handling
- Don't actively check if permission was revoked after initial grant. Only check on first visit. If later revoked, the existing GPS error handling in the Start Work flow will catch it.

### Claude's Discretion
- None — all areas discussed.

</decisions>

<specifics>
## Specific Ideas

- Use the browser's `navigator.permissions.query({ name: 'geolocation' })` API to check permission state
- Button text: "Activate Location" when permission not granted, "Start Work" when granted
- Only affects the PIC's action buttons on job detail page (the `canStartWork` flow)

</specifics>
