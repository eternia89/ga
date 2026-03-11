---
phase: quick-46
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00018_user_company_access.sql
  - app/actions/user-company-access-actions.ts
  - components/admin/users/user-form-dialog.tsx
  - app/(dashboard)/admin/settings/settings-content.tsx
  - components/admin/users/user-table.tsx
  - components/requests/request-create-dialog.tsx
  - components/requests/request-submit-form.tsx
  - components/jobs/job-create-dialog.tsx
  - components/jobs/job-modal.tsx
  - components/jobs/job-form.tsx
  - components/assets/asset-create-dialog.tsx
  - components/assets/asset-submit-form.tsx
  - app/(dashboard)/requests/page.tsx
  - app/(dashboard)/jobs/page.tsx
  - app/(dashboard)/inventory/page.tsx
  - app/actions/request-actions.ts
  - app/actions/job-actions.ts
  - app/actions/asset-actions.ts
  - lib/validations/request-schema.ts
  - lib/validations/job-schema.ts
  - lib/validations/asset-schema.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Admin can open User edit modal and see a 'Additional Company Access' table with all companies listed with checkboxes"
    - "Checking a company checkbox and saving grants that user access; unchecking and saving revokes it"
    - "A user with extra companies sees a Company selector Combobox at the top of New Request, New Job, and New Asset modals"
    - "A user without extra companies sees no company selector in create modals (company hidden, filled from profile)"
    - "Creating an entity with a selected extra company uses that company's company_id for the DB insert"
    - "Selecting a different company in the create modal updates available Locations (and categories for job/asset) to only show that company's data"
  artifacts:
    - path: "supabase/migrations/00018_user_company_access.sql"
      provides: "user_company_access table, RLS policies, admin bypass"
    - path: "app/actions/user-company-access-actions.ts"
      provides: "updateUserCompanyAccess, getUserCompanyAccess server actions"
    - path: "components/admin/users/user-form-dialog.tsx"
      provides: "Multi-company access checkboxes section in edit mode"
    - path: "components/requests/request-submit-form.tsx"
      provides: "Optional company selector when user has extra company access"
    - path: "components/jobs/job-form.tsx"
      provides: "Optional company selector in create mode"
    - path: "components/assets/asset-submit-form.tsx"
      provides: "Optional company selector"
  key_links:
    - from: "components/admin/users/user-form-dialog.tsx"
      to: "app/actions/user-company-access-actions.ts"
      via: "updateUserCompanyAccess call on Save"
      pattern: "updateUserCompanyAccess"
    - from: "app/(dashboard)/admin/settings/settings-content.tsx"
      to: "components/admin/users/user-table.tsx"
      via: "userCompanyAccessMap prop"
      pattern: "userCompanyAccessMap"
    - from: "components/admin/users/user-table.tsx"
      to: "components/admin/users/user-form-dialog.tsx"
      via: "userCompanyAccess prop per user"
      pattern: "userCompanyAccess"
    - from: "app/(dashboard)/requests/page.tsx"
      to: "components/requests/request-create-dialog.tsx"
      via: "extraCompanies prop"
      pattern: "extraCompanies"
    - from: "components/jobs/job-create-dialog.tsx"
      to: "components/jobs/job-modal.tsx"
      via: "extraCompanies + allLocations props forwarded"
      pattern: "extraCompanies"
    - from: "components/jobs/job-modal.tsx"
      to: "components/jobs/job-form.tsx"
      via: "extraCompanies + allLocations props forwarded"
      pattern: "extraCompanies"
    - from: "components/requests/request-submit-form.tsx"
      to: "app/actions/request-actions.ts"
      via: "company_id field in form data"
      pattern: "company_id.*parsedInput"
---

<objective>
Multi-company user access: admins can grant users access to additional companies beyond their main company. Users with extra company access see a Company selector on New Request, New Job, and New Asset modals. Selecting a different company loads that company's locations/categories for the dropdown fields. Users without extra access see no company selector (company is auto-filled from profile as before).

