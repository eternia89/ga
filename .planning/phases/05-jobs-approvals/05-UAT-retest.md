---
status: diagnosed
phase: 05-jobs-approvals
source: [05-11-SUMMARY.md, 05-12-SUMMARY.md, 05-13-SUMMARY.md]
started: 2026-02-27T00:00:00Z
updated: 2026-02-27T02:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Job List — Role-Based Filtering
expected: Log in as a general_user or ga_staff. Navigate to /jobs. You should ONLY see jobs assigned to you — not all company jobs. Admin/GA Lead still sees all jobs.
result: pass

### 2. Job Detail — Header, Layout, Max Width
expected: Open a job detail page. Should have: (1) breadcrumb navigation at top, (2) page-level header with display ID, status badge, priority badge below breadcrumb, (3) NO card/border wrapper around the detail info, (4) two-column layout constrained to max 1000px width so it doesn't stretch on wide monitors.
result: issue
reported: "the 1000px layout should be horizontally centered. activity timeline should be scrollable and not overflowing to the bottom of the comment section. by default, the scroll should stick to the end, so user instantly views the newest updates"
severity: major

### 3. PIC Assignment — Inline Combobox
expected: On job detail, click Edit. PIC field should be an inline Combobox (type-to-search) in the regular field grid — NOT a separate "Assign" dialog/button. Select a user, save. PIC updates.
result: pass

### 4. Estimated Cost — Regular Field
expected: On job detail, estimated cost should appear as a regular field in the same grid as all other fields — no special card/section, no lock/unlock icons, no large bold text. In edit mode, it's a normal input with Rp prefix and dot thousand separators.
result: pass

### 5. IDR Currency Inputs — Dot Separators
expected: Check currency inputs across the app: (1) Job form estimated cost, (2) Company settings budget threshold, (3) Job detail estimated cost edit. All should show dot thousand separators as you type (e.g., "1.500.000" not "1500000"). Type="text" not type="number".
result: pass

### 6. Approval Queue — Shows Data
expected: Navigate to /approvals as finance_approver or admin. Page should show pending approval rows (not empty). If a job is in pending_approval status, it should appear in the list with correct actor names.
result: issue
reported: "in the approval list page, show all approvals, whether it's rejected, pending, or approved. default sort by date of the approval request, descending"
severity: major

### 7. Mark Job Complete
expected: On an in_progress job, click "Mark Complete". Job should move to "pending_completion_approval" status WITHOUT any schema error about completion_submitted_at. The status badge should update.
result: issue
reported: "the timeline update doesn't need to show this row: Samuela updated updated_at from '2026-02-27T01:41:43.933146+00:00' to '2026-02-27T01:47:01.245925+00:00' — this is an internal row update, not dedicated to users"
severity: minor

### 8. Accept Completed Work on Request
expected: On a request in "pending_acceptance", click "Accept Work". After accepting, a star rating/feedback dialog AUTOMATICALLY opens (not just a success notification). User rates 1-5 stars + optional comment.
result: issue
reported: "the dialog still hasn't appeared automatically. but it exists in the detail page, which I can click and give feedback"
severity: major

## Summary

total: 8
passed: 4
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "Detail page layout should be horizontally centered at max-w-[1000px], activity timeline should be scrollable with auto-scroll to bottom"
  status: failed
  reason: "User reported: the 1000px layout should be horizontally centered. activity timeline should be scrollable and not overflowing to the bottom of the comment section. by default, the scroll should stick to the end, so user instantly views the newest updates"
  severity: major
  test: 2
  root_cause: "3 sub-issues: (1) Missing mx-auto on max-w-[1000px] wrapper in both jobs/[id]/page.tsx line 414 and requests/[id]/page.tsx line 345. (2) Timeline container has no height constraint or overflow-y-auto — grows infinitely. (3) No useEffect auto-scroll-to-bottom logic exists."
  artifacts:
    - path: "app/(dashboard)/jobs/[id]/page.tsx"
      issue: "Line 414: max-w-[1000px] without mx-auto"
    - path: "app/(dashboard)/requests/[id]/page.tsx"
      issue: "Line 345: max-w-[1000px] without mx-auto"
    - path: "components/jobs/job-detail-client.tsx"
      issue: "Lines 94-102: timeline wrapper has no max-h or overflow-y-auto"
    - path: "components/requests/request-detail-client.tsx"
      issue: "Lines 77-82: timeline wrapper has no max-h or overflow-y-auto"
  missing:
    - "Add mx-auto to max-w-[1000px] wrapper in both page files"
    - "Wrap timeline content in max-h-[600px] overflow-y-auto div in both client components"
    - "Add useRef + useEffect to auto-scroll timeline to bottom on mount"
  debug_session: ""

