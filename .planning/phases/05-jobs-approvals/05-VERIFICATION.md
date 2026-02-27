---
phase: 05-jobs-approvals
verified: 2026-02-27T00:00:00Z
status: passed
score: 16/16 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 16/16
  gaps_closed:
    - "Approval queue refactored from tabs to data table with checkbox history filter (05-09)"
    - "Completion approval dual flow added — pending_completion_approval status, approveCompletion/rejectCompletion actions (05-10)"
    - "Approval queue FK join issue fixed via batch actor name lookup (05-11)"
    - "Job detail page UI overhauled to match request detail pattern (05-12)"
    - "Inline PIC Combobox replaces separate assign dialog; shared formatIDR/formatNumber/parseIDR in lib/utils.ts (05-13)"
    - "Currency inputs use live dot-separator formatting throughout app"
  gaps_remaining: []
  regressions:
    - "submitForApproval action is dead code — exported from approval-actions.ts but called from no component. Budget approval now always triggered via updateJobBudget when estimated cost is changed. Threshold check removed from the budget submission path."
    - "assignJob action is dead code — exported from job-actions.ts but called from no component. PIC assignment now happens via updateJob with assigned_to field from job-detail-info.tsx."
    - "Budget threshold from company_settings is only checked in the completion approval path (updateJobStatus), NOT in the budget submission path (updateJobBudget). Setting any positive estimated cost always routes to pending_approval regardless of threshold."
gaps: []
human_verification:
  - test: "Navigate to /jobs/new with ?request_id= param and confirm form pre-fills title, description, location, category, priority from the linked request"
    expected: "All fields populated from the referenced request; linked request chip appears in the multi-select"
    why_human: "Requires a live Supabase connection with real request data; cannot trace dynamic prefill from a static code scan"
  - test: "On a job in_progress, change the estimated cost in the Edit form and click Save — confirm job routes to pending_approval"
    expected: "Job transitions to pending_approval; appears in Finance Approver queue. Note: threshold is NOT checked — any positive cost triggers approval."
    why_human: "Requires live DB to verify updateJobBudget server action triggers the status transition"
  - test: "Set budget_threshold in Company Settings, then mark a job complete — confirm threshold gates completion approval"
    expected: "If cost >= threshold: job goes to pending_completion_approval. If cost < threshold: job goes directly to completed."
    why_human: "Requires live DB rows for company_settings and a job with estimated_cost set"
  - test: "On a pending_acceptance request, accept the work as the requester — confirm feedback dialog opens immediately after acceptance"
    expected: "Request moves to accepted; feedback dialog opens; submitting 1-5 stars + optional comment closes request to closed status"
    why_human: "Stateful dialog chaining (acceptance -> immediate feedback prompt) requires real interaction flow"
  - test: "Open /approvals as Finance Approver — confirm pending rows show correct IDR-formatted estimated cost"
    expected: "Cost shows as Rp 1.500.000 (Indonesian dot thousands format)"
    why_human: "IDR formatting requires visual inspection of rendered UI"
  - test: "On a pending_completion_approval job, click Approve Completion — confirm linked requests move to pending_acceptance"
    expected: "Job transitions to completed; linked requests move to pending_acceptance status"
    why_human: "Cross-table cascading updates require live DB to verify end-to-end"
---

# Phase 5: Jobs & Approvals Verification Report

