---
phase: 04-requests
plan: 02
subsystem: ui
tags: [tanstack-table, nuqs, react-hook-form, zod, supabase, date-fns, shadcn, lightbox, timeline]

# Dependency graph
requires:
  - phase: 04-requests/04-01
    provides: All 7 request server actions (createRequest, triageRequest, rejectRequest, cancelRequest, getRequestPhotos, deleteMediaAttachment, updateRequest), STATUS_LABELS/STATUS_COLORS/PRIORITY_LABELS/PRIORITY_COLORS constants, RequestWithRelations type, MediaAttachment type, request-schema validations, Combobox component, ScrollArea/Breadcrumb components

provides:
  - Request list page at /requests with role-based filtering (own requests for general_user, all company for other roles)
  - URL-synced filter bar via nuqs (status, priority, category, date range, search, My Assigned)
  - 9-column DataTable with RequestStatusBadge, RequestPriorityBadge pills
  - Triage dialog with Combobox (category/PIC) + Select (priority) + read-only request info + photo thumbnails
  - Reject dialog with required reason textarea (max 1000 chars)
  - Cancel dialog simple confirmation
  - PhotoLightbox fullscreen viewer with Escape/click-outside to close, native pinch-to-zoom
  - Request detail page at /requests/[id] with two-column layout (info left, timeline right)
  - Breadcrumb navigation (Requests > display_id)
  - RequestTimeline: vertical timeline from audit_logs with event icons and dd-MM-yyyy, HH:mm:ss timestamps
  - Inline triage form for GA Lead/Admin on submitted requests (no separate modal needed on detail page)
  - RequestEditForm: description + location + photo management for requester while status=New
  - Context-sensitive action buttons per role and status
  - Sidebar Requests nav item activated (built: true)

