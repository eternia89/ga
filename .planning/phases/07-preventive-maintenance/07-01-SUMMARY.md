---
phase: 07-preventive-maintenance
plan: 01
subsystem: maintenance-data-layer
tags: [database, typescript, server-actions, validation, cron, jsonb]
dependency_graph:
  requires: [06-inventory, 05-jobs-approvals, 03-admin-system-configuration]
  provides: [maintenance-types, maintenance-schemas, template-actions, schedule-actions, pm-migration]
  affects: [asset-actions, jobs-table, maintenance_schedules-table, maintenance_templates-table]
tech_stack:
  added: []
  patterns: [authActionClient, discriminated-union-zod, security-definer-sql, auto-pause-resume-helpers]
key_files:
  created:
    - supabase/migrations/00010_pm_phase7.sql
    - lib/types/maintenance.ts
    - lib/constants/checklist-types.ts
    - lib/constants/schedule-status.ts
    - lib/validations/template-schema.ts
    - lib/validations/schedule-schema.ts
    - app/actions/template-actions.ts
    - app/actions/schedule-actions.ts
  modified:
    - app/actions/asset-actions.ts
decisions:
  - "generate_pm_jobs cron registration is commented out — pg_cron extension must be enabled in Supabase Dashboard manually before the SELECT cron.schedule() line can be executed"
  - "pauseSchedulesForAsset, resumeSchedulesForAsset, deactivateSchedulesForAsset are exported as plain async functions (not authActionClient actions) — they are helper utilities called internally by changeAssetStatus, not invoked directly from UI"
  - "asset-actions.ts changeAssetStatus updated to use auto: prefix convention and handle all 3 branches: sold_disposed deactivates permanently, broken/under_repair auto-pauses, active auto-resumes"
metrics:
  duration: "5 min"
  completed_date: "2026-02-25"
  tasks: 2
  files: 9
---

# Phase 7 Plan 01: PM Data Foundation Summary

**One-liner:** PostgreSQL migration with generate_pm_jobs() cron function, TypeScript discriminated union types for 6 checklist item types, Zod schemas, and full CRUD server actions for maintenance templates and schedules with auto-pause/resume integration.

## What Was Built

### Task 1: Database Migration, TypeScript Types, and Constants

**Migration (00010_pm_phase7.sql):**
- `checklist_responses jsonb DEFAULT NULL` added to `jobs` table — stores full template definition + responses snapshot so completed PM jobs survive template edits
- `is_active boolean DEFAULT true` added to `maintenance_schedules` — enables manual activate/deactivate independent from `is_paused` (auto-pause) and `deleted_at` (soft-delete)
- `idx_jobs_schedule_open_unique` unique partial index on `jobs(maintenance_schedule_id) WHERE deleted_at IS NULL AND status NOT IN (completed, cancelled) AND maintenance_schedule_id IS NOT NULL` — hard DB-level deduplication guard (Pitfall 3 mitigation)
- `idx_jobs_pm_type` index on `jobs(job_type, status) WHERE deleted_at IS NULL AND job_type = 'preventive_maintenance'` — optimizes overdue PM queries
- `generate_pm_jobs()` SECURITY DEFINER function — queries due schedules, inserts PM jobs with checklist snapshots, advances `next_due_at` for FIXED schedules only (FLOATING handled at job completion), uses first `ga_lead` in company as `created_by`
- pg_cron registration line commented out pending manual Dashboard extension enable (consistent with Phase 5 pattern)
- RLS refinements for `maintenance_templates` and `maintenance_schedules`: INSERT/UPDATE requires `company_id` match + role in `(ga_lead, admin)`

**TypeScript types (lib/types/maintenance.ts):**
- `ChecklistItemBase` + 6 concrete types: `CheckboxItem`, `PassFailItem`, `NumericItem` (+ optional `unit`), `TextItem`, `PhotoItem`, `DropdownItem` (+ `options: string[]`)
- `ChecklistItem` discriminated union on `type` field
- `ChecklistResponse` — snapshot type for PM job completion data
- `PMJobChecklist` — full JSONB column shape for `jobs.checklist_responses`
- `MaintenanceTemplate` and `MaintenanceSchedule` — joined types with optional relations
- `ScheduleDisplayStatus = 'active' | 'paused_auto' | 'paused_manual' | 'deactivated'`

