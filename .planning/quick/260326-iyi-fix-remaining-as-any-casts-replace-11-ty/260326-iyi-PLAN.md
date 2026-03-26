---
phase: quick-260326-iyi
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/auth/types.ts
  - lib/auth/hooks.tsx
  - components/profile/profile-sheet.tsx
  - components/data-table/data-table-toolbar.tsx
  - components/maintenance/schedule-form.tsx
  - components/admin/entity-form-dialog.tsx
  - components/admin/users/user-columns.tsx
  - components/admin/users/user-form-dialog.tsx
  - components/admin/users/user-table.tsx
autonomous: true
requirements: [QUICK-TYPEFIX]

must_haves:
  truths:
    - "Zero `as any` casts remain in the codebase (excluding comments)"
    - "Build passes with no type errors (`npm run build`)"
    - "No runtime behavior changes — all fixes are type-level only"
  artifacts:
    - path: "lib/auth/types.ts"
      provides: "UserProfileWithJoins type extending UserProfile with company/division/location join fields"
      contains: "UserProfileWithJoins"
    - path: "components/data-table/data-table-toolbar.tsx"
      provides: "Generic constraint TData extends BaseEntity"
      contains: "extends BaseEntity"
    - path: "components/admin/entity-form-dialog.tsx"
      provides: "Targeted Resolver<T> assertion instead of as any"
      contains: "as Resolver<T>"
  key_links:
    - from: "lib/auth/types.ts"
      to: "lib/auth/hooks.tsx"
      via: "UserProfileWithJoins used in AuthContextType and AuthProviderProps"
      pattern: "UserProfileWithJoins"
    - from: "lib/auth/hooks.tsx"
      to: "components/profile/profile-sheet.tsx"
      via: "useUser returns profile typed as UserProfileWithJoins, enabling direct .company?.name access"
      pattern: "profile\\.company\\?"
    - from: "components/admin/entity-form-dialog.tsx"
      to: "components/admin/users/user-form-dialog.tsx"
      via: "EntityFormDialog accepting ZodSchema removes need for schema as any in UserFormDialog"
      pattern: "schema="
---

<objective>
Replace all 11 `as any` casts across 6 component files with proper TypeScript types.

Purpose: Eliminate type-unsafe casts that hide potential bugs. Each cast has a clear root cause identified in research: generic constraints, missing join types, zodResolver mismatches, and prop type misalignment.

Output: Zero `as any` casts, passing build, no runtime behavior changes.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260326-iyi-fix-remaining-as-any-casts-replace-11-ty/260326-iyi-RESEARCH.md

<interfaces>
<!-- Key types the executor needs -->

From lib/auth/types.ts:
```typescript
export type Role = 'general_user' | 'ga_staff' | 'ga_lead' | 'finance_approver' | 'admin';

export type UserProfile = {
  id: string;
  company_id: string;
  division_id: string | null;
  location_id: string | null;
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

From lib/auth/hooks.tsx:
```typescript
type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
};

type AuthProviderProps = {
  initialProfile: UserProfile;
  children: ReactNode;
};
```

From components/admin/users/user-columns.tsx:
```typescript
export type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;            // <-- should be Role
  company_id: string;
  division_id: string | null;
  location_id: string | null;
  deleted_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  division: { name: string } | null;
  location: { name: string } | null;
  company: { name: string } | null;
};
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix auth types and profile-sheet casts (3 files, 3 casts)</name>
  <files>lib/auth/types.ts, lib/auth/hooks.tsx, components/profile/profile-sheet.tsx</files>
  <action>
**lib/auth/types.ts** -- Add `UserProfileWithJoins` type after `UserProfile`:
```typescript
export type UserProfileWithJoins = UserProfile & {
  company?: { name: string } | null;
  division?: { name: string } | null;
  location?: { name: string } | null;
};
```

**lib/auth/hooks.tsx** -- Replace `UserProfile` with `UserProfileWithJoins` in three places:
1. Import `UserProfileWithJoins` instead of `UserProfile` from `./types`
2. `AuthContextType.profile` type: `UserProfileWithJoins | null`
3. `AuthProviderProps.initialProfile` type: `UserProfileWithJoins`
4. `useState<UserProfileWithJoins | null>(initialProfile)` generic

**components/profile/profile-sheet.tsx** -- Remove 3x `as any` casts (lines ~77-79):
- Change `(profile as any).company?.name` to `profile.company?.name`
- Change `(profile as any).division?.name` to `profile.division?.name`
- Change `(profile as any).location?.name` to `profile.location?.name`

These access patterns are now valid because `useUser()` returns `UserProfileWithJoins`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -40</automated>
  </verify>
  <done>UserProfileWithJoins type exists, hooks.tsx uses it, profile-sheet.tsx has zero `as any` casts, type check passes for these files.</done>
</task>

