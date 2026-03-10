---
phase: quick
plan: 35
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-edit-form.tsx
  - components/assets/asset-detail-info.tsx
  - components/assets/asset-detail-client.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Asset detail page shows a sticky bottom bar with Save Changes button only when the form has unsaved changes"
    - "Asset detail page does NOT show a Save Changes button inline inside the form"
    - "The sticky bar matches the exact pattern used on request, job, template, and schedule detail pages"
  artifacts:
    - path: "components/assets/asset-edit-form.tsx"
      provides: "AssetEditForm with formId and onDirtyChange props"
      contains: "onDirtyChange"
    - path: "components/assets/asset-detail-info.tsx"
      provides: "AssetDetailInfo forwarding formId and onDirtyChange"
      contains: "onDirtyChange"
    - path: "components/assets/asset-detail-client.tsx"
      provides: "Sticky bottom bar rendering on dirty state"
      contains: "fixed bottom-0"
  key_links:
    - from: "components/assets/asset-detail-client.tsx"
      to: "components/assets/asset-detail-info.tsx"
      via: "formId, onDirtyChange, onSubmittingChange props"
      pattern: "onDirtyChange"
    - from: "components/assets/asset-detail-info.tsx"
      to: "components/assets/asset-edit-form.tsx"
      via: "formId, onDirtyChange, onSubmittingChange props"
      pattern: "onDirtyChange"
---

<objective>
Add a sticky bottom bar with Save Changes button to the asset detail page, matching the consistent pattern already present on request, job, template, and schedule detail pages.

Purpose: Consistency — all domain entity detail pages should use the sticky save bar pattern instead of inline or missing save buttons.
Output: Asset detail page dirty-state detection + sticky bar rendering.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

## Existing sticky bar pattern (copy this exactly)

All four existing detail pages use this structure in the parent client component:

```tsx
// State in parent
const [isDirty, setIsDirty] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const FORM_ID = 'asset-edit-form'; // matches id="asset-edit-form" in AssetEditForm

// Props passed to child form component
formId={FORM_ID}
onDirtyChange={setIsDirty}
onSubmittingChange={setIsSubmitting}

// Sticky bar rendered after the grid (inside the fragment, not inside the grid div)
{isDirty && (
  <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
    <div className="mx-auto max-w-[1300px] px-6 py-3 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">Unsaved changes</p>
      <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  </div>
)}
```

## Current gap

`AssetEditForm` (`components/assets/asset-edit-form.tsx`):
- Has `onSubmittingChange` prop already wired
- Does NOT have `formId` or `onDirtyChange` props
- Has `id="asset-edit-form"` hardcoded on the `<form>` element
- No submit button in the form body

`AssetDetailInfo` (`components/assets/asset-detail-info.tsx`):
- Accepts `onSubmittingChange` and forwards it to `AssetEditForm`
- Does NOT have `formId` or `onDirtyChange` props

`AssetDetailClient` (`components/assets/asset-detail-client.tsx`):
- Does NOT have `isDirty` or `isSubmitting` state
- Does NOT pass `formId`/`onDirtyChange`/`onSubmittingChange` to `AssetDetailInfo`
- No sticky bar rendered
- `AssetDetailInfo` call at line ~144 only passes `onEditSuccess` and no form state

## How isDirty works in AssetEditForm (pattern from job-detail-info.tsx)

