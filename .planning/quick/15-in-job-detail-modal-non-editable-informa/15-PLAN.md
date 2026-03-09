---
phase: quick-15
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-form.tsx
autonomous: true
requirements: [QUICK-15]

must_haves:
  truths:
    - "Priority badge is visible in the modal header when viewing a job"
    - "Priority field does NOT appear in the form section when job is read-only"
    - "Priority field still appears and is editable when creating or editing a job"
  artifacts:
    - path: "components/jobs/job-form.tsx"
      provides: "Conditional priority field visibility"
      contains: "readOnly"
  key_links:
    - from: "components/jobs/job-modal.tsx"
      to: "components/jobs/job-form.tsx"
      via: "readOnly prop passed as !canEdit"
      pattern: "readOnly=\\{!canEdit\\}"
---

<objective>
Remove priority field duplication in job detail modal by hiding the priority FormField in JobForm when readOnly is true.

Purpose: The priority badge already displays in the modal header (line 928 of job-modal.tsx). When the form is read-only, the disabled priority Select duplicates this information. Hiding it removes the redundancy per user decision.

Output: JobForm conditionally renders priority field only when not readOnly.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/jobs/job-modal.tsx (header renders PriorityBadge at line 928; passes readOnly={!canEdit} to JobForm at line 949)
@components/jobs/job-form.tsx (priority FormField at lines 372-407; readOnly prop at line 90/118; disabled derived at line 269)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Hide priority field in JobForm when readOnly</name>
  <files>components/jobs/job-form.tsx</files>
  <action>
Wrap the priority FormField block (lines 372-407) in a conditional: only render when `!readOnly`.

Change from:
```
{/* Priority */}
<FormField ... />
```

To:
```
{/* Priority — hidden in readOnly mode; shown as PriorityBadge in modal header */}
{!readOnly && (
  <FormField ... />
)}
```

Do NOT change anything else in the form. The priority field must still be fully functional in create mode and when canEdit is true.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -20 && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>Priority FormField is hidden when readOnly=true. No priority duplication in read-only job modal view. Priority field still renders normally in create mode and edit mode.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors
2. Build succeeds
3. Visual check: open a job modal in read-only mode -- priority badge visible in header, no priority field in form
4. Visual check: open job modal in edit mode (as GA Lead) -- priority field visible in form section
5. Visual check: create new job -- priority field visible and functional
</verification>

<success_criteria>
- Priority field hidden in read-only form view
- Priority badge still visible in modal header
- Priority field fully functional in create and edit modes
- No TypeScript or build errors
</success_criteria>

<output>
After completion, create `.planning/quick/15-in-job-detail-modal-non-editable-informa/15-SUMMARY.md`
</output>
