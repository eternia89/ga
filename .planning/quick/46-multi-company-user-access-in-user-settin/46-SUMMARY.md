---
phase: quick-46
plan: "01"
subsystem: multi-company-access
tags: [multi-company, user-settings, create-modal, rls, migration]
dependency_graph:
  requires: [user_profiles, companies, locations, user-form-dialog, job-form, request-submit-form, asset-submit-form]
  provides: [user_company_access table, multi-company create flows]
  affects: [admin/settings, requests/page, jobs/page, inventory/page]
tech_stack:
  added: []
  patterns: [adminActionClient for write, authActionClient for read, effectiveCompanyId pattern, prop chain for multi-company selector]
key_files:
  created:
    - supabase/migrations/00018_user_company_access.sql
    - app/actions/user-company-access-actions.ts
  modified:
    - components/admin/users/user-form-dialog.tsx
    - app/(dashboard)/admin/settings/settings-content.tsx
    - components/admin/users/user-table.tsx
    - app/(dashboard)/admin/settings/page.tsx
    - lib/validations/request-schema.ts
    - app/actions/request-actions.ts
    - app/(dashboard)/requests/page.tsx
    - components/requests/request-create-dialog.tsx
    - components/requests/request-submit-form.tsx
    - lib/validations/job-schema.ts
    - app/actions/job-actions.ts
    - app/(dashboard)/jobs/page.tsx
    - components/jobs/job-create-dialog.tsx
    - components/jobs/job-modal.tsx
    - components/jobs/job-form.tsx
    - lib/validations/asset-schema.ts
    - app/actions/asset-actions.ts
    - app/(dashboard)/inventory/page.tsx
    - components/assets/asset-create-dialog.tsx
    - components/assets/asset-submit-form.tsx
decisions:
  - effectiveCompanyId pattern: resolve company_id from parsedInput or fall back to profile.company_id in all 3 create actions
  - adminActionClient for updateUserCompanyAccess writes (service role bypasses RLS); authActionClient for getUserCompanyAccess reads
  - Migration 00017 was applied manually to remote; repaired with supabase migration repair before pushing 00018
  - extraCompanies array includes the user's primary company as one of the entries — company selector shows only when length > 1
  - Combobox emptyText prop (not emptyMessage) used per actual component interface
metrics:
  duration: "9 minutes"
  completed: "2026-03-11"
  tasks: 5
  files: 20
---

# Phase quick-46 Plan 01: Multi-Company User Access Summary

Multi-company user access: `user_company_access` table, admin grants/revokes checkboxes in user settings, and Company Combobox in all 3 create modals (Requests, Jobs, Assets) when user has extra access.

## What Was Built

### Task 1: DB migration + server actions
- Created `supabase/migrations/00018_user_company_access.sql` with `user_company_access` table (user_id, company_id, granted_by, granted_at, UNIQUE constraint)
- RLS policies: users SELECT own rows, admins SELECT all rows, no INSERT/UPDATE/DELETE (service role only)
- Applied migration to remote Supabase (repaired 00017 history first — was applied but not tracked)
- Created `app/actions/user-company-access-actions.ts` with `getUserCompanyAccess` (authActionClient) and `updateUserCompanyAccess` (adminActionClient)

### Task 2: User settings modal
- `UserFormDialog` gains `userCompanyAccess?: string[]` prop and `selectedExtraCompanies` state
- Edit mode shows "Additional Company Access" section with checkboxes for all companies except the user's primary
- `handleSubmit` calls `updateUserCompanyAccess` after successful `updateUser` in edit mode
- `userCompanyAccessMap` prop chain: settings page (fetches rows) → settings-content → user-table → user-form-dialog
- Settings page server component fetches `user_company_access` rows using admin client

### Task 3a: Company selector — Requests
- `requestSubmitSchema` gains optional `company_id` field
- `createRequest` computes `effectiveCompanyId`, validates access against `user_company_access`, uses it for display_id generation and DB insert
- Requests page fetches extra company access and builds `extraCompanies`/`allLocations` arrays
- `RequestCreateDialog` → `RequestSubmitForm` prop chain for `extraCompanies`/`allLocations`
- `RequestSubmitForm` shows Company Combobox when `extraCompanies.length > 1`; location options filter by selected company

### Task 3b: Company selector — Jobs
- `createJobSchema` gains optional `company_id` field
- `createJob` computes `effectiveCompanyId`, validates access, uses it for display_id, insert, budget threshold lookup, and job_requests company_id
- Jobs page fetches extra company access data
- `JobCreateDialog` → `JobModal` → `JobForm` prop chain
- `JobForm` shows Company Combobox in create mode only when `extraCompanies.length > 1`

### Task 3c: Company selector — Assets
- `assetCreateSchema` gains optional `company_id` field
- `createAsset` computes `effectiveCompanyId`, validates access, uses it for display_id and insert
- Inventory page fetches extra company access data
- `AssetCreateDialog` → `AssetSubmitForm` prop chain
- `AssetSubmitForm` shows Company Combobox when `extraCompanies.length > 1`; location options filter by selected company

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 43b92dc | DB migration + server actions for user_company_access |
| 2 | 04eb013 | User settings modal — multi-company access checkboxes |
| 3a | ccc24f3 | Company selector in Requests create flow |
| 3b | 4a49315 | Company selector in Jobs create flow |
| 3c | a866a24 | Company selector in Assets create flow |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Supabase migration 00017 blocking 00018 push**
- **Found during:** Task 1 (supabase db push)
- **Issue:** Migration 00017 was applied to remote DB manually but not tracked in migration history. Running `db push` failed trying to re-apply it.
- **Fix:** Ran `supabase migration repair --status applied 00017` to mark it as applied, then pushed 00018 successfully.
- **Files modified:** None (infrastructure)

**2. [Rule 1 - Bug] Combobox prop name mismatch**
- **Found during:** Task 3a implementation
- **Issue:** Plan specified `emptyMessage` prop but actual Combobox component uses `emptyText`
- **Fix:** Used `emptyText` throughout all 3 form components
- **Files modified:** request-submit-form.tsx, job-form.tsx, asset-submit-form.tsx

## Self-Check: PASSED
