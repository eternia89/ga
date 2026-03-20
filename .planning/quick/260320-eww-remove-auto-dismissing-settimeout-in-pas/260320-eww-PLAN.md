---
phase: quick
plan: 260320-eww
type: execute
wave: 1
depends_on: []
files_modified:
  - components/profile/password-change-dialog.tsx
  - components/requests/request-triage-dialog.tsx
autonomous: true
requirements: [CLAUDE-MD-FEEDBACK-RULE]

must_haves:
  truths:
    - "Password change success message stays visible until user manually closes the dialog"
    - "Triage success message stays visible until user manually closes the dialog"
    - "No setTimeout calls auto-close either dialog"
  artifacts:
    - path: "components/profile/password-change-dialog.tsx"
      provides: "Password change dialog without auto-dismiss"
      contains: "setFeedback.*success.*Password changed"
    - path: "components/requests/request-triage-dialog.tsx"
      provides: "Request triage dialog without auto-dismiss"
      contains: "setFeedback.*success.*Request triaged"
  key_links:
    - from: "components/profile/password-change-dialog.tsx"
      to: "InlineFeedback"
      via: "success feedback rendered persistently"
      pattern: "InlineFeedback.*onDismiss"
    - from: "components/requests/request-triage-dialog.tsx"
      to: "InlineFeedback"
      via: "success feedback rendered persistently"
      pattern: "InlineFeedback.*onDismiss"
---

<objective>
Remove auto-dismissing setTimeout in two dialogs that violate the CLAUDE.md rule: "Never auto-dismiss success/error messages with a timer."

Purpose: Both dialogs auto-close after a successful action (1500ms and 800ms respectively), preventing users from reading the success message. The fix lets users close manually.
Output: Two patched dialog components with no auto-close behavior.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/profile/password-change-dialog.tsx
@components/requests/request-triage-dialog.tsx
@.planning/quick/260320-eww-remove-auto-dismissing-settimeout-in-pas/260320-eww-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove auto-dismiss setTimeout from both dialogs</name>
  <files>components/profile/password-change-dialog.tsx, components/requests/request-triage-dialog.tsx</files>
  <action>
**File 1: `components/profile/password-change-dialog.tsx`**
Delete lines 70-73 (the comment and setTimeout block):
```
// Close dialog after brief delay
setTimeout(() => {
  onOpenChange(false);
}, 1500);
```
After the fix, the success branch (lines 67-69) should end with `form.reset();` and nothing else. The `handleOpenChange` wrapper (lines 87-93) already clears feedback and resets form on manual close, so no additional cleanup is needed.

**File 2: `components/requests/request-triage-dialog.tsx`**
Delete lines 95-98 (the comment and setTimeout block):
```
// Close dialog shortly after success feedback
setTimeout(() => {
  onOpenChange(false);
}, 800);
```
After the fix, the success branch should call `onSuccess()` (line 94) and then fall through to `finally`. The `onSuccess()` callback fires synchronously before any close -- it does NOT depend on the dialog closing. The `useEffect` on lines 69-79 already resets form and clears feedback when `open` changes (i.e., when user manually closes).

Both changes are pure deletions with no side effects.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && ! grep -n 'setTimeout' components/profile/password-change-dialog.tsx && ! grep -n 'setTimeout' components/requests/request-triage-dialog.tsx && echo "PASS: No setTimeout found in either file" || echo "FAIL: setTimeout still present"</automated>
  </verify>
  <done>Neither dialog contains setTimeout. Success feedback is shown via InlineFeedback and persists until user manually closes the dialog via Cancel, X, or clicking outside.</done>
</task>

<task type="auto">
  <name>Task 2: Build verification</name>
  <files></files>
  <action>
Run `npm run build` to confirm no TypeScript or compilation errors were introduced by the deletions. Both files should compile cleanly since we only removed code with no references from other lines.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Build succeeds with exit code 0. No TypeScript errors in either modified file.</done>
</task>

</tasks>

<verification>
1. `grep -rn 'setTimeout' components/profile/password-change-dialog.tsx` returns nothing
2. `grep -rn 'setTimeout' components/requests/request-triage-dialog.tsx` returns nothing
3. `npm run build` succeeds
4. Both files still contain `InlineFeedback` with `onDismiss` (feedback remains user-dismissable)
</verification>

<success_criteria>
- Zero setTimeout calls in either dialog file
- Build passes cleanly
- Success feedback messages remain visible until user manually closes the dialog
</success_criteria>

<output>
After completion, create `.planning/quick/260320-eww-remove-auto-dismissing-settimeout-in-pas/260320-eww-SUMMARY.md`
</output>
