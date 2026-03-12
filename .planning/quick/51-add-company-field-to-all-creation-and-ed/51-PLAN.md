---
phase: quick-51
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  # Schedule create flow
  - app/(dashboard)/maintenance/page.tsx
  - components/maintenance/schedule-create-dialog.tsx
  - components/maintenance/schedule-form.tsx
  # Template create flow
  - app/(dashboard)/maintenance/templates/page.tsx
  - components/maintenance/template-create-dialog.tsx
  - components/maintenance/template-create-form.tsx
  # Request edit — disabled company field on detail page
  - app/(dashboard)/requests/[id]/page.tsx
  - components/requests/request-detail-client.tsx
  - components/requests/request-detail-info.tsx
  - components/requests/request-edit-form.tsx
  # Job edit — disabled company field on detail page (via job-detail-info.tsx directly)
  - app/(dashboard)/jobs/[id]/page.tsx
  - components/jobs/job-detail-client.tsx
  - components/jobs/job-detail-info.tsx
  # Asset edit — disabled company field (data already available via asset.company)
  - components/assets/asset-detail-info.tsx
  - components/assets/asset-edit-form.tsx
  # Schedule detail — disabled company field
  - app/(dashboard)/maintenance/schedules/[id]/page.tsx
  - components/maintenance/schedule-detail.tsx
  # Template detail — disabled company field
  - app/(dashboard)/maintenance/templates/[id]/page.tsx
  - components/maintenance/template-detail.tsx
autonomous: true
requirements: [QUICK-51]

must_haves:
  truths:
    - "Every create modal (Request, Job, Asset, Schedule, Template) shows a Company field — Combobox for multi-company users, disabled Input for single-company users"
    - "Every edit/detail page (Request, Job, Asset, Schedule, Template) shows a Company field — always disabled Input, never editable after creation"
    - "Single-company users see their company name in a disabled Input on all create AND edit forms"
    - "Multi-company users can pick company on create forms; company field is still disabled (immutable) on edit/detail pages"
  artifacts:
    - path: "components/maintenance/schedule-form.tsx"
      provides: "Company field in ScheduleCreateForm (disabled Input or Combobox)"
    - path: "components/maintenance/template-create-form.tsx"
      provides: "Company field in TemplateCreateForm (disabled Input or Combobox)"
    - path: "components/requests/request-detail-info.tsx"
      provides: "Disabled Company Input in read-only view and edit view"
    - path: "components/requests/request-edit-form.tsx"
      provides: "Disabled Company Input at form top"
    - path: "components/jobs/job-detail-info.tsx"
      provides: "Disabled Company Input rendered directly in job-detail-info.tsx (no job-form.tsx involvement)"
    - path: "components/assets/asset-edit-form.tsx"
      provides: "Disabled Company Input using asset.company.name"
    - path: "components/maintenance/schedule-detail.tsx"
      provides: "Disabled Company Input in schedule detail/edit view"
    - path: "components/maintenance/template-detail.tsx"
      provides: "Disabled Company Input in template detail/edit view"
  key_links:
    - from: "app/(dashboard)/maintenance/page.tsx"
      to: "components/maintenance/schedule-create-dialog.tsx"
      via: "primaryCompanyName + extraCompanies props"
      pattern: "primaryCompanyName"
    - from: "components/maintenance/schedule-create-dialog.tsx"
      to: "components/maintenance/schedule-form.tsx"
      via: "ScheduleCreateForm props"
      pattern: "primaryCompanyName"
    - from: "app/(dashboard)/requests/[id]/page.tsx"
      to: "components/requests/request-detail-client.tsx"
      via: "companyName prop"
      pattern: "companyName"
    - from: "app/(dashboard)/jobs/[id]/page.tsx"
      to: "components/jobs/job-detail-client.tsx"
      via: "companyName prop"
      pattern: "companyName"
    - from: "components/jobs/job-detail-client.tsx"
      to: "components/jobs/job-detail-info.tsx"
      via: "companyName prop threaded to JobDetailInfo"
      pattern: "companyName"
---

<objective>
Add Company field to all remaining creation forms (Schedule, Template) and all editing/detail pages for every domain entity (Request, Job, Asset, Schedule, Template).