affects: [04-03, 05-jobs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - URL-synced filters via nuqs useQueryStates with filterParsers exported for shared use between RequestFilters and RequestTable
    - Client-side filtering in RequestTable: data fetched server-side, filtered client-side by URL params (status, priority, category, date range, search, assigned)
    - Audit log event classification: INSERT=created, UPDATE with rejection_reason=rejection, UPDATE with status=cancelled=cancellation, UPDATE with category_id/priority/assigned_to=triage, UPDATE with status=status_change, other UPDATE=field_update
    - RequestDetailClient wrapper coordinates edit state between server-component page and client-component info/actions
    - PhotoLightbox: fixed overlay z-50, Escape key listener via useEffect cleanup, click-outside via overlay onClick, image onClick stops propagation
    - Inline triage on detail page: GA Lead sees editable form on submitted requests rather than separate dialog

key-files:
  created:
    - app/(dashboard)/requests/page.tsx
    - app/(dashboard)/requests/[id]/page.tsx
    - components/requests/request-status-badge.tsx
    - components/requests/request-priority-badge.tsx
    - components/requests/request-photo-lightbox.tsx
    - components/requests/request-columns.tsx
    - components/requests/request-filters.tsx
    - components/requests/request-table.tsx
    - components/requests/request-triage-dialog.tsx
    - components/requests/request-reject-dialog.tsx
    - components/requests/request-cancel-dialog.tsx
    - components/requests/request-timeline.tsx
    - components/requests/request-detail-info.tsx
    - components/requests/request-detail-actions.tsx
    - components/requests/request-detail-client.tsx
    - components/requests/request-edit-form.tsx
  modified:
    - components/sidebar.tsx

key-decisions:
  - "Requests list uses client-side filtering (not server-side re-query) to avoid full page refresh on each filter change — data fetched once server-side, filtered in-memory via nuqs URL state"
  - "Detail page audit log processing: category/pic names resolved via additional DB lookups inside the log processing loop (acceptable for small number of triage events)"
  - "RequestDetailClient is a client component wrapper that coordinates edit state between the server component page and the client components below it — avoiding lifting state to server"
  - "Sidebar Requests nav item activated — the request submission+listing+detail+triage workflow is now fully functional"

patterns-established:
  - "filterParsers exported from request-filters.tsx and shared with request-table.tsx for consistent URL state parsing"
  - "Two-column detail layout: grid-cols-1 lg:grid-cols-[1fr,380px] gap-6 — left info, right timeline, stacks below lg"
  - "Inline triage pattern: GA Lead sees editable triage form directly on detail page (no dialog needed)"
  - "Timeline event classification from audit_logs: process in order (rejection check first, then cancellation, then triage, then status_change, then field_update)"

# Metrics
duration: 8min
completed: 2026-02-19
---

# Phase 4 Plan 02: Request List and Triage UI Summary

**Full request lifecycle UI: 9-column filterable DataTable at /requests, triage/reject/cancel dialogs with Combobox/Select fields, PhotoLightbox, and /requests/[id] detail page with audit_log timeline, inline triage form for GA Lead, and requester edit form**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-19T08:48:44Z
- **Completed:** 2026-02-19T08:56:09Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Built end-to-end request management UI covering the full Phase 4 scope (REQ-REQ-001 through REQ-REQ-007)
- Implemented URL-synced filter bar with 7 filter dimensions (status, priority, category, date range, search, My Assigned)
- Built audit_log-driven timeline that classifies events into 6 types with icons, formatted timestamps, and inline details

## Task Commits

Each task was committed atomically:

1. **Task 1: Request list page with filters, triage/reject/cancel dialogs** - `4430e2d` (feat)
2. **Task 2: Request detail page with timeline, inline triage, and edit form** - `0adb466` (feat)

## Files Created/Modified

- `app/(dashboard)/requests/page.tsx` - Server component, role-based request query, passes data to RequestTable
- `app/(dashboard)/requests/[id]/page.tsx` - Server component, fetches request + photos + audit_logs, processes timeline events
- `components/requests/request-status-badge.tsx` - Pill badge using STATUS_COLORS and STATUS_LABELS
- `components/requests/request-priority-badge.tsx` - Pill badge using PRIORITY_COLORS and PRIORITY_LABELS, renders "—" for null
- `components/requests/request-photo-lightbox.tsx` - Fixed overlay lightbox, Escape/click-outside to close, native pinch-to-zoom
- `components/requests/request-columns.tsx` - 9 TanStack Table column definitions with context-sensitive actions menu
- `components/requests/request-filters.tsx` - nuqs URL-synced filter bar (7 filters), debounced search input
- `components/requests/request-table.tsx` - Client table wrapper: filter logic, dialog state, row click navigation
- `components/requests/request-triage-dialog.tsx` - Triage modal with read-only info section + Combobox/Select triage form
- `components/requests/request-reject-dialog.tsx` - AlertDialog with required reason textarea (react-hook-form + zodResolver)
- `components/requests/request-cancel-dialog.tsx` - Simple AlertDialog confirmation
- `components/requests/request-timeline.tsx` - Vertical timeline with 6 event types, ScrollArea, formatted timestamps
- `components/requests/request-detail-info.tsx` - Shows description/location/photos, inline triage form for GA Lead, read-only triage fields for others
- `components/requests/request-detail-actions.tsx` - Context-sensitive buttons (Edit/Cancel for requester, Triage/Reject for GA Lead)
- `components/requests/request-detail-client.tsx` - Client wrapper coordinating edit state between server page and client components
- `components/requests/request-edit-form.tsx` - Edit form for requester: description + location combobox + photo add/remove
- `components/sidebar.tsx` - Requests nav item changed to `built: true`

## Decisions Made

- Client-side filtering chosen over server-side re-query to avoid full page refresh; acceptable since requests list is company-scoped and page loads quickly
- Audit log processing resolves category and PIC names via additional DB lookups inside the detail page server component — acceptable for the small number of triage events per request
- Inline triage pattern on detail page instead of always requiring the list-page dialog, matching CONTEXT.md locked decision

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Lint shows `<img>` warnings in components using blob: URLs or Supabase signed URLs — same pre-existing pattern from Phase 4 Plan 1 (`request-photo-upload.tsx`). `next/image` does not support blob: or opaque external URLs; native `<img>` is correct here. No new errors introduced; 28 pre-existing errors from Phase 3 files remain unchanged.

## User Setup Required

None - no external service configuration required. (DB migration must be pushed from 04-01 — pending user action noted in 04-01-SUMMARY.)

## Next Phase Readiness

- Full Phase 4 request lifecycle UI complete: submit (04-01), list/filter/triage/reject/cancel, detail view with timeline
- Plan 04-03 can proceed with any remaining Phase 4 cleanup or Phase 5 (Jobs) can begin
- All server actions from 04-01 are wired to real UI — triage, reject, cancel, update, deleteMediaAttachment all integrated

## Self-Check: PASSED

All 17 files verified to exist. Both task commits (4430e2d, 0adb466) verified in git log. TypeScript compiles clean. Build succeeds with routes /requests and /requests/[id].

---
*Phase: 04-requests*
*Completed: 2026-02-19*
