---
status: complete
phase: 05-jobs-approvals
source: 05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md, 05-05-SUMMARY.md
started: 2026-02-26T00:00:00Z
updated: 2026-02-26T01:00:00Z
---

## Tests

### 1. Create a Job with Multi-Request Linking
expected: Navigate to /jobs/new. Fill in title, description, location, category, PIC. Search and select multiple requests as chips. Priority auto-computes. Submit successfully.
result: issue
reported: "the dropdown boxes should not full width, check previous implementation which I ever comment. when I submit, it failed to generate job ID"
severity: major

### 2. Job List Page with Filters
expected: Navigate to /jobs. See a data table with columns: ID, Title, Status, PIC, Priority, Linked Request, Created, Actions. Filter by status, priority, PIC, search text. "New Job" button visible for GA Lead/Admin.
result: issue
reported: "Could not find the 'category_id' column of 'jobs' in the schema cache"
severity: blocker

### 3. Job Detail Page Layout
expected: Click a job from the list. See two-column layout: left panel with job info (display ID, status badge, priority badge, IDR-formatted cost, fields grid, linked requests) and right panel with timeline + comment form.
result: issue
reported: "linked request should be clickable to open a modal that shows the request detail page, without the timeline. so the information is concluded within 1 page"
severity: major

### 4. Job Timeline with Event Types
expected: On job detail, the timeline shows chronological events with icons: created, assignment, status changes, approval submissions, approvals, rejections (with reason highlighted), cancellations. Comments interleave with their own style.
result: issue
reported: "the header in job detail is duplicated"
severity: minor

### 5. Add Comment with Photo
expected: On job detail, type a comment and optionally attach a photo (JPEG/PNG/WebP, max 5MB). Preview thumbnail appears before submit. After submit, comment shows in timeline with photo viewable in lightbox.
result: issue
reported: "when submitting comment, this error occurs: null value in column company_id of relation job_comments violates not-null constraint"
severity: blocker

### 6. Assign / Reassign Job
expected: On a job in "created" status, click Assign. A dialog with a Combobox opens to search GA Staff. Select a user and confirm — job moves to "assigned" status. Reassign works similarly on an already-assigned job.
result: issue
reported: "user should be able to reassign jobs after it's delegated to a person"
severity: major

### 7. Start Work on Job
expected: As the assigned PIC, click "Start Work" on an assigned job. Job status changes to "in_progress".
result: issue
reported: "approve button should have better information. it's specifically to approve budget, not approve the job"
severity: minor

### 8. Submit Job for Approval (Budget Threshold)
expected: On an in_progress job, submit budget triggers approval. Two approval types exist: budget approval and job completion approval.
result: issue
reported: "there are 2 approvals: approval for budget, and approval for the job to be considered finish. so it doesn't get superseded"
severity: major

### 9. Approval Queue Page
expected: Navigate to /approvals (finance_approver/admin only). See Tabs: Pending and History. Pending tab shows jobs awaiting approval with IDR cost prominent. History tab shows approved/rejected decisions with badges and rejection reasons.
result: issue
reported: "finance/CEO approval page doesn't allow them to cancel the job. finance should keep on financial matters, not operational"
severity: minor

### 10. Approve / Reject Job
expected: On the approval queue or job detail, approve a pending_approval job — it moves to "in_progress". Reject with a reason — it returns with the rejection reason visible in timeline.
result: pass

### 11. Mark Job Complete
expected: On an in_progress job, click "Mark Complete". Job moves to "completed". Linked requests transition to "pending_acceptance".
result: issue
reported: "completed job should disable comment, it's already final, no need to enable any response"
severity: minor

### 12. Cancel Job
expected: Click cancel on a job. Confirmation dialog warns about cascade effects. After confirming, job moves to "cancelled".
result: pass

### 13. Company Settings — Budget Threshold
expected: Navigate to /admin/company-settings (admin only). See budget threshold form with Rp prefix. Update the value and save. The new threshold is used for approval gate checks.
result: pass

### 14. Accept Completed Work on Request
expected: On a request in "pending_acceptance", click "Accept Work". The acceptance dialog appears. After accepting, a feedback dialog immediately opens prompting for a star rating.
result: issue
reported: "there's no star rating after accepting a work, only a success notification that Work accepted successfully"
severity: major

### 15. Reject Completed Work on Request
expected: On a request in "pending_acceptance", click "Reject Work". Provide a reason. Linked jobs revert to "in_progress". Rejection reason shows in request timeline.
result: pass

### 16. Submit Feedback with Star Rating
expected: After accepting work, the feedback dialog shows a 1-5 star rating with hover preview. Submit a rating + optional comment. Request closes. Rating displays read-only on the request detail.
result: pass
note: "Rating works via manual button on detail page. Auto-prompt gap captured in test 14."

