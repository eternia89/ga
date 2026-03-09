---
phase: quick-27
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/job-actions.ts
  - app/actions/approval-actions.ts
  - components/jobs/job-detail-actions.tsx
  - components/jobs/job-modal.tsx
  - components/jobs/job-form.tsx
  - lib/constants/job-status.ts
  - lib/validations/job-schema.ts
  - app/(dashboard)/approvals/page.tsx
autonomous: true
requirements: [QUICK-27]

must_haves:
  truths:
    - "Job creation with budget >= threshold sets status to pending_approval and button says 'Create Job & Request Budget'"
    - "Job creation with budget < threshold or no budget goes straight to created status"
    - "Budget approval/decline buttons visible only to the JOB CREATOR (not finance_approver)"
    - "Completion approval/decline buttons visible only to the JOB CREATOR (not finance_approver)"
    - "Budget approval gate happens BEFORE PIC assignment (pending_approval -> created -> assign PIC)"
    - "Bottom bar states flow: waiting for budget -> assign PIC -> start work -> mark complete -> approve/decline completion"
    - "Approval queue page still accessible by finance_approver/admin for viewing but approve/reject actions removed from there for budget/completion"
  artifacts:
    - path: "app/actions/job-actions.ts"
      provides: "createJob with budget field and conditional pending_approval status"
    - path: "app/actions/approval-actions.ts"
      provides: "approveJob/rejectJob/approveCompletion/rejectCompletion check created_by instead of finance_approver role"
    - path: "components/jobs/job-detail-actions.tsx"
      provides: "Bottom bar with creator-based approval buttons"
    - path: "components/jobs/job-modal.tsx"
      provides: "Modal bottom bar with creator-based approval buttons"
    - path: "components/jobs/job-form.tsx"
      provides: "Budget field in create form, dynamic submit button text"
  key_links:
    - from: "components/jobs/job-form.tsx"
      to: "app/actions/job-actions.ts"
      via: "createJob action call with estimated_cost"
      pattern: "createJob.*estimated_cost"
    - from: "app/actions/approval-actions.ts"
      to: "jobs.created_by"
      via: "role check changed to created_by comparison"
      pattern: "job\\.created_by.*profile\\.id"
---

<objective>
Rework the job lifecycle so that:
1. Budget field is part of job creation; if budget >= company threshold, job starts as pending_approval with button text "Create Job & Request Budget"
2. Budget approval is done by the JOB CREATOR (not finance_approver)
3. Completion approval is done by the JOB CREATOR (not finance_approver)
4. Budget approval gate happens BEFORE PIC assignment
5. Bottom bar shows contextual states: waiting for budget -> assign PIC -> start work -> mark complete -> approve/decline

Purpose: Align the approval flow with real-world process where the job creator (typically GA Lead) approves budgets and completions, not a separate finance role.
Output: Updated actions, UI components, and form with new lifecycle flow.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/actions/job-actions.ts
@app/actions/approval-actions.ts
@components/jobs/job-detail-actions.tsx
@components/jobs/job-modal.tsx
@components/jobs/job-form.tsx
@lib/constants/job-status.ts
@lib/validations/job-schema.ts
@app/(dashboard)/approvals/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update server actions — createJob with budget, change approval role checks to created_by</name>
  <files>app/actions/job-actions.ts, app/actions/approval-actions.ts, lib/validations/job-schema.ts, lib/constants/job-status.ts</files>
  <action>
**job-schema.ts:**
- Add `estimated_cost: z.number().min(0).optional()` to `createJobSchema` (budget field at creation time).

**job-actions.ts — createJob:**
- Accept `estimated_cost` from parsedInput (from the updated schema).
- After inserting the job, if `estimated_cost` is provided and > 0:
  - Fetch `budget_threshold` from `company_settings` for the company.
  - If `estimated_cost >= budget_threshold`, update the newly created job's status to `pending_approval` and set `approval_submitted_at = now`. Also set `estimated_cost` on the job row.
  - If `estimated_cost < budget_threshold` or no threshold configured, just set `estimated_cost` on the job row, status stays `created`.
- If no `estimated_cost` or it's 0, status stays `created` as before.
- Remove the `requestApproval` action entirely (no longer needed — budget is set at creation time, not requested later by PIC).
- Remove `updateJobBudget` action entirely (budget is now set at creation and cannot be changed independently).
- In `updateJob`: Remove the auto-transition logic that routes to `pending_approval` when `estimated_cost` changes on an `in_progress` job (lines ~212-238). Budget approval now only happens at creation time.
- In `assignJob`: Change the guard — only allow assigning PIC when job status is `created` (current behavior) OR when status has been through approval and is now back at `created` after approval. The key change: `assignJob` should transition from `created` to `assigned` (unchanged).
- In `updateJobStatus` valid transitions: Update to reflect new flow:
  - `pending_approval` should NOT be a target status from `in_progress` anymore
  - `created`: ['assigned'] (after budget approved or no budget needed)
  - `assigned`: ['in_progress']
  - `in_progress`: ['completed'] (completion may route to pending_completion_approval server-side)
  - `pending_approval`: [] (handled by approveJob/rejectJob)
  - `pending_completion_approval`: [] (handled by approveCompletion/rejectCompletion)
