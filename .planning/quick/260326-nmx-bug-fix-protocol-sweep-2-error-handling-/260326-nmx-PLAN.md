---
phase: quick
plan: 260326-nmx
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/job-actions.ts
  - app/actions/schedule-actions.ts
  - app/actions/request-actions.ts
  - app/actions/asset-actions.ts
  - app/actions/approval-actions.ts
  - app/api/auth/signout/route.ts
  - app/api/uploads/request-photos/route.ts
  - app/api/uploads/asset-photos/route.ts
  - app/api/uploads/asset-invoices/route.ts
  - app/api/uploads/entity-photos/route.ts
  - app/api/uploads/job-photos/route.ts
  - components/assets/asset-view-modal.tsx
  - components/assets/asset-transfer-respond-modal.tsx
  - components/jobs/job-modal.tsx
  - app/(dashboard)/jobs/page.tsx
  - app/(dashboard)/jobs/[id]/page.tsx
  - app/(dashboard)/requests/[id]/page.tsx
  - app/(dashboard)/requests/page.tsx
  - app/(dashboard)/inventory/page.tsx
  - app/(dashboard)/inventory/[id]/page.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "All Supabase mutations destructure { error } and either throw (CRITICAL) or console.error (HIGH/MEDIUM)"
    - "Storage .remove() calls in upload route error paths log failures instead of silently swallowing"
    - "createSignedUrls errors are destructured and logged; empty-string URLs are filtered out before reaching components"
    - "asset-invoices upload route returns partial flag consistent with other upload routes"
  artifacts:
    - path: "app/actions/job-actions.ts"
      provides: "Error handling for 6 fire-and-forget mutations (C-1, C-2, H-1, H-2, H-3, H-4)"
      contains: "throw new Error.*pending_approval|console.error.*job-actions"
    - path: "app/actions/schedule-actions.ts"
      provides: "Error handling for 2 fire-and-forget job cancellation mutations (H-5, H-6)"
      contains: "console.error.*schedule-actions"
    - path: "app/actions/request-actions.ts"
      provides: "Error handling for 1 fire-and-forget job revert mutation (H-7)"
      contains: "console.error.*request-actions"
    - path: "app/actions/asset-actions.ts"
      provides: "Error handling for 2 rollback mutations + 1 storage remove (H-8, H-9, M-1)"
      contains: "console.error.*asset-actions"
    - path: "app/api/auth/signout/route.ts"
      provides: "Error handling for signOut call (H-10)"
      contains: "console.error.*signout"
  key_links:
    - from: "app/actions/job-actions.ts"
      to: "supabase.from('jobs').update"
      via: "CRITICAL error throw on pending_approval transition"
      pattern: "throw new Error.*pending_approval"
    - from: "app/actions/job-actions.ts"
      to: "supabase.from('job_requests').insert"
      via: "CRITICAL error throw on link creation"
      pattern: "throw new Error.*job.request link"
    - from: "createSignedUrls calls"
      to: "photo display components"
      via: "error destructuring + empty URL filtering"
      pattern: "signedUrlError|filter.*url"
---

<objective>
Fix 18 error handling gaps across action files, API routes, and components identified by Bug Fix Protocol Sweep 2.

Purpose: Prevent silent mutation failures that cause data inconsistency (jobs skipping approval gates, orphaned links, stale request statuses) and improve observability for storage/signedUrl failures.

Output: All fire-and-forget Supabase mutations properly destructure errors with throw (critical) or console.error (non-critical). Storage cleanup and signedUrl errors logged. Empty-string URLs filtered before reaching components.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260326-nmx-bug-fix-protocol-sweep-2-error-handling-/260326-nmx-RESEARCH.md
@app/actions/job-actions.ts
@app/actions/schedule-actions.ts
@app/actions/request-actions.ts
@app/actions/asset-actions.ts
@app/actions/approval-actions.ts
@app/api/auth/signout/route.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix CRITICAL + HIGH error handling in action files</name>
  <files>
    app/actions/job-actions.ts
    app/actions/schedule-actions.ts
    app/actions/request-actions.ts
    app/actions/asset-actions.ts
    app/api/auth/signout/route.ts
  </files>
  <action>
Fix 12 fire-and-forget Supabase mutations across 5 files. Use the RESEARCH.md line numbers as guides but verify actual code positions before editing. For each finding:

**CRITICAL -- Destructure { error } and THROW (data integrity mutations):**

