---
phase: quick-23
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-detail-info.tsx
  - components/jobs/job-detail-client.tsx
  - components/maintenance/template-detail.tsx
  - components/maintenance/schedule-detail.tsx
  - components/maintenance/schedule-form.tsx
  - app/(dashboard)/requests/[id]/page.tsx
  - components/requests/request-detail-client.tsx
  - app/(dashboard)/jobs/[id]/page.tsx
  - app/(dashboard)/maintenance/templates/[id]/page.tsx
  - app/(dashboard)/maintenance/schedules/[id]/page.tsx
autonomous: true
requirements: [QUICK-23]

must_haves:
  truths:
    - "Created By and Created At fields do not appear in the core fields grid on job detail -- only in the header subtitle"
    - "All 4 detail pages (request, job, template, schedule) show a sticky bottom bar with Save button when form has unsaved changes"
    - "Sticky bottom bar disappears when there are no unsaved changes"
    - "Save button in sticky bar submits the correct form via form={formId} attribute"
  artifacts:
    - path: "components/jobs/job-detail-info.tsx"
      provides: "Job detail without duplicated Created By/At, with formId/onDirtyChange/onSubmittingChange props"
    - path: "components/jobs/job-detail-client.tsx"
      provides: "Job detail client with sticky bottom bar"
    - path: "components/maintenance/template-detail.tsx"
      provides: "Template detail with formId pattern and sticky bottom bar"
    - path: "components/maintenance/schedule-detail.tsx"
      provides: "Schedule detail with sticky bottom bar"
    - path: "components/requests/request-detail-client.tsx"
      provides: "Request detail client with sticky bottom bar"
  key_links:
    - from: "sticky bottom bar (in *-client or page wrapper)"
      to: "form element"
      via: "form={formId} attribute on external Save button"
      pattern: "form=.*form.*id"
    - from: "form dirty state"
      to: "sticky bar visibility"
      via: "onDirtyChange callback -> isDirty state"
      pattern: "onDirtyChange|isDirty"
---

<objective>
Remove duplicated Created By / Created At fields from detail page grids (they already appear in the header) and add a sticky bottom bar with Save button that appears only when the form has unsaved changes. Apply consistently to Request, Job, Template, and Schedule detail pages.

Purpose: Reduce information duplication and provide a consistent, always-visible save affordance across all detail pages.
Output: All 4 detail pages use formId pattern with sticky bottom bar for save.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/quick/23-remove-duplication-of-information-in-det/23-CONTEXT.md

Key patterns to follow (from asset-view-modal.tsx quick task 19):
- External form button: `<Button type="submit" form="form-id-here">Save Changes</Button>`
- Form element gets matching id: `<form id="form-id-here" onSubmit={...}>`
- Dirty state lifted via onDirtyChange callback
- Submitting state lifted via onSubmittingChange callback
- Sticky bar: `<div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background px-6 py-3 flex items-center justify-between">` (only shown when isDirty)

Reference: Request detail already has formId/onDirtyChange/onSubmittingChange props on RequestDetailInfo and RequestEditForm but NO sticky bar in the page wrapper yet.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove duplicated fields from job detail, add formId/dirty/submitting pattern to job and template</name>
  <files>
    components/jobs/job-detail-info.tsx
    components/maintenance/template-detail.tsx
    components/maintenance/schedule-form.tsx
  </files>
  <action>
**job-detail-info.tsx:**
1. Remove the "Created By" grid item (lines ~275-286 with dt "Created By" and dd `job.created_by_user?.full_name`). This duplicates the header subtitle at line ~128-133 which already shows "Created by {name} . Created {date}".
2. Remove the "Created At" grid item (lines ~288-293 with dt "Created At" and dd `formatDateTime(job.created_at)`). Same duplication.
3. Add props: `formId?: string`, `onDirtyChange?: (isDirty: boolean) => void`, `onSubmittingChange?: (isSubmitting: boolean) => void`
4. Add `id={formId}` attribute to a wrapper form element. Since JobDetailInfo uses individual state fields (not react-hook-form), wrap the editable section in a `<form id={formId} onSubmit={...}>` where onSubmit calls handleEditSave. Currently handleEditSave is triggered by button onClick -- refactor to form onSubmit with preventDefault.
5. Track dirty state: compare current edit values against original job values. Use useEffect to call onDirtyChange when dirty state changes. Dirty = any of editTitle/editDescription/editLocationId/editCategoryId/editPriority/editAssignedTo/editEstimatedCost differs from job's original values.
6. Propagate submitting state via onSubmittingChange using useEffect watching `submitting`.
7. Remove the inline `<Button onClick={handleEditSave}>Save Changes</Button>` (line ~387-394) -- save will come from external sticky bar.
8. Keep the InlineFeedback where it is (inside the component).

**template-detail.tsx:**
1. Add props: `formId?: string`, `onDirtyChange?: (isDirty: boolean) => void`, `onSubmittingChange?: (isSubmitting: boolean) => void`
2. Add `id={formId}` to the existing `<form onSubmit={form.handleSubmit(onSubmit)}>` element (line ~185).
3. Track form dirty state via `form.formState.isDirty` and propagate via useEffect calling onDirtyChange.
4. Track isPending as submitting state via useEffect calling onSubmittingChange.
5. Remove the inline `<Button type="submit">Save Changes</Button>` (line ~291-293) -- save will come from external sticky bar.
6. Keep InlineFeedback inside the component.

