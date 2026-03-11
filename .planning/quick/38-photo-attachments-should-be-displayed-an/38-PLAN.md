---
phase: quick-38
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-modal.tsx
  - app/actions/job-actions.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Job photos (entity_type='job') are visible in the view modal, not just the full detail page"
    - "GA Lead/Admin can upload new photos to a job from the view modal"
    - "GA Lead/Admin can remove existing job photos from the view modal"
    - "Photo changes in the modal are reflected after refetch (onActionSuccess pattern)"
  artifacts:
    - path: "components/jobs/job-modal.tsx"
      provides: "Fetches job photos, stores in state, renders PhotoUpload with existingPhotos + onRemoveExisting below JobForm"
    - path: "app/actions/job-actions.ts"
      provides: "deleteJobAttachment server action (soft-delete media_attachments, restricted to ga_lead/admin)"
  key_links:
    - from: "job-modal.tsx fetchData"
      to: "media_attachments table"
      via: "supabase query with entity_type='job' + entity_id=jobId"
      pattern: "entity_type.*job.*entity_id"
    - from: "job-modal.tsx PhotoUpload onRemoveExisting"
      to: "deleteJobAttachment action"
      via: "server action call with attachmentId"
      pattern: "deleteJobAttachment.*attachmentId"
    - from: "job-modal.tsx PhotoUpload onChange"
      to: "/api/uploads/entity-photos"
      via: "fetch POST with entity_type=job, entity_id=jobId"
      pattern: "entity-photos.*entity_type.*job"
---

<objective>
Display and allow editing of job-level photo attachments (entity_type='job') inside the job view modal (job-modal.tsx). Currently these photos are only shown on the full detail page (/jobs/[id]/page.tsx). The view modal fetches comment photos but never job-level photos.

Purpose: Users viewing a job from the table list modal can see and manage job photos without navigating to the full detail page.
Output: job-modal.tsx fetches job photos, displays them via PhotoUpload (with existing photos + upload + delete), and a new deleteJobAttachment action handles soft-deletes.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md

Key facts established by prior work:
- Job-level photos: entity_type='job', stored in 'job-photos' bucket, tracked in media_attachments table
- Upload route for entity_type='job': POST /api/uploads/entity-photos with fields entity_type=job, entity_id={jobId}, photo={file}
- ENTITY_CONFIGS in entity-photos/route.ts already supports entity_type='job' (bucket: 'job-photos', maxFiles: 10, table: 'jobs')
- PhotoUpload component (components/media/photo-upload.tsx): accepts existingPhotos={ExistingPhoto[]}, onRemoveExisting={(id)=>void}, onChange={(files)=>void}
- ExistingPhoto type: { id: string; url: string; fileName: string }
- Signed URLs: supabase.storage.from('job-photos').createSignedUrls(paths, 21600) — same as full detail page
- deleteMediaAttachment action in request-actions.ts is the reference pattern for soft-deleting attachments
- Permission for photo edit: ga_lead/admin only (canEdit check in job-modal.tsx line 82 equivalent)
- onActionSuccess in job-modal triggers a data refetch — photo state will update after upload/delete

<interfaces>
From components/media/photo-upload.tsx:
```typescript
export interface ExistingPhoto {
  id: string;
  url: string;
  fileName: string;
}

interface PhotoUploadProps {
  onChange: (files: File[]) => void;
  value?: File[];
  existingPhotos?: ExistingPhoto[];
  onRemoveExisting?: (id: string) => void;
  disabled?: boolean;
  maxPhotos?: number;
  enableAnnotation?: boolean;
  enableMobileCapture?: boolean;
  showCount?: boolean;
}
```

From job-modal.tsx (relevant state shape):
```typescript
interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
  commentId?: string;
}
const [commentPhotos, setCommentPhotos] = useState<PhotoItem[]>([]);
// Need to add:
// const [jobPhotoUrls, setJobPhotoUrls] = useState<PhotoItem[]>([]);
```

