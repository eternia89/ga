---
phase: quick-9
plan: 1
subsystem: ui
tags: [modal, dialog, split-layout, client-side-fetch, supabase, react]

requires:
  - phase: quick-8
    provides: RequestViewModal reference pattern with split layout and sticky action bar

provides:
  - JobViewModal with client-side data fetching, timeline processing, action bar
  - AssetViewModal with client-side data fetching, photo signing, transfer state
  - TemplateViewModal with client-side data fetching, reusing TemplateDetail
  - ScheduleViewModal with client-side data fetching, reusing ScheduleDetail
  - All table list pages wire modals via viewEntityId state pattern
  - URL permalink support with ?view= param on all 4 pages

affects: [jobs, inventory, maintenance]

tech-stack:
  added: []
  patterns:
    - "Modal view pattern: viewEntityId state in table, modal renders outside table, onNavigate for prev/next"
    - "Client-side data replication: server page data fetching logic replicated in modal useCallback for client-side fetch"

key-files:
  created:
    - components/jobs/job-view-modal.tsx
    - components/assets/asset-view-modal.tsx
    - components/maintenance/template-view-modal.tsx
    - components/maintenance/schedule-view-modal.tsx
  modified:
    - components/jobs/job-table.tsx
    - components/jobs/job-columns.tsx
    - app/(dashboard)/jobs/page.tsx
    - components/assets/asset-table.tsx
    - components/assets/asset-columns.tsx
    - app/(dashboard)/inventory/page.tsx
    - components/maintenance/template-list.tsx
    - components/maintenance/template-columns.tsx
    - app/(dashboard)/maintenance/templates/page.tsx
    - components/maintenance/schedule-list.tsx
    - components/maintenance/schedule-columns.tsx
    - app/(dashboard)/maintenance/page.tsx

key-decisions:
  - "JobViewModal replicates full timeline processing client-side (copied from jobs/[id]/page.tsx) since server-side processing cannot be shared"
  - "AssetViewModal reuses existing AssetDetailInfo/AssetDetailActions/AssetTimeline components without modification"
  - "TemplateViewModal and ScheduleViewModal embed their existing Detail components wholesale rather than splitting into panels, keeping the modal simpler"
  - "Removed Edit buttons from job and asset table columns -- editing is now inline in the modal (matches CLAUDE.md rule: detail pages ARE edit pages)"

patterns-established:
  - "All 5 entity tables (requests, jobs, assets, templates, schedules) now use consistent modal view pattern"
  - "Template/schedule name columns use button click handlers instead of Link navigation"

requirements-completed: []

duration: 27min
completed: 2026-03-05
---

# Quick Task 9: Implement Modal View Pattern on All Tables Summary

**4 new view modals (Jobs, Assets, Templates, Schedules) with client-side data fetching, split layouts, prev/next navigation, and URL permalink support -- matching the established RequestViewModal pattern**

## Performance

- **Duration:** 27 min
- **Started:** 2026-03-05T06:26:21Z
- **Completed:** 2026-03-05T06:53:00Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments

- Created JobViewModal with full client-side data fetching, timeline processing, GPS-aware status changes, and action buttons in sticky bar
- Created AssetViewModal with client-side photo URL signing, transfer state management, and reuse of existing detail components
- Created TemplateViewModal and ScheduleViewModal embedding existing detail components with prev/next navigation
- All 4 entity tables now open modals instead of navigating away on View click
- URL ?view= permalink support on all 4 pages (jobs, inventory, templates, schedules)
- Removed separate Edit buttons from job and asset tables (editing is inline in modal)
- Added View button to schedule table actions for all users

## Task Commits

Each task was committed atomically:

1. **Task 1: Create JobViewModal and wire into jobs table** - `83e3b0d` (feat)
2. **Task 2: Create AssetViewModal and wire into inventory table** - `ab7b1b0` (feat)
3. **Task 3: Create TemplateViewModal + ScheduleViewModal and wire into maintenance tables** - `25b8b53` (feat)

