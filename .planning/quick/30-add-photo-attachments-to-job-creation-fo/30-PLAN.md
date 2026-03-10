---
phase: quick-30
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-form.tsx
  - app/(dashboard)/jobs/[id]/page.tsx
  - components/jobs/job-detail-client.tsx
  - components/jobs/job-detail-info.tsx
autonomous: true
requirements: [QUICK-30]

must_haves:
  truths:
    - "User can attach photos when creating a job via the job creation form"
    - "After job creation, photos are uploaded to storage and linked via media_attachments with entity_type='job'"
    - "Job detail page displays photos attached to the job with lightbox support"
  artifacts:
    - path: "components/jobs/job-form.tsx"
      provides: "PhotoUpload component integrated into job creation form"
      contains: "PhotoUpload"
    - path: "app/(dashboard)/jobs/[id]/page.tsx"
      provides: "Server-side fetching of job photos from media_attachments"
      contains: "entity_type.*job"
    - path: "components/jobs/job-detail-info.tsx"
      provides: "Photo grid display on job detail page"
      contains: "PhotoGrid"
  key_links:
    - from: "components/jobs/job-form.tsx"
      to: "/api/uploads/entity-photos"
      via: "fetch POST after createJob returns jobId"
      pattern: "entity-photos.*entity_type.*job"
    - from: "app/(dashboard)/jobs/[id]/page.tsx"
      to: "components/jobs/job-detail-client.tsx"
      via: "photoUrls prop passed through to JobDetailInfo"
      pattern: "photoUrls"
---

<objective>
Add photo attachment support to job creation and display on job detail page.

Purpose: Jobs should support photo attachments just like requests do, reusing the existing PhotoUpload component and the generic entity-photos upload API.
Output: Job form with photo upload, job detail page with photo display and lightbox.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/media/photo-upload.tsx (reusable PhotoUpload component — onChange returns File[])
@components/media/photo-grid.tsx (reusable PhotoGrid with built-in lightbox)
@app/api/uploads/entity-photos/route.ts (generic upload API — supports entity_type='job', bucket='job-photos', maxFiles=10)
@components/jobs/job-form.tsx (job creation/edit form — needs PhotoUpload added)
@app/actions/job-actions.ts (createJob returns { jobId, displayId })
@app/(dashboard)/jobs/[id]/page.tsx (job detail server component — needs photo fetching)
@components/jobs/job-detail-client.tsx (client wrapper — needs photoUrls prop)
@components/jobs/job-detail-info.tsx (detail display — needs PhotoGrid)
@components/requests/request-submit-form.tsx (reference: two-step pattern — create entity then upload photos)

<interfaces>
From components/media/photo-upload.tsx:
```typescript
export interface ExistingPhoto { id: string; url: string; fileName: string; }
interface PhotoUploadProps {
  onChange: (files: File[]) => void;
  value?: File[];
  existingPhotos?: ExistingPhoto[];
  onRemoveExisting?: (id: string) => void;
  disabled?: boolean;
  maxPhotos?: number;
  // ...other optional props
}
export function PhotoUpload(props: PhotoUploadProps): JSX.Element;
```

From components/media/photo-grid.tsx:
```typescript
export type { PhotoItem } from '@/components/media/photo-lightbox';
// PhotoItem = { id: string; url: string; fileName: string; }
interface PhotoGridProps { photos: PhotoItem[]; }
export function PhotoGrid({ photos }: PhotoGridProps): JSX.Element | null;
```

From app/api/uploads/entity-photos/route.ts:
```typescript
// POST expects FormData with: entity_type ('request'|'job'|'inventory'|'job_comment'), entity_id (uuid), photos (File[])
// Job config: bucket='job-photos', maxFiles=10
```

