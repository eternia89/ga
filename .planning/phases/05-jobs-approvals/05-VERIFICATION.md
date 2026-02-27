---
phase: 05-jobs-approvals
verified: 2026-02-27T03:10:00Z
status: passed
score: 20/20 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 16/16
  gaps_closed:
    - "Detail page content centered on wide monitors — mx-auto on max-w-[1000px] containers in both job and request detail pages (05-14)"
    - "INTERNAL_FIELDS blocklist filters updated_at/created_at/deleted_at and approval/feedback timestamps from timeline events in both detail pages (05-14)"
    - "Timeline auto-scrolls to bottom on page load via useRef + useEffect — newest entry visible by default (05-14)"
    - "Timeline containers are height-constrained with overflow-y-auto scroll (05-14)"
    - "Approval list defaults to all statuses (pending+approved+rejected) sorted by date descending — pendingOnly state replaces old showHistory inversion (05-15)"
    - "Feedback dialog auto-opens after accepting work — feedbackOpen state lifted from RequestDetailActions to RequestDetailClient to survive router.refresh() (05-15)"
  gaps_remaining: []
  regressions:
    - "submitForApproval action is dead code — exported from approval-actions.ts but called from no component. Budget approval always triggered via updateJobBudget when estimated cost is changed."
    - "assignJob action is dead code — exported from job-actions.ts but called from no component. PIC assignment happens via updateJob with assigned_to field from job-detail-info.tsx."
    - "Budget threshold from company_settings is only checked in the completion approval path (updateJobStatus), NOT in the budget submission path (updateJobBudget). Any positive estimated cost always routes to pending_approval regardless of threshold."
gaps: []
human_verification:
  - test: "Navigate to /jobs/new?request_id={a real triaged request ID} as GA Lead"
    expected: "Form title, description, location, category, and priority pre-populated from the request; that request appears as a chip in the Linked Requests field"
    why_human: "Requires live Supabase connection with real request data; dynamic prefill cannot be verified from static code alone"
  - test: "On an in_progress job, click Edit, change Estimated Cost to any positive value, click Save"
    expected: "Job transitions to pending_approval; it appears in Finance Approver queue with Budget type badge. Note: no threshold check — any positive cost triggers approval."
    why_human: "Requires live DB to verify updateJobBudget server action triggers the status transition"
  - test: "Set budget_threshold in Company Settings, mark a job with estimated_cost >= threshold complete"
    expected: "Job transitions to pending_completion_approval (not directly to completed); appears in Finance Approver queue with Completion type badge"
    why_human: "Requires live DB rows for company_settings and an approved job with estimated_cost set"
  - test: "On a request in pending_acceptance status, click Accept Work and confirm"
    expected: "Request moves to accepted; feedback dialog opens automatically (300ms delay); submitting stars sets feedback_rating on request"
    why_human: "Stateful dialog chaining (feedbackOpen lifted to RequestDetailClient, opened via setTimeout after router.refresh()) requires live interaction to verify timing"
  - test: "As requester, reject completed work with a reason on a request with one linked job"
    expected: "Request returns to in_progress with acceptance_rejected_reason stored; linked job status reverts to in_progress"
    why_human: "Cross-table cascading updates require live DB to verify end-to-end"
  - test: "Open /approvals as Finance Approver with a job having estimated_cost of 1500000"
    expected: "Cost renders as Rp 1.500.000 (Indonesian dot thousands separator). All approval rows visible by default sorted newest first. Show pending only checkbox filters to pending items."
    why_human: "IDR formatting and sort order require visual inspection of rendered UI"
  - test: "On a pending_completion_approval job, click Approve Completion"
    expected: "Job transitions to completed; linked requests move to pending_acceptance status"
    why_human: "Cross-table cascading updates require live DB to verify end-to-end"
---

# Phase 5: Jobs & Approvals Verification Report

