---
phase: 05-jobs-approvals
plan: 07
subsystem: ui
tags: [nextjs, react, typescript, jobs, inline-editing, tailwind]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: job detail page scaffold, job-actions.ts with updateJob/updateJobBudget actions

provides:
  - Inline-editable job detail page (title, description, category, location, priority)
  - Inline budget editing with Pencil toggle in estimated cost panel
  - Edit/Save/Cancel controls for GA Lead/Admin on non-terminal jobs
  - Budget editing moved from actions panel to info panel

affects: [job detail UX, budget approval flow, inline editing pattern for jobs]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Inline field editing: isEditing state toggle reveals form controls in place of read-only text
    - Inline budget editing: separate isBudgetEditing state in cost panel with submit flow
    - Props drilling: page.tsx server component fetches categories/locations, passes through client wrapper

key-files:
  created: []
  modified:
    - components/jobs/job-detail-info.tsx
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-detail-client.tsx
    - app/(dashboard)/jobs/[id]/page.tsx

key-decisions:
  - "Estimated cost panel always visible (not conditioned on cost existence) — shows 'Not set' when null so edit button still accessible"
  - "canEditBudget check mirrors job-detail-actions.tsx condition: (isPIC || isGaLeadOrAdmin) && in_progress && !approved_at"
  - "canEdit for general inline edit: isGaLeadOrAdmin only (not PIC) && non-terminal status — PIC may only update budget"
  - "Combobox used for category and location (large lists); Select for priority (fixed 4 options)"

patterns-established:
  - "Inline edit pattern: isEditing bool + pre-populated edit state + handleEditSave/Cancel + InlineFeedback"
  - "Budget inline edit pattern: separate isBudgetEditing bool in cost panel section"

requirements-completed:
  - REQ-JOB-008
  - REQ-APR-004

# Metrics
duration: 3min
completed: 2026-02-26
---

# Phase 5 Plan 7: Job Detail Inline Editing Summary

**Inline budget editing moved into cost panel; job detail fields (title, description, category, location, priority) become editable for GA Lead/Admin via Edit/Save/Cancel toggle**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-26T03:51:39Z
- **Completed:** 2026-02-26T03:54:30Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Estimated cost section in job-detail-info.tsx now has inline budget editing: click Pencil icon to reveal Rp input + Submit/Cancel; submitting calls updateJobBudget and routes to pending_approval
- Budget input section fully removed from job-detail-actions.tsx (cleaner separation of concerns)
- Edit button appears for GA Lead/Admin on non-terminal jobs; clicking reveals form controls (Input for title, Textarea for description, Combobox for category/location, Select for priority)
- Server component fetches categories and locations in parallel for passing to edit controls
- TypeScript strict mode passes; build succeeds

## Task Commits

Each task was committed atomically:

1. **Task 1: Move budget editing inline and merge view/edit into single page** - `de88b76` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `components/jobs/job-detail-info.tsx` - Rebuilt with inline edit state, budget inline edit, Edit/Save/Cancel toggle, Combobox/Select for category/location/priority
- `components/jobs/job-detail-actions.tsx` - Removed budget section (canEditBudget, budgetAmount state, handleSubmitBudget, Input import, budget JSX)
- `components/jobs/job-detail-client.tsx` - Added categories/locations props, passes them to JobDetailInfo
- `app/(dashboard)/jobs/[id]/page.tsx` - Parallel fetch of categories and locations, passes them to JobDetailClient

## Decisions Made
- Estimated cost panel is always rendered (not conditioned on `job.estimated_cost`) so the edit button is always accessible when canEditBudget is true — shows "Not set" when null
- canEdit is restricted to GA Lead/Admin only (not PIC) for general field editing; PIC retains budget editing only
- Combobox used for category and location (large lists per CLAUDE.md convention); Select for priority (fixed 4-option list)
- `isBudgetEditing` is a separate state from `isEditing` since they operate on different parts of the UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- UAT test 4 gaps (estimated cost inline + view/edit merge) are resolved
- Budget section cleanly removed from actions panel
- Job detail page ready for remaining UAT gap closure plans

---
*Phase: 05-jobs-approvals*
*Completed: 2026-02-26*
