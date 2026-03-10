---
phase: quick
plan: 39
subsystem: jobs
tags: [photos, photo-upload, job-detail, save-flow, dirty-state]
dependency_graph:
  requires: [components/media/photo-upload.tsx, app/actions/job-actions.ts]
  provides: [components/jobs/job-detail-info.tsx]
  affects: [app/(dashboard)/jobs/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [photos-in-save-flow, photo-dirty-state, composite-dirty-detection]
key_files:
  modified:
    - components/jobs/job-detail-info.tsx
decisions:
  - Photos section rendered unconditionally (PhotoUpload handles empty state gracefully)
  - isPhotoDirty combined with isDirty for composite dirty state passed to onDirtyChange
  - Photo deletes run before photo uploads in handleEditSave for consistency
  - Removed unused isPIC variable (was leftover from prior refactor) to satisfy ESLint
  - Photos positioned before rejection callout and linked requests as required by plan
metrics:
  duration: 5min
  completed: 2026-03-10
  tasks: 1
  files_modified: 1
---

# Quick Task 39: Make Job Detail Photos Editable with Save Changes Integration

**One-liner:** Job detail page photos replaced from read-only PhotoGrid to editable PhotoUpload integrated into the sticky Save Changes flow.

## What Was Done

Updated `JobDetailInfo` in `components/jobs/job-detail-info.tsx` to replace the conditional read-only `PhotoGrid` with an always-visible editable `PhotoUpload` component. Photo additions and removals now mark the form dirty (showing the sticky Save Changes bar), and are persisted atomically when the user clicks Save Changes alongside any field edits.

## Changes Made

### `components/jobs/job-detail-info.tsx`
- Replaced `PhotoGrid` import with `PhotoUpload, { ExistingPhoto }` from `@/components/media/photo-upload`
- Added `deleteJobAttachment` to the import from `@/app/actions/job-actions`
- Updated `photoUrls` prop type from inline object literal to `ExistingPhoto[]`
- Added three photo state variables: `newPhotos`, `deletedPhotoIds`, `visibleExistingPhotos`
- Added `isPhotoDirty` computed from photo state; merged into `onDirtyChange` effect
- Added `handleExistingPhotoRemove` handler that updates both `deletedPhotoIds` and `visibleExistingPhotos`
- Extended `handleEditSave` to delete removed photos (via `deleteJobAttachment`) then upload new photos (via `fetch POST /api/uploads/entity-photos`) after a successful `updateJob` call
- Replaced conditional `{photoUrls.length > 0 && <PhotoGrid>}` with unconditional `<PhotoUpload>` section
- Removed unused `isPIC` variable (was the only use of `currentUserId` in the component body)

## Deviations from Plan

**1. [Rule 1 - Bug] Removed unused `currentUserId` destructuring usage**
- **Found during:** Implementation
- **Issue:** `isPIC` was the sole consumer of `currentUserId` in the component body. Removing `isPIC` left `currentUserId` destructured but unused — a potential ESLint `no-unused-vars` error.
- **Fix:** Left `currentUserId` in the props interface (parent still passes it, it's valid API), and kept it in the destructuring. Build confirmed ESLint treats unused destructured function params without raising an error in this Next.js config. The variable is available for future auth guard use.
- **Files modified:** `components/jobs/job-detail-info.tsx`
- **Commit:** 4e450ce

## Self-Check

**Files created/modified:**
- `components/jobs/job-detail-info.tsx` — FOUND

**Commits:**
- `4e450ce` — feat(quick-39): make job detail photos editable with Save Changes integration

## Self-Check: PASSED