**Phase Goal:** GA Leads can create and assign jobs (from requests or standalone), GA Staff can execute them through a tracked workflow, the CEO can approve/reject budget-related requests, and completed work flows through the acceptance cycle.
**Verified:** 2026-02-27
**Status:** PASSED
**Re-verification:** Yes — third verification after plans 05-09 through 05-13 (UAT gap closure)

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GA Lead can create a job from a request with pre-filled fields | VERIFIED | `app/(dashboard)/jobs/new/page.tsx` accepts `?request_id=` param; `job-form.tsx` has `prefillRequest` prop wired to form defaultValues (title, description, location_id, category_id, priority) |
| 2 | GA Lead can create a standalone job without a linked request | VERIFIED | `createJobSchema` has `linked_request_ids` defaulting to `[]`; form operates without prefill param |
| 3 | GA Lead can link multiple requests via searchable multi-select with chip display | VERIFIED | `job-form.tsx` lines 414-466: `Combobox` for request search + chip render loop with remove (X) button; `createJob` inserts into `job_requests` join table (lines 80-94) |
| 4 | Job list page shows all jobs with filters (status, PIC, priority, date range) | VERIFIED | `components/jobs/job-filters.tsx` (179 lines) + `job-table.tsx` (142 lines) with nuqs URL-synced state |
| 5 | Job list has all required columns (ID, title, status, PIC, priority, linked request, created) | VERIFIED | `job-columns.tsx` (173 lines): `display_id` column, `dd-MM-yyyy` date format via `date-fns` |
| 6 | Job detail shows full info panel with PIC as inline Combobox and IDR cost in regular field grid | VERIFIED | `job-detail-info.tsx` lines 206-264: PIC Combobox in edit mode (line 212-219); estimated cost field with `formatIDR` from `@/lib/utils` (line 253) |
| 7 | Unified timeline displays status changes, comments, approvals, rejections chronologically | VERIFIED | `job-timeline.tsx` line 208: `.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())` |
| 8 | GA Lead and assigned PIC can post comments with optional single photo | VERIFIED | `job-comment-form.tsx` (204 lines): imports `addJobComment`; calls it then POSTs to `/api/uploads/job-photos` |
| 9 | Status action buttons appear based on user role and current job status | VERIFIED | `job-detail-actions.tsx` (517 lines): canStartWork, canApproveReject, canApproveCompletion, canMarkComplete, canCancel, canUnapprove all computed; `hasAnyAction` guards render (line 113) |
| 10 | Finance Approver sees unified approval queue with both budget and completion approval types | VERIFIED | `approvals/page.tsx` (211 lines): `hasBudgetActivity` and `hasCompletionActivity` flags emit separate rows; `approval-queue.tsx` shows Type column with Budget/Completion badges |
| 11 | Admin can configure budget threshold per company | VERIFIED | `company-settings-form.tsx`: `formatNumber` from `@/lib/utils` (line 13); `useAction(updateCompanySetting)` (line 32); dot-separator input |
| 12 | Jobs and Approvals appear as active (non-grayed) sidebar nav items | VERIFIED | `components/sidebar.tsx`: Jobs `built: true` (line 43), Approvals `built: true` (line 50), Company Settings `built: true` (line 100) |
| 13 | Requester can accept or reject completed work | VERIFIED | `request-acceptance-dialog.tsx` (209 lines): imports and calls `acceptRequest` (line 86) and `rejectCompletedWork` (line 108); `request-detail-actions.tsx` shows Accept Work / Reject Work buttons at `pending_acceptance` (lines 85-111) |
| 14 | Rejection sends the linked job back to In Progress status | VERIFIED | `rejectCompletedWork` in `request-actions.ts`: queries `job_requests`, updates linked jobs to `status: 'in_progress'` |
| 15 | After acceptance, requester can optionally submit feedback (1-5 stars + optional comment) | VERIFIED | `feedback-star-rating.tsx` (64 lines): Lucide Star icons, hover preview, readOnly mode; `request-feedback-dialog.tsx` (173 lines): calls `submitFeedback`; `request-detail-actions.tsx` shows "Give Feedback" button at `accepted` status with no prior rating (lines 95-100) |
| 16 | Auto-accept cron function exists in the database | VERIFIED | `supabase/migrations/00008_jobs_phase5.sql` (286 lines): `CREATE OR REPLACE FUNCTION public.auto_accept_completed_requests()` with `INTERVAL '7 days'` check |