## Files Created/Modified

- `components/jobs/job-view-modal.tsx` - Job view modal with client-side data fetching, timeline processing, action bar
- `components/assets/asset-view-modal.tsx` - Asset view modal with client-side data fetching, photo signing, transfer state
- `components/maintenance/template-view-modal.tsx` - Template view modal wrapping TemplateDetail component
- `components/maintenance/schedule-view-modal.tsx` - Schedule view modal wrapping ScheduleDetail component
- `components/jobs/job-table.tsx` - Added initialViewId prop, viewJobId state, wired JobViewModal
- `components/jobs/job-columns.tsx` - Removed Edit button, removed onEdit from meta type
- `app/(dashboard)/jobs/page.tsx` - Added searchParams with view?, passes initialViewId
- `components/assets/asset-table.tsx` - Added initialViewId/currentUserId props, viewAssetId state, wired AssetViewModal
- `components/assets/asset-columns.tsx` - Removed Edit button, removed onEdit from meta type
- `app/(dashboard)/inventory/page.tsx` - Added searchParams with view?, passes initialViewId/currentUserId
- `components/maintenance/template-list.tsx` - Added initialViewId prop, viewTemplateId state, wired TemplateViewModal
- `components/maintenance/template-columns.tsx` - Added onView to meta, changed Name from Link to button
- `app/(dashboard)/maintenance/templates/page.tsx` - Added searchParams with view?
- `components/maintenance/schedule-list.tsx` - Added initialViewId prop, viewScheduleId state, wired ScheduleViewModal
- `components/maintenance/schedule-columns.tsx` - Added onView to meta, View button in actions, template name click handler
- `app/(dashboard)/maintenance/page.tsx` - Added searchParams with view?

## Decisions Made

- **JobViewModal replicates timeline processing client-side:** The job detail page does all data fetching and audit log to timeline event processing server-side. The modal must replicate this logic client-side since it cannot call server components. The processing logic (approval_rejection, completion_rejection, cancellation, approval, etc.) was copied faithfully from jobs/[id]/page.tsx.

- **AssetViewModal reuses existing components without modification:** Rather than splitting AssetDetailInfo/AssetDetailActions into separate panels, the modal passes all the same props the AssetDetailClient passes, including dialog state management (showStatusDialog, showTransferDialog, etc.).

- **Template/Schedule modals embed Detail components wholesale:** Since TemplateDetail and ScheduleDetail already contain their own action buttons, form editing, and content, the modals embed them in a single scrollable body rather than trying to split into two panels. This is simpler and avoids duplicating action logic.

- **Removed Edit buttons:** Per CLAUDE.md "Detail pages ARE edit pages" rule, the View button now opens the modal which has inline editing. Separate Edit buttons in job and asset tables were redundant.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added canManage wrapper for schedule actions**
- **Found during:** Task 3 (Schedule columns update)
- **Issue:** After adding the View button for all users, the Pause/Resume/Deactivate buttons needed to remain gated behind canManage check, but the original code used a single early return
- **Fix:** Wrapped Pause/Resume/Deactivate in a canManage && fragment, keeping View available for all users
- **Files modified:** components/maintenance/schedule-columns.tsx
- **Verification:** TypeScript compiles, build succeeds
- **Committed in:** 25b8b53

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary for correct permission behavior. No scope creep.

## Issues Encountered

None - plan executed smoothly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 5 entity tables now have consistent modal view pattern
- The modal pattern is fully established and can be reused for any future entity types
- Detail pages (/jobs/[id], /inventory/[id], etc.) still exist as standalone pages for direct navigation/bookmarks

## Self-Check: PASSED

- All 4 view modal files exist
- All 3 task commits verified (83e3b0d, ab7b1b0, 25b8b53)
- TypeScript compiles without errors (only pre-existing e2e test error)
- Production build succeeds

---
*Phase: quick-9*
*Completed: 2026-03-05*
