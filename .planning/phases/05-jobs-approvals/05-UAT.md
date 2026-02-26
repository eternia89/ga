---
status: diagnosed
phase: 05-jobs-approvals
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md, 05-06-SUMMARY.md, 05-07-SUMMARY.md, 05-08-SUMMARY.md, 05-09-SUMMARY.md, 05-10-SUMMARY.md]
started: 2026-02-26T00:00:00Z
updated: 2026-02-26T15:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Create a Job with Multi-Request Linking
expected: Navigate to /jobs/new. Fill in title, description, location, category, PIC. Search and select multiple requests as chips. Priority auto-computes. Submit successfully. Dropdown/combobox fields should NOT be full width (constrained width). Job ID auto-generates on submit.
result: pass

### 2. Job List Page with Filters
expected: Navigate to /jobs. See a data table with columns: ID, Title, Status, PIC, Priority, Linked Request, Created, Actions. Filter by status, priority, PIC, search text. "New Job" button visible for GA Lead/Admin. Category column works without errors.
result: issue
reported: "general user, only can view jobs that's been assigned to them, but now it sees all same like admin"
severity: major

### 3. Job Detail Page Layout
expected: Click a job from the list. See two-column layout: left panel with job info (display ID, status badge, priority badge, IDR-formatted cost, fields grid, linked requests as clickable chips that open a modal preview of the request detail). Right panel with timeline + comment form. No duplicated header. Budget/estimated cost is editable inline in the info panel (not a separate section). Fields are inline-editable for users with edit permission. Header should contain breadcrumb navigation.
result: issue
reported: "header should contain the breadcrumb, now it contains nothing beside notification icons in the right side. remove the squared wrapper in job detail page, treat the UI similar to request detail page. all detail pages should have a maximum of 1000px width that consist of activity timeline column and the detail column itself, so the UI doesn't get stretched on ultra-wide monitors"
severity: major

### 4. Job Timeline with Event Types
expected: On job detail, the timeline shows chronological events with icons: created, assignment, status changes, approval submissions, approvals, rejections (with reason highlighted), cancellations. Comments interleave with their own style.
result: pass

### 5. Add Comment with Photo
expected: On job detail, type a comment and optionally attach a photo (JPEG/PNG/WebP, max 5MB). Preview thumbnail appears before submit. After submit, comment shows in timeline with photo viewable in lightbox. No company_id errors.
result: pass

### 6. Assign / Reassign Job
expected: On a job in "created" status, click Assign. A dialog with a Combobox opens to search GA Staff. Select a user and confirm — job moves to "assigned" status. Reassign is available on jobs in assigned, in_progress, and other active statuses (not just "assigned").
result: issue
reported: "to assign PIC, user should only pick the dropdown of PIC that's editable later (view details and edit page the same) — no separate assign dialog"
severity: major

### 7. Start Work on Job
expected: As the assigned PIC, click "Start Work" on an assigned job. Job status changes to "in_progress". Approval-related buttons clearly say "Approve Budget" / "Reject Budget" (not generic "Approve"/"Reject").
result: issue
reported: "estimated cost shouldn't behave like it's special. treat it like all the other fields"
severity: major

### 8. Submit Job for Budget Approval
expected: On an in_progress job, submit budget triggers approval when above threshold. This is specifically a BUDGET approval. The approval flow is: submit budget → pending_approval → finance approver approves/rejects budget.
result: issue
reported: "all RP number should have thousand separator to reduce mistake, reading a lot of 0000000"
severity: minor

### 9. Approval Queue Page
expected: Navigate to /approvals (finance_approver/admin only). See a data table (not tabs) showing pending approvals by default. A checkbox/filter allows toggling to show previously approved/rejected history. The page is strictly financial — approve/reject budget actions only, no operational controls like cancel.
result: issue
reported: "approval page is always empty"
severity: blocker

### 10. Approve / Reject Budget
expected: On the approval queue or job detail, approve a pending_approval job — it moves to "in_progress". Reject with a reason — it returns with the rejection reason visible in timeline.
result: pass

### 11. Mark Job Complete & Completion Approval
expected: On an in_progress job, click "Mark Complete". Job moves to "pending_completion_approval" (NOT directly to completed). CEO/admin must approve the completion. After approval, job moves to "completed". Comments are disabled on completed/cancelled jobs.
result: issue
reported: "when I click mark complete, this error occurs: Could not find the 'completion_submitted_at' column of 'jobs' in the schema cache"
severity: blocker

