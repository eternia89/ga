---
phase: quick-9
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  # Task 1: Jobs
  - components/jobs/job-view-modal.tsx
  - components/jobs/job-table.tsx
  - components/jobs/job-columns.tsx
  - app/(dashboard)/jobs/page.tsx
  # Task 2: Assets
  - components/assets/asset-view-modal.tsx
  - components/assets/asset-table.tsx
  - components/assets/asset-columns.tsx
  - app/(dashboard)/inventory/page.tsx
  # Task 3: Maintenance (Templates + Schedules)
  - components/maintenance/template-view-modal.tsx
  - components/maintenance/template-list.tsx
  - components/maintenance/template-columns.tsx
  - app/(dashboard)/maintenance/templates/page.tsx
  - components/maintenance/schedule-view-modal.tsx
  - components/maintenance/schedule-list.tsx
  - components/maintenance/schedule-columns.tsx
  - app/(dashboard)/maintenance/page.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Clicking View on a job row opens a modal with full job details (info, timeline, comments, PM checklist, actions) without navigating away"
    - "Clicking View on an asset row opens a modal with full asset details (info, photos, invoices, transfer status, timeline, actions) without navigating away"
    - "Clicking a template name in the table opens a modal with full template details (info, checklist, edit form, deactivate/reactivate) without navigating away"
    - "Clicking a schedule row View opens a modal with full schedule details (info, form, linked PM jobs, pause/resume/deactivate) without navigating away"
    - "All modals sync ?view=entityId to the URL for permalink support"
    - "All modals have prev/next navigation arrows when opened from a filtered list"
    - "All modals follow the 800px, max-h-[90vh], full-screen-on-mobile pattern from RequestViewModal"
    - "All modals use the split-view layout (left panel + right panel) per locked layout decision"
    - "All modals have a sticky action bar at the bottom per locked layout decision"
  artifacts:
    - path: "components/jobs/job-view-modal.tsx"
      provides: "Job view modal with client-side data fetching, split layout, sticky action bar"
      min_lines: 200
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Asset view modal with client-side data fetching, split layout, sticky action bar"
      min_lines: 200
    - path: "components/maintenance/template-view-modal.tsx"
      provides: "Template view modal with client-side data fetching, split layout (metadata left, checklist right), sticky action bar"
      min_lines: 150
    - path: "components/maintenance/schedule-view-modal.tsx"
      provides: "Schedule view modal with client-side data fetching, split layout (detail left, PM jobs right), sticky action bar"
      min_lines: 150
  key_links:
    - from: "components/jobs/job-table.tsx"
      to: "components/jobs/job-view-modal.tsx"
      via: "viewJobId state + onOpenChange"
      pattern: "JobViewModal.*jobId.*viewJobId"
    - from: "components/assets/asset-table.tsx"
      to: "components/assets/asset-view-modal.tsx"
      via: "viewAssetId state + onOpenChange"
      pattern: "AssetViewModal.*assetId.*viewAssetId"
    - from: "components/maintenance/template-list.tsx"
      to: "components/maintenance/template-view-modal.tsx"
      via: "viewTemplateId state + onOpenChange"
      pattern: "TemplateViewModal.*templateId.*viewTemplateId"
    - from: "components/maintenance/schedule-list.tsx"
      to: "components/maintenance/schedule-view-modal.tsx"
      via: "viewScheduleId state + onOpenChange"
      pattern: "ScheduleViewModal.*scheduleId.*viewScheduleId"
---

<objective>
Implement the modal view pattern (established by RequestViewModal) on all remaining table list pages: Jobs, Assets (Inventory), Maintenance Templates, and Maintenance Schedules.

Purpose: Replace the current "click row -> navigate to /entity/[id] detail page" pattern with an in-page modal that shows full entity details. This keeps users in context on the list page and enables quick browsing with prev/next navigation.