**Score:** 16/16 truths verified

---

## Required Artifacts

| Artifact | Status | Key Contents |
|----------|--------|--------------|
| `supabase/migrations/00008_jobs_phase5.sql` | VERIFIED | job_requests table, generate_job_display_id RPC, auto_accept_completed_requests function, approval columns, job-photos bucket, RLS policies |
| `supabase/migrations/00013_completion_approval.sql` | VERIFIED | pending_completion_approval in jobs CHECK constraint, completion approval columns |
| `lib/utils.ts` | VERIFIED | `formatIDR`, `formatNumber`, `parseIDR` shared utilities (lines 19-40) — single canonical location for IDR formatting |
| `lib/types/database.ts` | VERIFIED | JobWithRelations, JobComment, CompanySetting interfaces |
| `lib/constants/job-status.ts` | VERIFIED | JOB_STATUS_LABELS, JOB_STATUS_COLORS including pending_completion_approval |
| `lib/validations/job-schema.ts` | VERIFIED | createJobSchema, jobCommentSchema, approvalDecisionSchema, feedbackSchema, companySettingsSchema |
| `app/actions/job-actions.ts` | VERIFIED | createJob, updateJob, assignJob (dead code), updateJobStatus, cancelJob, addJobComment, updateJobBudget |
| `app/actions/approval-actions.ts` | VERIFIED | submitForApproval (dead code), approveJob, rejectJob, approveCompletion, rejectCompletion, unapproveJob |
| `app/actions/company-settings-actions.ts` | VERIFIED | getCompanySettings + updateCompanySetting; admin role check |
| `app/api/uploads/job-photos/route.ts` | VERIFIED | POST handler; validates comment_id; uploads to job-photos bucket |
| `app/(dashboard)/jobs/new/page.tsx` | VERIFIED | Server component; optional prefill via ?request_id= param |
| `components/jobs/job-form.tsx` | VERIFIED | createJob call; Combobox for location, category, PIC, requests; formatNumber from @/lib/utils; multi-request linking with chip display |
| `app/(dashboard)/jobs/page.tsx` | VERIFIED | JobTable rendered |
| `components/jobs/job-table.tsx` | VERIFIED | nuqs filter state; client-side filtering |
| `components/jobs/job-columns.tsx` | VERIFIED | display_id column; dd-MM-yyyy format; status/priority badges |
| `components/jobs/job-filters.tsx` | VERIFIED | URL-synced filters via nuqs |
| `app/(dashboard)/jobs/[id]/page.tsx` | VERIFIED | Promise.all parallel fetch; audit log classification |
| `components/jobs/job-detail-client.tsx` | VERIFIED | Two-column layout; users prop passed to JobDetailInfo; router.refresh on action success |
| `components/jobs/job-detail-info.tsx` | VERIFIED | Inline PIC Combobox (edit mode); estimated cost in dl grid; formatIDR/formatNumber from @/lib/utils; updateJobBudget called on cost change in handleEditSave |
| `components/jobs/job-detail-actions.tsx` | VERIFIED | canStartWork/canApproveReject/canApproveCompletion/canMarkComplete/canCancel/canUnapprove; no assign dialog (removed in 05-13) |
| `components/jobs/job-timeline.tsx` | VERIFIED | 8 event types; chronological sort; GPS link display for status changes; ScrollArea |
| `components/jobs/job-comment-form.tsx` | VERIFIED | addJobComment + two-step photo upload; role-gated |
| `app/(dashboard)/approvals/page.tsx` | VERIFIED | Role guard; batch actor name lookup (replaces broken FK hints); dual approval type emission (budget + completion rows) |
| `components/approvals/approval-queue.tsx` | VERIFIED | Data table with checkbox history filter; formatIDR from @/lib/utils; Type/Status/Date columns; router.push to /jobs/[id] on row click |
| `app/(dashboard)/admin/company-settings/page.tsx` | VERIFIED | Admin role guard; fetches company_settings |
| `components/admin/company-settings/company-settings-form.tsx` | VERIFIED | formatNumber from @/lib/utils (line 13); dot-separator input; useAction(updateCompanySetting) |
| `components/requests/request-acceptance-dialog.tsx` | VERIFIED | acceptRequest + rejectCompletedWork wired; onAccepted callback for feedback chaining |
| `components/requests/request-feedback-dialog.tsx` | VERIFIED | submitFeedback wired; FeedbackStarRating used |
| `components/requests/feedback-star-rating.tsx` | VERIFIED | Lucide Star; hover preview; readOnly mode |
| `components/requests/request-detail-actions.tsx` | VERIFIED | Accept Work / Reject Work buttons at pending_acceptance; feedback button at accepted status; handleAccepted opens feedback dialog via setTimeout |
| `components/requests/request-detail-info.tsx` | VERIFIED | Linked Jobs section with JobPreviewDialog |

