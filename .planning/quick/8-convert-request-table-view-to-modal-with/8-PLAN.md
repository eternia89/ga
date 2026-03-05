---
phase: quick-8
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-view-modal.tsx
  - components/requests/request-columns.tsx
  - components/requests/request-table.tsx
  - app/(dashboard)/requests/page.tsx
autonomous: false
requirements: [QUICK-8]

must_haves:
  truths:
    - "Clicking 'View' on a request table row opens an extra-large modal dialog instead of navigating away"
    - "Modal has three tabs: Details, Photos, and Timeline"
    - "Details tab shows request info with inline editing (same behavior as detail page)"
    - "Photos tab shows photo gallery with upload capability for editable requests"
    - "Timeline tab shows activity timeline identical to the detail page"
    - "Modal URL syncs with ?view=requestId query param for permalink support"
    - "Sticky action bar at bottom of modal shows role-appropriate action buttons"
    - "Action buttons that need extra input (reject reason, triage assignment) open nested sub-dialogs"
    - "Existing /requests/[id] detail page still works for direct URL access"
  artifacts:
    - path: "components/requests/request-view-modal.tsx"
      provides: "Main modal component with tabs, data fetching, action bar, URL sync"
      min_lines: 200
  key_links:
    - from: "components/requests/request-table.tsx"
      to: "components/requests/request-view-modal.tsx"
      via: "onView handler opens modal with request ID"
      pattern: "setViewRequestId"
    - from: "components/requests/request-view-modal.tsx"
      to: "createClient (supabase/client)"
      via: "client-side fetch of full request detail when modal opens"
      pattern: "supabase.*from.*requests.*select"
    - from: "app/(dashboard)/requests/page.tsx"
      to: "components/requests/request-view-modal.tsx"
      via: "URL query param ?view= triggers modal auto-open on page load"
      pattern: "view.*requestId"
---

<objective>
Convert request table row "View" action from navigating to /requests/[id] to opening an extra-large modal dialog with tabbed sections (Details/Edit, Photos, Timeline), a sticky action bar with role-based buttons, and URL query param sync for permalinks. This is a proof-of-concept pattern for future application to Jobs, Assets, Templates, and Schedules.

Purpose: Faster request review workflow — users stay on the list page, see full details in a modal, and take actions without navigating away.
Output: A new RequestViewModal component wired into the request table, replacing navigation with modal interaction.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@components/requests/request-columns.tsx
@components/requests/request-table.tsx
@components/requests/request-detail-client.tsx
@components/requests/request-detail-info.tsx
@components/requests/request-detail-actions.tsx
@components/requests/request-timeline.tsx
@components/requests/request-edit-form.tsx
@components/requests/request-triage-dialog.tsx
@components/requests/request-reject-dialog.tsx
@components/requests/request-cancel-dialog.tsx
@components/requests/request-acceptance-dialog.tsx
@components/requests/request-feedback-dialog.tsx
@components/requests/request-photo-lightbox.tsx
@components/jobs/job-preview-dialog.tsx
@components/ui/dialog.tsx
@components/ui/tabs.tsx
@app/(dashboard)/requests/page.tsx
@app/(dashboard)/requests/[id]/page.tsx
@lib/types/database.ts

<interfaces>
From lib/types/database.ts:
```typescript
export type RequestWithRelations = Request & {
  location: { name: string } | null;
  category: { name: string } | null;
  requester: { name: string; email: string } | null;
  assigned_user: { name: string; email: string } | null;
  division: { name: string } | null;
};
```

From components/requests/request-timeline.tsx:
```typescript
export type TimelineEvent = {
  type: 'created' | 'status_change' | 'triage' | 'field_update' | 'rejection' | 'cancellation' | 'acceptance' | 'acceptance_rejection' | 'auto_acceptance' | 'feedback';
  at: string;
  by: string;
  details?: Record<string, unknown>;
};
export function RequestTimeline({ events }: { events: TimelineEvent[] }): JSX.Element;
```

