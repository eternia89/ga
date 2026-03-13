---
phase: quick-69
verified: 2026-03-13T11:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: null
gaps: []
human_verification:
  - test: "Create a schedule using a general template (no category)"
    expected: "Asset field is hidden entirely. Schedule saves with item_id = null."
    why_human: "Conditional rendering depends on runtime template selection state"
  - test: "Create a schedule using an asset-specific template (has category)"
    expected: "Asset field is shown and marked required. Saving without asset fails validation."
    why_human: "Zod schema allows null item_id — enforcement depends on form-level conditional logic, not schema-level required"
  - test: "View the schedule list with an asset-free schedule present"
    expected: "Asset column shows a dash (—), no broken link"
    why_human: "Requires database row with null item_id"
  - test: "Open the detail page for an asset-free schedule"
    expected: "Shows 'General schedule (no asset)' subtitle. No broken asset link."
    why_human: "Requires runtime navigation to the page"
---

# Quick 69: Make Schedules Not Asset-Locked Verification Report

**Phase Goal:** Make maintenance schedules not locked to a specific asset (item_id optional). Schedules can be created for routine tasks without requiring an asset. When creating from a general-type template (no category), the asset field is hidden. When creating from an asset-specific template (has category), asset field remains required. Asset-related schedules auto-set company_id from the asset's parent company.
**Verified:** 2026-03-13T11:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Schedules can be created without an asset when template has no category (general template) | VERIFIED | `createSchedule` branches on `parsedInput.item_id`; form hides asset field when `!templateHasCategory`; Zod schema has `item_id: z.string().uuid().nullable().optional()` |
| 2 | Schedules created from a template with a category still require an asset | VERIFIED | Asset field shown and asterisk-marked when `templateHasCategory`; action validates asset when item_id is present |
| 3 | When item_id is provided, company_id is auto-set from the asset's company | VERIFIED | `actions/schedule-actions.ts` lines 38–62: fetches asset and sets `companyId = asset.company_id` |
| 4 | When item_id is null, company_id comes from the user's selected company | VERIFIED | `actions/schedule-actions.ts` line 65: `companyId = parsedInput.company_id ?? profile.company_id` |
| 5 | Schedule list table shows dash for asset column when no asset linked | VERIFIED | `schedule-columns.tsx` lines 51–52: `if (!assetId \|\| !asset) return <span>—</span>` |
| 6 | Schedule detail page handles null asset gracefully (no broken links or errors) | VERIFIED | `schedule-detail.tsx` line 285: `schedule.item_id && schedule.asset?.name` guard; `page.tsx` lines 127–141: conditional link with "General schedule (no asset)" fallback |
| 7 | generate_pm_jobs function handles null item_id (uses LEFT JOIN, skips asset name) | VERIFIED | Migration `00024` line 43: `LEFT JOIN inventory_items ii ON ii.id = ms.item_id`; line 96: `COALESCE(' - ' || v_schedule.asset_name, '')` |

