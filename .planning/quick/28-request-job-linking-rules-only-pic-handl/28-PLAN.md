---
phase: quick-28
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/job-actions.ts
  - app/(dashboard)/jobs/page.tsx
  - app/(dashboard)/jobs/new/page.tsx
  - components/jobs/job-modal.tsx
autonomous: true
requirements: [QUICK-28]

must_haves:
  truths:
    - "Only requests with status triaged or in_progress appear in eligible requests dropdown (never submitted/new)"
    - "Requests already linked to a job do NOT appear in the eligible requests dropdown when creating/editing other jobs"
    - "Server-side createJob and updateJob reject requests that violate any of the 3 rules"
    - "Only the PIC assigned to a request can link that request to a job"
  artifacts:
    - path: "app/actions/job-actions.ts"
      provides: "Server-side validation for all 3 linking rules in createJob and updateJob"
    - path: "app/(dashboard)/jobs/page.tsx"
      provides: "Filtered eligible requests query excluding already-linked and submitted requests, plus PIC filter"
    - path: "app/(dashboard)/jobs/new/page.tsx"
      provides: "Same filtered eligible requests query for standalone create page"
    - path: "components/jobs/job-modal.tsx"
      provides: "Same filtered eligible requests query for client-side view/edit modal"
  key_links:
    - from: "app/(dashboard)/jobs/page.tsx"
      to: "components/jobs/job-form.tsx"
      via: "eligibleRequests prop"
      pattern: "eligibleRequests="
    - from: "app/actions/job-actions.ts"
      to: "job_requests table"
      via: "duplicate link check before insert"
      pattern: "job_requests.*request_id"
---

<objective>
Enforce three request-job linking rules: (1) only the PIC assigned to a request can link it to a job, (2) submitted/new requests cannot be linked, (3) each request can only be linked to one job.

Purpose: Prevent invalid request-job associations that would cause data integrity issues and confusing UX.
Output: Updated server actions with validation + filtered eligible requests queries in all 3 data-fetching locations.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@app/actions/job-actions.ts
@components/jobs/job-form.tsx
@app/(dashboard)/jobs/page.tsx
@app/(dashboard)/jobs/new/page.tsx
@components/jobs/job-modal.tsx
@lib/types/database.ts

<interfaces>
<!-- Request type has assigned_to field (the PIC) and status field -->
From lib/types/database.ts:
```typescript
export type Request = {
  id: string;
  assigned_to: string | null;
  status: 'submitted' | 'triaged' | 'in_progress' | 'pending_acceptance' | 'accepted' | 'closed' | 'rejected' | 'cancelled';
  // ...
};
```

<!-- EligibleRequest type used in job-form.tsx -->
From components/jobs/job-form.tsx:
```typescript
export interface EligibleRequest {
  id: string;
  display_id: string;
  title: string;
  priority: string | null;
  status: string;
  location_id: string | null;
  category_id: string | null;
  description: string | null;
}
```

<!-- job_requests join table columns: job_id, request_id, company_id, linked_by -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Server-side validation in createJob and updateJob</name>
  <files>app/actions/job-actions.ts</files>
  <action>
Add server-side validation to both `createJob` and `updateJob` actions to enforce all 3 linking rules BEFORE inserting into `job_requests`.

In `createJob`, after the role check and before generating display_id, add validation for `linked_request_ids` if provided:

1. **Rule 2 (no submitted requests):** Query `requests` table for the given IDs and verify ALL have status in `['triaged', 'in_progress']`. If any have status `'submitted'`, throw error: `"Cannot link requests with status 'New'. Only triaged or in-progress requests can be linked."`.

2. **Rule 3 (1 request -> 1 job):** Query `job_requests` table to check if any of the `linked_request_ids` already have an entry. If yes, throw error: `"Request {display_id} is already linked to another job."`. Use a single query: `.from('job_requests').select('request_id').in('request_id', linked_request_ids)`.

3. **Rule 1 (PIC restriction):** For each linked request, verify that `request.assigned_to === profile.id` (the current user creating the job). If any request has a different PIC or no PIC, throw error: `"You can only link requests assigned to you as PIC."`. This means the current user must be the PIC on every request they try to link.

In `updateJob`, apply the same 3 rules but ONLY for the `toAdd` array (newly linked requests). Requests being unlinked (`toRemove`) need no validation. The validation should happen after computing `toAdd` and before the insert into `job_requests`.

IMPORTANT: For Rule 3 in updateJob, exclude the current job's own links when checking for duplicates (a request already linked to THIS job is fine to keep). Query: `.from('job_requests').select('request_id').in('request_id', toAdd).neq('job_id', id)`.

Also remove the `in_progress` requests from the "Move each linked request to in_progress" update — only update requests that are in `triaged` status (add `.eq('status', 'triaged')` instead of `.neq('status', 'cancelled')`), since in_progress requests are already in the right state and may be linked to other jobs (though Rule 3 should prevent that now).

