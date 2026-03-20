# Quick Task: Remove Auto-Dismissing setTimeout in Dialogs - Research

**Researched:** 2026-03-20
**Domain:** Dialog success flow patterns
**Confidence:** HIGH

## Summary

Two dialogs use `setTimeout` to auto-close after a successful action, violating the CLAUDE.md rule "Never auto-dismiss success/error messages with a timer." Both are straightforward removals with no side effects. The rest of the codebase already follows the correct pattern.

**Primary recommendation:** Remove the `setTimeout` blocks in both files. Keep the success feedback message visible. Let the user close the dialog manually via Cancel button, X button, or clicking outside.

## Findings

### 1. Password Change Dialog (`components/profile/password-change-dialog.tsx`)

**Lines 70-73 (the violation):**
```typescript
// Close dialog after brief delay
setTimeout(() => {
  onOpenChange(false);
}, 1500);
```

**Current success flow:**
1. `changePassword()` server action called
2. On success: set success feedback, reset form, then auto-close after 1500ms
3. The `handleOpenChange` wrapper clears feedback and resets form on close

**Fix:** Remove the `setTimeout` block (lines 70-73). After success, the user sees "Password changed successfully" in the InlineFeedback and can close the dialog manually. The form is already reset (line 69), so the dialog is in a clean state. No side effects -- this dialog has no `onSuccess` callback, no router refresh, nothing triggered by closing.

**Note:** The `handleOpenChange` function (lines 87-93) already clears feedback on close, so manual close is clean.

### 2. Request Triage Dialog (`components/requests/request-triage-dialog.tsx`)

**Lines 95-98 (the violation):**
```typescript
// Close dialog shortly after success feedback
setTimeout(() => {
  onOpenChange(false);
}, 800);
```

**Current success flow:**
1. `triageRequest()` server action called
2. On success: set success feedback, call `onSuccess()`, then auto-close after 800ms
3. `onSuccess()` is called BEFORE the timeout (line 94), so it already fires regardless

**Fix:** Remove the `setTimeout` block (lines 95-98). The `onSuccess()` callback (which triggers data refresh in the parent) is already called synchronously on line 94 -- it does NOT depend on the dialog closing. The user sees "Request triaged successfully" and can close manually.

**Note:** The `useEffect` on lines 69-79 resets form and clears feedback when `open` changes. This means when the user manually closes, everything cleans up properly.

### 3. Other setTimeout Usages in Components (NOT violations)

Searched all `setTimeout` in `components/`. Found these other usages -- none are violations:

| File | Line | What it does | Violation? |
|------|------|-------------|------------|
| `asset-filters.tsx:36` | Debounce search input | No -- search debounce, not feedback |
| `job-filters.tsx:46` | Debounce search input | No -- search debounce, not feedback |
| `request-filters.tsx:50` | Debounce search input | No -- search debounce, not feedback |
| `pm-checklist-item.tsx:46` | Clear "savedAt" timestamp after 2s | No -- clears a subtle UI indicator, not a feedback message |
| `pm-checklist-item.tsx:66` | Debounce save | No -- input debounce |
| `request-view-modal.tsx:429` | Open feedback dialog after acceptance dialog closes | No -- opens a new dialog, not dismissing feedback |

**Only the 2 identified dialogs are violations.**

### 4. Established Pattern in Other Dialogs

All other dialogs in the codebase close immediately on success (no setTimeout), calling `onOpenChange(false)` synchronously after `onSuccess()`:

- `job-cancel-dialog.tsx:47-48` -- `onSuccess(); onOpenChange(false);`
- `request-reject-dialog.tsx:71-72` -- `onSuccess(); onOpenChange(false);`
- `request-cancel-dialog.tsx:47-48` -- `onSuccess(); onOpenChange(false);`
- `entity-form-dialog.tsx:81-82` -- `form.reset(); onOpenChange(false);`
- `delete-confirm-dialog.tsx:48-49` -- immediate close after confirm

These dialogs close immediately without showing success feedback at all. The two violating dialogs are unique in that they show feedback AND auto-close -- the fix should keep the feedback visible and NOT auto-close.

### 5. Recommended Post-Fix Behavior

After the fix, both dialogs should:
1. Show success feedback via InlineFeedback (already implemented)
2. Keep the dialog open so the user can read the message
3. Let the user close via: Cancel/Close button, dialog X button, or clicking outside
4. Clean up feedback state on close (already handled by existing code in both dialogs)

For the **triage dialog**, consider changing the "Complete Triage" submit button to show "Close" or disabling it after success, since re-submitting would be redundant. However, this is optional polish -- the core fix is just removing the setTimeout.

## Implementation Plan

### File 1: `components/profile/password-change-dialog.tsx`
- Delete lines 70-73 (the `setTimeout` block and its comment on line 70)

### File 2: `components/requests/request-triage-dialog.tsx`
- Delete lines 95-98 (the `setTimeout` block and its comment on line 95)

Both changes are pure deletions with no side effects.

## Sources

### Primary (HIGH confidence)
- Direct code inspection of both dialog files
- Grep of all `setTimeout` usages across `components/`
- Grep of all `onOpenChange(false)` patterns across dialog files
- CLAUDE.md rule: "Never auto-dismiss success/error messages with a timer"
