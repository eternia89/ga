# Quick Task 16: Standardize all modal widths - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

All modals in request, job, assets, schedules, templates should follow this convention:
- Form column: 600px width
- Timeline/sidebar column: 400px width
- Total with both columns: 1000px

</domain>

<decisions>
## Implementation Decisions

### Which modals to change
- All 5 view modals with form+timeline split: Job, Request, Asset, Schedule, Template
- Change from current 800px (grid-cols-[1fr_350px]) to 1000px (grid-cols-[600px_400px])

### Create modal width
- Standardize all create modals to 600px (matches form column width from view modals)
- Affected: Job create (was 700px), Asset create (was 700px), Template create (was 700px)
- Already correct: Request create (600px), Schedule create (600px)

### Approval queue
- Excluded from scope — no separate approval modal, uses job modal which is already being updated

</decisions>

<specifics>
## Specific Ideas

Files to modify:
- components/jobs/job-modal.tsx — view: 800px→1000px, grid 1fr_350px→600px_400px; create: 700px→600px
- components/requests/request-view-modal.tsx — 800px→1000px, grid 1fr_350px→600px_400px
- components/assets/asset-view-modal.tsx — 800px→1000px, grid 1fr_350px→600px_400px
- components/assets/asset-create-dialog.tsx — 700px→600px
- components/maintenance/schedule-view-modal.tsx — 800px→1000px, grid 1fr_350px→600px_400px
- components/maintenance/template-view-modal.tsx — 800px→1000px, grid 1fr_350px→600px_400px
- components/maintenance/template-create-dialog.tsx — 700px→600px

</specifics>
