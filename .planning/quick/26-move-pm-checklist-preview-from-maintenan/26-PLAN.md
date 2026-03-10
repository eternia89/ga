---
phase: quick-26
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/maintenance/template-detail.tsx
  - components/maintenance/pm-checklist-preview.tsx
  - components/maintenance/schedule-detail.tsx
  - components/maintenance/schedule-view-modal.tsx
  - app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx
autonomous: true
requirements: [QUICK-26]

must_haves:
  truths:
    - "Template detail page has a Preview Form button that opens a modal with interactive checklist preview"
    - "Preview modal shows placeholder data for schedule-specific fields (asset name, due date, assigned user)"
    - "Schedule detail page no longer has a Preview Form button"
    - "Schedule view modal no longer has a Preview Form button"
    - "The /maintenance/schedules/[id]/preview route no longer exists"
  artifacts:
    - path: "components/maintenance/template-detail.tsx"
      provides: "Preview Form button + Dialog wrapping PMChecklistPreview"
      contains: "Preview Form"
    - path: "components/maintenance/schedule-detail.tsx"
      provides: "Schedule detail without preview button"
    - path: "components/maintenance/schedule-view-modal.tsx"
      provides: "Schedule modal without preview button"
  key_links:
    - from: "components/maintenance/template-detail.tsx"
      to: "components/maintenance/pm-checklist-preview.tsx"
      via: "Dialog rendering PMChecklistPreview with placeholder props"
      pattern: "PMChecklistPreview"
---

<objective>
Move the PM checklist preview from maintenance schedules to maintenance templates. Add a "Preview Form" button on the template detail page that opens a large modal dialog showing the interactive checklist preview with placeholder data. Remove all preview references from schedules (detail page, view modal, and preview page route).

Purpose: The checklist template is defined on the template, so preview belongs there -- not on individual schedules.
Output: Template detail page with preview modal; schedule pages cleaned of preview references; preview route deleted.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/maintenance/template-detail.tsx
@components/maintenance/pm-checklist-preview.tsx
@components/maintenance/schedule-detail.tsx
@components/maintenance/schedule-view-modal.tsx
@app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Preview Form modal to template detail page</name>
  <files>components/maintenance/template-detail.tsx, components/maintenance/pm-checklist-preview.tsx</files>
  <action>
In `template-detail.tsx`:

1. Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog` and `PMChecklistPreview` from `./pm-checklist-preview`.
2. Add `previewOpen` boolean state (default false).
3. Add a "Preview Form" button in the action buttons area (next to Deactivate/Reactivate). Show it when `checklist.length > 0` (use the watched `checklist` in edit mode, or `template.checklist` in read-only mode). Place it before the deactivate/reactivate button. Use `variant="outline" size="sm"`.
4. Add a Dialog controlled by `previewOpen` / `setPreviewOpen`. Use a large dialog: add className `max-w-3xl max-h-[85vh] overflow-y-auto` on DialogContent.
5. Inside the dialog, render `<PMChecklistPreview>` with placeholder props:
   - `templateName={template.name}`
   - `checklist={checklist}` (the watched form value in edit mode, `template.checklist` in read-only mode)
   - `assetName="Asset Name"` (placeholder)
   - `assetDisplayId="AST-XXXXX"` (placeholder)
   - `nextDueAt={null}` (shows "Not scheduled" placeholder)
   - `assignedUserName="Assigned User"` (placeholder)
6. The Preview Form button should be visible to ALL users (not gated behind `canManage`) since it's read-only preview. Place it outside the `canManage` conditional, in the info bar area next to the item count / created date, or as a standalone button. Actually, keep it simple: add it in the action buttons div but outside the `canManage` gate. Create a separate flex group if needed, or restructure the buttons area so Preview Form is always visible but Deactivate/Reactivate is canManage-gated.

In `pm-checklist-preview.tsx`:
- No changes needed. The component already accepts placeholder-compatible props.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Template detail page shows "Preview Form" button. Clicking opens a large modal with interactive checklist preview using placeholder asset/schedule data. The preview shows the current checklist items (reflecting any unsaved edits in edit mode).</done>
</task>

<task type="auto">
  <name>Task 2: Remove preview from schedules and delete preview route</name>
  <files>components/maintenance/schedule-detail.tsx, components/maintenance/schedule-view-modal.tsx, app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx</files>
  <action>
In `schedule-detail.tsx` (around lines 145-153):
- Remove the entire conditional block that renders the "Preview Form" Link+Button:
  ```
  {schedule.template?.checklist && schedule.template.checklist.length > 0 && (
    <Link href={`/maintenance/schedules/${schedule.id}/preview`}>
      <Button type="button" variant="outline" size="sm">
        Preview Form
      </Button>
    </Link>
  )}
  ```
- Also remove the `Link` import from `next/link` if it's no longer used elsewhere in the file. Check before removing.

In `schedule-view-modal.tsx` (around lines 393-404):
- Remove the entire conditional block that renders the "Preview Form" Button with router.push:
  ```
  {schedule.template?.checklist && schedule.template.checklist.length > 0 && (
    <Button variant="outline" size="sm" onClick={() => { router.push(...); onOpenChange(false); }}>
      Preview Form
    </Button>
  )}
  ```

Delete the preview page route entirely:
- Delete the file `app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx`

After deletion, check if `PMChecklistPreview` is still imported anywhere besides `template-detail.tsx`. If the schedule preview page was the only consumer, the import is now only in template-detail.tsx (which is correct).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30 && test ! -f app/\(dashboard\)/maintenance/schedules/\[id\]/preview/page.tsx && echo "Preview route deleted"</automated>
  </verify>
  <done>No "Preview Form" button on schedule detail page or schedule view modal. The /maintenance/schedules/[id]/preview route no longer exists. TypeScript compiles cleanly.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. Preview route file deleted: `app/(dashboard)/maintenance/schedules/[id]/preview/page.tsx` does not exist
3. No remaining references to schedule preview route in codebase (grep for `/preview` in maintenance components)
4. `npm run build` succeeds (no broken imports or routes)
</verification>

<success_criteria>
- Template detail page shows "Preview Form" button that opens modal with interactive checklist using placeholder data
- Schedule detail page and schedule view modal have no preview button
- /maintenance/schedules/[id]/preview route is deleted
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/26-move-pm-checklist-preview-from-maintenan/26-SUMMARY.md`
</output>
