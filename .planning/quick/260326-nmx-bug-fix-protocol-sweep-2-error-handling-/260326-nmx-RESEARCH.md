# Bug Fix Protocol Sweep 2: Error Handling Gaps - Research

**Researched:** 2026-03-26
**Domain:** Supabase mutation error handling across entire codebase
**Confidence:** HIGH (exhaustive file-by-file review of all 15 action files + 12 API routes)

## Summary

Exhaustive sweep of all 15 action files in `app/actions/` and all 12 API route files in `app/api/`. Found **19 findings** across 4 categories:

- **CRITICAL (2):** Mutations where the result is entirely ignored -- error not destructured, not checked. If these fail silently, data state becomes inconsistent.
- **HIGH (10):** Mutations that `await` the call but never destructure `{ error }` -- failure is silently swallowed. Most of these involve status transitions on related entities (linked requests, PM jobs), so a silent failure means the entity graph becomes inconsistent.
- **MEDIUM (5):** Storage `.remove()` calls without error handling, rollback mutations without error checks.
- **LOW (2):** SignedUrl failure producing empty string URLs (broken images, no data loss).

**Primary recommendation:** Add `{ error }` destructuring + `console.error` logging (minimum) or `throw` (for data-critical mutations) to all unchecked mutations.

---

## CRITICAL: Mutation Error Ignored Entirely

### C-1: `job-actions.ts:144-151` -- Job status update to `pending_approval` (fire-and-forget)

```typescript
// createJob -- after inserting job, updates status to pending_approval if cost >= threshold
await supabase
  .from('jobs')
  .update({
    status: 'pending_approval',
    approval_submitted_at: now,
  })
  .eq('id', job.id);
// NO { error } destructuring. NO error check.
```

**Risk:** Job is created with status `created` but the approval transition silently fails. The job exists but skips the approval gate entirely. Financial control bypass.

**Fix:** Destructure `{ error }` and throw on failure. This is a data integrity mutation.

### C-2: `job-actions.ts:290-297` -- Insert job_requests links (fire-and-forget in updateJob)

```typescript
// updateJob -- inserting new job_request links
await supabase
  .from('job_requests')
  .insert(toAdd.map((requestId) => ({
    job_id: id,
    request_id: requestId,
    company_id: profile.company_id,
    linked_by: profile.id,
  })));
// NO { error } destructuring. NO error check.
```

**Risk:** Job-request links silently fail to create. UI shows requests as linked but they aren't in the DB. Job completion won't cascade to these requests.

**Fix:** Destructure `{ error }` and throw on failure.

---

## HIGH: Error Destructured But Not Checked (or Not Destructured At All)

### H-1: `job-actions.ts:300-304` -- Update request status to `in_progress` (fire-and-forget in updateJob)

```typescript
await supabase
  .from('requests')
  .update({ status: 'in_progress', updated_at: new Date().toISOString() })
  .in('id', toAdd)
  .in('status', ['triaged']);
// NO { error } destructuring.
```

**Risk:** Linked requests stay in `triaged` status when they should be `in_progress`. Visual inconsistency.

**Fix:** Destructure `{ error }`, log with `console.error` (non-fatal since job was already created).

### H-2: `job-actions.ts:541-552` -- Insert `job_status_changes` GPS record (fire-and-forget)

```typescript
await supabase
  .from('job_status_changes')
  .insert({
    job_id: parsedInput.id,
    company_id: job.company_id,
    from_status: job.status,
    to_status: actualStatus,
    changed_by: profile.id,
    latitude: parsedInput.latitude ?? null,
    longitude: parsedInput.longitude ?? null,
    gps_accuracy: parsedInput.gpsAccuracy ?? null,
  });
// NO { error } destructuring.
```

**Risk:** GPS audit trail silently lost. Status change still succeeds but audit log is incomplete.

