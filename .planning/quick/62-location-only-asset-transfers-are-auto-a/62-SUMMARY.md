---
phase: quick-62
plan: "01"
subsystem: assets/inventory
tags: [asset-transfer, location-only, auto-accept, inventory-movements]
dependency_graph:
  requires: [quick-61]
  provides: [auto-accepted location-only transfers, no-photo location mode]
  affects: [app/actions/asset-actions.ts, components/assets/asset-transfer-dialog.tsx]
tech_stack:
  added: []
  patterns: [branch-on-receiver_id, immediate-location-update]
key_files:
  modified:
    - app/actions/asset-actions.ts
    - components/assets/asset-transfer-dialog.tsx
decisions:
  - "isLocationOnly flag derived from !receiver_id: keeps branching logic co-located with insert"
  - "location_id update runs immediately after movement insert (same request) — no cron, no accept step"
  - "Photo upload section fully hidden in location mode (not disabled) — cleaner UX, no required-field confusion"
metrics:
  duration: "2 min"
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_changed: 2
---

# Quick Task 62: Location-Only Asset Transfers Auto-Accept Summary

**One-liner:** Location-only asset transfers (no receiver) now auto-accept immediately — movement inserted with status=accepted and asset location_id updated in a single createTransfer call; photo section hidden for location mode.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Auto-accept location-only movements in createTransfer | ad740be | app/actions/asset-actions.ts |
| 2 | Remove photo requirement for location-only transfer mode | 88690b2 | components/assets/asset-transfer-dialog.tsx |

## What Was Built

### Task 1 — createTransfer auto-accept (app/actions/asset-actions.ts)

Added `isLocationOnly` branch in `createTransfer`:
- When `receiver_id` is absent: inserts movement with `status: 'accepted'`, `received_by: profile.id`, `received_at: now`; then immediately updates `inventory_items.location_id`
- When `receiver_id` is present: unchanged — inserts with `status: 'pending'`, no location update

This eliminates the broken flow where location-only transfers got stuck in `pending` with no path to acceptance (since `acceptTransfer` checks `receiver_id === profile.id`, which fails for NULL).

### Task 2 — Dialog UI (components/assets/asset-transfer-dialog.tsx)

- `canSubmit` for location mode no longer requires `photos.length > 0` — only `toLocationId !== ''`
- Photo upload section wrapped in `{mode === 'user' && (...)}` — completely hidden in location mode
- Helper text `"Asset will be moved to this location immediately."` appears after location is selected

## Decisions Made

- `isLocationOnly = !parsedInput.receiver_id` co-located with the insert — single, readable branch
- Location update happens synchronously after movement insert in same server action call
- Photos hidden (not conditionally required) in location mode for the cleanest UX

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npm run build` passes with no TypeScript errors (both tasks)
- Location mode: no photo upload shown, submit enabled once location selected
- User mode: photo upload still required, unchanged behavior
- DB: location-only movement has `status=accepted`, `received_at` set; asset `location_id` updated
- No Accept/Reject buttons appear for location-only transfers (never enters pending state)

## Self-Check: PASSED

- app/actions/asset-actions.ts — FOUND
- components/assets/asset-transfer-dialog.tsx — FOUND
- 62-SUMMARY.md — FOUND
- Commit ad740be — FOUND
- Commit 88690b2 — FOUND