C-1: `job-actions.ts` -- `createJob` -- the `await supabase.from('jobs').update({ status: 'pending_approval' ... })` call around line 144-151. Destructure `{ error: approvalError }` and add:
```typescript
if (approvalError) {
  throw new Error(`Failed to transition job to pending_approval: ${approvalError.message}`);
}
```

C-2: `job-actions.ts` -- `updateJob` -- the `await supabase.from('job_requests').insert(...)` call around line 290-297. Destructure `{ error: linkError }` and add:
```typescript
if (linkError) {
  throw new Error(`Failed to create job-request links: ${linkError.message}`);
}
```

**HIGH -- Destructure { error } and LOG (non-fatal side effects):**

H-1: `job-actions.ts` -- `updateJob` -- the `await supabase.from('requests').update({ status: 'in_progress' ... })` call around line 300-304. Destructure `{ error: reqStatusError }` and add:
```typescript
if (reqStatusError) {
  console.error('[updateJob] Failed to update linked request status to in_progress:', reqStatusError.message);
}
```

H-2: `job-actions.ts` -- `updateJobStatus` -- the `await supabase.from('job_status_changes').insert(...)` GPS record around line 541-552. Destructure `{ error: auditError }` and add:
```typescript
if (auditError) {
  console.error('[updateJobStatus] Failed to insert job_status_changes GPS record:', auditError.message);
}
```

H-3: `job-actions.ts` -- after job completion -- the `await supabase.from('requests').update({ status: 'pending_acceptance' ... })` around line 582-590. Destructure `{ error: reqCompleteError }` and add:
```typescript
if (reqCompleteError) {
  console.error('[updateJobStatus] Failed to update linked requests to pending_acceptance:', reqCompleteError.message);
}
```

H-4: `job-actions.ts` -- on job cancellation -- the `await supabase.from('requests').update({ status: 'triaged' ... })` around line 692-696. Destructure `{ error: reqRevertError }` and add:
```typescript
if (reqRevertError) {
  console.error('[cancelJob] Failed to revert linked requests to triaged:', reqRevertError.message);
}
```

H-5: `schedule-actions.ts` -- `deactivateSchedule` -- the `await adminSupabase.from('jobs').update({ status: 'cancelled' })` around line 237-242. Destructure `{ error: cancelJobsError }` and add:
```typescript
if (cancelJobsError) {
  console.error('[deactivateSchedule] Failed to cancel open PM jobs:', cancelJobsError.message);
}
```

H-6: `schedule-actions.ts` -- pause schedules batch -- the `await supabase.from('jobs').update({ status: 'cancelled' })` around line 514-519. Destructure `{ error: cancelJobsError }` and add:
```typescript
if (cancelJobsError) {
  console.error('[pauseSchedules] Failed to cancel open PM jobs for paused schedules:', cancelJobsError.message);
}
```

H-7: `request-actions.ts` -- work rejection -- the `await supabase.from('jobs').update({ status: 'in_progress', completed_at: null })` around line 511-518. Destructure `{ error: revertJobError }` and add:
```typescript
if (revertJobError) {
  console.error('[rejectWork] Failed to revert linked jobs to in_progress:', revertJobError.message);
}
```

H-8: `asset-actions.ts` -- rollback -- the `await supabase.from('inventory_movements').delete().eq('id', data.id)` around line 334-337. Destructure `{ error: rollbackError }` and add:
```typescript
if (rollbackError) {
  console.error('[acceptTransfer] Rollback failed - could not delete movement record:', rollbackError.message);
}
```

H-9: `asset-actions.ts` -- rollback -- the `await supabase.from('inventory_movements').update({ status: 'pending' ... })` around line 401-404. Destructure `{ error: rollbackError }` and add:
```typescript
if (rollbackError) {
  console.error('[rejectTransfer] Rollback failed - could not revert movement to pending:', rollbackError.message);
}
```

H-10: `api/auth/signout/route.ts` -- the `await supabase.auth.signOut({ scope: 'global' })` around line 8. Destructure `{ error }` and add:
```typescript
if (error) {
  console.error('[signout] Failed to sign out:', error.message);
}
```

**IMPORTANT:** Use descriptive error variable names to avoid shadowing any existing `error` variables in scope. Check the surrounding context of each mutation before choosing the variable name.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -50 && npm run lint 2>&1 | tail -20</automated>
  </verify>
  <done>