### 12. Cancel Job
expected: Click cancel on a job. Confirmation dialog warns about cascade effects. After confirming, job moves to "cancelled".
result: pass

### 13. Company Settings — Budget Threshold
expected: Navigate to /admin/company-settings (admin only). See budget threshold form with Rp prefix. Update the value and save. The new threshold is used for approval gate checks.
result: pass

### 14. Accept Completed Work on Request
expected: On a request in "pending_acceptance", click "Accept Work". After accepting, a star rating/feedback dialog AUTOMATICALLY opens (not just a success notification). User rates 1-5 stars + optional comment.
result: skipped
reason: blocked by Test 11 — completion flow broken

### 15. Reject Completed Work on Request
expected: On a request in "pending_acceptance", click "Reject Work". Provide a reason. Linked jobs revert to "in_progress". Rejection reason shows in request timeline.
result: pass

### 16. Submit Feedback with Star Rating
expected: After accepting work, the feedback dialog shows a 1-5 star rating with hover preview. Submit a rating + optional comment. Request closes. Rating displays read-only on the request detail.
result: pass

### 17. Linked Jobs on Request Detail
expected: On a request detail page, see a "Linked Jobs" section showing each linked job's ID, title, and live status badge. Each is clickable and opens a modal preview of the job detail (similar to how linked requests open a modal preview on job detail).
result: pass

### 18. Sidebar Navigation — Jobs, Approvals, Company Settings
expected: Sidebar shows Jobs and Approvals nav items as active links. Admin section shows Company Settings. All navigate to their respective pages. Approval queue uses the data table pattern (not tabs).
result: pass

## Summary

total: 18
passed: 10
issues: 7
pending: 0
skipped: 1

## Gaps

- truth: "General users should only see jobs assigned to them, not all jobs"
  status: failed
  reason: "User reported: general user, only can view jobs that's been assigned to them, but now it sees all same like admin"
  severity: major
  test: 2
  root_cause: "Jobs page query filters only by company_id, no role-based filtering. RLS policy also lacks role check. Requests page has this pattern but jobs page never got it."
  artifacts:
    - path: "app/(dashboard)/jobs/page.tsx"
      issue: "Missing role-based query filter (lines 36-52)"
    - path: "app/(dashboard)/jobs/[id]/page.tsx"
      issue: "Missing role-based access check on detail page"
    - path: "supabase/migrations/00003_rls_policies.sql"
      issue: "jobs_select RLS policy lacks role-based condition"
  missing:
    - "Add .eq('assigned_to', profile.id) for general_user/ga_staff roles in jobs list query"
    - "Add role-based access check on job detail page"
    - "New migration for RLS defense-in-depth"
  debug_session: ".planning/debug/jobs-visible-to-all-users.md"

- truth: "Job detail page should match request detail page UI — no squared wrapper, breadcrumb in header, max-w-[1000px]"
  status: failed
  reason: "User reported: header should contain breadcrumb, remove squared wrapper, treat UI similar to request detail page, max 1000px width for detail pages"
  severity: major
  test: 3
  root_cause: "3 sub-issues: (1) Missing page-level header between breadcrumb and grid — request detail has h1+badges+creator info, job detail goes straight to JobDetailClient. (2) JobDetailInfo uses 'rounded-lg border p-6' wrapper — RequestDetailInfo uses bare fragment. (3) No max-width on outer wrapper div."
  artifacts:
    - path: "app/(dashboard)/jobs/[id]/page.tsx"
      issue: "Missing header section between breadcrumb and grid; no max-width on wrapper"
    - path: "components/jobs/job-detail-info.tsx"
      issue: "Line 165: rounded-lg border p-6 card wrapper not present on request equivalent"
  missing:
    - "Add page-level header (display_id h1, status badge, priority badge, creator info) mirroring request detail"
    - "Remove rounded-lg border p-6 from JobDetailInfo root div"
    - "Add max-w-[1000px] to outer wrapper (and request detail for consistency)"
  debug_session: ".planning/debug/job-detail-ui-issues.md"

