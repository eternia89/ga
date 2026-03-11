---
phase: quick-50
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(dashboard)/requests/page.tsx
  - app/(dashboard)/jobs/page.tsx
  - app/(dashboard)/inventory/page.tsx
  - components/requests/request-create-dialog.tsx
  - components/requests/request-submit-form.tsx
  - components/jobs/job-create-dialog.tsx
  - components/jobs/job-modal.tsx
  - components/jobs/job-form.tsx
  - components/assets/asset-create-dialog.tsx
  - components/assets/asset-submit-form.tsx
autonomous: true
requirements: [QUICK-50]

must_haves:
  truths:
    - "New Request modal always shows a Company field regardless of user's multi-company access"
    - "New Job modal always shows a Company field regardless of user's multi-company access"
    - "New Asset modal always shows a Company field regardless of user's multi-company access"
    - "Users with single-company access see a disabled/read-only Company field showing their company name"
    - "Users with multi-company access see an interactive Combobox defaulting to their primary company"
  artifacts:
    - path: "components/requests/request-submit-form.tsx"
      provides: "Company field always rendered, disabled or interactive based on extraCompanies"
    - path: "components/jobs/job-form.tsx"
      provides: "Company field always rendered, disabled or interactive based on extraCompanies"
    - path: "components/assets/asset-submit-form.tsx"
      provides: "Company field always rendered, disabled or interactive based on extraCompanies"
  key_links:
    - from: "app/(dashboard)/requests/page.tsx"
      to: "components/requests/request-create-dialog.tsx"
      via: "primaryCompanyName prop"
      pattern: "primaryCompanyName"
    - from: "components/requests/request-create-dialog.tsx"
      to: "components/requests/request-submit-form.tsx"
      via: "primaryCompanyName prop"
      pattern: "primaryCompanyName"
    - from: "app/(dashboard)/jobs/page.tsx"
      to: "components/jobs/job-create-dialog.tsx"
      via: "primaryCompanyName prop"
      pattern: "primaryCompanyName"
    - from: "components/jobs/job-create-dialog.tsx"
      to: "components/jobs/job-modal.tsx"
      via: "primaryCompanyName prop"
      pattern: "primaryCompanyName"
    - from: "components/jobs/job-modal.tsx"
      to: "components/jobs/job-form.tsx"
      via: "primaryCompanyName prop"
      pattern: "primaryCompanyName"
    - from: "app/(dashboard)/inventory/page.tsx"
      to: "components/assets/asset-create-dialog.tsx"
      via: "primaryCompanyName prop"
      pattern: "primaryCompanyName"
    - from: "components/assets/asset-create-dialog.tsx"
      to: "components/assets/asset-submit-form.tsx"
      via: "primaryCompanyName prop"
      pattern: "primaryCompanyName"
---

<objective>
All three insertion modals (New Request, New Job, New Asset) must always display a Company field. Users with single-company access see it disabled showing their company name; users with multi-company access see an interactive Combobox defaulting to their primary company.

Purpose: Ensure company context is always visible when creating entities, improving transparency especially for GA staff/leads who may have multi-company access.
Output: Modified form components and three server pages passing primaryCompanyName.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key context extracted from codebase:

**Current pattern in all 3 forms (request-submit-form, job-form, asset-submit-form):**
The Company field is only shown when `extraCompanies && extraCompanies.length > 1`:
```tsx
{mode === 'create' && extraCompanies && extraCompanies.length > 1 && (
  <div className="space-y-2">
    <label className="text-sm font-medium">Company</label>
    <Combobox
      options={extraCompanies.map(c => ({ label: c.name, value: c.id }))}
      value={selectedCompanyId ?? extraCompanies[0].id}
      ...
    />
  </div>
)}
```
(request-submit-form and asset-submit-form omit `mode === 'create'` check since they are create-only)

**Current prop threading:**
- Page → Dialog/Modal → Form: `extraCompanies?: { id: string; name: string }[]`
- `extraCompanies` is empty array `[]` when user has no extra company access
- `extraCompanies` contains ALL accessible companies (primary + extras) when user has extra access
- Primary company name is NOT currently passed — must add `primaryCompanyName` prop

**What needs to change:**
1. Pages: also fetch and pass `primaryCompanyName` (company name for `profile.company_id`)
2. Dialogs: accept and pass through `primaryCompanyName` prop
3. Job chain has an intermediate hop: `JobCreateDialog → JobModal → JobForm` — `job-modal.tsx` must also accept and thread the prop
4. Forms: replace the conditional `extraCompanies.length > 1` guard with always-shown Company field logic:
   - If `extraCompanies.length > 1` (has extra access): show Combobox (existing behavior)
   - If `extraCompanies.length <= 1` (no extra access): show disabled Input with `primaryCompanyName`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add primaryCompanyName prop threading from pages through dialogs to forms</name>
  <files>
    app/(dashboard)/requests/page.tsx,
    app/(dashboard)/jobs/page.tsx,
    app/(dashboard)/inventory/page.tsx,
    components/requests/request-create-dialog.tsx,
    components/jobs/job-create-dialog.tsx,
    components/jobs/job-modal.tsx,
    components/assets/asset-create-dialog.tsx
  </files>
  <action>
