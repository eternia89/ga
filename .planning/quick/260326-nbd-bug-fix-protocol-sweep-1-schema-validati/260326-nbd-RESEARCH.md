# Bug Fix Protocol Sweep 1: Schema Validation Gaps - Research

**Researched:** 2026-03-26
**Domain:** Zod validation schemas + corresponding UI Input maxLength attributes
**Confidence:** HIGH (all files read directly, zero inference)

## Summary

Exhaustive sweep of all 11 validation schema files (`lib/validations/*.ts`) and all 15 action files (`app/actions/*.ts`) plus `lib/notifications/actions.ts`. Every `z.string()`, `z.array()`, and ID field was audited against CLAUDE.md conventions.

**Total issues found: 14** across 5 bug classes. Most issues are in `asset-schema.ts` and `template-schema.ts` (name max too high), inline action schemas (missing `.max()` on arrays and strings), and UI components (maxLength mismatch).

## Complete Inventory of Issues

### Bug Class 1: z.string() Missing .max()

| # | File | Field | Current | Problem | Fix |
|---|------|-------|---------|---------|-----|
| 1 | `app/actions/user-actions.ts:186` | `deactivateUser` > `reason` | `z.string().optional()` | No `.max()` -- unbounded string | `z.string().max(200).optional()` (notes/description convention) |
| 2 | `app/actions/job-actions.ts:442` | `updateJobStatus` > `status` inline schema `updated_at` field is fine -- it's a machine token. **NOT a bug.** | -- | -- | -- |
| 3 | `lib/notifications/actions.ts:111` | `getAllNotifications` > `cursor` | `z.string().optional()` | No `.max()` -- unbounded cursor string | `z.string().max(100).optional()` (ISO timestamp cursor) |

**Confirmed OK (not bugs):**
- `updated_at: z.string().optional()` in `asset-actions.ts:93`, `request-actions.ts:79`, `job-schema.ts:42` -- these are optimistic locking tokens (machine-generated ISO timestamps), not user input. They go through `.optional()` and are validated against DB values. Acceptable without `.max()` since they are never user-controlled. **However**, for defense-in-depth they SHOULD have `.max(50)` to cap at ISO timestamp length. Marking as LOW priority.
- `company-settings-actions.ts:38-39` has `.min(1).max(100)` and `.max(100)` -- already capped.

### Bug Class 2: z.array() Missing .max() on Array Itself

| # | File | Field | Current | Problem | Fix |
|---|------|-------|---------|---------|-----|
| 4 | `app/actions/company-actions.ts:181` | `bulkDeactivateCompanies` > `ids` | `z.array(z.string().uuid())` | No `.max()` on array | `z.array(z.string().uuid()).max(100)` |
| 5 | `app/actions/category-actions.ts:209` | `bulkDeactivateCategories` > `ids` | `z.array(z.string().uuid())` | No `.max()` on array | `z.array(z.string().uuid()).max(100)` |
| 6 | `app/actions/location-actions.ts:174` | `bulkDeactivateLocations` > `ids` | `z.array(z.string().uuid())` | No `.max()` on array | `z.array(z.string().uuid()).max(100)` |
| 7 | `app/actions/division-actions.ts:184` | `bulkDeactivateDivisions` > `ids` | `z.array(z.string().uuid())` | No `.max()` on array | `z.array(z.string().uuid()).max(100)` |
| 8 | `app/actions/user-company-access-actions.ts:33` | `updateUserCompanyAccess` > `companyIds` | `z.array(z.string().uuid())` | No `.max()` on array | `z.array(z.string().uuid()).max(50)` |

**Confirmed OK (already have .max()):**
- `job-schema.ts:17` -- `z.array(z.string().uuid()).max(50).default([])`
- `job-schema.ts:41` -- `z.array(z.string().uuid()).max(50).optional()`
- `asset-actions.ts:630` -- `z.array(z.string().uuid()).min(1).max(10)`
- `template-schema.ts:28` -- `z.array(z.string().max(100)).min(1).max(20)`
- `template-schema.ts:53` -- `z.array(checklistItemSchema).min(1).max(100)`
- `pm-job-actions.ts:108` -- `z.array(z.string().max(2048)).max(20)`

### Bug Class 3: Name Fields with .max() > 60

Per CLAUDE.md: "Name fields (company, division, location, category): 60 chars"

