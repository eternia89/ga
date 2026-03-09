---
phase: quick-17
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-modal.tsx
  - components/jobs/job-detail-actions.tsx
  - app/actions/job-actions.ts
autonomous: true
requirements: [QUICK-17]

must_haves:
  truths:
    - "Only the PIC (assigned user) sees the Start Work button on assigned jobs"
    - "GA Lead/Admin who is NOT the PIC cannot see or trigger Start Work"
    - "Server rejects in_progress transition from non-PIC users"
    - "Mark Complete remains available to GA Lead/Admin (unchanged)"
  artifacts:
    - path: "components/jobs/job-modal.tsx"
      provides: "PIC-only canStartWork in modal view"
      contains: "canStartWork = isPIC && job?.status === 'assigned'"
    - path: "components/jobs/job-detail-actions.tsx"
      provides: "PIC-only canStartWork on detail page"
      contains: "canStartWork = isPIC && job.status === 'assigned'"
    - path: "app/actions/job-actions.ts"
      provides: "Server-side PIC enforcement for in_progress transition"
      contains: "isPIC"
  key_links:
    - from: "components/jobs/job-modal.tsx"
      to: "app/actions/job-actions.ts"
      via: "updateJobStatus action call"
      pattern: "updateJobStatus"
    - from: "components/jobs/job-detail-actions.tsx"
      to: "app/actions/job-actions.ts"
      via: "updateJobStatus action call"
      pattern: "updateJobStatus"
---

<objective>
Restrict the "Start Work" action so only the PIC (Person in Charge / assigned user) can trigger it. Currently GA Lead and Admin can also start work, which breaks the expectation that only the assigned person initiates work.

Purpose: Enforce that work only begins when the PIC decides, preventing confusion from other parties starting work on their behalf.
Output: Updated UI components hiding button for non-PIC users + server-side enforcement preventing API bypass.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/17-restrict-start-work-action-to-pic-only/17-CONTEXT.md
@components/jobs/job-modal.tsx
@components/jobs/job-detail-actions.tsx
@app/actions/job-actions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restrict canStartWork to PIC-only in both UI components</name>
  <files>components/jobs/job-modal.tsx, components/jobs/job-detail-actions.tsx</files>
  <action>
In both files, change the canStartWork computation from:
  `const canStartWork = (isGaLeadOrAdmin || isPIC) && job?.status === 'assigned';`
to:
  `const canStartWork = isPIC && job?.status === 'assigned';`

Specifically:
- job-modal.tsx line 576: change to `const canStartWork = isPIC && job?.status === 'assigned';`
- job-detail-actions.tsx line 85: change to `const canStartWork = isPIC && job.status === 'assigned';`

Do NOT change any other permission checks (canMarkComplete, canEdit, canCancel, etc.) — only canStartWork.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -n "canStartWork" components/jobs/job-modal.tsx components/jobs/job-detail-actions.tsx | grep -v "isGaLeadOrAdmin"</automated>
  </verify>
  <done>Both UI files show canStartWork = isPIC only (no isGaLeadOrAdmin). canMarkComplete and other permissions unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Add server-side PIC enforcement for in_progress transition</name>
  <files>app/actions/job-actions.ts</files>
  <action>
In updateJobStatus action (around line 389), after the existing permission check (`if (!isLead && !isPIC)`), add a specific PIC-only check for the in_progress transition:

After the general permission check block (line 389-391), add:
```typescript
// Start Work (in_progress) restricted to PIC only — defense in depth
if (parsedInput.status === 'in_progress' && !isPIC) {
  throw new Error('Permission denied — only the assigned PIC can start work');
}
```

This goes BEFORE the valid transitions check (line 394). The general check still allows GA Lead/Admin for other transitions (mark complete, submit for approval, etc.).

Also update the comment on line 356 from "ga_lead/admin OR assigned PIC" to "ga_lead/admin OR assigned PIC (Start Work: PIC only)".
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -A2 "in_progress.*!isPIC\|PIC only.*start" app/actions/job-actions.ts</automated>
  </verify>
  <done>Server action rejects in_progress transition from non-PIC users with clear error message. Other transitions (completed, pending_approval) still available to GA Lead/Admin.</done>
</task>

</tasks>

<verification>
1. grep confirms canStartWork uses isPIC only (no isGaLeadOrAdmin) in both UI files
2. grep confirms server-side PIC check for in_progress in job-actions.ts
3. `npm run build` passes with no TypeScript errors
</verification>

<success_criteria>
- Start Work button only visible to the assigned PIC on both job modal and job detail page
- Server rejects in_progress status change from non-PIC users
- Mark Complete and other actions remain available to GA Lead/Admin as before
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/17-restrict-start-work-action-to-pic-only/17-SUMMARY.md`
</output>
