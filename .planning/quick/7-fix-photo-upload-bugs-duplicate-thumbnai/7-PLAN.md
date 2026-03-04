---
phase: quick-7
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/media/photo-upload.tsx
  - app/actions/request-actions.ts
autonomous: true
requirements: [BUG-PHOTO-DUPLICATE, BUG-PHOTO-ICON, BUG-PHOTO-DELETE-RLS]

must_haves:
  truths:
    - "Uploading photos shows each thumbnail exactly once, no duplicates"
    - "Clear/remove button icon on photo thumbnails is white, visible against the red bg-destructive background"
    - "Deleting a photo attachment from a request succeeds without RLS error"
  artifacts:
    - path: "components/media/photo-upload.tsx"
      provides: "Controlled photo upload component without internal preview duplication"
    - path: "app/actions/request-actions.ts"
      provides: "deleteMediaAttachment using admin client to bypass RLS WITH CHECK"
  key_links:
    - from: "components/media/photo-upload.tsx"
      to: "components/requests/request-edit-form.tsx"
      via: "onChange callback syncs files to parent"
      pattern: "onChange\\(.*\\)"
    - from: "app/actions/request-actions.ts"
      to: "lib/supabase/admin.ts"
      via: "createAdminClient for soft-delete"
      pattern: "createAdminClient"
---

<objective>
Fix three bugs in the photo upload system: (1) duplicate thumbnails appearing when photos are uploaded, (2) clear/remove icon rendering black instead of white, and (3) RLS policy error when deleting photo attachments from requests.

Purpose: These bugs degrade the photo management experience -- duplicates confuse users, invisible icons prevent photo removal, and RLS errors block photo deletion entirely.
Output: Fixed PhotoUpload component and deleteMediaAttachment action.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/media/photo-upload.tsx
@components/requests/request-edit-form.tsx
@app/actions/request-actions.ts
@app/actions/asset-actions.ts
@lib/supabase/admin.ts

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
  existingPhotos?: ExistingPhoto[];
  onRemoveExisting?: (id: string) => void;
  disabled?: boolean;
  maxPhotos?: number;
  enableCompression?: boolean;
  enableAnnotation?: boolean;
  enableMobileCapture?: boolean;
  showCount?: boolean;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
}
```

From app/actions/asset-actions.ts (reference pattern for admin client usage):
```typescript
import { createAdminClient } from '@/lib/supabase/admin';
// ...
const adminSupabase = createAdminClient();
const { error: deleteError } = await adminSupabase
  .from('media_attachments')
  .update({ deleted_at: new Date().toISOString() })
  .in('id', attachments.map((a) => a.id));
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix duplicate thumbnails and black icon in PhotoUpload component</name>
  <files>components/media/photo-upload.tsx, components/requests/request-edit-form.tsx</files>
  <action>
Two bugs to fix in this file:

**Bug 1 - Duplicate thumbnails:** The component maintains internal `previews` state that can get out of sync with the parent. Convert PhotoUpload to support controlled mode by adding an optional `value` prop (File[]) that, when provided, drives the preview display instead of internal state. This follows the existing pattern from Phase 06-02 where AssetPhotoUpload was made controlled.

Specific changes:
1. Add optional `value?: File[]` prop to `PhotoUploadProps` interface.
2. Derive `previews` from `value` when provided (controlled mode). When `value` is provided, compute previews from it using `useMemo` with `URL.createObjectURL`. Clean up object URLs in a `useEffect` cleanup. Do NOT use `useState` for previews in controlled mode.
3. When `value` is NOT provided, keep existing internal state behavior (uncontrolled mode) for backward compatibility with other consumers (asset forms etc.).
4. Use stable keys for preview items -- use `file.name + file.size + file.lastModified` instead of array index.

**Bug 2 - Black clear icon:** On lines 173 and 197, the remove button uses `text-destructive-foreground` but the `--destructive-foreground` CSS variable is not defined in globals.css, causing the icon to render black/dark. Change `text-destructive-foreground` to `text-white` on BOTH remove buttons (existing photos line ~173 and new previews line ~197). This matches the pattern already used in request-edit-form.tsx line 205.

Then update `components/requests/request-edit-form.tsx`: pass `value={newFiles}` to the PhotoUpload component so it operates in controlled mode, eliminating the duplicate thumbnail issue. The parent already manages `newFiles` state and passes `setNewFiles` as `onChange`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>PhotoUpload supports controlled mode via `value` prop. request-edit-form passes `value={newFiles}`. Remove button icons use `text-white` instead of `text-destructive-foreground`. No duplicate thumbnails when uploading photos. Clear icon is white and visible against red background.</done>
</task>

<task type="auto">
  <name>Task 2: Fix RLS error in deleteMediaAttachment by using admin client</name>
  <files>app/actions/request-actions.ts</files>
  <action>
The `deleteMediaAttachment` action (line ~280) uses the authenticated Supabase client (`ctx.supabase`) for the soft-delete UPDATE on `media_attachments`. The RLS `media_attachments_update` WITH CHECK policy fails because the JWT company_id check does not pass for this operation context.

Fix by following the exact pattern from `deleteAssetPhotos` in asset-actions.ts:

1. Add import at top of file: `import { createAdminClient } from '@/lib/supabase/admin';`
2. In the `deleteMediaAttachment` action, KEEP the existing authenticated client (`ctx.supabase`) for the two SELECT queries (fetching attachment and verifying request ownership) -- these serve as authorization checks.
3. Replace ONLY the final soft-delete UPDATE (the `.update({ deleted_at: ... })` call on line ~316-319) to use `createAdminClient()` instead of `ctx.supabase`. This bypasses the RLS WITH CHECK while maintaining the authorization checks above.

The authorization flow remains: (1) verify attachment exists via authenticated query, (2) verify user owns the parent request and it's in submitted status, (3) perform soft-delete via admin client. This is the same trust model as deleteAssetPhotos.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>deleteMediaAttachment uses admin client for the soft-delete UPDATE while keeping authenticated client for authorization queries. No more RLS error when deleting request photo attachments.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run lint` passes
3. Manual test: Upload photos on request edit form -- each thumbnail appears exactly once
4. Manual test: Remove button (X) on photo thumbnails shows white icon on red background
5. Manual test: Delete an existing photo from a request -- succeeds without error
</verification>

<success_criteria>
- Photo upload shows exactly one thumbnail per uploaded file, no duplicates
- Remove button icon is white and clearly visible against the destructive red background
- Deleting a photo attachment from a request completes successfully without RLS policy errors
- TypeScript compilation passes, no regressions
</success_criteria>

<output>
After completion, create `.planning/quick/7-fix-photo-upload-bugs-duplicate-thumbnai/7-SUMMARY.md`
</output>
