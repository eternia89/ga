---
phase: quick-41
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(dashboard)/jobs/page.tsx
  - components/jobs/job-columns.tsx
  - components/jobs/job-table.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Each job table row shows a photo thumbnail (or dashed placeholder) after the ID column"
    - "Clicking a thumbnail opens the PhotoLightbox showing all photos for that job"
    - "Jobs with multiple photos show a count badge on the thumbnail"
    - "Jobs with no photos show a dashed border placeholder with a grey image icon"
  artifacts:
    - path: "app/(dashboard)/jobs/page.tsx"
      provides: "Batch-fetches job photos from media_attachments (entity_type='job'), signs URLs from job-photos bucket, passes photosByJob to JobTable"
    - path: "components/jobs/job-columns.tsx"
      provides: "Photo column cell with thumbnail/placeholder, onPhotoClick handler via meta"
    - path: "components/jobs/job-table.tsx"
      provides: "Lightbox state, handlePhotoClick, PhotoLightbox rendered, photosByJob + onPhotoClick in DataTable meta"
  key_links:
    - from: "app/(dashboard)/jobs/page.tsx"
      to: "components/jobs/job-table.tsx"
      via: "photosByJob prop"
      pattern: "photosByJob"
    - from: "components/jobs/job-table.tsx"
      to: "components/jobs/job-columns.tsx"
      via: "DataTable meta.photosByJob + meta.onPhotoClick"
      pattern: "photosByJob.*onPhotoClick"
    - from: "components/jobs/job-columns.tsx"
      to: "PhotoLightbox"
      via: "meta.onPhotoClick callback"
      pattern: "onPhotoClick"
---

<objective>
Add photo thumbnails to the job table list, matching the exact pattern already implemented in the request and asset tables (quick-40).

Purpose: Visual consistency — job rows show a photo thumbnail in the same position (column 2, after ID) as request rows and asset rows.
Output: Job table with photo thumbnail column wired to lightbox, pulling from media_attachments (entity_type='job', bucket 'job-photos').
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Reference implementations (read these as the exact pattern to replicate):
@components/assets/asset-columns.tsx
@components/assets/asset-table.tsx
@app/(dashboard)/inventory/page.tsx

Target files to modify:
@components/jobs/job-columns.tsx
@components/jobs/job-table.tsx
@app/(dashboard)/jobs/page.tsx

<interfaces>
<!-- Key facts extracted from codebase for executor -->

