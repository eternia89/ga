# Deadlock Analysis: Request, Job, Approval, Asset & Maintenance Flows

**Date:** 2026-03-06
**Method:** Code review of server actions, UI components, and state machine constants
**Scope:** All 5 entity state machines, all 5 roles

---

## 1. Request State Machine Audit

### 1.1 All Request Statuses

| Status | Label | Terminal? |
|--------|-------|-----------|
| submitted | New | No |
| triaged | Triaged | No |
| in_progress | In Progress | No |
| pending_approval | Pending Approval | No |
| approved | Approved | No |
| completed | Completed | No |
| pending_acceptance | Pending Acceptance | No |
| accepted | Accepted | No |
| closed | Closed | Yes |
| rejected | Rejected | Yes |
| cancelled | Cancelled | Yes |

### 1.2 Available UI Actions Per Status Per Role

| Status | general_user (requester) | general_user (non-requester) | ga_staff | ga_lead | finance_approver | admin |
|--------|--------------------------|------------------------------|----------|---------|------------------|-------|
| submitted | Cancel Request | (none) | (none) | Triage, Reject | (none) | Triage, Reject |
| triaged | (none) | (none) | (none) | Edit Triage, Reject | (none) | Edit Triage, Reject |
| in_progress | (none) | (none) | (none) | (none) | (none) | (none) |
| pending_approval | (none) | (none) | (none) | (none) | (none) | (none) |
| approved | (none) | (none) | (none) | (none) | (none) | (none) |
| completed | (none) | (none) | (none) | (none) | (none) | (none) |
| pending_acceptance | Accept Work, Reject Work | (none) | (none) | (none) | (none) | Accept Work, Reject Work |
| accepted | Give Feedback | (none) | (none) | (none) | (none) | (none) |
| closed | (none) | (none) | (none) | (none) | (none) | (none) |
| rejected | (none) | (none) | (none) | (none) | (none) | (none) |
| cancelled | (none) | (none) | (none) | (none) | (none) | (none) |

### 1.3 Request Transition Map (Server Actions)

| From | To | Triggered By | Server Action |
|------|----|-------------|---------------|
| submitted | triaged | ga_lead, admin | triageRequest |
| submitted | rejected | ga_lead, admin | rejectRequest |
| submitted | cancelled | requester | cancelRequest |
| triaged | rejected | ga_lead, admin | rejectRequest |
| triaged | triaged (re-triage) | ga_lead, admin | triageRequest |
| triaged/submitted | in_progress | system (job linking) | createJob / updateJob |
| in_progress | pending_acceptance | system (job completion) | updateJobStatus / approveCompletion |
| pending_acceptance | accepted | requester, admin | acceptRequest |
| pending_acceptance | in_progress | requester, admin | rejectCompletedWork |
| accepted | closed | requester | submitFeedback |

---

## 2. Job State Machine Audit

### 2.1 All Job Statuses

| Status | Label | Terminal? |
|--------|-------|-----------|
| created | Created | No |
| assigned | Assigned | No |
| in_progress | In Progress | No |
| pending_approval | Pending Approval | No |
| pending_completion_approval | Pending Completion Approval | No |
| completed | Completed | Yes |
| cancelled | Cancelled | Yes |

### 2.2 Available UI Actions Per Status Per Role

| Status | ga_staff (PIC) | ga_staff (non-PIC) | ga_lead | finance_approver | admin |
|--------|----------------|--------------------|---------|------------------|-------|
| created | (none) | (none) | Cancel Job | (none) | Cancel Job |
| assigned | Start Work | (none) | Start Work, Cancel Job | (none) | Start Work, Cancel Job |
| in_progress | Mark Complete* | (none) | Mark Complete*, Cancel Job | (none) | Mark Complete*, Cancel Job |
| pending_approval | (waiting indicator) | (none) | Cancel Job | Approve Budget, Reject Budget | Approve Budget, Reject Budget, Cancel Job |
| pending_completion_approval | (waiting indicator) | (none) | Cancel Job | Approve Completion, Reject Completion | Approve Completion, Reject Completion, Cancel Job |
| completed | (none) | (none) | (none) | (none) | (none) |
| cancelled | (none) | (none) | (none) | (none) | (none) |

