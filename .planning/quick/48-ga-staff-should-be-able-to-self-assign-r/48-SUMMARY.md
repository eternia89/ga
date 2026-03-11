---
phase: quick-48
plan: 01
subsystem: auth-rbac, requests, jobs
tags: [permissions, ga-staff, triage, self-assign, rls]
dependency_graph:
  requires: []
  provides: [ga-staff-triage, ga-staff-job-create]
  affects: [requests, jobs, permissions]
tech_stack:
  added: []
  patterns: [direct-role-check, picOptions-filtering]
key_files:
  created:
    - supabase/migrations/00019_ga_staff_permissions.sql
  modified:
    - lib/auth/permissions.ts
    - app/actions/request-actions.ts
    - app/actions/job-actions.ts
    - components/requests/request-detail-actions.tsx
    - components/requests/request-detail-info.tsx
    - app/(dashboard)/jobs/page.tsx
decisions:
  - "No REQUEST_SELF_ASSIGN permission constant — enforcement is via direct profile.role === 'ga_staff' checks in action body (not hasPermission()), avoids dead code"
  - "picOptions computed client-side from existing userOptions — no server re-query needed"
  - "ga_staff default assigned_to pre-filled to currentUserId for frictionless triage UX"
metrics:
  duration: 8min
  completed: 2026-03-11
  tasks_completed: 2
  files_modified: 6
---

# Quick Task 48: GA Staff Self-Assign Triage and Job Create Summary

**One-liner:** GA Staff can self-assign submitted requests as PIC and create new jobs, with server-enforced role guards and UI-restricted PIC dropdown showing only themselves.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Permissions, actions, and RLS migration | c415b94 | permissions.ts, request-actions.ts, job-actions.ts, 00019 migration |
| 2 | UI guards — request detail triage and jobs page CTA | 12ea9c5 | request-detail-actions.tsx, request-detail-info.tsx, jobs/page.tsx |

## What Was Built

### Server-side enforcement (Task 1)
- `lib/auth/permissions.ts`: Added `JOB_CREATE` and `JOB_ASSIGN` to `ga_staff` role. No `REQUEST_SELF_ASSIGN` constant — enforcement uses direct `profile.role === 'ga_staff'` checks per plan spec.
- `app/actions/request-actions.ts` — `triageRequest`: Two-branch role check allows `ga_staff` alongside `ga_lead`/`admin`. GA Staff branch enforces: (1) `request.status === 'submitted'` only, (2) `assigned_to === profile.id` only.
- `app/actions/job-actions.ts` — `createJob`: Role array expanded from `['ga_lead', 'admin']` to `['ga_lead', 'admin', 'ga_staff']`.
- `supabase/migrations/00019_ga_staff_permissions.sql`: Drops old `job_requests_insert_lead_admin` policy, creates `job_requests_insert_lead_admin_staff` to include `ga_staff` in INSERT WITH CHECK. Applied via `supabase db push`.

### UI guards (Task 2)
- `request-detail-actions.tsx`: Added `isGaStaff` variable. `canTriage` updated to OR-combine GA Lead/Admin (submitted+triaged) with GA Staff (submitted only). `canReject` unchanged (GA Lead/Admin only).
- `request-detail-info.tsx`: Same `isGaStaff` + `canTriage` split. Added `picOptions` filtering — GA Staff sees only themselves in PIC Combobox. Both triage form instances (isEditable branch + main view branch) use `picOptions`. Default `assigned_to` pre-fills `currentUserId` for GA Staff.
- `jobs/page.tsx`: `JobCreateDialog` CTA guard expanded from `['ga_lead', 'admin']` to `['ga_lead', 'admin', 'ga_staff']`.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files created/modified verified in git log:
- `c415b94` — permissions.ts, request-actions.ts, job-actions.ts, 00019 migration
- `12ea9c5` — request-detail-actions.tsx, request-detail-info.tsx, jobs/page.tsx
- Migration 00019 applied: `supabase db push` completed with "Finished supabase db push."
- `npm run build` passed with zero TypeScript errors
