---
phase: 07-preventive-maintenance
plan: 04
subsystem: ui
tags: [pm-checklist, server-actions, save-as-you-go, overdue-badge, supabase-jsonb, next-safe-action]

# Dependency graph
requires:
  - phase: 07-01
    provides: PM job generation cron, maintenance_schedules table, checklist_responses JSONB column on jobs
  - phase: 07-03
    provides: Schedule management types and UI patterns; MaintenanceSchedule type with interval_type
  - phase: 05-jobs-approvals
    provides: Job detail page (job-detail-client.tsx), job-actions.ts, JobWithRelations type

provides:
  - PM job checklist fill-out UI with save-as-you-go for all 6 checklist item types
  - OverdueBadge component (red badge when next_due_at < now and job not complete)
  - PM type badge ("PM") shown in job list and job detail header
  - savePMChecklistItem server action with fetch-modify-replace on checklist_responses JSONB
  - savePMChecklistPhoto, completePMChecklist, advanceFloatingSchedule server actions
  - PMChecklist and PMChecklistItem integrated into Phase 5 job detail page

affects:
  - Phase 8 (cross-cutting concerns, notifications) — PM completion triggers schedule advancement
  - Phase 9 (polish) — PM checklist photo upload (currently read-only display, upload via job photos API)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fetch-modify-replace pattern for JSONB array item updates (checklist_responses)
    - Debounced save-as-you-go (500ms for text/numeric, immediate for checkbox/pass_fail/dropdown)
    - Discriminated union rendering for 6 checklist item types in PMChecklistItem

key-files:
  created:
    - app/actions/pm-job-actions.ts
    - components/maintenance/pm-checklist.tsx
    - components/maintenance/pm-checklist-item.tsx
    - components/maintenance/overdue-badge.tsx
  modified:
    - lib/types/database.ts (added job_type, maintenance_schedule_id, checklist_responses, maintenance_schedule relation to Job/JobWithRelations)
    - lib/types/maintenance.ts (added checklist_completed_at to PMJobChecklist)
    - app/actions/job-actions.ts (added TODO integration hook for advanceFloatingSchedule)
    - app/(dashboard)/jobs/[id]/page.tsx (PM badge, OverdueBadge, maintenance_schedule query)
    - app/(dashboard)/jobs/page.tsx (job_type, maintenance_schedule in query)
    - components/jobs/job-columns.tsx (PM badge, OverdueBadge in title cell)
    - components/jobs/job-detail-client.tsx (PMChecklist rendered for PM jobs)

key-decisions:
  - "savePMChecklistItem uses fetch-modify-replace on checklist_responses JSONB — fetch full PMJobChecklist, find item by item_id, update value + completed_at, write back full object"
  - "advanceFloatingSchedule differentiates fixed vs floating: floating updates next_due_at = now + interval_days on completion, fixed only updates last_completed_at (cron already advanced next_due_at at generation)"
  - "completePMChecklist does NOT change job status — PIC uses normal job status change flow; it only sets checklist_completed_at metadata and validates all items have non-null values"
  - "OverdueBadge is a pure presentational component comparing next_due_at < now at render time — no grace period per RESEARCH.md recommendation"
  - "PM type badge inline in title cell of job-columns.tsx (not a separate column) to keep table compact"
  - "PMChecklistItem photo type is read-only display only — upload goes through existing job photos API route, savePMChecklistPhoto saves URLs only"
  - "PM integration into job-detail-client.tsx: canEdit = (isGaLeadOrAdmin OR isPIC) AND status in ['assigned', 'in_progress']"

patterns-established:
  - "Pattern: fetch-modify-replace for JSONB array updates — fetch parent record, mutate array in memory, write full JSONB column back"
  - "Pattern: debounced save-as-you-go — 500ms debounce for text/numeric inputs, immediate save for discrete controls (checkbox, pass_fail, dropdown)"

requirements-completed:
  - REQ-PM-006
  - REQ-PM-009
  - REQ-PM-010

# Metrics
duration: 4min
completed: 2026-02-25
---

# Phase 7 Plan 04: PM Job Integration Summary

**PM checklist fill-out UI with save-as-you-go for 6 item types, OverdueBadge, PM type badge, and server actions for JSONB checklist saves and floating schedule advancement on job completion**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-25T04:31:46Z
- **Completed:** 2026-02-25T04:36:34Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- PM job server actions: savePMChecklistItem (save-as-you-go per item), savePMChecklistPhoto, completePMChecklist (validates all required), advanceFloatingSchedule (fixed vs floating logic)
- PMChecklist component with progress bar, all-complete success state, read-only mode for completed/cancelled jobs
- PMChecklistItem renders all 6 checklist types: checkbox, pass_fail (Pass/Fail buttons), numeric (input + unit), text (textarea), photo (read-only thumbnails), dropdown (Select)
- OverdueBadge shown in job list title column and job detail header for PM jobs
- PM type badge ("PM") shown in same locations
- Job types database.ts updated with job_type, maintenance_schedule_id, checklist_responses, and maintenance_schedule relation