*Mark Complete is only available when budget is approved (or no budget set). If estimated_cost > 0 and approved_at is null, the button is hidden.

### 2.3 Job Transition Map (Server Actions)

| From | To | Triggered By | Server Action |
|------|----|-------------|---------------|
| created | assigned | ga_lead, admin | assignJob / updateJob (when assigned_to set) |
| assigned | in_progress | PIC, ga_lead, admin | updateJobStatus (BUT: auto-reroutes to pending_approval if estimated_cost > 0) |
| assigned | pending_approval | ga_lead, admin | submitForApproval |
| in_progress | completed | PIC, ga_lead, admin | updateJobStatus (BUT: auto-reroutes to pending_completion_approval if cost >= threshold) |
| in_progress | pending_approval | PIC, ga_lead, admin | updateJobBudget / updateJob (cost change) |
| pending_approval | in_progress | finance_approver, admin | approveJob |
| pending_approval | in_progress | finance_approver, admin | rejectJob (returns for revision) |
| pending_completion_approval | completed | finance_approver, admin | approveCompletion |
| pending_completion_approval | in_progress | finance_approver, admin | rejectCompletion |
| any (except completed) | cancelled | ga_lead, admin | cancelJob |

---

## 3. Asset State Machine Audit

### 3.1 All Asset Statuses

| Status | Label | Terminal? |
|--------|-------|-----------|
| active | Active | No |
| under_repair | Under Repair | No |
| broken | Broken | No |
| sold_disposed | Sold/Disposed | Yes |

### 3.2 Valid Transitions (from constants)

| From | Allowed Targets |
|------|----------------|
| active | under_repair, broken, sold_disposed |
| under_repair | active, broken, sold_disposed |
| broken | active, under_repair, sold_disposed |
| sold_disposed | (none -- terminal) |

### 3.3 Asset Status Change UI

Status changes are triggered via the `AssetStatusChangeDialog` component, available to ga_staff, ga_lead, and admin roles. The status badge on the asset detail page renders as a clickable button that opens the dialog. All transitions are available through this dialog.

### 3.4 Inventory Movement (Transfer) Statuses

| Status | Terminal? |
|--------|-----------|
| pending | No |
| accepted | Yes |
| rejected | Yes |
| cancelled | Yes |

### 3.5 Transfer UI Actions Per Role

| Action | Initiator | Receiver | ga_lead | admin | ga_staff (non-party) |
|--------|-----------|----------|---------|-------|-----------------------|
| Create Transfer | Yes | - | Yes | Yes | Yes |
| Accept Transfer | - | Yes | Yes | Yes | (none) |
| Reject Transfer | - | Yes | Yes | Yes | (none) |
| Cancel Transfer | Yes | - | Yes | Yes | (none) |

---

## 4. Maintenance Schedule State Machine Audit

### 4.1 Schedule Display Statuses (derived, not stored)

| Display Status | Condition | Terminal? |
|---------------|-----------|-----------|
| active | is_active=true, is_paused=false | No |
| paused_auto | is_active=true, is_paused=true, paused_reason starts with 'auto:' | No |
| paused_manual | is_active=true, is_paused=true, manual reason | No |
| deactivated | is_active=false | Yes (reversible) |

### 4.2 Schedule Actions Per Role

| Action | ga_lead | admin | ga_staff | general_user | finance_approver |
|--------|---------|-------|----------|--------------|------------------|
| Create Schedule | Yes | Yes | No | No | No |
| Edit Schedule | Yes | Yes | No | No | No |
| Deactivate (via schedule detail/modal) | Yes | Yes | No | No | No |
| Activate (via schedule detail/modal) | Yes | Yes | No | No | No |
| Delete Schedule | Yes | Yes | No | No | No |

### 4.3 PM Job Flow

PM jobs follow the same job state machine as regular jobs. The `advanceFloatingSchedule` function is called after PM job completion to advance the next_due_at for floating schedules.

---

## 5. Deadlocks and Issues Found

### ISSUE 1: Request statuses `pending_approval`, `approved`, `completed` are UNREACHABLE / UNUSED

