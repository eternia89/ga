---
phase: quick-63
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-transfer-dialog.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "When photo upload fails after a transfer is created, the dialog stays open"
    - "A persistent error message is shown (InlineFeedback, type=error) describing the upload failure"
    - "The user can dismiss the error message with the X button"
    - "The dialog does NOT auto-close on photo upload failure"
    - "On photo upload success, the dialog still closes and refreshes as before"
  artifacts:
    - path: components/assets/asset-transfer-dialog.tsx
      provides: "Fixed upload failure path — shows InlineFeedback instead of silently closing"
      contains: "Upload failed. Transfer was created"
  key_links:
    - from: components/assets/asset-transfer-dialog.tsx
      to: InlineFeedback component
      via: "setFeedback({ type: 'error', message }) on !uploadRes.ok"
      pattern: "setFeedback.*error.*upload"
---

<objective>
Fix the silent close on photo upload failure in AssetTransferDialog to comply with the persistent-feedback convention in CLAUDE.md.

Purpose: When the `/api/uploads/asset-photos` call returns a non-OK response, the dialog currently calls `onOpenChange(false)` and refreshes without any feedback. Users have no idea if their photos were saved. This contradicts CLAUDE.md: "Feedback messages must be persistent. Never auto-dismiss success/error messages."

Output: `components/assets/asset-transfer-dialog.tsx` updated so upload failures show a persistent InlineFeedback error and keep the dialog open.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Show persistent error on photo upload failure</name>
  <files>components/assets/asset-transfer-dialog.tsx</files>
  <action>
In `handleSubmit`, locate the `if (!uploadRes.ok)` block at lines 147-153. Replace the silent-close behavior with an error feedback that keeps the dialog open:

CURRENT (lines 147-153):
```ts
if (!uploadRes.ok) {
  // Transfer created but photo upload failed — still close and refresh
  onOpenChange(false);
  onSuccess();
  router.refresh();
  return;
}
```

REPLACE WITH:
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

No other changes needed. The `InlineFeedback` component is already rendered in the JSX at lines 303-309 and is wired to `feedback` state. The `finally` block correctly sets `isSubmitting(false)` so the submit button re-enables.
  </action>
  <verify>
1. `npm run build` completes with no TypeScript errors.
2. Manually: open asset transfer dialog, select a receiver and photo, simulate upload failure by temporarily blocking the fetch (or inspecting the code path). Alternatively review the diff: the `if (!uploadRes.ok)` branch must NOT call `onOpenChange(false)` and MUST call `setFeedback({ type: 'error', ... })`.
3. The success path (upload ok) still calls `onOpenChange(false)`, `onSuccess()`, and `router.refresh()` — verify these remain intact at lines 156-158.
  </verify>
  <done>
- `if (!uploadRes.ok)` branch calls `setFeedback` with type "error" and does NOT call `onOpenChange(false)`
- Dialog remains open when upload fails so user sees the error message
- `InlineFeedback` error is dismissible via the X button (already wired via `onDismiss`)
- Success path is unchanged
- `npm run build` passes
  </done>
</task>

</tasks>

<verification>
- `npm run build` — no TypeScript/lint errors
- Diff confirms: `if (!uploadRes.ok)` branch contains `setFeedback(...)` and no `onOpenChange(false)` call
- Diff confirms: success path still has `onOpenChange(false)`, `onSuccess()`, `router.refresh()`
</verification>

<success_criteria>
Photo upload failure in AssetTransferDialog shows a persistent InlineFeedback error message and leaves the dialog open. Silent close on upload failure is eliminated.
</success_criteria>

<output>
After completion, create `.planning/quick/63-show-persistent-error-when-photo-upload-/63-SUMMARY.md`
</output>
