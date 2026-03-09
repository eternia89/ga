---
phase: quick-31
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-view-modal.tsx
  - components/requests/request-view-modal.tsx
  - components/jobs/job-modal.tsx
  - components/maintenance/template-view-modal.tsx
  - components/maintenance/schedule-view-modal.tsx
autonomous: true
requirements: [QUICK-31]

must_haves:
  truths:
    - "Skeleton loading placeholders stay within modal bounds on all 5 view modals"
    - "Skeleton content scrolls vertically when it exceeds available modal height"
    - "Loaded content layout is unaffected by the fix"
  artifacts:
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Constrained skeleton loading state"
      contains: "overflow-y-auto"
    - path: "components/requests/request-view-modal.tsx"
      provides: "Constrained skeleton loading state"
      contains: "overflow-y-auto"
    - path: "components/jobs/job-modal.tsx"
      provides: "Constrained skeleton loading state"
      contains: "overflow-y-auto"
    - path: "components/maintenance/template-view-modal.tsx"
      provides: "Constrained skeleton loading state"
      contains: "overflow-y-auto"
    - path: "components/maintenance/schedule-view-modal.tsx"
      provides: "Constrained skeleton loading state"
      contains: "overflow-y-auto"
  key_links:
    - from: "skeleton loading div"
      to: "DialogContent flex container"
      via: "flex-1 min-h-0 overflow-y-auto"
      pattern: "loading.*overflow-y-auto"
---

<objective>
Fix skeleton loading state overflow in all 5 view modals (asset, request, job, template, schedule).

Purpose: The skeleton loading placeholder content overflows beyond the modal's max-h-[90vh] bounds because the loading div does not participate in the flex layout properly. It lacks overflow constraints and flex sizing.

Output: All 5 view modals constrain their skeleton loading states within modal dimensions.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-view-modal.tsx
@components/requests/request-view-modal.tsx
@components/jobs/job-modal.tsx
@components/maintenance/template-view-modal.tsx
@components/maintenance/schedule-view-modal.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add overflow constraints to skeleton loading containers in all 5 view modals</name>
  <files>
    components/assets/asset-view-modal.tsx
    components/requests/request-view-modal.tsx
    components/jobs/job-modal.tsx
    components/maintenance/template-view-modal.tsx
    components/maintenance/schedule-view-modal.tsx
  </files>
  <action>
In each of the 5 view modal files, find the skeleton loading state container (the div rendered when `loading` is true) and change its className from `"p-6 space-y-4"` to `"p-6 space-y-4 overflow-y-auto flex-1 min-h-0"`.

This makes the skeleton div participate in the DialogContent's `flex flex-col` layout:
- `flex-1` allows it to grow but also shrink within the flex container
- `min-h-0` overrides the default `min-height: auto` that prevents flex children from shrinking below their content size
- `overflow-y-auto` enables scrolling when content exceeds available space

The specific locations:
1. **asset-view-modal.tsx** line ~343: `<div className="p-6 space-y-4">`
2. **request-view-modal.tsx** line ~451: `<div className="p-6 space-y-4">`
3. **job-modal.tsx** line ~883: `<div className="p-6 space-y-4">`
4. **template-view-modal.tsx** line ~212: `<div className="p-6 space-y-4">`
5. **schedule-view-modal.tsx** line ~248: `<div className="p-6 space-y-4">`

Do NOT change any other divs or the loaded content layout. Only the skeleton loading container needs this fix.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx grep -c "overflow-y-auto flex-1 min-h-0" components/assets/asset-view-modal.tsx components/requests/request-view-modal.tsx components/jobs/job-modal.tsx components/maintenance/template-view-modal.tsx components/maintenance/schedule-view-modal.tsx | grep -v ":0$" | wc -l | xargs test 5 -eq && echo "PASS: all 5 files updated" || echo "FAIL: not all files updated"</automated>
  </verify>
  <done>All 5 view modals have skeleton loading containers with overflow-y-auto, flex-1, and min-h-0 classes. Skeleton content no longer overflows modal bounds.</done>
</task>

</tasks>

<verification>
- `npm run build` passes without errors
- Grep confirms all 5 skeleton containers have `overflow-y-auto flex-1 min-h-0`
- No changes to loaded content layout (only the loading state div was modified)
</verification>

<success_criteria>
- Skeleton loading placeholders in all 5 view modals are constrained within the modal's max-h-[90vh] bounds
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/31-fix-skeleton-loading-state-overflow-from/31-SUMMARY.md`
</output>
