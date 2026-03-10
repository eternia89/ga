---
phase: quick-23
plan: 01
subsystem: ui
tags: [geolocation, permissions-api, react-hooks, two-step-flow]

requires:
  - phase: 09-polish-integration
    provides: GPS capture blocking flow on job status changes
provides:
  - useGeolocationPermission hook for reactive browser permission tracking
  - Two-step Activate Location / Start Work button flow on job detail and modal
affects: [jobs, geolocation]

tech-stack:
  added: []
  patterns: [Permissions API reactive subscription via change event listener]

key-files:
  created: []
  modified:
    - hooks/use-geolocation.ts
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-modal.tsx

key-decisions:
  - "useGeolocationPermission treats both 'unknown' and 'prompt' as not-granted for button logic"
  - "Activate Location calls capturePosition() to trigger browser prompt; permission state updates reactively via PermissionStatus change event"
  - "Mark Complete remains ungated -- no location activation prerequisite"

requirements-completed: [QUICK-23]

duration: 1min
completed: 2026-03-09
---

# Quick Task 23: Replace Start Work with Activate Location Summary

**Two-step geolocation flow: Activate Location button triggers browser permission, then swaps to Start Work reactively via Permissions API listener**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-09T05:57:58Z
- **Completed:** 2026-03-09T05:59:23Z
- **Tasks:** 1
- **Files modified:** 3

## Accomplishments
- Added `useGeolocationPermission` hook that reactively tracks browser geolocation permission state via Permissions API
- Replaced single "Start Work" button with two-step flow: "Activate Location" (when permission not granted) then "Start Work" (after granted)
- Applied identical pattern to both job-detail-actions.tsx and job-modal.tsx
- Mark Complete button remains ungated (per locked decision)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add useGeolocationPermission hook and implement Activate Location flow** - `99a9bbc` (feat)

## Files Created/Modified
- `hooks/use-geolocation.ts` - Added useGeolocationPermission hook with Permissions API subscription and cleanup
- `components/jobs/job-detail-actions.tsx` - Two-step Activate Location / Start Work button with MapPin icon
- `components/jobs/job-modal.tsx` - Same two-step pattern applied to modal view

## Decisions Made
- useGeolocationPermission uses Permissions API `navigator.permissions.query()` with `change` event listener for reactive updates
- Falls back to `'unknown'` state when Permissions API unavailable (older Safari)
- Both `'unknown'` and `'prompt'` treated as "not yet granted" to show Activate Location button
- If permission is `'denied'`, Activate Location still shown -- clicking it will fail with existing error message guiding user to fix browser settings
- `handleActivateLocation` is a separate function that calls `capturePosition()` to trigger browser prompt, with success feedback "Location activated. You can now start work."

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Two-step location flow ready for testing on device with GPS
- No blockers

---
*Phase: quick-23*
*Completed: 2026-03-09*
