---
phase: quick-65
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/validations/asset-schema.ts
  - components/assets/asset-submit-form.tsx
  - components/assets/asset-create-dialog.tsx
  - app/(dashboard)/inventory/page.tsx
  - components/assets/asset-edit-form.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Assets are always created with a valid company_id — null profile.company_id is caught at schema validation time"
    - "Single-company users see a disabled Company input pre-filled with their company name; company_id is submitted automatically"
    - "Multi-company users see a Combobox to pick any accessible company; selected company_id is submitted"
    - "Changing the selected company in multi-company mode resets the Location field"
    - "Existing asset edits continue to work — AssetEditForm passes Zod validation with company_id from the asset record"
  artifacts:
    - path: "lib/validations/asset-schema.ts"
      provides: "assetCreateSchema with required company_id"
      contains: "company_id: z.string().uuid"
    - path: "components/assets/asset-submit-form.tsx"
      provides: "Form that always submits company_id"
      contains: "primaryCompanyId"
    - path: "components/assets/asset-create-dialog.tsx"
      provides: "Dialog passing primaryCompanyId prop"
    - path: "app/(dashboard)/inventory/page.tsx"
      provides: "Page passing profile.company_id as primaryCompanyId"
    - path: "components/assets/asset-edit-form.tsx"
      provides: "Edit form whose defaultValues include company_id from the asset record"
      contains: "company_id: asset.company_id"
  key_links:
    - from: "app/(dashboard)/inventory/page.tsx"
      to: "components/assets/asset-create-dialog.tsx"
      via: "primaryCompanyId prop (profile.company_id)"
      pattern: "primaryCompanyId"
    - from: "components/assets/asset-submit-form.tsx"
      to: "lib/validations/asset-schema.ts"
      via: "zodResolver(assetCreateSchema) — company_id now required"
      pattern: "assetCreateSchema"
    - from: "components/assets/asset-edit-form.tsx"
      to: "lib/validations/asset-schema.ts"
      via: "zodResolver(assetEditSchema) — company_id must be in defaultValues"
      pattern: "company_id: asset.company_id"
---

<objective>
Make company_id required in the asset create schema and wire the primary company ID into the form's default values so assets are always created under a valid company scope. Also fix AssetEditForm to include company_id in defaultValues so the aliased assetEditSchema continues to validate cleanly on edits.

Purpose: If profile.company_id is null/undefined, the current optional schema allows asset creation without a company, breaking RLS and multi-tenant data isolation. Matching the same guarantee that requests and jobs have via server-side fallback, but enforced at the schema level.
Output: assetCreateSchema with required company_id; AssetSubmitForm always submits company_id; single-company users see disabled field auto-populated; multi-company users see interactive Combobox; AssetEditForm passes company_id from the existing asset record so edits never fail Zod validation.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key patterns from codebase:
- request-submit-form.tsx and job-form.tsx both use the same Company field UI: disabled Input for single-company, Combobox for multi-company
- Both forms manage selectedCompanyId state; submit passes effectiveCompanyId only for multi-company selection
- The asset form already has the Company UI implemented — but does NOT pre-populate company_id in defaultValues, and the schema has company_id as optional
- asset-actions.ts createAsset already handles: effectiveCompanyId = parsedInput.company_id ?? profile.company_id (server-side fallback remains as safety net)
- asset-actions.ts updateAsset does NOT write company_id in its .update({...}) payload — company cannot change after creation, and the field is safely ignored at the DB layer regardless of what the schema passes in

Existing AssetSubmitForm props:
  primaryCompanyName: string  (used for disabled Input display)
  extraCompanies?: { id: string; name: string }[]
  allLocations?: { id: string; name: string; company_id: string }[]

Missing prop needed: primaryCompanyId: string
  - Set as defaultValues.company_id so single-company users always submit it
  - Multi-company users' selectedCompanyId overrides it at submit time

AssetEditForm constraint:
  assetEditSchema is an alias for assetCreateSchema. Making company_id required in the schema means AssetEditForm's useForm defaultValues (lines 91-101) must include company_id or Zod validation will fail on every edit save. The asset prop (InventoryItemWithRelations) provides company_id. No UI change needed — the field stays hidden in the edit form.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Make company_id required in schema and wire primaryCompanyId through dialog to form</name>
  <files>
    lib/validations/asset-schema.ts,
    components/assets/asset-create-dialog.tsx,
    components/assets/asset-submit-form.tsx,
    app/(dashboard)/inventory/page.tsx
  </files>
  <action>
**lib/validations/asset-schema.ts** — Change line 17 from optional to required:
```
// Before:
company_id: z.string().uuid().optional(),

// After:
company_id: z.string().uuid({ message: 'Company is required' }),
```
assetEditSchema is an alias for assetCreateSchema — its change is handled in Task 2.

**components/assets/asset-create-dialog.tsx** — Add `primaryCompanyId: string` to the `AssetCreateDialogProps` interface and pass it through to `AssetSubmitForm`:
```tsx
interface AssetCreateDialogProps {
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  initialOpen?: boolean;
  extraCompanies?: { id: string; name: string }[];
  allLocations?: { id: string; name: string; company_id: string }[];
  primaryCompanyName: string;
  primaryCompanyId: string;   // ADD THIS
}
```
Destructure `primaryCompanyId` and pass it to `<AssetSubmitForm>`.

