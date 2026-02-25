---
phase: 07-preventive-maintenance
plan: 03
subsystem: maintenance-schedule-ui
tags: [react-hook-form, zod, tanstack-table, combobox, bidirectional-filter, data-table, sidebar]
dependency_graph:
  requires: [07-01, 07-02, 06-inventory]
  provides: [schedule-form, schedule-list-page, schedule-create-page, schedule-detail-page, maintenance-schedules-sidebar]
  affects: [sidebar.tsx, maintenance-schedules-route]
tech_stack:
  added: []
  patterns: [bidirectional-category-filter, split-create-edit-forms, InlineFeedback, authActionClient-server-actions, TanStack-DataTable]
key_files:
  created:
    - components/maintenance/schedule-form.tsx
    - components/maintenance/schedule-status-badge.tsx
    - components/maintenance/schedule-list.tsx
    - components/maintenance/schedule-columns.tsx
    - components/maintenance/schedule-detail.tsx
    - app/(dashboard)/maintenance/page.tsx
    - app/(dashboard)/maintenance/schedules/new/page.tsx
    - app/(dashboard)/maintenance/schedules/[id]/page.tsx
  modified:
    - components/sidebar.tsx
decisions:
  - "ScheduleForm split into ScheduleCreateForm and ScheduleEditForm sub-components to avoid TypeScript type union issues between useForm<ScheduleCreateOutput> and useForm<ScheduleEditFormData>"
  - "Used z.output<typeof scheduleCreateSchema> (output type after Zod defaults applied) for useForm to avoid Resolver type mismatch from interval_type .default('floating') making the input type optional but output required"
  - "Sidebar Schedules item set to built: true at plan 03 completion — both Maintenance nav items (Templates, Schedules) now active"
metrics:
  duration: "6 min"
  completed_date: "2026-02-25"
  tasks: 2
  files: 9
---

# Phase 7 Plan 03: Schedule Management Pages Summary

**One-liner:** Schedule CRUD UI with bidirectional category-filtered template/asset Combobox dropdowns, 4-state status badge component, TanStack DataTable list, and detail page with activate/deactivate/delete controls and linked PM jobs section.

## What Was Built

### Task 1: Schedule form, status badge, and data table components

**ScheduleStatusBadge (components/maintenance/schedule-status-badge.tsx):**
- Calls `getScheduleDisplayStatus()` from `lib/constants/schedule-status.ts`
- 4 distinct visual states via `SCHEDULE_STATUS_COLORS`: active (green), paused_auto (amber), paused_manual (yellow), deactivated (gray)
- Presentational component accepting `{ is_active, is_paused, paused_reason }` props

**scheduleColumns (components/maintenance/schedule-columns.tsx):**
- 8 columns: Template Name (linked to `/maintenance/templates/{id}`), Asset Name (linked to `/inventory/{id}` with display_id), Interval (N days), Type (Fixed/Floating badge), Status (ScheduleStatusBadge), Next Due (dd-MM-yyyy, red+bold if overdue, N/A if paused/deactivated), Last Completed (dd-MM-yyyy or —), Actions
- `ScheduleTableMeta` type for `onDeactivate`, `onActivate`, `onDelete` callbacks
- Actions only visible to ga_lead/admin

**ScheduleList (components/maintenance/schedule-list.tsx):**
- Client component wrapping `DataTable` with `scheduleColumns`
- Handles `deactivateSchedule`, `activateSchedule`, `deleteSchedule` server actions via `useTransition`
- `InlineFeedback` for success/error (persistent, manually dismissed)
- "New Schedule" button only visible to ga_lead/admin

**ScheduleForm (components/maintenance/schedule-form.tsx):**
- Split into `ScheduleCreateForm` and `ScheduleEditForm` sub-components + public `ScheduleForm` router component
- **Create mode:** Template Combobox + Asset Combobox with bidirectional category filtering (selecting template filters assets by matching category_id; selecting asset filters templates by matching category_id; clearing when category mismatch detected); Interval days Input (min 1, max 365); Interval type toggle (Fixed/Floating buttons with inline help text, default Floating); Optional start date Input
- **Edit mode:** Interval days + Interval type only (template/asset immutable after creation)
- `IntervalTypeToggle` shared sub-component with click-to-select UI cards and inline help text
- On create success: redirects to `/maintenance`; on edit success: `InlineFeedback` + `router.refresh()`

