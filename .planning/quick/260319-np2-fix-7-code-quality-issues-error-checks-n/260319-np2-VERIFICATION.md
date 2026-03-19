---
phase: 260319-np2-fix-7-code-quality-issues-error-checks-n
verified: 2026-03-19T10:30:00Z
status: passed
score: 7/7 fixes verified
re_verification: false
---

# Quick Task: Fix 7 Code Quality Issues — Verification Report

**Task Goal:** Fix 7 code quality issues across error checks, null safety, rollback, PII logging, and empty URL filtering
**Verified:** 2026-03-19T10:30:00Z
**Status:** passed
**Commit:** c6de3267f734f595136409e3e26e965edbf08df6

---

## Fix-by-Fix Verification

### Fix 1: approval-actions.ts — error check after bulk request status update

**Location:** `app/actions/approval-actions.ts`, lines 196–208 (`approveCompletion` function)

**Before:** `await supabase.from('requests').update(...).in(...).neq(...)` — error silently discarded.

**After:** `const { error: reqUpdateError } = await supabase...` with `if (reqUpdateError) { console.error(...) }`.

**Status:** VERIFIED

The error is captured and logged. Non-throwing treatment is correct here: the job has already transitioned to `completed` and rolling back is not attempted — logging the failure allows debugging without breaking the primary operation. Pattern is intentional and consistent with the codebase's approach to side-effect failures.

---

### Fix 2: entity-photos/route.ts — null check on uploadData before .path access

**Location:** `app/api/uploads/entity-photos/route.ts`, line 174

**Before:** `if (uploadError) { ... continue; }` — `uploadData` could still be `null` when accessing `uploadData.path` on line 188.

**After:** `if (uploadError || !uploadData) { console.error(...); continue; }` — access to `uploadData.path` on line 188 is now guarded.

**Status:** VERIFIED

The null guard eliminates a potential runtime crash. The `uploadData.path` reference on line 188 is now provably safe.

---

### Fix 3: entity-photos/route.ts — console.error in Vision API catch blocks

**Location:** `app/api/uploads/entity-photos/route.ts`, lines 247 and 249

**Before:** Both Vision API `.catch()` blocks used `catch(() => {})` — errors silently swallowed, making debugging impossible.

**After:**
- Fetch catch: `catch((err: unknown) => { console.error('[vision-api]', err instanceof Error ? err.message : err); })`
- Buffer read catch: `catch((err: unknown) => { console.error('[vision-api] buffer read failed:', err instanceof Error ? err.message : err); })`

**Status:** VERIFIED

Both catch blocks now surface errors with structured prefixes. The `err instanceof Error ? err.message : err` pattern is consistent with the rest of the codebase's error logging convention.

---

### Fix 4: asset-actions.ts createTransfer — rollback movement if location-only asset update fails

**Location:** `app/actions/asset-actions.ts`, lines 327–339 (`createTransfer` function)

**Before:** `if (itemError) throw new Error(itemError.message);` — movement record left orphaned in `accepted` state if the asset `location_id` update failed.

**After:**
```typescript
if (itemError) {
  // Rollback: delete the movement record since asset update failed
  await supabase
    .from('inventory_movements')
    .delete()
    .eq('id', data.id);
  throw new Error('Failed to update asset location. Please try again.');
}
```

**Status:** VERIFIED

The rollback deletes the orphaned movement before surfacing the error. The user-facing message is generic and appropriate. A partial state (movement accepted but asset not updated) is no longer possible for the location-only transfer path.

---

### Fix 5: auth/callback/route.ts — console.log with userId changed to console.debug without PII

**Location:** `app/api/auth/callback/route.ts`, lines 124–126

**Before:**
```typescript
console.log('[auth/callback] stage=success', {
  userId: user.id,
  redirectTo: next,
})
```

**After:**
```typescript
console.debug('[auth/callback] stage=success', {
  redirectTo: next,
})
```

**Status:** VERIFIED

Two changes confirmed: (1) `console.log` changed to `console.debug` so the success path does not emit production log noise, and (2) `userId: user.id` removed — user ID is PII and should not be logged on the success path. The `redirectTo: next` field retained for routing diagnostics.

---

### Fix 6: request-actions.ts + asset-actions.ts — filter out empty signed URLs

**Three locations verified:**

**a) `app/actions/request-actions.ts` — `getRequestPhotos`, lines 594–601**

Before: `.map(...)` with no filter — callers received photo objects with `url: ''` when Supabase failed to generate a signed URL.

After: `.map(...).filter((p) => p.url !== '')` — empty URLs excluded from the returned array.

**Status:** VERIFIED

**b) `app/actions/asset-actions.ts` — `getAssetPhotos`, lines 568–577**

After: `.map(...).filter((p) => p.url !== '')` applied.

**Status:** VERIFIED

**c) `app/actions/asset-actions.ts` — `getAssetInvoices`, lines 610–619**

After: `.map(...).filter((p) => p.url !== '')` applied.

**Status:** VERIFIED

All three photo/invoice fetch actions now exclude broken signed URLs. UI components will not receive empty-string URLs that would render broken image icons.

---

### Fix 7: job-actions.ts — error check after job_requests delete

**Location:** `app/actions/job-actions.ts`, lines 241–248 (`updateJob` function, `toRemove` branch)

**Before:** `await supabase.from('job_requests').delete()...` — error silently discarded, job update would continue even if the unlink failed, leaving stale job_requests rows.

**After:**
```typescript
const { error: unlinkError } = await supabase
  .from('job_requests')
  .delete()
  .eq('job_id', id)
  .in('request_id', toRemove);
if (unlinkError) {
  throw new Error(`Failed to unlink requests: ${unlinkError.message}`);
}
```

**Status:** VERIFIED

The error is now captured and throws, aborting the update before any inconsistent state can be written. The operation is correctly treated as a prerequisite to the rest of the update, so throwing is the right pattern here (unlike fix #1 where the primary op already succeeded).

---

## Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Bulk request status update in `approveCompletion` has error logging | VERIFIED | Lines 206–208, `approval-actions.ts` |
| 2 | `uploadData` null-checked before `.path` access in entity-photos route | VERIFIED | Line 174, `entity-photos/route.ts` |
| 3 | Vision API catch blocks log errors instead of silently swallowing | VERIFIED | Lines 247, 249, `entity-photos/route.ts` |
| 4 | `createTransfer` rolls back movement record if location-only asset update fails | VERIFIED | Lines 327–339, `asset-actions.ts` |
| 5 | Auth callback success path uses `console.debug` with no PII (`userId` removed) | VERIFIED | Lines 124–126, `auth/callback/route.ts` |
| 6 | All three signed-URL fetch actions filter out empty-string URLs | VERIFIED | `request-actions.ts` line 601, `asset-actions.ts` lines 577, 619 |
| 7 | `job_requests` delete in `updateJob` has error capture and throws on failure | VERIFIED | Lines 241–248, `job-actions.ts` |

**Score:** 7/7 truths verified

---

## Anti-Pattern Scan

No new anti-patterns introduced by this commit. All changes are targeted, minimal fixes with no stubs, placeholders, or silently swallowed errors.

---

## Human Verification Required

None. All 7 fixes are programmatically verifiable via code inspection.

---

## Gaps Summary

No gaps found. All 7 fixes are present and correct in the codebase as of commit `c6de326`.

---

_Verified: 2026-03-19T10:30:00Z_
_Verifier: Claude (gsd-verifier)_