From app/actions/job-actions.ts:
```typescript
// createJob returns: { success: true, jobId: string, displayId: string }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add PhotoUpload to job form and wire two-step upload</name>
  <files>components/jobs/job-form.tsx</files>
  <action>
Add photo attachment support to the job creation form following the same two-step pattern used in request-submit-form.tsx:

1. Import `PhotoUpload` from `@/components/media/photo-upload`.

2. Add a `const [photoFiles, setPhotoFiles] = useState<File[]>([]);` state at the top of the component (alongside existing state like `isSubmitting`, `error`, `linkedRequests`).

3. Add a "Photos (optional)" section in the form JSX, placed AFTER the "Linked Requests" section and BEFORE the error feedback. Use the same layout pattern as request-submit-form:
```tsx
{/* Photos — only show in create mode, not readOnly */}
{mode === 'create' && !readOnly && (
  <div className="space-y-2">
    <p className="text-sm font-medium">Photos (optional)</p>
    <div className="flex flex-wrap gap-2">
      <PhotoUpload
        onChange={setPhotoFiles}
        disabled={isSubmitting}
        maxPhotos={10}
        showCount
      />
    </div>
  </div>
)}
```

4. In the `onSubmit` function, after `createJob` returns successfully with `result.data.jobId`, add the photo upload step (before the `onSuccess` or `router.push` calls):
```typescript
// Step 2: Upload photos if any were selected
if (photoFiles.length > 0) {
  const formData = new FormData();
  formData.append('entity_type', 'job');
  formData.append('entity_id', result.data.jobId);
  for (const file of photoFiles) {
    formData.append('photos', file);
  }

  const uploadResponse = await fetch('/api/uploads/entity-photos', {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    // Photo upload failed — job is still saved, just without photos
    console.warn('Photo upload failed:', await uploadResponse.text());
  }
}
```

This mirrors exactly how request-submit-form handles photos: entity created first, then photos uploaded and linked via media_attachments.
  </action>
  <verify>npm run build 2>&1 | tail -20 — build succeeds with no type errors</verify>
  <done>Job creation form shows PhotoUpload component in create mode. After form submission, photos are uploaded to /api/uploads/entity-photos with entity_type='job' and linked to the new job.</done>
</task>

<task type="auto">
  <name>Task 2: Display job photos on job detail page with lightbox</name>
  <files>app/(dashboard)/jobs/[id]/page.tsx, components/jobs/job-detail-client.tsx, components/jobs/job-detail-info.tsx</files>
  <action>
Add photo display to the job detail page, following the same pattern used for request detail pages.

**In `app/(dashboard)/jobs/[id]/page.tsx`:**

1. Add a fetch for job-level photos alongside the existing parallel queries. Add to the Promise.all array:
```typescript
// Job photos (entity_type='job')
supabase
  .from('media_attachments')
  .select('id, file_name, file_path, mime_type, sort_order')
  .eq('entity_type', 'job')
  .eq('entity_id', id)
  .is('deleted_at', null)
  .order('sort_order', { ascending: true }),
```
Update the destructured result array to include `jobPhotosResult`.

2. After the parallel queries, generate signed URLs for job photos (same pattern as comment photos):
```typescript
const jobAttachments = jobPhotosResult.data ?? [];
let jobPhotoUrls: { id: string; url: string; fileName: string }[] = [];

if (jobAttachments.length > 0) {
  const { data: signedUrls } = await supabase.storage
    .from('job-photos')
    .createSignedUrls(
      jobAttachments.map((a) => a.file_path),
      21600 // 6 hours
    );

  jobPhotoUrls = jobAttachments.map((attachment, index) => ({
    id: attachment.id,
    url: signedUrls?.[index]?.signedUrl ?? '',
    fileName: attachment.file_name,
  }));
}
```

3. Pass `jobPhotoUrls` as a `photoUrls` prop to `<JobDetailClient>`.

**In `components/jobs/job-detail-client.tsx`:**

1. Add `photoUrls` to the `JobDetailClientProps` interface:
```typescript
photoUrls: { id: string; url: string; fileName: string }[];
```

2. Accept `photoUrls` in the destructured props and pass it through to `<JobDetailInfo>`:
```tsx
<JobDetailInfo
  ...existing props...
  photoUrls={photoUrls}
/>
```

**In `components/jobs/job-detail-info.tsx`:**

1. Import `PhotoGrid` from `@/components/media/photo-grid`.

2. Add `photoUrls` to the `JobDetailInfoProps` interface:
```typescript
photoUrls: { id: string; url: string; fileName: string }[];
```

3. Accept `photoUrls` in the destructured props.

4. Render the PhotoGrid in the detail view. Add a "Photos" section AFTER the description field and BEFORE the "Linked Requests" section (or after it — whichever makes more visual sense given the existing layout). Use the same heading style as request-detail-info:
```tsx
{/* Job Photos */}
{photoUrls.length > 0 && (
  <div>
    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
      Photos
    </h3>
    <PhotoGrid photos={photoUrls} />
  </div>
)}
```
  </action>
  <verify>npm run build 2>&1 | tail -20 — build succeeds with no type errors</verify>
  <done>Job detail page fetches and displays photos attached to the job entity. Photos render in a grid with lightbox support via the shared PhotoGrid component.</done>
</task>

</tasks>

<verification>
- `npm run build` passes with no errors
- Job creation form (at /jobs/new or via modal) shows a PhotoUpload section with "Photos (optional)" label
- Creating a job with photos: photos appear in Supabase storage under `job-photos` bucket and `media_attachments` table with `entity_type='job'`
- Job detail page (/jobs/[id]) shows photos in a grid below the description
- Clicking a photo opens the lightbox
</verification>

<success_criteria>
- PhotoUpload component visible in job creation form (create mode only)
- Photos uploaded after job creation via /api/uploads/entity-photos with entity_type='job'
- Job detail page shows uploaded photos with lightbox
- Build passes with no type errors
</success_criteria>

<output>
After completion, create `.planning/quick/30-add-photo-attachments-to-job-creation-fo/30-SUMMARY.md`
</output>
