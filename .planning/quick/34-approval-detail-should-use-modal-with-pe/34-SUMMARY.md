---
phase: quick-34
plan: 34
subsystem: approvals
tags: [modal, view-pattern, permalink, approval-queue]
dependency_graph:
  requires: [components/jobs/job-view-modal.tsx]
  provides: [ApprovalQueue with JobViewModal, /approvals?view= permalink]
  affects: [app/(dashboard)/approvals/page.tsx, components/approvals/approval-queue.tsx]
tech_stack:
  added: []
  patterns: [?view= URL param permalink, JobViewModal reuse]
key_files:
  created: []
  modified:
    - components/approvals/approval-queue.tsx
    - app/(dashboard)/approvals/page.tsx
decisions:
  - "Reused JobViewModal directly rather than creating an approval-specific modal — it already includes approve/reject actions and prev/next navigation"
  - "Job IDs deduplicated via Set before passing to jobIds prop — same job can appear twice (budget row + completion row) but modal only needs one entry per job"
  - "Removed useRouter entirely since the only usage was the deleted router.push navigation"
metrics:
  duration: "4 min"
  completed_date: "2026-03-10"
  tasks_completed: 2
  files_modified: 2
---

# Phase quick-34: Approval Queue — View Modal with Permalink Summary

**One-liner:** Approval queue rows now open JobViewModal via View button with ?view={id} permalink support, replacing full-page /jobs/{id} navigation.

## What Was Built

Converted the approval queue table from full-page row-click navigation (`router.push('/jobs/{id}')`) to the standard modal view pattern used by all other domain entity tables.

Finance approvers can now review, approve, and reject jobs directly from the modal dialog without leaving the approvals queue. The modal includes all job detail, budget/completion approval actions, and prev/next job navigation.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Wire JobViewModal into ApprovalQueue component | b0f34c7 | components/approvals/approval-queue.tsx |
| 2 | Update approvals page to pass view param and user context | 79b9a55 | app/(dashboard)/approvals/page.tsx |

## Changes Detail

### components/approvals/approval-queue.tsx

- Extended `ApprovalQueueProps` with `initialViewId?: string`, `currentUserId: string`, `currentUserRole: string`
- Added `viewJobId` state initialized from `initialViewId`
- Removed `useRouter` import and `router.push('/jobs/${job.id}')` full-row click
- Removed `cursor-pointer` and `hover:bg-muted/50` from `<TableRow>`
- Added "Actions" `<TableHead className="w-[80px]">` at end of header row
- Added `<TableCell>` with View ghost button (`variant="ghost"`, `text-blue-600 hover:underline`) per data row
- Added `<JobViewModal>` at bottom of component with `jobIds` (deduplicated) and `onNavigate` wired
- Imported `Button` from `@/components/ui/button` and `JobViewModal` from `@/components/jobs/job-view-modal`

### app/(dashboard)/approvals/page.tsx

- Added `PageProps` interface with `searchParams: Promise<{ view?: string }>`
- Added `searchParams` parameter to page function, destructured `view`
- Passed `initialViewId={view}`, `currentUserId={profile.id}`, `currentUserRole={profile.role}` to `<ApprovalQueue>`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `components/approvals/approval-queue.tsx` — modified, JobViewModal wired
- [x] `app/(dashboard)/approvals/page.tsx` — modified, searchParams and user context passed
- [x] Commit b0f34c7 exists
- [x] Commit 79b9a55 exists
- [x] TypeScript: zero errors in approvals files (two pre-existing unrelated errors remain in .next/types and e2e test)
