---
phase: quick-14
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-form.tsx
  - components/jobs/job-modal.tsx
  - components/jobs/job-create-dialog.tsx
  - components/jobs/job-view-modal.tsx
  - app/(dashboard)/jobs/page.tsx
autonomous: true
requirements: [QUICK-14]

must_haves:
  truths:
    - "Create modal shows the same form layout as view modal (unified JobForm)"
    - "Create modal is 700px wide, view modal is 800px wide with timeline on the right"
    - "View modal shows the form pre-filled and editable (for GA Lead/Admin on non-terminal jobs)"
    - "View modal has sticky action bar at bottom and timeline panel on right"
    - "Create modal closes on successful creation (no morphing)"
    - "All existing functionality preserved: sub-dialogs, prev/next nav, GPS actions, PM checklist, comments"
  artifacts:
    - path: "components/jobs/job-modal.tsx"
      provides: "Unified JobModal component handling both create and view modes"
    - path: "components/jobs/job-form.tsx"
      provides: "Extended JobForm supporting both create and edit with updateJob action"
  key_links:
    - from: "components/jobs/job-modal.tsx"
      to: "components/jobs/job-form.tsx"
      via: "renders JobForm in both create and view modes"
      pattern: "mode=.create|edit"
    - from: "components/jobs/job-modal.tsx"
      to: "components/jobs/job-timeline.tsx"
      via: "renders timeline panel in view mode only"
      pattern: "mode.*view.*JobTimeline"
    - from: "app/(dashboard)/jobs/page.tsx"
      to: "components/jobs/job-modal.tsx"
      via: "replaces both JobCreateDialog and JobViewModal imports"
---

<objective>
Unify the job create dialog and job view modal into a single `JobModal` component that shares the same form layout (JobForm) for both create and view/edit modes. Create mode uses a 700px dialog with the form only; view mode uses an 800px dialog with the form on the left and timeline on the right, plus a sticky action bar at the bottom.

Purpose: Consistent UI between create and view, reduced code duplication, single component to maintain.
Output: Unified JobModal, extended JobForm with edit support, updated consumers.
</objective>

<context>
@components/jobs/job-form.tsx
@components/jobs/job-view-modal.tsx
@components/jobs/job-create-dialog.tsx
@components/jobs/job-detail-info.tsx
@app/(dashboard)/jobs/page.tsx
@lib/validations/job-schema.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extend JobForm to support edit mode with updateJob</name>
  <files>components/jobs/job-form.tsx</files>
  <action>
Extend JobForm to handle both create and edit modes. Currently it only calls `createJob`. For edit mode:

1. Add new props to JobFormProps:
   - `jobId?: string` (required for edit mode to call updateJob)
   - `initialData?: { title, description, location_id, category_id, priority, assigned_to, estimated_cost, linked_request_ids }` (pre-fill values for edit mode)
   - Keep existing `mode: 'create' | 'edit'` prop

2. When `mode === 'edit'` and `initialData` is provided:
   - Use `initialData` values as `defaultValues` in useForm instead of prefillRequest values
   - Use `updateJobSchema` resolver instead of `createJobSchema` (import from job-schema.ts)
   - On submit, call `updateJob({ id: jobId, ...changedFields })` instead of `createJob(data)` (import updateJob from job-actions)
   - Show "Save Changes" / "Saving..." button text (already handled by existing mode check)
   - Pre-populate `linkedRequests` state from `initialData.linked_request_ids` by finding matching entries in `eligibleRequests`

3. When `mode === 'create'`, behavior is unchanged (uses createJobSchema, calls createJob).

4. Add a `readOnly?: boolean` prop. When true (used for non-editable view by non-GA-Lead users), disable all form fields. This replaces the read-only rendering that JobDetailInfo did.

5. Keep the existing `prefillRequest` prop working for create mode (when creating a job from a request).

