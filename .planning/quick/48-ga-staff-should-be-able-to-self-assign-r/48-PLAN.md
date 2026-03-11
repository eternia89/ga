---
phase: quick-48
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/auth/permissions.ts
  - app/actions/request-actions.ts
  - app/actions/job-actions.ts
  - components/requests/request-detail-actions.tsx
  - components/requests/request-detail-info.tsx
  - app/(dashboard)/requests/[id]/page.tsx
  - app/(dashboard)/jobs/page.tsx
  - supabase/migrations/00019_ga_staff_permissions.sql
autonomous: true
requirements: []

must_haves:
  truths:
    - "GA Staff can self-assign a submitted request (triage to themselves as PIC) without GA Lead"
    - "GA Staff cannot triage already-triaged requests — only submitted-status requests"
    - "GA Staff cannot assign a request to a different user — only to themselves"
    - "GA Staff cannot reject requests (reject remains GA Lead/Admin only)"
    - "GA Staff can create new jobs via the New Job button on the jobs page"
    - "GA Lead retains full triage capability (assign to any user, any triageable status)"
  artifacts:
    - path: "lib/auth/permissions.ts"
      provides: "JOB_CREATE and JOB_ASSIGN added to ga_staff role (no REQUEST_SELF_ASSIGN — enforcement is via direct role checks)"
    - path: "app/actions/request-actions.ts"
      provides: "triageRequest allows ga_staff on submitted requests only; enforces assigned_to === profile.id"
    - path: "app/actions/job-actions.ts"
      provides: "createJob allows ga_staff role"
    - path: "supabase/migrations/00019_ga_staff_permissions.sql"
      provides: "job_requests INSERT policy expanded to include ga_staff"
  key_links:
    - from: "triageRequest action"
      to: "ga_staff branch"
      via: "profile.role === 'ga_staff' enforces status === 'submitted' AND assigned_to === profile.id"
    - from: "request-detail-actions.tsx canTriage"
      to: "ga_staff self-assign UI"
      via: "isGaStaff && request.status === 'submitted' (not array-includes with triaged)"
    - from: "request-detail-info.tsx canTriage"
      to: "ga_staff self-assign UI"
      via: "isGaStaff && request.status === 'submitted' (not array-includes with triaged)"
    - from: "jobs/page.tsx CTA guard"
      to: "JobCreateDialog render"
      via: "['ga_lead', 'admin', 'ga_staff'].includes(profile.role)"
---

<objective>
Enable GA Staff to (1) self-assign submitted requests as PIC without GA Lead intervention, and (2) create new jobs. GA Lead retains full triage (assign to any user). GA Staff self-assign is constrained: they may only set assigned_to to themselves AND only on submitted-status requests (cannot override an existing GA Lead PIC assignment on a triaged request).

Purpose: Unblock GA Staff from waiting on GA Lead to triage requests before they can start work.
Output: Updated permissions, server action guards, UI guards, and one DB migration.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Permissions, actions, and RLS migration for GA Staff</name>
  <files>
    lib/auth/permissions.ts,
    app/actions/request-actions.ts,
    app/actions/job-actions.ts,
    supabase/migrations/00019_ga_staff_permissions.sql
  </files>
  <action>
**lib/auth/permissions.ts** — Do NOT add `REQUEST_SELF_ASSIGN` to PERMISSIONS. The ga_staff triage enforcement is via direct `profile.role === 'ga_staff'` checks in the action (not via hasPermission()), so a permission constant would be dead code. Add only `PERMISSIONS.JOB_CREATE` and `PERMISSIONS.JOB_ASSIGN` to the `ga_staff` role array. Keep `REQUEST_TRIAGE` for GA Lead only.

**app/actions/request-actions.ts — triageRequest** — Replace the role check block:

```ts
// Old: only ga_lead and admin
if (!['ga_lead', 'admin'].includes(profile.role)) {
  throw new Error('Triage access required');
}
```

with a two-branch check that also enforces status for ga_staff:

```ts
const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(profile.role);
const isGaStaff = profile.role === 'ga_staff';

if (!isGaLeadOrAdmin && !isGaStaff) {
  throw new Error('Triage access required');
}

// GA Staff can only triage new (submitted) requests — not already-triaged ones
if (isGaStaff && request.status !== 'submitted') {
  throw new Error('GA Staff can only triage new requests.');
}

// GA Staff can only assign to themselves
if (isGaStaff && parsedInput.data.assigned_to !== profile.id) {
  throw new Error('GA Staff can only assign requests to themselves.');
}
```

The rest of triageRequest (update, notifications) remains unchanged.

**app/actions/job-actions.ts — createJob** — Change the role check from:
```ts
if (!['ga_lead', 'admin'].includes(profile.role)) {
```
to:
```ts
if (!['ga_lead', 'admin', 'ga_staff'].includes(profile.role)) {
```
No other changes to createJob logic — all existing validation (linked request PIC check, etc.) applies equally to ga_staff.

**supabase/migrations/00019_ga_staff_permissions.sql** — Create migration to expand the job_requests INSERT RLS policy to include ga_staff:

```sql
-- Migration 00019: GA Staff permissions expansion
-- Allow ga_staff to insert into job_requests (needed to link requests when creating jobs)

DROP POLICY IF EXISTS "job_requests_insert_lead_admin" ON public.job_requests;
CREATE POLICY "job_requests_insert_lead_admin_staff" ON public.job_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = current_user_company_id()
    AND current_user_role() IN ('ga_lead', 'admin', 'ga_staff')
  );
```

Then run: `supabase db push` (or apply via Supabase dashboard SQL editor if CLI push not available locally without Docker).
  </action>
  <verify>
Run `npm run build` — must compile with no TypeScript errors. The triageRequest action must have the status guard (status !== 'submitted' throws) and the self-assign guard (assigned_to !== profile.id throws) both present in source.
  </verify>
  <done>
- permissions.ts: ga_staff has JOB_CREATE, JOB_ASSIGN (no REQUEST_SELF_ASSIGN — intentional, enforcement is direct role checks)
- triageRequest: ga_staff allowed only on submitted requests; enforces assigned_to === profile.id
- createJob: ga_staff allowed
- Migration file 00019 exists with updated job_requests INSERT policy
  </done>
</task>

<task type="auto">
  <name>Task 2: UI guards — request detail triage and jobs page CTA</name>
  <files>
    components/requests/request-detail-actions.tsx,
    components/requests/request-detail-info.tsx,
    app/(dashboard)/requests/[id]/page.tsx,
    app/(dashboard)/jobs/page.tsx
  </files>
  <action>
**components/requests/request-detail-actions.tsx**

Add `isGaStaff` alongside `isGaLeadOrAdmin`:
```ts
const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
const isGaStaff = currentUserRole === 'ga_staff';
```

Update `canTriage` — GA Staff can only triage submitted requests (not triaged ones). GA Lead/Admin retain access on both submitted and triaged:
```ts
// Before:
const canTriage = isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request.status);
// After:
const canTriage =
  (isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request.status)) ||
  (isGaStaff && request.status === 'submitted');
```

Keep `canReject` unchanged (GA Lead/Admin only):
```ts
const canReject = isGaLeadOrAdmin && (request.status === 'submitted' || request.status === 'triaged');
```

**components/requests/request-detail-info.tsx**

Add `isGaStaff` alongside `isGaLeadOrAdmin`:
```ts
const isGaLeadOrAdmin = ['ga_lead', 'admin'].includes(currentUserRole);
const isGaStaff = currentUserRole === 'ga_staff';
```

Update `canTriage` with the same split rule:
```ts
// Before:
const canTriage = isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request.status);
// After:
const canTriage =
  (isGaLeadOrAdmin && ['submitted', 'triaged'].includes(request.status)) ||
  (isGaStaff && request.status === 'submitted');
```

