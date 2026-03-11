---
phase: quick
plan: 39
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-detail-info.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Photos are editable on the job detail page (/jobs/[id]) using PhotoUpload"
    - "Adding or removing a photo marks the form dirty and shows the sticky Save Changes bar"
    - "Clicking Save Changes uploads new photos and deletes removed photos along with other field changes"
    - "Photo section renders before the rejection callout, inline feedback, and linked requests sections"
  artifacts:
    - path: "components/jobs/job-detail-info.tsx"
      provides: "Editable photo management integrated into job detail save flow"
  key_links:
    - from: "components/jobs/job-detail-info.tsx"
      to: "/api/uploads/entity-photos"
      via: "fetch POST in handleEditSave"
    - from: "components/jobs/job-detail-info.tsx"
      to: "deleteJobAttachment server action"
      via: "deleteJobAttachment({ attachmentId }) call in handleEditSave"
---

<objective>
Make job photos editable on the job detail page and include them in the Save Changes flow.

Purpose: Currently photos on `/jobs/[id]` are read-only (PhotoGrid). The view modal has instant-save photos but the detail page does not allow editing. The user wants photos to be editable and batched with other field changes under the sticky Save Changes bar, consistent with how the asset detail page works.

Output: Updated `job-detail-info.tsx` where photos use `PhotoUpload` (when `canEdit`), photo additions/deletions mark the form dirty, and `handleEditSave` uploads new photos and deletes removed ones.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key patterns to follow:
- Asset detail page (components/assets/asset-edit-form.tsx) is the reference implementation for photos-in-save-flow
- Photo upload API: POST /api/uploads/entity-photos with FormData fields: entity_type="job", entity_id, photos (File[])
- Photo delete: deleteJobAttachment({ attachmentId: string }) server action from app/actions/job-actions.ts
- PhotoUpload component: components/media/photo-upload.tsx — accepts onChange, existingPhotos, onRemoveExisting, disabled, maxPhotos, showCount, enableAnnotation
- ExistingPhoto type: { id: string; url: string; fileName: string } (exported from photo-upload.tsx)
- Dirty state: compositeIsDirty = formFieldsDirty || newPhotos.length > 0 || deletedPhotoIds.length > 0
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make job detail photos editable with Save Changes integration</name>
  <files>components/jobs/job-detail-info.tsx</files>
  <action>
Update `JobDetailInfo` to replace the read-only PhotoGrid with an editable PhotoUpload and include photo changes in the save flow.

**Changes required:**

1. Add imports at top:
   - Import `PhotoUpload, { ExistingPhoto }` from `@/components/media/photo-upload`
   - Remove `PhotoGrid` import (from `@/components/media/photo-grid`) if it is no longer used after this change

2. Update `JobDetailInfoProps` interface: change `photoUrls` type from `{ id: string; url: string; fileName: string }[]` to `ExistingPhoto[]` (same shape, just using the imported type for clarity).

3. Add photo state inside `JobDetailInfo` component (after existing state declarations):
   ```typescript
   const [newPhotos, setNewPhotos] = useState<File[]>([]);
   const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
   const [visibleExistingPhotos, setVisibleExistingPhotos] = useState<ExistingPhoto[]>(photoUrls);
   ```

4. Update dirty state computation to include photo changes:
   ```typescript
   const isPhotoDirty = newPhotos.length > 0 || deletedPhotoIds.length > 0;
   ```
   In the `useEffect` for `onDirtyChange`, use `canEdit && (isDirty || isPhotoDirty)`:
   ```typescript
   useEffect(() => {
     onDirtyChange?.(canEdit && (isDirty || isPhotoDirty));
   }, [isDirty, isPhotoDirty, canEdit, onDirtyChange]);
   ```

5. Add photo handler:
   ```typescript
   const handleExistingPhotoRemove = (photoId: string) => {
     setDeletedPhotoIds((prev) => [...prev, photoId]);
     setVisibleExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
   };
   ```

6. In `handleEditSave`, after the `updateJob` call succeeds, add:
   ```typescript
   // Delete removed photos
   if (deletedPhotoIds.length > 0) {
     for (const attachmentId of deletedPhotoIds) {
       await deleteJobAttachment({ attachmentId });
     }
     setDeletedPhotoIds([]);
   }
   // Upload new photos
   if (newPhotos.length > 0) {
     const formData = new FormData();
     formData.append('entity_type', 'job');
     formData.append('entity_id', job.id);
     for (const file of newPhotos) {
       formData.append('photos', file);
     }
     const uploadRes = await fetch('/api/uploads/entity-photos', {
       method: 'POST',
       body: formData,
     });
     if (!uploadRes.ok) {
       setFeedback({ type: 'error', message: 'Job saved but photo upload failed. Try again.' });
       onActionSuccess();
       return;
     }
     setNewPhotos([]);
   }
   ```
   Import `deleteJobAttachment` from `@/app/actions/job-actions`.

7. Replace the read-only Photos section in the JSX:
   Old:
   ```tsx
   {photoUrls.length > 0 && (
     <div>
       <h3 ...>Photos</h3>
       <PhotoGrid photos={photoUrls} />
     </div>
   )}
   ```
   New:
   ```tsx
   <div>
     <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
       Photos
     </h3>
     <PhotoUpload
       onChange={setNewPhotos}
       existingPhotos={visibleExistingPhotos}
       onRemoveExisting={canEdit ? handleExistingPhotoRemove : undefined}
       disabled={!canEdit || submitting}
       maxPhotos={10}
       showCount
       enableAnnotation={false}
       enableMobileCapture
     />
   </div>
   ```
   Show the Photos section unconditionally (PhotoUpload handles empty state gracefully).

   NOTE: The Photos section must remain in the same position — BEFORE the rejection reason callout, inline feedback, and linked requests sections. Do not move it.

8. Ensure `isPIC` variable is still used somewhere (it is used as `const isPIC = job.assigned_to === currentUserId;` for potential future use — keep it or remove if TypeScript warns about unused variable). Check if it is used in the file; if not, remove the declaration to avoid lint errors.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - `job-detail-info.tsx` uses PhotoUpload (not PhotoGrid) for the photos section
    - Adding a photo to the job detail page makes the sticky Save Changes bar appear
    - Removing an existing photo makes the sticky Save Changes bar appear
    - Clicking Save Changes uploads new photos via /api/uploads/entity-photos and deletes removed photos via deleteJobAttachment
    - Photos section is positioned before the rejection callout and linked requests
    - Build passes with no TypeScript errors
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes with no TypeScript errors
2. On `/jobs/[id]` (as GA Lead/Admin, non-terminal job): photos section shows PhotoUpload component
3. Adding a photo → sticky Save Changes bar appears
4. Removing an existing photo → sticky Save Changes bar appears
5. Editing a field AND adding a photo, then clicking Save Changes → both field update and photo upload succeed
6. Read-only users (non-GA Lead/Admin, or terminal status jobs) see photos but cannot add/remove
</verification>

<success_criteria>
Photo editing on the job detail page works identically to the asset detail page pattern: photos use PhotoUpload, are integrated into the sticky Save Changes flow, and are saved atomically with field changes.
</success_criteria>

<output>
After completion, create `.planning/quick/39-photos-should-be-before-save-changes-but/39-SUMMARY.md`
</output>
