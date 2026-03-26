# Quick Task: Dead Code and Role Literal Cleanup - Research

**Researched:** 2026-03-26
**Domain:** Code hygiene -- wrong table name, dead code removal, constant usage
**Confidence:** HIGH

## Summary

Three distinct cleanup items confirmed via direct source inspection. All are straightforward mechanical fixes with no behavioral risk. A codebase-wide scan (Bug Fix Protocol) found **additional** string literal role checks beyond the 4 listed in the task.

**Primary recommendation:** Fix the 3 named items, then also replace all other string literal role checks found in the scan to avoid repeat cleanup tasks.

## Issue 1: Wrong Table Name in Entity-Photos Route

**File:** `app/api/uploads/entity-photos/route.ts` line 20
**Current:** `inventory: { bucket: 'inventory-photos', maxFiles: 10, table: 'assets' }`
**Correct:** `inventory: { bucket: 'inventory-photos', maxFiles: 10, table: 'inventory_items' }`

**Impact:** This `table` value is used at line 90 in `supabase.from(config.table)` to verify entity existence. With `'assets'` (a table that does not exist), inventory photo uploads would always fail the existence check and return a 400 error. The `request` entity type has its own dedicated code path (line 71-86) so it's unaffected, but `inventory` and `job_comment` both fall through to the generic path.

**Confidence:** HIGH -- verified by reading the code. Table name `inventory_items` confirmed in migrations.

## Issue 2: Dead `schedule.template_name` Fallback

**File:** `app/api/exports/maintenance/route.ts` line 84
**Current:** `template_name: template?.name ?? schedule.template_name ?? ''`
**Correct:** `template_name: template?.name ?? ''`

**Why dead:** The Supabase query (line 52) selects `template:maintenance_templates(name)` -- a joined relation. The `maintenance_schedules` table has NO `template_name` column (confirmed via migration `00001_initial_schema.sql`). TypeScript infers the row type from the select string, so `schedule.template_name` would be `undefined` at runtime -- it never provides a value, making the fallback dead code.

**Confidence:** HIGH -- verified against schema migrations.

## Issue 3: String Literal Role Checks (Task-Listed)

The task lists 4 locations. All confirmed:

| # | File | Line | Current | Replace With |
|---|------|------|---------|-------------|
| 1 | `app/actions/company-settings-actions.ts` | 47 | `profile.role !== 'admin'` | `profile.role !== ROLES.ADMIN` |
| 2 | `app/(dashboard)/admin/settings/page.tsx` | 54 | `p.role === 'admin'` | `p.role === ROLES.ADMIN` |
| 3 | `app/(dashboard)/inventory/page.tsx` | 46 | `profile.role === 'general_user'` | `profile.role === ROLES.GENERAL_USER` |
| 4 | `app/(dashboard)/requests/page.tsx` | 46, 166 | `profile.role === 'general_user'` | `profile.role === ROLES.GENERAL_USER` |

Note: requests/page.tsx has TWO occurrences (line 46 and line 166), not one.

**Import needed:** `import { ROLES } from '@/lib/constants/roles'` -- add to files that don't already import from this module.

## Bug Fix Protocol: Additional String Literal Role Checks Found

Full codebase scan found these additional string literal role checks in application code (excluding tests, seeds, e2e, and the ROLES constant definition itself):

### Should Convert to ROLES Constants