When rendering the triage form PIC field (the `assigned_to` Combobox), restrict options for ga_staff to only themselves. The `users` prop is already passed from the page. Compute filtered options inside the component:

```ts
// Compute PIC options: GA Staff can only see themselves; GA Lead/Admin see all
const picOptions = isGaStaff
  ? userOptions.filter((u) => u.value === currentUserId)
  : userOptions;
```

Replace all `userOptions` references in the `assigned_to` FormField Combobox `options` prop with `picOptions`. There are two triage form instances (inside `if (isEditable)` branch and the main view branch) — update both.

Also set a default value for the triage form when ga_staff opens it so their own ID is pre-selected:
```ts
const triageForm = useForm<TriageFormData>({
  resolver: zodResolver(triageSchema),
  defaultValues: {
    category_id: request.category_id ?? '',
    priority: request.priority ?? undefined,
    assigned_to: request.assigned_to ?? (isGaStaff ? currentUserId : ''),
  },
});
```

**app/(dashboard)/requests/[id]/page.tsx** — No change needed to the users query; the server already fetches all company users. The filtering to self-only happens client-side via `picOptions` above.

**app/(dashboard)/jobs/page.tsx** — Update the CTA render guard from:
```tsx
{['ga_lead', 'admin'].includes(profile.role) && (
  <JobCreateDialog ... />
)}
```
to:
```tsx
{['ga_lead', 'admin', 'ga_staff'].includes(profile.role) && (
  <JobCreateDialog ... />
)}
```
No other changes to the jobs page — ga_staff already see only their assigned jobs in the table (existing filter at line 54), and eligibleRequests is already filtered to `assigned_to === profile.id`.
  </action>
  <verify>
Run `npm run build` — zero TypeScript errors. Inspect components in source to confirm: (1) canTriage for isGaStaff uses `request.status === 'submitted'` (not array-includes), (2) picOptions restricted for ga_staff, (3) jobs page CTA includes ga_staff.
  </verify>
  <done>
- GA Staff sees "Triage" button on submitted requests only (not on triaged requests)
- GA Staff PIC dropdown shows only themselves (enforced both UI and server action)
- GA Staff does NOT see "Triage" or "Edit Triage" button on already-triaged requests
- GA Staff does NOT see "Reject" button (canReject remains isGaLeadOrAdmin only)
- GA Staff sees "New Job" button on jobs page
- GA Lead/Admin see unchanged full PIC dropdown and can triage both submitted + triaged requests
- npm run build passes
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. `npm run build` — must pass with zero errors
2. Log in as ga_staff user — Jobs page shows "New Job" button
3. Log in as ga_staff user — Request detail for a submitted request shows "Triage" button
4. GA Staff triage form: PIC dropdown shows only their own name, submit succeeds
5. GA Staff triage: attempting to call triageRequest API with a different assigned_to UUID returns error "GA Staff can only assign requests to themselves."
6. GA Staff triage: attempting to call triageRequest on a request with status='triaged' returns error "GA Staff can only triage new requests."
7. GA Staff does NOT see "Triage"/"Edit Triage" button on triaged requests (canTriage is false)
8. GA Staff does NOT see "Reject" button on any request
9. GA Lead — PIC dropdown shows all company users (unchanged), can triage both submitted and triaged requests
</verification>

<success_criteria>
- permissions.ts: ga_staff has JOB_CREATE, JOB_ASSIGN; REQUEST_SELF_ASSIGN NOT present (dead code removed)
- triageRequest action: ga_staff branch enforces status === 'submitted' AND assigned_to === profile.id
- createJob action: ga_staff allowed
- UI canTriage: ga_staff condition uses `request.status === 'submitted'` (not array-includes with 'triaged')
- PIC field: picOptions restricted to self for ga_staff
- jobs page CTA visible to ga_staff
- Migration 00019 expands job_requests INSERT to ga_staff
- npm run build passes
</success_criteria>

<output>
After completion, create `.planning/quick/48-ga-staff-should-be-able-to-self-assign-r/48-SUMMARY.md`
</output>