| # | File | Field | Current | CLAUDE.md Rule | Fix |
|---|------|-------|---------|----------------|-----|
| 9 | `lib/validations/asset-schema.ts:9` | `assetCreateSchema` > `name` | `.max(100)` | Entity name should be 60 | `.max(60)` |
| 10 | `lib/validations/template-schema.ts:50` | `templateCreateSchema` > `name` | `.max(100)` | Entity name should be 60 | `.max(60)` |

**Corresponding UI Input maxLength updates needed:**

| # | File | Line | Current | Fix |
|---|------|------|---------|-----|
| 11 | `components/assets/asset-submit-form.tsx:274` | name Input | `maxLength={100}` | `maxLength={60}` |
| 12 | `components/assets/asset-edit-form.tsx:281` | name Input | `maxLength={100}` | `maxLength={60}` |
| 13 | `components/maintenance/template-create-form.tsx:111` | name Input | `maxLength={100}` | `maxLength={60}` |
| 14 | `components/maintenance/template-detail.tsx:239` | name Input | `maxLength={100}` | `maxLength={60}` |

**Confirmed OK (already 60):**
- `category-schema.ts` name: `.max(60)`
- `company-schema.ts` name: `.max(60)`
- `division-schema.ts` name: `.max(60)`
- `location-schema.ts` name: `.max(60)`
- `user-schema.ts` full_name: `.max(60)`

### Bug Class 4: ID Fields Using .min(1) Instead of .uuid()

**No issues found.** All `*_id` and `*Id` fields in schemas and inline actions correctly use `.uuid()`. Verified:
- `asset-schema.ts`: category_id, location_id, company_id, asset_id, movement_id, receiver_id -- all `.uuid()`
- `division-schema.ts`: company_id -- `.uuid()`
- `location-schema.ts`: company_id -- `.uuid()`
- `job-schema.ts`: location_id, category_id, company_id, id, assigned_to, job_id, request_id -- all `.uuid()`
- `request-schema.ts`: location_id, company_id, category_id, assigned_to -- all `.uuid()`
- `schedule-schema.ts`: template_id -- `.uuid()`, item_id uses `optionalUuid()`, company_id -- `.uuid()`
- `template-schema.ts`: category_id uses `optionalUuid()`, id in checklistItemBase -- `.uuid()`
- `user-schema.ts`: company_id, division_id, location_id -- `.uuid()` or `optionalUuid()`
- All inline action schemas use `.uuid()` for ID fields

### Bug Class 5: Date Fields Using .min(1) Instead of isoDateString()

**No issues found.** All date fields correctly use the `isoDateString()` helper:
- `asset-schema.ts`: `acquisition_date: isoDateString(...)`, `warranty_expiry: isoDateString().optional()`
- `schedule-schema.ts`: `start_date: isoDateString().optional()`

Note: The task description mentioned "asset-schema date fields use .min(1)" as a known issue, but this was apparently already fixed -- both `acquisition_date` and `warranty_expiry` currently use `isoDateString()`.

## Lower Priority Issues (Defense-in-Depth)

These are machine-generated tokens, not user input, but could benefit from `.max()` for defense-in-depth:

| File | Field | Current | Suggested |
|------|-------|---------|-----------|
| `lib/validations/job-schema.ts:42` | `updated_at` | `z.string().optional()` | `z.string().max(50).optional()` |
| `app/actions/asset-actions.ts:93` | `updated_at` | `z.string().optional()` | `z.string().max(50).optional()` |
| `app/actions/request-actions.ts:79` | `updated_at` | `z.string().optional()` | `z.string().max(50).optional()` |

These are recommended but not critical since the values are never rendered or stored from user input.

## Files NOT Needing Changes (Verified Clean)

All schemas and action files below were audited and have no issues:

**Schemas:**
- `lib/validations/helpers.ts` -- utility functions, no schemas
- `lib/validations/category-schema.ts` -- all fields properly capped
- `lib/validations/company-schema.ts` -- all fields properly capped
- `lib/validations/division-schema.ts` -- all fields properly capped
- `lib/validations/location-schema.ts` -- all fields properly capped
- `lib/validations/request-schema.ts` -- all fields properly capped
- `lib/validations/schedule-schema.ts` -- all fields properly capped (numeric, not string)
- `lib/validations/user-schema.ts` -- all fields properly capped
- `lib/validations/job-schema.ts` -- all string fields capped, arrays have `.max()`

