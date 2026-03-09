# Quick Task 17: Restrict Start Work to PIC only - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Start Work should only be triggerable by the PIC (Person in Charge) — no other parties can start work without the PIC knowing.

</domain>

<decisions>
## Implementation Decisions

### Mark Complete behavior
- Keep current behavior: GA Lead/Admin can still mark complete
- Only restrict Start Work to PIC only

### Server-side enforcement
- Both UI + server: hide the button AND add server-side check in updateJobStatus
- Defense in depth — prevents API bypass

### Both pages
- Update both job-modal.tsx AND job-detail-actions.tsx
- canStartWork changes from `(isGaLeadOrAdmin || isPIC)` to `isPIC` only

</decisions>

<specifics>
## Specific Ideas

Files to modify:
- components/jobs/job-modal.tsx — line 576: `canStartWork = isPIC && job?.status === 'assigned'`
- components/jobs/job-detail-actions.tsx — line 85: `canStartWork = isPIC && job.status === 'assigned'`
- app/actions/job-actions.ts — updateJobStatus: add PIC check when status is 'in_progress'

</specifics>
