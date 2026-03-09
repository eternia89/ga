---
phase: quick-16
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-modal.tsx
  - components/requests/request-view-modal.tsx
  - components/assets/asset-view-modal.tsx
  - components/assets/asset-create-dialog.tsx
  - components/maintenance/schedule-view-modal.tsx
  - components/maintenance/template-view-modal.tsx
  - components/maintenance/template-create-dialog.tsx
autonomous: true
requirements: [QUICK-16]

must_haves:
  truths:
    - "All view modals (job, request, asset, schedule, template) render at 1000px total width"
    - "All view modals split form and timeline columns as 600px + 400px"
    - "All create modals (job, asset, template) render at 600px width"
    - "Request create and schedule create remain at 600px (already correct)"
  artifacts:
    - path: "components/jobs/job-modal.tsx"
      provides: "Job view modal at 1000px with 600px+400px grid, create mode at 600px"
      contains: "max-w-[1000px]"
    - path: "components/requests/request-view-modal.tsx"
      provides: "Request view modal at 1000px with 600px+400px grid"
      contains: "max-w-[1000px]"
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Asset view modal at 1000px with 600px+400px grid"
      contains: "max-w-[1000px]"
    - path: "components/assets/asset-create-dialog.tsx"
      provides: "Asset create dialog at 600px"
      contains: "max-w-[600px]"
    - path: "components/maintenance/schedule-view-modal.tsx"
      provides: "Schedule view modal at 1000px with 600px+400px grid"
      contains: "max-w-[1000px]"
    - path: "components/maintenance/template-view-modal.tsx"
      provides: "Template view modal at 1000px with 600px+400px grid"
      contains: "max-w-[1000px]"
    - path: "components/maintenance/template-create-dialog.tsx"
      provides: "Template create dialog at 600px"
      contains: "max-w-[600px]"
  key_links: []
---

<objective>
Standardize all modal widths across the application to a consistent convention: view modals with form+timeline split use 1000px total (600px form + 400px timeline), create modals use 600px.

Purpose: Visual consistency across all entity modals — currently view modals are 800px with 1fr+350px split, and some create modals are 700px instead of 600px.
Output: All 7 modal files updated with standardized widths.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/16-standardize-all-modal-widths-form-600px-/16-CONTEXT.md
@CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update all view modal widths from 800px to 1000px with 600px+400px grid</name>
  <files>
    components/jobs/job-modal.tsx
    components/requests/request-view-modal.tsx
    components/assets/asset-view-modal.tsx
    components/maintenance/schedule-view-modal.tsx
    components/maintenance/template-view-modal.tsx
  </files>
  <action>
In each of the 5 view modal files, make two changes:

1. **DialogContent max-width:** Change `max-w-[800px]` to `max-w-[1000px]`
2. **Grid columns:** Change all `grid-cols-[1fr_350px]` to `grid-cols-[600px_400px]`

Specific locations per file:
- **job-modal.tsx:** Line ~824 (view mode DialogContent) change max-w-[800px] to max-w-[1000px]. Lines ~836 and ~942 change grid-cols-[1fr_350px] to grid-cols-[600px_400px].
- **request-view-modal.tsx:** Line ~446 change max-w-[800px] to max-w-[1000px]. Lines ~458 and ~568 change grid-cols-[1fr_350px] to grid-cols-[600px_400px].
- **asset-view-modal.tsx:** Line ~336 change max-w-[800px] to max-w-[1000px]. Lines ~348 and ~453 change grid-cols-[1fr_350px] to grid-cols-[600px_400px].
- **schedule-view-modal.tsx:** Line ~243 change max-w-[800px] to max-w-[1000px]. Line ~352 change grid-cols-[1fr_350px] to grid-cols-[600px_400px].
- **template-view-modal.tsx:** Line ~207 change max-w-[800px] to max-w-[1000px]. Line ~313 change grid-cols-[1fr_350px] to grid-cols-[600px_400px].

Do NOT change the max-lg:grid-cols-1 responsive breakpoint — mobile still collapses to single column.
  </action>
  <verify>
    <automated>grep -rn "max-w-\[800px\]" components/{jobs,requests,assets,maintenance}/*modal*.tsx | wc -l | xargs test 0 -eq && echo "PASS: No 800px modals remain" || echo "FAIL: 800px modals still exist"</automated>
  </verify>
  <done>All 5 view modals use max-w-[1000px] and grid-cols-[600px_400px]. Zero instances of max-w-[800px] or grid-cols-[1fr_350px] remain in modal files.</done>
</task>

<task type="auto">
  <name>Task 2: Standardize create modal widths to 600px</name>
  <files>
    components/jobs/job-modal.tsx
    components/assets/asset-create-dialog.tsx
    components/maintenance/template-create-dialog.tsx
  </files>
  <action>
Change create modal widths from 700px to 600px in 3 files:

1. **job-modal.tsx:** Line ~778 (create mode DialogContent) change `max-w-[700px]` to `max-w-[600px]`
2. **asset-create-dialog.tsx:** Line ~34 change `max-w-[700px]` to `max-w-[600px]`
3. **template-create-dialog.tsx:** Line ~32 change `max-w-[700px]` to `max-w-[600px]`

Do NOT touch request-create-dialog.tsx or schedule-create-dialog.tsx — they are already at 600px.
  </action>
  <verify>
    <automated>grep -rn "max-w-\[700px\]" components/{jobs,requests,assets,maintenance}/*.tsx | wc -l | xargs test 0 -eq && echo "PASS: No 700px modals remain" || echo "FAIL: 700px modals still exist"</automated>
  </verify>
  <done>All create modals use max-w-[600px]. Zero instances of max-w-[700px] remain in modal/dialog files.</done>
</task>

</tasks>

<verification>
Run build to ensure no Tailwind or TypeScript issues:
```bash
npm run build
```

Grep verification — confirm final state:
```bash
# Should find exactly 5 instances of max-w-[1000px] in view modals
grep -rn "max-w-\[1000px\]" components/{jobs,requests,assets,maintenance}/*modal*.tsx

# Should find 0 instances of max-w-[800px] or max-w-[700px] in modal/dialog files
grep -rn "max-w-\[800px\]\|max-w-\[700px\]" components/{jobs,requests,assets,maintenance}/*.tsx

# Should find grid-cols-[600px_400px] in all 5 view modals
grep -rn "grid-cols-\[600px_400px\]" components/{jobs,requests,assets,maintenance}/*modal*.tsx
```
</verification>

<success_criteria>
- All 5 view modals (job, request, asset, schedule, template) use max-w-[1000px] with grid-cols-[600px_400px]
- All create modals use max-w-[600px]
- No instances of max-w-[800px] or max-w-[700px] remain in modal/dialog component files
- Build passes without errors
</success_criteria>

<output>
After completion, create `.planning/quick/16-standardize-all-modal-widths-form-600px-/16-SUMMARY.md`
</output>
