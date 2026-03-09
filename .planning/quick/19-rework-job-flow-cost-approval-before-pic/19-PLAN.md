---
phase: quick-19
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/validations/job-schema.ts
  - app/actions/job-actions.ts
  - app/actions/approval-actions.ts
  - components/jobs/job-form.tsx
  - components/jobs/job-modal.tsx
  - components/jobs/job-detail-actions.tsx
autonomous: true
requirements: [QUICK-19]

must_haves:
  truths:
    - "Job creation form has NO PIC and NO estimated cost fields"
    - "GA Lead sees PIC Combobox + Assign button in bottom bar when status = created"
    - "PIC sees cost input + Request Approval button in bottom bar when status = assigned and NOT approved"
    - "PIC sees Start Work button only when status = assigned AND approved_at is set"
    - "Finance approval transitions job to assigned (not in_progress)"
    - "Finance rejection transitions job to assigned (not in_progress)"
    - "Cost = 0 auto-approves instantly without going to pending_approval"
  artifacts:
    - path: "lib/validations/job-schema.ts"
      provides: "createJobSchema without assigned_to and estimated_cost"
    - path: "app/actions/job-actions.ts"
      provides: "createJob without PIC/cost, new requestApproval action, canStartWork gate with approved_at"
    - path: "app/actions/approval-actions.ts"
      provides: "approveJob -> assigned, rejectJob -> assigned"
    - path: "components/jobs/job-modal.tsx"
      provides: "Status-dependent bottom bar with PIC assign, cost input, request approval sections"
    - path: "components/jobs/job-form.tsx"
      provides: "PIC and cost fields hidden in create mode"
    - path: "components/jobs/job-detail-actions.tsx"
      provides: "Updated canStartWork with approved_at gate, PIC assign and cost request sections"
  key_links:
    - from: "components/jobs/job-modal.tsx"
      to: "app/actions/job-actions.ts"
      via: "requestApproval action call from bottom bar"
      pattern: "requestApproval"
    - from: "app/actions/approval-actions.ts"
      to: "jobs table"
      via: "approveJob sets status to assigned + approved_at"
      pattern: "status.*assigned.*approved_at"
    - from: "components/jobs/job-modal.tsx"
      to: "canStartWork"
      via: "approved_at gate check"
      pattern: "approved_at"
---

<objective>
Rework the job lifecycle so cost approval happens BEFORE work starts. The new flow is: Create (no PIC/cost) -> Assign PIC (bottom bar) -> PIC enters cost + Request Approval -> Finance approves -> PIC clicks Start Work.

Purpose: Ensure budget is approved before any work begins, and PIC (not GA Lead) owns the cost estimate.
Output: Updated server actions, schemas, modal bottom bar, and form with new workflow.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/quick/19-rework-job-flow-cost-approval-before-pic/19-CONTEXT.md

Key files:
@lib/validations/job-schema.ts
@app/actions/job-actions.ts
@app/actions/approval-actions.ts
@components/jobs/job-form.tsx
@components/jobs/job-modal.tsx
@components/jobs/job-detail-actions.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update server actions and schema for new job flow</name>
  <files>lib/validations/job-schema.ts, app/actions/job-actions.ts, app/actions/approval-actions.ts</files>
  <action>
**job-schema.ts:**
- Remove `assigned_to` and `estimated_cost` from `createJobSchema` (keep them in `updateJobSchema` for edit mode)

**job-actions.ts — createJob:**
- Remove `assigned_to` and `estimated_cost` from the insert object (lines 60-61). They are no longer in the schema.
- Remove the auto-transition to 'assigned' block (lines 101-107). Jobs always start as 'created'.

**job-actions.ts — updateJob:**
- Remove `assigned_to` handling from fieldsToUpdate (line 211). PIC assignment must go through `assignJob` action only.
- Remove `estimated_cost` handling from fieldsToUpdate (line 212). Cost must go through new `requestApproval` action only.
- Remove the auto-transition to 'assigned' when assigning PIC (lines 214-217). Not needed since updateJob no longer sets assigned_to.
- Remove the auto-transition to 'pending_approval' when cost changes on in_progress job (lines 219-235). Cost changes go through requestApproval now.
- Remove the PIC notification block (lines 248-265) since updateJob no longer assigns PIC.
- Remove the pending_approval notification block (lines 268-294) since that flow is gone from updateJob.