Purpose: Company field visibility rule — always show Company field everywhere. On creation: disabled Input for single-company users, interactive Combobox for multi-company users. On edit/detail pages: ALWAYS disabled Input — company is immutable after creation.

Output: Company field rendered consistently across all 5 domain entity create and edit surfaces.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

# Prior art from quick-50 (same pattern)
# quick-50 added Company field to Request, Job, Asset create modals.
# quick-51 extends to Schedule/Template creates AND all edit/detail pages.

<interfaces>
<!-- Pattern established in quick-50 — Company field rendering rule -->
<!-- Create forms: disabled Input when extraCompanies.length <= 1, Combobox when > 1 -->
<!-- Edit/detail forms: ALWAYS disabled Input, company is immutable after creation -->

Disabled Input pattern (single-company create OR any edit):
```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Company</label>
  <Input
    value={companyName}
    disabled
    className="bg-muted text-muted-foreground cursor-not-allowed"
  />
</div>
```

Multi-company Combobox pattern (create forms only, when extraCompanies.length > 1):
```tsx
{extraCompanies && extraCompanies.length > 1 ? (
  <Combobox
    options={extraCompanies.map(c => ({ label: c.name, value: c.id }))}
    value={selectedCompanyId ?? extraCompanies[0].id}
    onValueChange={(val) => setSelectedCompanyId(val)}
    placeholder="Select company"
    ...
  />
) : (
  <Input value={primaryCompanyName} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
)}
```

From components/assets/asset-submit-form.tsx (reference implementation):
  - props: extraCompanies?: { id: string; name: string }[]; primaryCompanyName: string;
  - state: const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  - submit: const effectiveCompanyId = extraCompanies && extraCompanies.length > 1 && selectedCompanyId ? selectedCompanyId : undefined;

From lib/types/database.ts:
  InventoryItemWithRelations already has: company: { name: string } | null

From app/(dashboard)/inventory/[id]/page.tsx:
  asset query joins: '*, category:categories(name), location:locations(name), company:companies(name)'
  — Company name already available on asset object in AssetDetailInfo/AssetEditForm

For Request/Job/Schedule/Template detail pages:
  - Pages know profile.company_id
  - Need to fetch company name: supabase.from('companies').select('name').eq('id', profile.company_id).single()
  - Add to parallel Promise.all fetch
  - Pass companyName: string down through client components to edit forms

Job detail component chain (confirmed by reading source):
  app/(dashboard)/jobs/[id]/page.tsx
    → <JobDetailClient companyName={companyName} ...>   (components/jobs/job-detail-client.tsx)
      → <JobDetailInfo companyName={companyName} ...>   (components/jobs/job-detail-info.tsx)
  job-detail-info.tsx renders the editable form directly — there is NO job-form.tsx in the detail/edit path.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Company field to Schedule and Template create modals</name>
  <files>
    app/(dashboard)/maintenance/page.tsx,
    components/maintenance/schedule-create-dialog.tsx,
    components/maintenance/schedule-form.tsx,
    app/(dashboard)/maintenance/templates/page.tsx,
    components/maintenance/template-create-dialog.tsx,
    components/maintenance/template-create-form.tsx
  </files>
  <action>
Follow the identical pattern established in quick-50 for Request/Job/Asset create modals.

**Schedule create flow:**

1. `app/(dashboard)/maintenance/page.tsx` — Add to the existing parallel Promise.all:
   - `supabase.from('companies').select('name').eq('id', profile.company_id).single()` to get `primaryCompanyName`
   - Also fetch `extraCompanies` if user has multi-company access: query `user_company_access` joined with `companies` for this user, same pattern as jobs/page.tsx and requests/page.tsx
   - Pass `primaryCompanyName` and `extraCompanies` props to `<ScheduleCreateDialog>`

2. `components/maintenance/schedule-create-dialog.tsx` — Accept and thread `primaryCompanyName: string` and `extraCompanies?: { id: string; name: string }[]` props down to `<ScheduleForm>`.

