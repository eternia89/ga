---
phase: quick-20
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/job-actions.ts
  - app/actions/approval-actions.ts
  - components/jobs/job-modal.tsx
  - components/jobs/job-detail-actions.tsx
  - components/jobs/job-form.tsx
autonomous: true
requirements: [QUICK-20]

must_haves:
  truths:
    - "PIC can start work on assigned job without needing approval first"
    - "PIC fills estimated cost and requests approval while job is in_progress"
    - "Approved/rejected jobs return to in_progress (not assigned)"
    - "estimated_cost field does not appear in job form body"
  artifacts:
    - path: "app/actions/job-actions.ts"
      provides: "Updated status transition logic"
      contains: "canStartWork without approved_at gate"
    - path: "app/actions/approval-actions.ts"
      provides: "Updated approval/rejection target status"
      contains: "status: 'in_progress'"
    - path: "components/jobs/job-modal.tsx"
      provides: "Reordered bottom bar actions"
    - path: "components/jobs/job-detail-actions.tsx"
      provides: "Reordered bottom bar actions (detail page)"
    - path: "components/jobs/job-form.tsx"
      provides: "No estimated_cost field"
  key_links:
    - from: "job-actions.ts updateJobStatus"
      to: "job-modal.tsx canStartWork"
      via: "status === assigned without approved_at check"
      pattern: "isPIC.*status.*assigned"
    - from: "job-actions.ts requestApproval"
      to: "approval-actions.ts approveJob/rejectJob"
      via: "in_progress -> pending_approval -> in_progress cycle"
      pattern: "status.*in_progress"
---

<objective>
Swap the order of work start and cost approval in the job flow. Currently: Assign PIC -> Fill Cost -> Approval -> Start Work. New flow: Assign PIC -> Start Work -> Fill Cost -> Approval (while working).

Purpose: PIC should be able to start work immediately after assignment without waiting for cost approval. Cost estimation and approval happen while work is in progress.
Output: Updated server actions and UI components reflecting the new flow order.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@app/actions/job-actions.ts
@app/actions/approval-actions.ts
@components/jobs/job-modal.tsx
@components/jobs/job-detail-actions.tsx
@components/jobs/job-form.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update server actions for swapped flow</name>
  <files>app/actions/job-actions.ts, app/actions/approval-actions.ts</files>
  <action>
  In job-actions.ts updateJobStatus:
  - Line ~337: Remove the approved_at gate. Delete or comment out the block `if (parsedInput.status === 'in_progress' && !job.approved_at)`. PIC should transition assigned -> in_progress with just isPIC check (line ~316 already handles this).

  In job-actions.ts requestApproval (~line 496+):
  - The function currently checks status. Update the guard to require status === 'in_progress' instead of 'assigned'. The PIC requests approval while working, not before starting.
  - Line ~616+: The `if (job.approved_at)` guard may need review — ensure it still makes sense in the new flow context.

  In approval-actions.ts approveJob:
  - Line ~133: Change `status: 'assigned'` to `status: 'in_progress'`. After budget approval, PIC continues working (they were already in_progress).

  In approval-actions.ts rejectJob:
  - Line ~202: Change `status: 'assigned'` to `status: 'in_progress'`. After rejection, PIC goes back to working to revise cost estimate.

  In approval-actions.ts revokeApproval (~line 428+):
  - Line ~438: The guard checks `job.status !== 'in_progress' || !job.approved_at` — this should still work correctly since revoking happens during in_progress.
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>
  - updateJobStatus allows assigned -> in_progress without approved_at check
  - requestApproval requires status === 'in_progress'
  - approveJob transitions pending_approval -> in_progress
  - rejectJob transitions pending_approval -> in_progress
  - Build passes with no errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Update UI bottom bars and remove estimated_cost from form</name>
  <files>components/jobs/job-modal.tsx, components/jobs/job-detail-actions.tsx, components/jobs/job-form.tsx</files>
  <action>
  In job-modal.tsx bottom bar:
  - Find canStartWork logic. Remove the `!!job?.approved_at` condition. canStartWork = isPIC && job?.status === 'assigned'.
  - Status === 'assigned' block (PIC): Show ONLY [Start Work] button. Remove the cost input + Request Approval from this block.
  - Status === 'in_progress' block (PIC, NOT approved): Add the cost input (Rp ___) + [Request Approval] button here. This is the section where PIC fills cost while working.
  - Status === 'in_progress' block (PIC, approved): Show [Mark Complete] button (this likely already exists).

  In job-detail-actions.tsx:
  - Mirror the exact same changes as job-modal.tsx bottom bar. Same canStartWork simplification, same movement of cost input from assigned to in_progress block.

  In job-form.tsx:
  - Remove the estimated_cost FormField entirely. The cost is handled exclusively in the bottom bar of modal/detail, not in the form body. Find and delete the FormField block for estimated_cost.
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>
  - canStartWork no longer requires approved_at in both modal and detail
  - Assigned status (PIC) shows only Start Work button
  - In-progress status (PIC, not approved) shows cost input + Request Approval
  - In-progress status (PIC, approved) shows Mark Complete
  - estimated_cost field removed from job-form.tsx
  - Build passes with no errors
  </done>
</task>

</tasks>

<verification>
- `npm run build` passes without errors
- Flow logic: assigned PIC can start work without approval
- Flow logic: in_progress PIC can fill cost and request approval
- Flow logic: approved/rejected jobs return to in_progress
- estimated_cost field not present in job form body
</verification>

<success_criteria>
The job flow follows: Create -> Assign PIC -> Start Work -> Fill Cost -> Request Approval -> Continue Working (approved) or Revise Cost (rejected). No estimated_cost field in the form body. Build passes cleanly.
</success_criteria>

<output>
After completion, create `.planning/quick/20-swap-order-start-work-before-cost-approv/20-SUMMARY.md`
</output>
