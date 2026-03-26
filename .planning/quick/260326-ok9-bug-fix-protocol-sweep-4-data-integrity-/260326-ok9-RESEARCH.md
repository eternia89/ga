# Bug Fix Protocol Sweep 4 — Data Integrity: Non-Atomic Operations + Partial Failures

**Researched:** 2026-03-26
**Domain:** Server action data integrity — multi-step mutations, bulk operations, rollback gaps
**Confidence:** HIGH (direct source code analysis of all 15 action files)

## Summary

Exhaustive sweep of all 15 action files in `app/actions/` for three classes of data integrity bugs: (1) sequential multi-table mutations without rollback, (2) bulk loops with individual mutations that can partially fail, and (3) missing field updates in transfer operations.

**Key finding:** The codebase already has rollback logic in the two highest-risk transfer operations (`acceptTransfer` and `createTransfer` location-only branch). However, several other multi-step mutations lack rollback, four bulk deactivate functions loop with individual mutations, and multiple "fire-and-forget" secondary operations silently swallow errors.

**Primary recommendation:** Convert bulk deactivation loops to pre-validate + batch `.in()` updates. Add rollback logic to the remaining multi-step mutations where the second step's failure leaves the system in an inconsistent state. Promote critical secondary operations from console.error-and-continue to proper error handling.

---

## Finding 1: ALREADY FIXED — `createTransfer` location-only branch

**File:** `app/actions/asset-actions.ts`, lines 327-344
**Status:** NO BUG — already has rollback and already sets `holder_id: null`

The location-only transfer branch:
1. Inserts an `inventory_movements` record with status `accepted` (line 306-321)
2. Updates `inventory_items` with `location_id` and `holder_id: null` (line 328-331)
3. If step 2 fails, rolls back by deleting the movement record (line 334-337)

This was apparently already fixed. `holder_id: null` is present on line 330.

---

## Finding 2: ALREADY FIXED — `acceptTransfer` has rollback

**File:** `app/actions/asset-actions.ts`, lines 384-414
**Status:** NO BUG — already has rollback

1. Updates movement to `accepted` (line 384-391)
2. Updates asset `location_id` and `holder_id` (line 398-401)
3. If step 2 fails, rolls back movement to `pending` (line 405-408)

The log message on line 410 says `[rejectTransfer]` but this is the `acceptTransfer` function — a copy-paste typo in the error message. Minor cosmetic bug, not data integrity.

---

## Finding 3: BUG — `changeAssetStatus` multi-step without rollback

**File:** `app/actions/asset-actions.ts`, lines 149-227
**Severity:** MEDIUM
**What happens:**
1. Updates `inventory_items.status` (line 202-206)
2. Then calls schedule hooks: `deactivateSchedulesForAsset`, `pauseSchedulesForAsset`, or `resumeSchedulesForAsset` (lines 212-223)

**Failure mode:** If the asset status update succeeds but the schedule hook fails:
- Asset shows `sold_disposed` but schedules remain active
- Asset shows `broken` but maintenance schedules keep generating PM jobs
- Asset shows `active` but schedules remain paused