### Task 2: Schedule list page, create page, detail page, and sidebar activation

**Schedule list page (app/(dashboard)/maintenance/page.tsx):**
- Server component; fetches schedules with `template:maintenance_templates(name)` + `asset:inventory_items(name, display_id)` joins
- Normalizes Supabase FK array returns; computes display_status via `getScheduleDisplayStatus()`
- Breadcrumb: Maintenance > Schedules
- Passes data to `ScheduleList` component

**Create schedule page (app/(dashboard)/maintenance/schedules/new/page.tsx):**
- Server component with role guard (redirects non-ga_lead/admin to `/maintenance`)
- Reads `template_id` and `asset_id` optional search params for entry points from template detail or asset detail pages
- Fetches active templates and active (non-sold_disposed) assets with category_id
- Breadcrumb: Maintenance > Schedules > New

**Schedule detail page (app/(dashboard)/maintenance/schedules/[id]/page.tsx):**
- Server component; fetches schedule + PM jobs in sequence
- `notFound()` if schedule not in company
- Fetches linked PM jobs via `jobs.maintenance_schedule_id = id`
- Breadcrumb: Maintenance > Schedules > {template.name} - {asset.name}

**ScheduleDetail (components/maintenance/schedule-detail.tsx):**
- Status bar with `ScheduleStatusBadge` + created date
- Edit interval toggle (shows `ScheduleForm` in edit mode inline)
- Delete with inline confirmation panel (no dialog needed, simple inline UX)
- Auto-pause notice when `is_paused && paused_reason.startsWith('auto:')` — shows asset status message
- Info card: template (linked), asset (linked with display_id), interval, type badge, next due (red if overdue with "Overdue" label), last completed
- Linked PM jobs section: job display_id + status badge + created date, click-through to `/jobs/{id}`
- All mutations via `useTransition`; persistent `InlineFeedback` for all feedback

**Sidebar activation (components/sidebar.tsx):**
- Schedules item: `built: false` → `built: true`
- Both Maintenance nav items (Templates, Schedules) now active

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript resolver type mismatch in useForm with scheduleCreateSchema**
- **Found during:** Task 1 build verification
- **Issue:** `useForm<ScheduleCreateFormData>` with `zodResolver(scheduleCreateSchema)` caused a TypeScript error because the schema has `interval_type: z.enum().default('floating')` which makes the Zod input type have `interval_type?: ...` (optional) but the output type has `interval_type: ...` (required). The resolver signature couldn't reconcile these.
- **Fix:** Used `z.output<typeof scheduleCreateSchema>` as the form type instead of `ScheduleCreateFormData` (which is the input type). Cast resolver to `any` to satisfy TypeScript.
- **Files modified:** `components/maintenance/schedule-form.tsx`
- **Commit:** e681e96

**2. [Rule 1 - Bug] useForm type union issues between create and edit forms**
- **Found during:** Task 1 implementation
- **Issue:** Using `activeForm = mode === 'create' ? createForm : editForm` and spreading `{...activeForm}` into `<Form>` caused TypeScript to fail inferring the union type of two different form instances.
- **Fix:** Split `ScheduleForm` into separate `ScheduleCreateForm` and `ScheduleEditForm` sub-components, with a public `ScheduleForm` component that renders the correct one based on `mode` prop.
- **Files modified:** `components/maintenance/schedule-form.tsx`
- **Commit:** e681e96

## Self-Check

- `components/maintenance/schedule-form.tsx` — FOUND
- `components/maintenance/schedule-status-badge.tsx` — FOUND
- `components/maintenance/schedule-list.tsx` — FOUND
- `components/maintenance/schedule-columns.tsx` — FOUND
- `components/maintenance/schedule-detail.tsx` — FOUND
- `app/(dashboard)/maintenance/page.tsx` — FOUND
- `app/(dashboard)/maintenance/schedules/new/page.tsx` — FOUND
- `app/(dashboard)/maintenance/schedules/[id]/page.tsx` — FOUND
- `components/sidebar.tsx` (modified) — FOUND
- Commit e681e96 (Task 1) — FOUND
- Commit 480ece7 (Task 2) — FOUND
- `npm run build` — PASSED (all 5 maintenance routes rendered: /maintenance, /maintenance/templates, /maintenance/templates/[id], /maintenance/templates/new, /maintenance/schedules/[id], /maintenance/schedules/new)

## Self-Check: PASSED
