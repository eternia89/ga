---
phase: quick
plan: 47
subsystem: jobs, inventory
tags: [permalink, url-sync, create-modal, ux]
dependency_graph:
  requires: []
  provides: [bidirectional-url-sync-job-create, bidirectional-url-sync-asset-create]
  affects: [jobs/page.tsx, inventory/page.tsx]
tech_stack:
  added: []
  patterns: [useSearchParams + useRouter for bidirectional URL sync]
key_files:
  created: []
  modified:
    - components/jobs/job-create-dialog.tsx
    - components/assets/asset-create-dialog.tsx
decisions:
  - handleOpenChange wraps setOpen + router.replace so both open and close paths are covered
  - window.location.pathname used as fallback when no remaining query params (avoids empty ? suffix)
  - onSuccess in AssetSubmitForm now calls handleOpenChange(false) instead of setOpen(false) so URL is cleaned up after successful creation
metrics:
  duration: 3min
  completed: 2026-03-11
  tasks: 1
  files: 2
---

# Quick Task 47: Add Permalink URL Sync to New Job and New Asset Create Modals — Summary

**One-liner:** Bidirectional ?action=create URL sync added to JobCreateDialog and AssetCreateDialog using useSearchParams + useRouter.replace.

## What Was Done

Both create dialog components (`job-create-dialog.tsx` and `asset-create-dialog.tsx`) previously accepted an `initialOpen` prop (set from `searchParams.action === 'create'` in the server page components), meaning direct navigation to `/jobs?action=create` would open the modal. However, clicking the "New Job" or "New Asset" CTA button did NOT update the URL, so the address bar was never shareable during a session.

The fix adds a `handleOpenChange` handler that:
- On open: adds `?action=create` to the URL via `router.replace`
- On close: removes `action` from the URL params and calls `router.replace` with the remaining params or the bare pathname

Both the Button's `onClick` and the Dialog/JobModal's `onOpenChange` now route through `handleOpenChange`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add URL sync to JobCreateDialog and AssetCreateDialog | dd971dc | components/jobs/job-create-dialog.tsx, components/assets/asset-create-dialog.tsx |

## Verification

- Build passes: `npm run build` completed with no TypeScript errors
- `/jobs?action=create` opens New Job modal on page load (pre-existing)
- `/inventory?action=create` opens New Asset modal on page load (pre-existing)
- Clicking "New Job" button now writes `?action=create` to URL
- Clicking "New Asset" button now writes `?action=create` to URL
- Closing either modal removes `?action=create` from URL

## Deviations from Plan

**1. [Rule 1 - Bug] AssetSubmitForm onSuccess callback updated to use handleOpenChange**

- **Found during:** Task 1
- **Issue:** The `onSuccess` callback in `AssetCreateDialog` called `setOpen(false)` directly, bypassing `handleOpenChange`. This meant after a successful asset creation the URL would NOT be cleared.
- **Fix:** Changed `onSuccess` to call `handleOpenChange(false)` instead of `setOpen(false)`.
- **Files modified:** `components/assets/asset-create-dialog.tsx`
- **Commit:** dd971dc

## Self-Check: PASSED

- `/Users/melfice/code/ga/components/jobs/job-create-dialog.tsx` — FOUND
- `/Users/melfice/code/ga/components/assets/asset-create-dialog.tsx` — FOUND
- Commit dd971dc — FOUND