### 17. Linked Jobs on Request Detail
expected: On a request detail page, see a "Linked Jobs" section showing each linked job's ID, title, and live status badge. Each is a clickable link to the job detail page.
result: issue
reported: "linked job should open the job detail in a modal, just like request detail that we did earlier"
severity: major

### 18. Sidebar Navigation — Jobs, Approvals, Company Settings
expected: Sidebar shows Jobs and Approvals nav items as active links. Admin section shows Company Settings. All navigate to their respective pages.
result: issue
reported: "approval queue should have same pattern as jobs, where it shows all pending approval, with checkbox to show previously approved budget"
severity: major

## Summary

total: 18
passed: 5
issues: 13
pending: 0
skipped: 0

## Gaps

- truth: "Dropdown/combobox fields in job form should not be full width"
  status: resolved
  severity: minor
  test: 1
  root_cause: "job-form.tsx FormItems for Combobox/Select fields missing max-w-xs class"

- truth: "Job creation form submits successfully and generates a job display ID"
  status: open
  severity: blocker
  test: 1
  root_cause: "generate_job_display_id RPC function not applied to Supabase database — migration 00008 needs to be run"
  fix: "Run migration 00008_jobs_phase5.sql in Supabase SQL Editor"

- truth: "Linked requests on job detail open modal preview"
  status: resolved
  severity: major
  test: 3
  root_cause: "Linked requests were navigation links, now use RequestPreviewDialog"

- truth: "Jobs list page loads with category column"
  status: resolved
  severity: blocker
  test: 2
  root_cause: "jobs table missing category_id column — created migration 00012"

- truth: "Job detail header should not be duplicated"
  status: open
  severity: minor
  test: 4
  root_cause: "Header with display_id/status/priority/title rendered both in page server component and in JobDetailInfo"
  fix: "Remove header from either page.tsx or job-detail-info.tsx"

- truth: "Estimated cost should be editable inline in info panel, not a separate section"
  status: open
  severity: major
  test: 4
  root_cause: "Budget input is a separate section in job-detail-actions.tsx instead of inline-editable in job-detail-info.tsx"
  fix: "Move budget editing to inline in job-detail-info.tsx where cost already displays"

- truth: "Job detail and edit should be a single page with inline editing"
  status: open
  severity: major
  test: 4
  root_cause: "View and edit are separate concerns — detail page is read-only, edit is a separate form"
  fix: "Merge view/edit into one page — fields become editable for users with edit access"

- truth: "addJobComment must pass company_id"
  status: open
  severity: blocker
  test: 5
  root_cause: "addJobComment in job-actions.ts does not include company_id when inserting into job_comments"
  fix: "Add company_id: job.company_id to the insert payload in addJobComment"

- truth: "Reassign should be available in statuses beyond just 'assigned'"
  status: open
  severity: major
  test: 6
  root_cause: "canReassign only checks job.status === 'assigned' — should also allow in_progress, pending_approval, etc."
  fix: "Expand canReassign condition to include more active statuses"

- truth: "Approve/reject buttons should say 'Approve Budget' / 'Reject Budget'"
  status: open
  severity: minor
  test: 7
  root_cause: "Button labels say 'Approve' / 'Reject' without specifying budget context"
  fix: "Update button text to 'Approve Budget' / 'Reject Budget'"

- truth: "Two approval types needed: budget approval and job completion approval"
  status: open
  severity: major
  test: 8
  root_cause: "Only budget approval exists. Job completion approval (before marking finished) is missing."
  fix: "Add completion approval flow: Mark Complete → pending_completion_approval → CEO approves → completed"

- truth: "Approval page should be strictly financial — no cancel/operational actions"
  status: open
  severity: minor
  test: 9
  root_cause: "Approval queue page scope not restricted to financial matters"
  fix: "Ensure approval page only shows approve/reject budget actions, no operational controls"

- truth: "Comments should be disabled on completed/cancelled jobs"
  status: open
  severity: minor
  test: 11
  root_cause: "Comment form shows regardless of job status"
  fix: "Hide comment form when job.status is completed or cancelled"

- truth: "Star rating dialog should auto-open after accepting work"
  status: open
  severity: major
  test: 14
  root_cause: "Accept work action shows success message but doesn't trigger feedback dialog"
  fix: "Chain feedback dialog to open immediately after successful work acceptance"

- truth: "Linked jobs on request detail should open modal preview"
  status: open
  severity: major
  test: 17
  root_cause: "Linked jobs render as navigation links to /jobs/[id] instead of modal triggers"
  fix: "Create JobPreviewDialog (like RequestPreviewDialog) and use it on request detail page"

- truth: "Approval queue should use data table pattern with filter, not tabs"
  status: open
  severity: major
  test: 18
  root_cause: "Approval page uses Tabs (Pending/History) instead of data table with filter/checkbox"
  fix: "Refactor to data table showing pending approvals by default, with checkbox to include approved history"
