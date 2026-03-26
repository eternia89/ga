# Fix Remaining `as any` Casts - Research

**Researched:** 2026-03-26
**Domain:** TypeScript type safety fixes
**Confidence:** HIGH

## Summary

There are 11 `as any` casts across 6 component files (the task listed 7 but entity-form-dialog.tsx and user-form-dialog.tsx share a root cause). Each cast has a clear, specific root cause and a minimal fix. No additional `as any` casts were found beyond those listed.

**Primary recommendation:** Fix each cast with the minimal type change that preserves type safety -- add generic constraints, extend interfaces, align schemas, or use specific type assertions.

## Findings by File

### 1. `components/data-table/data-table-toolbar.tsx` (4x `as any`)

**Lines:** 65, 66, 172
**Pattern:** `(row.original as any).id`, `(row.original as any).name`, etc.
**Root cause:** `DataTableToolbar<TData>` is generic but accesses `row.original.id`, `row.original.name`, `row.original.full_name`, `row.original.email` without constraining `TData`.

**Fix:** Add a constraint on the generic parameter:
```typescript
interface BaseEntity {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
}

// Change the component signature:
export function DataTableToolbar<TData extends BaseEntity>({...})

// Then access directly:
const ids = selectedRows.map((row) => row.original.id);
const names = selectedRows.map((row) => row.original.name || row.original.full_name || row.original.email || "Unknown");
```

**Confidence:** HIGH -- the bulk actions only make sense for entities with `id`, and the name fallback chain covers the actual consumers (settings entities have `name`, users have `full_name`/`email`).

**Impact:** All callers must pass data that extends `BaseEntity`. Verify that all DataTable consumers' data types include `id` (they do -- every table row type has `id: string`).

---

### 2. `components/maintenance/schedule-form.tsx` (1x `as any`)

**Line:** 154
**Pattern:** `zodResolver(scheduleCreateSchema) as any`
**Root cause:** The form uses `useForm<ScheduleCreateOutput>` where `ScheduleCreateOutput = z.output<typeof scheduleCreateSchema>`. The `zodResolver()` expects the schema's *input* type to match the form's type parameter, but `z.output` includes post-transform types (e.g., defaults applied). When using `z.output`, the resolver complains because `z.input` !== `z.output` for schemas with `.default()` or `.transform()`.

The `scheduleCreateSchema` has `.default('floating')` on `interval_type` and `.default(0)` on `auto_create_days_before`, meaning `z.input` makes those fields optional while `z.output` has them required.

**Fix:** Use `z.input<typeof scheduleCreateSchema>` as the form type instead of `z.output`, since `useForm` works with input types (the defaults get applied by Zod during validation). Then the resolver aligns:
```typescript
type ScheduleCreateInput = z.input<typeof scheduleCreateSchema>;

const form = useForm<ScheduleCreateInput>({
  resolver: zodResolver(scheduleCreateSchema),
  defaultValues: {
    template_id: defaultTemplateId ?? '',
    item_id: defaultAssetId ?? '',
    interval_days: 30,
    interval_type: 'floating',
    auto_create_days_before: 0,
    start_date: undefined,
  },
});
```

Since the form already provides explicit defaultValues for the fields with `.default()`, the input and output will effectively be the same at runtime.

**Confidence:** HIGH -- this is the standard react-hook-form + zod pattern.

---

### 3. `components/profile/profile-sheet.tsx` (3x `as any`)

**Lines:** 77, 78, 79
**Pattern:** `(profile as any).company?.name`, `(profile as any).division?.name`, `(profile as any).location?.name`
**Root cause:** The `useUser()` hook returns `profile: UserProfile | null`, but `UserProfile` only has `company_id`, `division_id`, `location_id` (foreign key UUIDs). The actual profile object passed via `AuthProvider` is fetched in `layout.tsx` with a Supabase `.select()` that joins `companies(name)`, `divisions(name)`, `locations(name)`, producing `company: { name: string } | null`, etc. These join fields are not in the `UserProfile` type.

