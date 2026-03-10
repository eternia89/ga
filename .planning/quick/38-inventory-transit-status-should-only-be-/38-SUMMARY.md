---
phase: quick-38
plan: "01"
subsystem: inventory
tags: [ui, asset-table, badge, cleanup]
dependency_graph:
  requires: []
  provides: []
  affects: [components/assets/asset-columns.tsx]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - components/assets/asset-columns.tsx
decisions:
  - Removed Transit chip from location_name cell entirely; simplified cell to return span directly without flex wrapper
  - Status column pendingTransfers lookup left untouched so AssetStatusBadge continues to show In Transit
metrics:
  duration: "3min"
  completed_date: "2026-03-10"
---

# Quick Task 38: Inventory Transit Status — Remove Duplicate Transit Chip from Location Column

## One-liner

Deleted the blue "Transit" chip from the Location column cell so "In Transit" status appears exactly once (in the Status column via AssetStatusBadge).

## What Was Done

**Task 1: Remove transit badge from Location column**

Removed the `pendingTransfer && <span>Transit</span>` block from the `location_name` column cell renderer in `components/assets/asset-columns.tsx`. Also removed the now-unused `pendingTransfer` variable declaration from that cell.

The Status column's `pendingTransfers` meta lookup (lines 87-88) was left completely untouched — `AssetStatusBadge` still receives `showInTransit={!!pendingTransfer}` and renders the "In Transit" indicator alongside the asset status badge.

The location cell was also simplified from a flex div wrapper to a direct span return.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 558bcae | fix(quick-38): remove duplicate Transit chip from Location column |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- Location column cell contains no reference to "Transit" text or the blue transit chip — confirmed
- Status column still renders AssetStatusBadge with showInTransit for pending transfers — confirmed (unchanged)
- `npx eslint components/assets/asset-columns.tsx --max-warnings=0` — passes with no errors or warnings

## Self-Check: PASSED

- File exists: `components/assets/asset-columns.tsx` — FOUND
- Commit 558bcae — FOUND