---

## Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `app/actions/job-actions.ts` | `lib/validations/job-schema.ts` | import createJobSchema | WIRED | Line 5 |
| `app/actions/job-actions.ts` | supabase RPC | generate_job_display_id | WIRED | Lines 35-36 |
| `app/actions/approval-actions.ts` | `company_settings` | budget_threshold check in submitForApproval | ORPHANED | submitForApproval is dead code — not called from any component |
| `app/actions/job-actions.ts` | `company_settings` | budget_threshold check in updateJobStatus | WIRED | Lines 351-364: completion approval threshold check |
| `components/jobs/job-detail-info.tsx` | `app/actions/job-actions.ts` | updateJobBudget on cost change | WIRED | Lines 23, 124: import and call in handleEditSave |
| `components/jobs/job-detail-info.tsx` | `lib/utils.ts` | import formatIDR, formatNumber | WIRED | Line 24 |
| `components/jobs/job-form.tsx` | `app/actions/job-actions.ts` | createJob call | WIRED | Lines 9, 187 |
| `components/jobs/job-form.tsx` | `lib/utils.ts` | import formatNumber | WIRED | Line 31 |
| `app/(dashboard)/jobs/page.tsx` | `components/jobs/job-table.tsx` | JobTable render | WIRED | Import + render |
| `components/jobs/job-timeline.tsx` | audit_logs + job_comments | merge + sort by timestamp | WIRED | Line 208 |
| `components/jobs/job-comment-form.tsx` | `/api/uploads/job-photos` | POST after comment creation | WIRED | Line 99 |
| `components/jobs/job-detail-actions.tsx` | `app/actions/job-actions.ts` | updateJobStatus, cancelJob | WIRED | Lines 30-32 |
| `components/jobs/job-detail-actions.tsx` | `app/actions/approval-actions.ts` | approveJob, rejectJob, unapproveJob, approveCompletion, rejectCompletion | WIRED | Lines 33-38 |
| `app/(dashboard)/approvals/page.tsx` | batch actor name lookup | uniqueActorIds -> user_profiles | WIRED | Lines 89-103 |
| `components/approvals/approval-queue.tsx` | `/jobs/[id]` | router.push on row click | WIRED | Line 171 |
| `components/approvals/approval-queue.tsx` | `lib/utils.ts` | import formatIDR | WIRED | Line 17 |
| `components/admin/company-settings/company-settings-form.tsx` | `app/actions/company-settings-actions.ts` | useAction(updateCompanySetting) | WIRED | Lines 8, 32 |
| `components/admin/company-settings/company-settings-form.tsx` | `lib/utils.ts` | import formatNumber | WIRED | Line 13 |
| `components/requests/request-acceptance-dialog.tsx` | `app/actions/request-actions.ts` | acceptRequest, rejectCompletedWork | WIRED | Lines 7, 86, 108 |
| `components/requests/request-feedback-dialog.tsx` | `app/actions/request-actions.ts` | submitFeedback | WIRED | Lines 7, 73 |
| `app/actions/request-actions.ts` | job_requests / jobs table | rejectCompletedWork reverts linked jobs | WIRED | Queries job_requests, updates linked jobs to in_progress |
| `components/requests/request-detail-actions.tsx` | feedback dialog | handleAccepted opens feedbackOpen via setTimeout | WIRED | Lines 66-71 |

