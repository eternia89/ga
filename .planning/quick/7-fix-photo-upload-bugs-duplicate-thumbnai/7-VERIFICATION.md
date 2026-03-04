---
phase: quick-7
verified: 2026-03-04T11:20:00Z
status: human_needed
score: 3/3 must-haves verified
human_verification:
  - test: "Upload multiple photos in request edit form"
    expected: "Each uploaded photo appears exactly once as a thumbnail — no duplicates"
    why_human: "Controlled mode logic (useMemo + value prop) eliminates duplicates in theory, but duplicate-prevention only manifests in the browser with real File objects and state updates"
  - test: "Inspect remove (X) button on photo thumbnails"
    expected: "Icon is clearly white against the red (bg-destructive) background — visible and distinct"
    why_human: "Color rendering and visual contrast require visual inspection in a browser"
  - test: "Delete an existing photo from a request in submitted status"
    expected: "Photo is removed successfully with no error message (no RLS policy violation)"
    why_human: "RLS bypass requires a live Supabase connection — cannot be verified statically"
---

# Quick Task 7: Fix Photo Upload Bugs — Verification Report

**Task Goal:** Fix photo upload bugs: duplicate thumbnail, black clear icon, RLS delete error
**Verified:** 2026-03-04T11:20:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Uploading photos shows each thumbnail exactly once, no duplicates | VERIFIED | `isControlled` flag derives previews via `useMemo` from `value` prop; `request-edit-form.tsx` passes `value={newFiles}` and `onChange={setNewFiles}` (lines 216-217); internal `setPreviews` is no-op in controlled mode (line 73-74) |
| 2 | Clear/remove button icon on photo thumbnails is white, visible against red bg-destructive background | VERIFIED | Both remove buttons in `photo-upload.tsx` use `className="... bg-destructive text-white ..."` (lines 201, 224); `text-destructive-foreground` is absent from both modified files |
| 3 | Deleting a photo attachment from a request succeeds without RLS error | VERIFIED | `deleteMediaAttachment` in `request-actions.ts` imports `createAdminClient` (line 9), creates `adminSupabase = createAdminClient()` (line 317), and performs the soft-delete UPDATE via `adminSupabase` (lines 318-321) while keeping `ctx.supabase` for authorization queries (lines 287-314) |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `components/media/photo-upload.tsx` | Controlled photo upload component without internal preview duplication | VERIFIED | File exists (346 lines), substantive implementation: controlled mode via `value?` prop + `useMemo` + `useEffect` cleanup, uncontrolled fallback preserved, `text-white` on both remove buttons, stable keys using `file.name-file.size-file.lastModified` |
| `app/actions/request-actions.ts` | deleteMediaAttachment using admin client to bypass RLS WITH CHECK | VERIFIED | File exists (513 lines), `createAdminClient` imported at line 9, used at line 317 specifically for the soft-delete UPDATE, authorization queries retain `ctx.supabase` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/media/photo-upload.tsx` | `components/requests/request-edit-form.tsx` | `onChange` callback syncs files to parent | WIRED | `onChange={setNewFiles}` at line 216, `value={newFiles}` at line 217 — both present in JSX. `setNewFiles` is `useState` setter declared at line 47 |
| `app/actions/request-actions.ts` | `lib/supabase/admin.ts` | `createAdminClient` for soft-delete | WIRED | Import at line 9: `import { createAdminClient } from '@/lib/supabase/admin'`; used at line 317 inside `deleteMediaAttachment` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| BUG-PHOTO-DUPLICATE | 7-PLAN.md | Duplicate thumbnails in photo upload | SATISFIED | Controlled mode via `value` prop eliminates internal/parent state desync |
| BUG-PHOTO-ICON | 7-PLAN.md | Black clear/remove icon on photo thumbnails | SATISFIED | `text-white` on lines 201 and 224 of `photo-upload.tsx` |
| BUG-PHOTO-DELETE-RLS | 7-PLAN.md | RLS error when deleting photo attachment | SATISFIED | Admin client used for soft-delete UPDATE at lines 317-321 of `request-actions.ts` |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/requests/request-edit-form.tsx` | 148, 172, 213 | `placeholder` HTML attribute / comment | Info | False positive — HTML placeholder attributes and a JSX comment containing the word "placeholder", not stub code |

No stub implementations, no TODO/FIXME markers, no empty handlers, no orphaned artifacts found in modified files.

### TypeScript Compilation

Running `npx tsc --noEmit` produces exactly 1 error:

```
e2e/tests/phase-06-inventory/asset-crud.spec.ts(107,24): error TS2352
```

This error is in an **e2e test file pre-existing before this task** and is unrelated to the changes made in quick-7. The three files modified by this task (`components/media/photo-upload.tsx`, `components/requests/request-edit-form.tsx`, `app/actions/request-actions.ts`) compile without errors.

### Commit Verification

Both task commits exist in git history:
- `8d3429d` — fix(quick-7): fix duplicate thumbnails and black remove icon in photo upload
- `96f6330` — fix(quick-7): use admin client for media attachment soft-delete to bypass RLS

### Human Verification Required

#### 1. Duplicate Thumbnail Prevention

**Test:** Open a request in submitted status, go to edit, and upload 2-3 photos at once.
**Expected:** Each photo appears as exactly one thumbnail in the upload area — no doubled or tripled previews.
**Why human:** The controlled mode mechanism works by deriving previews from the `value` prop via `useMemo`. The fix is correct in code, but duplicate prevention only manifests with real browser File objects, React state update timing, and actual component lifecycle — not verifiable statically.

#### 2. White Remove Icon Visibility

**Test:** With at least one photo thumbnail visible (existing or newly uploaded), inspect the X/remove button visually.
**Expected:** The X icon appears white against the red circular background — clearly visible and distinguishable.
**Why human:** Color rendering and visual contrast require visual inspection in a real browser. The `text-white` class is confirmed in the source, but rendering depends on CSS cascade, browser, and theme.

#### 3. RLS-Free Photo Deletion

**Test:** On a request in submitted status with existing photo attachments, click the X button on an existing photo.
**Expected:** Photo disappears from the list immediately with no error toast or feedback message indicating failure. No RLS policy violation error appears.
**Why human:** The RLS bypass using the admin (service role) client requires a live Supabase connection. The code path is correct but runtime behavior — including env vars, RLS policy configuration, and network calls — cannot be verified statically.

### Gaps Summary

No gaps. All three bug fixes are implemented correctly:

1. **Duplicate thumbnails** — PhotoUpload now accepts an optional `value?: File[]` prop. When provided, `isControlled = true` and `previews` are derived from `useMemo` rather than internal state. `request-edit-form.tsx` passes `value={newFiles}` and `onChange={setNewFiles}`, making the component fully controlled and preventing internal/parent state desync.

2. **Black clear icon** — Both remove buttons (existing photos at line 201, new previews at line 224) now use `text-white` instead of the undefined `text-destructive-foreground` CSS variable. This matches the pattern in `request-edit-form.tsx`.

3. **RLS delete error** — `deleteMediaAttachment` now uses `createAdminClient()` only for the final soft-delete UPDATE, while retaining the authenticated `ctx.supabase` for the two authorization SELECT queries. This is the same trust model as `deleteAssetPhotos` in `asset-actions.ts`.

Automated verification passed. Only runtime/visual confirmation remains (human verification items above).

---
_Verified: 2026-03-04T11:20:00Z_
_Verifier: Claude (gsd-verifier)_
