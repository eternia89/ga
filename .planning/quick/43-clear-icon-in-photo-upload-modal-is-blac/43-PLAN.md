---
phase: quick-43
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/media/photo-annotation.tsx
autonomous: true
requirements:
  - QUICK-43
must_haves:
  truths:
    - "The annotation modal close button is visible against its background"
    - "No redundant close/cancel controls overlap each other in the annotation dialog"
  artifacts:
    - path: "components/media/photo-annotation.tsx"
      provides: "PhotoAnnotation dialog without invisible auto-injected X button"
  key_links:
    - from: "components/media/photo-annotation.tsx"
      to: "components/ui/dialog.tsx"
      via: "showCloseButton={false} prop"
      pattern: "showCloseButton"
---

<objective>
Fix the invisible clear/close icon in the photo annotation modal.

The `PhotoAnnotation` component wraps `DialogContent` which auto-injects an `X` close button at `absolute top-4 right-4`. The button has no explicit text color — it inherits foreground (black on white). However, the canvas area from ReactSketchCanvas renders directly below with a dark/black background, and the auto-injected button visually overlaps or bleeds into that dark region, making the icon invisible. The annotation dialog already has a dedicated Cancel button in its toolbar, making the auto-injected close button redundant and conflicting.

Purpose: Remove the invisible, redundant close icon from the annotation modal.
Output: Updated `photo-annotation.tsx` with `showCloseButton={false}` on `DialogContent`.
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
  <name>Task 1: Remove redundant auto-injected close button from PhotoAnnotation dialog</name>
  <files>components/media/photo-annotation.tsx</files>
  <action>
    In `PhotoAnnotation`, change the `DialogContent` opening tag from:

    ```tsx
    <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col gap-0 p-0">
    ```

    to:

    ```tsx
    <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col gap-0 p-0" showCloseButton={false}>
    ```

    The `DialogContent` component in `components/ui/dialog.tsx` accepts a `showCloseButton` prop (default `true`) that controls whether the auto-injected `X` close button is rendered. The annotation modal already provides Cancel, Undo, and Clear controls in its toolbar — the auto-injected button is redundant and invisible against the canvas background. Do NOT add any other styling changes.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>The annotation dialog no longer renders an auto-injected X button at top-right. The Cancel button in the toolbar remains as the sole way to dismiss without saving. Build passes with no TypeScript errors.</done>
</task>

</tasks>

<verification>
Open the photo annotation modal (click the pencil annotate button on a photo thumbnail). Confirm:
- No X icon visible in the top-right corner of the dialog overlapping the header or canvas
- The Cancel button in the toolbar still dismisses the dialog
- The canvas area renders correctly without overlay icons
</verification>

<success_criteria>
- `showCloseButton={false}` added to `DialogContent` in `photo-annotation.tsx`
- Build passes cleanly
- No invisible or redundant close icon in the annotation modal
</success_criteria>

<output>
After completion, create `.planning/quick/43-clear-icon-in-photo-upload-modal-is-blac/43-SUMMARY.md`
</output>
