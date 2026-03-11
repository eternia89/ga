---
phase: quick-48
verified: 2026-03-11T00:00:00Z
status: human_needed
score: 6/6 must-haves verified
human_verification:
  - test: "Log in as ga_staff — open a submitted request, click Triage, confirm PIC dropdown shows only themselves"
    expected: "Only the current ga_staff user appears in the PIC dropdown; submit succeeds and request moves to triaged"
    why_human: "UI rendering and form submission flow cannot be verified programmatically"
  - test: "Log in as ga_staff — open a triaged request, confirm no Triage / Edit Triage button is visible"
    expected: "No triage or reject button appears for ga_staff on triaged requests"
    why_human: "Conditional rendering dependent on runtime role + status combination"
  - test: "Log in as ga_staff — navigate to Jobs page, confirm New Job button is visible and functional"
    expected: "JobCreateDialog opens and a job can be created successfully"
    why_human: "UI visibility and dialog flow require browser verification"
  - test: "Log in as ga_lead — open a submitted or triaged request, confirm full PIC dropdown (all company users) and both submitted + triaged are triageable"
    expected: "GA Lead retains unchanged full triage capability; no regression"
    why_human: "Role-based rendering regression requires browser verification"
---

# Quick Task 48: GA Staff Self-Assign Triage and Job Create — Verification Report

**Phase Goal:** GA Staff should be able to self-assign requests (triage to themselves as PIC) without needing GA Lead to triage first. GA Staff should also be able to create new jobs. Update permissions, RLS policies, and UI guards accordingly.
**Verified:** 2026-03-11
**Status:** human_needed (all automated checks passed)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GA Staff can self-assign a submitted request (triage to themselves as PIC) without GA Lead | VERIFIED | `request-actions.ts` line 127: `isGaStaff` branch allows ga_staff in triageRequest; UI canTriage includes `(isGaStaff && request.status === 'submitted')` |
| 2 | GA Staff cannot triage already-triaged requests — only submitted-status requests | VERIFIED | `request-actions.ts` line 145: `if (isGaStaff && request.status !== 'submitted') throw`; UI canTriage for ga_staff uses `request.status === 'submitted'` (not array-includes with 'triaged') |
| 3 | GA Staff cannot assign a request to a different user — only to themselves | VERIFIED | `request-actions.ts` line 150: `if (isGaStaff && parsedInput.data.assigned_to !== profile.id) throw`; `request-detail-info.tsx` line 147-148: `picOptions` filters to `u.value === currentUserId` for ga_staff |
| 4 | GA Staff cannot reject requests (reject remains GA Lead/Admin only) | VERIFIED | `request-detail-actions.tsx` line 45: `canReject` uses `isGaLeadOrAdmin` only — ga_staff excluded |
| 5 | GA Staff can create new jobs via the New Job button on the jobs page | VERIFIED | `job-actions.ts` line 22: `['ga_lead', 'admin', 'ga_staff'].includes(profile.role)`; `jobs/page.tsx` line 220: CTA guard includes `ga_staff` |
| 6 | GA Lead retains full triage capability (assign to any user, any triageable status) | VERIFIED | `request-detail-actions.tsx`: `isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request.status)` OR branch unchanged; picOptions unrestricted for non-ga_staff |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/auth/permissions.ts` | JOB_CREATE and JOB_ASSIGN added to ga_staff; no REQUEST_SELF_ASSIGN | VERIFIED | Lines 77-78: `JOB_CREATE`, `JOB_ASSIGN` present in ga_staff array. `REQUEST_SELF_ASSIGN` absent (intentional). |
| `app/actions/request-actions.ts` | triageRequest allows ga_staff on submitted requests only; enforces assigned_to === profile.id | VERIFIED | Lines 126-150: two-branch check with status guard and self-assign guard both present |
| `app/actions/job-actions.ts` | createJob allows ga_staff role | VERIFIED | Line 22: `['ga_lead', 'admin', 'ga_staff']` |
| `supabase/migrations/00019_ga_staff_permissions.sql` | job_requests INSERT policy expanded to include ga_staff | VERIFIED | Drops old policy, creates `job_requests_insert_lead_admin_staff` with `current_user_role() IN ('ga_lead', 'admin', 'ga_staff')` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| triageRequest action | ga_staff branch | `profile.role === 'ga_staff'` enforces status === 'submitted' AND assigned_to === profile.id | WIRED | Lines 127, 145, 150 of request-actions.ts all present and connected |
| request-detail-actions.tsx canTriage | ga_staff self-assign UI | `isGaStaff && request.status === 'submitted'` | WIRED | Line 37 declares `isGaStaff`; line 44 uses it in canTriage OR-branch |
| request-detail-info.tsx canTriage | ga_staff self-assign UI | `isGaStaff && request.status === 'submitted'` | WIRED | Line 82 declares `isGaStaff`; line 87 uses it in canTriage; line 147-148 picOptions filter; line 233 passes `picOptions` to Combobox |
| jobs/page.tsx CTA guard | JobCreateDialog render | `['ga_lead', 'admin', 'ga_staff'].includes(profile.role)` | WIRED | Line 220: guard confirmed; line 221: JobCreateDialog rendered inside it |

### Requirements Coverage

No requirement IDs declared in plan frontmatter (`requirements: []`). This is a quick task with no formal requirement mapping.

### Anti-Patterns Found

None detected. No TODO/FIXME/placeholder comments, no empty implementations, no stub returns in modified files.

### Human Verification Required

#### 1. GA Staff triage flow — submitted request

**Test:** Log in as ga_staff user. Navigate to a request with status `submitted`. Verify "Triage" button is visible. Open triage form — PIC dropdown should show only the current user. Submit.
**Expected:** Request moves to `triaged` with the ga_staff user as PIC. Success message appears.
**Why human:** UI conditional rendering and form submission with real Supabase RLS enforcement requires browser.

#### 2. GA Staff triage blocked on triaged request

**Test:** Log in as ga_staff user. Navigate to a request with status `triaged`. Verify no Triage / Edit Triage button is visible. Verify no Reject button is visible.
**Expected:** Neither button appears for ga_staff on a triaged request.
**Why human:** Runtime role + status combination rendering requires browser.

#### 3. GA Staff job creation

**Test:** Log in as ga_staff user. Navigate to Jobs page. Verify "New Job" button is visible. Click it and create a job.
**Expected:** JobCreateDialog opens. Job is created successfully.
**Why human:** UI visibility and Supabase INSERT RLS policy enforcement requires browser.

#### 4. GA Lead regression check

**Test:** Log in as ga_lead. Open both a submitted and a triaged request. Verify full PIC dropdown (all company users). Verify Triage button appears on both statuses. Verify Reject button appears.
**Expected:** GA Lead experience unchanged from before this task.
**Why human:** Role-based rendering regression requires browser verification.

### Gaps Summary

No gaps found. All six truths are verified by source code. The implementation matches the plan exactly:
- Server-side guards in `triageRequest` enforce both the status constraint and the self-assign constraint for ga_staff
- UI `canTriage` correctly uses an OR-branch with status === 'submitted' for ga_staff (not array-includes with 'triaged')
- `picOptions` restricts the PIC Combobox to self-only for ga_staff
- Default form value pre-fills currentUserId for ga_staff
- `createJob` and the jobs page CTA both include ga_staff
- Migration 00019 expands the RLS INSERT policy for job_requests

Four items flagged for human verification cover the runtime browser behavior that cannot be verified statically.

---

_Verified: 2026-03-11_
_Verifier: Claude (gsd-verifier)_
