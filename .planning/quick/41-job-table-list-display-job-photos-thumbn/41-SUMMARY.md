---
phase: quick-41
plan: 01
subsystem: jobs
tags: [photos, lightbox, table, thumbnail, media]
dependency_graph:
  requires: [quick-40]
  provides: [job-table-photo-thumbnails]
  affects: [jobs-page, job-table, job-columns]
tech_stack:
  added: []
  patterns: [tanstack-table-meta, signed-urls, photolightbox]
key_files:
  created: []
  modified:
    - components/jobs/job-columns.tsx
    - components/jobs/job-table.tsx
    - app/(dashboard)/jobs/page.tsx
decisions:
  - Job photos use entity_type='job' in media_attachments with 'job-photos' storage bucket
  - Photo column at position 2 (after display_id, before title) matches request and asset table order
  - Reuses PhotoLightbox from requests/request-photo-lightbox — same component across all entity types
metrics:
  duration: 8min
  completed_date: "2026-03-10"
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 41: Job Table Photo Thumbnails Summary

**One-liner:** Photo thumbnail column added to job table at position 2, pulling from media_attachments (entity_type='job', bucket 'job-photos'), with lightbox on click and dashed placeholder for no-photo jobs.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add photo column to job-columns.tsx and extend JobTableMeta | 6fdf35d | components/jobs/job-columns.tsx |
| 2 | Wire lightbox in job-table.tsx and fetch photos in jobs/page.tsx | 66b0d2c | components/jobs/job-table.tsx, app/(dashboard)/jobs/page.tsx |

## What Was Built

### job-columns.tsx
- Added `ImageIcon` to lucide-react imports
- Added `PhotoItem` interface (`{ id: string; url: string; fileName: string }`)
- Extended `JobTableMeta` with `photosByJob?: Record<string, PhotoItem[]>` and `onPhotoClick?: (photos: PhotoItem[], index: number) => void`
- Inserted photo column at position 2 with exact same markup as asset-columns.tsx (placeholder div, clickable thumbnail button, count badge for multiple photos)

### job-table.tsx
- Added `PhotoLightbox` import from `@/components/requests/request-photo-lightbox`
- Added `PhotoItem` type alias
- Added `photosByJob: Record<string, PhotoItem[]>` prop to `JobTableProps`
- Added lightbox state: `lightboxPhotos`, `lightboxIndex`, `lightboxOpen`
- Added `handlePhotoClick` handler
- Extended DataTable `meta` with `photosByJob` and `onPhotoClick: handlePhotoClick`
- Rendered `PhotoLightbox` conditionally after `JobViewModal`

### app/(dashboard)/jobs/page.tsx
- Added batch-fetch of job photos from `media_attachments` (entity_type='job')
- Creates signed URLs from `job-photos` storage bucket (6-hour TTL)
- Groups photos by job ID into `photosByJob` map
- Passes `photosByJob={photosByJob}` to `<JobTable>`

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npm run build` completed successfully with no TypeScript errors
- Photo column at position 2 between ID and Title columns
- Jobs with photos show clickable 40x40 thumbnail (opens lightbox)
- Jobs with no photos show dashed placeholder with grey image icon
- Visual style matches request table and asset table thumbnails exactly

## Self-Check: PASSED

- FOUND: components/jobs/job-columns.tsx
- FOUND: components/jobs/job-table.tsx
- FOUND: app/(dashboard)/jobs/page.tsx
- Commits 6fdf35d and 66b0d2c confirmed present