Purpose: Enables corporate group users (e.g., shared GA staff) to create requests/jobs/assets for multiple subsidiary companies without switching accounts.
Output: DB table, server actions, updated user settings modal, updated 3 create modals + their page data fetches.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md

Key patterns from codebase:
- adminActionClient used for all user management operations (bypass RLS via service role)
- authActionClient used for domain entity mutations (createRequest, createJob, createAsset)
- profile.company_id is the source of truth for company scoping in all create actions
- Combobox component used for large-list dropdowns (use for company selector too)
- InlineFeedback for persistent error/success messages (never auto-dismiss)
- All Zod schemas: every string field must have .max(N)
- Desktop-first Tailwind: never use sm:/md:/lg: — only max-sm:/max-md:/max-lg:

<interfaces>
<!-- user-form-dialog.tsx currently receives these props — extend for multi-company -->
type UserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: { id?: string; email: string; full_name: string; role: Role; company_id: string; division_id: string | null; location_id: string | null };
  companies: Company[];       // all companies (for main company selector AND access table)
  divisions: Division[];
  locations: Location[];
  defaultCompanyId?: string;
  onSuccess?: () => void;
  onDeactivate?: () => void;
  onReactivate?: () => void;
  isDeactivated?: boolean;
  // ADD: userCompanyAccess?: string[];  -- company_id[] already granted to this user
};

<!-- create dialog props pattern (request example) -->
interface RequestCreateDialogProps {
  locations: Location[];
  initialOpen?: boolean;
  // ADD: extraCompanies?: { id: string; name: string }[];  -- companies beyond primary
  // ADD: allLocations?: { id: string; name: string; company_id: string }[];  -- locations for all accessible companies
}

<!-- authActionClient ctx provides -->
ctx.profile.company_id  // user's primary company
ctx.profile.id          // user's UUID
ctx.supabase            // RLS-scoped client

<!-- adminActionClient ctx provides -->
ctx.adminSupabase       // service role, bypasses RLS
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: DB migration + server actions for user_company_access</name>
  <files>
    supabase/migrations/00018_user_company_access.sql,
    app/actions/user-company-access-actions.ts
  </files>
  <action>
Create migration file `supabase/migrations/00018_user_company_access.sql` with this exact SQL:

```sql
-- Migration 00018: User multi-company access
-- Grants users access to additional companies beyond their primary company_id.
-- Admin-only write path; users can SELECT their own access rows.

CREATE TABLE IF NOT EXISTS public.user_company_access (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.user_profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);

ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;

-- Users can read their own access rows (needed for create dialog company selector)
CREATE POLICY "user_company_access_select_own" ON public.user_company_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all access rows (needed for user settings modal)
CREATE POLICY "user_company_access_select_admin" ON public.user_company_access
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'admin');

-- Only service role (adminActionClient) can INSERT/UPDATE/DELETE
-- No INSERT/UPDATE/DELETE policies — all writes go through service role client
```

Then push this migration: run `supabase db push` from the project root (or note it as a pending migration if push fails — executor should attempt it and note if env not configured).

Create `app/actions/user-company-access-actions.ts`:

```typescript
'use server';

import { adminActionClient, authActionClient } from '@/lib/safe-action';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Get all company_ids granted to a user (beyond their primary company)
// Used by create modals to determine if company selector should show
export const getUserCompanyAccess = authActionClient
  .schema(z.object({ userId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;
    // Users can only fetch their own access; admins can fetch any user's
    if (profile.id !== parsedInput.userId && profile.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    const { data, error } = await supabase
      .from('user_company_access')
      .select('company_id')
      .eq('user_id', parsedInput.userId);
    if (error) throw new Error(`Failed to fetch company access: ${error.message}`);
    return { companyIds: (data ?? []).map(r => r.company_id) };
  });

// Replace all company access for a user (admin only)
// Receives the full desired set of company_ids — diffs and upserts/deletes
export const updateUserCompanyAccess = adminActionClient
  .schema(z.object({
    userId: z.string().uuid(),
    companyIds: z.array(z.string().uuid()),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const adminSupabase = createAdminClient();
    const { userId, companyIds } = parsedInput;

    // Delete all existing access for this user
    const { error: deleteError } = await adminSupabase
      .from('user_company_access')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw new Error(`Failed to clear company access: ${deleteError.message}`);

    // Insert new access rows if any
    if (companyIds.length > 0) {
      const rows = companyIds.map(cid => ({
        user_id: userId,
        company_id: cid,
        granted_by: ctx.profile.id,
      }));
      const { error: insertError } = await adminSupabase
        .from('user_company_access')
        .insert(rows);
      if (insertError) throw new Error(`Failed to grant company access: ${insertError.message}`);
    }

    revalidatePath('/admin/settings');
    return { success: true };
  });
```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Migration file exists at supabase/migrations/00018_user_company_access.sql with table + RLS. Server actions file exists with getUserCompanyAccess and updateUserCompanyAccess. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: User settings modal — multi-company access checkboxes</name>
  <files>
    components/admin/users/user-form-dialog.tsx,
    app/(dashboard)/admin/settings/settings-content.tsx,
    components/admin/users/user-table.tsx
  </files>
  <action>
### Part A: user-form-dialog.tsx

Edit `components/admin/users/user-form-dialog.tsx` to add a "Additional Company Access" section in edit mode only, below the Location field and before the closing of EntityFormDialog children.

Changes:
1. Add `userCompanyAccess?: string[]` to `UserFormDialogProps` — array of company_ids already granted to this user.
2. Add `selectedExtraCompanies` state initialized from `userCompanyAccess ?? []`.
3. Reset `selectedExtraCompanies` when modal opens/closes (in the `onOpenChange` handler, same as `selectedCompanyId`).
4. Add a toggle function: `toggleCompanyAccess(companyId: string)` — adds or removes from `selectedExtraCompanies`.
5. The section renders only when `isEditMode` and `user?.id` is truthy.

The section UI (rendered inside the EntityFormDialog children, after the Location FormField):

```tsx
{isEditMode && user?.id && (
  <div className="space-y-3 pt-2 border-t">
    <div>
      <p className="text-sm font-medium">Additional Company Access</p>
      <p className="text-xs text-muted-foreground">
        Grant this user access to create requests, jobs, and assets for other companies.
        Does not change their role or primary company.
      </p>
    </div>
    <div className="space-y-2">
      {companies
        .filter(c => c.id !== (user.company_id))
        .map(company => (
          <label key={company.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedExtraCompanies.includes(company.id)}
              onChange={() => toggleCompanyAccess(company.id)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm">{company.name}</span>
          </label>
        ))
      }
      {companies.filter(c => c.id !== user.company_id).length === 0 && (
        <p className="text-xs text-muted-foreground">No other companies available.</p>
      )}
    </div>
  </div>
)}
```

6. Update `handleSubmit` to call `updateUserCompanyAccess` after the main updateUser succeeds (edit mode only):

```typescript
// After updateUser succeeds in edit mode:
if (user?.id) {
  const accessResult = await updateUserCompanyAccess({
    userId: user.id!,
    companyIds: selectedExtraCompanies,
  });
  const accessError = extractActionError(accessResult);
  if (accessError) return { error: `User updated but failed to save company access: ${accessError}` };
}
```

7. Import `updateUserCompanyAccess` from `@/app/actions/user-company-access-actions`.

---

### Part B: settings-content.tsx

Open `app/(dashboard)/admin/settings/settings-content.tsx`. This is a server component (or client component receiving server-fetched data) that renders the settings tabs including the Users tab.

1. Read the current SettingsContentProps type to understand what data it already receives.
2. Add a `userCompanyAccessMap: Record<string, string[]>` prop — maps user_id to their array of granted company_ids.
3. Forward this map down to the UserTable component via a new `userCompanyAccessMap` prop.