All 12 findings (C-1, C-2, H-1 through H-10) have { error } destructured. C-1 and C-2 throw on error. H-1 through H-10 log with console.error using '[action-name]' prefix. No TypeScript or lint errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix MEDIUM gaps in storage cleanup, upload routes, and approval docs</name>
  <files>
    app/actions/asset-actions.ts
    app/actions/approval-actions.ts
    app/api/uploads/request-photos/route.ts
    app/api/uploads/asset-photos/route.ts
    app/api/uploads/asset-invoices/route.ts
    app/api/uploads/entity-photos/route.ts
    app/api/uploads/job-photos/route.ts
  </files>
  <action>
Fix 4 MEDIUM findings (M-5 already handled, skip it):

**M-1: `asset-actions.ts`** -- the `await adminSupabase.storage.from(parsedInput.bucket).remove(filePaths)` around line 672. Destructure and log:
```typescript
const { error: removeError } = await adminSupabase.storage.from(parsedInput.bucket).remove(filePaths);
if (removeError) {
  console.error('[deleteAssetMedia] Failed to remove storage files:', removeError.message);
}
```

**M-2: 5 upload routes** -- Each upload route has a storage `.remove()` call in an error/cleanup path that is not checked. For each route, wrap the remove call with error handling:

- `app/api/uploads/request-photos/route.ts` around line 162:
```typescript
const { error: cleanupError } = await adminSupabase.storage.from('request-photos').remove([uploadData.path]);
if (cleanupError) {
  console.error('[request-photos] Failed to cleanup storage after DB error:', cleanupError.message);
}
```

- `app/api/uploads/asset-photos/route.ts` around line 182: Same pattern with `'[asset-photos]'` prefix and `'asset-photos'` bucket.

- `app/api/uploads/asset-invoices/route.ts` around line 152: Same pattern with `'[asset-invoices]'` prefix and `'asset-invoices'` bucket.

- `app/api/uploads/entity-photos/route.ts` around line 199: Same pattern with `'[entity-photos]'` prefix and appropriate bucket.

- `app/api/uploads/job-photos/route.ts` around line 133: Same pattern with `'[job-photos]'` prefix and `'job-photos'` bucket.

**IMPORTANT:** These `.remove()` calls are in error paths (catch blocks or error branches). The variable must not shadow any existing error variable in the same scope. Use `cleanupError` or `removeError` as appropriate.

**M-3: `asset-invoices/route.ts`** around line 159 -- Add `partial` flag to the success response, consistent with `request-photos` and `asset-photos` routes:
```typescript
return NextResponse.json({
  success: true,
  count: uploadedCount,
  partial: uploadedCount < uniqueFiles.length,
});
```
Look at `request-photos/route.ts` success response as the reference pattern.