- In `updateJobStatus` schema: Remove 'pending_approval' from the status enum (it's no longer a client-side target).

**approval-actions.ts:**
- `approveJob`: Change role check from `['finance_approver', 'admin']` to checking `job.created_by === profile.id` (only the creator can approve). Also change the status transition: instead of `pending_approval -> in_progress`, change to `pending_approval -> created` (so the creator can then assign PIC). Set `approved_at` and `approved_by`.
- `rejectJob`: Change role check from `['finance_approver', 'admin']` to `job.created_by === profile.id`. Status goes from `pending_approval` back to `created` (not `in_progress` since work hasn't started). Clear approval data. The job stays at `created` but with rejection info so the creator knows budget was declined.
  - Actually on reject, the job should be effectively declined. Consider: on reject, the job can stay at `created` status with the rejection reason recorded, and the creator can edit the budget and re-submit. OR the job could go to `cancelled`. Per the user's description, there's no explicit reject-then-edit flow described, so: reject budget sets status back to `created` with rejection data recorded. The creator can then edit and re-create/re-submit.
  - Wait — re-reading the user's flow: "After budget approved (or if no budget needed), the bottom bar shows PIC selection". So: pending_approval -> (approve) -> created -> assign PIC -> assigned. On reject: pending_approval -> created (with rejection info). Creator can then edit budget in the form and the submit button would trigger a re-creation or update. Since this is a detail page (edit mode), keep the job at `created` so the form is editable and the creator can update the budget and re-trigger approval via updateJob.
  - Summary: `approveJob` transitions `pending_approval -> created`, `rejectJob` transitions `pending_approval -> created`.
- `approveCompletion`: Change role check from `['finance_approver', 'admin']` to `job.created_by === profile.id`.
- `rejectCompletion`: Change role check from `['finance_approver', 'admin']` to `job.created_by === profile.id`.
- `unapproveJob`: Remove this action (no longer needed since budget is set at creation).
- `submitForApproval`: Remove this action (budget approval now happens at job creation).
- Update notification recipients in all changed actions: notify the PIC (if assigned) and relevant parties, but NOT finance_approver specifically. For approveJob, notify nobody special (creator approved their own job). For rejectJob, same. For approveCompletion, notify the PIC. For rejectCompletion, notify the PIC.

**job-status.ts:**
- No changes needed to status labels/colors — `pending_approval` and `pending_completion_approval` still exist as statuses.

**IMPORTANT constraints:**
- Do NOT change any DB schema or migrations — only application-level logic changes.
- Keep `approved_at`, `approved_by`, `approval_submitted_at`, etc. columns as-is.
- The `estimated_cost` column already exists on the jobs table.
  </action>
  <verify>npx tsc --noEmit 2>&1 | head -30</verify>
  <done>
- createJob accepts estimated_cost, conditionally sets pending_approval status
- approveJob/rejectJob check created_by instead of finance_approver role
- approveCompletion/rejectCompletion check created_by instead of finance_approver role
- requestApproval, updateJobBudget, submitForApproval, unapproveJob actions removed
- Valid transitions updated for new flow
- TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Update UI — job form budget field, dynamic button text, bottom bar approval by creator</name>
  <files>components/jobs/job-form.tsx, components/jobs/job-detail-actions.tsx, components/jobs/job-modal.tsx, app/(dashboard)/approvals/page.tsx</files>
  <action>
**job-form.tsx:**
- Add an `estimated_cost` field to the CREATE form (not just edit mode). Use the same currency input pattern (type=text, inputMode=numeric, Rp prefix, formatNumber). Field label: "Budget (optional)". Place it after Priority field.
- Add a `companyBudgetThreshold` prop to JobForm (number | null). The parent (job modal create mode, jobs page) must pass this value.
- Dynamic submit button text in create mode:
  - If `estimated_cost` value >= `companyBudgetThreshold` (and threshold is not null): button text = "Create Job & Request Budget"
  - Otherwise: button text = "Create Job"
  - While submitting: "Creating..."
- Remove the import of `requestApproval` if present (it's been removed from actions).
- The `estimated_cost` field in edit mode should remain as-is (or be read-only if the job has an approved budget).

**job-detail-actions.tsx:**
- Change permission logic for budget approval: `canApproveReject` should check `job.created_by === currentUserId` instead of `isFinanceApproverOrAdmin`, AND job status is `pending_approval`.
- Change permission logic for completion approval: `canApproveCompletion` should check `job.created_by === currentUserId` instead of `isFinanceApproverOrAdmin`, AND job status is `pending_completion_approval`.
- Remove `canRequestApproval` entirely (budget is set at creation, not requested by PIC mid-flow).
- Remove the cost input + "Request Approval" button section.
- Update `canAssignPIC`: GA Lead/Admin can assign PIC when status is `created` AND the job does NOT have a pending budget (i.e., if budget was set and >= threshold, it must be approved first). Check: `isGaLeadOrAdmin && job.status === 'created' && (job.approved_at || !(job.estimated_cost && job.estimated_cost > 0 && !job.approved_at))`. Simpler: if status is `created`, PIC can be assigned. If status is `pending_approval`, PIC cannot be assigned. The status itself gates this.
  - Actually since `pending_approval` is a separate status from `created`, the existing check `job.status === 'created'` already prevents assignment during pending_approval. So `canAssignPIC` stays as `isGaLeadOrAdmin && job.status === 'created'`.
- Update pending indicators: "Awaiting Budget Approval" shown to everyone EXCEPT the creator (who sees the approve/decline buttons). "Awaiting Completion Approval" shown to everyone EXCEPT the creator.
- Remove imports of `requestApproval` from job-actions.
- Remove the `costValue` state and related input since budget request flow is removed.

**job-modal.tsx:**
- Mirror ALL the same permission logic changes from job-detail-actions.tsx into the modal's bottom bar:
  - `canApproveReject`: `job.created_by === currentUserId && job.status === 'pending_approval'`
  - `canApproveCompletion`: `job.created_by === currentUserId && job.status === 'pending_completion_approval'`
  - Remove `canRequestApproval` and the cost input + "Request Approval" button.
  - Remove `costValue` state.
  - Remove import of `requestApproval`.
  - Update pending indicators to exclude creator (creator sees buttons).
- For create mode: Pass `companyBudgetThreshold` to JobForm. This requires fetching the threshold. Since the modal in create mode receives data from the parent page, add `companyBudgetThreshold` to JobModalProps and pass it through.
- The jobs list page that renders JobModal in create mode must fetch and pass the budget threshold.

**approvals/page.tsx:**
- Keep the approval queue page functional but update the description text. The page is still useful for viewing approval history.
- Change the access check: Instead of only `['finance_approver', 'admin']`, allow `['ga_lead', 'admin']` access (since creators are typically GA Leads). OR better: allow all roles that can create jobs (`ga_lead`, `admin`) since they need to see their pending approvals.
- Actually, the approval queue may become less relevant since approvals now happen on the job detail page by the creator. Consider: keep the page as-is for historical viewing by admin/ga_lead/finance_approver. The approve/reject buttons in the ApprovalQueue component will naturally not work if the server actions now check created_by. This is acceptable — the queue becomes read-only for viewing history.
- Update the page access to include `ga_lead`: `if (!['finance_approver', 'ga_lead', 'admin'].includes(profile.role))`.

**Jobs list page** (app/(dashboard)/jobs/page.tsx):
- Fetch `budget_threshold` from company_settings and pass to JobModal as `companyBudgetThreshold` prop. Add this fetch to the existing parallel Promise.all.
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>
- Job create form has budget field with dynamic "Create Job & Request Budget" button text
- Bottom bar shows approve/decline to job creator only (not finance_approver)
- Request Approval flow removed from UI
- Pending approval indicators shown to non-creators
- Approval queue page accessible to ga_lead/admin/finance_approver
- Build succeeds
  </done>
</task>

</tasks>

<verification>
1. TypeScript compilation passes: `npx tsc --noEmit`
2. Build succeeds: `npm run build`
3. Lint passes: `npm run lint`
</verification>

<success_criteria>
- Creating a job with budget >= threshold results in pending_approval status
- Creating a job with budget < threshold or no budget results in created status
- Create form submit button shows "Create Job & Request Budget" when budget >= threshold
- Only job creator sees Approve/Decline buttons for budget approval
- Only job creator sees Approve/Decline buttons for completion approval
- Budget approval transitions job from pending_approval to created (enabling PIC assignment)
- PIC assignment only available when status is created
- The old "Request Approval" flow by PIC is completely removed
- finance_approver role no longer has exclusive approval power over jobs
</success_criteria>

<output>
After completion, create `.planning/quick/27-rework-job-lifecycle-budget-approval-by-/27-SUMMARY.md`
</output>