**Fix:** Extend the `UserProfile` type to include the optional join relations:
```typescript
// In lib/auth/types.ts, add:
export type UserProfileWithJoins = UserProfile & {
  company?: { name: string } | null;
  division?: { name: string } | null;
  location?: { name: string } | null;
};
```

Then update `AuthProvider`/`useUser` to use `UserProfileWithJoins`:
- `lib/auth/hooks.tsx`: Change `AuthContextType.profile` and `AuthProviderProps.initialProfile` to `UserProfileWithJoins`
- `components/profile/profile-sheet.tsx`: Access `profile.company?.name` directly (no cast needed)

**Alternative (smaller change):** Keep `UserProfile` unchanged, but in `profile-sheet.tsx` define a local extended type and cast once:
```typescript
type ProfileWithJoins = UserProfile & {
  company?: { name: string } | null;
  division?: { name: string } | null;
  location?: { name: string } | null;
};
const profileWithJoins = profile as ProfileWithJoins;
```

This is still `as X` but it is type-safe (specific type, not `any`).

**Recommended approach:** Extend `UserProfile` in `types.ts` since `layout.tsx` always fetches with joins and other places also access `profile.company?.name` (e.g., `layout.tsx:43` already does `profile.company?.name` without a cast -- it works because Supabase infers the type from the select query, but the AuthProvider narrows it to `UserProfile`).

**Confidence:** HIGH -- the join query in layout.tsx always produces these fields.

---

### 4. `components/admin/entity-form-dialog.tsx` (2x `as any`)

**Line:** 58
**Pattern:** `zodResolver(schema as any) as any`
**Root cause:** Two separate issues layered:
1. `schema as any` -- The component accepts `schema: ZodType<T>` but `zodResolver` expects a more specific Zod schema type. `ZodType<T>` is the base abstract class, and `zodResolver` from `@hookform/resolvers/zod` v5 expects `z.ZodSchema` or similar. Actually, in v5, `zodResolver` accepts `ZodType<any>` -- the real issue is that `ZodType<T>` with generic T creates a complex type inference that TypeScript can't reconcile with react-hook-form's own generic constraints.
2. The second `as any` on the return -- `zodResolver(...)` returns `Resolver<z.output<schema>>` but the form expects `Resolver<T>`, and when `T` comes from the generic parameter, TypeScript can't prove they match.

**Fix:** The cleanest fix is to use `z.ZodSchema` as the prop type (which is what zodResolver actually accepts) and add a type assertion to the specific output type:
```typescript
import type { ZodSchema } from "zod";
import type { Resolver } from "react-hook-form";

// Change props:
schema: ZodSchema;

// In the form:
const form = useForm<T>({
  resolver: zodResolver(schema) as Resolver<T>,
  defaultValues,
});
```

Using `as Resolver<T>` is a targeted assertion (not `any`) that tells TypeScript "trust that this Zod schema produces type T" -- which is guaranteed by the component's contract.

**Confidence:** HIGH -- this is a well-known generic typing limitation with zodResolver + react-hook-form.

---

### 5. `components/admin/users/user-table.tsx` (1x `as any`)

**Line:** 243
**Pattern:** `user={editingUser as any}`
**Root cause:** `editingUser` is `UserRow | undefined`. The `UserFormDialog` prop `user` is typed as `UserUserFormInput | undefined`. `UserRow` has extra fields (`deleted_at`, `created_at`, `last_sign_in_at`, `division`, `location`, `company`) that `UserUserFormInput` does not, plus `UserRow.role` is `string` while `UserUserFormInput.role` is `Role` (union literal type).

**Fix:** Two options:
1. **(Recommended)** Change `UserFormDialogProps.user` type to accept `UserRow` directly (since the dialog only reads the fields it needs and ignores extras). This is safe because `UserRow` has all the fields `UserUserFormInput` needs.
2. Map the user at the call site: `user={editingUser ? { id: editingUser.id, email: editingUser.email, ... } : undefined}` (verbose, fragile).

The recommended fix: In `user-form-dialog.tsx`, change the `user` prop type:
```typescript
// Remove UserUserFormInput type entirely, use UserRow directly
import type { UserRow } from './user-columns';

type UserFormDialogProps = {
  user?: UserRow;
  // ... rest unchanged
};
```