Output: 4 new view modal components, updated table/list components to wire modals, updated page components to pass ?view= param.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@components/requests/request-view-modal.tsx (REFERENCE — follow this exact pattern)
@components/requests/request-table.tsx (REFERENCE — how modal is wired into table)
@app/(dashboard)/requests/page.tsx (REFERENCE — how page passes initialViewId)

<interfaces>
<!-- Reference implementation pattern from RequestViewModal -->

RequestViewModal pattern:
1. Props: { entityId: string | null, onOpenChange, currentUserId, currentUserRole, onActionSuccess?, entityIds?: string[], onNavigate? }
2. Client-side data fetch using createClient() Supabase on entityId change
3. URL sync: window.history.replaceState(null, '', '?view=' + id) / pathname
4. Prev/next: currentIndex from entityIds array, ChevronLeft/ChevronRight buttons
5. Dialog shell: max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0, full-screen on max-md:
6. Three sections: Header (non-scrollable, border-b), Split body (scrollable left + right), Sticky action bar (border-t)
7. Loading skeleton, error state with Retry, content state
8. Sub-dialogs rendered OUTSIDE main Dialog for z-index stacking
9. refreshKey state + handleActionSuccess with setRefreshKey + router.refresh()

Table wiring pattern:
1. Table component holds [viewEntityId, setViewEntityId] state
2. handleView sets the ID, onOpenChange clears it
3. Modal receives filteredData.map(e => e.id) as entityIds for prev/next
4. Modal receives setViewEntityId as onNavigate

Page wiring pattern:
1. Page accepts searchParams with { view?: string }
2. Passes initialViewId={view} to table component
3. Table initializes viewEntityId from initialViewId

From components/jobs/job-detail-client.tsx:
```typescript
interface JobDetailClientProps {
  job: JobWithRelations;
  timelineEvents: JobTimelineEvent[];
  comments: JobComment[];
  commentPhotos: PhotoItem[];
  currentUserId: string;
  currentUserRole: string;
  users: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  approvedByName?: string | null;
  approvalRejectedByName?: string | null;
}
```

From components/assets/asset-detail-client.tsx:
```typescript
interface AssetDetailClientProps {
  asset: InventoryItemWithRelations;
  pendingTransfer: InventoryMovementWithRelations | null;
  conditionPhotos: ConditionPhoto[];
  invoices: InvoiceItem[];
  auditLogs: Record<string, unknown>[];
  movements: InventoryMovementWithRelations[];
  transferPhotos: TransferPhoto[];
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  gaUsers: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
}
```

From components/maintenance/template-detail.tsx:
```typescript
interface TemplateDetailProps {
  template: MaintenanceTemplate;
  categories: Category[];
  userRole: string;
}
```

