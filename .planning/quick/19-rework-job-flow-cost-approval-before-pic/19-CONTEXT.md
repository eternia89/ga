# Quick Task 19: Rework job flow — cost approval before start work - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Task Boundary

Rework the job lifecycle so that estimated cost approval happens BEFORE work starts. Job creation removes PIC and cost fields. The bottom bar drives the workflow through stages.

**New lifecycle:**
1. Create job (title, desc, location, category, priority, linked requests) — NO PIC, NO cost → status: created
2. GA Lead assigns PIC via bottom bar → status: assigned
3. PIC fills cost + clicks "Request Approval" in bottom bar → status: pending_approval (or auto-approved if cost = 0)
4. Finance approves → status: assigned (with approved_at set) — NOT in_progress
5. PIC clicks "Start Work" (only visible after cost approved) → status: in_progress
6. Rest of flow unchanged (mark complete, completion approval, etc.)

</domain>

<decisions>
## Implementation Decisions

### Cost = 0 behavior
- Same "Request Approval" button, auto-approves instantly
- Server sets approved_at without going to pending_approval status
- Modal refreshes showing "Start Work" button

### Bottom bar layout per status
- Status = created (GA Lead/Admin): `[PIC Combobox] [Assign]` on left, `[Cancel]` on right
- Status = assigned, NOT approved (PIC): `[Rp ____] [Request Approval]` on left, `[Cancel]` on right
- Status = assigned, approved (PIC): `[Start Work]` on left, `[Cancel]` on right
- Status = pending_approval (Finance): `[Approve Budget]` on left, `[Reject Budget] [Cancel]` on right
- Status = in_progress: existing buttons (Mark Complete, etc.)

### Who fills cost
- PIC fills the cost — they are responsible for the job's budget
- GA Lead/Admin created the job and assigned PIC, but PIC owns the cost estimate

### Approval routing after finance approves
- approveJob should transition from pending_approval → assigned (NOT in_progress as before)
- This allows PIC to then click "Start Work" as a separate deliberate action

### Job creation form
- Remove assigned_to (PIC) field from create form
- Remove estimated_cost field from create form
- Keep these fields visible (read-only) in view/edit mode when they have values

### PIC assignment
- When status = created, bottom bar shows PIC Combobox + Assign button
- Uses existing assignJob action (already transitions created → assigned)
- PIC field in the form body shows as read-only display (not editable via form)

### Start Work gate
- canStartWork now requires: isPIC && status === 'assigned' && job has approved_at (or cost was 0 and auto-approved)

</decisions>

<specifics>
## Specific Ideas

Key files to modify:
- components/jobs/job-form.tsx — hide PIC + cost fields in create mode
- components/jobs/job-modal.tsx — rework bottom bar with status-dependent actions, add cost input + PIC combobox to bar
- app/actions/job-actions.ts — remove assigned_to/estimated_cost from createJob, add requestApproval action (or repurpose submitForApproval)
- app/actions/approval-actions.ts — change approveJob to transition to 'assigned' not 'in_progress'; add auto-approve logic for cost = 0
- lib/validations/job-schema.ts — update create schema (remove optional PIC/cost)

Note: rejectJob currently sends status → in_progress. In new flow it should send → assigned (so PIC can re-enter cost).

</specifics>
