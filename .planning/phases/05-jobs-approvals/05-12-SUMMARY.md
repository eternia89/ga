---
phase: 05-jobs-approvals
plan: 12
subsystem: ui, api
tags: [rbac, job-detail, role-filtering, responsive-layout]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: Job detail page, job list, job actions
provides:
  - Role-based job list filtering (general_user, ga_staff see only assigned jobs)
  - Role-based job detail access check
  - Page-level header on job detail matching request detail pattern
  - max-w-[1000px] constraint on both job and request detail pages
  - Card wrapper removed from JobDetailInfo
affects: [05-jobs-approvals, 09-polish-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: [page-level-header-pattern, role-based-list-filtering]

key-files:
  created: []
  modified:
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/jobs/[id]/page.tsx
    - app/(dashboard)/requests/[id]/page.tsx
    - components/jobs/job-detail-info.tsx

key-decisions:
  - "Role filter applies to both general_user and ga_staff using assigned_to check"
  - "Page-level header pattern with display_id, status badge, priority badge, PM badge matches request detail exactly"
  - "Redundant badges removed from JobDetailInfo internal header to avoid duplication"

patterns-established:
  - "Page-level header: display_id + badges above the two-column layout, consistent across job and request detail"
  - "max-w-[1000px] on all detail pages for consistent content width"

requirements-completed: [REQ-JOB-007, REQ-JOB-008, REQ-RBAC-002]

# Metrics
duration: 3min
completed: 2026-02-26
---

# Phase 05 Plan 12: Job List Role Filtering and Detail Page UI Overhaul Summary

**Role-based job list/detail access for general_user/ga_staff, plus page-level header and no-card layout matching request detail pattern**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-26T12:34:22Z
- **Completed:** 2026-02-26T12:37:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- General users and GA Staff only see jobs assigned to them on the list page
- Job detail page returns 404 for unassigned jobs (role-based access check)
- Page-level header with display_id, status, priority, PM badges on job detail
- max-w-[1000px] on both job and request detail pages
- Removed card wrapper from JobDetailInfo for clean layout
- Removed redundant badge duplication from JobDetailInfo internal header

## Task Commits

Each task was committed atomically:

1. **Task 1: Add role-based filtering to jobs list and detail pages** - `8adc30d` (feat)
2. **Task 2: Overhaul job detail page UI to match request detail pattern** - `027b737` (feat)

## Files Created/Modified
- `app/(dashboard)/jobs/page.tsx` - Added role-based query filtering for general_user/ga_staff
- `app/(dashboard)/jobs/[id]/page.tsx` - Added role-based access check and page-level header with badges
- `app/(dashboard)/requests/[id]/page.tsx` - Added max-w-[1000px] for consistency
- `components/jobs/job-detail-info.tsx` - Removed card wrapper, removed redundant display_id/status/priority header, restructured title row

## Decisions Made
- Role filter applies to both general_user and ga_staff (both only see assigned jobs)
- GA Lead, Admin, Finance Approver see all company jobs (RLS handles company isolation)
- Page-level header pattern mirrors request detail page exactly (display_id, status badge, priority badge)
- Removed OverdueBadge, JobStatusBadge, JobPriorityBadge imports from job-detail-info.tsx since badges moved to page level

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Job detail page UI now consistent with request detail page
- Ready for plan 05-13 (inline PIC Combobox and normalized estimated cost)

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-26*
