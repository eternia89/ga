---
phase: quick-43
plan: 01
subsystem: media
tags: [photo-annotation, dialog, ux, bug-fix]
dependency_graph:
  requires: []
  provides: [annotation-dialog-no-invisible-close-button]
  affects: [components/media/photo-annotation.tsx]
tech_stack:
  added: []
  patterns: [showCloseButton prop on DialogContent]
key_files:
  created: []
  modified:
    - components/media/photo-annotation.tsx
decisions:
  - "showCloseButton={false} on DialogContent removes the auto-injected X button; toolbar Cancel button remains the sole dismiss control"
metrics:
  duration: 3min
  completed_date: 2026-03-11
---

# Quick Task 43: Clear Icon in Photo Upload Modal is Black/Invisible — Summary

## One-liner

Removed the invisible auto-injected X close button from the annotation dialog by passing `showCloseButton={false}` to `DialogContent`.

## What Was Done

The `PhotoAnnotation` component wraps `DialogContent` which auto-injects an `X` close button at `absolute top-4 right-4`. This button has no explicit text color so it inherits foreground (black on white). The canvas area from ReactSketchCanvas renders with a dark background directly below, causing the button to visually bleed into the dark region and become invisible to users.

The annotation dialog already provides Cancel, Undo, and Clear controls in its toolbar, making the auto-injected close button redundant. The fix adds `showCloseButton={false}` to the `DialogContent` opening tag — a single character change using the existing `showCloseButton` prop already supported by `components/ui/dialog.tsx`.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Remove redundant auto-injected close button from PhotoAnnotation dialog | 4b00700 |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- Build passed cleanly with no TypeScript errors
- The annotation dialog no longer renders an auto-injected X button at top-right
- The Cancel button in the toolbar remains as the sole way to dismiss without saving

## Self-Check: PASSED

- `components/media/photo-annotation.tsx` — modified with `showCloseButton={false}` confirmed
- Commit `4b00700` exists in git log
