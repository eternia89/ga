---
phase: quick-27
plan: 1
subsystem: jobs-approvals
tags: [approval-flow, creator-based, budget, lifecycle]
dependency_graph:
  requires: []
  provides: [creator-based-approval, budget-at-creation]
  affects: [job-actions, approval-actions, job-form, job-detail, job-modal, approvals-page]
tech_stack:
  added: []
  patterns: [creator-based-approval-check, budget-threshold-at-creation]
key_files:
  created: []
  modified:
    - app/actions/job-actions.ts
    - app/actions/approval-actions.ts
    - lib/validations/job-schema.ts
    - components/jobs/job-form.tsx
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-modal.tsx
    - components/jobs/job-create-dialog.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/approvals/page.tsx
decisions:
  - "approveJob transitions pending_approval -> created (not in_progress) to enable PIC assignment flow"
  - "rejectJob transitions pending_approval -> created with rejection data preserved"
  - "Budget set at job creation time only; no mid-flow budget request by PIC"
  - "Approval queue page expanded to ga_lead access for viewing history"
metrics:
  duration_minutes: 10
  completed: "2026-03-09T07:54:43Z"
---

# Quick Task 27: Rework Job Lifecycle Budget Approval by Creator

Reworked the entire job approval lifecycle so the job creator (typically GA Lead) approves budgets and completions, replacing the old finance_approver role-based flow. Budget is now set at job creation time with conditional pending_approval routing.

## Changes Made

### Task 1: Server Actions Rework (1acc90a)

**job-schema.ts:**
- Added `estimated_cost: z.number().min(0).optional()` to `createJobSchema`

**job-actions.ts:**
- `createJob` now accepts `estimated_cost`, inserts it with the job, then checks if `estimated_cost >= budget_threshold` to conditionally transition to `pending_approval`
- Removed auto-transition logic in `updateJob` that routed to `pending_approval` when cost changed on in_progress jobs
- Removed `pending_approval` from `updateJobStatus` schema enum and valid transitions
- Completion approval notification now targets job creator instead of finance_approver
- Removed `requestApproval` action entirely
- Removed `updateJobBudget` action entirely

**approval-actions.ts:**
- `approveJob`: Changed from `finance_approver` role check to `job.created_by === profile.id`; status transition changed from `pending_approval -> in_progress` to `pending_approval -> created`
- `rejectJob`: Changed from `finance_approver` role check to `job.created_by === profile.id`; status transition changed to `pending_approval -> created` with rejection data
- `approveCompletion`: Changed from `finance_approver` role check to `job.created_by === profile.id`
- `rejectCompletion`: Changed from `finance_approver` role check to `job.created_by === profile.id`
- Notifications now target PIC instead of finance_approver role
- Removed `submitForApproval` action
- Removed `unapproveJob` action

### Task 2: UI Updates (8600294)

**job-form.tsx:**
- Added budget field (Rp currency input) to the create form after Priority
- Dynamic submit button: shows "Create Job & Request Budget" when budget >= threshold
- Added `companyBudgetThreshold` prop for threshold-aware button text

**job-detail-actions.tsx:**
- `canApproveReject` now checks `job.created_by === currentUserId` instead of `isFinanceApproverOrAdmin`
- `canApproveCompletion` now checks `job.created_by === currentUserId` instead of `isFinanceApproverOrAdmin`
- Removed `canRequestApproval`, cost input, and Request Approval button
- Pending indicators shown to non-creators instead of non-finance-approvers
- Removed `hasPendingBudget` gate on `canMarkComplete`

**job-modal.tsx:**
- Mirrored all permission changes from job-detail-actions.tsx
- Removed Request Approval UI from bottom bar
- Accepts and passes `companyBudgetThreshold` to JobForm in create mode
- Removed unused Input/formatNumber imports and costValue state

**job-create-dialog.tsx:**
- Added `companyBudgetThreshold` prop, passes through to JobModal

**jobs/page.tsx:**
- Fetches `budget_threshold` from company_settings in parallel with existing queries
- Passes `companyBudgetThreshold` to JobCreateDialog

**approvals/page.tsx:**
- Access expanded from `['finance_approver', 'admin']` to `['finance_approver', 'ga_lead', 'admin']`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compilation: PASSED
- Build: PASSED
- Lint: No new errors (pre-existing issues only)