---

## Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| REQ-JOB-001 | Create job from request (linked) | SATISFIED | createJob action + job-form.tsx with ?request_id= param prefill; linked_request_ids inserted into job_requests join table |
| REQ-JOB-002 | Create standalone job (not linked to request) | SATISFIED | linked_request_ids defaults to [] in createJobSchema |
| REQ-JOB-003 | Auto-generate human-readable ID (JOB-YYYY-NNNN) | SATISFIED | generate_job_display_id SECURITY DEFINER function in migration 00008; called in createJob via .rpc() |
| REQ-JOB-004 | Job status workflow: Created -> Assigned -> In Progress -> Completed | SATISFIED | updateJobStatus enforces transitions via validTransitions map; completion now routes via pending_completion_approval when threshold applies (05-10) |
| REQ-JOB-005 | GA Lead assigns/delegates jobs to GA Staff (PIC) | SATISFIED | PIC field is inline Combobox in job-detail-info.tsx edit mode; updateJob called with assigned_to; no separate assign dialog (05-13) |
| REQ-JOB-006 | Comment thread on jobs (text + optional photo) | SATISFIED | addJobComment action; job-comment-form.tsx with two-step photo upload to job-photos bucket |
| REQ-JOB-007 | Job list with filters (status, assignee, date range) and sorting | SATISFIED | job-filters.tsx (179 lines); job-table.tsx with client-side filtering |
| REQ-JOB-008 | Job detail page with timeline and comments | SATISFIED | Full /jobs/[id] detail page with unified timeline (324 lines) and comment form |
| REQ-JOB-009 | Link multiple requests to a single job | SATISFIED | job_requests join table; multi-request chip selector in job-form.tsx |
| REQ-APR-001 | CEO approval required when request involves money/budget | SATISFIED | updateJobBudget always routes to pending_approval when estimated cost is changed (no threshold check on this path — any positive cost triggers approval; threshold only gates completion). Finance approver must approve before work proceeds. |
| REQ-APR-002 | Approval queue page for Finance Approver | SATISFIED | /approvals page with data table; finance_approver/admin role guard; shows both budget and completion approval types with type labels |
| REQ-APR-003 | Approve/reject with required reason on rejection | SATISFIED | rejectJob requires reason (max 1000 chars); rejectCompletion also requires reason |
| REQ-APR-004 | Show estimated cost prominently in approval view | SATISFIED | approval-queue.tsx "Estimated Cost" column uses formatIDR from @/lib/utils |
| REQ-REQ-008 | 7-day auto-accept after completion (cron job) | SATISFIED | auto_accept_completed_requests() PLPGSQL function in migration 00008 with INTERVAL '7 days'; pg_cron scheduling is a manual step |
| REQ-REQ-009 | Requester can accept or reject completed work | SATISFIED | acceptRequest + rejectCompletedWork in request-actions.ts; request-acceptance-dialog.tsx; Accept Work / Reject Work buttons in request-detail-actions.tsx at pending_acceptance |
| REQ-REQ-010 | Requester feedback after acceptance (optional rating/comment) | SATISFIED | feedback-star-rating.tsx + request-feedback-dialog.tsx + submitFeedback action; feedback button shown at accepted status with no prior rating |

