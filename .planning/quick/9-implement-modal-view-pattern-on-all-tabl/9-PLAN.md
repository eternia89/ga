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
  artifacts:
    - path: "components/jobs/job-view-modal.tsx"
      provides: "Job view modal with client-side data fetching, split layout, action bar"
      min_lines: 200
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Asset view modal with client-side data fetching, split layout, action bar"
      min_lines: 200
    - path: "components/maintenance/template-view-modal.tsx"
      provides: "Template view modal with client-side data fetching, detail/edit content"
      min_lines: 100
    - path: "components/maintenance/schedule-view-modal.tsx"
      provides: "Schedule view modal with client-side data fetching, detail content, linked PM jobs"
      min_lines: 100
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
- Split body: Left scrollable panel with JobDetailInfo + JobDetailActions + PMChecklist (if applicable), Right scrollable panel with timeline heading + JobTimeline + JobCommentForm (if canComment)
- Sticky action bar: Currently JobDetailActions handles its own actions (status changes, cancel). The modal should render JobDetailActions inside the left panel as it does on the detail page. No separate bottom bar needed UNLESS there are form-level actions like the request update button. For jobs, actions are individual buttons in JobDetailActions. So: no sticky bottom bar for jobs — actions live inline in JobDetailInfo/JobDetailActions.

IMPORTANT: JobDetailInfo, JobDetailActions, JobTimeline, JobCommentForm, and PMChecklist are existing components that accept props. Reuse them inside the modal body. The modal's job is to fetch data client-side and pass it to these existing components. Do NOT recreate the detail rendering — just wrap the existing components.

**Sub-dialogs:** JobCancelDialog is already used in job-table.tsx. Move the cancel functionality into the modal's action handling (JobDetailActions already has its own dialogs for status changes). If there are sub-dialogs inside JobDetailActions, they should work fine since they use their own Dialog wrappers.

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
    - Modal shows job info, timeline, comments, PM checklist, actions
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

**Layout:** This is a simpler entity — NO split layout (no timeline). Use single-column scrollable content.
- Header: prev/next arrows, template name, Active/Inactive badge, item count, created date
- Body: Render TemplateDetail component directly (it handles both edit form and read-only view based on userRole)
- No sticky action bar — TemplateDetail has its own Save/Deactivate/Reactivate buttons inline

IMPORTANT: Reuse the existing TemplateDetail component inside the modal body. Just fetch data client-side and pass as props.

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

**Layout:** Single-column (no timeline). Simpler entity.
- Header: prev/next arrows, template name, asset name link, ScheduleStatusBadge
- Body: Render ScheduleDetail component with schedule + pmJobs + userRole

IMPORTANT: Reuse existing ScheduleDetail component.

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
    - Clicking template name in table opens modal (no navigation away)
    - Clicking View on schedule row opens modal (no navigation away)
    - Both modals sync ?view=id to URL
    - Both modals have prev/next navigation
    - TemplateDetail and ScheduleDetail render correctly inside modals
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
5. URL ?view= param syncs on open/close/navigate
6. Prev/next arrows work in all modals
7. Actions within modals (status changes, edits, cancellations) work and refresh data
</verification>

<success_criteria>
- 4 new *ViewModal components created, each following the RequestViewModal pattern
- All table list pages wire modals via viewEntityId state
- URL permalink support with ?view= param on all 4 pages
- Prev/next navigation in all modals
- No TypeScript errors
- All existing detail functionality accessible through modals
</success_criteria>

<output>
After completion, create `.planning/quick/9-implement-modal-view-pattern-on-all-tabl/9-SUMMARY.md`
</output>