**Severity:** Cosmetic (no functional impact)
**Affected roles:** All
**Current state:** These statuses exist in REQUEST_STATUSES constant and STATUS_LABELS but no server action ever sets a request to these statuses.
**Root cause:** The request flow goes directly: `in_progress` -> `pending_acceptance` (when linked job completes). The `pending_approval`, `approved`, and `completed` request statuses are vestigial -- they may have been planned for a direct request approval flow but the actual flow uses job-level approvals instead.
**What is missing:** Nothing functional -- these are dead constants.
**Proposed fix:** Remove `pending_approval`, `approved`, and `completed` from REQUEST_STATUSES, STATUS_LABELS, and STATUS_COLORS to reduce confusion. They serve no purpose in the current flow. Note: `completed` as a request status is particularly confusing since `pending_acceptance` is the actual post-job-completion state.

---

### ISSUE 2: Requester can only cancel request from `submitted` status -- cannot cancel after triage

**Severity:** Degraded UX
**Affected roles:** general_user (requester)
**Current state:** `triaged`
**What is missing:** Once a request is triaged, the requester has NO way to cancel it. The `cancelRequest` server action checks `eq('status', 'submitted')`. The UI also gates on `request.status === 'submitted'`.
**Root cause:** By design, triage implies GA has accepted the request. But the requester may realize the issue is resolved or no longer needed.
**Proposed fix:** Either (a) allow requester to cancel from `triaged` status (update server action + UI gate), or (b) add a "Request Cancellation" action that notifies GA Lead to cancel on their behalf. Option (a) is simpler. If implemented, the cancelRequest action should also handle reverting any linked job (though jobs are not linked until in_progress).

---

### ISSUE 3: Job in `created` status with no PIC has NO UI action to transition it -- POTENTIAL DEADLOCK

**Severity:** Blocking (deadlock)
**Affected roles:** ga_lead, admin
**Current state:** `created` (no assigned_to)
**What is missing:** The `created` -> `assigned` transition only happens when a PIC is assigned (via `assignJob` or `updateJob` with `assigned_to`). The `JobDetailActions` component offers "Start Work" only on `assigned` status, and "Cancel Job" on all non-terminal statuses for ga_lead/admin. So cancel IS available. But there is no explicit "Assign PIC" button on the job detail actions bar.
**Root cause:** PIC assignment is done through inline editing of the job detail form (Combobox for `assigned_to` field), not through the action bar. When a job is created without a PIC, the ga_lead/admin must edit the job and assign a PIC via the inline form fields, which auto-transitions to `assigned`.
**Actual assessment:** NOT a true deadlock -- PIC assignment via inline editing works. However, the flow is non-obvious. A user who only looks at the action buttons would think nothing can be done with a `created` job (only Cancel is shown).
**Proposed fix:** Add "Assign PIC" or at minimum a help indicator on the actions bar when status is `created` and no PIC is assigned, pointing the user to edit the PIC field. Alternatively, add an "Assign" button that opens the PIC selector.

---

### ISSUE 4: assigned -> in_progress auto-reroutes to pending_approval when estimated_cost > 0 -- SILENT REDIRECT

**Severity:** Degraded UX
**Affected roles:** ga_staff (PIC), ga_lead, admin
**Current state:** `assigned` with `estimated_cost > 0`
**What is missing:** When PIC clicks "Start Work" on an assigned job that has a non-zero estimated_cost, the `updateJobStatus` action sends `status: 'in_progress'` but the server intercepts and redirects to `pending_approval` instead. The transition IS valid (`assigned: ['in_progress', 'pending_approval']`), and the code correctly changes `actualStatus` to `pending_approval`. However, the user clicked "Start Work" and the job goes to "Pending Approval" -- this may be confusing.
**Root cause:** The `updateJobStatus` intercept at line 414: `if (parsedInput.status === 'in_progress' && (job.estimated_cost ?? 0) > 0) { actualStatus = 'pending_approval'; }`. This is intentional budget control but the UI success message says "Work started" when really the job went to pending approval.
**Proposed fix:** After the action completes, the UI should detect the actual resulting status and show an appropriate message like "Budget approval required before work can start" instead of "Work started." The `updateJobStatus` could return `{ success: true, actualStatus }` so the UI can adapt.