**Phase Goal:** GA Leads can create and assign jobs (from requests or standalone), GA Staff can execute them through a tracked workflow, the CEO can approve/reject budget-related requests, and completed work flows through the acceptance cycle.
**Verified:** 2026-02-27
**Status:** PASSED
**Re-verification:** Yes — fourth verification, after plans 05-14 and 05-15 (UAT gap closure round 2)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GA Lead can create a job from a request with pre-filled fields | VERIFIED | `app/(dashboard)/jobs/new/page.tsx` accepts `?request_id=` param; `job-form.tsx` has `prefillRequest` prop wired to form defaultValues |
| 2 | GA Lead can create a standalone job without a linked request | VERIFIED | `createJobSchema` has `linked_request_ids` defaulting to `[]`; form operates without prefill param |
| 3 | GA Lead can link multiple requests via searchable multi-select with chip display | VERIFIED | `job-form.tsx` lines 414-466: Combobox for request search + chip render loop with X button; createJob inserts into job_requests join table |
| 4 | Job list page shows all jobs with filters (status, PIC, priority, date range) | VERIFIED | `components/jobs/job-filters.tsx` (179 lines) + `job-table.tsx` with nuqs URL-synced state |
| 5 | Job list has all required columns (ID, title, status, PIC, priority, linked request, created) | VERIFIED | `job-columns.tsx` (173 lines): display_id column, dd-MM-yyyy date format via date-fns |
| 6 | Job detail shows full info panel with PIC as inline Combobox and IDR cost field | VERIFIED | `job-detail-info.tsx` lines 206-264: PIC Combobox in edit mode; estimated cost field with formatIDR from @/lib/utils |
| 7 | Unified timeline displays status changes, comments, approvals, rejections chronologically | VERIFIED | `job-timeline.tsx` line 208: sort by timestamp ascending |
| 8 | GA Lead and assigned PIC can post comments with optional single photo | VERIFIED | `job-comment-form.tsx` (204 lines): imports addJobComment; calls then POSTs to /api/uploads/job-photos |
| 9 | Status action buttons appear based on user role and current job status | VERIFIED | `job-detail-actions.tsx` (517 lines): canStartWork, canApproveReject, canApproveCompletion, canMarkComplete, canCancel, canUnapprove all computed |
| 10 | Finance Approver sees unified approval queue with both budget and completion approval types | VERIFIED | `approvals/page.tsx`: hasBudgetActivity and hasCompletionActivity flags emit separate rows; approval-queue.tsx shows Type column with Budget/Completion badges |
| 11 | Admin can configure budget threshold per company | VERIFIED | `company-settings-form.tsx`: formatNumber from @/lib/utils; useAction(updateCompanySetting); dot-separator input |
| 12 | Jobs and Approvals appear as active (non-grayed) sidebar nav items | VERIFIED | `components/sidebar.tsx`: Jobs built: true (line 43), Approvals built: true (line 50), Company Settings built: true (line 100) |
| 13 | Requester can accept or reject completed work | VERIFIED | `request-acceptance-dialog.tsx` (209 lines): imports and calls acceptRequest and rejectCompletedWork; request-detail-actions.tsx shows Accept Work / Reject Work buttons at pending_acceptance |
| 14 | Rejection sends the linked job back to In Progress status | VERIFIED | `rejectCompletedWork` in request-actions.ts: queries job_requests, updates linked jobs to status: in_progress |
| 15 | After acceptance, requester can optionally submit feedback (1-5 stars + optional comment) | VERIFIED | `feedback-star-rating.tsx` (64 lines): Lucide Star icons; `request-feedback-dialog.tsx` (173 lines): calls submitFeedback; feedback dialog auto-opens via feedbackOpen lifted to RequestDetailClient |
| 16 | Auto-accept cron function exists in the database | VERIFIED | `supabase/migrations/00008_jobs_phase5.sql`: `CREATE OR REPLACE FUNCTION public.auto_accept_completed_requests()` with INTERVAL '7 days' |
| 17 | Detail page content is horizontally centered on wide monitors | VERIFIED | `app/(dashboard)/jobs/[id]/page.tsx` line 425: `max-w-[1000px] mx-auto`; `app/(dashboard)/requests/[id]/page.tsx` line 355: `max-w-[1000px] mx-auto` |
| 18 | Activity timeline is scrollable and does not overflow past the comment section | VERIFIED | `job-detail-client.tsx` line 106: `overflow-y-auto flex-1 min-h-0`; `request-detail-client.tsx` line 100: same pattern; comment form is outside scroll container in job-detail-client.tsx |
| 19 | Timeline auto-scrolls to the bottom on page load so user sees the newest updates first | VERIFIED | `job-detail-client.tsx` lines 58-62: useEffect with scrollTop = scrollHeight, deps [timelineEvents, comments]; `request-detail-client.tsx` lines 63-67: same pattern |
| 20 | Approval list shows all statuses by default sorted by date descending | VERIFIED | `approval-queue.tsx` line 100: `useState(false)` for pendingOnly; line 103-107: `sortedJobs` sorted by `dateB.localeCompare(dateA)`; default shows all records, checkbox filters to pending-only |

**Score:** 20/20 truths verified

---

## New Artifacts from Plans 05-14 and 05-15

