---
phase: quick-19
verified: 2026-03-09T12:00:00Z
status: passed
score: 7/7 must-haves verified
gaps: []
human_verification:
  - test: "Create a job and verify form has no PIC or cost fields"
    expected: "Only title, description, location, category, priority, linked requests shown"
    why_human: "Visual confirmation of form layout"
  - test: "Full lifecycle: Create -> Assign PIC -> Request Approval (cost=0) -> Start Work"
    expected: "Auto-approve skips pending_approval, Start Work button appears immediately"
    why_human: "End-to-end flow with real data and role switching"
  - test: "Full lifecycle: Create -> Assign PIC -> Request Approval (cost>0) -> Finance approves -> Start Work"
    expected: "Goes through pending_approval, returns to assigned after approval, then Start Work available"
    why_human: "Multi-role flow requires role switching in browser"
---

# Quick Task 19: Rework Job Flow Verification Report

**Phase Goal:** Rework job flow so cost approval happens before work starts. New lifecycle: Create (no PIC/cost) -> Assign PIC -> PIC fills cost -> Approval (auto-approve if cost=0) -> Start Work.
**Verified:** 2026-03-09
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Job creation form has NO PIC and NO estimated cost fields | VERIFIED | `job-form.tsx` lines 411-433 and 436-469: both fields wrapped in `{mode === 'edit' && (...)}`. `createJobSchema` (lines 6-17) has no `assigned_to` or `estimated_cost`. |
| 2 | GA Lead sees PIC Combobox + Assign button when status=created | VERIFIED | `job-modal.tsx` line 584: `canAssignPIC = isGaLeadOrAdmin && job?.status === 'created'`; line 1070: renders Combobox + Assign button. `job-detail-actions.tsx` line 94: same flag; lines 337-353: same UI. |
| 3 | PIC sees cost input + Request Approval button when status=assigned and NOT approved | VERIFIED | `job-modal.tsx` line 585: `canRequestApproval = isPIC && job?.status === 'assigned' && !job?.approved_at`; line 1089: renders Rp-prefixed input + Request Approval button. `job-detail-actions.tsx` line 95: same flag; lines 356-378: same UI. |
| 4 | PIC sees Start Work button only when status=assigned AND approved_at is set | VERIFIED | `job-modal.tsx` line 586: `canStartWork = isPIC && job?.status === 'assigned' && !!job?.approved_at`. `job-detail-actions.tsx` line 96: same condition. Server-side gate at `job-actions.ts` line 337: throws error if `!job.approved_at`. |
| 5 | Finance approval transitions job to assigned (not in_progress) | VERIFIED | `approval-actions.ts` line 133: `status: 'assigned'` in approveJob update. Notification body (line 150): "Budget approved -- PIC can now start work". |
| 6 | Finance rejection transitions job to assigned (not in_progress) | VERIFIED | `approval-actions.ts` line 202: `status: 'assigned'` in rejectJob update. `job-detail-actions.tsx` line 230: feedback says "Returned to Assigned". |
| 7 | Cost=0 auto-approves instantly without going to pending_approval | VERIFIED | `job-actions.ts` lines 528-543: `requestApproval` checks `estimated_cost === 0`, sets `approved_at = now` without changing status, returns `autoApproved: true`. Status stays `assigned`. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/validations/job-schema.ts` | createJobSchema without assigned_to and estimated_cost | VERIFIED | Lines 6-17: only title, description, location_id, category_id, priority, linked_request_ids |
| `app/actions/job-actions.ts` | createJob without PIC/cost, requestApproval action, canStartWork gate | VERIFIED | createJob inserts status:'created' (line 61), no PIC/cost. requestApproval at lines 498-598. approved_at gate at line 337. |
| `app/actions/approval-actions.ts` | approveJob->assigned, rejectJob->assigned | VERIFIED | approveJob line 133: status:'assigned'. rejectJob line 202: status:'assigned'. |
| `components/jobs/job-modal.tsx` | Status-dependent bottom bar with PIC assign, cost input, request approval | VERIFIED | Permission flags at lines 584-586. UI sections at lines 1070+ for assign and 1089+ for cost/approval. Imports assignJob, requestApproval at lines 19-20. |
| `components/jobs/job-form.tsx` | PIC and cost fields hidden in create mode | VERIFIED | Lines 411 and 436: `{mode === 'edit' && (...)}` wrapping both fields. Schema resolver at line 186 uses createJobSchema for create mode. |
| `components/jobs/job-detail-actions.tsx` | Updated canStartWork with approved_at gate, PIC assign and cost sections | VERIFIED | Lines 94-96: canAssignPIC, canRequestApproval, canStartWork flags. Lines 337-378: Combobox + Assign and cost + Request Approval UI. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| job-modal.tsx | job-actions.ts | requestApproval action call | WIRED | Import at line 20, handler at line 738 calls `requestApproval({ job_id, estimated_cost })` |
| approval-actions.ts | jobs table | approveJob sets status=assigned + approved_at | WIRED | Line 133: `status: 'assigned'`, line 134: `approved_at: new Date().toISOString()` |
| job-modal.tsx | canStartWork | approved_at gate check | WIRED | Line 586: `!!job?.approved_at` in permission flag. Server gate at job-actions.ts line 337. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| job-actions.ts | 400-408 | TODO(PM-INTEGRATION) comment | Info | Pre-existing PM integration placeholder, unrelated to this task |

### Human Verification Required

### 1. Create Job Form Fields

**Test:** Create a new job and inspect the form
**Expected:** Only title, description, location, category, priority, and linked requests fields visible. No PIC or cost fields.
**Why human:** Visual layout confirmation

### 2. Full Lifecycle (Zero Cost)

**Test:** Create job -> Assign PIC (as GA Lead) -> Request Approval with cost=0 (as PIC) -> Start Work
**Expected:** After requesting approval with 0 cost, auto-approve message shown, Start Work button appears without finance involvement
**Why human:** Multi-role flow with real-time UI state changes

### 3. Full Lifecycle (Positive Cost)

**Test:** Create job -> Assign PIC -> Request Approval with cost > 0 -> Finance approves -> PIC starts work
**Expected:** Status goes created -> assigned -> pending_approval -> assigned (with approved_at set) -> in_progress
**Why human:** Requires role switching between PIC and finance approver

---

_Verified: 2026-03-09_
_Verifier: Claude (gsd-verifier)_