If settings-content.tsx is a server component that fetches its own data, add the fetch there instead:
```typescript
// Fetch all user_company_access rows using admin client (needs service role to bypass RLS)
import { createAdminClient } from '@/lib/supabase/admin';
const adminClient = createAdminClient();
const { data: accessRows } = await adminClient
  .from('user_company_access')
  .select('user_id, company_id');

const userCompanyAccessMap: Record<string, string[]> = {};
for (const row of accessRows ?? []) {
  if (!userCompanyAccessMap[row.user_id]) userCompanyAccessMap[row.user_id] = [];
  userCompanyAccessMap[row.user_id].push(row.company_id);
}
```

If settings-content.tsx is a client component that receives props from the page, add the fetch to the page component instead and pass `userCompanyAccessMap` as a prop.

Either way: `userCompanyAccessMap` must be available in settings-content.tsx to forward to UserTable.

---

### Part C: user-table.tsx

Open `components/admin/users/user-table.tsx`. This renders the users table and controls the UserFormDialog.

1. Add `userCompanyAccessMap: Record<string, string[]>` to UserTableProps.
2. When opening the edit dialog for a user, pass `userCompanyAccess={userCompanyAccessMap[user.id] ?? []}` to UserFormDialog.
3. Forward the prop from settings-content.tsx through to the UserFormDialog render site.

The prop chain is: settings-content → UserTable → UserFormDialog (userCompanyAccess per user).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>UserFormDialog in edit mode shows an "Additional Company Access" section with checkboxes for all companies except the user's primary. Checking boxes and saving calls updateUserCompanyAccess. The userCompanyAccessMap flows from settings-content through user-table to user-form-dialog. No TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 3a: Company selector — Requests (schema + action + page + create-dialog + submit-form)</name>
  <files>
    lib/validations/request-schema.ts,
    app/actions/request-actions.ts,
    app/(dashboard)/requests/page.tsx,
    components/requests/request-create-dialog.tsx,
    components/requests/request-submit-form.tsx
  </files>
  <action>
Wire company selection through the Requests create flow.

### Step 1: Update Zod schema

In `lib/validations/request-schema.ts` — add to requestSubmitSchema:
```typescript
company_id: z.string().uuid().optional(),
```

### Step 2: Update create server action

In `app/actions/request-actions.ts`, update `createRequest`:
- After `const { supabase, profile } = ctx;`
- Add: `const effectiveCompanyId = parsedInput.company_id ?? profile.company_id;`
- If `parsedInput.company_id` is provided and differs from primary, validate access:
  ```typescript
  if (parsedInput.company_id && parsedInput.company_id !== profile.company_id) {
    const { data: access } = await supabase
      .from('user_company_access')
      .select('id')
      .eq('user_id', profile.id)
      .eq('company_id', parsedInput.company_id)
      .single();
    if (!access) throw new Error('You do not have access to the selected company.');
  }
  ```
- Replace all occurrences of `profile.company_id` in the insert block with `effectiveCompanyId`.
- The `generate_request_display_id` RPC call: use `effectiveCompanyId` too.

### Step 3: Update page server component

In `app/(dashboard)/requests/page.tsx`:
- After fetching the user profile, fetch this user's extra company access:
  ```typescript
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', profile.id);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  ```
- If `extraCompanyIds.length > 0`, fetch those companies + their locations:
  ```typescript
  const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];
  const { data: extraCompanies } = await supabase
    .from('companies')
    .select('id, name')
    .in('id', allAccessibleCompanyIds)
    .is('deleted_at', null)
    .order('name');
  const { data: allLocations } = await supabase
    .from('locations')
    .select('id, name, company_id')
    .in('company_id', allAccessibleCompanyIds)
    .is('deleted_at', null)
    .order('name');
  ```
- Pass to RequestCreateDialog: `extraCompanies={extraCompanies ?? []}` and `allLocations={allLocations ?? []}`.
- If no extra companies, pass empty arrays (existing behavior unchanged).

### Step 4: Update RequestCreateDialog