| Artifact | Status | Key Changes |
|----------|--------|-------------|
| `app/(dashboard)/jobs/[id]/page.tsx` | VERIFIED | mx-auto on max-w-[1000px] container (line 425); INTERNAL_FIELDS Set (lines 240-245); meaningfulFields filter (lines 409-410) |
| `app/(dashboard)/requests/[id]/page.tsx` | VERIFIED | mx-auto on max-w-[1000px] container (line 355); INTERNAL_FIELDS Set (lines 153-157); meaningfulFields filter (lines 321-322) |
| `components/jobs/job-detail-client.tsx` | VERIFIED | useRef + useEffect auto-scroll (lines 56-62); overflow-y-auto scroll container (line 106); comment form outside scroll area (lines 115-123) |
| `components/requests/request-detail-client.tsx` | VERIFIED | feedbackOpen state (line 48); handleAccepted callback (lines 54-59); onAccepted passed to RequestDetailActions (line 92); RequestFeedbackDialog rendered at client level (lines 107-113); useRef + useEffect auto-scroll (lines 61-67) |
| `components/approvals/approval-queue.tsx` | VERIFIED | pendingOnly state default false (line 100); date-descending sort (lines 103-107); filter inverted — all visible by default (lines 109-111); Show pending only checkbox (lines 119-126) |
| `components/requests/request-detail-actions.tsx` | VERIFIED | onAccepted? prop in interface (line 16); destructured and called via handleAccepted (lines 24, 66-68); Give Feedback button calls onAccepted (line 93); RequestFeedbackDialog removed (no longer rendered here) |

---

## Key Link Verification (New Links from 05-14 and 05-15)

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `app/(dashboard)/jobs/[id]/page.tsx` | timeline event generation | INTERNAL_FIELDS blocklist filter | WIRED | Lines 240-245 (const) + lines 409-410 (filter call) |
| `app/(dashboard)/requests/[id]/page.tsx` | timeline event generation | INTERNAL_FIELDS blocklist filter | WIRED | Lines 153-157 (const) + lines 321-322 (filter call) |
| `components/jobs/job-detail-client.tsx` | timeline scroll container | useRef + useEffect auto-scroll | WIRED | timelineRef (line 56) + useEffect scrollTop = scrollHeight (lines 58-62) + ref={timelineRef} (line 106) |
| `components/requests/request-detail-client.tsx` | `components/requests/request-detail-actions.tsx` | onAccepted prop callback | WIRED | handleAccepted defined at line 54; passed as onAccepted={handleAccepted} at line 92 |
| `components/requests/request-detail-client.tsx` | `components/requests/request-feedback-dialog.tsx` | feedbackOpen state + RequestFeedbackDialog render | WIRED | feedbackOpen state (line 48); setFeedbackOpen(true) in handleAccepted (line 57); RequestFeedbackDialog rendered (lines 107-113) |

---

## Previously-Verified Key Links (Regression Check — Passed)