From app/actions/job-actions.ts (existing delete pattern reference from request-actions.ts):
```typescript
// Pattern to follow:
export const deleteJobAttachment = authActionClient
  .schema(z.object({ attachmentId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => { ... soft-delete via adminSupabase ... });
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add deleteJobAttachment server action</name>
  <files>app/actions/job-actions.ts</files>
  <action>
Add a new `deleteJobAttachment` exported server action at the bottom of job-actions.ts, following the same pattern as `deleteMediaAttachment` in request-actions.ts.

The action:
- Schema: `z.object({ attachmentId: z.string().uuid() })`
- Fetches the attachment from media_attachments (id, entity_id, entity_type, file_path)
- Verifies entity_type === 'job' (throws if not)
- Fetches the parent job from jobs table: verify it belongs to the user's company (eq company_id=profile.company_id) and is not deleted
- Permission check: only ga_lead or admin can delete job photos (check profile.role). Throw 'Only GA Lead or Admin can delete job photos' if not authorized.
- Soft-deletes via adminSupabase: update media_attachments set deleted_at=new Date().toISOString() where id=attachmentId
- Returns { success: true }

Imports needed (already present in job-actions.ts, verify): createAdminClient from '@/lib/supabase/admin'. Add if missing.
  </action>
  <verify>npm run build 2>&1 | grep -E "error|Error" | grep -v "node_modules" | head -20</verify>
  <done>deleteJobAttachment is exported from job-actions.ts, TypeScript compiles without errors</done>
</task>

<task type="auto">
  <name>Task 2: Fetch and display job photos in job-modal view mode</name>
  <files>components/jobs/job-modal.tsx</files>
  <action>
Make three changes to job-modal.tsx:

**1. Add jobPhotoUrls state (near the commentPhotos state, around line 135):**
```typescript
const [jobPhotoUrls, setJobPhotoUrls] = useState<PhotoItem[]>([]);
```

**2. In the fetchData function, after the comment photos fetch block (around line 380), add a job-level photos fetch:**
```typescript
// Fetch job-level photos (entity_type='job')
const { data: jobAttachments } = await supabase
  .from('media_attachments')
  .select('id, file_name, file_path')
  .eq('entity_type', 'job')
  .eq('entity_id', id)
  .is('deleted_at', null)
  .order('sort_order', { ascending: true });

let fetchedJobPhotos: PhotoItem[] = [];
if (jobAttachments && jobAttachments.length > 0) {
  const { data: signedUrls } = await supabase.storage
    .from('job-photos')
    .createSignedUrls(
      jobAttachments.map((a) => a.file_path),
      21600
    );
  fetchedJobPhotos = jobAttachments.map((attachment, index) => ({
    id: attachment.id,
    url: signedUrls?.[index]?.signedUrl ?? '',
    fileName: attachment.file_name,
  }));
}
setJobPhotoUrls(fetchedJobPhotos);
```

Also reset state on close — find where commentPhotos is reset on modal close (the `!jobId` branch around line 549) and add `setJobPhotoUrls([]);` there.

**3. Render photos below the JobForm in the left scrollable column (after the PMChecklist block, before the closing `</div>` of the left column around line 1020):**

```tsx
{/* Job Photos */}
<div className="space-y-2">
  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Photos</p>
  <PhotoUpload
    onChange={async (files) => {
      if (!job) return;
      for (const file of files) {
        const fd = new FormData();
        fd.append('entity_type', 'job');
        fd.append('entity_id', job.id);
        fd.append('photo', file);
        await fetch('/api/uploads/entity-photos', { method: 'POST', body: fd });
      }
      handleActionSuccess();
    }}
    existingPhotos={jobPhotoUrls}
    onRemoveExisting={canEdit ? async (attachmentId) => {
      await deleteJobAttachment({ attachmentId });
      handleActionSuccess();
    } : undefined}
    disabled={!canEdit}
    maxPhotos={10}
    showCount
    enableAnnotation
    enableMobileCapture={false}
  />
</div>
```

Import `deleteJobAttachment` from '@/app/actions/job-actions' (add to existing import from that file).
Import `PhotoUpload` from '@/components/media/photo-upload' (add if not already imported).

Note: `canEdit` is already defined in the scope of the view mode render (the variable checking ga_lead/admin + non-terminal status). Locate it around line 586 equivalent and use the same variable. If it's not in scope at render, derive it inline: `const canEditPhotos = ['ga_lead', 'admin'].includes(currentUserRole) && job && !['completed', 'cancelled'].includes(job.status);` and use `canEditPhotos` instead.
  </action>
  <verify>npm run build 2>&1 | grep -E "error TS|Type error" | grep -v "node_modules" | head -20</verify>
  <done>
- npm run build passes with no TypeScript errors
- In view modal: photos section appears below the form fields
- Existing job photos display as thumbnails (PhotoUpload existingPhotos)
- GA Lead/Admin sees upload button and X on existing photos; read-only users see photos only (disabled)
  </done>
</task>

</tasks>

<verification>
npm run build — must pass with zero TypeScript errors.
Manual check: Open jobs table, click View on a job that has photos — photos section should appear in the modal. If job has no photos, the PhotoUpload shows only the upload dropzone for GA Lead/Admin, nothing for others.
</verification>

<success_criteria>
- Job-level photos (entity_type='job') are fetched and displayed inside the view modal
- GA Lead/Admin can upload new photos directly from the modal (POSTs to /api/uploads/entity-photos)
- GA Lead/Admin can remove existing photos from the modal (calls deleteJobAttachment)
- Read-only users see photos but cannot modify them (disabled=true, no onRemoveExisting)
- npm run build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/38-photo-attachments-should-be-displayed-an/38-SUMMARY.md`
</output>