**Step 1 — Fetch primary company name in each page:**

In all three pages (`requests/page.tsx`, `jobs/page.tsx`, `inventory/page.tsx`), add a company name fetch to the existing `Promise.all`. Each page already has `profile.company_id`. Add:
```ts
supabase.from('companies').select('name').eq('id', profile.company_id).single()
```
Add this as an additional parallel fetch in the `Promise.all`. Extract the result as `primaryCompanyName = companyResult.data?.name ?? ''`.

**Step 2 — Pass primaryCompanyName to dialog components:**

In each page's JSX, add `primaryCompanyName={primaryCompanyName}` to:
- `<RequestCreateDialog ... primaryCompanyName={primaryCompanyName} />`
- `<JobCreateDialog ... primaryCompanyName={primaryCompanyName} />`
- `<AssetCreateDialog ... primaryCompanyName={primaryCompanyName} />`

**Step 3 — Update dialog components to accept and thread the prop:**

In `RequestCreateDialog`, `JobCreateDialog`, and `AssetCreateDialog`:
- Add `primaryCompanyName: string` to the Props interface
- Accept it in the destructured props
- Pass it through to the inner form/modal:
  - `RequestCreateDialog` → `<RequestSubmitForm primaryCompanyName={primaryCompanyName} ...>`
  - `JobCreateDialog` → `<JobModal primaryCompanyName={primaryCompanyName} ...>`
  - `AssetCreateDialog` → `<AssetSubmitForm primaryCompanyName={primaryCompanyName} ...>`

**Step 4 — For JobModal, thread to JobForm:**

`JobModal` (`components/jobs/job-modal.tsx`) wraps `JobForm`. Add `primaryCompanyName: string` to `JobModal`'s Props interface, accept it in destructured props, and pass it to `<JobForm primaryCompanyName={primaryCompanyName} ...>`. This is a required intermediate hop — without it, `JobForm` will not receive the prop.
  </action>
  <verify>TypeScript compiles without errors: `npm run build 2>&1 | grep -E "error TS|Type error" | head -20`</verify>
  <done>All three pages pass primaryCompanyName; all dialog components accept and thread it to their respective form components (including job-modal.tsx as the intermediate hop for the job chain); no TS errors</done>
</task>

<task type="auto">
  <name>Task 2: Update all three forms to always show Company field</name>
  <files>
    components/requests/request-submit-form.tsx,
    components/jobs/job-form.tsx,
    components/assets/asset-submit-form.tsx
  </files>
  <action>
In each form, update the Company field rendering logic. Current condition:
```tsx
{extraCompanies && extraCompanies.length > 1 && ( ... Combobox ... )}
```

Replace with an always-visible Company field block:

```tsx
{/* Company field — always visible */}
<div className="space-y-2">
  <label className="text-sm font-medium">Company</label>
  {extraCompanies && extraCompanies.length > 1 ? (
    <Combobox
      options={extraCompanies.map(c => ({ label: c.name, value: c.id }))}
      value={selectedCompanyId ?? extraCompanies[0].id}
      onValueChange={(val) => {
        setSelectedCompanyId(val);
        form.setValue('location_id', '');
      }}
      placeholder="Select company"
      searchPlaceholder="Search companies..."
      emptyText="No companies found"
      disabled={isSubmitting}
    />
  ) : (
    <Input
      value={primaryCompanyName}
      disabled
      className="bg-muted text-muted-foreground cursor-not-allowed"
    />
  )}
</div>
```

Add `primaryCompanyName: string` to each form's Props interface and destructure it.

For `job-form.tsx`, the existing guard also checks `mode === 'create'` before the company block. Keep that — the Company field should only render in create mode for job-form (it makes no sense in edit mode where company is immutable). For request-submit-form and asset-submit-form, they are create-only components so no mode check needed.

**Imports to verify:** `Input` from `@/components/ui/input` — confirm it's already imported in request-submit-form (it may not be; add if missing).

**TypeScript:** Add `primaryCompanyName: string` to each Props interface. All three forms receive `primaryCompanyName` from Task 1.
  </action>
  <verify>
    1. `npm run build` completes with no TypeScript errors
    2. Run `npm run lint` — no new lint errors
  </verify>
  <done>
    - All three create modals show Company field in both single-company and multi-company modes
    - Single company: disabled Input showing company name (bg-muted, cursor-not-allowed)
    - Multi-company: interactive Combobox with primary company pre-selected
    - No TypeScript or lint errors
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. Start dev server: `npm run dev`
2. Log in as a single-company user → open New Request/Job/Asset modal → Company field appears disabled showing company name
3. Log in as a multi-company user → open any modal → Company field shows Combobox with all accessible companies, primary company selected by default
4. Selecting a different company in multi-company mode filters the location dropdown accordingly (existing behavior preserved)
</verification>

<success_criteria>
- Company field visible in all 3 create modals for ALL users
- Single-company users: disabled field, no interaction possible
- Multi-company users: interactive Combobox, defaults to primary company
- No regressions in existing location filtering or form submission logic
- `npm run build` succeeds
</success_criteria>

<output>
After completion, create `.planning/quick/50-all-insertion-modals-show-company-field-/50-SUMMARY.md` using the summary template.
</output>
