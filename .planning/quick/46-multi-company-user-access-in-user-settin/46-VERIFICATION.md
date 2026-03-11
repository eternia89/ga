---
phase: quick-46
verified: 2026-03-11T00:00:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Quick Task 46: Multi-Company User Access Verification Report

**Task Goal:** Multi-company user access — admin grants extra companies in user settings modal via checkboxes; users with extra access see a Company Combobox in New Request, New Job, New Asset modals; selecting a company filters Locations to that company; creating an entity uses the selected company_id in the DB insert; users without extra access see no change.
**Verified:** 2026-03-11
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Admin can open User edit modal and see "Additional Company Access" table with all companies listed with checkboxes | VERIFIED | `user-form-dialog.tsx` lines 370-399: `isEditMode && user?.id` guard renders checkboxes for all companies except the user's primary `company_id` |
| 2 | Checking a company checkbox and saving grants that user access; unchecking and saving revokes it | VERIFIED | `user-form-dialog.tsx` lines 148-153: `handleSubmit` calls `updateUserCompanyAccess({ userId, companyIds: selectedExtraCompanies })` after successful `updateUser`; action deletes all rows then re-inserts the full desired set |
| 3 | A user with extra companies sees a Company selector Combobox at the top of New Request, New Job, and New Asset modals | VERIFIED | All three forms render `<Combobox>` conditionally on `extraCompanies && extraCompanies.length > 1`: `request-submit-form.tsx` line 123, `job-form.tsx` line 318 (create mode only), `asset-submit-form.tsx` line 234 |
| 4 | A user without extra companies sees no company selector in create modals (company hidden, filled from profile) | VERIFIED | The `extraCompanies` arrays are only fetched when `extraCompanyIds.length > 0` on each page; when empty, `extraCompanies = []` (length 0), so the `length > 1` condition never triggers — no selector renders |
| 5 | Creating an entity with a selected extra company uses that company's company_id for the DB insert | VERIFIED | All three actions compute `effectiveCompanyId = parsedInput.company_id ?? profile.company_id` and validate access via `user_company_access` table before using it in the display_id RPC and the DB insert (`request-actions.ts` lines 25-56, `job-actions.ts` lines 27-160, `asset-actions.ts` lines 38-66) |
| 6 | Selecting a different company in the create modal updates available Locations to only show that company's data | VERIFIED | All three forms use `selectedCompanyId && allLocations ? allLocations.filter(l => l.company_id === selectedCompanyId) : locations` for `locationOptions`; changing Combobox calls `form.setValue('location_id', '')` to reset the field |

