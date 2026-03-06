---
phase: quick-16
plan: 01
subsystem: ui-modals
tags: [ui, modals, consistency, layout]
dependency-graph:
  requires: []
  provides: [standardized-modal-widths]
  affects: [job-modal, request-view-modal, asset-view-modal, asset-create-dialog, schedule-view-modal, template-view-modal, template-create-dialog]
tech-stack:
  added: []
  patterns: [1000px-view-modal, 600px-create-modal, 600px-400px-grid-split]
key-files:
  created: []
  modified:
    - components/jobs/job-modal.tsx
    - components/requests/request-view-modal.tsx
    - components/assets/asset-view-modal.tsx
    - components/assets/asset-create-dialog.tsx
    - components/maintenance/schedule-view-modal.tsx
    - components/maintenance/template-view-modal.tsx
    - components/maintenance/template-create-dialog.tsx
decisions:
  - View modals standardized to 1000px total with 600px form + 400px timeline grid split
  - Create modals standardized to 600px (matching form column width)
metrics:
  duration: 1min
  completed: 2026-03-06
---

# Quick Task 16: Standardize All Modal Widths Summary

Standardized all modal widths: view modals 800px->1000px with 600px+400px grid (was 1fr+350px), create modals 700px->600px.

## What Was Done

### Task 1: Update all view modal widths (fd995b2)

Changed 5 view modals from `max-w-[800px]` to `max-w-[1000px]` and updated grid columns from `grid-cols-[1fr_350px]` to `grid-cols-[600px_400px]`:

- `components/jobs/job-modal.tsx` -- view mode DialogContent + 2 grid instances
- `components/requests/request-view-modal.tsx` -- DialogContent + 2 grid instances
- `components/assets/asset-view-modal.tsx` -- DialogContent + 2 grid instances
- `components/maintenance/schedule-view-modal.tsx` -- DialogContent + 1 grid instance
- `components/maintenance/template-view-modal.tsx` -- DialogContent + 1 grid instance

Mobile responsive breakpoint (`max-lg:grid-cols-1`) preserved unchanged.

### Task 2: Standardize create modal widths (1f27e49)

Changed 3 create modals from `max-w-[700px]` to `max-w-[600px]`:

- `components/jobs/job-modal.tsx` (create mode)
- `components/assets/asset-create-dialog.tsx`
- `components/maintenance/template-create-dialog.tsx`

Request create and schedule create were already at 600px -- no changes needed.

## Deviations from Plan

None -- plan executed exactly as written.

## Verification

- Grep confirms 5 instances of `max-w-[1000px]` in view modals
- Grep confirms 0 instances of `max-w-[800px]` or `max-w-[700px]` in modal/dialog files
- Grep confirms 8 instances of `grid-cols-[600px_400px]` across view modals
- Build has pre-existing TS error in `category-form-dialog.tsx` (unrelated to modal width changes)