3. `components/maintenance/schedule-form.tsx` — In `ScheduleCreateForm`:
   - Add `primaryCompanyName: string`, `extraCompanies?: { id: string; name: string }[]` to `CreateFormProps`
   - Add `useState<string | null>(null)` for `selectedCompanyId`
   - Add Company field at the TOP of the form (before Template & Asset section), using the same pattern as asset-submit-form.tsx: disabled Input if `extraCompanies.length <= 1`, Combobox otherwise
   - Pass `company_id: effectiveCompanyId` to `createSchedule()` call — check if `createSchedule` action accepts `company_id` (it likely doesn't need it since RLS uses auth context, but include it if the schema allows; otherwise skip the company_id pass — the Company field is display-only context, not always submitted)
   - Note: schedules are per-company via RLS; the company field here is informational for multi-company users who may need to know which company they are creating for. If `createSchedule` accepts optional `company_id`, include it. Otherwise the field is display context only (like single-company users).
   - Also thread `extraCompanies` and `primaryCompanyName` through `ScheduleFormProps` → `ScheduleCreateForm`

**Template create flow:**

1. `app/(dashboard)/maintenance/templates/page.tsx` — Add `primaryCompanyName` and `extraCompanies` fetch (same parallel Promise.all pattern). Pass to `<TemplateCreateDialog>`.

2. `components/maintenance/template-create-dialog.tsx` — Accept and thread `primaryCompanyName: string` and `extraCompanies?: { id: string; name: string }[]` props to `<TemplateCreateForm>`.

3. `components/maintenance/template-create-form.tsx` — Add `primaryCompanyName: string`, `extraCompanies?: { id: string; name: string }[]` to `TemplateCreateFormProps`. Add Company field at the TOP of the form using same pattern.

**Important:** For both Schedule and Template creates, if `extraCompanies.length > 1` show Combobox; if single-company show disabled Input. The `selectedCompanyId` state and `effectiveCompanyId` logic follows asset-submit-form.tsx exactly.

To fetch `extraCompanies` on maintenance pages, check how `jobs/page.tsx` does it (it queries `user_company_access` joined to `companies`). Use the same query pattern.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Schedule and Template create modals show Company field at top. Single-company users see disabled Input. Multi-company users see interactive Combobox. Build passes with no TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 2: Add disabled Company field to all edit/detail pages</name>
  <files>
    app/(dashboard)/requests/[id]/page.tsx,
    components/requests/request-detail-client.tsx,
    components/requests/request-detail-info.tsx,
    components/requests/request-edit-form.tsx,
    app/(dashboard)/jobs/[id]/page.tsx,
    components/jobs/job-detail-client.tsx,
    components/jobs/job-detail-info.tsx,
    components/assets/asset-detail-info.tsx,
    components/assets/asset-edit-form.tsx,
    app/(dashboard)/maintenance/schedules/[id]/page.tsx,
    components/maintenance/schedule-detail.tsx,
    app/(dashboard)/maintenance/templates/[id]/page.tsx,
    components/maintenance/template-detail.tsx
  </files>
  <action>
On ALL edit/detail pages, Company field is ALWAYS disabled — company cannot be changed after creation. Use the same disabled Input pattern:

```tsx
<div className="space-y-2">
  <label className="text-sm font-medium">Company</label>
  <Input
    value={companyName}
    disabled
    className="bg-muted text-muted-foreground cursor-not-allowed"
  />
</div>
```

**Request detail page:**

1. `app/(dashboard)/requests/[id]/page.tsx` — Add company name fetch to the parallel Promise.all:
   ```ts
   supabase.from('companies').select('name').eq('id', profile.company_id).single()
   ```
   Extract `companyName = companyResult.data?.name ?? ''`. Pass `companyName` prop to `<RequestDetailClient>`.

2. `components/requests/request-detail-client.tsx` — Accept `companyName: string` prop, thread it down to `<RequestDetailInfo companyName={companyName} ...>`.

3. `components/requests/request-detail-info.tsx` — Accept `companyName: string` prop. Add disabled Company Input at the top of both render paths:
   - The editable path (when `isEditable`) — pass `companyName` to `<RequestEditForm>` and also render a disabled Company Input above/around it
   - The read-only path — render disabled Company Input as the first field section above "Description"

4. `components/requests/request-edit-form.tsx` — Accept `companyName: string` prop. Render disabled Company Input at the TOP of the form (before Description). Since `Input` is already imported, just add the field.

**Job detail page:**

The Job detail edit path does NOT use job-form.tsx. The component chain is:
`app/(dashboard)/jobs/[id]/page.tsx` → `JobDetailClient` → `JobDetailInfo`
`job-detail-info.tsx` renders all editable fields directly as inline state — no sub-form component.

1. `app/(dashboard)/jobs/[id]/page.tsx` — Add company name fetch to the parallel Promise.all:
   ```ts
   supabase.from('companies').select('name').eq('id', profile.company_id).single()
   ```
   Extract `companyName = companyResult.data?.name ?? ''`. Pass `companyName: string` prop to `<JobDetailClient>`.

2. `components/jobs/job-detail-client.tsx` — Add `companyName: string` to `JobDetailClientProps`. Thread it down by adding `companyName={companyName}` to the `<JobDetailInfo ...>` call.

3. `components/jobs/job-detail-info.tsx` — Add `companyName: string` to `JobDetailInfoProps`. Render a disabled Company Input at the very TOP of the form, before the Title row (i.e., as the first child of the `<form>` element):
   ```tsx
   {/* Company — always shown, always disabled */}
   <div className="space-y-2">
     <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company</Label>
     <Input
       value={companyName}
       disabled
       className="bg-muted text-muted-foreground cursor-not-allowed"
     />
   </div>
   ```
   Use `Label` (already imported) and `Input` (already imported). No mode guard — the field is always rendered and always disabled.

**Asset detail page:**

Asset's company name is already available via `asset.company?.name` (InventoryItemWithRelations joins company:companies(name)). No extra fetch needed.

1. `components/assets/asset-detail-info.tsx` — Add disabled Company Input at the TOP of BOTH render paths (canEdit/edit form and read-only view), using `asset.company?.name ?? ''`.

2. `components/assets/asset-edit-form.tsx` — Add `companyName?: string` prop (or pass asset directly — but the asset object isn't available here, just its fields in form defaultValues). Simplest: accept `companyName: string` prop from `AssetDetailInfo`. Add disabled Company Input at the top of the form.
   - In `AssetDetailInfo`, pass `companyName={asset.company?.name ?? ''}` to `<AssetEditForm>`.

**Schedule detail page:**

1. `app/(dashboard)/maintenance/schedules/[id]/page.tsx` — Add company name fetch. Pass `companyName` to `<ScheduleDetail>`.

2. `components/maintenance/schedule-detail.tsx` — Accept `companyName: string` prop. Add disabled Company Input at top of the detail view.

**Template detail page:**

1. `app/(dashboard)/maintenance/templates/[id]/page.tsx` — Add company name fetch. Pass `companyName` to `<TemplateDetail>`.

2. `components/maintenance/template-detail.tsx` — Accept `companyName: string` prop. Add disabled Company Input at top of the detail/edit view.

**Placement:** Company field goes at the very top of each form/detail view, before all other fields — same as the create modals. `Input` component is already imported in most form files.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>All five domain entity edit/detail pages show a disabled Company Input at the top of their edit forms and read-only detail views. Build passes with no TypeScript errors.</done>
</task>

</tasks>

<verification>
Run `npm run build` — must pass with zero TypeScript errors and zero warnings about missing props.

Manual spot-checks:
1. Open New Schedule modal on /maintenance — Company field appears at top
2. Open New Template modal on /maintenance/templates — Company field appears at top
3. Open a Request detail page — Company field shows (disabled) above Description
4. Open a Job detail page — Company field shows (disabled) at the top of the form
5. Open an Asset detail page — Company field shows (disabled) at top of edit form
6. Open a Schedule detail page — Company field shows (disabled)
7. Open a Template detail page — Company field shows (disabled)
</verification>

<success_criteria>
- All 5 entity types show Company field in both their create modals AND their edit/detail pages
- Company field on create modals: disabled Input for single-company, Combobox for multi-company
- Company field on ALL edit/detail pages: always disabled Input regardless of company access level
- `npm run build` passes with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/51-add-company-field-to-all-creation-and-ed/51-SUMMARY.md`
</output>