---

### ISSUE 5: `in_progress` job with budget (estimated_cost > 0, approved_at = null) blocks "Mark Complete" -- NO UI TO SUBMIT BUDGET

**Severity:** Blocking (potential deadlock)
**Affected roles:** ga_staff (PIC)
**Current state:** `in_progress` with `estimated_cost > 0` and `approved_at = null`
**What is missing:** The `canMarkComplete` check in JobDetailActions (line 92-93) requires `!hasPendingBudget`, where `hasPendingBudget = (job.estimated_cost ?? 0) > 0 && !job.approved_at`. This correctly blocks completion until budget is approved. However, the PIC needs a way to SUBMIT the budget for approval. The `updateJobBudget` action exists to set/update estimated_cost and auto-route to `pending_approval`, but this action is only available when status is `in_progress`.
**How it happens:** If a GA Lead creates a job with estimated_cost pre-filled AND a PIC assigned, the job goes to `assigned`. When PIC starts work, it auto-reroutes to `pending_approval` (Issue 4). After approval (approved_at set), the job moves to `in_progress` with approved budget. Mark Complete becomes available. This path WORKS correctly.
**Edge case that could deadlock:** If a GA Lead creates a job WITHOUT estimated_cost, assigns PIC, PIC starts work (goes to `in_progress` normally). Then GA Lead edits the job and adds estimated_cost. Now the job is `in_progress` with estimated_cost > 0 but approved_at is null. PIC cannot mark complete, and the budget edit auto-routes to `pending_approval` via `updateJob`. This also WORKS because the `updateJob` code handles it.
**Actual assessment:** NOT a true deadlock -- the budget submission flow through `updateJob` or `updateJobBudget` handles the routing. However, the PIC may not realize they need to edit the budget field to trigger approval.
**Proposed fix:** When `hasPendingBudget` is true, show a contextual message: "Budget approval required. Submit budget for approval to proceed." with a clear call-to-action pointing to the budget field.

---

### ISSUE 6: advanceFloatingSchedule TODO is NOT integrated -- floating schedules never advance on PM job completion

**Severity:** Blocking (functional bug)
**Affected roles:** ga_lead, admin (schedule managers)
**Current state:** PM job completed, floating schedule `next_due_at` NOT updated
**What is missing:** In `job-actions.ts` `updateJobStatus`, lines 475-484 contain a TODO comment:
```
// TODO(PM-INTEGRATION): When completing a PM job, call advanceFloatingSchedule.
```
This TODO has never been implemented. When a PM job is marked as completed, the `advanceFloatingSchedule` function is never called. For floating schedules, `next_due_at` will remain at its last value forever, causing the schedule to appear perpetually overdue and generating duplicate jobs on every cron run.
**Root cause:** The integration was left as a TODO during Phase 7 implementation and was never wired in.
**Proposed fix:** In `updateJobStatus`, after the job is completed (actualStatus === 'completed'), check if the job is a PM job (job_type === 'preventive_maintenance') and call `advanceFloatingSchedule`. The function already exists in `pm-job-actions.ts`. However, since `advanceFloatingSchedule` is an `authActionClient` action (not a plain function), it cannot be called directly from another server action. Either (a) extract the core logic into a plain async function and call it, or (b) restructure. Option (a) is recommended.

---

### ISSUE 7: No manual pause/resume for maintenance schedules -- only deactivate/activate exists