- truth: "PIC assignment should be inline-editable field on detail page, not a separate assign dialog"
  status: failed
  reason: "User reported: to assign PIC, user should only pick the dropdown of PIC that's editable later — no separate assign dialog"
  severity: major
  test: 6
  root_cause: "PIC field in job-detail-info.tsx is display-only. Assignment lives in job-detail-actions.tsx as a separate Dialog. updateJobSchema already supports assigned_to — just needs Combobox in edit mode grid."
  artifacts:
    - path: "components/jobs/job-detail-info.tsx"
      issue: "PIC field display-only, no edit Combobox"
    - path: "components/jobs/job-detail-actions.tsx"
      issue: "Lines 338-490: separate Assign Dialog that should be removed"
    - path: "components/jobs/job-detail-client.tsx"
      issue: "Needs to pass users prop to JobDetailInfo"
  missing:
    - "Add PIC Combobox in edit mode grid in job-detail-info.tsx"
    - "Remove Assign Dialog from job-detail-actions.tsx"
    - "Pass users prop through job-detail-client.tsx to JobDetailInfo"
  debug_session: ".planning/debug/job-pic-inline-edit.md"

- truth: "Estimated cost should be a regular inline-editable field like all others"
  status: failed
  reason: "User reported: estimated cost shouldn't behave like it's special, treat it like all the other fields"
  severity: major
  test: 7
  root_cause: "Estimated cost has own card wrapper (bg-muted/50 border), text-2xl bold display, separate isBudgetEditing state, lock/unlock badge system. All other fields use standard text-sm in dl grid."
  artifacts:
    - path: "components/jobs/job-detail-info.tsx"
      issue: "Lines 247-339: special budget section instead of regular dl field"
  missing:
    - "Move estimated cost into the dl grid as regular inline-editable field"
    - "Remove separate isBudgetEditing state, use main isEditing toggle"
    - "Keep updateJobBudget server action for approval trigger but normalize UI"
  debug_session: ".planning/debug/job-pic-inline-edit.md"

- truth: "All Rp currency values must display with dot thousand separators"
  status: failed
  reason: "User reported: all RP number should have thousand separator to reduce mistake, reading a lot of 0000000"
  severity: minor
  test: 8
  root_cause: "Input fields use type='number' which never shows separators. No shared formatIDR utility — 3 duplicate local copies exist. Display-only locations work but inputs don't."
  artifacts:
    - path: "components/jobs/job-form.tsx"
      issue: "Line 382: type='number' input shows raw digits"
    - path: "components/admin/company-settings/company-settings-form.tsx"
      issue: "Line 72: type='number' input shows raw digits"
    - path: "components/jobs/job-detail-info.tsx"
      issue: "Line 293: text input but no live formatting"
    - path: "components/jobs/job-preview-dialog.tsx"
      issue: "Duplicate local formatIDR"
    - path: "components/approvals/approval-queue.tsx"
      issue: "Duplicate local formatIDR"
  missing:
    - "Create shared formatIDR in lib/utils.ts"
    - "Replace all local copies with shared import"
    - "Convert currency inputs to type='text' with live dot-formatting"
  debug_session: ".planning/debug/idr-currency-no-separators.md"

- truth: "Approval queue page should display pending approvals"
  status: failed
  reason: "User reported: approval page is always empty"
  severity: blocker
  test: 9
  root_cause: "Supabase query in approvals/page.tsx uses FK join hints (user_profiles!approved_by, !approval_rejected_by) that PostgREST cannot resolve with 6 FKs to user_profiles. Error is silently swallowed — only data destructured, not error. data=null becomes [] via fallback."
  artifacts:
    - path: "app/(dashboard)/approvals/page.tsx"
      issue: "Lines 41-72: broken FK join hints and missing error handling"
  missing:
    - "Remove problematic FK joins, batch-fetch user names separately"
    - "Add error destructuring to surface PostgREST errors"
  debug_session: ".planning/debug/approval-queue-empty.md"

- truth: "Mark Complete should transition job to pending_completion_approval with completion_submitted_at column"
  status: failed
  reason: "User reported: when I click mark complete, this error occurs: Could not find the 'completion_submitted_at' column of 'jobs' in the schema cache"
  severity: blocker
  test: 11
  root_cause: "Migration 00013_completion_approval.sql exists in codebase but was never applied to the live Supabase database. Adds 6 columns and updates status CHECK constraint."
  artifacts:
    - path: "supabase/migrations/00013_completion_approval.sql"
      issue: "Migration not applied to live database"
    - path: "app/actions/job-actions.ts"
      issue: "updateJobStatus fails at line 370 setting completion_submitted_at"
    - path: "app/actions/approval-actions.ts"
      issue: "approveCompletion and rejectCompletion also depend on missing columns"
  missing:
    - "Run migration 00013_completion_approval.sql in Supabase SQL Editor"
  debug_session: ".planning/debug/mark-complete-missing-column.md"