From components/maintenance/schedule-detail.tsx:
```typescript
interface ScheduleDetailProps {
  schedule: MaintenanceSchedule;
  pmJobs: PMJobRef[];
  userRole: string;
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create JobViewModal and wire into jobs table</name>
  <files>
    components/jobs/job-view-modal.tsx
    components/jobs/job-table.tsx
    components/jobs/job-columns.tsx
    app/(dashboard)/jobs/page.tsx
  </files>
  <action>
Create `components/jobs/job-view-modal.tsx` following the exact RequestViewModal pattern:

**Props:** `{ jobId: string | null, onOpenChange, currentUserId, currentUserRole, onActionSuccess?, jobIds?: string[], onNavigate? }`

**Client-side data fetch** (in fetchData callback, triggered by jobId + refreshKey):
- Fetch job with full relations from `jobs` table (same select as jobs/[id]/page.tsx: `*, location:locations(name), category:categories(name), pic:user_profiles!assigned_to(full_name), created_by_user:user_profiles!created_by(full_name), maintenance_schedule:maintenance_schedules(id, next_due_at, interval_type, interval_days), job_requests(request:requests(id, display_id, title, status))`)
- Cast result as JobWithRelations (via unknown, same pattern as detail page)
- Fetch audit_logs for table_name='jobs', record_id=id
- Fetch job_comments with user join, non-deleted, ordered by created_at asc
- Fetch comment photos from media_attachments (entity_type='job_comment', in commentIds) + sign URLs from 'job-photos' bucket
- Fetch job_status_changes for GPS data
- Fetch categories (all, non-deleted) and locations (company-scoped, non-deleted)
- Fetch users (company-scoped, non-deleted) for action dialogs
- Batch-fetch performer names for audit logs (same userMap pattern)
- Resolve approvedByName and approvalRejectedByName
- Process audit logs into JobTimelineEvent[] (copy the timeline processing logic from jobs/[id]/page.tsx lines 229-415 — this is the same classification: approval_rejection, completion_rejection, cancellation, approval, completion_approved, approval_submitted, pending_completion_approval, assignment, status_change, field_update)
- Build GPS map from status changes

NOTE: The job detail page currently does ALL data fetching and timeline processing server-side, then passes pre-processed data to JobDetailClient. The modal must replicate this client-side. For the company_id filter on locations/users, get it from the fetched job's company_id.

**Layout** (same Dialog shell as RequestViewModal):
- Header: prev/next arrows, display_id (mono), JobStatusBadge, PriorityBadge, PM badge if job_type=preventive_maintenance, subtitle with created_by name + created date
- Split body: Left scrollable panel with JobDetailInfo + PMChecklist (if applicable), Right scrollable panel with timeline heading + JobTimeline + JobCommentForm (if canComment)
- **Sticky action bar at bottom (per locked layout decision):** A `border-t px-6 py-3 flex items-center justify-between gap-2 shrink-0 bg-background` bar at the bottom of the modal, same structure as RequestViewModal's action bar. Left side: primary actions based on job status — Start Work (if status=assigned, user is PIC or ga_lead/admin), Approve (if pending_approval, user is ga_lead/admin), Approve Completion (if pending_completion_approval, user is ga_lead/admin), Mark Complete (if in_progress, user is PIC or ga_lead/admin). Right side: destructive actions — Reject (if pending_approval), Reject Completion (if pending_completion_approval), Cancel (if not completed/cancelled, user is ga_lead/admin). Each button triggers the same server actions as JobDetailActions (updateJobStatus, cancelJob, approveJob, rejectJob, approveCompletion, rejectCompletion). The action bar replaces JobDetailActions as the primary action surface. Do NOT render JobDetailActions in the left panel — move its action logic into the sticky bar instead. The left panel should only contain JobDetailInfo + PMChecklist. Sub-dialogs for rejection reason (rejectJob, rejectCompletion) and cancel confirmation should be rendered OUTSIDE the main Dialog (same z-index stacking pattern as RequestViewModal sub-dialogs).

IMPORTANT: JobDetailInfo, JobTimeline, JobCommentForm, and PMChecklist are existing components that accept props. Reuse them inside the modal body. The modal's job is to fetch data client-side and pass it to these existing components. Do NOT recreate the detail rendering — just wrap the existing components. However, for the action bar, implement the action buttons directly in the modal (copying the permission logic and server action calls from JobDetailActions) rather than embedding JobDetailActions as a component.

**Sub-dialogs:** Rejection reason dialogs (for rejectJob and rejectCompletion) and cancel confirmation dialog need to be rendered OUTSIDE the main Dialog for z-index stacking. Use the same pattern as RequestViewModal's sub-dialogs (separate AlertDialog/Dialog components after the main DialogContent).

**Wire into JobTable (`components/jobs/job-table.tsx`):**
- Add `initialViewId?: string` prop
- Add `[viewJobId, setViewJobId]` state initialized from initialViewId
- Change handleView to set viewJobId instead of router.push
- Remove handleEdit (or keep it pointing to modal too — per CONTEXT decision, edit is inline in detail page = modal)
- Add JobViewModal at bottom of JSX with jobIds={filteredData.map(j => j.id)}, onNavigate={setViewJobId}
- Add handleModalActionSuccess that sets feedback + router.refresh()

**Update job-columns.tsx:**
- Remove the separate Edit button — View opens the modal which has inline editing
- Keep Cancel button (it opens cancel dialog from table, which is fine as backup)

**Update jobs/page.tsx:**
- Accept searchParams with { view?: string }
- Pass initialViewId={view} to JobTable
- Pass currentUserId={profile.id} and currentUserRole={profile.role} to JobTable (already passed)
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -50</automated>
  </verify>
  <done>
    - JobViewModal component exists with client-side data fetching
    - Clicking View in job table opens modal (no navigation away)
    - Modal shows job info, timeline, comments, PM checklist in split layout
    - Sticky action bar at bottom with context-sensitive job actions
    - URL syncs to ?view=jobId
    - Prev/next navigation works
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Create AssetViewModal and wire into inventory table</name>
  <files>
    components/assets/asset-view-modal.tsx
    components/assets/asset-table.tsx
    components/assets/asset-columns.tsx
    app/(dashboard)/inventory/page.tsx
  </files>
  <action>
Create `components/assets/asset-view-modal.tsx` following the exact RequestViewModal pattern:

**Props:** `{ assetId: string | null, onOpenChange, currentUserId, currentUserRole, onActionSuccess?, assetIds?: string[], onNavigate? }`

**Client-side data fetch** (replicate inventory/[id]/page.tsx server logic, client-side):
- Fetch asset with relations: `*, category:categories(name), location:locations(name), company:companies(name)`
- Fetch condition photos: media_attachments where entity_type in ['asset_creation', 'asset_status_change'], entity_id=id + sign URLs from 'asset-photos' bucket
- Fetch invoices: media_attachments where entity_type='asset_invoice', entity_id=id + sign URLs from 'asset-invoices' bucket
- Fetch pending transfer: inventory_movements where item_id=id, status='pending', with from_location/to_location/initiator/receiver joins, maybeSingle()
- Fetch audit_logs for table_name='inventory_items', record_id=id
- Fetch all movements: inventory_movements where item_id=id, with location/user joins, ordered by created_at
- Fetch transfer photos: media_attachments in entity_type=['asset_transfer_send','asset_transfer_receive','asset_transfer_reject'], entity_id in movementIds + sign from 'asset-photos'
- Fetch categories (type='asset', non-deleted) for edit form
- Fetch locations (company-scoped using asset.company_id) for edit form and transfer
- Fetch GA users (company-scoped, roles ga_staff/ga_lead/admin) for transfer receiver

NOTE: Use asset's company_id (from fetched asset) to scope location/user queries.

**Layout:**
- Header: prev/next arrows, display_id (mono), AssetStatusBadge (with pending transfer awareness), name, subtitle with category + location + created date
- Split body: Left scrollable with AssetDetailInfo + AssetDetailActions, Right scrollable with AssetTimeline
- The AssetDetailClient already manages showStatusDialog, showTransferDialog, showTransferRespondDialog, transferRespondMode states. Replicate this state management in the modal and pass to AssetDetailInfo and AssetDetailActions.

IMPORTANT: Reuse existing AssetDetailInfo, AssetDetailActions, and AssetTimeline components. The modal fetches data and passes it down.

**Wire into AssetTable (`components/assets/asset-table.tsx`):**
- Add `initialViewId?: string`, `currentUserId: string`, `currentUserRole: string` props (currentUserRole already exists)
- Add `[viewAssetId, setViewAssetId]` state
- handleView sets viewAssetId instead of router.push
- Remove handleEdit (editing is inline in asset detail = modal)
- Add AssetViewModal at bottom of JSX
- Add handleModalActionSuccess with feedback + router.refresh()

**Update asset-columns.tsx:**
- Remove separate Edit button — View opens modal with inline editing
- Keep View button

**Update inventory/page.tsx:**
- Accept searchParams with { view?: string }
- Pass initialViewId={view}, currentUserId={profile.id} to AssetTable
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -50</automated>
  </verify>
  <done>
    - AssetViewModal component exists with client-side data fetching
    - Clicking View in asset table opens modal (no navigation away)
    - Modal shows asset info, photos, invoices, transfer status, timeline, actions
    - URL syncs to ?view=assetId
    - Prev/next navigation works
    - TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 3: Create TemplateViewModal + ScheduleViewModal and wire into maintenance tables</name>
  <files>
    components/maintenance/template-view-modal.tsx
    components/maintenance/template-list.tsx
    components/maintenance/template-columns.tsx
    app/(dashboard)/maintenance/templates/page.tsx
    components/maintenance/schedule-view-modal.tsx
    components/maintenance/schedule-list.tsx
    components/maintenance/schedule-columns.tsx
    app/(dashboard)/maintenance/page.tsx
  </files>
  <action>
**PART A: TemplateViewModal**

Create `components/maintenance/template-view-modal.tsx`:

**Props:** `{ templateId: string | null, onOpenChange, userRole, onActionSuccess?, templateIds?: string[], onNavigate? }`

**Client-side data fetch:**
- Fetch template: maintenance_templates with category join (same select as templates/[id]/page.tsx)
- Normalize: checklist as array, item_count, category flatten
- Fetch categories (type='asset', non-deleted) for edit form

**Layout (split view per locked layout decision — ALL entities use split layout):**
- Header: prev/next arrows, template name, Active/Inactive badge, item count, created date
- Split body (same `grid-cols-[1fr_350px] max-lg:grid-cols-1` structure as RequestViewModal):
  - Left panel (scrollable): Template metadata (name, category, description, created/updated dates) and the edit form section from TemplateDetail. If userRole is ga_lead/admin, show the editable form fields (name, category, description). If read-only, show the metadata as static fields.
  - Right panel (scrollable, border-l): Checklist Items section — heading "Checklist Items ({count})" followed by the checklist item list (type label + description for each item). This is the natural "detail" content for templates, analogous to timeline for other entities. In edit mode, this is where the draggable checklist editor goes.
- **Sticky action bar at bottom (per locked layout decision):** `border-t px-6 py-3 flex items-center justify-between gap-2 shrink-0 bg-background`. Left side: Save Changes button (if form is dirty, userRole is ga_lead/admin). Right side: Deactivate button (if template is active) or Reactivate button (if inactive). These actions call the same server actions as TemplateDetail.

NOTE: You may need to split TemplateDetail's rendering — rather than embedding the entire TemplateDetail component as-is (which has its own save/deactivate buttons inline), extract the form fields and checklist display into the two panels, and move the action buttons to the sticky bar. Alternatively, render TemplateDetail in the left panel but hide its inline buttons (via a prop like `hideActions={true}`) and replicate the actions in the sticky bar. Use whichever approach is cleaner — this is Claude's discretion. The key requirement is: split layout with two panels + sticky action bar.

**Wire into TemplateList (`components/maintenance/template-list.tsx`):**
- Add `initialViewId?: string` prop
- Add `[viewTemplateId, setViewTemplateId]` state
- Add onView handler to meta
- Add TemplateViewModal at bottom of JSX

**Update template-columns.tsx:**
- Add `onView?: (template: MaintenanceTemplate) => void` to TemplateTableMeta
- Change the Name column from Link to a button/click handler that calls meta.onView (currently it's a Link to /maintenance/templates/[id])
- Keep Deactivate/Reactivate buttons in actions column

**Update maintenance/templates/page.tsx:**
- Accept searchParams with { view?: string }
- Pass initialViewId={view} to TemplateList

---

**PART B: ScheduleViewModal**

Create `components/maintenance/schedule-view-modal.tsx`:

**Props:** `{ scheduleId: string | null, onOpenChange, userRole, onActionSuccess?, scheduleIds?: string[], onNavigate? }`

**Client-side data fetch:**
- Fetch schedule with template and asset joins (same select as schedules/[id]/page.tsx)
- Normalize FK arrays
- Fetch PM jobs: jobs where maintenance_schedule_id=id, non-deleted, ordered by created_at desc

**Layout (split view per locked layout decision — ALL entities use split layout):**
- Header: prev/next arrows, template name, asset name link, ScheduleStatusBadge
- Split body (same `grid-cols-[1fr_350px] max-lg:grid-cols-1` structure as RequestViewModal):
  - Left panel (scrollable): Schedule detail info — template name, asset name + link, interval (type + days), next due date, last completed date, status, auto-pause warning if applicable. If userRole is ga_lead/admin, show editable form fields for interval and other settings.
  - Right panel (scrollable, border-l): PM Jobs list — heading "PM Jobs ({count})" followed by the list of linked preventive maintenance jobs (each showing display_id, status badge, created date, with click to open job). This is the natural "related items" content for schedules, analogous to timeline for other entities.
- **Sticky action bar at bottom (per locked layout decision):** `border-t px-6 py-3 flex items-center justify-between gap-2 shrink-0 bg-background`. Left side: Save Changes button (if form is dirty, ga_lead/admin only). Right side: Pause button (if active and not paused), Resume button (if paused), Deactivate button. These actions call the same server actions as ScheduleDetail.

NOTE: Similar to TemplateViewModal, you may need to split ScheduleDetail's rendering or pass a `hideActions` prop. The existing ScheduleDetail component has inline Pause/Resume/Deactivate buttons and the PM Jobs list together. For the modal, the PM Jobs section moves to the right panel and actions move to the sticky bar. Use whichever approach is cleanest.

**Wire into ScheduleList (`components/maintenance/schedule-list.tsx`):**
- Add `initialViewId?: string` prop
- Add `[viewScheduleId, setViewScheduleId]` state
- Add onView handler to meta
- Add ScheduleViewModal at bottom of JSX

**Update schedule-columns.tsx:**
- Add `onView?: (schedule: MaintenanceSchedule) => void` to ScheduleTableMeta
- Add a View button in the actions column (currently only has Pause/Resume/Deactivate)
- Change template Name column link to also support modal opening (add click handler that calls meta.onView instead of navigating)

**Update maintenance/page.tsx (schedules page):**
- Accept searchParams with { view?: string }
- Pass initialViewId={view} to ScheduleList

NOTE: The schedules page is `app/(dashboard)/maintenance/page.tsx`, NOT `app/(dashboard)/maintenance/schedules/page.tsx`. The schedule detail page is at `app/(dashboard)/maintenance/schedules/[id]/page.tsx`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -50</automated>
  </verify>
  <done>
    - TemplateViewModal and ScheduleViewModal components exist
    - Both modals use split-view layout (left detail panel + right content panel)
    - Both modals have sticky action bar at bottom
    - Clicking template name in table opens modal (no navigation away)
    - Clicking View on schedule row opens modal (no navigation away)
    - Both modals sync ?view=id to URL
    - Both modals have prev/next navigation
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
After all 3 tasks complete:
1. `npx tsc --noEmit` passes with no errors
2. `npm run build` succeeds
3. All 4 entity tables open modals instead of navigating on View click
4. All modals show full entity detail content (reusing existing detail components)
5. All modals use split-view layout (left + right panels) per locked layout decision
6. All modals have sticky action bar at bottom per locked layout decision
7. URL ?view= param syncs on open/close/navigate
8. Prev/next arrows work in all modals
9. Actions within modals (status changes, edits, cancellations) work and refresh data
</verification>

<success_criteria>
- 4 new *ViewModal components created, each following the RequestViewModal pattern
- All modals use split-view layout (details left, related content right) per locked decision
- All modals have sticky action bar at bottom per locked decision
- All table list pages wire modals via viewEntityId state
- URL permalink support with ?view= param on all 4 pages
- Prev/next navigation in all modals
- No TypeScript errors
- All existing detail functionality accessible through modals
</success_criteria>

<output>
After completion, create `.planning/quick/9-implement-modal-view-pattern-on-all-tabl/9-SUMMARY.md`
</output>