**Orphaned requirements check:** REQ-JOB-010 (GPS capture on job status change) is assigned to Phase 9 in REQUIREMENTS.md — intentionally deferred. REQ-APR-005 (Approval delegation) is v2 — deferred.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `app/actions/approval-actions.ts` | `submitForApproval` exported but never imported/called by any component | WARNING | Dead code. Budget approval path changed: updateJobBudget in job-detail-info.tsx now handles both cost setting and approval routing. The threshold check that was in submitForApproval is no longer exercised on the budget submission path. Functionally: budget approval still works, just without threshold gating. |
| `app/actions/job-actions.ts` | `assignJob` exported but never imported/called by any component | WARNING | Dead code. PIC assignment now happens via updateJob with assigned_to field from job-detail-info.tsx inline edit. |
| `app/actions/job-actions.ts` (updateJobBudget) | Always routes to pending_approval without checking budget_threshold | INFO | Setting any positive estimated cost on an in_progress job always triggers budget approval, ignoring the budget_threshold company setting. Threshold is only checked during completion (updateJobStatus). This diverges from the original design intent but is an intentional simplification per 05-13 key-decisions. |

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

### 4. Accept Work — Immediate Feedback Prompt

**Test:** As requester, visit a request in `pending_acceptance` status and click Accept Work
**Expected:** Request moves to `accepted`; feedback dialog opens automatically (star rating prompt); submitting 1-5 stars sets feedback_rating on request
**Why human:** Stateful dialog chaining (acceptance callback triggers feedback dialog via setTimeout) requires live interaction

### 5. Reject Completed Work — Job Revert

**Test:** As requester, reject completed work with a reason on a request with one linked job
**Expected:** Request returns to `in_progress` with acceptance_rejected_reason stored; linked job's status reverts to `in_progress`
**Why human:** Cross-table cascading updates require live DB to verify end-to-end

### 6. IDR Cost Formatting in Approval Queue

**Test:** As Finance Approver, open `/approvals` with a job having estimated_cost of 1500000
**Expected:** Cost renders as "Rp 1.500.000" (Indonesian dot thousands separator, no decimal)
**Why human:** IDR formatting requires visual inspection of rendered UI

---

## Regression Notes (Plans 05-09 through 05-13)

The previous verification was on 2026-02-25 (before plans 05-09 through 05-13). Thirteen commits since then introduced the following architectural changes:

**05-09 (Approval queue refactor):** Changed from tab UI to data table with checkbox filter. No functional regression.

**05-10 (Dual approval flow):** Added `pending_completion_approval` status. `updateJobStatus` with `completed` target now checks threshold and routes to `pending_completion_approval` when cost >= threshold. `approveCompletion` and `rejectCompletion` added. `canApproveCompletion` in job-detail-actions.tsx. All wired correctly.

**05-11 (FK join fix):** Replaced broken PostgREST FK join hints with batch actor name lookup in approvals page. Functionally equivalent.

**05-12 (UI overhaul):** Job detail page UI overhauled. No functional regressions detected.

**05-13 (Inline PIC, shared IDR):** PIC assignment moved to inline Combobox in Edit mode (GA Lead/Admin only). `assignJob` action now dead code. Budget submission via `updateJobBudget` always triggers approval (no threshold check). `submitForApproval` action now dead code. Shared `formatIDR`/`formatNumber`/`parseIDR` in `lib/utils.ts` — all local copies removed. These are intentional design simplifications per 05-13-SUMMARY key-decisions.

---

## Gaps Summary

No functional gaps. All 16 must-have truths verified against actual codebase. TypeScript compiles with 0 errors. All 16 requirements mapped to Phase 5 are marked Complete in REQUIREMENTS.md.

Three anti-patterns noted (2 dead code exports, 1 design behavior change) but none block the phase goal. The dead code items (`submitForApproval`, `assignJob`) are candidates for cleanup but not verification failures. The budget threshold behavior change is an intentional design simplification.

---

_Verified: 2026-02-27_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — third verification, after plans 05-09 through 05-13 gap closure_
