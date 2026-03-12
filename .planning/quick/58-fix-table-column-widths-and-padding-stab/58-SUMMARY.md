---
phase: quick-58
plan: 01
subsystem: tables
tags: [ui, table, text-wrapping, content-columns]
dependency_graph:
  requires: []
  provides: [wrapping-content-cells-in-all-entity-tables]
  affects: [components/requests/request-columns.tsx, components/jobs/job-columns.tsx, components/assets/asset-columns.tsx, components/maintenance/schedule-columns.tsx]
tech_stack:
  added: []
  patterns: [whitespace-normal break-words override for shadcn TableCell whitespace-nowrap default]
key_files:
  created: []
  modified:
    - components/requests/request-columns.tsx
    - components/jobs/job-columns.tsx
    - components/assets/asset-columns.tsx
    - components/maintenance/schedule-columns.tsx
decisions:
  - Removed inline max-w-[Npx] from fixed-size column spans — redundant with DataTable's maxWidth inline style already applied via column size metadata
metrics:
  duration: 5min
  completed: 2026-03-12
---

# Phase quick-58 Plan 01: Fix Table Column Text Wrapping Summary

**One-liner:** Replace `truncate` with `whitespace-normal break-words` on all content-column cells so long values wrap within their fixed column boundaries instead of being clipped with ellipsis.

## What Was Changed

### Task 1: Requests and Jobs tables

**components/requests/request-columns.tsx**

| Column | Old className | New className |
|---|---|---|
| Title (grow) | `truncate block` | `whitespace-normal break-words block` |
| Location | `truncate block max-w-[130px]` | `whitespace-normal break-words` |
| PIC | `truncate block max-w-[120px]` | `whitespace-normal break-words` |

**components/jobs/job-columns.tsx**

| Column | Old className | New className |
|---|---|---|
| Title (grow) | `truncate block text-sm` | `whitespace-normal break-words text-sm` |
| Location | `truncate block max-w-[130px]` | `whitespace-normal break-words` |
| PIC | `truncate block max-w-[120px]` | `whitespace-normal break-words` |

### Task 2: Assets and Schedules tables

**components/assets/asset-columns.tsx**

| Column | Old className | New className |
|---|---|---|
| Name (grow) | `truncate block font-medium` | `whitespace-normal break-words font-medium` |
| Category | `truncate block max-w-[140px]` | `whitespace-normal break-words` |
| Location | `truncate block max-w-[160px]` | `whitespace-normal break-words` |

**components/maintenance/schedule-columns.tsx**

| Column | Old className | New className |
|---|---|---|
| Template button (grow) | `font-medium ... truncate block text-left` | `font-medium ... whitespace-normal break-words text-left` |
| Asset Link | `max-w-[200px] truncate block hover:underline` | `whitespace-normal break-words hover:underline` |

## Columns Left Unchanged (Single-line)

- ID columns: `font-mono text-xs` spans — still single-line, no change
- Status badge columns: component rendering, no text truncation
- Priority badge columns: component rendering, no text truncation
- Photo column: image thumbnail, no text
- Date columns (created_at, warranty_expiry, next_due_at, last_completed_at): no `whitespace-normal` added
- Interval column (`tabular-nums`): no change
- Interval type column (badge spans): no change
- Actions column: button elements, no change

## Edge Cases Found

None. The plan's analysis of the architecture (DataTable applying `width/minWidth/maxWidth` inline styles from column `size`, `TableCell` defaulting to `whitespace-nowrap`) was accurate. Removing `truncate` and `max-w-[...]` from spans while adding `whitespace-normal break-words` was sufficient.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `truncate` class: absent from all content-column spans/buttons/links (grep confirms 0 matches)
- `whitespace-normal`: present in 11 content-column locations across 4 files
- `font-mono`: still present on all 3 ID column spans
- `npm run build`: passes clean (no TypeScript errors)
- `npm run lint`: no new errors (pre-existing `<img>` warnings unchanged from prior work)

## Self-Check: PASSED

Files exist:
- components/requests/request-columns.tsx — FOUND
- components/jobs/job-columns.tsx — FOUND
- components/assets/asset-columns.tsx — FOUND
- components/maintenance/schedule-columns.tsx — FOUND

Commits:
- c55aff2 — fix(quick-58): wrap content columns in requests and jobs tables — FOUND
- ce5d217 — fix(quick-58): wrap content columns in assets and schedules tables — FOUND