Job photos in media_attachments:
- entity_type = 'job'  (NOT 'job_comment' — that's for comment attachments)
- Storage bucket = 'job-photos'
- entity_id = job UUID (same as inventory_items.id for assets)

PhotoItem type (same across all three tables):
```typescript
interface PhotoItem {
  id: string;
  url: string;
  fileName: string;
}
```

JobTableMeta (current — needs extension):
```typescript
export type JobTableMeta = {
  onView?: (job: JobWithRelations) => void;
  // ADD:
  photosByJob?: Record<string, PhotoItem[]>;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
};
```

Photo column cell (exact copy from asset-columns.tsx — use identical markup):
- Placeholder: `<div className="flex h-10 w-10 items-center justify-center rounded border-2 border-dashed border-muted-foreground/25"><ImageIcon className="h-4 w-4 text-muted-foreground/40" /></div>`
- Thumbnail button: `className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-border hover:opacity-80 transition-opacity"`
- Count badge: `className="absolute bottom-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-tl bg-black/70 px-0.5 text-[10px] font-medium text-white"`
- Column size: 50, enableSorting: false
- Column id: 'photo', header: ''

Insert photo column at position 2 — after 'display_id', before 'title' (matches request table order).

PhotoLightbox import path:
```typescript
import { PhotoLightbox } from '@/components/requests/request-photo-lightbox';
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add photo column to job-columns.tsx and extend JobTableMeta</name>
  <files>components/jobs/job-columns.tsx</files>
  <action>
    1. Add `ImageIcon` to lucide-react imports.
    2. Add `PhotoItem` interface (same as in asset-columns.tsx — `{ id: string; url: string; fileName: string }`).
    3. Extend `JobTableMeta` with `photosByJob?: Record<string, PhotoItem[]>` and `onPhotoClick?: (photos: PhotoItem[], index: number) => void`.
    4. Insert a new photo column at position 2 in `jobColumns` array (after `display_id` column, before `title` column). Use the exact same cell implementation as asset-columns.tsx:
       - `id: 'photo'`, `header: ''`, `size: 50`, `enableSorting: false`
       - Read `meta?.photosByJob?.[row.original.id] ?? []`
       - Placeholder div when photos.length === 0
       - Clickable button thumbnail when photos exist, with count badge when photos.length > 1
       - `e.stopPropagation()` on click, calls `meta?.onPhotoClick?.(photos, 0)`
  </action>
  <verify>
    TypeScript: `npx tsc --noEmit 2>&1 | grep "job-columns"` — no errors.
  </verify>
  <done>job-columns.tsx exports JobTableMeta with photosByJob/onPhotoClick fields, and jobColumns has a 'photo' column at position 2 with thumbnail/placeholder cell rendering.</done>
</task>

<task type="auto">
  <name>Task 2: Wire lightbox in job-table.tsx and fetch photos in jobs/page.tsx</name>
  <files>components/jobs/job-table.tsx, app/(dashboard)/jobs/page.tsx</files>
  <action>
    **job-table.tsx:**
    1. Add `PhotoLightbox` import from `@/components/requests/request-photo-lightbox`.
    2. Add `PhotoItem` type alias: `type PhotoItem = { id: string; url: string; fileName: string }`.
    3. Add `photosByJob` prop to `JobTableProps` interface: `photosByJob: Record<string, PhotoItem[]>`.
    4. Add lightbox state: `const [lightboxPhotos, setLightboxPhotos] = useState<PhotoItem[]>([])`, `const [lightboxIndex, setLightboxIndex] = useState(0)`, `const [lightboxOpen, setLightboxOpen] = useState(false)`.
    5. Add handler: `const handlePhotoClick = (photos: PhotoItem[], index: number) => { setLightboxPhotos(photos); setLightboxIndex(index); setLightboxOpen(true); }`.
    6. Add `photosByJob` and `onPhotoClick: handlePhotoClick` to the `DataTable` `meta` prop.
    7. Render `PhotoLightbox` at the bottom of the return (after `JobViewModal`): `{lightboxOpen && lightboxPhotos.length > 0 && <PhotoLightbox photos={lightboxPhotos} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />}`.

    **app/(dashboard)/jobs/page.tsx:**
    1. After fetching `jobs`, batch-fetch job photos using the same pattern as inventory/page.tsx but for jobs:
       ```typescript
       let photosByJob: Record<string, { id: string; url: string; fileName: string }[]> = {};

       if (jobs.length > 0) {
         const jobIds = jobs.map((j) => j.id);

         const { data: attachments } = await supabase
           .from('media_attachments')
           .select('id, entity_id, file_name, file_path')
           .eq('entity_type', 'job')
           .in('entity_id', jobIds)
           .is('deleted_at', null)
           .order('created_at', { ascending: false });

         if (attachments && attachments.length > 0) {
           const { data: signedUrls } = await supabase.storage
             .from('job-photos')
             .createSignedUrls(
               attachments.map((a) => a.file_path),
               21600
             );

           const photosWithUrls = attachments.map((a, i) => ({
             id: a.id,
             entityId: a.entity_id,
             url: signedUrls?.[i]?.signedUrl ?? '',
             fileName: a.file_name,
           }));

           for (const photo of photosWithUrls) {
             if (!photosByJob[photo.entityId]) {
               photosByJob[photo.entityId] = [];
             }
             photosByJob[photo.entityId].push({
               id: photo.id,
               url: photo.url,
               fileName: photo.fileName,
             });
           }
         }
       }
       ```
    2. Pass `photosByJob={photosByJob}` to `<JobTable>`.
  </action>
  <verify>
    TypeScript build: `npm run build 2>&1 | tail -20` — no type errors. Confirm `JobTable` receives and uses `photosByJob` prop without errors.
  </verify>
  <done>Jobs page fetches and signs job photo URLs, passes photosByJob to JobTable, JobTable wires it to DataTable meta and renders PhotoLightbox on thumbnail click.</done>
</task>

</tasks>

<verification>
- `npm run build` completes with no TypeScript errors
- Job table renders with a photo column (position 2, between ID and Title columns)
- Rows with photos show a 40x40 thumbnail; clicking opens the lightbox
- Rows with no photos show a dashed placeholder with grey image icon
- Matches the exact visual style of the request table and asset table thumbnails
</verification>

<success_criteria>
Job table list shows photo thumbnails in the same position and style as the request table. Clicking a thumbnail opens the PhotoLightbox. Jobs with no photos show the dashed placeholder. TypeScript build passes cleanly.
</success_criteria>

<output>
After completion, create `.planning/quick/41-job-table-list-display-job-photos-thumbn/41-SUMMARY.md`
</output>