**Mitigating factor:** The schedule helper functions already catch errors with console.error and return gracefully (they don't throw). So the asset status change always succeeds, but schedules may be out of sync.

**Risk assessment:** LOW-MEDIUM. The schedule hooks use `.update()` with filters, and Supabase batch updates are atomic per call. The most likely failure would be a network/timeout issue. The current behavior (log and continue) is arguably acceptable for a non-critical side effect — but it means silent data inconsistency.

**Recommended fix:** If schedule hook fails, log a warning but don't rollback the status change. Instead, add an admin "sync schedule status" utility that detects and fixes out-of-sync schedule states (e.g., active schedules for sold/disposed assets). This is better than rolling back the status change because the user's intent (change status) is primary.

---

## Finding 4: BUG — `deleteAssetPhotos` two-step without rollback

**File:** `app/actions/asset-actions.ts`, lines 644-694
**Severity:** LOW
**What happens:**
1. Soft-deletes `media_attachments` records (line 677-680)
2. Removes files from storage (line 688)

**Failure mode:** If soft-delete succeeds but storage removal fails:
- Attachment records are marked deleted (invisible to users)
- Storage files remain, consuming space (orphaned blobs)

**Current handling:** Storage errors are caught with console.error (line 689-691) and don't throw.

**Risk assessment:** LOW. Orphaned blobs waste storage but don't cause data inconsistency visible to users. This is a common pattern in blob storage systems.

**Recommended fix:** No immediate action needed. Consider a periodic storage cleanup job that removes blobs without corresponding active attachment records.

---

## Finding 5: BUG — `createUser` step 3 (metadata) failure silently degrades

**File:** `app/actions/user-actions.ts`, lines 94-108
**Severity:** MEDIUM
**What happens:**
1. Creates auth user (line 59-66) -- rollback on later failure
2. Inserts `user_profiles` row (line 74-85) -- rollback deletes auth user on failure
3. Sets `app_metadata` on auth user (line 94-103)

**Failure mode:** Step 3 failure is only logged (line 107). The user is created but their JWT won't have `role`, `company_id`, `division_id`. Per CLAUDE.md: "RLS helper functions read from JWT app_metadata. Without these fields, all RLS-protected queries return empty results after login."

**Risk assessment:** MEDIUM. The user account exists and can log in, but will see no data due to missing RLS metadata. This is a silent, confusing failure.

**Recommended fix:** Treat step 3 as critical. If metadata update fails, either retry once or rollback the entire user creation (delete profile + delete auth user). The current "log and continue" means the user is created in a broken state.

---

## Finding 6: BUG — `updateUser` two-step without rollback

**File:** `app/actions/user-actions.ts`, lines 135-180
**Severity:** MEDIUM
**What happens:**
1. Updates `user_profiles` row (line 144-154)
2. Updates auth user `app_metadata` (line 161-170)

**Failure mode:** If step 1 succeeds but step 2 fails:
- `user_profiles` has new role/company/division
- Auth JWT still has old role/company/division
- User sees data based on old RLS metadata, but admin sees updated profile

**Current handling:** Metadata error is logged but operation returns success (line 173-175).

**Risk assessment:** MEDIUM. The mismatch between profile and JWT metadata means the user's effective permissions don't match what the admin configured. The user would need to re-login to pick up profile changes, but the JWT metadata is wrong.

**Recommended fix:** If metadata update fails, rollback the profile update to the previous values. Or, if metadata is truly best-effort, at minimum return a warning to the admin that the user may need to log out and back in.

---

## Finding 7: BUG — `updateUserCompanyAccess` delete-then-insert without rollback

**File:** `app/actions/user-company-access-actions.ts`, lines 31-71
**Severity:** MEDIUM
**What happens:**
1. Deletes ALL existing access rows (line 52-54)
2. Inserts new access rows (line 63-65)

**Failure mode:** If step 1 succeeds but step 2 fails:
- User loses ALL multi-company access
- Admin intended to modify access, but user has none

**Risk assessment:** MEDIUM. This is a classic delete-then-insert anti-pattern. A mid-operation failure (network timeout, constraint violation on insert) leaves the user with zero company access.

**Recommended fix:** Wrap in a Supabase RPC transaction, or restructure as a diff (delete removed IDs, insert added IDs) so partial failure doesn't destroy all existing access. The diff approach (like `updateJob` already does for linked requests) is safer and doesn't require RPC.

---

## Finding 8: BUG — Four bulk deactivate functions loop with individual mutations

**Files and lines:**
- `app/actions/company-actions.ts`, `bulkDeactivateCompanies`, lines 180-228
- `app/actions/category-actions.ts`, `bulkDeactivateCategories`, lines 208-257
- `app/actions/location-actions.ts`, `bulkDeactivateLocations`, lines 173-209
- `app/actions/division-actions.ts`, `bulkDeactivateDivisions`, lines 183-217

**Severity:** LOW
**Pattern (identical in all four):**
```typescript
for (const id of ids) {
  // Check dependencies per item
  // ...
  if (totalDeps > 0) {
    blocked.push(id);
  } else {
    const { error } = await supabase
      .from('...')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      deactivated.push(id);
    }
  }
}
```

**Failure mode:** If item 3/5 fails:
- Items 1-2 are already deactivated
- Item 3 failed silently (error swallowed)
- Items 4-5 may succeed
- Response reports partial success (`deleted: 4, blocked: 0`) but one item silently failed

**Risk assessment:** LOW. These are admin settings operations (companies, categories, locations, divisions). Bulk deactivation is rare and used by admins who can verify results. The error is swallowed (item just isn't added to `deactivated` array), so the count will be wrong but no data corruption occurs. The failed items remain active, which is the safe default.

**Recommended fix (optimization, not critical):**
1. Pre-validate all items: separate into `canDeactivate[]` and `blocked[]`
2. Batch update with `.in('id', canDeactivate)` -- single atomic operation
3. Return accurate counts

This also reduces N+1 queries (currently 1-3 dependency checks per item + 1 update per item).

---

## Finding 9: BUG — `rejectCompletedWork` two-step without rollback

**File:** `app/actions/request-actions.ts`, lines 470-529
**Severity:** LOW-MEDIUM
**What happens:**
1. Updates request status to `in_progress` (line 493-498)
2. Reverts linked jobs to `in_progress` (line 514-519)

**Failure mode:** If step 1 succeeds but step 2 fails:
- Request shows `in_progress` (reverted)
- Linked jobs still show `completed`
- PIC sees job as completed but request says "needs rework"

**Current handling:** Job revert errors are logged (line 521-522) but don't throw.

**Risk assessment:** LOW-MEDIUM. The inconsistency is visible (request says in_progress, job says completed) and can be manually corrected by a lead.

**Recommended fix:** If job revert fails, either rollback the request status change or throw the error so the user knows to retry.

---

## Finding 10: BUG — `deactivateSchedule` two-step without rollback

**File:** `app/actions/schedule-actions.ts`, lines 202-253
**Severity:** LOW
**What happens:**
1. Sets schedule `is_active = false` (line 227-230)
2. Cancels open PM jobs linked to this schedule (line 237-242)

**Failure mode:** If step 1 succeeds but step 2 fails:
- Schedule is deactivated
- Open PM jobs remain active, with no schedule to regenerate from

**Current handling:** Job cancellation errors are logged (line 244-246) but don't throw.

**Risk assessment:** LOW. Orphaned PM jobs will eventually be completed or manually cancelled. The schedule deactivation (the primary intent) succeeded.

---

## Finding 11: BUG — `resumeSchedulesForAsset` loops with individual mutations

**File:** `app/actions/schedule-actions.ts`, lines 541-582
**Severity:** LOW
**What happens:**
```typescript
for (const schedule of schedulesToResume) {
  const nextDueAt = new Date(now + schedule.interval_days * 86400000).toISOString();
  const { error } = await supabase
    .from('maintenance_schedules')
    .update({ is_paused: false, ... , next_due_at: nextDueAt })
    .eq('id', schedule.id);
  if (!error) resumedCount++;
}
```

**Failure mode:** Mid-loop failure leaves some schedules resumed and others still paused. Additionally, each schedule needs a different `next_due_at` based on its `interval_days`, which is why it loops (this is a legitimate reason -- can't batch with different values).

**Risk assessment:** LOW. The loop exists because each schedule has a unique `next_due_at`. A failed resume leaves the schedule paused, which is the safe default (maintenance still paused = no missed maintenance). The function is a helper called from `changeAssetStatus`, which has its own error tolerance.

**Recommended fix:** This is acceptable as-is. The per-row update is unavoidable due to different computed values. Partial resume is safe (paused = no harm).

---

## Finding 12: INFO — `createJob` multi-step chain (no rollback needed)

**File:** `app/actions/job-actions.ts`, lines 21-190
**What happens:**
1. Insert job (line 121-125)
2. Optionally update job to `pending_approval` (line 147-151)
3. Insert `job_requests` links (line 167-169)
4. Update linked request statuses to `in_progress` (line 177-181)

**Assessment:** Steps 2-4 throw on failure, which means the action fails with an error. The job is already inserted (step 1) but steps 2-4 haven't completed. This leaves a dangling job without proper status or links.

**Risk assessment:** LOW. The job exists in `created` status which is valid. Missing links can be added via `updateJob`. Missing `pending_approval` status means the job bypasses budget approval (which could be a concern for high-cost jobs).

**Recommended fix:** Consider creating the job in a single RPC transaction or checking the threshold before insert to set the initial status correctly.

---

## Finding 13: INFO — `cancelJob` multi-step (secondary is fire-and-forget)

**File:** `app/actions/job-actions.ts`, lines 657-727
**What happens:**
1. Updates job status to `cancelled` (line 685)
2. Reverts linked requests to `triaged` (line 713-716)

**Assessment:** Request revert failure is logged but doesn't throw. Request revert uses `.in()` for a batch update, which is atomic. The main risk is network failure on step 2.

**Risk assessment:** LOW. Same pattern as Finding 9. Linked requests stuck in `in_progress` when job is cancelled is visible and manually correctable.

---

## Finding 14: COSMETIC — `acceptTransfer` rollback log message typo

**File:** `app/actions/asset-actions.ts`, line 410
**What it says:** `[rejectTransfer] Rollback failed - could not revert movement to pending:`
**What it should say:** `[acceptTransfer] Rollback failed - could not revert movement to pending:`

This is a copy-paste error in the log message prefix.

---

## Priority-Ordered Fix Recommendations

### P1 — Medium severity, should fix

| # | Finding | File | Fix |
|---|---------|------|-----|
| 5 | `createUser` metadata failure creates broken user | user-actions.ts:94-108 | Treat metadata as critical; rollback user creation if it fails |
| 6 | `updateUser` profile/metadata mismatch | user-actions.ts:135-180 | Rollback profile update if metadata fails, or return warning |
| 7 | `updateUserCompanyAccess` delete-then-insert | user-company-access-actions.ts:52-65 | Restructure as diff (delete removed, insert added) instead of delete-all-then-insert |

### P2 — Low severity, nice to fix

| # | Finding | File | Fix |
|---|---------|------|-----|
| 8 | Bulk deactivate loops (4 files) | company/category/location/division-actions.ts | Pre-validate, then batch `.in()` update |
| 9 | `rejectCompletedWork` request/job mismatch | request-actions.ts:493-519 | Rollback request if job revert fails |
| 3 | `changeAssetStatus` schedule hook failure | asset-actions.ts:212-223 | Acceptable as-is; consider admin sync utility |

### P3 — Cosmetic/no-fix-needed

| # | Finding | File | Action |
|---|---------|------|--------|
| 14 | Log message typo | asset-actions.ts:410 | Fix `[rejectTransfer]` to `[acceptTransfer]` |
| 1-2 | Transfer rollbacks | asset-actions.ts | Already fixed, no action |
| 4 | Photo deletion storage orphans | asset-actions.ts:688 | Acceptable pattern |
| 10-11 | Schedule operations | schedule-actions.ts | Acceptable patterns |
| 12-13 | Job operations | job-actions.ts | Acceptable patterns |

---

## Sources

### Primary (HIGH confidence)
- Direct source code analysis of all 15 files in `app/actions/`
- All line numbers verified against current codebase

### Confidence Assessment
- All findings: HIGH -- based on direct code reading, not inference
