---
phase: quick-38
plan: 01
subsystem: jobs
tags: [photos, job-modal, media-attachments, server-actions]
dependency_graph:
  requires: [components/media/photo-upload.tsx, app/actions/job-actions.ts, components/jobs/job-modal.tsx]
  provides: [deleteJobAttachment server action, job photos in view modal]
  affects: [jobs table view, job-modal.tsx, job-actions.ts]
tech_stack:
  added: []
  patterns: [authActionClient soft-delete pattern, ExistingPhoto typed state, signed URLs from job-photos bucket]
key_files:
  created: []
  modified:
    - app/actions/job-actions.ts
    - components/jobs/job-modal.tsx
decisions:
  - "Used ExistingPhoto type from photo-upload.tsx for jobPhotoUrls state rather than reusing PhotoItem (which requires commentId: string) — avoids type conflict with JobTimeline's PhotoItem"
  - "Added createAdminClient import to job-actions.ts to bypass RLS WITH CHECK on soft-delete"
metrics:
  duration: 10min
  completed_date: "2026-03-10"
  tasks_completed: 2
  files_modified: 2
---

# Phase quick-38 Plan 01: Job photos in view modal Summary

**One-liner:** Job-level photos (entity_type='job') now fetched, displayed, uploadable, and deletable inside the job view modal via PhotoUpload component and new deleteJobAttachment server action.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add deleteJobAttachment server action | a39b1a8 | app/actions/job-actions.ts |
| 2 | Fetch and display job photos in job-modal view mode | 8e1d745 | components/jobs/job-modal.tsx |

## What Was Built

**Task 1 — deleteJobAttachment server action:**
- Added `createAdminClient` import to `job-actions.ts`
- New `deleteJobAttachment` exported action at bottom of file
- Schema: `z.object({ attachmentId: z.string().uuid() })`
- Role check: only ga_lead or admin allowed (throws otherwise)
- Fetches attachment, verifies entity_type='job', verifies parent job belongs to user's company and is not deleted
- Soft-deletes via `adminSupabase.update({ deleted_at })` to bypass RLS WITH CHECK constraint

**Task 2 — Job photos in view modal:**
- Imports: `deleteJobAttachment`, `PhotoUpload`, `ExistingPhoto` from their respective modules
- Added `jobPhotoUrls: ExistingPhoto[]` state alongside `commentPhotos`
- In `fetchData`: queries `media_attachments` with `entity_type='job'` + `entity_id=id`, generates signed URLs from `job-photos` bucket (21600s), populates `jobPhotoUrls`
- Resets `jobPhotoUrls` when modal closes (in the `!jobId` branch)
- Renders `<PhotoUpload>` section below PMChecklist in the left scrollable column with:
  - `onChange`: POSTs each file to `/api/uploads/entity-photos` with entity_type=job + entity_id, then calls `handleActionSuccess()`
  - `existingPhotos={jobPhotoUrls}`: displays existing photos as thumbnails
  - `onRemoveExisting`: only provided when `canEdit` is true; calls `deleteJobAttachment` then `handleActionSuccess()`
  - `disabled={!canEdit}`: read-only for non-GA-Lead/Admin users
  - `maxPhotos={10}`, `showCount`, `enableAnnotation`, `enableMobileCapture={false}`

## Deviations from Plan

**1. [Rule 1 - Bug] ExistingPhoto type used instead of PhotoItem for jobPhotoUrls**
- **Found during:** Task 2 build verification
- **Issue:** `PhotoItem` in `job-modal.tsx` requires `commentId: string`, same-named type in `job-timeline.tsx` also requires it. Making it optional broke type compatibility for `commentPhotos`. Attempted fix caused "Two different types with this name exist" error.
- **Fix:** Used `ExistingPhoto` (imported from `photo-upload.tsx`) as the type for `jobPhotoUrls` state — clean separation with no name collision.
- **Files modified:** `components/jobs/job-modal.tsx` (import line + state declaration)
- **Commit:** 8e1d745

## Self-Check: PASSED

- `/Users/melfice/code/ga/app/actions/job-actions.ts` — contains `deleteJobAttachment` export
- `/Users/melfice/code/ga/components/jobs/job-modal.tsx` — contains `jobPhotoUrls` state, job photos fetch, PhotoUpload render
- Commits a39b1a8 and 8e1d745 verified via git log
- `npm run build` passes with zero TypeScript errors
