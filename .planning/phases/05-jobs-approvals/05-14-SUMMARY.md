---
phase: 05-jobs-approvals
plan: 14
subsystem: ui
tags: [detail-page, timeline, scroll, layout, centering]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: "Job and request detail pages with audit log timeline"
provides:
  - "Centered detail page layouts with mx-auto on max-w containers"
  - "Scrollable timeline with auto-scroll-to-bottom on job and request detail pages"
  - "Internal DB fields filtered from timeline display"
affects: [05-jobs-approvals, 09-polish-integration]

# Tech tracking
tech-stack:
  added: []
  patterns: ["INTERNAL_FIELDS blocklist for timeline event filtering", "useRef + useEffect auto-scroll to bottom pattern", "flex + min-h-0 scroll containment pattern"]

key-files:
  created: []
  modified:
    - app/(dashboard)/jobs/[id]/page.tsx
    - app/(dashboard)/requests/[id]/page.tsx
    - components/jobs/job-detail-client.tsx
    - components/requests/request-detail-client.tsx

key-decisions:
  - "INTERNAL_FIELDS blocklist includes approval/completion/feedback timestamps specific to each page context"
  - "calc(100vh - 200px) for timeline max-height instead of fixed pixel value to adapt to viewport"
  - "Job comment form stays outside scroll container for constant visibility"

patterns-established:
  - "INTERNAL_FIELDS Set blocklist: filter audit log changed_fields before creating generic field_update timeline events"
  - "Scrollable timeline pattern: flex col + flex-1 min-h-0 + overflow-y-auto with useRef auto-scroll"

requirements-completed: [REQ-JOB-008, REQ-REQ-007]

# Metrics
duration: 2min
completed: 2026-02-27
---

# Phase 05 Plan 14: Detail Page Layout Fix Summary

**Centered max-w containers with mx-auto, scrollable timelines with auto-scroll-to-bottom, and INTERNAL_FIELDS blocklist filtering updated_at/created_at/deleted_at from timeline display**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-27T02:50:08Z
- **Completed:** 2026-02-27T02:52:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Both job and request detail page containers now centered horizontally with mx-auto
- Internal database fields (updated_at, created_at, deleted_at, approval/feedback timestamps) filtered from timeline events via INTERNAL_FIELDS Set blocklist
- Timeline containers are height-constrained with viewport-relative max-height and overflow scrolling
- Auto-scroll to bottom on page load shows newest timeline entries first
- Job comment form stays visible outside the scroll area

## Task Commits

Each task was committed atomically:

1. **Task 1: Center detail page layouts and add internal fields blocklist** - `3f0037f` (feat)
2. **Task 2: Make timelines scrollable with auto-scroll to bottom** - `9328c49` (feat)

## Files Created/Modified
- `app/(dashboard)/jobs/[id]/page.tsx` - Added mx-auto centering, INTERNAL_FIELDS blocklist, meaningful field filtering
- `app/(dashboard)/requests/[id]/page.tsx` - Added mx-auto centering, INTERNAL_FIELDS blocklist, meaningful field filtering
- `components/jobs/job-detail-client.tsx` - Scrollable timeline with useRef auto-scroll, comment form outside scroll area
- `components/requests/request-detail-client.tsx` - Scrollable timeline with useRef auto-scroll

## Decisions Made
- Jobs page INTERNAL_FIELDS includes approval/completion timestamps (approved_at, approval_rejected_at, completion_approved_at, completion_rejected_at, completion_submitted_at, feedback_submitted_at) since these are handled by specific timeline event checks earlier in the loop
- Requests page INTERNAL_FIELDS includes feedback_submitted_at, feedback_rating, accepted_at, auto_accepted since these are already handled by dedicated timeline event types
- Used calc(100vh - 200px) for timeline max-height to be viewport-adaptive rather than a fixed pixel constraint

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Detail page layout issues from UAT retest resolved
- Plan 15 (remaining UAT gap closure) can proceed

## Self-Check: PASSED

All 4 files found. Both commits (3f0037f, 9328c49) verified. Key content (mx-auto, INTERNAL_FIELDS, overflow-y-auto) confirmed in all target files.

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-27*
