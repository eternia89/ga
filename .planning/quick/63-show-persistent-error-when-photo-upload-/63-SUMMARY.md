---
phase: quick-63
plan: 01
subsystem: assets
tags: [bug-fix, photo-upload, feedback, ux]
dependency_graph:
  requires: []
  provides: [persistent-upload-error-feedback]
  affects: [asset-transfer-dialog]
tech_stack:
  added: []
  patterns: [InlineFeedback-error, two-step-upload-error-handling]
key_files:
  created: []
  modified:
    - components/assets/asset-transfer-dialog.tsx
decisions:
  - "Parse server error body from upload response for specific error messages; fall back to generic message on parse failure"
  - "Dialog stays open on upload failure so user can retry — do not call onOpenChange(false)"
metrics:
  duration: "3 min"
  completed: "2026-03-13"
---

# Quick Task 63: Show Persistent Error When Photo Upload Fails — Summary

**One-liner:** Replaced silent close on upload failure with persistent InlineFeedback error that keeps the AssetTransferDialog open.

## What Was Done

Fixed the `if (!uploadRes.ok)` branch in `handleSubmit` of `AssetTransferDialog`. Previously this block silently closed the dialog and called `onSuccess()` + `router.refresh()`, leaving the user with no indication their condition photos failed to save. This violated the CLAUDE.md convention: "Feedback messages must be persistent. Never auto-dismiss."

### Change

**Before (silent close):**
```ts
if (!uploadRes.ok) {
  // Transfer created but photo upload failed — still close and refresh
  onOpenChange(false);
  onSuccess();
  router.refresh();
  return;
}
```

**After (persistent error):**
```ts
if (!uploadRes.ok) {
  let errorMessage = 'Upload failed. Transfer was created but condition photos could not be saved. Please try again or contact support.';
  try {
    const errorBody = await uploadRes.json();
    if (errorBody?.error) errorMessage = `Upload failed: ${errorBody.error}`;
  } catch {
    // ignore parse errors, keep default message
  }
  setFeedback({ type: 'error', message: errorMessage });
  return;
  // Do NOT call onOpenChange(false) or onSuccess() — dialog stays open so user can retry
}
```

## Verification

- `npm run build` passed with no TypeScript errors
- `if (!uploadRes.ok)` branch calls `setFeedback` with type "error" and does NOT call `onOpenChange(false)`
- Success path (lines 161-163) unchanged: `onOpenChange(false)`, `onSuccess()`, `router.refresh()` all intact
- `InlineFeedback` was already rendered in JSX wired to `feedback` state with `onDismiss` callback
- `finally` block sets `isSubmitting(false)` — submit button re-enables after failure so user can retry

## Commits

| Hash | Description |
|------|-------------|
| 511de7c | fix(quick-63): show persistent InlineFeedback on photo upload failure in AssetTransferDialog |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- File modified: `/Users/melfice/code/ga/components/assets/asset-transfer-dialog.tsx` — FOUND
- Commit 511de7c — FOUND