The `role` type mismatch (`string` vs `Role`) needs resolution. Either:
- Change `UserRow.role` from `string` to `Role` (preferred -- it IS always a Role)
- Or cast only `role` in the one place it's used: `(user?.role || 'general_user') as Role`

**Confidence:** HIGH

---

### 6. `components/admin/users/user-form-dialog.tsx` (2x `as any`)

**Line 164:** `createUser(data as any)`
**Root cause:** `data` is `UserFormInput` which has `email?: string` (optional), but `createUser` expects `CreateUserFormData` which has `email: string` (required). The form uses a union type `UserFormInput` that works for both create and edit, but `createUser`'s schema requires email.

**Fix:** In the create branch, assert the specific type since we know email is present (the form validates it):
```typescript
const result = await createUser(data as CreateUserFormData);
```
This is a specific type assertion (not `any`) and is safe because the create form always includes email (validated by `createUserSchema`).

**Line 177:** `schema={schema as any}`
**Root cause:** `schema` is `typeof createUserSchema | typeof updateUserSchema`. The `EntityFormDialog` expects `ZodType<UserFormInput>`, but neither schema exactly matches `UserFormInput` -- createUserSchema outputs `CreateUserFormData` (email required) and updateUserSchema outputs `UpdateUserFormData` (no email). The union doesn't match `ZodType<UserFormInput>`.

**Fix:** This is resolved by the `entity-form-dialog.tsx` fix above. Once `EntityFormDialog` accepts `ZodSchema` (without the generic constraint), this cast can be removed:
```typescript
schema={schema}
```

If keeping the generic `ZodType<T>` on EntityFormDialog, then a targeted cast is better:
```typescript
schema={schema as ZodType<UserFormInput>}
```

**Confidence:** HIGH

## Fix Summary

| File | Line(s) | Current | Fix | Category |
|------|---------|---------|-----|----------|
| data-table-toolbar.tsx | 65,66,172 | `row.original as any` | Add `TData extends BaseEntity` constraint | Generic constraint |
| schedule-form.tsx | 154 | `zodResolver(...) as any` | Use `z.input<>` instead of `z.output<>` for form type | Type alignment |
| profile-sheet.tsx | 77-79 | `profile as any` | Extend `UserProfile` type with join fields | Type extension |
| entity-form-dialog.tsx | 58 | `zodResolver(schema as any) as any` | Use `ZodSchema` + `as Resolver<T>` | Targeted assertion |
| user-table.tsx | 243 | `editingUser as any` | Change dialog prop to accept `UserRow` | Prop type widening |
| user-form-dialog.tsx | 164 | `data as any` | `data as CreateUserFormData` | Targeted assertion |
| user-form-dialog.tsx | 177 | `schema as any` | Remove cast (fixed by entity-form-dialog fix) | N/A |

## Execution Order

Fix in this order to avoid intermediate breakage:
1. `lib/auth/types.ts` -- add `UserProfileWithJoins` type
2. `lib/auth/hooks.tsx` -- update to use `UserProfileWithJoins`
3. `components/profile/profile-sheet.tsx` -- remove `as any` casts
4. `components/admin/users/user-columns.tsx` -- change `role: string` to `role: Role`
5. `components/admin/entity-form-dialog.tsx` -- fix zodResolver typing
6. `components/admin/users/user-form-dialog.tsx` -- fix both casts, import `UserRow`
7. `components/admin/users/user-table.tsx` -- remove `as any` (now types align)
8. `components/maintenance/schedule-form.tsx` -- fix form type to `z.input`
9. `components/data-table/data-table-toolbar.tsx` -- add generic constraint

## Other `as any` Instances

Grep confirmed NO other `as any` casts exist in the codebase beyond those listed above. The `permissions.ts:124` hit is a comment ("Check if a role has any of the provided permissions"), not a cast.

## Sources

- Direct code inspection of all 6 files (HIGH confidence)
- `@hookform/resolvers` v5.2.2 type signatures (HIGH confidence)
- react-hook-form v7.71.1 generic types (HIGH confidence)