The form component must:
1. Watch form dirty state: `const formIsDirty = form.formState.isDirty`
2. Use `useEffect` to call `onDirtyChange?.(formIsDirty)` when it changes
3. The parent's `setIsDirty` receives this value and shows/hides the bar
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add formId and onDirtyChange to AssetEditForm and wire through AssetDetailInfo</name>
  <files>components/assets/asset-edit-form.tsx, components/assets/asset-detail-info.tsx</files>
  <action>
    In `components/assets/asset-edit-form.tsx`:
    1. Add `formId?: string` and `onDirtyChange?: (isDirty: boolean) => void` to the `AssetEditFormProps` interface (alongside the existing `onSubmittingChange` prop).
    2. Destructure `formId` and `onDirtyChange` from props in the function signature.
    3. Add dirty state detection: after the `form = useForm(...)` call, add:
       ```tsx
       const formIsDirty = form.formState.isDirty;
       useEffect(() => {
         onDirtyChange?.(formIsDirty);
       }, [formIsDirty, onDirtyChange]);
       ```
       Import `useEffect` from `react` (it is already imported via `useState` — extend the import).
    4. Update the `<form>` element: change the hardcoded `id="asset-edit-form"` to use `id={formId ?? 'asset-edit-form'}` so the parent can override it.
    5. Do NOT add a submit button inside the form body — the button lives in the sticky bar in the parent.

    In `components/assets/asset-detail-info.tsx`:
    1. Add `formId?: string` and `onDirtyChange?: (isDirty: boolean) => void` to `AssetDetailInfoProps`.
    2. Destructure `formId` and `onDirtyChange` from props.
    3. Forward both props to `AssetEditForm` in the `canEdit` branch:
       ```tsx
       <AssetEditForm
         asset={asset}
         categories={categories}
         locations={locations}
         existingPhotos={editExistingPhotos}
         existingInvoices={editExistingInvoices}
         onSuccess={onEditSuccess}
         onSubmittingChange={onSubmittingChange}
         formId={formId}
         onDirtyChange={onDirtyChange}
       />
       ```
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>TypeScript compiles without errors; AssetEditForm and AssetDetailInfo both accept and forward formId/onDirtyChange props.</done>
</task>

<task type="auto">
  <name>Task 2: Add sticky bottom bar to AssetDetailClient</name>
  <files>components/assets/asset-detail-client.tsx</files>
  <action>
    In `components/assets/asset-detail-client.tsx`:
    1. Add imports: `useState` from react (already imported), `Button` from `@/components/ui/button` (add import).
    2. Add state variables after the existing state declarations:
       ```tsx
       const [isDirty, setIsDirty] = useState(false);
       const [isSubmitting, setIsSubmitting] = useState(false);
       const FORM_ID = 'asset-edit-form';
       ```
    3. Update the `AssetDetailInfo` call to pass the new props (around line 144):
       ```tsx
       <AssetDetailInfo
         asset={asset}
         conditionPhotos={conditionPhotos}
         invoices={invoices}
         categories={categories}
         locations={locations}
         currentUserId={currentUserId}
         currentUserRole={currentUserRole}
         onEditSuccess={handleActionSuccess}
         onSubmittingChange={setIsSubmitting}
         formId={FORM_ID}
         onDirtyChange={setIsDirty}
       />
       ```
    4. The current JSX return starts with `<>` fragment. Add the sticky bar AFTER the closing `</div>` of the two-column grid but BEFORE the `<AssetStatusChangeDialog>` element:
       ```tsx
       {isDirty && (
         <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
           <div className="mx-auto max-w-[1300px] px-6 py-3 flex items-center justify-between">
             <p className="text-sm text-muted-foreground">Unsaved changes</p>
             <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
               {isSubmitting ? 'Saving...' : 'Save Changes'}
             </Button>
           </div>
         </div>
       )}
       ```
    5. The canEdit check is already in AssetDetailInfo (it only renders AssetEditForm when canEdit), so no extra guard needed on the sticky bar — if form never becomes dirty, isDirty stays false and bar never shows.
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>Build succeeds. Asset detail page renders a sticky Save Changes bar when form fields are modified. Bar disappears after successful save (router.refresh() remounts with clean form state).</done>
</task>

</tasks>

<verification>
npm run build
- Zero TypeScript errors
- Zero lint errors

Manual check:
1. Navigate to any asset detail page as ga_staff, ga_lead, or admin
2. Modify any field (e.g., change the name)
3. Verify: sticky bar appears at bottom with "Unsaved changes" text and "Save Changes" button
4. Click Save Changes — bar disappears after save, page refreshes with updated data
5. Navigate as general_user — no sticky bar appears (read-only view)
</verification>

<success_criteria>
- Asset detail page shows sticky bottom bar on form dirty state, matching the pattern on request/job/template/schedule detail pages
- Bar contains "Unsaved changes" (left) and "Save Changes" button (right)
- Bar only appears when form is dirty (has unsaved changes)
- Build passes with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/35-move-all-save-changes-buttons-to-the-sti/35-SUMMARY.md`
</output>
