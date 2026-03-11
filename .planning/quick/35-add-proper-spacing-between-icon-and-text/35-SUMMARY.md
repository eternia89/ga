---
phase: quick-35
plan: "01"
subsystem: ui
tags: [timeline, spacing, visual, quick-fix]
dependency_graph:
  requires: []
  provides: [timeline-icon-text-spacing]
  affects: [request-timeline, job-timeline, asset-timeline]
tech_stack:
  added: []
  patterns: [tailwind-margin-utility]
key_files:
  created: []
  modified:
    - components/requests/request-timeline.tsx
    - components/jobs/job-timeline.tsx
    - components/assets/asset-timeline.tsx
decisions:
  - "Used ml-2 on the content div rather than increasing pl-* on the outer container — avoids moving the icon circle or vertical connector line"
metrics:
  duration: "3 min"
  completed: "2026-03-10"
  tasks_completed: 1
  files_modified: 3
---

# Quick Task 35: Add proper spacing between timeline icon circles and text content

## One-liner

Added `ml-2` (8px) margin to the text content div in all three timeline components so icon bubbles and text no longer appear cramped.

## What Was Done

**Task 1: Fix icon-to-text spacing in all three timeline components**

The timeline layout uses `pl-6` on the outer container and places the icon circle absolutely at `-left-6` (both are 24px), which means text started exactly at the right edge of the icon with zero visual gap.

Fix applied: added `ml-2` to the content `div` in each timeline, creating 8px of breathing room between the icon circle's right edge and the start of the text. The icon position (`absolute -left-6`) and vertical connector line (`absolute left-3`) are untouched.

Files changed:
- `components/requests/request-timeline.tsx` line 221 — `space-y-1` content div
- `components/jobs/job-timeline.tsx` line 235 — `space-y-1` event content div
- `components/jobs/job-timeline.tsx` line 271 — `space-y-2` comment content div
- `components/assets/asset-timeline.tsx` line 418 — `space-y-1` content div

Commit: `a9f1f76`

## Verification

`npm run build` — passed with no errors.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `components/requests/request-timeline.tsx` — ml-2 present: confirmed
- `components/jobs/job-timeline.tsx` — ml-2 present on both content divs: confirmed
- `components/assets/asset-timeline.tsx` — ml-2 present: confirmed
- Commit `a9f1f76` — exists: confirmed
- Build: passed