Key imports to add: `import { updateJob } from '@/app/actions/job-actions';` and `import { updateJobSchema } from '@/lib/validations/job-schema';`
  </action>
  <verify>npm run build 2>&1 | head -30</verify>
  <done>JobForm accepts edit mode with initialData and jobId, calls updateJob on submit in edit mode, pre-fills all fields from initialData. readOnly prop disables all fields. Create mode unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Create JobModal shell with create mode and view mode layout</name>
  <files>components/jobs/job-modal.tsx</files>
  <action>
Create `components/jobs/job-modal.tsx` — the unified modal component with create and view mode rendering. This task builds the modal shell, data fetching, header, and main content layout. Action bar and sub-dialogs are added in Task 3.

**JobModal props:**
```typescript
interface JobModalProps {
  mode: 'create' | 'view';
  // Create mode props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // View mode props
  jobId?: string | null;
  currentUserId?: string;
  currentUserRole?: string;
  onActionSuccess?: () => void;
  jobIds?: string[];
  onNavigate?: (jobId: string) => void;
  // Create mode reference data (view mode fetches its own)
  locations?: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
  users?: { id: string; full_name: string }[];
  eligibleRequests?: EligibleRequest[];
  requestJobLinks?: Record<string, string>;
}
```

**Create mode:**
- Dialog with `max-w-[700px]`, same mobile fullscreen classes as current JobCreateDialog
- Header: "New Job"
- Body: `<JobForm mode="create" ...props onSuccess={close + router.refresh} />`
- No timeline, no action bar
- Reference data (locations, categories, users, eligibleRequests, requestJobLinks) received as props from parent

**View mode — data fetching:**
- Move ALL data fetching logic from current JobViewModal (lines 169-486) into this component: Supabase queries for job, timeline events, comments, comment photos, categories, locations, users
- Preserve all derived state: canEdit, canStartWork, canApproveReject, canApproveCompletion, canMarkComplete, canCancel, canComment, approvedByName, approvalRejectedByName
- Preserve URL sync (window.history.replaceState with ?view=)
- Preserve loading/error states with Skeleton and error message UI

**View mode — header:**
- display_id, status badge, priority badge, PM badge, prev/next nav buttons — same as current JobViewModal (lines 770-824)
- Created by user and date line

**View mode — content layout:**
- Split: `grid-cols-[1fr_350px] max-lg:grid-cols-1`
- Left panel (scrollable):
  - `<JobForm mode="edit" jobId={job.id} initialData={...fromFetchedJob} readOnly={!canEdit} locations={categories} categories={categories} users={users} eligibleRequests={eligibleRequests} requestJobLinks={requestJobLinks} onSuccess={handleActionSuccess} />`
  - Extract initialData from fetched job: `{ title: job.title, description: job.description, location_id: job.location_id, category_id: job.category_id, priority: job.priority, assigned_to: job.assigned_to, estimated_cost: job.estimated_cost, linked_request_ids: job.job_requests.map(jr => jr.request.id) }`
  - `canEdit` = isGaLeadOrAdmin AND not terminal status (same logic as current JobDetailInfo)
- Right panel: Timeline + comment form (same as current JobViewModal lines 858-883), with timelineRef for scroll-to-bottom on load

**Temporary placeholder for action bar:** Render an empty `<div className="border-t px-6 py-3 shrink-0" />` at the bottom where the sticky action bar will go (Task 3 fills this in).

**Linked requests in view mode:** In readOnly mode, JobForm should show linked requests as read-only list with RequestPreviewDialog click behavior. Import RequestPreviewDialog into JobForm for this.
  </action>
  <verify>npm run build 2>&1 | head -30</verify>
  <done>JobModal component exists with create mode (700px, form only, closes on success) and view mode (800px, data fetching, header with nav, form+timeline split layout). Placeholder for action bar. Build passes.</done>
</task>

<task type="auto">
  <name>Task 3: Add action bar, sub-dialogs, PM checklist, and wire up wrappers</name>
  <files>components/jobs/job-modal.tsx, components/jobs/job-create-dialog.tsx, components/jobs/job-view-modal.tsx</files>
  <action>