**Score:** 6/6 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00018_user_company_access.sql` | `user_company_access` table, RLS policies, admin bypass | VERIFIED | Table with UNIQUE(user_id, company_id), two SELECT RLS policies, no write policies (service role only) |
| `app/actions/user-company-access-actions.ts` | `updateUserCompanyAccess`, `getUserCompanyAccess` server actions | VERIFIED | Both actions implemented and exported; `updateUserCompanyAccess` uses `adminActionClient`; `getUserCompanyAccess` uses `authActionClient` |
| `components/admin/users/user-form-dialog.tsx` | Multi-company access checkboxes section in edit mode | VERIFIED | `userCompanyAccess?: string[]` prop, `selectedExtraCompanies` state, `toggleCompanyAccess` function, and checkbox UI all present; `updateUserCompanyAccess` called on save |
| `components/requests/request-submit-form.tsx` | Optional company selector when user has extra company access | VERIFIED | `extraCompanies` and `allLocations` props, `selectedCompanyId` state, conditional Combobox render, `effectiveCompanyId` passed to `createRequest` |
| `components/jobs/job-form.tsx` | Optional company selector in create mode | VERIFIED | Props, state, conditional Combobox (create mode only), `effectiveCompanyId` passed to `createJob` |
| `components/assets/asset-submit-form.tsx` | Optional company selector | VERIFIED | Props, state, conditional Combobox, `effectiveCompanyId` passed to `createAsset` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/admin/users/user-form-dialog.tsx` | `app/actions/user-company-access-actions.ts` | `updateUserCompanyAccess` call on Save | WIRED | Imported at line 6; called in `handleSubmit` at lines 148-153 |
| `app/(dashboard)/admin/settings/page.tsx` | `app/(dashboard)/admin/settings/settings-content.tsx` | `userCompanyAccessMap` prop | WIRED | Page builds `userCompanyAccessMap` from `accessRowsResult` (line 58-62) and passes it to `SettingsContent` (line 77) |
| `app/(dashboard)/admin/settings/settings-content.tsx` | `components/admin/users/user-table.tsx` | `userCompanyAccessMap` prop | WIRED | `SettingsContentProps` declares `userCompanyAccessMap: Record<string, string[]>` (line 22); forwarded to `UserTable` at line 95 |
| `components/admin/users/user-table.tsx` | `components/admin/users/user-form-dialog.tsx` | `userCompanyAccess` prop per user | WIRED | `UserTableProps` has `userCompanyAccessMap` (line 38); `UserFormDialog` receives `userCompanyAccess={editingUser ? (userCompanyAccessMap[editingUser.id] ?? []) : []}` (line 258) |
| `app/(dashboard)/requests/page.tsx` | `components/requests/request-create-dialog.tsx` | `extraCompanies` prop | WIRED | Page passes `extraCompanies={extraCompanies}` and `allLocations={allLocations}` to `RequestCreateDialog` (lines 170-171) |
| `components/jobs/job-create-dialog.tsx` | `components/jobs/job-modal.tsx` | `extraCompanies` + `allLocations` props forwarded | WIRED | Both props in `JobCreateDialogProps` (lines 18-19) forwarded to `JobModal` (lines 52-53) |
| `components/jobs/job-modal.tsx` | `components/jobs/job-form.tsx` | `extraCompanies` + `allLocations` props forwarded | WIRED | `JobModalProps` has both props (lines 95-96); forwarded to `JobForm` at lines 873-874 |
| `components/requests/request-submit-form.tsx` | `app/actions/request-actions.ts` | `company_id` field in form data | WIRED | `effectiveCompanyId` computed and passed as `company_id` to `createRequest` (line 69); action uses `parsedInput.company_id ?? profile.company_id` (line 25) |

---

### Requirements Coverage

No formal requirement IDs declared in plan frontmatter (`requirements: []`). Task is a quick task with success criteria verified via must-haves above.

---

### Anti-Patterns Found

None. No TODOs, FIXMEs, stub implementations, or empty handlers detected in any modified files.

---

### Human Verification Required

The following behaviors require a live environment to confirm end-to-end:

#### 1. Checkbox state persistence round-trip

**Test:** In admin settings, edit a user, check one extra company, save, reopen the same user's edit modal.
**Expected:** The checkbox for the granted company is pre-checked.
**Why human:** Requires live Supabase instance with the 00018 migration applied and a real browser session.

#### 2. Locations filter updates on company switch

**Test:** As a user with two companies granted, open New Request, select the second company.
**Expected:** The Location dropdown empties and refills with only the second company's locations; creating the request persists with the correct company_id.
**Why human:** Requires live user session, multi-company data seeded, and network access to verify DB record.

#### 3. No company selector for ungranted users

**Test:** Log in as a user with no extra company access, open New Request, New Job, New Asset.
**Expected:** No Company field appears anywhere in the three modals.
**Why human:** Requires live session; conditional rendering depends on runtime data from page server component.

---

### Gaps Summary

No gaps. All 6 must-have truths are verified in the codebase:

- The DB migration file is substantive and matches the plan spec exactly.
- Both server actions are fully implemented (not stubs) with correct client types.
- The prop chain from settings page through to `UserFormDialog` is complete and wired at every hop.
- All three create forms (Requests, Jobs, Assets) have the company selector conditional rendering, location filtering, and `effectiveCompanyId` passed to their respective create actions.
- All three create actions validate the company_id override against `user_company_access` before using it.
- TypeScript has zero errors in implementation files (one pre-existing error in an e2e test file unrelated to this task).
- All 5 commits documented in SUMMARY.md are confirmed present in git history.

---

_Verified: 2026-03-11_
_Verifier: Claude (gsd-verifier)_
