---
phase: 05-jobs-approvals
plan: 05
subsystem: ui
tags: [requests, acceptance, feedback, star-rating, server-actions, lucide]

# Dependency graph
requires:
  - phase: 05-01
    provides: pending_acceptance status, accepted_at, feedback_rating fields, auto_accept cron
  - phase: 05-02
    provides: job_requests join table, linked jobs schema
  - phase: 04-02
    provides: RequestDetailClient, RequestTimeline, request-columns patterns

provides:
  - acceptRequest / rejectCompletedWork / submitFeedback server actions
  - RequestAcceptanceDialog (accept/reject completed work)
  - RequestFeedbackDialog (1-5 star rating + optional comment)
  - FeedbackStarRating component (hover preview, read-only mode)
  - Linked jobs section on request detail (clickable links with status badges)
  - Accept Work / Reject Work buttons on request detail for pending_acceptance
  - Acceptance event types in RequestTimeline (acceptance, acceptance_rejection, auto_acceptance, feedback)
  - Accept/Reject Work actions in request table dropdown menu
affects: 06-inventory, 08-notifications, 09-polish

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RequestAcceptanceDialog accepts mode prop ('accept' | 'reject') to dual-purpose one component"
    - "FeedbackStarRating uses hover state + value state for preview vs selected distinction"
    - "acceptRequest triggers onAccepted callback which opens feedback dialog directly after acceptance"
    - "Timeline event classification: acceptance_rejection checked before cancellation for safety"

key-files:
  created:
    - components/requests/request-acceptance-dialog.tsx
    - components/requests/request-feedback-dialog.tsx
    - components/requests/feedback-star-rating.tsx
  modified:
    - app/actions/request-actions.ts
    - components/requests/request-detail-actions.tsx
    - components/requests/request-detail-client.tsx
    - components/requests/request-detail-info.tsx
    - components/requests/request-timeline.tsx
    - components/requests/request-columns.tsx
    - components/requests/request-table.tsx
    - app/(dashboard)/requests/[id]/page.tsx

key-decisions:
  - "RequestAcceptanceDialog uses single component with mode prop (accept/reject) instead of two separate components — reduces duplication"
  - "Accept action triggers optional feedback dialog inline (onAccepted callback) so requester is prompted immediately after acceptance"
  - "Feedback submission closes request to 'closed' status — final terminal state indicating feedback received"
  - "Rejection of completed work uses acceptance_rejected_reason field (not rejection_reason) to distinguish from GA-level rejection"
  - "Linked jobs query uses job_requests join table to support N:M relationship — single request may have multiple linked jobs"
  - "Timeline acceptance detection checks both status=accepted AND accepted_at changed to avoid misclassifying old status_change events"

requirements-completed:
  - REQ-REQ-008
  - REQ-REQ-009
  - REQ-REQ-010

# Metrics
duration: 7min
completed: 2026-02-25
---

# Phase 5 Plan 05: Requester Acceptance Cycle Summary

**Full requester acceptance cycle with accept/reject dialogs, 1-5 star feedback, linked jobs display as clickable links, and acceptance event types in the activity timeline**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-24T22:49:18Z
- **Completed:** 2026-02-24T22:56:00Z
- **Tasks:** 2
- **Files modified:** 8 modified, 3 created

## Accomplishments

- Requester can accept or reject completed work from the request detail page, with rejection reverting linked jobs to in_progress
- Star rating component with hover preview and read-only display mode; feedback dialog submits 1-5 rating + optional comment and closes the request
- Request detail now shows linked jobs section with job ID, title, and live status badge as clickable links to job detail pages
- Timeline extended with 4 new event types: acceptance, acceptance_rejection, auto_acceptance, feedback (with inline star display)
- Accept Work / Reject Work actions added to table row dropdown for pending_acceptance requests

## Task Commits

1. **Task 1: Accept/reject server actions and acceptance dialogs** - `649f7cd` (feat)
2. **Task 2: Feedback star rating, linked jobs display, acceptance indicators** - `26d1b7d` (feat)

## Files Created/Modified

- `app/actions/request-actions.ts` - Added acceptRequest, rejectCompletedWork, submitFeedback server actions
- `components/requests/request-acceptance-dialog.tsx` - New: accept/reject dialog with mode prop
- `components/requests/request-feedback-dialog.tsx` - New: 1-5 star feedback dialog with optional comment
- `components/requests/feedback-star-rating.tsx` - New: Lucide Star-based rating component
- `components/requests/request-detail-actions.tsx` - Added Accept Work, Reject Work, Give Feedback buttons
- `components/requests/request-detail-client.tsx` - Added linkedJobs prop and LinkedJob interface export
- `components/requests/request-detail-info.tsx` - Linked Jobs section, feedback display, acceptance rejection callout
- `components/requests/request-timeline.tsx` - 4 new event types with icons and colors
- `components/requests/request-columns.tsx` - Accept Work / Reject Work dropdown actions for pending_acceptance
- `components/requests/request-table.tsx` - Acceptance dialog state + handlers wired to table meta
- `app/(dashboard)/requests/[id]/page.tsx` - Linked jobs query via job_requests, acceptance/feedback event processing

## Decisions Made

- RequestAcceptanceDialog uses a single component with a `mode` prop instead of two separate components
- Accept action triggers onAccepted callback which immediately opens the feedback dialog (prompts user right after acceptance)
- submitFeedback transitions request to 'closed' status (final terminal state)
- rejection of completed work uses `acceptance_rejected_reason` field to distinguish from GA-level rejection
- Timeline acceptance event detection checks both `status === 'accepted'` AND `accepted_at` in changedFields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript passed cleanly and build succeeded on first attempt.

## Next Phase Readiness

Phase 5 is now complete (5/5 plans done):
- All job/request lifecycle stages implemented: create, triage, assign, work, complete, accept/reject, feedback
- Ready for Phase 6 (Inventory) or Phase 8 (Notifications/Dashboard)

## Self-Check: PASSED

- FOUND: components/requests/request-acceptance-dialog.tsx
- FOUND: components/requests/request-feedback-dialog.tsx
- FOUND: components/requests/feedback-star-rating.tsx
- FOUND: .planning/phases/05-jobs-approvals/05-05-SUMMARY.md
- FOUND commit: 649f7cd (feat(05-05): accept/reject server actions)
- FOUND commit: 26d1b7d (feat(05-05): feedback star rating, linked jobs display)

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-25*
