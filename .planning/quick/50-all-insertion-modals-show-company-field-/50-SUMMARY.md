---
phase: quick-50
plan: 01
subsystem: ui
tags: [react, forms, multi-company, company-field, modal, create-dialog]

# Dependency graph
requires:
  - phase: quick-46
    provides: multi-company user access, extraCompanies prop threading pattern
  - phase: quick-49
    provides: company-based data isolation, user_company_access table
provides:
  - Company field always rendered in New Request, New Job, New Asset create modals
  - Disabled Input for single-company users showing their company name
  - Interactive Combobox for multi-company users (existing behavior preserved)
affects: [requests, jobs, inventory, asset-submit-form, job-form, request-submit-form]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "primaryCompanyName prop: fetched on each page server component and threaded through dialog → form for always-visible Company field"
    - "Conditional field rendering: disabled Input vs Combobox based on extraCompanies.length > 1"

key-files:
  created: []
  modified:
    - app/(dashboard)/requests/page.tsx
    - app/(dashboard)/jobs/page.tsx
    - app/(dashboard)/inventory/page.tsx
    - app/(dashboard)/inventory/new/page.tsx
    - components/requests/request-create-dialog.tsx
    - components/requests/request-submit-form.tsx
    - components/jobs/job-create-dialog.tsx
    - components/jobs/job-modal.tsx
    - components/jobs/job-form.tsx
    - components/assets/asset-create-dialog.tsx
    - components/assets/asset-submit-form.tsx

key-decisions:
  - "primaryCompanyName fetched via parallel Promise.all on each server page component — no extra round trip"
  - "Company field uses disabled Input (not a read-only FormField) for single-company users — simpler, no form registration needed"
  - "job-form.tsx keeps mode === 'create' guard around Company field — company is immutable in edit mode"
  - "inventory/new/page.tsx (legacy standalone page) also fixed to pass primaryCompanyName — Rule 3 auto-fix"

patterns-established:
  - "Always-visible Company field: render disabled Input when single-company, Combobox when multi-company"

requirements-completed: [QUICK-50]

# Metrics
duration: 8min
completed: 2026-03-11
---

# Quick Task 50: All Insertion Modals Show Company Field — Summary

**Company field always visible in New Request, New Job, and New Asset modals — disabled Input for single-company users, interactive Combobox for multi-company users**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-11T07:00:00Z
- **Completed:** 2026-03-11T07:08:00Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- All three create modals (New Request, New Job, New Asset) now always render a Company field regardless of multi-company access
- Single-company users see a disabled Input styled with `bg-muted text-muted-foreground cursor-not-allowed` showing their company name
- Multi-company users see the existing interactive Combobox defaulting to first company (primary) — no behavior regression
- `primaryCompanyName` fetched in parallel on all three server pages and threaded through the dialog/modal chain to each form component

## Task Commits

1. **Task 1: Add primaryCompanyName prop threading from pages through dialogs to forms** - `cfea545` (feat)
2. **Task 2: Update all three forms to always show Company field** - `b4037e3` (feat)

## Files Created/Modified

- `app/(dashboard)/requests/page.tsx` - Added primaryCompanyName fetch + prop pass to RequestCreateDialog
- `app/(dashboard)/jobs/page.tsx` - Added primaryCompanyName fetch + prop pass to JobCreateDialog
- `app/(dashboard)/inventory/page.tsx` - Added primaryCompanyName fetch + prop pass to AssetCreateDialog
- `app/(dashboard)/inventory/new/page.tsx` - Added primaryCompanyName fetch + prop pass (Rule 3 auto-fix)
- `components/requests/request-create-dialog.tsx` - Accept + thread primaryCompanyName to RequestSubmitForm
- `components/requests/request-submit-form.tsx` - Always-visible Company field; added Input import; accept primaryCompanyName prop
- `components/jobs/job-create-dialog.tsx` - Accept + thread primaryCompanyName to JobModal
- `components/jobs/job-modal.tsx` - Accept + thread primaryCompanyName to JobForm (intermediate hop)
- `components/jobs/job-form.tsx` - Always-visible Company field in create mode; accept primaryCompanyName prop
- `components/assets/asset-create-dialog.tsx` - Accept + thread primaryCompanyName to AssetSubmitForm
- `components/assets/asset-submit-form.tsx` - Always-visible Company field; accept primaryCompanyName prop

## Decisions Made

- `primaryCompanyName` is a required `string` prop on all three form components (not optional) to enforce that pages always provide it
- Company field in `job-form.tsx` remains behind `mode === 'create'` guard — company context is shown at creation only; in edit mode the company is immutable and not shown (no change from existing behavior)
- Used plain disabled `<Input>` (not a FormField) for the single-company case — the company is read-only context, not a submitted form value

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed inventory/new/page.tsx missing primaryCompanyName prop**
- **Found during:** Task 2 (build verification)
- **Issue:** `app/(dashboard)/inventory/new/page.tsx` also renders `<AssetSubmitForm>` but was not listed in the plan's files. After making `primaryCompanyName` required, the build failed with a missing prop error.
- **Fix:** Added parallel fetch of `primaryCompanyName` from `companies` table alongside locations fetch in that page, and passed it to `<AssetSubmitForm>`.
- **Files modified:** `app/(dashboard)/inventory/new/page.tsx`
- **Verification:** `npm run build` passes — no Type errors
- **Committed in:** `cfea545` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Necessary fix to ensure build passes. The `/inventory/new` page is a legacy standalone create page that also uses `AssetSubmitForm`.

## Issues Encountered

None beyond the auto-fixed Rule 3 deviation above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Company field now always visible in all three create modals
- Ready for additional UI improvements or multi-company workflow enhancements
- No blockers

---
*Phase: quick-50*
*Completed: 2026-03-11*