## Task Commits

1. **Task 1: PM job server actions** - `387c51a` (feat)
2. **Task 2: PM checklist UI, overdue badge, PM type badge** - `3e6f9e7` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `app/actions/pm-job-actions.ts` — 4 server actions: savePMChecklistItem, savePMChecklistPhoto, completePMChecklist, advanceFloatingSchedule
- `components/maintenance/pm-checklist.tsx` — Main checklist component with progress bar and all-complete state
- `components/maintenance/pm-checklist-item.tsx` — Individual item renderer for 6 types with debounced save-as-you-go
- `components/maintenance/overdue-badge.tsx` — Red "Overdue" badge; compares next_due_at < now at render time
- `lib/types/database.ts` — Added job_type, maintenance_schedule_id, checklist_responses to Job; maintenance_schedule relation to JobWithRelations
- `lib/types/maintenance.ts` — Added checklist_completed_at to PMJobChecklist
- `app/actions/job-actions.ts` — Added TODO integration hook for advanceFloatingSchedule in updateJobStatus
- `app/(dashboard)/jobs/[id]/page.tsx` — PM badge, OverdueBadge in header; maintenance_schedule in query
- `app/(dashboard)/jobs/page.tsx` — job_type, maintenance_schedule in list query
- `components/jobs/job-columns.tsx` — PM badge, OverdueBadge in title cell
- `components/jobs/job-detail-client.tsx` — PMChecklist rendered below info panel for PM jobs

## Decisions Made

- **fetch-modify-replace for JSONB:** savePMChecklistItem fetches the full PMJobChecklist, finds the item by item_id, updates value + completed_at, writes back the entire JSONB column. Simple and correct.
- **advanceFloatingSchedule differentiates fixed vs floating:** Floating only — next_due_at = now + interval_days (calculated from completion date, not generation date, per RESEARCH.md Pitfall 2). Fixed only updates last_completed_at.
- **PM job completion hook documented as TODO:** The advanceFloatingSchedule call belongs in job-actions.ts `updateJobStatus` when transitioning to 'completed' for PM jobs. Left as a TODO comment to avoid modifying the completed Phase 5 action file beyond documentation.
- **Photo type: read-only display only in checklist component:** Upload flow uses the existing job photos API route. The PMChecklistItem photo type shows uploaded thumbnails but does not handle file upload itself — that is a separate integration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added job_type, maintenance_schedule_id, checklist_responses to Job type in database.ts**
- **Found during:** Task 1 (PM job server actions)
- **Issue:** Job interface in database.ts had no PM-related fields, making pm-job-actions.ts type-unsafe
- **Fix:** Added job_type, maintenance_schedule_id, checklist_responses fields and maintenance_schedule relation to JobWithRelations
- **Files modified:** lib/types/database.ts
- **Verification:** npx tsc --noEmit passes
- **Committed in:** 387c51a (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added checklist_completed_at to PMJobChecklist type**
- **Found during:** Task 1 (completePMChecklist action)
- **Issue:** completePMChecklist sets a checklist_completed_at timestamp in the JSONB, but the type didn't include that field
- **Fix:** Added optional checklist_completed_at to PMJobChecklist in maintenance.ts
- **Files modified:** lib/types/maintenance.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** 387c51a (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (Rule 2 - missing type fields for correctness)
**Impact on plan:** Both auto-fixes required for type safety. No scope creep.

## Issues Encountered

None — plan executed with minor type additions.

## User Setup Required

None — no external service configuration required. Components are self-contained and ready to use once PM jobs with checklist_responses data exist in the database.

## Next Phase Readiness

- PM checklist UI complete and integrated into Phase 5 job detail page
- OverdueBadge and PM type badge visible in job list and detail
- advanceFloatingSchedule ready to wire into updateJobStatus when PM job completion flow is confirmed
- **Integration hook needed:** Add `await advanceFloatingSchedule({ jobId })` call in job-actions.ts `updateJobStatus` when `parsedInput.status === 'completed' && job.job_type === 'preventive_maintenance'`
- Phase 8 (media, notifications, dashboard) can now show PM job overdue counts and PM completion events

## Self-Check: PASSED

All created files verified present. All task commits (387c51a, 3e6f9e7) verified in git log.

---
*Phase: 07-preventive-maintenance*
*Completed: 2026-02-25*