In `components/requests/request-create-dialog.tsx`:
- Add props: `extraCompanies?: { id: string; name: string }[]`, `allLocations?: { id: string; name: string; company_id: string }[]`
- Pass both through to RequestSubmitForm.

### Step 5: Update RequestSubmitForm

In `components/requests/request-submit-form.tsx`:
- Add props: `extraCompanies?: { id: string; name: string }[]`, `allLocations?: { id: string; name: string; company_id: string }[]`
- Add state: `const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);`
- Update locationOptions: when `selectedCompanyId` is set AND `allLocations` provided, filter `allLocations` by `company_id === selectedCompanyId`. Otherwise use original `locations` prop.
- Add company selector at top of form (only when `extraCompanies && extraCompanies.length > 1`):
  ```tsx
  {extraCompanies && extraCompanies.length > 1 && (
    <div className="space-y-2">
      <label className="text-sm font-medium">Company</label>
      <Combobox
        options={extraCompanies.map(c => ({ label: c.name, value: c.id }))}
        value={selectedCompanyId ?? extraCompanies[0].id}
        onValueChange={(val) => {
          setSelectedCompanyId(val);
          form.setValue('location_id', '');
        }}
        placeholder="Select company"
        searchPlaceholder="Search companies..."
        emptyMessage="No companies found"
      />
    </div>
  )}
  ```
  Use `Combobox` from `@/components/combobox`.
- Add `company_id: selectedCompanyId ?? undefined` to the data passed to `createRequest`.
- Reset `selectedCompanyId` on form reset/success.

Key notes:
- The `extraCompanies` array from the page INCLUDES the user's primary company as the first entry.
- When no extra companies (length <= 1 or empty), company selector does NOT render. Form behaves exactly as before.
- When `selectedCompanyId` matches primary company or is null, pass `company_id: undefined` (action falls back to `profile.company_id`).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Requests create modal shows a Company Combobox when user has extra company access. Selecting a different company updates Locations. Creating a request with an extra company uses that company_id in the DB insert. No TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 3b: Company selector — Jobs (schema + action + page + create-dialog + job-modal + job-form)</name>
  <files>
    lib/validations/job-schema.ts,
    app/actions/job-actions.ts,
    app/(dashboard)/jobs/page.tsx,
    components/jobs/job-create-dialog.tsx,
    components/jobs/job-modal.tsx,
    components/jobs/job-form.tsx
  </files>
  <action>
Wire company selection through the Jobs create flow. Same pattern as Task 3a but the prop chain is longer: page → JobCreateDialog → JobModal → JobForm.

### Step 1: Update Zod schema

In `lib/validations/job-schema.ts` — add to createJobSchema:
```typescript
company_id: z.string().uuid().optional(),
```

### Step 2: Update create server action

In `app/actions/job-actions.ts`, update `createJob`:
- Add `effectiveCompanyId = parsedInput.company_id ?? profile.company_id`
- Validate access if company_id differs:
  ```typescript
  if (parsedInput.company_id && parsedInput.company_id !== profile.company_id) {
    const { data: access } = await supabase
      .from('user_company_access')
      .select('id')
      .eq('user_id', profile.id)
      .eq('company_id', parsedInput.company_id)
      .single();
    if (!access) throw new Error('You do not have access to the selected company.');
  }
  ```
- Use `effectiveCompanyId` in `generate_job_display_id` RPC and the insert.

### Step 3: Update page server component

In `app/(dashboard)/jobs/page.tsx`:
- Fetch user's extra company access (same pattern as requests page):
  ```typescript
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', profile.id);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];
  ```
- If extraCompanyIds.length > 0, fetch extra companies and all locations across accessible companies:
  ```typescript
  const { data: extraCompanies } = await supabase
    .from('companies').select('id, name')
    .in('id', allAccessibleCompanyIds).is('deleted_at', null).order('name');
  const { data: allLocations } = await supabase
    .from('locations').select('id, name, company_id')
    .in('company_id', allAccessibleCompanyIds).is('deleted_at', null).order('name');
  ```
