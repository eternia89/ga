---
phase: 08-media-notifications-dashboards
plan: "01"
subsystem: media
tags: [media, compression, annotation, upload, webp]
dependency_graph:
  requires: []
  provides: [lib/media/compression.ts, components/media/photo-upload.tsx, components/media/photo-annotation.tsx, app/api/uploads/entity-photos/route.ts]
  affects: [components/requests/request-photo-upload.tsx, app/api/uploads/request-photos/route.ts]
tech_stack:
  added: [browser-image-compression@2.0.2, react-sketch-canvas@6.2.0, shadcn/slider]
  patterns: [client-side compression, freehand annotation, generalized upload route, thumbnail preview grid]
key_files:
  created:
    - lib/media/compression.ts
    - components/media/photo-upload.tsx
    - components/media/photo-annotation.tsx
    - app/api/uploads/entity-photos/route.ts
    - components/ui/slider.tsx
  modified:
    - package.json
    - package-lock.json
decisions:
  - "ENTITY_CONFIGS map in route.ts centralizes per-type bucket/maxFiles/table config — adding a new entity type requires one line change"
  - "Freehand-only annotation per phase decision — no text, shapes, arrows; ReactSketchCanvas exportImage('png') exports canvas merged with background"
  - "Compression runs client-side via useWebWorker:true — non-blocking, converts to WebP at max 800KB before preview is shown"
  - "PhotoUpload is entityType/entityId-agnostic at component level — callers pass entity context, route handles ownership validation"
  - "job_comment uses job-photos bucket (shared) with maxFiles:3 to keep comment photo count minimal"
  - "RequestPhotoUpload in components/requests/ left untouched — migration to new generic component is optional later"
metrics:
  duration: "~8min"
  completed: "2026-02-25"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 8 Plan 01: Media Infrastructure Summary

**One-liner:** Client-side WebP compression via browser-image-compression, freehand annotation dialog via ReactSketchCanvas, generalized entity upload API route, and reusable PhotoUpload component for all entity types.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Install media libraries and create compression + annotation components | 19bb0ff | lib/media/compression.ts, components/media/photo-annotation.tsx, components/ui/slider.tsx |
| 2 | Create generalized entity upload route and reusable photo upload component | 4217849 | app/api/uploads/entity-photos/route.ts, components/media/photo-upload.tsx |

## What Was Built

### `lib/media/compression.ts`
Exports `compressImage(file: File): Promise<File>` using `browser-image-compression` with:
- `maxSizeMB: 0.8` (800KB target)
- `maxWidthOrHeight: 1920`
- `fileType: 'image/webp'`
- `initialQuality: 0.85`
- `useWebWorker: true` (non-blocking)
- `preserveExif: false`

### `components/media/photo-annotation.tsx`
Full-screen Dialog wrapping `ReactSketchCanvas` with:
- 5 preset stroke colors (red, blue, yellow, white, black)
- Stroke width slider (2–8, using shadcn Slider)
- Undo, Clear, Cancel, Save toolbar buttons
- Exports merged canvas+background as PNG blob → File on Save
- Freehand drawing only (no text, shapes, arrows)

### `app/api/uploads/entity-photos/route.ts`
Generalized upload route replacing/extending the request-specific pattern:
- Accepts `entity_type`, `entity_id`, `photos` in FormData
- `ENTITY_CONFIGS`: request (bucket: request-photos, max: 10), job (job-photos, 10), inventory (inventory-photos, 10), job_comment (job-photos, 3)
- Per-type ownership validation (request: requester_id + submitted; others: company_id match)
- Storage path: `{company_id}/{entity_type}/{entity_id}/{uuid}-{sanitized_filename}`
- Uses `createAdminClient()` for storage writes (service_role bypasses RLS)
- Checks existing attachment count before uploading to enforce maxFiles limit

### `components/media/photo-upload.tsx`
Reusable upload component exporting `PhotoUpload` and `ExistingPhoto`:
- Props: `entityType`, `entityId`, `onChange`, `existingPhotos`, `disabled`, `maxPhotos` (default 10), `enableAnnotation` (default true)
- Compresses each file via `compressImage()` before adding to preview state
- 80x80px thumbnail grid with X (remove) button
- Pencil icon overlay (visible on hover) opens `PhotoAnnotation` dialog
- On annotation save, replaces preview with annotated+compressed result
- Shows "Compressing..." placeholder while processing

## Decisions Made

- `ENTITY_CONFIGS` map centralizes per-entity-type bucket/maxFiles/table config — adding a new entity type requires one line
- Freehand-only annotation per phase context decision
- Compression runs client-side via `useWebWorker: true` — non-blocking, converts to WebP before preview
- `PhotoUpload` is entity-agnostic at component level; route handles ownership validation
- `job_comment` shares `job-photos` bucket with `maxFiles: 3`
- Existing `RequestPhotoUpload` in `components/requests/` left untouched — migration optional

## Deviations from Plan

### Auto-added: Shadcn Slider component
- **Found during:** Task 1
- **Issue:** `photo-annotation.tsx` requires `@/components/ui/slider` for stroke width control; component did not exist in project
- **Fix:** Ran `npx shadcn@latest add slider` (Rule 3 — blocking issue for completing the task)
- **Files modified:** `components/ui/slider.tsx` (added)
- **Commit:** 19bb0ff

## Self-Check: PASSED

All files confirmed on disk. All commits confirmed in git log.

| Check | Result |
|-------|--------|
| lib/media/compression.ts | FOUND |
| components/media/photo-annotation.tsx | FOUND |
| app/api/uploads/entity-photos/route.ts | FOUND |
| components/media/photo-upload.tsx | FOUND |
| components/ui/slider.tsx | FOUND |
| Commit 19bb0ff | FOUND |
| Commit 4217849 | FOUND |
