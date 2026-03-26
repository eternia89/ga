---
phase: quick-260326-nbd
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/validations/asset-schema.ts
  - lib/validations/template-schema.ts
  - lib/validations/job-schema.ts
  - app/actions/user-actions.ts
  - app/actions/company-actions.ts
  - app/actions/category-actions.ts
  - app/actions/location-actions.ts
  - app/actions/division-actions.ts
  - app/actions/user-company-access-actions.ts
  - lib/notifications/actions.ts
  - app/actions/asset-actions.ts
  - app/actions/request-actions.ts
  - components/assets/asset-submit-form.tsx
  - components/assets/asset-edit-form.tsx
  - components/maintenance/template-create-form.tsx
  - components/maintenance/template-detail.tsx
autonomous: true
must_haves:
  truths:
    - "Every z.string() field in validation schemas has a .max() constraint"
    - "Every z.array() field in action schemas has a .max() constraint"
    - "Name fields for assets and templates are capped at 60 chars per CLAUDE.md"
    - "UI Input maxLength attributes match their corresponding Zod schema .max() values"
    - "Defense-in-depth: updated_at optimistic locking tokens have .max(50)"
  artifacts:
    - path: "lib/validations/asset-schema.ts"
      provides: "Asset name .max(60)"
      contains: ".max(60)"
    - path: "lib/validations/template-schema.ts"
      provides: "Template name .max(60)"
      contains: ".max(60)"
    - path: "app/actions/user-actions.ts"
      provides: "Deactivate reason .max(200)"
      contains: ".max(200)"
    - path: "app/actions/company-actions.ts"
      provides: "Bulk deactivate ids .max(100)"
      contains: ".max(100)"
    - path: "app/actions/category-actions.ts"
      provides: "Bulk deactivate ids .max(100)"
      contains: ".max(100)"
    - path: "app/actions/location-actions.ts"
      provides: "Bulk deactivate ids .max(100)"
      contains: ".max(100)"
    - path: "app/actions/division-actions.ts"
      provides: "Bulk deactivate ids .max(100)"
      contains: ".max(100)"
    - path: "app/actions/user-company-access-actions.ts"
      provides: "Company access ids .max(50)"
      contains: ".max(50)"
    - path: "lib/notifications/actions.ts"
      provides: "Cursor string .max(100)"
      contains: ".max(100)"
  key_links:
    - from: "lib/validations/asset-schema.ts"
      to: "components/assets/asset-submit-form.tsx"
      via: "Schema .max(60) matches Input maxLength={60}"
      pattern: "maxLength=\\{60\\}"
    - from: "lib/validations/template-schema.ts"
      to: "components/maintenance/template-create-form.tsx"
      via: "Schema .max(60) matches Input maxLength={60}"
      pattern: "maxLength=\\{60\\}"
---

<objective>
Fix 14 schema validation gaps found during Bug Fix Protocol Sweep 1.

Purpose: Enforce CLAUDE.md validation conventions — every z.string() needs .max(), every z.array() needs .max(), name fields cap at 60 chars, and UI maxLength attributes match their schema counterparts. Also adds defense-in-depth .max(50) to 3 machine-generated updated_at tokens.

Output: 16 files updated with tightened validation constraints. Zero business logic changes.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260326-nbd-bug-fix-protocol-sweep-1-schema-validati/260326-nbd-RESEARCH.md
@CLAUDE.md (Validation Conventions section)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix all Zod schema and action validation gaps (12 files)</name>
  <files>
    lib/validations/asset-schema.ts,
    lib/validations/template-schema.ts,
    lib/validations/job-schema.ts,
    app/actions/user-actions.ts,
    app/actions/company-actions.ts,
    app/actions/category-actions.ts,
    app/actions/location-actions.ts,
    app/actions/division-actions.ts,
    app/actions/user-company-access-actions.ts,
    lib/notifications/actions.ts,
    app/actions/asset-actions.ts,
    app/actions/request-actions.ts
  </files>
  <action>
Apply these exact edits (line numbers from RESEARCH.md, verify each before editing):

**Name field max reductions (100 to 60):**
1. `lib/validations/asset-schema.ts` ~line 9: Change `.max(100)` to `.max(60)` on the `name` field in `assetCreateSchema`
2. `lib/validations/template-schema.ts` ~line 50: Change `.max(100)` to `.max(60)` on the `name` field in `templateCreateSchema`