**job-actions.ts — updateJobStatus:**
- Update `canStartWork` logic: when `parsedInput.status === 'in_progress'`, fetch job's `approved_at` field. If `approved_at` is null/undefined, throw error: "Cannot start work — budget approval is required first". This replaces the old auto-routing to pending_approval (lines 423-426).
- Remove the auto-routing block (lines 422-426) that redirects `in_progress` to `pending_approval` when `estimated_cost > 0`. Instead, the gate is: `approved_at` must be set (or estimated_cost is null/0, meaning no cost entered yet — but per new flow, PIC must always go through requestApproval first, so if status is assigned and approved_at is null, start work is blocked).
- Update the select query (line 382) to include `approved_at`.
- Remove `approval_submitted_at` and `started_at` setting when actualStatus was pending_approval (lines 451-453).

**job-actions.ts — new `requestApproval` action:**
- Create new server action `requestApproval` with schema: `{ job_id: z.string().uuid(), estimated_cost: z.number().min(0, 'Cost cannot be negative') }`
- Fetch job, verify caller is PIC (`job.assigned_to === profile.id`), verify status is 'assigned'.
- If `estimated_cost === 0`: auto-approve — set `estimated_cost = 0`, `approved_at = now`, keep `status = 'assigned'`. Return success with message indicating auto-approved.
- If `estimated_cost > 0`: set `estimated_cost`, `status = 'pending_approval'`, `approval_submitted_at = now`. Clear any prior rejection data (`approval_rejected_at = null`, `approval_rejected_by = null`, `approval_rejection_reason = null`).
- Record job_status_change if status changed.
- Send notification to finance approvers if status changed to pending_approval.
- Revalidate `/jobs`, `/jobs/${id}`, `/approvals`.

**job-actions.ts — updateJobBudget:**
- This action is now largely superseded by `requestApproval`. Leave it in place but update its status check: change `job.status !== 'in_progress'` to `job.status !== 'assigned'` so it can still be used as a fallback path if needed. OR simply leave it as-is since the new flow uses requestApproval instead. Keep it for backward compat — no changes needed if requestApproval handles the new flow.

**approval-actions.ts — approveJob:**
- Change the update from `status: 'in_progress'` to `status: 'assigned'` (line 133). Keep setting `approved_at` and `approved_by`.
- Update notification body from "work can proceed" to "Budget approved — PIC can now start work"

**approval-actions.ts — rejectJob:**
- Change the update from `status: 'in_progress'` to `status: 'assigned'` (line 202). This lets PIC re-enter cost and re-request approval.
- Update success feedback text references from "In Progress" to "Assigned"
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -50</automated>
  </verify>
  <done>
- createJobSchema has no assigned_to or estimated_cost fields
- createJob inserts with status 'created', no PIC/cost
- requestApproval action exists: PIC-only, sets cost, auto-approves if 0, routes to pending_approval if > 0
- approveJob transitions pending_approval -> assigned (not in_progress)
- rejectJob transitions pending_approval -> assigned (not in_progress)
- updateJobStatus blocks start work if approved_at is not set
- TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Update UI — form fields and bottom bar workflow actions</name>
  <files>components/jobs/job-form.tsx, components/jobs/job-modal.tsx, components/jobs/job-detail-actions.tsx</files>
  <action>
**job-form.tsx:**
- Hide the PIC field (`assigned_to`) and Estimated Cost field (`estimated_cost`) when `mode === 'create'`. Wrap both FormField blocks in `{mode === 'edit' && (...)}` conditionals.
- In edit/view mode (readOnly), these fields remain visible as read-only display showing the current values.

**job-modal.tsx — permission flags (around line 577):**
- Update `canStartWork`: change from `isPIC && job?.status === 'assigned'` to `isPIC && job?.status === 'assigned' && !!job?.approved_at`. This is the approved_at gate.
- Add new permission flag: `const canAssignPIC = isGaLeadOrAdmin && job?.status === 'created'`
- Add new permission flag: `const canRequestApproval = isPIC && job?.status === 'assigned' && !job?.approved_at`

**job-modal.tsx — state for new bottom bar controls:**
- Add state: `const [assignPicValue, setAssignPicValue] = useState<string>('')` for PIC combobox
- Add state: `const [costValue, setCostValue] = useState<string>('')` for cost input
- Import `requestApproval` from `@/app/actions/job-actions` and `assignJob` from same file
- Import `Combobox` from `@/components/combobox`
- Import `formatNumber` from `@/lib/utils`

**job-modal.tsx — new action handlers:**
- `handleAssignPIC`: calls `assignJob({ id: job.id, assigned_to: assignPicValue })`, shows feedback, calls handleActionSuccess.
- `handleRequestApproval`: parses costValue to number (strip dots/commas, parseInt), calls `requestApproval({ job_id: job.id, estimated_cost: parsedCost })`, shows feedback, calls handleActionSuccess.

