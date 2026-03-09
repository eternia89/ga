---
phase: quick-25
plan: 01
subsystem: inventory, maintenance
tags: [transfer-flow, template-ui, asset-status]
dependency-graph:
  requires: []
  provides: [simplified-transfer-dialog, table-transfer-action, template-section-cleanup]
  affects: [asset-transfer-dialog, asset-columns, asset-table, asset-detail, template-builder, template-detail]
tech-stack:
  added: []
  patterns: [auto-derive-location-from-receiver, receiver-only-transfer]
key-files:
  created: []
  modified:
    - components/assets/asset-transfer-dialog.tsx
    - components/assets/asset-columns.tsx
    - components/assets/asset-table.tsx
    - components/assets/asset-detail-client.tsx
    - components/assets/asset-view-modal.tsx
    - components/assets/asset-detail-actions.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/[id]/page.tsx
    - components/maintenance/template-builder-item.tsx
    - components/maintenance/template-builder.tsx
    - components/maintenance/template-detail.tsx
    - components/maintenance/template-create-form.tsx
    - lib/types/maintenance.ts
decisions:
  - "Transfer dialog auto-derives destination location from receiver's location_id -- no manual location picker"
  - "Receiver with no location_id shows warning and blocks submit"
  - "GAUserWithLocation type exported from asset-transfer-dialog for reuse"
  - "Template sections use plain headers with Separator instead of bordered card wrappers"
  - "NumericItem type simplified to just ChecklistItemBase & { type: 'numeric' } -- existing JSONB unit fields ignored harmlessly"
metrics:
  duration: 5min
  completed: "2026-03-09"
---

# Quick Task 25: Asset Location Tracking & Transfer Flow Summary

Simplified transfer flow to receiver-only with auto-derived location, added Transfer action to table rows, cleaned up asset status display, and simplified template checklist UI.

## Task Completion

| Task | Name | Commit | Key Changes |
|------|------|--------|-------------|
| 1 | Simplify transfer flow and add Transfer action to asset table | 138c835 | Receiver-only transfer dialog, auto-derive location, Transfer button in table rows, status badge without button wrapper |
| 2 | Simplify template checklist UI - sections and numeric fields | 14b9629 | Remove unit field from numeric items, remove bordered card wrappers from template sections |

## Changes Made

### Task 1: Transfer Flow & Table Actions

- **Transfer dialog refactored**: Removed destination location Combobox; dialog now asks only for receiver. When receiver is selected, their `location_id` auto-resolves the destination. Shows resolved location name as read-only text. Warning displayed if receiver has no assigned location.
- **New `GAUserWithLocation` type**: `{ id, name, location_id }` replaces `{ id, name }` for user lists passed to transfer dialog.
- **Asset table Transfer action**: Added "Transfer" ghost button alongside "View" in table row actions. Only shown for ga_staff/ga_lead/admin on non-terminal assets with no pending transfer.
- **Asset detail status display**: Removed `<button>` wrapper around `AssetStatusBadge` in detail page header. Badge renders as plain element with separate "Change Status" text link.
- **Data queries updated**: Both inventory list page and detail page fetch `location_id` in GA users query.

### Task 2: Template Checklist UI

- **Numeric items simplified**: Removed `unit` field from `NumericItem` type, template builder item UI, and template detail read-only view.
- **Section styling simplified**: Removed `rounded-lg border border-border p-6` wrappers from "Template Information" and "Checklist Items" sections in both `template-detail.tsx` (edit + read-only modes) and `template-create-form.tsx`. Sections now use plain headers with `<Separator />` dividers.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed template-builder.tsx NumericItem creation**
- **Found during:** Task 2
- **Issue:** `template-builder.tsx` line 41 created NumericItem with `unit: undefined` which became invalid after removing `unit` from the type
- **Fix:** Removed `unit: undefined` from the numeric case in `createItem()`
- **Files modified:** components/maintenance/template-builder.tsx
- **Commit:** 14b9629

## Verification

- `npm run build` passes with zero TypeScript errors
- `npm run lint` shows only pre-existing warnings (no new issues introduced)
