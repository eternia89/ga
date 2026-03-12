---
phase: quick-51
verified: 2026-03-12T00:00:00Z
status: passed
score: 4/4 must-haves verified
---

# Phase quick-51: Add Company Field to All Creation and Edit Surfaces — Verification Report

**Phase Goal:** Add company field to all creation and editing forms. Always show Company field; disabled for single-company users; enabled Combobox for multi-company users on create forms; always disabled on edit/detail pages (company is immutable after creation). Applies to: Requests, Jobs, Assets, Schedules, Templates.
**Verified:** 2026-03-12
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #   | Truth | Status | Evidence |
| --- | ----- | ------ | -------- |
| 1 | Every create modal (Schedule, Template) shows a Company field — Combobox for multi-company users, disabled Input for single-company users | VERIFIED | `schedule-form.tsx` L207-226: conditional `extraCompanies.length > 1` renders Combobox or disabled Input; `template-create-form.tsx` L96-115: identical pattern |
| 2 | Every edit/detail page (Request, Job, Asset, Schedule, Template) shows a Company field — always disabled Input | VERIFIED | All five files confirmed: `request-detail-info.tsx` L158-166 (editable path) and L285-293 (read-only path); `job-detail-info.tsx` L179-186; `asset-edit-form.tsx` L252-260; `asset-detail-info.tsx` L89-97 (read-only path); `schedule-detail.tsx` L134-142; `template-detail.tsx` L227-234 |
| 3 | Single-company users see their company name in a disabled Input on all create AND edit forms | VERIFIED | Create forms: `extraCompanies.length > 1` check falls through to `<Input value={primaryCompanyName} disabled ...>`; Edit/detail pages: always disabled, value from `companyName` prop (fetched from companies table at page level) |
| 4 | Multi-company users can pick company on create forms; company field is still disabled (immutable) on edit/detail pages | VERIFIED | Create forms: Combobox active when `extraCompanies.length > 1`; Edit/detail: all pages render `<Input ... disabled>` with no conditional — immutability enforced by UI |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `components/maintenance/schedule-form.tsx` | Company field in ScheduleCreateForm (disabled Input or Combobox) | VERIFIED | L207-226 — Company field block renders at top of form before Template & Asset section |
| `components/maintenance/template-create-form.tsx` | Company field in TemplateCreateForm (disabled Input or Combobox) | VERIFIED | L96-115 — Company field block renders at top of form before Template Information section |
| `components/requests/request-detail-info.tsx` | Disabled Company Input in read-only view and edit view | VERIFIED | L158-166 (isEditable path), L285-293 (read-only path) — both paths covered |
| `components/requests/request-edit-form.tsx` | Disabled Company Input at form top | PARTIAL (implementation differs from plan artifact description — see note) | `RequestEditForm` itself does not render the Company field; instead `request-detail-info.tsx` renders the disabled Input above the `<RequestEditForm>` call. The observable truth is met — the Company field appears in the edit view — but the code location differs from the artifact description. No functional gap. |
| `components/jobs/job-detail-info.tsx` | Disabled Company Input rendered directly (no job-form.tsx) | VERIFIED | L179-186 — `Label + Input` block at very top of the `<form>`, always rendered, always disabled |
| `components/assets/asset-edit-form.tsx` | Disabled Company Input using companyName prop | VERIFIED | L252-260 — `companyName` prop accepted, disabled Input rendered at top of form |
| `components/maintenance/schedule-detail.tsx` | Disabled Company Input in schedule detail/edit view | VERIFIED | L134-142 — rendered once at top of the detail view, before the canManage conditional |
| `components/maintenance/template-detail.tsx` | Disabled Company Input in template detail/edit view | VERIFIED | L227-234 — rendered once above the `canManage ? (...) : (...)` conditional, covering both branches |