**M-4: `approval-actions.ts`** around lines 217-219 -- The existing `console.error` without throw is intentional (don't fail approval for linked request update failure). Add an inline comment documenting this decision:
```typescript
if (reqUpdateError) {
  // Intentional: log but don't throw. Approval should succeed even if linked request status update fails.
  // The request status can be corrected manually; blocking approval would be worse.
  console.error('[approval] Failed to update linked request status:', reqUpdateError.message);
}
```
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -50 && npm run lint 2>&1 | tail -20</automated>
  </verify>
  <done>
M-1: asset-actions storage remove destructures error and logs. M-2: All 5 upload route cleanup .remove() calls destructure error and log. M-3: asset-invoices returns partial flag. M-4: approval-actions has inline comment documenting intentional log-without-throw. No TypeScript or lint errors.
  </done>
</task>

<task type="auto">
  <name>Task 3: Fix LOW signedUrl error handling and empty-string filtering</name>
  <files>
    app/actions/request-actions.ts
    app/actions/asset-actions.ts
    components/assets/asset-view-modal.tsx
    components/assets/asset-transfer-respond-modal.tsx
    components/jobs/job-modal.tsx
    app/(dashboard)/jobs/page.tsx
    app/(dashboard)/jobs/[id]/page.tsx
    app/(dashboard)/requests/[id]/page.tsx
    app/(dashboard)/requests/page.tsx
    app/(dashboard)/inventory/page.tsx
    app/(dashboard)/inventory/[id]/page.tsx
  </files>
  <action>
Fix 2 LOW findings across all files that use `createSignedUrls`.

**L-2: Add error destructuring to all createSignedUrls calls.**

In every file that calls `.createSignedUrls(...)`, change from:
```typescript
const { data: signedUrls } = await supabase.storage.from('...').createSignedUrls(paths, 3600);
```
to:
```typescript
const { data: signedUrls, error: signedUrlError } = await supabase.storage.from('...').createSignedUrls(paths, 3600);
if (signedUrlError) {
  console.error('[context] Failed to create signed URLs:', signedUrlError.message);
}
```

Use appropriate context prefixes:
- In `request-actions.ts`: `'[getRequestPhotos]'`
- In `asset-actions.ts` (getAssetPhotos): `'[getAssetPhotos]'`
- In `asset-actions.ts` (getAssetInvoices): `'[getAssetInvoices]'`
- In component/page files: `'[ComponentName]'` matching the component name

**L-1: Filter empty-string URLs in component files.**

In action files (`request-actions.ts`, `asset-actions.ts`), there is already a `.filter((p) => p.url !== '')` pattern. Verify it exists and leave it.

In component/page files, the `signedUrl ?? ''` pattern produces empty strings that are NOT filtered. For each component/page file that maps signed URLs into a photo array:

Find the pattern where `signedUrl ?? ''` produces the URL and add filtering AFTER the map to strip entries with empty URLs. The exact approach depends on how each file structures its data, but the general pattern is:

```typescript
// After mapping photos with signed URLs, filter out failed ones:
.filter((photo) => photo.url !== '')
```

Files to check and fix (from RESEARCH.md):
- `components/assets/asset-view-modal.tsx` -- 3 occurrences (lines ~251, 273, 292)
- `components/assets/asset-transfer-respond-modal.tsx` -- 2 occurrences (lines ~141, 169)
- `components/jobs/job-modal.tsx` -- 2 occurrences (lines ~390, 417)
- `app/(dashboard)/jobs/page.tsx` -- 1 occurrence (line ~198)
- `app/(dashboard)/jobs/[id]/page.tsx` -- 1 occurrence (line ~186)
- `app/(dashboard)/requests/[id]/page.tsx` -- check for occurrences
- `app/(dashboard)/requests/page.tsx` -- check for occurrences
- `app/(dashboard)/inventory/page.tsx` -- check for occurrences
- `app/(dashboard)/inventory/[id]/page.tsx` -- check for occurrences

For each file, read the surrounding context to understand the data structure, then add `.filter()` at the appropriate point to exclude entries where the URL is an empty string. If a file already has the filter, skip it.

**IMPORTANT:** Some of these files may use the signed URL as a single value (not in an array map). In those cases, check for empty string and set to `null` or skip rendering:
```typescript
const url = signedUrls?.[0]?.signedUrl || null;
// Use `url` only if non-null
```
Prefer `|| null` over `?? ''` so downstream components can check for null and show a placeholder instead of rendering a broken image.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -50 && npm run lint 2>&1 | tail -20</automated>
  </verify>
  <done>
L-2: All createSignedUrls calls destructure { error: signedUrlError } and log on failure. L-1: All component/page files either filter out empty-string URLs from arrays or use `|| null` for single values. No broken image sources from failed signedUrl calls. No TypeScript or lint errors.
  </done>
</task>

</tasks>

<verification>
After all 3 tasks complete:

1. TypeScript compilation: `npx tsc --noEmit` passes with no errors
2. Lint: `npm run lint` passes with no errors
3. Grep verification -- confirm no remaining fire-and-forget patterns:

```bash
# Should find ZERO results in action files (all mutations now checked)
grep -n "await supabase" app/actions/job-actions.ts | grep -v "error\|const {" | head -20
grep -n "await supabase" app/actions/schedule-actions.ts | grep -v "error\|const {" | head -20
grep -n "await supabase" app/actions/request-actions.ts | grep -v "error\|const {" | head -20
grep -n "await supabase" app/actions/asset-actions.ts | grep -v "error\|const {" | head -20
```

4. Build check: `npm run build` completes successfully
</verification>

<success_criteria>
- All 2 CRITICAL mutations throw on error (C-1, C-2)
- All 10 HIGH mutations log on error (H-1 through H-10)
- All 5 MEDIUM storage/upload gaps handled (M-1 through M-4, M-5 already done)
- All LOW signedUrl gaps handled (L-1, L-2) across all 11+ files
- Zero TypeScript compilation errors
- Zero lint errors
- Build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/260326-nmx-bug-fix-protocol-sweep-2-error-handling-/260326-nmx-SUMMARY.md`
</output>
