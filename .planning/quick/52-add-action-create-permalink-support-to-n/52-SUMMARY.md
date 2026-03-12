---
phase: quick
plan: 52
subsystem: requests
tags: [permalink, url-sync, modal, create-dialog]
dependency_graph:
  requires: []
  provides: [requests-create-permalink]
  affects: [components/requests/request-create-dialog.tsx]
tech_stack:
  added: []
  patterns: [useSearchParams + useRouter bidirectional URL sync]
key_files:
  created: []
  modified:
    - components/requests/request-create-dialog.tsx
decisions:
  - "Used identical handleOpenChange pattern as job-create-dialog.tsx and asset-create-dialog.tsx for consistency"
metrics:
  duration: "2 min"
  completed_date: "2026-03-12"
---

# Quick Task 52: Add ?action=create Permalink Support to New Request Modal — Summary

## One-liner

Added bidirectional `?action=create` URL sync to `RequestCreateDialog` matching the identical pattern already in `JobCreateDialog` and `AssetCreateDialog`.

## What Was Done

`RequestCreateDialog` was missing the URL sync pattern despite the requests page already reading `?action=create` via `initialOpen={action === 'create'}`. Clicking "New Request" did not write the URL param, making the address bar non-shareable during a session.

Applied the exact same `handleOpenChange` pattern from `job-create-dialog.tsx`:
- Added `useSearchParams` to the import
- Added `searchParams` hook call
- Added `handleOpenChange(value)` that sets `?action=create` on open and clears it on close
- Wired Button `onClick`, Dialog `onOpenChange`, and `onSuccess` callback to use `handleOpenChange`

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add URL sync to RequestCreateDialog | ad826f3 | components/requests/request-create-dialog.tsx |

## Verification

Build passed with no TypeScript errors (`npm run build`).

Behavioral expectations:
- Navigating to `/requests?action=create` opens the New Request modal automatically (was already working)
- Clicking "New Request" button now adds `?action=create` to the URL (fixed)
- Closing the modal (any method: X, Escape, backdrop, Cancel) removes `?action=create` from URL (fixed)
- Successful form submit also removes `?action=create` from URL (fixed)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist:
- [x] components/requests/request-create-dialog.tsx — FOUND

### Commits exist:
- [x] ad826f3 — FOUND

## Self-Check: PASSED
