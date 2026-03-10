---
phase: quick-40
plan: 01
subsystem: inventory
tags: [asset-table, photo-thumbnail, lightbox, media]
dependency_graph:
  requires: []
  provides: [asset-photo-thumbnail-column]
  affects: [inventory-page, asset-table, asset-columns]
tech_stack:
  added: []
  patterns: [batch-signed-url-fetch, datatable-meta-photo-pattern, lightbox]
key_files:
  created: []
  modified:
    - app/(dashboard)/inventory/page.tsx
    - components/assets/asset-table.tsx
    - components/assets/asset-columns.tsx
decisions:
  - "Used entity_type IN ('asset_creation', 'asset_status_change') to capture both initial and subsequent condition photos — ORDER BY created_at DESC ensures latest is first"
  - "Photo column inserted at index 1 (after display_id) with size 50 — matches request table exact placement and dimensions"
  - "PhotoLightbox reused from @/components/requests/request-photo-lightbox — no new component needed"
metrics:
  duration: 8min
  completed: "2026-03-10"
  tasks: 1
  files: 3
---

# Quick Task 40: Asset Table Photo Thumbnail Column Summary

**One-liner:** Batch-fetched latest asset condition photos and wired 40x40px thumbnail column (with lightbox) into asset table — identical pattern to request table.

## What Was Built

The asset table list (`/inventory`) now shows a photo thumbnail column between the ID and Name columns. Each row shows either a clickable 40x40px thumbnail of the asset's latest condition photo, or a dashed placeholder with an ImageIcon when no photo exists.

Clicking a thumbnail opens the existing `PhotoLightbox` component with the full photo set. Multiple photos show a count badge overlay.

## Implementation

### Step A — `app/(dashboard)/inventory/page.tsx`
Batch-fetches `media_attachments` where `entity_type IN ('asset_creation', 'asset_status_change')` and `entity_id IN (assetIds)`, ordered by `created_at DESC` (latest first). Generates signed URLs from the `asset-photos` bucket (21600s expiry) and builds `photosByAsset: Record<string, PhotoItem[]>` grouped by asset UUID. Passes `photosByAsset` as a new prop to `<AssetTable>`.

### Step B — `components/assets/asset-table.tsx`
Added `photosByAsset` prop, `PhotoItem` type alias, and lightbox state (`lightboxPhotos`, `lightboxIndex`, `lightboxOpen`). Added `handlePhotoClick` handler. Extended `DataTable` meta to include `photosByAsset` and `onPhotoClick`. Renders `PhotoLightbox` conditionally at end of component.

### Step C — `components/assets/asset-columns.tsx`
Added `PhotoItem` interface and extended `AssetTableMeta` with `photosByAsset` and `onPhotoClick`. Added `ImageIcon` from lucide-react. Inserted photo column definition at index 1 (after display_id) with size 50 — dashed placeholder when no photos, clickable thumbnail with optional badge overlay when photos exist.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `app/(dashboard)/inventory/page.tsx` modified
- [x] `components/assets/asset-table.tsx` modified
- [x] `components/assets/asset-columns.tsx` modified
- [x] Build passes: zero TypeScript errors
- [x] Commit `2e9485f` exists

## Self-Check: PASSED
