---
phase: quick-24
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00017_user_profiles_location_id.sql
  - lib/auth/types.ts
  - lib/validations/user-schema.ts
  - components/admin/users/user-columns.tsx
  - components/admin/users/user-form-dialog.tsx
  - components/admin/users/user-table.tsx
  - app/(dashboard)/admin/settings/page.tsx
  - app/(dashboard)/admin/settings/settings-content.tsx
  - app/actions/user-actions.ts
  - app/(dashboard)/layout.tsx
  - components/profile/profile-sheet.tsx
autonomous: true
requirements: [QUICK-24]

must_haves:
  truths:
    - "Admin can assign a location to a user when creating"
    - "Admin can change a user's location when editing"
    - "Location column appears in user table between Division and Status"
    - "User sees their location in the profile sheet"
    - "Location dropdown filters by selected company"
    - "Location resets when company changes"
  artifacts:
    - path: "supabase/migrations/00017_user_profiles_location_id.sql"
      provides: "location_id FK column on user_profiles"
      contains: "location_id"
    - path: "lib/auth/types.ts"
      provides: "UserProfile type with location_id"
      contains: "location_id"
    - path: "lib/validations/user-schema.ts"
      provides: "location_id in create/update schemas"
      contains: "location_id"
  key_links:
    - from: "components/admin/users/user-form-dialog.tsx"
      to: "lib/validations/user-schema.ts"
      via: "Zod schema with location_id"
      pattern: "location_id"
    - from: "app/(dashboard)/admin/settings/page.tsx"
      to: "components/admin/users/user-table.tsx"
      via: "locations prop passed through"
      pattern: "locations="
    - from: "app/(dashboard)/layout.tsx"
      to: "components/profile/profile-sheet.tsx"
      via: "location join in profile select"
      pattern: "location:locations"
---

<objective>
Add location_id field to user_profiles so admins can assign an office location to each user. This involves a DB migration, type updates, form/table/profile UI changes.

Purpose: Users need an assigned office location for operational context (which office they belong to).
Output: Migration file, updated types/schemas, location in user form + table + profile sheet.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/quick/24-add-location-field-to-user-profiles-indi/24-CONTEXT.md

<interfaces>
<!-- Key types and contracts the executor needs -->

From lib/auth/types.ts (current):
```typescript
export type UserProfile = {
  id: string;
  company_id: string;
  division_id: string | null;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  notification_preferences: Record<string, unknown>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};
```

From lib/validations/user-schema.ts (current):
```typescript
export const createUserSchema = z.object({
  email: z.string().max(255).email("Valid email is required"),
  full_name: z.string().min(1, "Name is required").max(100),
  role: z.enum(["general_user", "ga_staff", "ga_lead", "finance_approver", "admin"]),
  company_id: z.string().uuid("Company is required"),
  division_id: z.string().uuid("Division is required"),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  role: z.enum(["general_user", "ga_staff", "ga_lead", "finance_approver", "admin"]),
  company_id: z.string().uuid("Company is required"),
  division_id: z.string().uuid("Division is required").optional().or(z.literal("")),
});
```

From components/admin/users/user-columns.tsx (UserRow type):
```typescript
export type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string;
  division_id: string | null;
  deleted_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  division: { name: string } | null;
  company: { name: string } | null;
};
```

UserFormDialog props include `divisions: Division[]` filtered by company.
UserTable props include `divisions: Division[]`.
SettingsContent passes `locations` already from page.tsx but UserTable does not receive them yet.

Dashboard layout profile select: `.select("*, division:divisions(name), company:companies(name)")`
Settings page user select: `.select("*, division:divisions(name), company:companies(name)")`
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: DB migration + types + schemas</name>
  <files>
    supabase/migrations/00017_user_profiles_location_id.sql,
    lib/auth/types.ts,
    lib/validations/user-schema.ts
  </files>
  <action>
1. Create migration `supabase/migrations/00017_user_profiles_location_id.sql`:
   - `ALTER TABLE user_profiles ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;`
   - `CREATE INDEX idx_user_profiles_location_id ON user_profiles(location_id) WHERE deleted_at IS NULL;`
   - Nullable at DB level so existing users are not broken.

2. Update `lib/auth/types.ts` — add `location_id: string | null;` to `UserProfile` type (after `division_id`).

3. Update `lib/validations/user-schema.ts`:
   - `createUserSchema`: add `location_id: z.string().uuid("Location is required")` — required on create per CONTEXT decision.
   - `updateUserSchema`: add `location_id: z.string().uuid("Location is required").optional().or(z.literal(""))` — same pattern as division_id for backward compat.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Migration file exists, UserProfile type includes location_id, both Zod schemas include location_id field</done>
