---
phase: quick-20
verified: 2026-03-09T12:00:00Z
status: passed
score: 4/4 must-haves verified
re_verification: false
---

# Quick-20: Swap Order — Start Work Before Cost Approval — Verification Report

**Task Goal:** Swap order so PIC starts work first (assigned -> in_progress), then fills cost + requests approval during in_progress. Remove estimated_cost from form body. canStartWork no longer requires approved_at.
**Verified:** 2026-03-09
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PIC can start work on assigned job without needing approval first | VERIFIED | `canStartWork = isPIC && job?.status === 'assigned'` in both job-modal.tsx:585 and job-detail-actions.tsx:95 — no approved_at check. updateJobStatus in job-actions.ts has no approved_at gate blocking assigned->in_progress transition. |
| 2 | PIC fills estimated cost and requests approval while job is in_progress | VERIFIED | requestApproval in job-actions.ts:517 requires `job.status !== 'in_progress'` guard. canRequestApproval in modal (line 586) and detail (line 96) checks `status === 'in_progress' && !approved_at`. |
| 3 | Approved/rejected jobs return to in_progress (not assigned) | VERIFIED | approveJob in approval-actions.ts:133 sets `status: 'in_progress'`. rejectJob in approval-actions.ts:202 sets `status: 'in_progress'`. |
| 4 | estimated_cost field does not appear in job form body | VERIFIED | No `<FormField>` for estimated_cost renders in job-form.tsx JSX. Type definition and default value references remain for edit-mode data hydration but no visible input field is rendered in the form. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/actions/job-actions.ts` | Updated status transition logic, no approved_at gate | VERIFIED | assigned->in_progress allowed without approved_at; requestApproval requires in_progress |
| `app/actions/approval-actions.ts` | Updated approval/rejection target status | VERIFIED | Both approveJob and rejectJob set status to 'in_progress' |
| `components/jobs/job-modal.tsx` | Reordered bottom bar actions | VERIFIED | canStartWork simplified, cost input in in_progress block |
| `components/jobs/job-detail-actions.tsx` | Reordered bottom bar actions (detail page) | VERIFIED | Mirrors modal changes |
| `components/jobs/job-form.tsx` | No estimated_cost field | VERIFIED | No FormField renders for estimated_cost |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| job-actions.ts updateJobStatus | job-modal.tsx canStartWork | status === assigned without approved_at check | WIRED | Both server and client allow start work without approval |
| job-actions.ts requestApproval | approval-actions.ts approve/reject | in_progress -> pending_approval -> in_progress cycle | WIRED | requestApproval requires in_progress (line 517); approve/reject return to in_progress |

### Anti-Patterns Found

None found that block goal achievement.

### Human Verification Required

### 1. Visual flow order in UI

**Test:** As PIC, view an assigned job. Verify only "Start Work" button appears. Click it. Verify cost input + "Request Approval" appears in the in_progress state.
**Expected:** Assigned shows only Start Work; in_progress (unapproved) shows cost input + Request Approval; in_progress (approved) shows Mark Complete.
**Why human:** Visual layout and button ordering can only be confirmed in browser.

---

_Verified: 2026-03-09_
_Verifier: Claude (gsd-verifier)_
