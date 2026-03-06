---
phase: quick-20
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/quick/20-test-all-flow-of-request-jobs-approvals-/20-DEADLOCK-ANALYSIS.md
autonomous: true
requirements: [QUICK-20]

must_haves:
  truths:
    - "Every status in every state machine (request, job, asset, schedule) is audited for available UI actions per role"
    - "Deadlocks (states where no role can progress the entity) are identified with root cause"
    - "Edge cases (missing config, unassigned PIC, no finance approver) are analyzed"
    - "Each finding includes affected role(s), current state, what is missing, and proposed fix"
  artifacts:
    - path: ".planning/quick/20-test-all-flow-of-request-jobs-approvals-/20-DEADLOCK-ANALYSIS.md"
      provides: "Complete deadlock analysis document"
      min_lines: 100
  key_links: []
---

<objective>
Audit every status transition in the request, job, approval, asset, and maintenance flows by tracing server actions and UI action components. Identify deadlocks where the UI does not provide action buttons for a valid next transition, or where a status is unreachable/stuck. Document all findings with role, state, root cause, and proposed fix.

Purpose: Identify all flow-blocking issues before implementing fixes, so the user can review and prioritize.
Output: A detailed deadlock analysis document at `20-DEADLOCK-ANALYSIS.md`.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/20-test-all-flow-of-request-jobs-approvals-/20-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Trace all state machines and map UI actions per status per role</name>
  <files>
    lib/constants/request-status.ts,
    lib/constants/job-status.ts,
    lib/constants/asset-status.ts,
    lib/constants/schedule-status.ts,
    lib/auth/permissions.ts,
    app/actions/request-actions.ts,
    app/actions/job-actions.ts,
    app/actions/approval-actions.ts,
    app/actions/asset-actions.ts,
    app/actions/pm-job-actions.ts,
    app/actions/schedule-actions.ts,
    components/requests/request-detail-actions.tsx,
    components/jobs/job-detail-actions.tsx,
    components/assets/asset-detail-actions.tsx,
    components/approvals/approval-queue.tsx
  </files>
  <action>
For each entity type (request, job, asset, inventory movement, maintenance schedule), systematically:

1. List ALL possible statuses from the constants files.
2. For each status, identify which server actions accept it as a valid current state (the `from` side of transitions).
3. For each status, check the UI component that renders action buttons (request-detail-actions.tsx, job-detail-actions.tsx, asset-detail-actions.tsx, approval-queue.tsx) and verify that the UI exposes the action for each valid transition.
4. For each status, check PER ROLE (general_user, ga_staff, ga_lead, finance_approver, admin) whether that role can see and execute the action.
5. Flag any status where NO role has a UI button to transition out of it (deadlock).
6. Flag any transition that exists in server actions but has no UI trigger.
7. Flag edge cases: what happens when budget_threshold is not configured, when no finance_approver exists in the company, when PIC is not assigned, when a job has no linked requests.

Key areas to audit deeply:

**Request flow:** submitted -> triaged -> in_progress -> (various job paths) -> pending_acceptance -> accepted -> closed. Check: Can requester cancel from triaged? What happens to request if linked job is cancelled? What if request is in_progress but all linked jobs are cancelled?

**Job flow:** created -> assigned -> in_progress -> pending_approval -> in_progress (approved) -> completed OR pending_completion_approval -> completed -> (request moves to pending_acceptance). Check: Can a `created` job with no PIC be progressed? What if assigned PIC starts work but budget auto-routes to pending_approval -- does the transition from assigned to pending_approval work? The valid transitions map shows `assigned: ['in_progress', 'pending_approval']` but the updateJobStatus code intercepts `in_progress` and redirects to `pending_approval` when estimated_cost > 0 -- does this produce a valid transition or an error?

**Approval flow:** Check that finance_approver can see pending jobs in approval queue AND has action buttons on job detail page. Check what happens if budget is rejected -- does PIC see the rejection reason? Can PIC resubmit?

**Asset flow:** Check all status transitions have UI buttons. Check transfer flow (pending -> accepted/rejected/cancelled). Check that schedule pause/resume hooks work correctly.

**Maintenance flow:** Check that PM jobs follow the same job status flow. Check that floating schedule advance is actually called (note the TODO comment in job-actions.ts). Check schedule pause/resume/deactivate UI.

Also check the request-detail-client, job-detail-client, and their parent page.tsx files to verify the action components actually receive the correct props and are rendered.
  </action>
  <verify>
    <automated>echo "Code review task -- verify output file exists and has substantial content" && test -f ".planning/quick/20-test-all-flow-of-request-jobs-approvals-/20-DEADLOCK-ANALYSIS.md" && wc -l ".planning/quick/20-test-all-flow-of-request-jobs-approvals-/20-DEADLOCK-ANALYSIS.md" | awk '{if ($1 >= 100) print "PASS: " $1 " lines"; else {print "FAIL: only " $1 " lines"; exit 1}}'</automated>
  </verify>
  <done>
    20-DEADLOCK-ANALYSIS.md exists with:
    - A status-by-status audit table for each entity type showing available actions per role
    - A numbered list of deadlocks/issues found, each with: description, affected role(s), current state, what is missing, severity (blocking/degraded/cosmetic), and proposed fix
    - Edge case analysis section covering missing config, missing roles, unassigned PIC scenarios
    - No fixes implemented -- document only
  </done>
</task>

</tasks>

<verification>
- 20-DEADLOCK-ANALYSIS.md exists and is comprehensive (100+ lines)
- Every status in every state machine is covered
- Each finding has a clear proposed fix
- No code changes were made -- analysis only
</verification>

<success_criteria>
- All 5 entity state machines (request, job, asset, movement, schedule) are fully audited
- All 5 roles are checked against each status
- All deadlocks and missing UI actions are documented with severity and proposed fix
- Edge cases (no budget threshold, no finance approver, no PIC, no linked requests) are analyzed
</success_criteria>

<output>
After completion, create `.planning/quick/20-test-all-flow-of-request-jobs-approvals-/20-SUMMARY.md`
</output>