</task>

<task type="auto">
  <name>Task 2: User table column, form dialog, actions, profile sheet</name>
  <files>
    components/admin/users/user-columns.tsx,
    components/admin/users/user-form-dialog.tsx,
    components/admin/users/user-table.tsx,
    app/(dashboard)/admin/settings/page.tsx,
    app/(dashboard)/admin/settings/settings-content.tsx,
    app/actions/user-actions.ts,
    app/(dashboard)/layout.tsx,
    components/profile/profile-sheet.tsx
  </files>
  <action>
**user-columns.tsx:**
- Add `location_id: string | null;` and `location: { name: string } | null;` to `UserRow` type.
- Add a "Location" column AFTER the "Division" column (before "Status"). Cell renders `row.original.location?.name || '—'`. Use same pattern as the Division column.

**user-form-dialog.tsx:**
- Add `Location` type (`{ id: string; name: string; company_id: string }`) matching Division pattern.
- Add `locations: Location[]` to `UserFormDialogProps`.
- Add `location_id` to `UserFormInput` and `UserUserFormInput` types.
- Add `location_id` to `defaultValues` (`user?.location_id || ''`).
- Add `filteredLocations` computed same as `filteredDivisions` (`locations.filter(l => l.company_id === selectedCompanyId)`).
- In the company `onValueChange` handler, also reset `location_id` if current location does not belong to new company (same pattern as division reset).
- Add a Location `FormField` AFTER Division using a `Select` dropdown (locations list is typically short per company, but per CLAUDE.md use Combobox for lists that may grow large — locations CAN grow, so use Combobox). Actually, per CONTEXT.md decision "Follow the same pattern as division_id" — division uses plain Select, so use plain Select for consistency. Add it after the Division field. Label: "Location" (no optional suffix on create; on edit show "Location" without optional since it is required per CONTEXT).
- Wait — CONTEXT says required on both create and edit. So no "optional" label. Value handler same as division: `onValueChange={(val) => field.onChange(val === "none" ? "" : val)}`, value `{field.value || "none"}`. Include "None" option only in edit mode for backward compat with existing users who have no location set.

**user-table.tsx:**
- Add `Location` type and `locations: Location[]` to `UserTableProps`.
- Accept `locations` prop in the component.
- Pass `locations` to `UserFormDialog`.
- Update `handleBulkExport` headers to include 'Location' after 'Division', and add `u.location?.name || ''` to row data.

**settings-content.tsx:**
- `UserTable` already receives `companies` and `divisions`. Now also pass `locations={locations}`.

**page.tsx (settings):**
- Update user_profiles select to include location join: `.select("*, division:divisions(name), company:companies(name), location:locations(name)")`.
- The `locations` data is already fetched (line 22-24) and passed to `SettingsContent`.

**user-actions.ts:**
- `createUser` action: add `location_id: input.location_id || null` to the `.insert()` call for user_profiles.
- `updateUser` action: add `location_id: input.location_id || null` to the `.update()` call.
- `getUsers` action: update select to include location join: `.select("*, division:divisions(name), company:companies(name), location:locations(name)")`.

**layout.tsx (dashboard):**
- Update the profile select query to join location: `.select("*, division:divisions(name), company:companies(name), location:locations(name)")`.

**profile-sheet.tsx:**
- Extract `locationName` same pattern as division/company: `const locationName = (profile as any).location?.name || 'Not assigned';`.
- Add Location field to the 2-column grid. Make it a 3-item grid (Division, Location, Company) — update to `grid-cols-3` for 3 fields, or keep `grid-cols-2` and add Location as third item that wraps. Better: keep `grid-cols-2` and add Location as a third `<div>` — it will wrap to next row which is fine.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30 && npm run lint 2>&1 | tail -10</automated>
  </verify>
  <done>
- Location column visible in user table between Division and Status
- Location Combobox/Select in user create/edit form, filtered by selected company, resets on company change
- Profile sheet shows user's location alongside Division and Company
- User actions (create/update) persist location_id to DB
- All select queries join location name
- CSV export includes Location column
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- `npm run lint` passes
- `npm run build` completes successfully
</verification>

<success_criteria>
- Migration file adds location_id FK column to user_profiles
- UserProfile type, UserRow type, and Zod schemas all include location_id
- User create form has required Location dropdown filtered by company
- User edit form has Location dropdown filtered by company
- Location column appears in user table between Division and Status
- Profile sheet displays user's location name
- Company change resets both division and location in user form
- CSV export includes Location data
</success_criteria>

<output>
After completion, create `.planning/quick/24-add-location-field-to-user-profiles-indi/24-SUMMARY.md`
</output>