**Fix:** Destructure `{ error }`, log with `console.error` (non-fatal -- don't block status change for audit failure).

### H-3: `job-actions.ts:582-590` -- Update linked requests to `pending_acceptance` on job completion (fire-and-forget)

```typescript
await supabase
  .from('requests')
  .update({
    status: 'pending_acceptance',
    completed_at: now,
    updated_at: now,
  })
  .in('id', requestIds)
  .in('status', [...REQUEST_LINKABLE_STATUSES]);
// NO { error } destructuring.
```

**Risk:** Job completes but linked requests stay in `in_progress`/`triaged`. Requester never gets prompted to accept/reject.

**Fix:** Destructure `{ error }`, log with `console.error`. This is important for business flow but the job status change already committed.

### H-4: `job-actions.ts:692-696` -- Revert linked requests to `triaged` on job cancellation (fire-and-forget)

```typescript
await supabase
  .from('requests')
  .update({ status: 'triaged', updated_at: new Date().toISOString() })
  .in('id', requestIds)
  .in('status', ['in_progress', 'pending_acceptance']);
// NO { error } destructuring.
```

**Risk:** Job cancelled but linked requests stay in `in_progress`. Orphaned requests that appear active for a cancelled job.

**Fix:** Destructure `{ error }`, log with `console.error`.

### H-5: `schedule-actions.ts:237-242` -- Cancel open PM jobs when deactivating schedule (fire-and-forget)

```typescript
await adminSupabase
  .from('jobs')
  .update({ status: 'cancelled' })
  .eq('maintenance_schedule_id', parsedInput.id)
  .in('status', [...JOB_OPEN_STATUSES])
  .is('deleted_at', null);
// NO { error } destructuring.
```

**Risk:** Schedule deactivated but orphan PM jobs remain open. Staff continues working on jobs for a deactivated schedule.

**Fix:** Destructure `{ error }`, log with `console.error`.

### H-6: `schedule-actions.ts:514-519` -- Cancel open PM jobs for paused schedules (fire-and-forget)

```typescript
await supabase
  .from('jobs')
  .update({ status: 'cancelled' })
  .in('maintenance_schedule_id', scheduleIds)
  .in('status', [...JOB_OPEN_STATUSES])
  .is('deleted_at', null);
// NO { error } destructuring.
```

**Risk:** Schedules paused but PM jobs remain open. Same as H-5.

**Fix:** Destructure `{ error }`, log with `console.error`.

### H-7: `request-actions.ts:511-518` -- Revert linked jobs to `in_progress` when requester rejects work

```typescript
await supabase
  .from('jobs')
  .update({
    status: 'in_progress',
    completed_at: null,
  })
  .in('id', jobIds)
  .eq('status', 'completed');
// NO { error } destructuring.
```

**Risk:** Work rejected on request but linked jobs still show `completed`. PIC doesn't know rework is needed.

**Fix:** Destructure `{ error }`, log with `console.error`.

### H-8: `asset-actions.ts:334-337` -- Rollback: delete movement record (fire-and-forget)

```typescript
// Rollback: delete the movement record since asset update failed
await supabase
  .from('inventory_movements')
  .delete()
  .eq('id', data.id);
// NO { error } destructuring on rollback.
```

**Risk:** Rollback fails silently, leaving an orphaned `accepted` movement record for an asset that didn't actually move.

**Fix:** Destructure `{ error }`, log with `console.error` (can't do much else -- already in error path).

### H-9: `asset-actions.ts:401-404` -- Rollback: revert movement to pending (fire-and-forget)

```typescript
// Rollback: revert movement back to pending since asset update failed
await supabase
  .from('inventory_movements')
  .update({ status: 'pending', received_by: null, received_at: null })
  .eq('id', parsedInput.movement_id);
// NO { error } destructuring on rollback.
```

**Risk:** Rollback fails silently. Movement shows `accepted` but asset didn't move. Inconsistent state.

**Fix:** Destructure `{ error }`, log with `console.error`.

### H-10: `api/auth/signout/route.ts:8` -- signOut result ignored

```typescript
await supabase.auth.signOut({ scope: 'global' })
// NO { error } destructuring.
```

**Risk:** Low -- user is redirected to login page regardless. If signOut fails, the session cookie may remain valid on other devices. Acceptable for UX but should log.

**Fix:** Destructure `{ error }`, log with `console.error`.

---

## MEDIUM: Storage Operations and Non-Critical Gaps

### M-1: `asset-actions.ts:672` -- Storage `.remove()` without error check

```typescript
await adminSupabase.storage.from(parsedInput.bucket).remove(filePaths);
// NO error check. Orphan files remain in storage if remove fails.
```

**Fix:** Destructure and log. Non-fatal (soft-delete already done on DB records).

### M-2: `api/uploads/request-photos/route.ts:162` -- Storage cleanup `.remove()` without error check

```typescript
await adminSupabase.storage.from('request-photos').remove([uploadData.path]);
```

Same pattern in:
- `api/uploads/asset-photos/route.ts:182`
- `api/uploads/asset-invoices/route.ts:152`
- `api/uploads/entity-photos/route.ts:199`
- `api/uploads/job-photos/route.ts:133`

**Fix:** Wrap in try-catch with `console.error` or destructure result. These are cleanup operations in error paths -- failure here means orphaned storage files.

### M-3: `api/uploads/asset-invoices/route.ts:159` -- Success response returns even when partial uploads failed

```typescript
return NextResponse.json({ success: true, count: uploadedCount });
// Unlike request-photos which has partial: uploadedCount < uniqueFiles.length
```

**Fix:** Add `partial` flag to response, consistent with other upload routes.

### M-4: `approval-actions.ts:217-219` -- Error logged but not thrown

```typescript
if (reqUpdateError) {
  console.error('[approval] Failed to update linked request status:', reqUpdateError.message);
}
// Continues without throwing -- linked requests may not transition to pending_acceptance
```

**Risk:** This is intentional (don't fail approval because linked request update failed), but should be documented. Currently the only action file that logs but doesn't throw.

### M-5: `entity-photos/route.ts:241-249` -- Vision API fire-and-forget with proper `.catch`

The entity-photos route has chained `.then().catch()` for Vision API calls. The `.catch` handlers DO have `console.error`. This pattern is acceptable.

**Status:** Already handled. No fix needed.

---

## LOW: SignedUrl Empty String on Failure

### L-1: All `signedUrl` access uses `?? ''` fallback + `.filter((p) => p.url !== '')`

Found in:
- `asset-actions.ts:574,616` (getAssetPhotos, getAssetInvoices)
- `request-actions.ts:599` (getRequestPhotos)
- `components/assets/asset-view-modal.tsx:251,273,292` (3 occurrences)
- `components/assets/asset-transfer-respond-modal.tsx:141,169` (2 occurrences)
- `components/jobs/job-modal.tsx:390,417` (2 occurrences)
- `app/(dashboard)/jobs/page.tsx:198` (job list thumbnails)
- `app/(dashboard)/jobs/[id]/page.tsx:186` (job detail)

**Pattern:** `signedUrls?.[index]?.signedUrl ?? ''` followed by `.filter((p) => p.url !== '')` in actions, but NOT always filtered in components.

**Risk:** In action files, the `.filter()` ensures empty URLs are stripped. In component files (asset-view-modal, job-modal, transfer-respond-modal), the empty string is NOT filtered -- it is passed as `url: ''` to the photo display component, which likely renders as a broken image.

**Fix:** Consistently filter out empty URLs in ALL locations, or log a warning when `createSignedUrls` returns null/error.

### L-2: `createSignedUrls` error is never destructured

In all 12+ locations, only `{ data: signedUrls }` is destructured. The `{ error }` is never checked. If the storage API fails entirely (bucket permissions, network), signedUrls is `null` and every photo gets `url: ''`.

**Fix:** Add `{ data: signedUrls, error: signedUrlError }` and log the error.

---

## Findings by File (Summary Table)

| # | Severity | File | Line(s) | Issue | Fix |
|---|----------|------|---------|-------|-----|
| C-1 | CRITICAL | job-actions.ts | 144-151 | Job status update to `pending_approval` -- error ignored | Destructure + throw |
| C-2 | CRITICAL | job-actions.ts | 290-297 | Insert job_requests links -- error ignored | Destructure + throw |
| H-1 | HIGH | job-actions.ts | 300-304 | Update request status to `in_progress` -- error ignored | Destructure + log |
| H-2 | HIGH | job-actions.ts | 541-552 | Insert `job_status_changes` GPS record -- error ignored | Destructure + log |
| H-3 | HIGH | job-actions.ts | 582-590 | Update requests to `pending_acceptance` -- error ignored | Destructure + log |
| H-4 | HIGH | job-actions.ts | 692-696 | Revert requests to `triaged` on cancel -- error ignored | Destructure + log |
| H-5 | HIGH | schedule-actions.ts | 237-242 | Cancel PM jobs on schedule deactivate -- error ignored | Destructure + log |
| H-6 | HIGH | schedule-actions.ts | 514-519 | Cancel PM jobs for paused schedules -- error ignored | Destructure + log |
| H-7 | HIGH | request-actions.ts | 511-518 | Revert linked jobs on work rejection -- error ignored | Destructure + log |
| H-8 | HIGH | asset-actions.ts | 334-337 | Rollback: delete movement record -- error ignored | Destructure + log |
| H-9 | HIGH | asset-actions.ts | 401-404 | Rollback: revert movement to pending -- error ignored | Destructure + log |
| H-10 | HIGH | api/auth/signout/route.ts | 8 | signOut result ignored | Destructure + log |
| M-1 | MEDIUM | asset-actions.ts | 672 | Storage `.remove()` without error check | Destructure + log |
| M-2 | MEDIUM | 5 upload routes | various | Storage cleanup `.remove()` without error check | try-catch + log |
| M-3 | MEDIUM | asset-invoices/route.ts | 159 | Missing `partial` flag in response | Add `partial` flag |
| M-4 | MEDIUM | approval-actions.ts | 217-219 | Error logged but not thrown (intentional?) | Document intent |
| M-5 | MEDIUM | entity-photos/route.ts | 241-249 | Vision API `.catch` -- already handled | No fix needed |
| L-1 | LOW | 12+ locations | various | signedUrl empty string not always filtered | Filter consistently |
| L-2 | LOW | 12+ locations | various | `createSignedUrls` error never destructured | Destructure + log |

---

## What Was NOT Found (Clean Patterns)

The following patterns are handled CORRECTLY across the codebase:

1. **All primary mutations** (insert/update/delete) in action files destructure `{ error }` and either `throw new Error(error.message)` or check with `if (error)`. This is consistent.

2. **`safeCreateNotifications`** already wraps fire-and-forget notification calls with `.catch(err => console.error(...))`. All notification calls use this safe wrapper.

3. **All `.single()` fetch calls** check `if (!data)` or `if (error || !data)` before proceeding.

4. **API route upload handlers** have proper try-catch at the top level and return appropriate HTTP error responses.

5. **`.catch` handlers in entity-photos/route.ts** (Vision API) properly log with `console.error`.

---

## Recommended Fix Approach

### For CRITICAL (C-1, C-2): Throw on error
```typescript
const { error: updateError } = await supabase
  .from('jobs')
  .update({ status: 'pending_approval', ... })
  .eq('id', job.id);
if (updateError) {
  throw new Error(`Failed to transition job to pending_approval: ${updateError.message}`);
}
```

### For HIGH (H-1 through H-10): Log on error
```typescript
const { error: statusError } = await supabase
  .from('requests')
  .update({ status: 'in_progress', ... })
  .in('id', toAdd)
  .in('status', ['triaged']);
if (statusError) {
  console.error('[job-actions] Failed to update linked request status:', statusError.message);
}
```

### For MEDIUM (M-1, M-2): Wrap with try-catch or log
```typescript
const { error: removeError } = await adminSupabase.storage
  .from(parsedInput.bucket)
  .remove(filePaths);
if (removeError) {
  console.error('[asset-actions] Failed to remove storage files:', removeError);
}
```

### For LOW (L-1, L-2): Add error logging to signedUrl calls
```typescript
const { data: signedUrls, error: signedUrlError } = await supabase.storage
  .from('asset-photos')
  .createSignedUrls(paths, 3600);
if (signedUrlError) {
  console.error('[asset-photos] Failed to create signed URLs:', signedUrlError.message);
}
```