Wait — actually Rule 3 prevents a request from being in two jobs, so in_progress requests that pass Rule 3 validation are ones NOT linked to any job yet. Keep the existing `.neq('status', 'cancelled')` filter for the status update but add `.in('status', ['triaged'])` to be more precise — only move triaged requests to in_progress, skip ones already in_progress.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>createJob and updateJob both validate all 3 linking rules server-side with clear error messages. Requests in 'submitted' status are rejected, already-linked requests are rejected, and only PIC-assigned requests can be linked.</done>
</task>

<task type="auto">
  <name>Task 2: Filter eligible requests in all 3 data-fetching locations</name>
  <files>app/(dashboard)/jobs/page.tsx, app/(dashboard)/jobs/new/page.tsx, components/jobs/job-modal.tsx</files>
  <action>
Update the eligible requests query in all 3 locations to enforce Rules 1-3 at the data layer (defense in depth — server actions validate too, but the dropdown should only show valid options).

**Rule 2 (no submitted):** Already enforced — queries use `.in('status', ['triaged', 'in_progress'])`. No change needed.

**Rule 3 (1 request -> 1 job):** After fetching eligible requests, fetch ALL request_ids that are already in `job_requests` table, then filter them OUT of the eligible list.

In all 3 locations, after the eligible requests query resolves:

```typescript
// Fetch request IDs already linked to any job
const { data: alreadyLinkedData } = await supabase
  .from('job_requests')
  .select('request_id');

const alreadyLinkedIds = new Set((alreadyLinkedData ?? []).map((r) => r.request_id));

// Filter out already-linked requests from eligible list
const filteredEligibleRequests = eligibleRequests.filter((r) => !alreadyLinkedIds.has(r.id));
```

Then pass `filteredEligibleRequests` (instead of `eligibleRequests`) to the component props.

**Rule 1 (PIC restriction):** Additionally filter to only show requests where `assigned_to` matches the current user's profile.id. This requires adding `assigned_to` to the select query for eligible requests.

Update the eligible requests query in all 3 locations to add `assigned_to` to the select:
```
.select('id, display_id, title, priority, status, location_id, category_id, description, assigned_to')
```

Then add a filter step:
```typescript
const picFilteredRequests = filteredEligibleRequests.filter((r) => r.assigned_to === profile.id);
```

Pass `picFilteredRequests` to the component.

**For the edit modal in job-modal.tsx (view mode):** When editing a job, the currently-linked requests of THIS job must still appear in the eligible list (so the user can see them and potentially unlink). So for the edit modal, also include requests that are already linked to the CURRENT job being viewed:

```typescript
const currentJobRequestIds = new Set(
  (fetchedJob.job_requests ?? []).map((jr) => jr.request.id)
);
const filteredEligibleRequests = eligibleRequests.filter(
  (r) => !alreadyLinkedIds.has(r.id) || currentJobRequestIds.has(r.id)
);
```

**Cleanup:** Since already-linked requests are now filtered out entirely, the `requestJobLinks` map and `in_progress` annotation logic in the dropdown become unnecessary for the create flow. However, keep the `requestJobLinks` prop and logic intact for backward compatibility — if a request somehow appears with `in_progress` status (e.g., the current job's own linked requests in edit mode), the annotation is still useful.

Actually, simplify: since Rule 3 filters out all already-linked requests, the `requestJobLinks` fetch becomes unnecessary in create mode (no in_progress requests with existing links will be shown). But in edit mode, the current job's linked requests DO appear, and they are in_progress WITH a link to this job. Keep the `requestJobLinks` fetch but scope it correctly.

For `jobs/page.tsx` and `jobs/new/page.tsx` (create-only): Remove the `requestJobLinks` fetch and pass `{}` as `requestJobLinks` since no already-linked requests will appear.

For `job-modal.tsx` (view/edit): Keep `requestJobLinks` but only for the current job's linked requests.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>All 3 data-fetching locations filter eligible requests to exclude already-linked requests and requests not assigned to the current user as PIC. Submitted requests were already excluded. The eligible requests dropdown only shows valid linkable requests.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npm run build`
2. Manual verification scenarios:
   - Create job: dropdown shows only triaged/in_progress requests where current user is PIC, and not already linked to another job
   - Edit job: dropdown shows same filtered list PLUS the current job's own linked requests
   - Server action rejects if someone bypasses the UI and sends invalid request IDs
</verification>

<success_criteria>
- Only PIC-assigned, triaged/in_progress, unlinked requests appear in the eligible requests dropdown
- Server actions reject all 3 violation types with clear error messages
- Edit mode correctly includes the current job's own linked requests in the dropdown
- No TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/28-request-job-linking-rules-only-pic-handl/28-SUMMARY.md`
</output>