| File | Line | Current | Replace With |
|------|------|---------|-------------|
| `app/(dashboard)/admin/layout.tsx` | 28 | `profile.role !== 'admin'` | `profile.role !== ROLES.ADMIN` |
| `app/(dashboard)/admin/company-settings/page.tsx` | 29 | `profile.role !== 'admin'` | `profile.role !== ROLES.ADMIN` |
| `app/(dashboard)/admin/audit-trail/page.tsx` | 30 | `profile.role !== 'admin' && profile.role !== 'ga_lead'` | `profile.role !== ROLES.ADMIN && profile.role !== ROLES.GA_LEAD` |
| `app/actions/user-company-access-actions.ts` | 16 | `profile.role !== 'admin'` | `profile.role !== ROLES.ADMIN` |
| `lib/safe-action.ts` | 49 | `ctx.profile.role !== "admin"` | `ctx.profile.role !== ROLES.ADMIN` |
| `components/jobs/job-modal.tsx` | 623 | `currentUserRole === 'finance_approver'` | `currentUserRole === ROLES.FINANCE_APPROVER` |
| `components/jobs/job-detail-actions.tsx` | 89 | `currentUserRole === 'finance_approver'` | `currentUserRole === ROLES.FINANCE_APPROVER` |
| `components/requests/request-detail-actions.tsx` | 38 | `currentUserRole === 'ga_staff'` | `currentUserRole === ROLES.GA_STAFF` |
| `components/requests/request-detail-info.tsx` | 86 | `currentUserRole === 'ga_staff'` | `currentUserRole === ROLES.GA_STAFF` |
| `app/actions/request-actions.ts` | 128 | `profile.role === 'ga_staff'` | `profile.role === ROLES.GA_STAFF` |
| `app/(dashboard)/jobs/page.tsx` | 63 | `['general_user', 'ga_staff'].includes(profile.role)` | `[ROLES.GENERAL_USER, ROLES.GA_STAFF].includes(profile.role)` |
| `app/(dashboard)/jobs/page.tsx` | 75 | `.in('role', ['ga_staff', 'ga_lead'])` | `.in('role', [ROLES.GA_STAFF, ROLES.GA_LEAD])` |
| `lib/dashboard/queries.ts` | 358 | `.in('role', ['ga_staff', 'ga_lead'])` | `.in('role', [ROLES.GA_STAFF, ROLES.GA_LEAD])` |

### Intentionally Excluded (Not Role Checks)

These use string literals but are NOT role checks to convert:
- **`lib/auth/types.ts:2`** -- Type definition `type Role = 'general_user' | ...` (could use `typeof ROLES[keyof typeof ROLES]` but the `Role` type already exists in `roles.ts` as a derived type; this is a duplicate that could be consolidated but is a separate concern)
- **`lib/validations/user-schema.ts:6,14`** -- Zod enum values `z.enum(["general_user", ...])` (these define validation schemas; could use `Object.values(ROLES)` but Zod enum requires a tuple literal)
- **`components/admin/users/user-form-dialog.tsx:80-84`** -- UI display labels `{ value: 'general_user', label: 'General User' }` (display mapping, not access control)
- **`components/assets/asset-detail-actions.tsx:38,103`** and **`asset-view-modal.tsx:84`** and **`asset-transfer-respond-modal.tsx:36,301,480`** -- `'admin'` here refers to a UI variant string, NOT a role check
- **Test/seed/e2e files** -- test data, not application logic

## Common Pitfalls

### Pitfall 1: Missing Import
When adding `ROLES` to a file, check if it already imports from `@/lib/constants/roles`. Several files (e.g., `inventory/page.tsx`) already import `GA_ROLES` -- add `ROLES` to the existing import rather than creating a duplicate import line.

### Pitfall 2: requests/page.tsx Has Two Occurrences
Line 46 is the access-control filter; line 166 is a UI conditional for subtitle text. Both should use `ROLES.GENERAL_USER`.

### Pitfall 3: Type Compatibility
`ROLES.ADMIN` is typed as `'admin'` (literal type from `as const`), so it works directly in `===` / `!==` comparisons with `profile.role` (which is `string` or `Role`). No type assertions needed.

## Scope Recommendation

The task names 3 issues (table name, dead code, 4 role literal locations). The Bug Fix Protocol scan found 13 additional role literal locations. Recommend fixing all in one pass since they are identical in nature and low-risk.

Total changes:
- 1 table name fix (1 file)
- 1 dead code removal (1 file)
- 17 role literal replacements across 13 files (4 task-listed + 13 additional)

## Sources

### Primary (HIGH confidence)
- Direct source file reads of all files listed above
- Migration `00001_initial_schema.sql` -- confirmed `maintenance_schedules` has no `template_name` column
- `lib/constants/roles.ts` -- confirmed ROLES constant object with all 5 role values