- Pass `extraCompanies={extraCompanies ?? []}` and `allLocations={allLocations ?? []}` to JobCreateDialog.
- Categories for jobs are global (no company_id filter needed).

### Step 4: Update JobCreateDialog

In `components/jobs/job-create-dialog.tsx`:
- Add props: `extraCompanies?: { id: string; name: string }[]`, `allLocations?: { id: string; name: string; company_id: string }[]`
- Forward both to JobModal.

### Step 5: Update JobModal

In `components/jobs/job-modal.tsx`:
- Read the current JobModalProps interface (around lines 859-872 per checker analysis — adjust to actual line numbers).
- Add to JobModalProps: `extraCompanies?: { id: string; name: string }[]`, `allLocations?: { id: string; name: string; company_id: string }[]`
- Find the JobForm render call in create mode and add `extraCompanies={extraCompanies}` and `allLocations={allLocations}` to pass them through.

### Step 6: Update JobForm

In `components/jobs/job-form.tsx`:
- Add props: `extraCompanies?: { id: string; name: string }[]`, `allLocations?: { id: string; name: string; company_id: string }[]`
- Add state: `const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);`
- Add company selector at top of form in create mode only (when `extraCompanies && extraCompanies.length > 1`):
  ```tsx
  {isCreateMode && extraCompanies && extraCompanies.length > 1 && (
    <div className="space-y-2">
      <label className="text-sm font-medium">Company</label>
      <Combobox
        options={extraCompanies.map(c => ({ label: c.name, value: c.id }))}
        value={selectedCompanyId ?? extraCompanies[0].id}
        onValueChange={(val) => {
          setSelectedCompanyId(val);
          form.setValue('location_id', '');
        }}
        placeholder="Select company"
        searchPlaceholder="Search companies..."
        emptyMessage="No companies found"
      />
    </div>
  )}
  ```
- Filter locationOptions: when `selectedCompanyId` is set AND `allLocations` provided, use `allLocations.filter(l => l.company_id === selectedCompanyId)`. Otherwise use the existing locations prop.
- When company changes, also reset category_id field if applicable.
- Categories for jobs are global — no category filtering needed.
- Include `company_id: selectedCompanyId ?? undefined` in the data passed to createJob.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Jobs create modal shows a Company Combobox when user has extra company access. Selecting a different company updates Locations. Creating a job with an extra company uses that company_id in the DB insert. The prop chain page → JobCreateDialog → JobModal → JobForm is complete. No TypeScript errors.</done>
</task>

<task type="auto">
  <name>Task 3c: Company selector — Assets (schema + action + page + create-dialog + submit-form)</name>
  <files>
    lib/validations/asset-schema.ts,
    app/actions/asset-actions.ts,
    app/(dashboard)/inventory/page.tsx,
    components/assets/asset-create-dialog.tsx,
    components/assets/asset-submit-form.tsx
  </files>
  <action>
Wire company selection through the Assets create flow. Same pattern as Task 3a.

### Step 1: Update Zod schema

In `lib/validations/asset-schema.ts` — add to assetCreateSchema:
```typescript
company_id: z.string().uuid().optional(),
```

### Step 2: Update create server action

In `app/actions/asset-actions.ts`, update `createAsset`:
- Add `effectiveCompanyId = parsedInput.company_id ?? profile.company_id`
- Validate access if company_id differs:
  ```typescript
  if (parsedInput.company_id && parsedInput.company_id !== profile.company_id) {
    const { data: access } = await supabase
      .from('user_company_access')
      .select('id')
      .eq('user_id', profile.id)
      .eq('company_id', parsedInput.company_id)
      .single();
    if (!access) throw new Error('You do not have access to the selected company.');
  }
  ```
- Use `effectiveCompanyId` in `generate_asset_display_id` RPC and the insert.

### Step 3: Update page server component