- truth: "Approval list page should show all approvals (pending, approved, rejected) sorted by approval request date descending"
  status: failed
  reason: "User reported: in the approval list page, show all approvals, whether it's rejected, pending, or approved. default sort by date of the approval request, descending"
  severity: major
  test: 6
  root_cause: "Client-side filter in approval-queue.tsx: showHistory defaults to false (line 100), filtering visibleJobs to pending-only (line 113-114). Sort also uses pending-first grouping instead of flat date sort. Supabase query already fetches all statuses correctly."
  artifacts:
    - path: "components/approvals/approval-queue.tsx"
      issue: "Line 100: showHistory defaults false; lines 103-114: pending-first sort + pending-only filter"
  missing:
    - "Default showHistory to true (show all statuses)"
    - "Replace pending-first sort with flat descending sort by getDecisionDate()"
    - "Invert toggle label to 'Show pending only'"
  debug_session: ""

- truth: "Timeline should not show internal field updates like updated_at changes"
  status: failed
  reason: "User reported: the timeline update doesn't need to show this row: Samuela updated updated_at from timestamp to timestamp — this is an internal row update, not dedicated to users"
  severity: minor
  test: 7
  root_cause: "Generic field update fallthrough in jobs/[id]/page.tsx lines 398-411 and requests/[id]/page.tsx lines 312-324 has no blocklist for internal fields. Any changedFields entry not caught by specific checks becomes a visible timeline event. asset-timeline.tsx already filters updated_at correctly at line 328."
  artifacts:
    - path: "app/(dashboard)/jobs/[id]/page.tsx"
      issue: "Lines 398-411: generic field update with no internal field blocklist"
    - path: "app/(dashboard)/requests/[id]/page.tsx"
      issue: "Lines 312-324: same missing blocklist"
  missing:
    - "Add INTERNAL_FIELDS blocklist (updated_at, created_at, deleted_at, approved_at, etc.)"
    - "Filter changedFields through blocklist before creating timeline event"
    - "Skip event entirely if no meaningful fields remain after filtering"
  debug_session: ".planning/debug/job-timeline-internal-fields.md"

- truth: "Star rating/feedback dialog should automatically open after accepting completed work"
  status: failed
  reason: "User reported: the dialog still hasn't appeared automatically. but it exists in the detail page, which I can click and give feedback"
  severity: major
  test: 8
  root_cause: "feedbackOpen state lives in RequestDetailActions (line 29). After accept, handleAccepted sets feedbackOpen via 100ms setTimeout, but onSuccess calls router.refresh() immediately which remounts the component and loses the state. Need to lift feedbackOpen state to RequestDetailClient which survives the refresh."
  artifacts:
    - path: "components/requests/request-detail-actions.tsx"
      issue: "Line 29: feedbackOpen state local to component, lost on router.refresh() remount"
    - path: "components/requests/request-acceptance-dialog.tsx"
      issue: "Lines 91-95: onSuccess triggers refresh before setTimeout fires"
    - path: "components/requests/request-detail-client.tsx"
      issue: "No mechanism to pass feedbackOpen intent through refresh cycle"
  missing:
    - "Lift feedbackOpen state to RequestDetailClient"
    - "Move RequestFeedbackDialog render to RequestDetailClient"
    - "Pass onAccepted callback down to RequestDetailActions"
  debug_session: ""