**schedule-form.tsx (ScheduleEditForm):**
1. Add props to ScheduleEditForm: `formId?: string`, `onDirtyChange?: (isDirty: boolean) => void`, `onSubmittingChange?: (isSubmitting: boolean) => void`
2. Add `id={formId}` to the existing form element (line ~428).
3. Track form dirty state via `form.formState.isDirty` and propagate via useEffect calling onDirtyChange.
4. Track isPending as submitting state via useEffect calling onSubmittingChange.
5. Remove the inline Save Changes button (line ~490-493) and the Back button next to it.
6. Keep InlineFeedback inside the component.
7. Also pass these new props through from ScheduleForm wrapper if mode="edit".
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | head -40</automated>
  </verify>
  <done>
    - "Created By" and "Created At" grid items removed from job-detail-info.tsx
    - All three components accept formId/onDirtyChange/onSubmittingChange props
    - Inline Save buttons removed from all three components
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Add sticky bottom bar to all 4 detail page wrappers</name>
  <files>
    components/requests/request-detail-client.tsx
    components/jobs/job-detail-client.tsx
    components/maintenance/template-detail.tsx
    components/maintenance/schedule-detail.tsx
    app/(dashboard)/requests/[id]/page.tsx
    app/(dashboard)/jobs/[id]/page.tsx
    app/(dashboard)/maintenance/templates/[id]/page.tsx
    app/(dashboard)/maintenance/schedules/[id]/page.tsx
  </files>
  <action>
The sticky bottom bar pattern: a fixed bar at the bottom of the viewport that appears only when the form is dirty. Shows "Unsaved changes" text on the left and a Save button on the right that submits via `form={formId}`.

**Pattern to implement (same for all 4 pages):**
```tsx
{isDirty && (
  <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background shadow-lg">
    <div className="mx-auto max-w-[1400px] px-6 py-3 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">Unsaved changes</p>
      <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  </div>
)}
```
Note: Use the same max-w value as the dashboard layout wrapper for consistent alignment. Check `app/(dashboard)/layout.tsx` for the exact value and use it.

**request-detail-client.tsx:**
1. Add state: `const [isDirty, setIsDirty] = useState(false)` and `const [isSubmitting, setIsSubmitting] = useState(false)`
2. Define `const FORM_ID = 'request-detail-form'`
3. Pass `formId={FORM_ID}`, `onDirtyChange={setIsDirty}`, `onSubmittingChange={setIsSubmitting}` to RequestDetailInfo (these props already exist on RequestDetailInfo)
4. Add sticky bottom bar after the grid div, before the FeedbackDialog
5. When isDirty becomes false after save (onEditSuccess triggers router.refresh which remounts), the bar disappears naturally

**job-detail-client.tsx:**
1. Add state: `const [isDirty, setIsDirty] = useState(false)` and `const [isSubmitting, setIsSubmitting] = useState(false)`
2. Define `const FORM_ID = 'job-detail-form'`
3. Pass `formId={FORM_ID}`, `onDirtyChange={useCallback((d) => setIsDirty(d), [])}`, `onSubmittingChange={useCallback((s) => setIsSubmitting(s), [])}` to JobDetailInfo
4. Add sticky bottom bar after the grid div
5. Only show bar when canEdit (ga_lead/admin on non-terminal job) AND isDirty

**template-detail.tsx:**
The template detail component IS the wrapper (no separate *-client.tsx). Since TemplateDetail already has the form inside:
1. Add state: `const [isDirty, setIsDirty] = useState(false)` and track from form.formState.isDirty via useEffect
2. Define `const FORM_ID = 'template-edit-form'` and add `id={FORM_ID}` to the form element
3. Add sticky bottom bar at the end of the component (inside the outer div), only when canManage AND isDirty
4. Since the form and bar are in the same component, the formId/onDirtyChange/onSubmittingChange props from Task 1 become optional -- use internal state directly. Keep the props for flexibility but use internal tracking.

**schedule-detail.tsx:**
1. Add state: `const [isDirty, setIsDirty] = useState(false)` and `const [isSubmitting, setIsSubmitting] = useState(false)`
2. Define `const FORM_ID = 'schedule-edit-form'`
3. Pass `formId={FORM_ID}`, `onDirtyChange={setIsDirty}`, `onSubmittingChange={setIsSubmitting}` to ScheduleForm (which passes through to ScheduleEditForm)
4. Add sticky bottom bar at the end, only when canManage AND isDirty

**All pages:** Add `pb-20` to the outermost wrapper div to ensure content doesn't get hidden behind the sticky bar when it appears. Apply this in the detail page server components (page.tsx files) by changing `className="space-y-6 py-6"` to `className="space-y-6 py-6 pb-20"`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | head -40 && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - All 4 detail pages show a sticky bottom bar with "Unsaved changes" + Save button when form is dirty
    - Bar disappears when no unsaved changes exist
    - Save button submits correct form via form={formId}
    - No duplicate Created By / Created At in job detail grid
    - TypeScript compiles, build succeeds
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. Visual check: job detail page no longer shows Created By / Created At in the field grid
4. Visual check: editing a field on any of the 4 detail pages causes sticky bottom bar to appear
5. Visual check: clicking Save in bar submits the form and bar disappears after save
</verification>

<success_criteria>
- Created By and Created At removed from job detail grid (already in header)
- All 4 detail pages (request, job, template, schedule) have sticky bottom bar with Save
- Bar only appears on dirty form state
- Bar uses form={formId} pattern for external submit
- Build passes
</success_criteria>

<output>
After completion, create `.planning/quick/23-remove-duplication-of-information-in-det/23-SUMMARY.md`
</output>
