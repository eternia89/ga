---
phase: 09-polish-integration
plan: 01
subsystem: database, api, ui
tags: [geolocation, gps, supabase, rls, react-hooks, job-status]

# Dependency graph
requires:
  - phase: 05-jobs-approvals
    provides: jobs table, updateJobStatus action, JobTimeline component, job-detail-actions
  - phase: 01-database-schema-supabase-setup
    provides: RLS helper functions (current_user_company_id), companies/jobs/user_profiles tables

provides:
  - job_status_changes table with GPS columns and RLS policies (migration 00011)
  - useGeolocation hook with blocking GPS capture and user-friendly error messages
  - entity-routes constant mapping 14+ DB table names to application routes
  - GPS-integrated job status change workflow (Start Work, Mark Complete require GPS)
  - Google Maps links in job timeline for each status change with GPS coordinates
  - JobStatusChange TypeScript type in database.ts

affects:
  - 09-02-audit-trail (uses ENTITY_ROUTES for entity clickable links in audit viewer)
  - Future phases using job status changes

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "GPS blocking pattern: capture coordinates before server action, reject action on GPS denial"
    - "Job status change audit: INSERT into job_status_changes after updating jobs.status"
    - "GPS timeline enrichment: fetch job_status_changes and correlate to audit_log events by from_status->to_status key"

key-files:
  created:
    - supabase/migrations/00011_job_status_changes.sql
    - hooks/use-geolocation.ts
    - lib/constants/entity-routes.ts
  modified:
    - lib/types/database.ts
    - app/actions/job-actions.ts
    - components/jobs/job-detail-actions.tsx
    - components/jobs/job-timeline.tsx
    - app/(dashboard)/jobs/[id]/page.tsx

key-decisions:
  - "GPS capture is blocking: status change action is not called if GPS fails (permission denied, timeout, unavailable)"
  - "GPS stored with optional columns (latitude, longitude, gps_accuracy nullable) — job page and timeline handle null gracefully"
  - "Timeline GPS correlation uses from_status->to_status key, keeping latest record per pair for jobs with repeated transitions"
  - "useGeolocation hook uses timeout:15000 and maximumAge:60000 — 15 second timeout, 1 minute cached position acceptable"
  - "ENTITY_ROUTES maps settings entities (companies, divisions, locations, categories) to /admin/settings base path since they have no individual detail pages"

patterns-established:
  - "GPS blocking before server action: await capturePosition() in handler, show error and return early on failure before setSubmitting(true)"
  - "Geolocation hook: useState for capturing/error, useCallback for capturePosition, Promise-based API"

requirements-completed:
  - REQ-JOB-010

# Metrics
duration: 8min
completed: 2026-02-25
---

# Phase 9 Plan 01: GPS Infrastructure for Job Status Changes

**GPS-tracked job status transitions with blocking capture via useGeolocation hook, job_status_changes table with RLS, and Google Maps links in job timeline**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-02-25T00:00:00Z
- **Completed:** 2026-02-25
- **Tasks:** 2 of 2
- **Files modified:** 9 (4 created, 5 modified)

## Accomplishments
- Created migration 00011 with `job_status_changes` table (GPS columns, RLS policies) following established migration patterns
- Built `useGeolocation` hook with Promise-based API, 15s timeout, and user-friendly error messages for all error codes
- Created `ENTITY_ROUTES` constant and `getEntityRoute()` function mapping all 14+ domain tables to application routes
- Integrated GPS capture as a blocking step in Start Work and Mark Complete actions in `JobDetailActions`
- Extended `updateJobStatus` server action to accept and persist GPS coordinates to `job_status_changes`
- Added Google Maps links in `JobTimeline` for status change events that have GPS coordinates

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration, useGeolocation hook, entity routes, and JobStatusChange type** - `42c3a31` (feat)
2. **Task 2: Integrate GPS capture into job status workflow and timeline** - `fc03d22` (feat)

**Plan metadata:** (committed with SUMMARY.md)

## Files Created/Modified
- `supabase/migrations/00011_job_status_changes.sql` - job_status_changes table with GPS columns, indexes, and RLS policies
- `hooks/use-geolocation.ts` - Custom React hook with capturePosition Promise API and full error message coverage
- `lib/constants/entity-routes.ts` - ENTITY_ROUTES map and getEntityRoute() for 14+ DB tables
- `lib/types/database.ts` - Added JobStatusChange interface
- `app/actions/job-actions.ts` - Extended updateJobStatus schema with lat/lng/gpsAccuracy, INSERT into job_status_changes
- `components/jobs/job-detail-actions.tsx` - useGeolocation hook integration, GPS blocking before Start Work/Mark Complete
- `components/jobs/job-timeline.tsx` - MapPin Google Maps link for status change events with GPS data, latitude/longitude on JobTimelineEvent type
- `app/(dashboard)/jobs/[id]/page.tsx` - Fetch job_status_changes in parallel, correlate GPS data to timeline events

## Decisions Made
- GPS capture is blocking: if capturePosition() throws, the status change action is NOT called. This implements the CONTEXT.md decision strictly.
- GPS columns are nullable in the DB schema and optional in the action schema — existing status changes (created before this plan) won't have GPS data, handled gracefully.
- Timeline GPS correlation uses a `from_status->to_status` string key map. For jobs with repeated transitions (e.g., in_progress → pending_approval → in_progress multiple times), the latest GPS record per pair is kept.
- `useGeolocation` uses `enableHighAccuracy: true`, 15s timeout, 1-minute cached position acceptable for field workers moving short distances.

## Deviations from Plan

None - plan executed exactly as written. Both tasks were straightforward implementations with no blocking issues discovered.

## Issues Encountered
None.

## User Setup Required
None for client-side code. The migration `00011_job_status_changes.sql` needs to be pushed to Supabase:
- Run `supabase db push` to apply the new table (or push it via the Supabase Dashboard SQL editor)

This is documented in STATE.md Pending Todos.

## Next Phase Readiness
- ENTITY_ROUTES ready for Phase 9 Plan 02 (audit trail viewer) to use for clickable entity links
- job_status_changes table ready to receive GPS inserts once migration is pushed to Supabase
- GPS blocking pattern established for job status changes; future plans can follow same pattern

---
*Phase: 09-polish-integration*
*Completed: 2026-02-25*