**Severity:** Degraded functionality
**Affected roles:** ga_lead, admin
**Current state:** Active schedule that user wants to temporarily pause
**What is missing:** The schedule-actions.ts has `deactivateSchedule` and `activateSchedule` (which set `is_active` flag), but there is NO server action for manually pausing a schedule (`is_paused = true` with a manual reason). The only pause mechanism is the auto-pause triggered by asset status changes (`pauseSchedulesForAsset` helper). The UI labels for deactivate/activate show "Pause" and "Resume" in the schedule detail component, which is semantically confusing -- "deactivate" cancels open PM jobs and sets `is_active = false`, while a true "pause" would just pause without cancelling jobs.
**Root cause:** Manual pause was not implemented as a separate action. The `deactivateSchedule` action is being used as a substitute for pause, but it has destructive side effects (cancels open PM jobs).
**Proposed fix:** Add `pauseSchedule` and `resumeSchedule` server actions for manual pause (sets `is_paused=true`, `paused_reason='manual'`) without cancelling jobs, separate from deactivate. Update UI labels: "Pause" for manual pause, "Deactivate" for permanent deactivation with job cancellation.

---

### ISSUE 8: Request `in_progress` with ALL linked jobs cancelled -- request stuck

**Severity:** Blocking (deadlock)
**Affected roles:** All (no role can progress)
**Current state:** Request is `in_progress`, all linked jobs are `cancelled`
**What is missing:** When a job is cancelled via `cancelJob`, it reverts linked requests to `triaged` status (line 729-731 in job-actions.ts). However, this only applies to requests in `in_progress` or `pending_acceptance` status. If the request is `in_progress` and the cancellation code correctly reverts it to `triaged`, this SHOULD work. Let me verify...
**Verification:** The `cancelJob` action does: `.in('status', ['in_progress', 'pending_acceptance'])` and updates to `triaged`. So if a request is `in_progress` and its only linked job is cancelled, the request correctly returns to `triaged`. Multiple jobs: if request has 2 jobs and one is cancelled but the other is still active, the request stays `in_progress` (correct -- the active job is still working on it). If BOTH are cancelled, both cancel actions revert the request to `triaged`.
**Actual assessment:** NOT a deadlock -- the `cancelJob` action correctly handles this case by reverting linked requests to `triaged`.
**Proposed fix:** None needed -- the current behavior is correct.

---

### ISSUE 9: No "Submit for Budget Approval" button on job detail page

**Severity:** Degraded UX
**Affected roles:** ga_lead, admin, PIC
**Current state:** Job `in_progress` with estimated_cost set
**What is missing:** The `submitForApproval` action exists in approval-actions.ts but there is no dedicated UI button to trigger it. Budget submission happens implicitly through:
1. `updateJobBudget` (PIC edits cost, auto-routes to pending_approval)
2. `updateJob` (GA Lead edits cost, auto-routes to pending_approval)
3. `updateJobStatus` (assigned -> in_progress intercept when cost > 0)
These implicit triggers work but are not discoverable. The `submitForApproval` action has threshold validation logic that the implicit paths may bypass.
**Root cause:** The original `submitForApproval` action was built as a standalone explicit action but the UI evolved to use implicit triggers instead.
**Proposed fix:** Either (a) remove `submitForApproval` as dead code (the implicit paths cover the same functionality), or (b) add an explicit "Submit for Approval" button when the job is in_progress with estimated_cost > 0 and no approved_at. Option (a) is simpler since the implicit routing already works.

---

### ISSUE 10: Approval Queue does NOT show action buttons -- users must navigate to job detail

**Severity:** Degraded UX
**Affected roles:** finance_approver, admin
**Current state:** Pending approval in queue
**What is missing:** The `ApprovalQueue` component (approval-queue.tsx) is a read-only table. It shows pending jobs but has NO approve/reject buttons. Users must click a row to navigate to the job detail page, then use the action buttons there. This adds unnecessary steps for finance approvers who may need to review and approve many jobs.
**Root cause:** The approval queue was designed as a navigation list rather than an actionable queue.
**Proposed fix:** Add inline "Approve" / "Reject" action buttons to each pending row in the approval queue table. Alternatively, add a View modal with approve/reject actions (matching the pattern used elsewhere in the app). This would significantly speed up the approval workflow.

---

### ISSUE 11: `ga_staff` role CANNOT create jobs -- only view and comment

**Severity:** By design, but worth noting
**Affected roles:** ga_staff
**Current state:** ga_staff has `JOB_UPDATE_STATUS` and `JOB_COMMENT` but NOT `JOB_CREATE` or `JOB_ASSIGN`
**What is missing:** ga_staff can be assigned as PIC and update status (Start Work, Mark Complete) but cannot create or assign jobs. Only ga_lead and admin can create jobs. This is intentional per the permission model.
**Actual assessment:** Not a deadlock -- by design.
**Proposed fix:** None -- this is correct behavior per the role hierarchy.

