---
phase: quick-51
plan: "01"
subsystem: company-field-visibility
tags: [company, multi-tenant, create-forms, detail-pages, maintenance, requests, jobs, assets]
dependency_graph:
  requires: [quick-50]
  provides: [complete-company-field-coverage]
  affects: [maintenance/schedules, maintenance/templates, requests/[id], jobs/[id], inventory/[id]]
tech_stack:
  added: []
  patterns: [disabled-input-pattern, combobox-pattern, prop-threading]
key_files:
  created: []
  modified:
    - app/(dashboard)/maintenance/page.tsx
    - components/maintenance/schedule-create-dialog.tsx
    - components/maintenance/schedule-form.tsx
    - app/(dashboard)/maintenance/templates/page.tsx
    - components/maintenance/template-create-dialog.tsx
    - components/maintenance/template-create-form.tsx
    - app/(dashboard)/requests/[id]/page.tsx
    - components/requests/request-detail-client.tsx
    - components/requests/request-detail-info.tsx
    - app/(dashboard)/jobs/[id]/page.tsx
    - components/jobs/job-detail-client.tsx
    - components/jobs/job-detail-info.tsx
    - components/assets/asset-detail-info.tsx
    - components/assets/asset-edit-form.tsx
    - app/(dashboard)/maintenance/schedules/[id]/page.tsx
    - components/maintenance/schedule-detail.tsx
    - app/(dashboard)/maintenance/templates/[id]/page.tsx
    - components/maintenance/template-detail.tsx
decisions:
  - "Company field always shown on all create and edit surfaces — disabled Input for single-company users, Combobox for multi-company on create forms only"
  - "Edit/detail pages always show disabled Company Input regardless of access level — company is immutable after creation"
  - "Asset read-only view uses asset.company?.name directly — no extra fetch needed since InventoryItemWithRelations already joins company"
  - "Template detail shows Company field once above the canManage conditional to avoid duplication in both branches"
metrics:
  duration: "8 min"
  completed: "2026-03-12"
  tasks: 2
  files: 18
---

# Phase quick-51 Plan 01: Add Company Field to All Creation and Edit Surfaces Summary

Company field visibility extended to all remaining creation forms (Schedule, Template) and all edit/detail pages (Request, Job, Asset, Schedule, Template). Single-company users see a disabled Input everywhere; multi-company users see an interactive Combobox on create forms and a disabled Input on edit/detail pages (company is immutable after creation).

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add Company field to Schedule and Template create modals | 65c2f96 | 6 files |
| 2 | Add disabled Company field to all edit/detail pages | 978dd28 | 12 files |

## What Was Built

**Task 1 — Schedule and Template create modals:**

- `maintenance/page.tsx`: Added parallel fetch of `primaryCompanyName` (companies by company_id) and `extraCompanies` (user_company_access joined to companies). Passes both to `ScheduleCreateDialog`.
- `templates/page.tsx`: Same parallel fetch pattern. Passes to `TemplateCreateDialog`.
- `schedule-create-dialog.tsx`: Threads `primaryCompanyName` and `extraCompanies` to `ScheduleForm`.
- `schedule-form.tsx`: Added `selectedCompanyId` state and Company field at top of `ScheduleCreateForm` — disabled Input when `extraCompanies.length <= 1`, interactive Combobox otherwise. Props threaded through `ScheduleFormProps` to `ScheduleCreateForm`.
- `template-create-dialog.tsx`: Threads props to `TemplateCreateForm`.
- `template-create-form.tsx`: Added `selectedCompanyId` state and Company field at top of form using same pattern.

**Task 2 — Disabled Company field on all edit/detail pages:**

- `requests/[id]/page.tsx`: Added `companyName` fetch to parallel Promise.all. Passed to `RequestDetailClient`.
- `request-detail-client.tsx`: Threaded `companyName` to `RequestDetailInfo`.
- `request-detail-info.tsx`: Added `Input` import. Disabled Company Input rendered in both editable path (before `RequestEditForm`) and read-only path (before Description section).
- `jobs/[id]/page.tsx`: Added `companyName` fetch to parallel Promise.all. Passed to `JobDetailClient`.
- `job-detail-client.tsx`: Threaded `companyName` to `JobDetailInfo`.
- `job-detail-info.tsx`: Disabled Company Input rendered at very top of form using `Label` + `Input` (both already imported).
- `asset-detail-info.tsx`: Added `Input` import. `asset.company?.name` used directly — no extra fetch. Disabled Company Input in both canEdit path (passed as `companyName` prop to `AssetEditForm`) and read-only path.
- `asset-edit-form.tsx`: Added `companyName` prop. Disabled Company Input at top of form.
- `schedules/[id]/page.tsx`: Added `companyName` fetch in parallel with pmJobs fetch.
- `schedule-detail.tsx`: Added `Input` import and `companyName` prop. Disabled Company Input at very top of detail view.
- `templates/[id]/page.tsx`: Replaced single categories fetch with parallel fetch including `companyName`. Passed to `TemplateDetail`.
- `template-detail.tsx`: Added `companyName` prop. Disabled Company Input placed once above the `canManage ? (...) : (...)` conditional to avoid duplication.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All key modified files found on disk. Both task commits confirmed:
- `65c2f96` — feat(quick-51): add Company field to Schedule and Template create modals
- `978dd28` — feat(quick-51): add disabled Company field to all edit/detail pages