**Constants:**
- `CHECKLIST_TYPES` — human-readable labels for 6 types
- `CHECKLIST_TYPE_ICONS` — icon identifier strings for template builder UI
- `CHECKLIST_TYPE_ORDER` — ordered list for "Add item" buttons
- `getScheduleDisplayStatus()` — derives display status from `is_active`, `is_paused`, `paused_reason` fields
- `SCHEDULE_STATUS_LABELS` and `SCHEDULE_STATUS_COLORS` — badge rendering

### Task 2: Zod Schemas and Server Actions

**Template validation (lib/validations/template-schema.ts):**
- Full Zod discriminated union with 6 type-specific schemas including `numericItem` (optional `unit: max(20)`) and `dropdownItem` (options array: min 1, max 20 items, each max 100 chars)
- `templateCreateSchema` / `templateEditSchema` (same — free editing)
- All string fields have max length per CLAUDE.md validation conventions

**Schedule validation (lib/validations/schedule-schema.ts):**
- `scheduleCreateSchema` with `interval_days: min(1).max(365)`, `interval_type: enum(fixed, floating)`, optional `start_date`
- `scheduleEditSchema` for interval-only updates

**Template server actions (app/actions/template-actions.ts):**
- `createTemplate` — validates asset category type, inserts with JSONB checklist
- `updateTemplate` — validates asset category type on new category_id
- `deactivateTemplate` — guards against active schedules (returns count in error message)
- `reactivateTemplate` — sets is_active = true
- `getTemplates` — company-scoped with category join, computed item_count
- `getTemplateById` — single template with category join

**Schedule server actions (app/actions/schedule-actions.ts):**
- `createSchedule` — validates template-asset category match (Pitfall 7 prevention), calculates initial next_due_at from start_date or now + interval_days
- `updateSchedule` — recalculates next_due_at when interval changes
- `deactivateSchedule` — sets is_active = false, cancels open PM jobs (Pitfall 4)
- `activateSchedule` — sets is_active = true, recalculates next_due_at
- `deleteSchedule` — soft-delete; historical PM jobs remain
- `getSchedules` — company-scoped with template/asset joins, adds `display_status` computed field
- `getSchedulesByAssetId` — for asset detail page maintenance section
- `pauseSchedulesForAsset(supabase, assetId, newStatus)` — helper: pauses active schedules using `auto:asset_{status}` prefix, cancels open PM jobs
- `resumeSchedulesForAsset(supabase, assetId)` — helper: only resumes `auto:` prefixed pauses, recalculates next_due_at per schedule's interval_days
- `deactivateSchedulesForAsset(supabase, assetId)` — helper: soft-deletes all schedules for terminal-status assets

**Asset actions fix (app/actions/asset-actions.ts):**
- `changeAssetStatus` updated to call the three helper functions replacing incorrect original code that used wrong `paused_reason` format and was missing resume/deactivate branches

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed incorrect paused_reason convention in asset-actions.ts**
- **Found during:** Task 2 implementation
- **Issue:** The existing `changeAssetStatus` used `'Asset status: ${newStatus}'` for `paused_reason`, which doesn't match the `'auto:'` prefix convention required by `resumeSchedulesForAsset()`. Also missing: resume on `active` status, deactivation on `sold_disposed`, cancellation of open PM jobs.
- **Fix:** Updated `changeAssetStatus` to call the three new helper functions (`pauseSchedulesForAsset`, `resumeSchedulesForAsset`, `deactivateSchedulesForAsset`) handling all branches correctly
- **Files modified:** `app/actions/asset-actions.ts`
- **Commit:** a3ec047

## Self-Check

- `supabase/migrations/00010_pm_phase7.sql` — FOUND
- `lib/types/maintenance.ts` — FOUND
- `lib/constants/checklist-types.ts` — FOUND
- `lib/constants/schedule-status.ts` — FOUND
- `lib/validations/template-schema.ts` — FOUND
- `lib/validations/schedule-schema.ts` — FOUND
- `app/actions/template-actions.ts` — FOUND
- `app/actions/schedule-actions.ts` — FOUND
- `app/actions/asset-actions.ts` (modified) — FOUND
- Commit 4b7c435 (Task 1) — FOUND
- Commit a3ec047 (Task 2) — FOUND
- `npm run build` — PASSED

## Self-Check: PASSED
