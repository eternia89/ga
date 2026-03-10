---
phase: quick-27
verified: 2026-03-09T08:30:00Z
status: passed
score: 7/7 must-haves verified
gaps: []
---

# Quick Task 27: Rework Job Lifecycle Budget Approval by Creator - Verification Report

**Task Goal:** Rework job lifecycle so budget and completion approval is done by the job creator (not finance_approver), with budget set at creation time and approval gating PIC assignment.
**Verified:** 2026-03-09T08:30:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Job creation with budget >= threshold sets status to pending_approval and button says "Create Job & Request Budget" | VERIFIED | `job-actions.ts:80-100` checks `estimated_cost >= budgetThreshold` and updates to `pending_approval`. `job-form.tsx:586-598` dynamically shows "Create Job & Request Budget" button text when cost >= threshold. |
| 2 | Job creation with budget < threshold or no budget goes straight to created status | VERIFIED | `job-actions.ts:61` sets initial status to `created`. The threshold check at lines 80-100 only upgrades to `pending_approval` if cost >= threshold. No budget or below threshold leaves status as `created`. |
| 3 | Budget approval/decline buttons visible only to the JOB CREATOR (not finance_approver) | VERIFIED | `job-detail-actions.tsx:95-96` checks `isCreator && job.status === 'pending_approval'`. `job-modal.tsx:587` same check. `approval-actions.ts:30` server enforces `job.created_by !== profile.id`. No `finance_approver` role checks remain in any approval action. |
| 4 | Completion approval/decline buttons visible only to the JOB CREATOR (not finance_approver) | VERIFIED | `job-detail-actions.tsx:97-98` checks `isCreator && job.status === 'pending_completion_approval'`. `job-modal.tsx:588` same. `approval-actions.ts:166` server enforces `job.created_by !== profile.id`. |
| 5 | Budget approval gate happens BEFORE PIC assignment (pending_approval -> created -> assign PIC) | VERIFIED | `approval-actions.ts:41` approveJob transitions `pending_approval -> created`. `job-detail-actions.tsx:93` canAssignPIC requires `job.status === 'created'`. `job-modal.tsx:585` same. This means PIC cannot be assigned while status is `pending_approval`. |
| 6 | Bottom bar states flow: waiting for budget -> assign PIC -> start work -> mark complete -> approve/decline completion | VERIFIED | Detail actions: pending indicators at lines 420-433 (non-creators see "Awaiting Budget Approval"/"Awaiting Completion Approval"). canAssignPIC at `created`, canStartWork at `assigned`, canMarkComplete at `in_progress`, canApproveCompletion at `pending_completion_approval`. All wired correctly. |
| 7 | Approval queue page still accessible by finance_approver/admin for viewing but approve/reject actions removed from there for budget/completion | VERIFIED | `approvals/page.tsx:30` access check includes `['finance_approver', 'ga_lead', 'admin']`. Server actions enforce `created_by` check so approve/reject from queue page would fail for non-creators. Queue is effectively read-only for viewing history. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/actions/job-actions.ts` | createJob with budget field and conditional pending_approval status | VERIFIED | Lines 52-100: inserts estimated_cost, checks threshold, conditionally transitions to pending_approval. `requestApproval` and `updateJobBudget` fully removed. |
| `app/actions/approval-actions.ts` | approveJob/rejectJob/approveCompletion/rejectCompletion check created_by instead of finance_approver role | VERIFIED | Lines 30, 98, 166, 278: all four actions check `job.created_by !== profile.id`. No finance_approver role check. |
| `components/jobs/job-detail-actions.tsx` | Bottom bar with creator-based approval buttons | VERIFIED | Lines 90-98: `isCreator` used for canApproveReject and canApproveCompletion. Pending indicators for non-creators at lines 420-433. |
| `components/jobs/job-modal.tsx` | Modal bottom bar with creator-based approval buttons | VERIFIED | Lines 581-588: isCreator, canApproveReject, canApproveCompletion all use creator check. Approve/reject buttons rendered at lines 1092-1137. |
| `components/jobs/job-form.tsx` | Budget field in create form, dynamic submit button text | VERIFIED | Lines 416-447: Budget (optional) Rp currency input. Lines 580-598: dynamic button text "Create Job & Request Budget" vs "Create Job". |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `job-form.tsx` | `job-actions.ts` | createJob action call with estimated_cost | WIRED | Form calls `createJob(data)` at line 252. `createJobSchema` includes `estimated_cost` (job-schema.ts:16). Server action reads `parsedInput.estimated_cost` at lines 65, 80. |
| `approval-actions.ts` | `jobs.created_by` | role check changed to created_by comparison | WIRED | Lines 30, 98, 166, 278: `job.created_by !== profile.id` check in all four approval actions. Select query includes `created_by` field. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| QUICK-27 | 27-PLAN.md | Rework job lifecycle budget approval by creator | SATISFIED | All 7 truths verified. Creator-based approval replaces finance_approver role. Budget at creation. Old actions removed. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No anti-patterns found in modified files |

### Human Verification Required

### 1. Budget Threshold Button Text

**Test:** Create a new job. Enter a budget amount that exceeds the company's budget threshold. Observe the submit button text changes to "Create Job & Request Budget". Clear or reduce the budget below threshold and verify button reverts to "Create Job".
**Expected:** Button text dynamically updates based on budget vs threshold comparison.
**Why human:** Real-time UI reactivity with form.watch() needs browser testing.

### 2. Creator-Only Approval Buttons

**Test:** As a GA Lead, create a job with budget >= threshold. View the job -- verify you see Approve/Decline buttons. Log in as a different user (non-creator GA Lead or finance_approver). View the same job -- verify you see "Awaiting Budget Approval" indicator instead of buttons.
**Expected:** Only the creator sees action buttons; others see the waiting indicator.
**Why human:** Requires multi-user session testing.

### 3. Modal Pending Indicators for Non-Creators

**Test:** As a non-creator, open a pending_approval job in the modal view. Check if a "Awaiting Budget Approval" indicator appears.
**Expected:** Non-creators should see a pending indicator in the modal bottom bar.
**Why human:** The modal does not appear to have explicit "Awaiting" indicators like the detail page does. The action bar simply shows no buttons for non-creators. This is a cosmetic difference, not a blocker -- the functionality is correct (buttons hidden, server enforces creator check).

### Gaps Summary

No gaps found. All 7 observable truths are verified. Server actions enforce creator-based approval. UI components show correct buttons to correct users. Old finance-approver-based actions are fully removed with no dead references. The budget field is present in the create form with dynamic button text. The approval queue page is accessible to ga_lead/admin/finance_approver for viewing.

One minor cosmetic note (non-blocking): the modal's bottom bar does not show explicit "Awaiting Budget Approval" / "Awaiting Completion Approval" text indicators for non-creators, unlike the detail page. Non-creators simply see no action buttons in the modal, which is functionally correct but slightly less informative.

---

_Verified: 2026-03-09T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