**Score:** 7/7 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/00024_schedules_nullable_item_id.sql` | ALTER item_id to nullable, update generate_pm_jobs | VERIFIED | EXISTS + SUBSTANTIVE: contains `ALTER COLUMN item_id DROP NOT NULL` and `CREATE OR REPLACE FUNCTION generate_pm_jobs()` with `LEFT JOIN` and `COALESCE` |
| `lib/validations/schedule-schema.ts` | item_id as optional/nullable in create schema | VERIFIED | `item_id: z.string().uuid().nullable().optional()` on line 9; `company_id: z.string().uuid().optional()` on line 10 |
| `lib/types/maintenance.ts` | item_id as `string \| null` in MaintenanceSchedule type | VERIFIED | Line 87: `item_id: string \| null;` |
| `app/actions/schedule-actions.ts` | createSchedule handling null item_id with company_id logic | VERIFIED | Lines 37–66: full branching logic for asset-linked vs asset-free; conditional `revalidatePath` on all actions |
| `components/maintenance/schedule-form.tsx` | Conditional asset field visibility based on template category | VERIFIED | `templateHasCategory` derived at line 133; asset field wrapped in `{(templateHasCategory \|\| !selectedTemplateId) && ...}` at line 283; `form.setValue('item_id', null)` when switching to general template at line 172 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `components/maintenance/schedule-form.tsx` | `app/actions/schedule-actions.ts` | `createSchedule` action | WIRED | `createSchedule(submitData)` called at line 201; `submitData` includes `company_id` for asset-free flows |
| `app/actions/schedule-actions.ts` | `supabase maintenance_schedules` | insert with nullable item_id | WIRED | `item_id: parsedInput.item_id ?? null` in insert payload at line 81 |
| `supabase/migrations/00024_schedules_nullable_item_id.sql` | `maintenance_schedules.item_id` | `ALTER COLUMN DROP NOT NULL` | WIRED | Line 10: `ALTER COLUMN item_id DROP NOT NULL` confirmed present |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| QUICK-69 | 69-PLAN.md | Make schedules not asset-locked | SATISFIED | All 7 observable truths verified; migration, schema, types, actions, form, and views all updated |

---

### Anti-Patterns Found

None. No TODO/FIXME/placeholder stubs found in modified application files. The only TypeScript compilation error (`e2e/tests/phase-06-inventory/asset-crud.spec.ts:107`) is a pre-existing issue in an E2E test file, unrelated to this phase.

---

### Human Verification Required

#### 1. Asset field hidden for general template

**Test:** Open the "Create Schedule" dialog. Select a template that has no category (general). Verify the Asset field disappears and a note "This is a general template (no asset category). No asset required." appears.
**Expected:** Asset field hidden; form submits successfully without an asset; schedule is created with `item_id = null`.
**Why human:** Conditional rendering is driven by runtime `selectedTemplate?.category_id` state; cannot verify dynamic UI behavior statically.

#### 2. Asset field shown and required for category-specific template

**Test:** Select a template that has a category. Verify the Asset field appears with a required asterisk. Attempt to submit without selecting an asset.
**Expected:** Form blocks submission or server action returns a validation/category-mismatch error.
**Why human:** The Zod schema allows null `item_id` — the form-level "required" enforcement is purely visual (asterisk) and depends on which templates have categories; not enforced at schema level.

#### 3. Schedule list with null item_id rows

**Test:** Navigate to `/maintenance`, Schedules tab. Find an asset-free schedule (seeded by `seed-ops.ts`).
**Expected:** Asset column shows "—" with no broken link.
**Why human:** Requires database rows with `item_id = null` from seeded data.

#### 4. Detail page for asset-free schedule

**Test:** Click "View" on an asset-free schedule, then navigate to its detail page.
**Expected:** Page subtitle reads "General schedule (no asset)". No asset link in header. No auto-pause notice.
**Why human:** Runtime page rendering with real data required.

---

### Gaps Summary

No gaps. All must-haves are verified. The goal is fully achieved:

- The database migration correctly makes `item_id` nullable and updates `generate_pm_jobs` with `LEFT JOIN` and `COALESCE`.
- The Zod schema allows `item_id` to be null or absent.
- The `MaintenanceSchedule` TypeScript type reflects `string | null`.
- The `createSchedule` server action properly branches on `item_id` presence for both asset validation and `company_id` derivation.
- All schedule CRUD actions conditionally `revalidatePath` the asset detail page only when `item_id` is non-null.
- The create form hides the asset field when a general template (no category) is selected, and clears any previously selected asset.
- The schedule table, detail component, view modal, and detail page all handle null `item_id` / null `asset` gracefully.
- Seed data includes 2 asset-free schedules demonstrating the feature.

The single TypeScript error (`e2e/tests/.../asset-crud.spec.ts`) is pre-existing, in a test file, and unrelated to this phase.

---

_Verified: 2026-03-13T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