Complete JobModal view mode and update consumer wrappers.

**Action bar (in job-modal.tsx):**
Replace the placeholder div with the full sticky action bar from current JobViewModal (lines 886-965). Move verbatim:
- Left side: feedback InlineFeedback, Start Work button (with GPS capture), Approve Budget, Approve Completion, Mark Complete (with GPS capture)
- Right side: Reject Budget, Reject Completion, Cancel Job buttons
- All action handlers: handleStartWork, handleApprove, handleReject, handleApproveCompletion, handleRejectCompletion, handleMarkComplete, handleCancel — move from current JobViewModal
- State: submitting, capturingGps, feedback, rejectOpen, rejectReason, rejectCompletionOpen, rejectCompletionReason, cancelOpen
- useGeolocation hook for GPS capture

**Sub-dialogs (in job-modal.tsx):**
Move verbatim from current JobViewModal (lines 971-1081), render outside the main Dialog for z-index stacking:
- Reject Budget Dialog (with reason textarea, 1000 char limit)
- Reject Completion Dialog (with reason textarea, 1000 char limit)
- Cancel Job AlertDialog (confirmation with warning text)

**PM Checklist (in job-modal.tsx):**
Render below JobForm in the left panel for preventive_maintenance jobs (lines 844-855 from current):
```
{job.job_type === 'preventive_maintenance' && job.checklist_responses && (
  <PMChecklist jobId={job.id} checklist={job.checklist_responses} jobStatus={job.status} canEdit={...} />
)}
```

**Update JobCreateDialog** (`components/jobs/job-create-dialog.tsx`):
- Keep as thin wrapper: manages `open` state, renders trigger Button ("New Job" with Plus icon), renders `<JobModal mode="create" open={open} onOpenChange={setOpen} locations={...} categories={...} users={...} eligibleRequests={...} requestJobLinks={...} />`
- Props interface stays the same for consumers

**Update JobViewModal** (`components/jobs/job-view-modal.tsx`):
- Replace entire implementation to be a thin wrapper around `<JobModal mode="view" jobId={...} currentUserId={...} currentUserRole={...} onActionSuccess={...} jobIds={...} onNavigate={...} />`
- Props interface stays the same for consumers (job-table.tsx continues importing JobViewModal unchanged)
- View mode fetches its own reference data client-side, so no need to pass locations/categories/users from wrapper
  </action>
  <verify>npm run build 2>&1 | tail -5</verify>
  <done>JobModal has full action bar with all action handlers, three sub-dialogs (reject budget, reject completion, cancel), PM checklist rendering. JobCreateDialog and JobViewModal are thin wrappers delegating to JobModal. All existing functionality preserved: prev/next nav, GPS actions, PM checklist, comments, approval flows, URL sync. Build passes with no errors.</done>
</task>

</tasks>

<verification>
- `npm run build` passes with no TypeScript errors
- `npm run lint` passes
- Create dialog opens at 700px, shows form, creates job and closes
- View modal opens at 800px, shows form on left (pre-filled), timeline on right, action bar at bottom
- All action buttons work: Start Work, Approve Budget, Reject Budget, Approve Completion, Reject Completion, Mark Complete, Cancel Job
- PM checklist renders for preventive_maintenance jobs
- Comments can be added in timeline panel
- Prev/next navigation works
- Linked requests display correctly in both create and view modes
</verification>

<success_criteria>
- Single JobModal component handles both create (700px) and view (800px) modes per locked decision
- JobForm extended with edit mode using updateJob action
- View modal replaces JobDetailInfo compact grid with the same form layout used in create
- All action handlers, sub-dialogs, timeline, comments, PM checklist preserved from original JobViewModal
- No regression in existing job list page functionality
- Build and lint pass cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/14-new-job-and-view-job-modal-should-be-sim/14-SUMMARY.md`
</output>
