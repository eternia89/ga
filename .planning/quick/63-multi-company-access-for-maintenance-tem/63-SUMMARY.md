---
phase: quick-63
plan: 01
subsystem: maintenance
tags: [rls, multi-company, maintenance-templates, maintenance-schedules, server-actions]
dependency_graph:
  requires: [supabase/migrations/00020_rls_multi_company_access.sql, public.user_company_access]
  provides: [multi-company read access for maintenance_templates and maintenance_schedules]
  affects: [app/(dashboard)/maintenance/page.tsx, app/(dashboard)/maintenance/templates/page.tsx, app/(dashboard)/maintenance/templates/[id]/page.tsx, app/(dashboard)/maintenance/schedules/[id]/page.tsx, app/actions/template-actions.ts, app/actions/schedule-actions.ts]
tech_stack:
  added: []
  patterns: [user_company_access OR clause in RLS SELECT policy, .in('company_id', allAccessibleCompanyIds) for multi-company reads]
key_files:
  created:
    - supabase/migrations/00021_rls_maintenance_multi_company.sql
  modified:
    - app/(dashboard)/maintenance/page.tsx
    - app/(dashboard)/maintenance/templates/page.tsx
    - app/(dashboard)/maintenance/templates/[id]/page.tsx
    - app/(dashboard)/maintenance/schedules/[id]/page.tsx
    - app/actions/template-actions.ts
    - app/actions/schedule-actions.ts
decisions:
  - Migration 00021 follows exact pattern from 00020: DROP IF EXISTS + CREATE POLICY with user_company_access OR clause + deleted_at IS NULL
  - Detail pages fetch company name using the record's company_id (not profile.company_id) to display correct company for cross-company records
  - Mutation actions (create, update, deactivate, activate, delete) retain .eq('company_id', profile.company_id) — multi-company access is read-only
metrics:
  duration: "4 min"
  completed: "2026-03-13"
  tasks: 1
  files: 7
---

# Phase quick-63 Plan 01: Multi-Company Access for Maintenance Summary

**One-liner:** RLS SELECT policy expansion and app-level `.in()` query updates for maintenance_templates and maintenance_schedules, matching migration 00020's user_company_access pattern.

## What Was Built

Extended multi-company read access to maintenance templates and schedules, closing an oversight from migration 00020 that covered requests, jobs, and inventory_items but missed the maintenance tables.

### Migration 00021

`supabase/migrations/00021_rls_maintenance_multi_company.sql` drops the original single-company SELECT policies (`maintenance_templates_select`, `maintenance_schedules_select`) and replaces them with expanded policies that allow reads from primary company OR any company the user has an entry for in `user_company_access`, with `deleted_at IS NULL` soft-delete guard.

### App-Level Query Updates

**`app/(dashboard)/maintenance/page.tsx`** (schedules list):
- Moved `companyAccessRows` / `allAccessibleCompanyIds` computation before the schedules query
- Changed schedules list query, templates-for-create query, and assets-for-create query from `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`

**`app/(dashboard)/maintenance/templates/page.tsx`** (templates list):
- Changed main templates query from `.eq()` to `.in('company_id', allAccessibleCompanyIds)`

**`app/(dashboard)/maintenance/templates/[id]/page.tsx`** (template detail):
- Added `companyAccessRows` / `allAccessibleCompanyIds` computation
- Changed template fetch from `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
- Fixed company name fetch to use `templateData.company_id` instead of `profile.company_id`

**`app/(dashboard)/maintenance/schedules/[id]/page.tsx`** (schedule detail):
- Added `companyAccessRows` / `allAccessibleCompanyIds` computation
- Changed schedule fetch from `.eq('company_id', profile.company_id)` to `.in('company_id', allAccessibleCompanyIds)`
- Fixed company name fetch to use `scheduleRaw.company_id` instead of `profile.company_id`

**`app/actions/template-actions.ts`**:
- `getTemplates`: fetches `user_company_access`, uses `.in('company_id', allAccessibleCompanyIds)`
- `getTemplateById`: fetches `user_company_access`, uses `.in('company_id', allAccessibleCompanyIds)`

**`app/actions/schedule-actions.ts`**:
- `getSchedules`: fetches `user_company_access`, uses `.in('company_id', allAccessibleCompanyIds)`
- `getSchedulesByAssetId`: fetches `user_company_access`, uses `.in('company_id', allAccessibleCompanyIds)`

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- Migration 00021 follows exact DROP IF EXISTS + CREATE POLICY pattern from 00020
- `grep -c "allAccessibleCompanyIds"` confirmed: maintenance/page.tsx (5), templates/page.tsx (3), templates/[id]/page.tsx (2), schedules/[id]/page.tsx (2), template-actions.ts (4), schedule-actions.ts (4)
- All mutation actions retain `.eq('company_id', profile.company_id)` — 9 occurrences confirmed
- `npm run build` passes with no TypeScript errors

## Self-Check: PASSED

- Migration file exists: supabase/migrations/00021_rls_maintenance_multi_company.sql — FOUND
- Commit b7a724e exists — FOUND
- Build output confirms all 4 maintenance routes render as dynamic server routes: /maintenance, /maintenance/schedules/[id], /maintenance/templates, /maintenance/templates/[id]
