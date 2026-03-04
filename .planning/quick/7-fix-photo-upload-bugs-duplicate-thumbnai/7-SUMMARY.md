---
phase: quick-7
plan: 1
subsystem: ui, api
tags: [photo-upload, rls, supabase, controlled-component, react]

requires:
  - phase: 08-media-notifications-dashboards
    provides: PhotoUpload component and media attachment actions
provides:
  - "Controlled mode PhotoUpload via value prop for duplicate-free previews"
  - "Admin client soft-delete for media attachments bypassing RLS WITH CHECK"
affects: [requests, media, photo-upload]

tech-stack:
  added: []
  patterns:
    - "Controlled/uncontrolled PhotoUpload via optional value prop"
    - "Admin client for soft-delete operations that hit RLS WITH CHECK"

key-files:
  created: []
  modified:
    - components/media/photo-upload.tsx
    - components/requests/request-edit-form.tsx
    - app/actions/request-actions.ts

key-decisions:
  - "Controlled mode via useMemo(createObjectURL) + useEffect cleanup, not useState"
  - "Uncontrolled mode preserved for backward compat with asset forms"
  - "text-white hardcoded instead of fixing missing CSS variable for destructive-foreground"

patterns-established:
  - "PhotoUpload controlled mode: pass value={files} to eliminate internal/parent state sync bugs"

requirements-completed: [BUG-PHOTO-DUPLICATE, BUG-PHOTO-ICON, BUG-PHOTO-DELETE-RLS]

duration: 2min
completed: 2026-03-04
---

# Quick Task 7: Fix Photo Upload Bugs Summary

**Controlled mode PhotoUpload eliminating duplicate thumbnails, white remove icon, and admin client soft-delete bypassing RLS**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-04T11:12:18Z
- **Completed:** 2026-03-04T11:14:43Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- PhotoUpload now supports controlled mode via `value` prop -- when provided, previews are derived from value using useMemo, eliminating duplicate thumbnails caused by internal/parent state desync
- Remove button icons changed from `text-destructive-foreground` (undefined CSS var, rendered black) to `text-white` for visibility against red background
- deleteMediaAttachment soft-delete now uses admin client to bypass RLS WITH CHECK policy while keeping authenticated client for authorization

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix duplicate thumbnails and black icon in PhotoUpload component** - `8d3429d` (fix)
2. **Task 2: Fix RLS error in deleteMediaAttachment by using admin client** - `96f6330` (fix)

## Files Created/Modified
- `components/media/photo-upload.tsx` - Added controlled mode (value prop, useMemo previews, useEffect cleanup), stable keys, text-white on remove buttons
- `components/requests/request-edit-form.tsx` - Pass value={newFiles} to PhotoUpload for controlled mode
- `app/actions/request-actions.ts` - Import createAdminClient, use admin client for media attachment soft-delete UPDATE

## Decisions Made
- Used `text-white` hardcoded instead of defining `--destructive-foreground` CSS variable -- simpler, matches pattern in request-edit-form.tsx line 205
- Kept uncontrolled mode (no value prop) for backward compatibility with asset forms and other consumers
- setPreviews becomes no-op function in controlled mode -- parent drives all state via onChange

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Photo upload system fully functional: no duplicate thumbnails, visible remove icons, working photo deletion
- All three bugs resolved

---
*Quick Task: 7-fix-photo-upload-bugs-duplicate-thumbnai*
*Completed: 2026-03-04*