From components/requests/request-table.tsx:
```typescript
export type RequestTableMeta = {
  onTriage?: (request: RequestWithRelations) => void;
  onReject?: (request: RequestWithRelations) => void;
  onCancel?: (request: RequestWithRelations) => void;
  onView?: (request: RequestWithRelations) => void;
  onAccept?: (request: RequestWithRelations) => void;
  onRejectWork?: (request: RequestWithRelations) => void;
  onPhotoClick?: (photos: PhotoItem[], index: number) => void;
  photosByRequest?: Record<string, PhotoItem[]>;
  currentUserId?: string;
  currentUserRole?: string;
};
```

From app/actions/request-actions.ts (server actions):
```typescript
export const updateRequest = authActionClient...
export const triageRequest = authActionClient...
export const cancelRequest = authActionClient...
export const rejectRequest = authActionClient...
export const acceptRequest = authActionClient...
export const rejectCompletedWork = authActionClient...
export const submitFeedback = authActionClient...
export const getRequestPhotos = authActionClient...
export const deleteMediaAttachment = authActionClient...
```

From components/ui/dialog.tsx:
```typescript
export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger }
// DialogContent accepts className for size override, showCloseButton prop
// Default max-w-lg; override with className="max-w-6xl"
```

From components/ui/tabs.tsx:
```typescript
export { Tabs, TabsList, TabsTrigger, TabsContent }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create RequestViewModal with tabbed layout and data fetching</name>
  <files>components/requests/request-view-modal.tsx</files>
  <action>
Create a new `RequestViewModal` component in `components/requests/request-view-modal.tsx`. This is the largest piece of work. Follow the JobPreviewDialog pattern (client-side Supabase fetch on open) but with much richer content.

**Props interface:**
```typescript
interface RequestViewModalProps {
  requestId: string | null;         // null = closed
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
  users: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
}
```

**Data fetching (client-side, on open):**
When `requestId` is non-null and modal opens, use `createClient()` from `@/lib/supabase/client` to fetch:
1. Full request with relations (same select as `requests/[id]/page.tsx`):
   `*, location:locations(name), category:categories(name), requester:user_profiles!requester_id(name:full_name, email), assigned_user:user_profiles!assigned_to(name:full_name, email), division:divisions(name)`
2. Locations for edit form: `locations` table, filtered by request's company_id
3. Photos via `getRequestPhotos` server action (same as current detail page)
4. Audit logs from `audit_logs` table for timeline events -- process into TimelineEvent[] using the same logic as `requests/[id]/page.tsx` (extract the audit log processing into a helper function `buildTimelineEvents` at the top of the file or inline it)
5. Linked jobs via `job_requests` join table

Use Promise.all for parallel fetching. Show Skeleton loading state while fetching (same pattern as JobPreviewDialog).

**Modal structure:**
- `Dialog` with `open={!!requestId}` and `onOpenChange`
- `DialogContent` with `className="max-w-6xl max-h-[90vh] flex flex-col p-0"` -- no default padding, we control layout
- Header section (inside modal, not scrollable): display_id (mono), status badge, priority badge, requester info, created date. Match the header from `requests/[id]/page.tsx`. Include rejection reason callout if status is rejected.
- `Tabs` component with 3 tabs:
  - **"Details"** tab (default): Render the exact same content as `RequestDetailInfo` -- reuse that component directly, passing all the same props. This handles both editable mode (requester + submitted status shows RequestEditForm) and read-only mode with inline triage for GA Lead/Admin.
  - **"Photos"** tab: Show photo gallery. If request is editable (requester + submitted), show PhotoUpload component for adding/removing photos. Otherwise show read-only photo grid with lightbox on click.
  - **"Timeline"** tab: Render `RequestTimeline` component with the fetched timeline events.
- Tab content area should be scrollable (`overflow-y-auto flex-1 min-h-0`) while header and action bar stay fixed.

**Sticky action bar (bottom of modal):**
A `div` at the bottom of the modal (outside scroll area) with `className="border-t px-6 py-3 flex items-center justify-between gap-2 shrink-0 bg-background"`. Left side = primary actions, right side = secondary/destructive actions.

Role-based button visibility (same logic as RequestDetailActions):
- **"Triage"** -- visible for ga_lead/admin when status is submitted/triaged. Scrolls to triage section in Details tab (same as current detail page behavior).
- **"Reject"** -- visible for ga_lead/admin when status is submitted/triaged. Opens RequestRejectDialog as nested sub-dialog.
- **"Cancel Request"** -- visible for requester when status is submitted. Opens RequestCancelDialog as nested sub-dialog.
- **"Accept Work"** -- visible for requester/admin when status is pending_acceptance. Opens RequestAcceptanceDialog in accept mode.
- **"Reject Work"** -- visible for requester/admin when status is pending_acceptance. Opens RequestAcceptanceDialog in reject mode.
- **"Give Feedback"** -- visible for requester when status is accepted and no feedback yet. Opens RequestFeedbackDialog.
- **"Close"** button (outline variant) always visible on the right side.

NOTE: The existing Save/Triage buttons inside RequestDetailInfo and RequestEditForm handle their own form submission. The action bar focuses on status-change actions only. No separate "Save Changes" button in the action bar for this POC.

All sub-dialogs (reject, cancel, acceptance, feedback) are rendered inside the modal component and open on top of the modal (the existing Dialog components from shadcn handle z-index stacking automatically since each Dialog renders its own portal+overlay).

**URL sync:**
- When modal opens (requestId is set), call `window.history.replaceState(null, '', '?view=' + requestId)` to update the URL without navigation.
- When modal closes, call `window.history.replaceState(null, '', window.location.pathname)` to remove the query param.
- The list page (page.tsx) will read the initial `?view=` param and pass it as the initial `requestId` to this component.

**Action success handling:**
When any action succeeds (triage, reject, cancel, accept, reject work, feedback), call `router.refresh()` to refresh the server component data, then re-fetch the request data inside the modal to reflect changes. The simplest approach: increment a `refreshKey` state variable on success, and have the useEffect that fetches data depend on it.

**Error/loading states:**
- Loading: Show skeleton matching modal layout (header skeleton + tab skeleton + content skeleton)
- Error: Show error message with retry button
- If request not found (deleted/invalid ID): show "Request not found" and close button

**Important conventions to follow:**
- Desktop-first responsive: use `max-*` breakpoints. On mobile (`max-md:`), make modal full-screen.
- Date format: `dd-MM-yyyy` via date-fns format
- Persistent feedback: use InlineFeedback, no auto-dismiss
- All existing sub-dialog components (RequestRejectDialog, RequestCancelDialog, RequestAcceptanceDialog, RequestFeedbackDialog) should be reused as-is
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -50</automated>
  </verify>
  <done>
    RequestViewModal component exists at components/requests/request-view-modal.tsx. It compiles without TypeScript errors. It renders a max-w-6xl dialog with three tabs (Details, Photos, Timeline), a sticky action bar with role-based buttons, client-side data fetching on open, loading skeletons, error handling, and URL sync via window.history.replaceState.
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire modal into request table and list page with URL param support</name>
  <files>components/requests/request-columns.tsx, components/requests/request-table.tsx, app/(dashboard)/requests/page.tsx</files>
  <action>
**1. Simplify request-columns.tsx actions column:**
Replace ALL row action buttons (View, Triage, Accept, Reject Work, Reject, Cancel) with a SINGLE "View" button. Remove the role-based action logic from the columns -- all actions now live in the modal's action bar.

The actions cell should be:
```tsx
{
  id: 'actions',
  cell: ({ row, table }) => {
    const meta = table.options.meta as RequestTableMeta | undefined;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          meta?.onView?.(row.original);
        }}
      >
        View
      </Button>
    );
  },
  size: 80,
}
```

Update `RequestTableMeta` type: remove `onTriage`, `onReject`, `onCancel`, `onAccept`, `onRejectWork` callbacks -- only keep `onView`, `onPhotoClick`, `photosByRequest`, `currentUserId`, `currentUserRole`.

**2. Update request-table.tsx:**
- Remove all dialog state management for triage, reject, cancel, acceptance (all that was lines 46-61 in the current file). Remove the handler functions (handleTriage, handleReject, handleCancel, handleAccept, handleRejectWork). Remove all the dialog component renders at the bottom (RequestTriageDialog, RequestRejectDialog, RequestCancelDialog, RequestAcceptanceDialog).
- Keep: filters, feedback state, lightbox state, photo click handler.
- Add: `viewRequestId` state (`string | null`, default `null`). Initialize from `initialViewId` prop if provided. The `handleView` function sets `setViewRequestId(request.id)` instead of `router.push`.
- Add: Accept new prop `initialViewId?: string` for URL param support.
- Import and render `RequestViewModal` at the bottom:
  ```tsx
  <RequestViewModal
    requestId={viewRequestId}
    onOpenChange={(open) => { if (!open) setViewRequestId(null); }}
    categories={categories}
    users={users}
    currentUserId={currentUserId}
    currentUserRole={currentUserRole}
  />
  ```
- On modal action success, set feedback message and call `router.refresh()`.
- Remove unused imports (RequestTriageDialog, RequestRejectDialog, RequestCancelDialog, RequestAcceptanceDialog, getRequestPhotos).

**3. Update request-table.tsx props:**
Add `initialViewId` prop to RequestTableProps. The categories and users props are already passed.

**4. Update app/(dashboard)/requests/page.tsx:**
- Add locations to the parallel data fetch (already fetched on the detail page, now also needed on the list page for the modal):
  ```typescript
  const locationsResult = await supabase
    .from('locations')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .is('deleted_at', null)
    .order('name');
  ```
- Read `searchParams` for `?view=` query param. Pass it as `initialViewId` prop to RequestTable so the modal auto-opens on page load (for permalink support). The page component signature needs to accept searchParams:
  ```typescript
  interface PageProps {
    searchParams: Promise<{ view?: string }>;
  }
  export default async function RequestsPage({ searchParams }: PageProps) {
    const { view } = await searchParams;
    // ...
    <RequestTable ... initialViewId={view} />
  }
  ```
- In RequestTable, accept `initialViewId` prop and use it to initialize `viewRequestId` state: `useState<string | null>(initialViewId ?? null)`.

**5. Clean up unused imports** in request-columns.tsx and request-table.tsx after removing the action handlers and dialog imports.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -50</automated>
  </verify>
  <done>
    Clicking "View" on any request table row opens the RequestViewModal instead of navigating to /requests/[id]. The table actions column shows only a single "View" button. All status-change actions (triage, reject, cancel, accept, reject work, feedback) are available inside the modal's action bar. URL updates to ?view=requestId when modal opens. Navigating to /requests?view=someId auto-opens the modal. The /requests/[id] detail page still works independently.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verify request view modal end-to-end</name>
  <files>n/a</files>
  <action>
    Human verifies the complete request view modal implementation works correctly across all scenarios.
  </action>
  <verify>
    1. Navigate to /requests
    2. Click "View" on any request row -- modal should open (not navigate away)
    3. Verify URL updates to /requests?view=requestId
    4. Check all three tabs render correctly:
       - Details: shows request info, inline editable for own submitted requests, triage form for GA Lead/Admin
       - Photos: shows photo gallery
       - Timeline: shows activity history
    5. Check sticky action bar at bottom shows appropriate buttons for your role
    6. Test an action (e.g., Triage, Reject, Cancel) -- should open sub-dialog on top of modal
    7. Close modal -- URL should revert to /requests
    8. Copy the ?view=requestId URL, open in new tab -- modal should auto-open
    9. Navigate directly to /requests/[id] -- detail page should still work
    10. On mobile viewport (resize browser), verify modal goes full-screen
  </verify>
  <done>User has approved the request view modal implementation.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- `npm run lint` passes
- `npm run build` succeeds
- Request table shows single "View" button per row
- Modal opens with tabs, action bar, URL sync
- /requests/[id] detail page still works
</verification>

<success_criteria>
- Request table rows have single "View" button that opens modal (no page navigation)
- Modal is max-w-6xl with 3 tabs: Details (editable), Photos, Timeline
- Sticky action bar shows role-based buttons matching existing detail page logic
- URL updates with ?view=requestId for permalink support
- Sub-dialogs (reject, cancel, acceptance, feedback, triage) work as nested dialogs
- Existing /requests/[id] page is untouched and functional
- No TypeScript errors, no lint errors, build succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/8-convert-request-table-view-to-modal-with/8-SUMMARY.md`
</output>
