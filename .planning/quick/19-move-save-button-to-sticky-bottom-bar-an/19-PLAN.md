---
phase: quick-19
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-edit-form.tsx
  - components/assets/asset-view-modal.tsx
autonomous: true
requirements: [QUICK-19]

must_haves:
  truths:
    - "Save Changes button is visible in the sticky bottom bar without scrolling"
    - "No informational text (display_id / name) appears in the asset modal bottom bar"
    - "Clicking Save Changes in the bottom bar submits the edit form and shows loading state"
    - "Bottom bar shows Save button only when user has edit permission and asset is not sold/disposed"
  artifacts:
    - path: "components/assets/asset-edit-form.tsx"
      provides: "Form with id attribute, no internal Save button, exposes isSubmitting"
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Bottom bar with Save button, no info text"
  key_links:
    - from: "components/assets/asset-view-modal.tsx"
      to: "components/assets/asset-edit-form.tsx"
      via: "form='asset-edit-form' attribute on external Save button"
      pattern: "form=\"asset-edit-form\""
---

<objective>
Move the Save Changes button from inside the scrollable edit form to the sticky bottom bar in the asset view modal, and remove the informational text from the bottom bar.

Purpose: Save button is currently hidden when user scrolls — placing it in the always-visible sticky bottom bar ensures it is always accessible. Info text in the bottom bar duplicates the header.
Output: Updated asset-edit-form.tsx and asset-view-modal.tsx
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/quick/19-move-save-button-to-sticky-bottom-bar-an/19-CONTEXT.md

<interfaces>
From components/assets/asset-edit-form.tsx:
- AssetEditForm component renders a `<form>` with `onSubmit={form.handleSubmit(onSubmit)}`
- Internal `isSubmitting` state controls button disabled state
- Save button at bottom: `<Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>`
- InlineFeedback for save operation feedback rendered inside form

From components/assets/asset-view-modal.tsx:
- Sticky bottom bar at line 501-533: contains info text (display_id + name) on left, action buttons on right
- `actionFeedback` state for status/transfer feedback shown in bottom bar
- `canEdit` logic: `['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) && asset.status !== 'sold_disposed' && !pendingTransfer`
- AssetDetailInfo rendered inside scrollable left panel — when canEdit, it renders AssetEditForm

From components/assets/asset-detail-info.tsx:
- `canEdit = ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) && asset.status !== 'sold_disposed'`
- When canEdit is true, renders AssetEditForm directly (detail page IS edit page)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add form id, expose isSubmitting, remove Save button from AssetEditForm</name>
  <files>components/assets/asset-edit-form.tsx</files>
  <action>
In asset-edit-form.tsx:

1. Add an optional `onSubmittingChange?: (submitting: boolean) => void` prop to AssetEditFormProps
2. Add `id="asset-edit-form"` to the `<form>` element (line 236)
3. In the `onSubmit` function, call `onSubmittingChange?.(true)` right after `setIsSubmitting(true)` and call `onSubmittingChange?.(false)` in the `finally` block alongside `setIsSubmitting(false)`
4. Remove the Save button at the bottom of the form (line 532-535: `<Button type="submit" ...>Save Changes</Button>`)
5. Keep the InlineFeedback for save operations inside the form — it is specific to form save errors/success
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Form has id="asset-edit-form", exposes isSubmitting via callback, no Save button inside form body</done>
</task>

<task type="auto">
  <name>Task 2: Move Save to bottom bar, remove info text in asset-view-modal</name>
  <files>components/assets/asset-view-modal.tsx, components/assets/asset-detail-info.tsx</files>
  <action>
In asset-view-modal.tsx:

1. Add `isEditSubmitting` state: `const [isEditSubmitting, setIsEditSubmitting] = useState(false);`

2. Determine canEdit in the modal scope (same logic as asset-detail-info.tsx):
   `const canEdit = asset && ['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole) && asset.status !== 'sold_disposed';`

3. In the sticky bottom bar (line 501-533), replace the left side entirely:
   - Remove the conditional that shows either `actionFeedback` InlineFeedback or the info text span
   - Replace with ONLY `actionFeedback` InlineFeedback (no fallback info text):
     ```
     {actionFeedback && (
       <InlineFeedback type={actionFeedback.type} message={actionFeedback.message} onDismiss={() => setActionFeedback(null)} />
     )}
     ```

4. Add Save Changes button to the right side of the bottom bar (BEFORE the Change Status button), conditionally shown when `canEdit && !pendingTransfer`:
   ```
   {canEdit && !pendingTransfer && (
     <Button type="submit" form="asset-edit-form" size="sm" disabled={isEditSubmitting}>
       {isEditSubmitting ? 'Saving...' : 'Save Changes'}
     </Button>
   )}
   ```

5. Pass `onSubmittingChange={setIsEditSubmitting}` prop to AssetEditForm. This is rendered inside AssetDetailInfo, so update the prop chain:

In asset-detail-info.tsx:
- Add `onSubmittingChange?: (submitting: boolean) => void` to AssetDetailInfoProps
- Pass it through to `<AssetEditForm ... onSubmittingChange={onSubmittingChange} />`

In asset-view-modal.tsx:
- Pass `onSubmittingChange={setIsEditSubmitting}` to `<AssetDetailInfo ... />`
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30 && npm run lint 2>&1 | tail -5</automated>
  </verify>
  <done>Save Changes button appears in sticky bottom bar for editable assets. No informational text in bottom bar. Button shows loading state during form submission. TypeScript and lint pass.</done>
</task>

</tasks>

<verification>
- Open asset modal as ga_staff/ga_lead/admin user with an active asset — Save Changes button visible in sticky bottom bar
- Scroll down in the form — Save Changes button remains visible (sticky)
- No `display_id · name` text in the bottom bar
- Click Save Changes — button shows "Saving..." and form submits
- Open asset modal as general_user — no Save Changes button in bottom bar
- Open sold/disposed asset — no Save Changes button in bottom bar
- Action feedback (from status change/transfer) still appears in the bottom bar left side
</verification>

<success_criteria>
Save Changes button in the sticky bottom bar, no info text in bottom bar, form submission works via form attribute connection, TypeScript and lint pass clean.
</success_criteria>

<output>
After completion, create `.planning/quick/19-move-save-button-to-sticky-bottom-bar-an/19-SUMMARY.md`
</output>