**components/assets/asset-submit-form.tsx** — Three changes:

1. Add `primaryCompanyId: string` to `AssetSubmitFormProps` interface.

2. Set `company_id` in `defaultValues`:
```tsx
const form = useForm<AssetCreateFormData>({
  resolver: zodResolver(assetCreateSchema),
  defaultValues: {
    name: '',
    category_id: '',
    location_id: '',
    brand: '',
    model: '',
    serial_number: '',
    description: '',
    acquisition_date: new Date().toISOString().split('T')[0],
    warranty_expiry: '',
    company_id: primaryCompanyId,   // ADD THIS — always set from profile
  },
});
```

3. Update `onSubmit` to always pass `company_id`. Replace the `effectiveCompanyId` block:
```tsx
// Before:
const effectiveCompanyId =
  extraCompanies && extraCompanies.length > 1 && selectedCompanyId
    ? selectedCompanyId
    : undefined;
const result = await createAsset({ ...data, company_id: effectiveCompanyId });

// After:
const effectiveCompanyId =
  extraCompanies && extraCompanies.length > 1 && selectedCompanyId
    ? selectedCompanyId
    : primaryCompanyId;
const result = await createAsset({ ...data, company_id: effectiveCompanyId });
```
(The `company_id` in `data` already equals `primaryCompanyId` for single-company users via defaultValues, but being explicit in submit avoids any risk of stale form state.)

Also update the `onValueChange` handler for the company Combobox to update the form field:
```tsx
onValueChange={(val) => {
  setSelectedCompanyId(val);
  form.setValue('company_id', val);   // keep form state in sync
  form.setValue('location_id', '');
}}
```

**app/(dashboard)/inventory/page.tsx** — Pass `primaryCompanyId` to `<AssetCreateDialog>`:
```tsx
<AssetCreateDialog
  categories={categories ?? []}
  locations={locations ?? []}
  initialOpen={action === 'create'}
  extraCompanies={extraCompanies}
  allLocations={allLocations}
  primaryCompanyName={primaryCompanyName}
  primaryCompanyId={profile.company_id}   // ADD THIS
/>
```
`profile.company_id` is already fetched in the existing `user_profiles` select query.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - `npm run build` completes with no TypeScript errors
    - assetCreateSchema.shape.company_id is required (no .optional() wrapper)
    - AssetCreateDialog and AssetSubmitForm both accept and thread primaryCompanyId
    - inventory/page.tsx passes profile.company_id as primaryCompanyId
  </done>
</task>

<task type="auto">
  <name>Task 2: Fix AssetEditForm defaultValues to include company_id</name>
  <files>
    components/assets/asset-edit-form.tsx
  </files>
  <action>
assetEditSchema is an alias for assetCreateSchema. Now that company_id is required in that schema, AssetEditForm's useForm defaultValues must include it or every asset save will fail Zod validation.

In `components/assets/asset-edit-form.tsx`, locate the `useForm<AssetEditFormData>` call (around line 89–102) and add `company_id` to `defaultValues`:

```tsx
const form = useForm<AssetEditFormData>({
  resolver: zodResolver(assetEditSchema),
  defaultValues: {
    name: asset.name ?? '',
    category_id: asset.category_id ?? '',
    location_id: asset.location_id ?? '',
    brand: asset.brand ?? '',
    model: asset.model ?? '',
    serial_number: asset.serial_number ?? '',
    description: asset.description ?? '',
    acquisition_date: asset.acquisition_date ?? '',
    warranty_expiry: asset.warranty_expiry ?? '',
    company_id: asset.company_id ?? '',   // ADD THIS — required by assetEditSchema alias
  },
});
```

No UI change needed — the company field is not rendered in the edit form, and the value is simply carried through to satisfy schema validation. The `updateAsset` action's `.update({...})` payload does not include `company_id`, so the value passes Zod but is not written to the database — correct behavior since company cannot change after creation.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - `npm run build` completes with no TypeScript errors
    - AssetEditForm defaultValues includes `company_id: asset.company_id ?? ''`
    - Saving an existing asset no longer fails Zod validation due to missing company_id
    - The company_id value is not written to the DB (updateAsset payload excludes it)
  </done>
</task>

</tasks>

<verification>
After both tasks pass build:
1. Open /inventory?action=create as a single-company user — Company field shows disabled Input with company name pre-filled; submitting creates asset with correct company_id
2. Open /inventory?action=create as a multi-company user — Company field shows Combobox; selecting a different company updates location options; submitting uses selected company_id
3. Open an existing asset detail page, make a field change, save — no Zod validation error; asset updates successfully
4. Confirm no regression: existing assets still load, asset detail page still works
</verification>

<success_criteria>
- Build passes (zero TS errors)
- company_id in assetCreateSchema is z.string().uuid() without .optional()
- Single-company create flow: company_id = profile.company_id always submitted
- Multi-company create flow: company_id = selectedCompanyId when user picks another company
- No null company_id can reach the createAsset action via the form
- Edit flow: AssetEditForm passes Zod validation — company_id comes from asset.company_id in defaultValues; updateAsset does not write it to DB
</success_criteria>

<output>
After completion, create `.planning/quick/65-make-company-id-required-in-asset-create/65-SUMMARY.md` with what was changed and any decisions made.
</output>
