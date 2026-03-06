---
phase: quick-18
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/job-actions.ts
  - components/jobs/job-form.tsx
  - components/jobs/job-modal.tsx
autonomous: true
requirements: [QUICK-18]

must_haves:
  truths:
    - "PIC field is disabled in UI when job status is not 'created' or 'assigned'"
    - "Server rejects assigned_to changes when job status is past 'assigned'"
    - "PIC field remains editable for jobs in 'created' or 'assigned' status"
    - "assignJob action continues to work for 'created'/'assigned' jobs (no regression)"
  artifacts:
    - path: "app/actions/job-actions.ts"
      provides: "Server-side guard rejecting PIC changes on in-progress+ jobs"
      contains: "Cannot change PIC"
    - path: "components/jobs/job-form.tsx"
      provides: "picLocked prop to independently disable PIC Combobox"
      contains: "picLocked"
    - path: "components/jobs/job-modal.tsx"
      provides: "picLocked computation based on job status"
      contains: "picLocked"
  key_links:
    - from: "components/jobs/job-modal.tsx"
      to: "components/jobs/job-form.tsx"
      via: "picLocked prop"
      pattern: "picLocked.*!\\[.*created.*assigned"
    - from: "app/actions/job-actions.ts"
      to: "updateJob guard"
      via: "status check before allowing assigned_to update"
      pattern: "assigned_to.*created.*assigned"
---

<objective>
Lock the PIC (assigned_to) field once a job's status moves past 'assigned' — i.e., once work has started (in_progress, pending_approval, pending_completion_approval, completed, cancelled). Both UI and server must enforce this.

Purpose: Prevent accidental or unauthorized PIC reassignment on active/completed jobs, which could break accountability and notification chains.
Output: Server-side guard in updateJob + UI lock via new picLocked prop on JobForm.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/jobs/job-form.tsx
@components/jobs/job-modal.tsx
@app/actions/job-actions.ts

<interfaces>
From components/jobs/job-form.tsx:
```typescript
interface JobFormProps {
  locations: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  users: { id: string; full_name: string }[];
  eligibleRequests: EligibleRequest[];
  requestJobLinks: Record<string, string>;
  prefillRequest?: PrefillRequest | null;
  mode: 'create' | 'edit';
  jobId?: string;
  initialData?: JobFormInitialData;
  readOnly?: boolean;
  linkedRequestDetails?: { ... }[];
  onSuccess?: () => void;
}
// Line 269: const disabled = isSubmitting || readOnly;
// Line 419-427: PIC Combobox uses `disabled={disabled}`
```

From components/jobs/job-modal.tsx:
```typescript
// Line 575: const canEdit = isGaLeadOrAdmin && !['completed', 'cancelled'].includes(job?.status ?? '');
// Line 949: readOnly={!canEdit}
```

From app/actions/job-actions.ts:
```typescript
// updateJob (line 117-295): accepts assigned_to in updateFields, no status guard
// Line 205: if (updateFields.assigned_to !== undefined) fieldsToUpdate.assigned_to = updateFields.assigned_to;
// Line 209: Auto-transition to 'assigned' only when status === 'created'
// assignJob (line 300-353): already guards with status check (only 'created' status transitions)
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add server-side guard and UI picLocked prop</name>
  <files>app/actions/job-actions.ts, components/jobs/job-form.tsx, components/jobs/job-modal.tsx</files>
  <action>
**1. Server guard in updateJob (app/actions/job-actions.ts):**

After the existing job fetch (line 134) and before the field mapping block (line 198), add a guard:

```typescript
// Block PIC changes once job is past 'assigned' status
const PIC_EDITABLE_STATUSES = ['created', 'assigned'];
if (updateFields.assigned_to !== undefined && !PIC_EDITABLE_STATUSES.includes(existing.status)) {
  throw new Error('Cannot change PIC after work has started');
}
```

Place this right after `const { id, linked_request_ids, ...updateFields } = parsedInput;` (line 140) and before the linked_request_ids block. This ensures the guard fires before any DB writes.

Note: `assignJob` action already has adequate guards (only transitions status on 'created' jobs, and the action itself is only called from the assign flow). No changes needed there.

**2. New picLocked prop on JobForm (components/jobs/job-form.tsx):**

Add `picLocked?: boolean` to the `JobFormProps` interface (after `readOnly`). Default to `false`.

In the component destructuring, add `picLocked = false`.

On the PIC Combobox (~line 426), change `disabled={disabled}` to `disabled={disabled || picLocked}`.

**3. Compute and pass picLocked from JobModal (components/jobs/job-modal.tsx):**

After the `canEdit` computation (line 575), add:

```typescript
const picLocked = !!job && !['created', 'assigned'].includes(job.status);
```

Pass it to the JobForm on line 945-957 area: add `picLocked={picLocked}` as a new prop alongside `readOnly={!canEdit}`.

This means: even when canEdit is true (GA Lead editing an in_progress job), the PIC field specifically will be locked.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - Server: updateJob throws "Cannot change PIC after work has started" when assigned_to is sent for jobs with status not in ['created', 'assigned']
    - UI: PIC Combobox is disabled when job status is past 'assigned', even if other fields are editable
    - No regression: PIC remains editable on 'created' and 'assigned' jobs for GA Lead/Admin
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. TypeScript compilation passes: `npx tsc --noEmit`
2. Build succeeds: `npm run build`
3. Lint passes: `npm run lint`
</verification>

<success_criteria>
- PIC field disabled in UI for jobs with status in_progress, pending_approval, pending_completion_approval, completed, cancelled
- PIC field enabled in UI for jobs with status created or assigned (when user has edit permission)
- Server rejects assigned_to changes on updateJob for jobs past 'assigned' status with clear error message
- No TypeScript errors, build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/18-lock-pic-field-once-job-status-moves-pas/18-SUMMARY.md`
</output>
