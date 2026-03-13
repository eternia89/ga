---
phase: quick-62
plan: 01
subsystem: ui
tags: [react, useEffect, dialog, state-sync, radix-ui]

requires: []
provides:
  - UserFormDialog with correct useEffect-based state sync for selectedCompanyId and selectedExtraCompanies
affects: [admin-users-settings]

tech-stack:
  added: []
  patterns: [useEffect for dialog open state sync instead of onOpenChange wrapper]

key-files:
  created: []
  modified:
    - components/admin/users/user-form-dialog.tsx

key-decisions:
  - "useEffect with [open, user?.id, user?.company_id, defaultCompanyId, userCompanyAccess] deps replaces onOpenChange wrapper — Radix Dialog only calls onOpenChange when user closes, not when open prop transitions to true externally"

patterns-established:
  - "Dialog state sync pattern: use useEffect on open flag rather than onOpenChange(true) wrapper for external open prop transitions"

requirements-completed:
  - QUICK-62

duration: 3min
completed: 2026-03-13
---

# Quick Task 62: Fix UserFormDialog State Sync Summary

**useEffect replaces broken onOpenChange(true) wrapper so location dropdown and company access checkboxes always reflect current user data when dialog opens**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-13T07:57:00Z
- **Completed:** 2026-03-13T08:00:20Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added useEffect that fires when `open` transitions to true, syncing `selectedCompanyId` from `user.company_id` and `selectedExtraCompanies` from `userCompanyAccess`
- Removed the broken `onOpenChange` wrapper that only fired on close (Radix Dialog behavior), not on external `open` prop change
- Location dropdown now filters by the correct company when editing any user
- Company access checkboxes now reflect saved state after revalidation

## Task Commits

1. **Task 1: Add useEffect to sync selectedCompanyId and selectedExtraCompanies on dialog open** - `fb72efa` (fix)

## Files Created/Modified
- `/Users/samuel/code/ga/components/admin/users/user-form-dialog.tsx` - Added useEffect for state sync, removed redundant onOpenChange wrapper

## Decisions Made
- useEffect depends on `[open, user?.id, user?.company_id, defaultCompanyId, userCompanyAccess]` — `user?.id` is included so switching between different users while dialog stays mounted still re-syncs state even before the `key` prop remount takes effect

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- UserFormDialog state sync is now correct; location and company access fields render accurately on every open
- No blockers

---
*Phase: quick-62*
*Completed: 2026-03-13*