| From | To | Via | Status |
|------|----|-----|--------|
| `app/actions/job-actions.ts` | `lib/validations/job-schema.ts` | import createJobSchema | WIRED (unchanged) |
| `app/actions/job-actions.ts` | supabase RPC | generate_job_display_id | WIRED (unchanged) |
| `components/jobs/job-detail-info.tsx` | `app/actions/job-actions.ts` | updateJobBudget on cost change | WIRED (unchanged) |
| `components/jobs/job-form.tsx` | `app/actions/job-actions.ts` | createJob call | WIRED (unchanged) |
| `components/jobs/job-detail-actions.tsx` | `app/actions/approval-actions.ts` | approveJob, rejectJob, approveCompletion, rejectCompletion | WIRED (unchanged) |
| `app/(dashboard)/approvals/page.tsx` | batch actor name lookup | uniqueActorIds -> user_profiles | WIRED (unchanged) |
| `components/approvals/approval-queue.tsx` | `lib/utils.ts` | import formatIDR | WIRED (unchanged) |
| `components/requests/request-acceptance-dialog.tsx` | `app/actions/request-actions.ts` | acceptRequest, rejectCompletedWork | WIRED (unchanged) |
| `components/requests/request-feedback-dialog.tsx` | `app/actions/request-actions.ts` | submitFeedback | WIRED (unchanged) |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| REQ-JOB-001 | 05-01 through 05-04 | Create job from request (linked) | SATISFIED | createJob action + job-form.tsx with ?request_id= param prefill; linked_request_ids inserted into job_requests join table |
| REQ-JOB-002 | 05-01 through 05-04 | Create standalone job (not linked to request) | SATISFIED | linked_request_ids defaults to [] in createJobSchema |
| REQ-JOB-003 | 05-01 through 05-04 | Auto-generate human-readable ID (JOB-YYYY-NNNN) | SATISFIED | generate_job_display_id SECURITY DEFINER function in migration 00008; called in createJob via .rpc() |
| REQ-JOB-004 | 05-01 through 05-04 | Job status workflow: Created -> Assigned -> In Progress -> Completed | SATISFIED | updateJobStatus enforces transitions; completion routes via pending_completion_approval when threshold applies |
| REQ-JOB-005 | 05-13 | GA Lead assigns/delegates jobs to GA Staff (PIC) | SATISFIED | PIC field is inline Combobox in job-detail-info.tsx edit mode; updateJob called with assigned_to |
| REQ-JOB-006 | 05-06 | Comment thread on jobs (text + optional photo) | SATISFIED | addJobComment action; job-comment-form.tsx with two-step photo upload to job-photos bucket |
| REQ-JOB-007 | 05-04 | Job list with filters (status, assignee, date range) and sorting | SATISFIED | job-filters.tsx (179 lines); job-table.tsx with client-side filtering |
| REQ-JOB-008 | 05-04, 05-14 | Job detail page with timeline and comments | SATISFIED | Full /jobs/[id] detail page; timeline now scrollable with auto-scroll, internal fields filtered (05-14) |
| REQ-JOB-009 | 05-01 through 05-04 | Link multiple requests to a single job | SATISFIED | job_requests join table; multi-request chip selector in job-form.tsx |
| REQ-APR-001 | 05-07, 05-08 | CEO approval required when request involves money/budget | SATISFIED | updateJobBudget always routes to pending_approval when estimated cost is changed |
| REQ-APR-002 | 05-09, 05-15 | Approval queue page for Finance Approver | SATISFIED | /approvals page; data table now defaults to all statuses sorted by date descending with Show pending only filter (05-15) |
| REQ-APR-003 | 05-07, 05-08 | Approve/reject with required reason on rejection | SATISFIED | rejectJob and rejectCompletion both require reason (max 1000 chars) |
| REQ-APR-004 | 05-07, 05-08 | Show estimated cost prominently in approval view | SATISFIED | approval-queue.tsx "Estimated Cost" column uses formatIDR from @/lib/utils |
| REQ-REQ-008 | 05-05 | 7-day auto-accept after completion (cron job) | SATISFIED | auto_accept_completed_requests() PLPGSQL function in migration 00008 with INTERVAL '7 days' |
| REQ-REQ-009 | 05-05 | Requester can accept or reject completed work | SATISFIED | acceptRequest + rejectCompletedWork; request-acceptance-dialog.tsx; Accept Work / Reject Work buttons at pending_acceptance |
| REQ-REQ-010 | 05-05, 05-15 | Requester feedback after acceptance (optional rating/comment) | SATISFIED | feedback-star-rating.tsx + request-feedback-dialog.tsx + submitFeedback; dialog now auto-opens after acceptance via lifted state (05-15) |
| REQ-REQ-007 | 05-14 | Request detail page with full history/timeline | SATISFIED | /requests/[id] detail page; timeline now scrollable with auto-scroll, internal fields filtered (05-14) |

**Orphaned requirements check:** REQ-JOB-010 (GPS capture on job status change) is assigned to Phase 9 in REQUIREMENTS.md — intentionally deferred. REQ-APR-005 (Approval delegation) is v2 — deferred.

---

## Anti-Patterns

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `app/actions/approval-actions.ts` | `submitForApproval` exported but never called by any component | WARNING | Dead code. Budget approval path changed: updateJobBudget in job-detail-info.tsx handles both cost setting and approval routing. Functionally: budget approval works, just without threshold gating on the submission path. |
| `app/actions/job-actions.ts` | `assignJob` exported but never called by any component | WARNING | Dead code. PIC assignment now happens via updateJob with assigned_to field from job-detail-info.tsx inline edit. |
| `app/actions/job-actions.ts` (updateJobBudget) | Always routes to pending_approval without checking budget_threshold | INFO | Setting any positive estimated cost on an in_progress job always triggers budget approval, ignoring the budget_threshold company setting. Threshold is only checked during completion (updateJobStatus). Intentional simplification per 05-13 key-decisions. |

No new anti-patterns introduced by plans 05-14 or 05-15.

---

## Human Verification Required

### 1. Pre-fill from Request Query Param

