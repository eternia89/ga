---
phase: quick-65
plan: 01
subsystem: inventory
tags: [asset, schema, validation, multi-company, company-id]
dependency_graph:
  requires: []
  provides: [company_id always submitted on asset create, edit form Zod-compatible]
  affects: [lib/validations/asset-schema.ts, components/assets/asset-submit-form.tsx, components/assets/asset-create-dialog.tsx, app/(dashboard)/inventory/page.tsx, components/assets/asset-edit-form.tsx]
tech_stack:
  added: []
  patterns: [required UUID field in Zod schema, primaryCompanyId prop threading]
key_files:
  created: []
  modified:
    - lib/validations/asset-schema.ts
    - components/assets/asset-submit-form.tsx
    - components/assets/asset-create-dialog.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/new/page.tsx
    - components/assets/asset-edit-form.tsx
decisions:
  - "company_id set to required in assetCreateSchema (z.string().uuid); server-side fallback in createAsset remains as safety net"
  - "AssetEditForm carries company_id from asset.company_id in defaultValues to satisfy schema; updateAsset does not write it to DB"
  - "effectiveCompanyId in onSubmit now uses primaryCompanyId instead of undefined for single-company users"
metrics:
  duration: 8min
  completed_date: "2026-03-13"
  tasks_completed: 2
  files_modified: 6
---

# Quick Task 65: Make company_id Required in Asset Create — Summary

**One-liner:** assetCreateSchema company_id changed from optional to required; primaryCompanyId threaded from page through dialog to form defaultValues; AssetEditForm defaultValues updated to carry asset.company_id for schema compatibility.

## What Was Done

### Task 1: Schema change + prop threading

**lib/validations/asset-schema.ts**
- Changed `company_id` from `z.string().uuid().optional()` to `z.string().uuid({ message: 'Company is required' })`
- `assetEditSchema` (alias for `assetCreateSchema`) inherits the same change automatically

**components/assets/asset-create-dialog.tsx**
- Added `primaryCompanyId: string` to `AssetCreateDialogProps`
- Destructured and passed `primaryCompanyId` down to `<AssetSubmitForm>`

**components/assets/asset-submit-form.tsx**
- Added `primaryCompanyId: string` to `AssetSubmitFormProps`
- Set `company_id: primaryCompanyId` in `useForm` `defaultValues` so single-company users always have it pre-populated
- Updated `onSubmit` `effectiveCompanyId` to fall back to `primaryCompanyId` (instead of `undefined`) for single-company users
- Added `form.setValue('company_id', val)` in the multi-company Combobox `onValueChange` to keep form state in sync

**app/(dashboard)/inventory/page.tsx**
- Passed `primaryCompanyId={profile.company_id ?? ''}` to `<AssetCreateDialog>`

**app/(dashboard)/inventory/new/page.tsx** (deviation — auto-fix, Rule 3)
- This standalone page also renders `<AssetSubmitForm>` directly without going through the dialog
- Required `primaryCompanyId` prop was missing; added `primaryCompanyId={profile.company_id ?? ''}` to fix TypeScript build error

### Task 2: Fix AssetEditForm defaultValues

**components/assets/asset-edit-form.tsx**
- Added `company_id: asset.company_id ?? ''` to `useForm` `defaultValues`
- No UI change — the company field in edit form is a disabled Input driven by `companyName` prop, not the form field
- Value is validated by Zod but not included in `updateAsset` payload (company cannot change after creation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing primaryCompanyId prop in inventory/new/page.tsx**
- **Found during:** Task 1 — build failure after schema change
- **Issue:** `app/(dashboard)/inventory/new/page.tsx` also renders `<AssetSubmitForm>` directly and was not mentioned in the plan. After `primaryCompanyId` became required, the build failed with a TypeScript error on this file.
- **Fix:** Added `primaryCompanyId={profile.company_id ?? ''}` prop to `<AssetSubmitForm>` in the new asset page. The page already fetches `profile.company_id`, so no additional DB query needed.
- **Files modified:** `app/(dashboard)/inventory/new/page.tsx`
- **Commit:** 2b40cfe

## Self-Check: PASSED

Files exist:
- lib/validations/asset-schema.ts — FOUND
- components/assets/asset-submit-form.tsx — FOUND
- components/assets/asset-create-dialog.tsx — FOUND
- app/(dashboard)/inventory/page.tsx — FOUND
- app/(dashboard)/inventory/new/page.tsx — FOUND
- components/assets/asset-edit-form.tsx — FOUND

Commits:
- 2b40cfe: feat(quick-65): make company_id required in asset schema and wire primaryCompanyId
- c8884b3: feat(quick-65): fix AssetEditForm defaultValues to include company_id

Build: PASSED (no TypeScript errors)