**Unbounded z.array() — add .max():**
3. `app/actions/company-actions.ts` ~line 181: `bulkDeactivateCompanies` inline schema `ids` — change `z.array(z.string().uuid())` to `z.array(z.string().uuid()).max(100)`
4. `app/actions/category-actions.ts` ~line 209: `bulkDeactivateCategories` inline schema `ids` — change `z.array(z.string().uuid())` to `z.array(z.string().uuid()).max(100)`
5. `app/actions/location-actions.ts` ~line 174: `bulkDeactivateLocations` inline schema `ids` — change `z.array(z.string().uuid())` to `z.array(z.string().uuid()).max(100)`
6. `app/actions/division-actions.ts` ~line 184: `bulkDeactivateDivisions` inline schema `ids` — change `z.array(z.string().uuid())` to `z.array(z.string().uuid()).max(100)`
7. `app/actions/user-company-access-actions.ts` ~line 33: `updateUserCompanyAccess` inline schema `companyIds` — change `z.array(z.string().uuid())` to `z.array(z.string().uuid()).max(50)`

**Unbounded z.string() — add .max():**
8. `app/actions/user-actions.ts` ~line 186: `deactivateUser` inline schema `reason` — change `z.string().optional()` to `z.string().max(200).optional()`
9. `lib/notifications/actions.ts` ~line 111: `getAllNotifications` inline schema `cursor` — change `z.string().optional()` to `z.string().max(100).optional()`

**Defense-in-depth — updated_at tokens add .max(50):**
10. `lib/validations/job-schema.ts` ~line 42: Change `updated_at: z.string().optional()` to `updated_at: z.string().max(50).optional()`
11. `app/actions/asset-actions.ts` ~line 93: Change `updated_at: z.string().optional()` to `updated_at: z.string().max(50).optional()`
12. `app/actions/request-actions.ts` ~line 79: Change `updated_at: z.string().optional()` to `updated_at: z.string().max(50).optional()`

**Important:** Line numbers are approximate from the research phase. Read each file and locate the exact field before editing. Do NOT blindly edit by line number — find the schema field by name, then apply the change.

After all edits, run a final grep sweep to confirm no remaining unbounded `z.string()` or `z.array()` fields exist in these files.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -50 && npm run lint 2>&1 | tail -20</automated>
  </verify>
  <done>
All 12 schema/action files pass TypeScript compilation and linting. Specifically:
- asset-schema.ts and template-schema.ts name fields use .max(60)
- 5 bulk action arrays have .max(100) or .max(50)
- user-actions.ts reason has .max(200)
- notifications/actions.ts cursor has .max(100)
- 3 updated_at tokens have .max(50)
  </done>
</task>

<task type="auto">
  <name>Task 2: Sync UI Input maxLength attributes with schema changes (4 files)</name>
  <files>
    components/assets/asset-submit-form.tsx,
    components/assets/asset-edit-form.tsx,
    components/maintenance/template-create-form.tsx,
    components/maintenance/template-detail.tsx
  </files>
  <action>
Update the name field Input component's `maxLength` prop to match the schema reduction from 100 to 60:

1. `components/assets/asset-submit-form.tsx` ~line 274: Change `maxLength={100}` to `maxLength={60}` on the name Input
2. `components/assets/asset-edit-form.tsx` ~line 281: Change `maxLength={100}` to `maxLength={60}` on the name Input
3. `components/maintenance/template-create-form.tsx` ~line 111: Change `maxLength={100}` to `maxLength={60}` on the name Input
4. `components/maintenance/template-detail.tsx` ~line 239: Change `maxLength={100}` to `maxLength={60}` on the name Input

**Important:** Locate each Input by finding the form field for `name` (not other fields that might also have maxLength). Verify it's the entity name field, not a different field.

After edits, do a sweep: grep for `maxLength={100}` across these 4 files to confirm none remain on name fields.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -50 && npm run build 2>&1 | tail -30</automated>
  </verify>
  <done>
All 4 UI form components have maxLength={60} on their name Input fields, matching the updated Zod schemas. Build succeeds with no errors.
  </done>
</task>

</tasks>

<verification>
After both tasks complete, verify the full sweep is clean:

1. `npx tsc --noEmit` — zero type errors
2. `npm run build` — production build succeeds
3. Grep confirmation: no `z.string().optional()` without `.max()` in the 12 edited files
4. Grep confirmation: no `z.array(z.string().uuid())` without `.max()` in the 5 bulk action files
5. Grep confirmation: `maxLength={100}` does NOT appear on name fields in the 4 UI files
</verification>

<success_criteria>
- 14 validation gaps fixed across 16 files (12 schema/action + 4 UI)
- TypeScript compilation passes
- Production build succeeds
- All name fields constrained to 60 chars (schema + UI)
- All bulk arrays capped at 100 (or 50 for company access)
- All unbounded strings now have .max() constraints
- No regressions — these are pure constraint-tightening changes
</success_criteria>

<output>
After completion, create `.planning/quick/260326-nbd-bug-fix-protocol-sweep-1-schema-validati/260326-nbd-SUMMARY.md`
</output>