**Test:** Navigate to `/jobs/new?request_id={a real triaged request ID}` as GA Lead
**Expected:** Form title, description, location, category, and priority pre-populated from the request; that request appears as a chip in the Linked Requests field
**Why human:** Requires live Supabase connection with real request data; dynamic prefill cannot be verified from static code alone

### 2. Budget Submission via Edit Mode

**Test:** As GA Lead, open an `in_progress` job, click Edit, change Estimated Cost to any positive value, click Save
**Expected:** Job transitions to `pending_approval`; it appears in Finance Approver's queue with "Budget" type badge. Note: no threshold check — any positive cost triggers approval.
**Why human:** Requires live DB to verify updateJobBudget server action triggers status transition

### 3. Completion Approval Threshold Gate

**Test:** As Admin, set budget_threshold to Rp 1.000.000 in Company Settings. Create a job with estimated cost Rp 2.000.000. Approve budget. PIC marks job complete.
**Expected:** Job transitions to `pending_completion_approval` (not directly to `completed`); it appears in Finance Approver's queue with "Completion" type badge
**Why human:** Requires live DB rows for company_settings and an approved job with estimated_cost to verify completion approval routing

### 4. Accept Work — Immediate Feedback Prompt (Auto-Open After router.refresh)

**Test:** As requester, visit a request in `pending_acceptance` status and click Accept Work
**Expected:** Request moves to `accepted`; feedback dialog opens automatically approximately 300ms after acceptance; submitting 1-5 stars sets feedback_rating on request. The dialog must survive the router.refresh() that re-renders the server component.
**Why human:** State-lifting fix (feedbackOpen in RequestDetailClient) and setTimeout timing require live interaction to verify dialog appears correctly post-refresh

### 5. Reject Completed Work — Job Revert

**Test:** As requester, reject completed work with a reason on a request with one linked job
**Expected:** Request returns to `in_progress` with acceptance_rejected_reason stored; linked job's status reverts to `in_progress`
**Why human:** Cross-table cascading updates require live DB to verify end-to-end

### 6. Approval Queue — Default All-Status View with Date Descending Sort

**Test:** As Finance Approver, open `/approvals` with a mix of pending, approved, and rejected approval records
**Expected:** All approval rows visible by default (no filtering); newest by decision/submission date appears at top. Checking "Show pending only" narrows to pending rows only. IDR cost shows as "Rp 1.500.000" format.
**Why human:** Sort order correctness and IDR formatting require visual inspection of rendered UI with live data

### 7. Approve Completion — Linked Requests to Pending Acceptance

**Test:** On a `pending_completion_approval` job, click Approve Completion as Finance Approver
**Expected:** Job transitions to `completed`; linked requests move to `pending_acceptance` status
**Why human:** Cross-table cascading updates require live DB to verify end-to-end

---

## Regression Notes (Plans 05-14 and 05-15)

**05-14 (Detail page layout and timeline fixes):** Both job and request detail pages now center content with mx-auto. INTERNAL_FIELDS blocklist prevents timestamp-only audit log entries from appearing as generic field_update events. Timeline containers use flex + min-h-0 + overflow-y-auto for viewport-constrained scroll. useRef + useEffect auto-scroll positions viewport at the bottom (newest) on load. Job comment form remains outside the scroll container. No functional regressions — the changes are additive layout and filtering improvements.

**05-15 (Approval queue default and feedback dialog auto-open):** Approval queue renamed `showHistory` to `pendingOnly` with inverted default (false = show all). Pending-first sort removed in favor of flat date-descending sort. `feedbackOpen` state lifted from `RequestDetailActions` to `RequestDetailClient` to survive `router.refresh()` remount. `RequestFeedbackDialog` moved to parent component level. `Give Feedback` button now delegates via `onAccepted` prop. No functional regressions — feedbackOpen state now reliably opens the dialog post-refresh.

---

## Gaps Summary

No functional gaps. All 20 must-have truths verified against actual codebase. The 4 new truths from plans 05-14 and 05-15 are all VERIFIED with direct code evidence. All 16 previously-verified truths show no regressions. Commits 3f0037f, 9328c49, 8febca0, and 3796f8c all verified in git log. Requirements REQ-JOB-008, REQ-REQ-007, REQ-APR-002, and REQ-REQ-010 all confirmed Complete in REQUIREMENTS.md.

Three persistent anti-patterns from 05-13 (2 dead code exports, 1 design behavior change) remain noted but do not block the phase goal.

---

_Verified: 2026-02-27_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — fourth verification, after plans 05-14 and 05-15 gap closure_
