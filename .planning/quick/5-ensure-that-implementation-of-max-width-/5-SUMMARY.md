---
phase: quick-5
plan: 01
subsystem: ui-layout
tags: [refactor, max-width, layout, convention]
dependency-graph:
  requires: []
  provides: [single-source-max-width]
  affects: [request-detail, job-detail, asset-detail, claude-md]
tech-stack:
  added: []
  patterns: [single-source-of-truth-layout-constraint]
key-files:
  created: []
  modified:
    - components/requests/request-detail-client.tsx
    - components/jobs/job-detail-client.tsx
    - components/assets/asset-detail-client.tsx
    - CLAUDE.md
decisions:
  - "Layout.tsx max-w-[1300px] is the single source of truth for content max-width"
  - "Individual page components must not define their own max-width constraints"
metrics:
  duration: 82s
  completed: 2026-03-04
---

# Quick Task 5: Consolidate Content Max-Width Summary

Removed redundant `max-w-[1000px] mx-auto` from 3 detail page components, making `app/(dashboard)/layout.tsx` the single source of truth for content width via its `max-w-[1300px] mx-auto` wrapper.

## What Was Done

### Task 1: Remove duplicate max-width from detail components and update CLAUDE.md
**Commit:** d05c640

Removed `max-w-[1000px] mx-auto` from the outermost grid div in:
- `components/requests/request-detail-client.tsx` (line 80)
- `components/jobs/job-detail-client.tsx` (line 65)
- `components/assets/asset-detail-client.tsx` (line 80)

Updated CLAUDE.md "UI Conventions" section:
- Old: "Detail page max width" rule requiring each detail page to set `max-w-[1000px]`
- New: "Content max width" rule stating it is defined once in layout.tsx and should not be duplicated in page components

Grid layout classes (`grid-cols-[1fr_380px] max-lg:grid-cols-1 gap-6`) preserved unchanged in all three files.

## Verification Results

- Zero occurrences of `max-w-[1000px]` in the 3 detail client components
- `app/(dashboard)/layout.tsx` line 74 still has `max-w-[1300px] mx-auto` as single source of truth
- `npm run build` passes with no errors

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions Made

1. **Layout max-width is single source of truth:** `app/(dashboard)/layout.tsx` defines content max-width once via `max-w-[1300px] mx-auto`. All descendant pages inherit this constraint through CSS cascade.
2. **Convention updated in CLAUDE.md:** Future developers are directed to update only the layout value, never add max-width in individual page components.
