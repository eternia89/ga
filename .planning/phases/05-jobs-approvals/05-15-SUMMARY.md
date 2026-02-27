---
phase: 05-jobs-approvals
plan: 15
subsystem: ui
tags: [approval-queue, feedback-dialog, state-lifting, react-state]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: "Approval queue (05-09), acceptance/feedback flow (05-05)"
provides:
  - "All-statuses default view with date-descending sort on approval queue"
  - "Feedback dialog auto-opens after work acceptance (survives router.refresh)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lift dialog state to nearest client component that survives router.refresh()"

key-files:
  created: []
  modified:
    - components/approvals/approval-queue.tsx
    - components/requests/request-detail-client.tsx
    - components/requests/request-detail-actions.tsx

key-decisions:
  - "pendingOnly state (default false) replaces showHistory (default false) -- inverted semantics so all approvals visible by default"
  - "feedbackOpen state lifted from RequestDetailActions to RequestDetailClient to survive router.refresh() remount"
  - "300ms delay before opening feedback dialog to let acceptance dialog close animation finish"

patterns-established:
  - "State-lifting pattern: dialog open state that must survive router.refresh() lives in the nearest stable client component ancestor"

requirements-completed: [REQ-APR-002, REQ-REQ-010]

# Metrics
duration: 3min
completed: 2026-02-27
---

# Phase 05 Plan 15: Approval Queue Default View and Feedback Dialog Auto-Open Summary

**Approval queue defaults to all statuses with date-descending sort; feedback dialog auto-opens after acceptance via lifted state in RequestDetailClient**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-27T02:54:39Z
- **Completed:** 2026-02-27T02:57:29Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Approval queue now shows all approvals (pending, approved, rejected) by default sorted by date descending
- "Show pending only" checkbox replaces old "Show approved history" checkbox with inverted default
- Feedback dialog reliably auto-opens after work acceptance by lifting feedbackOpen state to RequestDetailClient
- Manual "Give Feedback" button still works via onAccepted callback delegation

## Task Commits

Each task was committed atomically:

1. **Task 1: Show all approval statuses by default with date-descending sort** - `8febca0` (feat)
2. **Task 2: Lift feedbackOpen state to RequestDetailClient for auto-open after acceptance** - `3796f8c` (fix)

## Files Created/Modified
- `components/approvals/approval-queue.tsx` - Renamed showHistory to pendingOnly, inverted default, flat date-descending sort, updated checkbox/messages
- `components/requests/request-detail-client.tsx` - Added feedbackOpen state, handleAccepted callback, renders RequestFeedbackDialog
- `components/requests/request-detail-actions.tsx` - Added onAccepted prop, removed local feedbackOpen state and RequestFeedbackDialog render

## Decisions Made
- Renamed `showHistory` to `pendingOnly` with inverted semantics to match the new default (all approvals visible)
- Removed pending-first sort in favor of flat date-descending sort -- simpler and matches user expectation
- 300ms delay (up from 100ms) before opening feedback dialog to ensure acceptance dialog close animation completes smoothly
- Summary line now always shows pending count when > 0 (with "out of N total" when showing all), removing the old "Show history" link

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 05 UAT gap closure complete -- all 15 plans executed
- Approval queue and feedback dialog behave as expected per UAT retest findings

## Self-Check: PASSED

All files exist. All commits verified (8febca0, 3796f8c).

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-27*
