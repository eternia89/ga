---
phase: 05-jobs-approvals
plan: 09
subsystem: ui
tags: [approval-queue, data-table, checkbox-filter, shadcn-table]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: Approval queue page and component (Tabs-based implementation from plan 04)
provides:
  - Approval queue refactored from Tabs to single data table with checkbox filter
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Unified server-side data fetch with computed decision field passed to client table
    - Checkbox filter for show/hide history (default: show pending only)

key-files:
  created: []
  modified:
    - app/(dashboard)/approvals/page.tsx
    - components/approvals/approval-queue.tsx

key-decisions:
  - "Unified data fetch on server: single query for all jobs (pending + approved + rejected) via OR filter, computed decision field avoids client-side classification"
  - "ApprovalJob type exported from approval-queue.tsx so server page.tsx can type-assert the mapped array correctly"
  - "Supabase FK relations (pic, approved_by_user, rejected_by_user, request in job_requests) come back as arrays — each mapped via Array.isArray guard in page.tsx"

patterns-established:
  - "Checkbox show-history toggle: default unchecked (pending only), checked shows all items — simpler than tabs for pre-sorted approval queues"

requirements-completed:
  - REQ-APR-002
  - REQ-APR-004

# Metrics
duration: 2min
completed: 2026-02-26
---

# Phase 5 Plan 09: Approval Queue Data Table Refactor Summary

**Approval queue refactored from Tabs (Pending/History) to a single shadcn Table with a "Show approved history" checkbox filter, unified server-side data fetch, and status badges (yellow/green/red)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-26T04:03:34Z
- **Completed:** 2026-02-26T04:06:02Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Replaced Tabs component with single data table view in approval-queue.tsx
- Server component now fetches all approval-related jobs in one unified query with computed `decision` field
- Checkbox "Show approved history" (default: unchecked) replaces History tab
- Status badges: yellow=Pending, green=Approved, red=Rejected
- Rejection reason shown inline under title for rejected rows
- Sort: pending items first, then by date descending within groups
- "Show history" quick-link text appears when pending items exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor approval queue from tabs to data table with checkbox filter** - `14e7a5d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `app/(dashboard)/approvals/page.tsx` - Unified data fetch, computed decision field, single `jobs` prop to ApprovalQueue
- `components/approvals/approval-queue.tsx` - New data table with checkbox filter, exported ApprovalJob type

## Decisions Made
- Unified server-side data fetch with OR filter (`status.eq.pending_approval,approved_at.not.is.null,approval_rejected_at.not.is.null`) — avoids two separate queries
- ApprovalJob type exported from component module so page.tsx can use it for type safety
- Supabase FK joins return arrays — all three join columns (pic, approved_by_user, rejected_by_user) unwrapped via Array.isArray guards in page.tsx; same for nested `request` in job_requests

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- TypeScript error on initial build: Supabase returns nested `request` field in `job_requests` as an array (not a single object). Fixed via Array.isArray map in page.tsx to unwrap to the correct `{ request: { display_id: string } }` shape.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- UAT test 18 gap fully resolved: approval queue now matches the data table pattern used elsewhere in the app
- All 05-jobs-approvals UAT gap closure plans complete

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-26*