---

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `app/(dashboard)/maintenance/page.tsx` | `components/maintenance/schedule-create-dialog.tsx` | `primaryCompanyName + extraCompanies` props | VERIFIED | L158-164: `<ScheduleCreateDialog ... primaryCompanyName={primaryCompanyName} extraCompanies={extraCompanies}>` — both fetched in parallel Promise.all at L73-103 |
| `components/maintenance/schedule-create-dialog.tsx` | `components/maintenance/schedule-form.tsx` | `primaryCompanyName + extraCompanies` props | VERIFIED | L52-53: `primaryCompanyName={primaryCompanyName ?? ''}` and `extraCompanies={extraCompanies}` passed to `<ScheduleForm>` |
| `app/(dashboard)/maintenance/templates/page.tsx` | `components/maintenance/template-create-dialog.tsx` | `primaryCompanyName + extraCompanies` props | VERIFIED | L111-116: `<TemplateCreateDialog ... primaryCompanyName={primaryCompanyName} extraCompanies={extraCompanies}>` |
| `components/maintenance/template-create-dialog.tsx` | `components/maintenance/template-create-form.tsx` | `primaryCompanyName + extraCompanies` props | VERIFIED | L43-45: `primaryCompanyName={primaryCompanyName ?? ''}` and `extraCompanies={extraCompanies}` passed to `<TemplateCreateForm>` |
| `app/(dashboard)/requests/[id]/page.tsx` | `components/requests/request-detail-client.tsx` | `companyName` prop | VERIFIED | L340: `companyName` extracted; L400: passed to `<RequestDetailClient companyName={companyName}>` |
| `components/requests/request-detail-client.tsx` | `components/requests/request-detail-info.tsx` | `companyName` prop | VERIFIED | L104: `companyName={companyName}` in `<RequestDetailInfo>` call |
| `app/(dashboard)/jobs/[id]/page.tsx` | `components/jobs/job-detail-client.tsx` | `companyName` prop | VERIFIED | L156: `companyName` extracted; L491: passed to `<JobDetailClient companyName={companyName}>` |
| `components/jobs/job-detail-client.tsx` | `components/jobs/job-detail-info.tsx` | `companyName` prop | VERIFIED | L94: `companyName={companyName}` in `<JobDetailInfo>` call |
| `app/(dashboard)/maintenance/schedules/[id]/page.tsx` | `components/maintenance/schedule-detail.tsx` | `companyName` prop | VERIFIED | L97: extracted; L139: `companyName={companyName}` in `<ScheduleDetail>` |
| `app/(dashboard)/maintenance/templates/[id]/page.tsx` | `components/maintenance/template-detail.tsx` | `companyName` prop | VERIFIED | L84: extracted; L103: `companyName={companyName}` in `<TemplateDetail>` |

---

### Requirements Coverage

| Requirement | Source Plan | Status | Evidence |
| ----------- | ----------- | ------ | -------- |
| QUICK-51 | 51-PLAN.md | SATISFIED | All five entity types show Company field in both create and edit/detail surfaces |

---

### Anti-Patterns Found

None detected. Grepped all modified files for TODO/FIXME/placeholder/empty implementations. No stubs found.

---

### Human Verification Required

The following items cannot be verified programmatically:

**1. Single-company user sees disabled Input (not Combobox) on Schedule and Template create modals**
- Test: Log in as a single-company user; open New Schedule dialog at /maintenance and New Template dialog at /maintenance/templates
- Expected: Company field shows a grayed-out Input with the user's company name, not an interactive Combobox
- Why human: Multi-company branching depends on runtime `user_company_access` table data

**2. Multi-company user sees interactive Combobox on Schedule and Template create modals**
- Test: Log in as a user with multi-company access; open New Schedule and New Template dialogs
- Expected: Company field shows a searchable Combobox with company options
- Why human: Requires a test account with `user_company_access` rows

**3. Company field appears disabled (not editable) on all five edit/detail pages**
- Test: Open a Request, Job, Asset, Schedule, and Template detail page
- Expected: Company field shows as a grayed-out, non-interactive Input at the top of the content area
- Why human: Visual appearance of disabled state and field placement

---

### Implementation Note

The plan's artifact for `components/requests/request-edit-form.tsx` described it as providing a "Disabled Company Input at form top." In the actual implementation, `request-edit-form.tsx` does not contain the Company field at all. Instead, `request-detail-info.tsx` renders the disabled Company Input directly above the `<RequestEditForm>` call (in the `isEditable` branch). This achieves the same visible result — the Company field appears above the edit form fields — but the code lives one level up. This is a plan artifact description inaccuracy, not a functional gap. The truth (Company field visible in edit view) is fully verified.

---

### Gaps Summary

No gaps. All four observable truths are verified. All key links are wired end-to-end. No stub implementations found. The implementation is complete and consistent with the task goal.

---

_Verified: 2026-03-12_
_Verifier: Claude (gsd-verifier)_