**job-modal.tsx — bottom bar (lines 1004-1083):**
- Add before the existing `canStartWork` button block, in the left actions div:

  1. `{canAssignPIC && (...)}` — render a PIC Combobox (using the `users` data from fetched reference data — need to fetch users list in view mode). Use Combobox with userOptions built from fetched users. Render `[Combobox] [Assign button]` inline. Assign button disabled if no PIC selected or submitting.

  2. `{canRequestApproval && (...)}` — render cost input with Rp prefix (same pattern as job-form.tsx estimated_cost field: `<span>Rp</span><Input type="text" inputMode="numeric" .../>`) and a "Request Approval" button. Button disabled if submitting. On click calls handleRequestApproval.

- For the PIC combobox data: the modal already fetches reference data in view mode (check the `fetchJob` function). Add a `users` fetch alongside existing location/category fetches: query `user_profiles` for `id, full_name` where `company_id` matches and `deleted_at` is null and role in `['ga_staff', 'ga_lead', 'admin']`. Store in component state as `users`.

**job-modal.tsx — fetch users in view mode:**
- In the existing `fetchJob` useCallback (around the data fetching block), add a query to fetch users for the PIC combobox. The modal already fetches locations, categories, etc. Add:
  ```
  const { data: usersData } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .eq('company_id', jobData.company_id)
    .is('deleted_at', null)
    .in('role', ['ga_staff', 'ga_lead', 'admin']);
  ```
  Store in state variable `users`.

**job-detail-actions.tsx — same permission changes:**
- Update `canStartWork`: add `&& !!job.approved_at` to the condition (line 85).
- Add `canAssignPIC` and `canRequestApproval` flags matching modal logic.
- Add PIC combobox + Assign button section in the left actions area (same pattern as modal).
- Add cost input + Request Approval button section (same pattern as modal).
- Need to accept `users` prop (array of `{ id: string; full_name: string }`) from parent. The parent page (`jobs/[id]/page.tsx`) must pass users. Check if the detail page already fetches users — if not, add fetch there and pass down.
- Import `assignJob`, `requestApproval` from job-actions, `Combobox` from combobox, `formatNumber` from utils, `Input` from ui/input.
- Add same state vars (assignPicValue, costValue) and handlers (handleAssignPIC, handleRequestApproval).

**job-detail-actions.tsx — rejection feedback text:**
- Update the reject budget feedback message from "Returned to In Progress" to "Returned to Assigned" (line 173).

**Important UI details (per CONTEXT.md locked decisions):**
- Status = created (GA Lead/Admin): `[PIC Combobox] [Assign]` on left, `[Cancel]` on right
- Status = assigned, NOT approved (PIC): `[Rp ____] [Request Approval]` on left, `[Cancel]` on right
- Status = assigned, approved (PIC): `[Start Work]` on left, `[Cancel]` on right
- Status = pending_approval (Finance): `[Approve Budget]` on left, `[Reject Budget] [Cancel]` on right
- Status = in_progress: existing buttons (Mark Complete, etc.)
- Use Combobox component (not Select) per CLAUDE.md convention for large option lists
- Currency input uses type=text + inputMode=numeric with Rp prefix, formatNumber for display
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -50 && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
- Job create form shows NO PIC or cost fields
- Job view modal bottom bar shows PIC Combobox + Assign when status=created and user is GA Lead/Admin
- Job view modal bottom bar shows cost input + Request Approval when status=assigned, user is PIC, and not yet approved
- Job view modal bottom bar shows Start Work only when status=assigned AND approved_at is set AND user is PIC
- Job detail page bottom bar has same behavior as modal
- approveJob/rejectJob feedback messages reference "Assigned" not "In Progress"
- Build succeeds without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — no TypeScript errors
2. `npm run build` — production build succeeds
3. Manual flow test:
   - Create job -> form has NO PIC or cost fields -> status = created
   - View created job as GA Lead -> bottom bar shows PIC combobox + Assign
   - Assign PIC -> status = assigned
   - View as PIC -> bottom bar shows cost input + Request Approval
   - Enter cost 0 + Request Approval -> auto-approved, shows Start Work
   - Enter cost > 0 + Request Approval -> status = pending_approval
   - Finance approves -> status = assigned (not in_progress), approved_at set
   - PIC sees Start Work -> clicks -> status = in_progress
</verification>

<success_criteria>
- New job lifecycle enforced: created -> assigned (PIC) -> pending_approval (if cost > 0) -> assigned (approved) -> in_progress
- Cost = 0 auto-approves without going through pending_approval
- Start Work is gated behind approved_at in both server action and UI
- Job create form has exactly 5 fields: title, description, location, category, priority, linked requests (NO PIC, NO cost)
- Bottom bar is status-dependent per locked decisions in CONTEXT.md
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/19-rework-job-flow-cost-approval-before-pic/19-SUMMARY.md`
</output>