---

### ISSUE 12: `general_user` can ONLY comment on jobs they are involved with -- but JOB_COMMENT permission exists

**Severity:** Cosmetic
**Affected roles:** general_user
**Current state:** general_user has `JOB_COMMENT` permission but the `addJobComment` server action requires the user to be PIC, ga_lead, or admin. general_user cannot comment.
**Root cause:** The permission constant grants `JOB_COMMENT` to general_user but the server action enforces a stricter check (isPIC || isLead). The permission is unused for general_user.
**Proposed fix:** Either (a) remove `JOB_COMMENT` from general_user permissions (they cannot actually use it), or (b) allow general_user to comment on jobs linked to their requests (where they are the requester). Option (b) would improve communication between requester and PIC.

---

## 6. Edge Case Analysis

### 6.1 No budget_threshold configured in Company Settings

**Scenario:** Company has no `budget_threshold` setting. A job has estimated_cost set.
**Analysis:**
- `submitForApproval` action: THROWS error "Budget threshold not configured" -- explicit guard.
- `updateJobStatus` (assigned -> in_progress intercept): Checks `(job.estimated_cost ?? 0) > 0` -- reroutes to `pending_approval` regardless of threshold. This means ANY non-zero cost triggers approval even without a threshold configured.
- `updateJobStatus` (in_progress -> completed): Checks threshold -- if `budgetThreshold === null`, the completion approval check is skipped (`estimatedCost >= budgetThreshold` where threshold is null evaluates as false). Job completes directly.
- `updateJobBudget`: Always routes to `pending_approval` when cost is set -- no threshold check.
**Issue:** The `assigned -> in_progress` intercept in `updateJobStatus` reroutes to `pending_approval` based solely on `estimated_cost > 0` without checking the threshold. This is inconsistent -- `submitForApproval` requires a threshold but the implicit intercept does not. If no threshold is configured, the job goes to `pending_approval` and CAN be approved (the `approveJob` action has no threshold check). However, it means all jobs with any cost go through approval even if the company hasn't configured a threshold.
**Proposed fix:** Make the `assigned -> in_progress` intercept also check the budget_threshold. If no threshold is configured, allow the job to proceed to `in_progress` without approval. This aligns with the `completed` path behavior.

### 6.2 No finance_approver exists in the company

**Scenario:** Company has jobs in `pending_approval` but no user with `finance_approver` role.
**Analysis:** The admin role has `APPROVAL_DECIDE` permission and the `approveJob`/`rejectJob` actions accept admin users. So admin can always approve. The notification code queries `in('role', ['finance_approver', 'admin'])` -- if no finance_approver exists, only admins get notified. If NO admin exists either (impossible -- every company should have at least one admin), then the job is stuck.
**Proposed fix:** No code fix needed. Ensure onboarding documentation states that at least one admin or finance_approver must exist. Optionally, add a warning in Company Settings when no finance_approver is configured.

### 6.3 PIC is not assigned to a job

**Scenario:** Job in `created` status with no `assigned_to`.
**Analysis:** See Issue 3. The job can only progress via PIC assignment (inline edit) or cancellation. The `created -> assigned` transition requires setting `assigned_to`. Without it, the job sits in `created` forever.
**Proposed fix:** See Issue 3.

### 6.4 Job has no linked requests

**Scenario:** Job created without any `linked_request_ids`.
**Analysis:** The job follows its normal status flow (created -> assigned -> in_progress -> completed). When completed, the code to move linked requests to `pending_acceptance` finds zero links and does nothing -- this is correct. The job completes without any request side effects.
**Proposed fix:** None needed -- this is correct standalone job behavior.

### 6.5 Request linked to multiple jobs, one completes

