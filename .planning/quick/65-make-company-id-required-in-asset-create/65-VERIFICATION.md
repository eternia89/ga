---
phase: quick-65
verified: 2026-03-13T00:00:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Quick Task 65: Make company_id Required in Asset Create — Verification Report

**Task Goal:** Make company_id required in asset create schema with default from profile; allow multi-company users to select other companies
**Verified:** 2026-03-13
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                        | Status     | Evidence                                                                                  |
|----|----------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------|
| 1  | Assets are always created with a valid company_id — null profile.company_id caught at schema  | VERIFIED  | `asset-schema.ts:17` — `z.string().uuid({ message: 'Company is required' })`, no `.optional()` |
| 2  | Single-company users see a disabled Company input pre-filled; company_id submitted automatically | VERIFIED | `asset-submit-form.tsx:83-94` — `defaultValues.company_id: primaryCompanyId`; `lines 253-259` — disabled Input rendered for non-multi-company case; `onSubmit:142-144` — falls back to `primaryCompanyId` |
| 3  | Multi-company users see a Combobox to pick any accessible company; selected company_id is submitted | VERIFIED | `asset-submit-form.tsx:239-260` — Combobox rendered when `extraCompanies.length > 1`; `onSubmit:141-144` — `effectiveCompanyId = selectedCompanyId` when multi-company |
| 4  | Changing the selected company in multi-company mode resets the Location field                 | VERIFIED  | `asset-submit-form.tsx:243-247` — `onValueChange` calls `form.setValue('location_id', '')` |
| 5  | Existing asset edits continue to work — AssetEditForm passes Zod validation with company_id   | VERIFIED  | `asset-edit-form.tsx:101` — `company_id: asset.company_id ?? ''` in `defaultValues` |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                          | Expected                                        | Status    | Details                                                                 |
|---------------------------------------------------|-------------------------------------------------|-----------|-------------------------------------------------------------------------|
| `lib/validations/asset-schema.ts`                 | assetCreateSchema with required company_id      | VERIFIED  | Line 17: `z.string().uuid({ message: 'Company is required' })`         |
| `components/assets/asset-submit-form.tsx`         | Form that always submits company_id             | VERIFIED  | Props include `primaryCompanyId: string`; `defaultValues` and `onSubmit` both set company_id |
| `components/assets/asset-create-dialog.tsx`       | Dialog passing primaryCompanyId prop            | VERIFIED  | Props interface line 22 and JSX line 71: `primaryCompanyId={primaryCompanyId}` |
| `app/(dashboard)/inventory/page.tsx`              | Page passing profile.company_id as primaryCompanyId | VERIFIED | Line 213: `primaryCompanyId={profile.company_id ?? ''}` on `<AssetCreateDialog>` |
| `components/assets/asset-edit-form.tsx`           | Edit form defaultValues include company_id from asset record | VERIFIED | Line 101: `company_id: asset.company_id ?? ''` |

### Key Link Verification

| From                               | To                            | Via                                              | Status   | Details                                                                |
|------------------------------------|-------------------------------|--------------------------------------------------|----------|------------------------------------------------------------------------|
| `app/(dashboard)/inventory/page.tsx` | `asset-create-dialog.tsx`   | `primaryCompanyId` prop (`profile.company_id`)   | WIRED    | Line 213 passes `profile.company_id ?? ''` as `primaryCompanyId`      |
| `asset-submit-form.tsx`            | `lib/validations/asset-schema.ts` | `zodResolver(assetCreateSchema)` — company_id required | WIRED | Line 8 imports schema; line 82 applies resolver; line 93 sets `defaultValues.company_id` |
| `asset-edit-form.tsx`              | `lib/validations/asset-schema.ts` | `zodResolver(assetEditSchema)` — company_id in defaultValues | WIRED | Line 7 imports schema; line 90 applies resolver; line 101 sets `company_id: asset.company_id ?? ''` |

### Additional File Fixed (Deviation)

The task auto-fixed a blocking deviation: `app/(dashboard)/inventory/new/page.tsx` also renders `<AssetSubmitForm>` directly. After `primaryCompanyId` became a required prop, this file was updated to pass `primaryCompanyId={profile.company_id ?? ''}` (line 74). Verified present and correct.

### Requirements Coverage

No requirement IDs declared in plan frontmatter (`requirements: []`).

### Anti-Patterns Found

None detected. No TODO/FIXME/placeholder comments in modified files. No stub implementations. No empty handlers.

### Human Verification Required

The following behaviors require runtime testing to fully validate:

1. **Single-company create flow**
   - **Test:** Log in as a single-company user, open /inventory?action=create. Verify the Company field shows a disabled input pre-filled with company name. Submit the form — confirm the created asset has the correct company_id in the database.
   - **Expected:** Asset saved under user's company; no Zod validation error
   - **Why human:** Disabled field rendering and DB write cannot be verified programmatically

2. **Multi-company create flow with location reset**
   - **Test:** Log in as a multi-company user, open /inventory?action=create. Change the company selection in the Combobox — verify the Location field clears. Submit — confirm the asset is saved under the selected company.
   - **Expected:** Location resets on company change; asset saved under selected company
   - **Why human:** Dynamic form state interaction requires browser testing

3. **Edit flow regression**
   - **Test:** Open an existing asset detail page, make any field change, save. Confirm no Zod validation error and the asset updates successfully.
   - **Expected:** Save succeeds; company_id is not changed on the asset record
   - **Why human:** Zod runtime validation and DB update behavior require live testing

### Gaps Summary

None. All five observable truths are verified against actual code. All artifacts exist, are substantive, and are wired correctly. The one deviation from the plan (fixing `inventory/new/page.tsx`) was handled correctly and verified.

---

_Verified: 2026-03-13_
_Verifier: Claude (gsd-verifier)_