<task type="auto">
  <name>Task 2: Fix data-table-toolbar, schedule-form, entity-form-dialog, and user dialog casts (6 files, 8 casts)</name>
  <files>components/data-table/data-table-toolbar.tsx, components/maintenance/schedule-form.tsx, components/admin/entity-form-dialog.tsx, components/admin/users/user-columns.tsx, components/admin/users/user-form-dialog.tsx, components/admin/users/user-table.tsx</files>
  <action>
**components/data-table/data-table-toolbar.tsx** -- Remove 4x `as any` casts by adding generic constraint:
1. Define `BaseEntity` interface at top of file:
   ```typescript
   interface BaseEntity {
     id: string;
     name?: string;
     full_name?: string;
     email?: string;
   }
   ```
2. Change component signature from `DataTableToolbar<TData>` to `DataTableToolbar<TData extends BaseEntity>`
3. Replace `(row.original as any).id` with `row.original.id` (lines ~65, 66)
4. Replace `(row.original as any).name || (row.original as any).full_name || (row.original as any).email` with `row.original.name || row.original.full_name || row.original.email` (line ~172)
5. Update the `DataTableToolbarProps` generic similarly: `DataTableToolbarProps<TData extends BaseEntity>`

**components/maintenance/schedule-form.tsx** -- Remove 1x `as any` cast:
1. Add `Resolver` to the existing `react-hook-form` import: `import { useForm, Resolver } from 'react-hook-form';`
2. Keep `useForm<ScheduleCreateOutput>` unchanged on line ~153 -- the `onSubmit(data: ScheduleCreateOutput)` handler at line ~192 depends on this type flowing through `form.handleSubmit`
3. Replace `zodResolver(scheduleCreateSchema) as any` with `zodResolver(scheduleCreateSchema) as Resolver<ScheduleCreateOutput>` (line ~154)
4. Remove the `// eslint-disable-next-line` comment on line ~152 (no longer needed since `as any` is gone)
5. This mirrors the same pattern used in entity-form-dialog: targeted `Resolver<T>` assertion instead of blanket `as any`

**components/admin/entity-form-dialog.tsx** -- Remove 2x `as any` casts:
1. Change `schema` prop type from `ZodType<T>` to `ZodSchema` (import `ZodSchema` from `zod` instead of `ZodType`)
2. Replace `zodResolver(schema as any) as any` with `zodResolver(schema) as Resolver<T>` (import `Resolver` from `react-hook-form`)

**components/admin/users/user-columns.tsx** -- Fix role type:
1. Change `role: string` to `role: Role` in `UserRow` type
2. Import `Role` from `@/lib/auth/types` (it already imports from `@/lib/constants/roles` -- check if that's the same type, if so use whichever is canonical; if different, use `@/lib/auth/types`)

**components/admin/users/user-form-dialog.tsx** -- Remove 2x `as any` casts:
1. Line ~164: Change `createUser(data as any)` to `createUser(data as CreateUserFormData)` -- import `CreateUserFormData` from the user schema (the type the createUser action expects)
2. Line ~177: Change `schema={schema as any}` to just `schema={schema}` -- this works after the entity-form-dialog fix above accepts `ZodSchema` without generic constraint

**components/admin/users/user-table.tsx** -- Remove 1x `as any` cast:
1. Line ~243: Remove `as any` from `user={editingUser as any}` -- now that `UserRow.role` is `Role` (not `string`), and `UserFormDialog` accepts `UserRow` (check if it already does or needs prop type update)
2. If `UserFormDialog.user` prop is typed as something narrower than `UserRow`, update the prop type in `user-form-dialog.tsx` to accept `UserRow | undefined`

IMPORTANT: Read each file fully before editing. The line numbers from research are approximate -- locate the actual `as any` patterns by searching. Do NOT introduce any new `as any` casts. Use only targeted type assertions (`as SpecificType`) when needed.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -60 && echo "---" && grep -rn "as any" components/ lib/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v "\.d\.ts" | grep -v "// " | grep -v "has any"</automated>
  </verify>
  <done>All 8 remaining `as any` casts removed. Type check passes. Grep for `as any` across components/ and lib/ returns zero results (excluding comments and .d.ts files).</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` -- zero type errors
2. `npm run build` -- full build passes
3. `grep -rn "as any" components/ lib/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v ".d.ts" | grep -v "//"` -- zero results
4. No runtime behavior changes -- all fixes are type-level only
</verification>

<success_criteria>
- Zero `as any` casts remain in components/ and lib/ (excluding comments and declaration files)
- `npm run build` passes cleanly
- No new `as any` or `@ts-ignore` introduced
- All replacements use specific types (UserProfileWithJoins, BaseEntity constraint, Resolver<T>, CreateUserFormData, Role)
</success_criteria>

<output>
After completion, create `.planning/quick/260326-iyi-fix-remaining-as-any-casts-replace-11-ty/260326-iyi-SUMMARY.md`
</output>