**Scenario:** Request `in_progress` linked to Job A (completed) and Job B (in_progress).
**Analysis:** When Job A completes, `updateJobStatus` moves ALL linked requests to `pending_acceptance`. This means the request goes to `pending_acceptance` even though Job B is still in progress. The requester could accept the request while Job B is still being worked on.
**Issue:** This is a potential logic error. If a request has multiple linked jobs, the request should only move to `pending_acceptance` when ALL linked jobs are completed.
**Proposed fix:** Before moving linked requests to `pending_acceptance`, check that ALL jobs linked to each request are completed. Query `job_requests` for each request_id, check all linked job statuses, only transition if all are completed or cancelled.

### 6.6 Schedule auto-paused, asset returns to active

**Scenario:** Asset goes from `active` to `broken` (auto-pauses schedules), then back to `active`.
**Analysis:** `resumeSchedulesForAsset` correctly queries auto-paused schedules (`LIKE 'auto:%'`) and resumes them with recalculated `next_due_at`. Manual pauses are NOT affected. This works correctly.
**Proposed fix:** None needed.

### 6.7 Deactivated schedule, try to reactivate

**Scenario:** Schedule deactivated (is_active=false), ga_lead clicks "Resume/Activate".
**Analysis:** `activateSchedule` sets `is_active=true` and recalculates `next_due_at`. It does NOT restore previously cancelled PM jobs (correct -- those were cancelled as part of deactivation).
**Issue:** The cancelled PM jobs from deactivation are NOT restored. This is correct behavior but may surprise users.
**Proposed fix:** Add a confirmation message: "Reactivating will create new PM jobs on the next cron run. Previously cancelled jobs will not be restored."

---

## 7. Summary of Findings

### Blocking Issues (Deadlocks or Functional Bugs)

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|-------------|
| 6 | advanceFloatingSchedule TODO not integrated | Blocking | Wire advanceFloatingSchedule call into updateJobStatus completion path |
| 5 (edge) | Multi-job request moves to pending_acceptance on first job completion | Blocking | Check all linked jobs completed before transitioning request |

### Degraded UX Issues

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|-------------|
| 2 | Requester cannot cancel triaged request | Degraded | Allow cancel from triaged status |
| 3 | No visual cue for created job without PIC | Degraded | Add assign indicator/button |
| 4 | Start Work silently reroutes to pending_approval | Degraded | Return actualStatus, show correct message |
| 5 | No clear CTA for budget submission | Degraded | Add contextual message when budget blocks completion |
| 7 | No manual pause for schedules | Degraded | Add pauseSchedule/resumeSchedule actions |
| 9 | submitForApproval action is unused dead code | Degraded | Remove or wire up |
| 10 | Approval queue has no inline actions | Degraded | Add approve/reject buttons to queue rows |

### Cosmetic / By-Design Issues

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|-------------|
| 1 | Unused request statuses in constants | Cosmetic | Remove dead constants |
| 11 | ga_staff cannot create jobs | By design | None |
| 12 | general_user has JOB_COMMENT but cannot use it | Cosmetic | Remove permission or allow requester comments |

### Edge Case Configuration Issues

| # | Issue | Severity | Proposed Fix |
|---|-------|----------|-------------|
| 6.1 | No budget_threshold: inconsistent behavior | Degraded | Align intercept with threshold check |
| 6.5 | Multi-job request premature acceptance | Blocking | Check all jobs before transitioning request |

---

## 8. Recommended Priority Order for Fixes

1. **ISSUE 6** (advanceFloatingSchedule) -- Functional bug, PM schedules broken
2. **ISSUE 6.5/5-edge** (multi-job request) -- Logic error, premature state transition
3. **ISSUE 4** (silent redirect feedback) -- Confusing UX on common path
4. **ISSUE 10** (approval queue actions) -- High-impact workflow improvement
5. **ISSUE 2** (cancel from triaged) -- User expectation mismatch
6. **ISSUE 3** (created job PIC indicator) -- Discoverability
7. **ISSUE 7** (manual pause) -- Missing functionality
8. **ISSUE 6.1** (threshold consistency) -- Edge case alignment
9. **ISSUE 1** (dead constants) -- Cleanup
10. **ISSUE 12** (permission mismatch) -- Cleanup
11. **ISSUE 9** (dead code) -- Cleanup