**Actions (no inline schema issues):**
- `app/actions/approval-actions.ts` -- all inline schemas OK (uuid IDs, reason has .max(1000))
- `app/actions/asset-actions.ts` -- references imported schemas, inline schemas OK
- `app/actions/category-actions.ts` -- imported schema + ID-only inline schemas
- `app/actions/company-actions.ts` -- imported schema + ID-only inline schemas
- `app/actions/company-settings-actions.ts` -- inline schema has .max(100) on both fields
- `app/actions/division-actions.ts` -- imported schema + ID-only inline schemas
- `app/actions/job-actions.ts` -- imported schemas, inline schemas use .uuid()
- `app/actions/location-actions.ts` -- imported schema + ID-only inline schemas
- `app/actions/pm-job-actions.ts` -- inline schemas properly capped
- `app/actions/profile-actions.ts` -- inline schemas have .max(60) and .max(255)
- `app/actions/request-actions.ts` -- imported schemas, inline reason has .min(1).max(1000)
- `app/actions/schedule-actions.ts` -- imported schemas, inline schemas use .uuid()
- `app/actions/template-actions.ts` -- imported schemas, inline schemas use .uuid()

## Implementation Plan

### Priority 1: Schema Fixes (14 changes across 7 files)

**File 1: `lib/validations/asset-schema.ts`**
- Line 9: Change `.max(100)` to `.max(60)` on `name` field

**File 2: `lib/validations/template-schema.ts`**
- Line 50: Change `.max(100)` to `.max(60)` on `name` field

**File 3: `app/actions/user-actions.ts`**
- Line 186: Change `reason: z.string().optional()` to `reason: z.string().max(200).optional()`

**File 4: `app/actions/company-actions.ts`**
- Line 181: Add `.max(100)` to `ids` array: `z.array(z.string().uuid()).max(100)`

**File 5: `app/actions/category-actions.ts`**
- Line 209: Add `.max(100)` to `ids` array: `z.array(z.string().uuid()).max(100)`

**File 6: `app/actions/location-actions.ts`**
- Line 174: Add `.max(100)` to `ids` array: `z.array(z.string().uuid()).max(100)`

**File 7: `app/actions/division-actions.ts`**
- Line 184: Add `.max(100)` to `ids` array: `z.array(z.string().uuid()).max(100)`

**File 8: `app/actions/user-company-access-actions.ts`**
- Line 33: Add `.max(50)` to `companyIds` array: `z.array(z.string().uuid()).max(50)`

**File 9: `lib/notifications/actions.ts`**
- Line 111: Change `cursor: z.string().optional()` to `cursor: z.string().max(100).optional()`

### Priority 2: UI maxLength Updates (4 changes across 4 files)

**File 10: `components/assets/asset-submit-form.tsx`**
- Line 274: Change `maxLength={100}` to `maxLength={60}` on name Input

**File 11: `components/assets/asset-edit-form.tsx`**
- Line 281: Change `maxLength={100}` to `maxLength={60}` on name Input

**File 12: `components/maintenance/template-create-form.tsx`**
- Line 111: Change `maxLength={100}` to `maxLength={60}` on name Input

**File 13: `components/maintenance/template-detail.tsx`**
- Line 239: Change `maxLength={100}` to `maxLength={60}` on name Input

### Priority 3: Defense-in-Depth (3 optional changes)

**File 14: `lib/validations/job-schema.ts`**
- Line 42: Change `updated_at: z.string().optional()` to `updated_at: z.string().max(50).optional()`

**File 15: `app/actions/asset-actions.ts`**
- Line 93: Change `updated_at: z.string().optional()` to `updated_at: z.string().max(50).optional()`

**File 16: `app/actions/request-actions.ts`**
- Line 79: Change `updated_at: z.string().optional()` to `updated_at: z.string().max(50).optional()`

## Test Impact

These are all validation-only changes (tightening constraints). No business logic changes. The only risk is that existing data with names > 60 chars would fail validation on edit. Since these schemas are for form input validation (not DB reads), this only affects future writes.

**Database impact:** None. These are Zod client-side/server-action validations, not DB constraints. If the DB has asset names > 60 chars, they will remain. Only new creates/updates will be constrained.

## Sources

### Primary (HIGH confidence)
- Direct file reads of all 11 `lib/validations/*.ts` files
- Direct file reads of all 15 `app/actions/*.ts` files
- Direct file reads of `lib/notifications/actions.ts`
- Direct file reads of all referenced UI form components
- `CLAUDE.md` Validation Conventions section (lines 197-210)