In `app/(dashboard)/inventory/page.tsx`:
- Fetch user's extra company access:
  ```typescript
  const { data: companyAccessRows } = await supabase
    .from('user_company_access')
    .select('company_id')
    .eq('user_id', profile.id);
  const extraCompanyIds = (companyAccessRows ?? []).map(r => r.company_id);
  const allAccessibleCompanyIds = [profile.company_id, ...extraCompanyIds];
  ```
- If extraCompanyIds.length > 0, fetch extra companies and all locations:
  ```typescript
  const { data: extraCompanies } = await supabase
    .from('companies').select('id, name')
    .in('id', allAccessibleCompanyIds).is('deleted_at', null).order('name');
  const { data: allLocations } = await supabase
    .from('locations').select('id, name, company_id')
    .in('company_id', allAccessibleCompanyIds).is('deleted_at', null).order('name');
  ```
- Pass `extraCompanies={extraCompanies ?? []}` and `allLocations={allLocations ?? []}` to AssetCreateDialog.

### Step 4: Update AssetCreateDialog

In `components/assets/asset-create-dialog.tsx`:
- Add props: `extraCompanies?: { id: string; name: string }[]`, `allLocations?: { id: string; name: string; company_id: string }[]`
- Pass both through to AssetSubmitForm.

### Step 5: Update AssetSubmitForm

In `components/assets/asset-submit-form.tsx`:
- Add props: `extraCompanies?: { id: string; name: string }[]`, `allLocations?: { id: string; name: string; company_id: string }[]`
- Add state: `const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);`
- Add company selector at top of form (only when `extraCompanies && extraCompanies.length > 1`):
  ```tsx
  {extraCompanies && extraCompanies.length > 1 && (
    <div className="space-y-2">
      <label className="text-sm font-medium">Company</label>
      <Combobox
        options={extraCompanies.map(c => ({ label: c.name, value: c.id }))}
        value={selectedCompanyId ?? extraCompanies[0].id}
        onValueChange={(val) => {
          setSelectedCompanyId(val);
          form.setValue('location_id', '');
        }}
        placeholder="Select company"
        searchPlaceholder="Search companies..."
        emptyMessage="No companies found"
      />
    </div>
  )}
  ```
- Filter locationOptions from `allLocations` by `selectedCompanyId` when set. Otherwise use existing `locations` prop.
- Categories for assets are global — no category filtering needed.
- Include `company_id: selectedCompanyId ?? undefined` in data passed to createAsset.
- Reset `selectedCompanyId` on form reset/success.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -30</automated>
  </verify>
  <done>
- Assets create modal shows a Company Combobox when user has extra company access, hidden otherwise.
- Selecting a different company updates the Location dropdown to only show that company's locations.
- Creating an asset with a selected extra company uses that company_id in the DB insert.
- `npm run build` passes with no TypeScript errors.
- Users without extra company access see no change in create modal behavior.
  </done>
</task>

</tasks>

<verification>
1. Run `npm run build` — must complete without errors.
2. Run `npx tsc --noEmit` — zero TypeScript errors.
3. In admin settings > Users, edit a user — "Additional Company Access" section appears below Location field showing all companies except primary with checkboxes.
4. Grant a second company to a test user. Log in as that user. Open New Request modal — Company Combobox appears at top. Selecting the second company updates the Locations dropdown.
5. Create a request under the second company — verify the DB record has the correct company_id.
6. Log in as a user WITHOUT extra company access — no company selector appears in New Request, New Job, New Asset modals.
</verification>

<success_criteria>
- Migration 00018 SQL file exists and can be pushed to Supabase
- Admin can grant/revoke additional company access via user edit modal checkboxes
- The userCompanyAccessMap flows settings-content → user-table → user-form-dialog
- users with multi-company access see a Company Combobox in all 3 create modals
- users without multi-company access see no change to create modal UX
- create actions validate the company_id override against user_company_access before using it
- `npm run build` passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/46-multi-company-user-access-in-user-settin/46-SUMMARY.md` summarizing what was built, files changed, and any decisions made.
</output>
