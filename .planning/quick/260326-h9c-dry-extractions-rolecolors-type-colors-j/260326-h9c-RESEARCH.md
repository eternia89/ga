# Quick Task: DRY Extractions - Research

**Researched:** 2026-03-26
**Domain:** Code deduplication / shared constants extraction
**Confidence:** HIGH

## Summary

Four sets of duplicated constants need extraction into shared files. All patterns are straightforward copy-paste duplications with minor divergences. The project already has established `lib/constants/` and `lib/validations/helpers.ts` files, so the extraction targets are clear.

**Primary recommendation:** Extract each constant set into its canonical location, update all consumers to import from the shared file, and delete the inline duplicates. Pay close attention to the job status divergences where schedule components have incomplete/divergent copies.

## Finding 1: roleColors / roleDisplay (4 locations)

### Duplicate locations

| File | roleColors | roleDisplay | Notes |
|------|-----------|-------------|-------|
| `components/profile/profile-sheet.tsx` (L31-45) | Map literal | Map literal | Both are `Record<string, string>` constants |
| `components/admin/users/user-columns.tsx` (L29-43) | Map literal (inside function) | Map literal (inside function) | Defined inside `getUserColumns()` function |
| `components/user-menu.tsx` (L44-50) | Map literal | Computed from `.split('_').map(...)` | Uses string splitting instead of map lookup |
| `app/(dashboard)/page.tsx` (L81-88, L70-73) | Map literal | Computed from `.split('_').map(...)` | Same split approach as user-menu |

### Exact shape (identical across all 4)

```typescript
const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  ga_lead: 'bg-blue-100 text-blue-700',
  ga_staff: 'bg-green-100 text-green-700',
  finance_approver: 'bg-yellow-100 text-yellow-700',
  general_user: 'bg-gray-100 text-gray-700',
};
```

### roleDisplay divergence

Two patterns exist:
1. **Static map** (profile-sheet, user-columns): `{ admin: 'Admin', ga_lead: 'GA Lead', ... }`
2. **Computed** (user-menu, dashboard page): `role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')`

The computed version produces "Finance Approver" and "General User" (matches the map), BUT it produces "Ga Lead" and "Ga Staff" instead of "GA Lead" and "GA Staff". The static map is the correct canonical version.

### Target file

`lib/constants/role-display.ts` -- new file. Existing `lib/constants/roles.ts` has `ROLES`, `Role` type, `GA_ROLES`, `LEAD_ROLES`, `OPERATIONAL_ROLES` but no display/color mappings.

### Recommended shape

```typescript
import type { Role } from './roles';

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  ga_lead: 'bg-blue-100 text-blue-700',
  ga_staff: 'bg-green-100 text-green-700',
  finance_approver: 'bg-yellow-100 text-yellow-700',
  general_user: 'bg-gray-100 text-gray-700',
};

export const ROLE_DISPLAY: Record<Role, string> = {
  admin: 'Admin',
  ga_lead: 'GA Lead',
  ga_staff: 'GA Staff',
  finance_approver: 'Finance Approver',
  general_user: 'General User',
};
```

Type the keys as `Role` instead of `string` for compile-time safety.

## Finding 2: TYPE_COLORS for checklist item types (3 locations)

### Duplicate locations

| File | Identical? |
|------|-----------|
| `components/maintenance/template-builder-item.tsx` (L19-26) | YES |
| `components/maintenance/template-view-modal.tsx` (L27-34) | YES |
| `components/maintenance/template-detail.tsx` (L36-43) | YES |

All three are **byte-identical**:

```typescript
const TYPE_COLORS: Record<ChecklistItem['type'], string> = {
  checkbox:  'bg-blue-100 text-blue-700',
  pass_fail: 'bg-green-100 text-green-700',
  numeric:   'bg-purple-100 text-purple-700',
  text:      'bg-orange-100 text-orange-700',
  photo:     'bg-pink-100 text-pink-700',
  dropdown:  'bg-yellow-100 text-yellow-700',
};
```

### Target file

`lib/constants/checklist-types.ts` -- **already exists**. Currently has `CHECKLIST_TYPES` (labels), `CHECKLIST_TYPE_ICONS`, and `CHECKLIST_TYPE_ORDER`. The `TYPE_COLORS` map fits naturally here as `CHECKLIST_TYPE_COLORS`.

### Recommended addition

```typescript
export const CHECKLIST_TYPE_COLORS: Record<ChecklistItemType, string> = {
  checkbox:  'bg-blue-100 text-blue-700',
  pass_fail: 'bg-green-100 text-green-700',
  numeric:   'bg-purple-100 text-purple-700',
  text:      'bg-orange-100 text-orange-700',
  photo:     'bg-pink-100 text-pink-700',
  dropdown:  'bg-yellow-100 text-yellow-700',
};
```

## Finding 3: JOB_STATUS_LABELS + jobStatusColor() (2 schedule components)

### Duplicate locations

| File | Notes |
|------|-------|
| `components/maintenance/schedule-view-modal.tsx` (L28-42) | Labels + switch-based color function |
| `components/maintenance/schedule-detail.tsx` (L33-50) | Labels + switch-based color function |

### Critical divergence from canonical source

`lib/constants/job-status.ts` already exists with `JOB_STATUS_LABELS` and `JOB_STATUS_COLORS`. The schedule component duplicates **differ** from the canonical version:

| Status | Canonical (job-status.ts) | Schedule duplicates |
|--------|--------------------------|---------------------|
| `in_progress` color | `bg-amber-100 text-amber-700` | `bg-yellow-100 text-yellow-700` |
| `cancelled` color | `bg-stone-100 text-stone-600` | `bg-red-100 text-red-700` |
| `pending_approval` | Present | **MISSING** |
| `pending_completion_approval` | Present | **MISSING** |

The schedule duplicates are **stale copies** -- they were written before the approval statuses were added and use different color choices. The canonical `lib/constants/job-status.ts` is the correct source.

### Resolution

Do NOT create a new `lib/constants/job-status-display.ts`. The canonical constants already exist in `lib/constants/job-status.ts`. The schedule components should simply import `JOB_STATUS_LABELS` and `JOB_STATUS_COLORS` from there, and use `JOB_STATUS_COLORS[status]` instead of the `jobStatusColor()` switch function.

Alternatively, the schedule components could use the `<JobStatusBadge>` component (`components/jobs/job-status-badge.tsx`) which already wraps these constants via `<StatusBadge>`. However, the current inline usage is a simple `<span>` with classes, not a Badge, so importing the constants is more appropriate than switching to the component (avoids changing the rendered HTML).

## Finding 4: optionalUuid() Zod helper (3 divergent patterns)

### Divergent patterns found

**Pattern A: `.nullable().optional()`** -- schedule-schema.ts:
```typescript
item_id: z.string().uuid().nullable().optional()
```
Used for fields that can be `null` (DB nullable) or omitted.

**Pattern B: `.optional().or(z.literal(""))`** -- user-schema.ts:
```typescript
division_id: z.string().uuid("Division is required").optional().or(z.literal(""))
location_id: z.string().uuid("Location is required").optional().or(z.literal(""))
```
Used for form fields where the select/combobox sends `""` when cleared.

**Pattern C: `.or(z.literal('')).optional().nullable().transform(val => val || null)`** -- template-schema.ts:
```typescript
category_id: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val || null)
```
Same as Pattern B but also normalizes empty string to `null` for DB storage.

### Analysis of what each pattern handles

| Input | Pattern A | Pattern B | Pattern C |
|-------|-----------|-----------|-----------|
| Valid UUID | pass | pass | pass (as-is) |
| `""` (empty string) | FAIL | pass (as `""`) | pass (transformed to `null`) |
| `null` | pass (as `null`) | FAIL | pass (as `null`) |
| `undefined` (omitted) | pass (as `undefined`) | pass (as `undefined`) | pass (as `undefined`) |

### Recommended helper

Pattern C is the most comprehensive for form-bound optional UUID fields. Create a single `optionalUuid()` helper in `lib/validations/helpers.ts` (which already exists with `isoDateString()`):

```typescript
/**
 * Optional UUID field that accepts valid UUIDs, empty strings, null, or undefined.
 * Empty strings and null are normalized to null for DB storage.
 */
export function optionalUuid(message = 'Must be a valid ID') {
  return z.string().uuid(message)
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform(val => val || null);
}
```

However, **not all usages should use the full transform**:
- `user-schema.ts` uses Pattern B intentionally -- the `.or(z.literal(""))` without transform means the empty string is preserved. If the action handler expects `""` vs `null` distinction, don't blindly replace.
- `schedule-schema.ts` uses Pattern A with `.nullable().optional()` but does NOT accept empty strings -- this may be intentional if the form never sends empty strings for that field.

**Recommendation:** Create `optionalUuid()` with the full transform (Pattern C). Replace template-schema.ts immediately. For user-schema.ts and schedule-schema.ts, verify the downstream action handlers before replacing -- if they don't distinguish `""` from `null`, the helper is a safe replacement.

### Additional `.optional().or(z.literal(""))` pattern (non-UUID)

This pattern also appears in non-UUID fields across 5 schemas for optional text fields:
- `company-schema.ts`: address, phone, email
- `category-schema.ts`: description
- `location-schema.ts`: address
- `division-schema.ts`: code, description

These use `.optional().or(z.literal(""))` for plain strings, not UUIDs. A separate `optionalString()` helper could cover these, but that is a different extraction and not part of this task scope.

## Finding 5: Broad scan for additional duplicates

The improvements.md log also tracks:
- **Item 28:** `JOB_TERMINAL_STATUSES` (`['completed', 'cancelled']`) duplicated in 12 occurrences across 8 files -- out of scope for this task but worth noting.
- **Item 43:** Profile fetch helper duplicated in 7 API routes -- out of scope.

No other color/display map duplications found beyond the 4 sets already identified.

## Architecture Patterns

### Existing constant file conventions

```
lib/constants/
  approval-status.ts    # APPROVAL_TYPE_COLORS, APPROVAL_TYPE_LABELS, etc.
  asset-status.ts       # Asset status constants
  checklist-types.ts    # CHECKLIST_TYPES, CHECKLIST_TYPE_ICONS, CHECKLIST_TYPE_ORDER
  entity-routes.ts      # Entity route mappings
  job-status.ts         # JOB_STATUS_LABELS, JOB_STATUS_COLORS, JOB_STATUSES, JobStatus
  request-status.ts     # Request status + priority constants
  roles.ts              # ROLES, Role, GA_ROLES, LEAD_ROLES, OPERATIONAL_ROLES
  schedule-status.ts    # Schedule status constants
```

Pattern: Each file exports `Record<string, string>` maps for LABELS and COLORS, plus `as const` arrays for enum values and derived types.

### Existing validation helper conventions

```
lib/validations/helpers.ts  # isoDateString() helper function
```

Only one helper exists so far. Adding `optionalUuid()` here follows the same pattern.

## Common Pitfalls

### Pitfall 1: Color divergence on replacement
**What goes wrong:** Schedule components use `yellow` for `in_progress` and `red` for `cancelled`, while the canonical source uses `amber` and `stone`. Switching to canonical constants will change badge colors.
**How to avoid:** This is the correct behavior -- the canonical colors were chosen deliberately for consistency across the app. The schedule duplicates were stale. Just import and replace.

### Pitfall 2: Missing statuses in schedule components
**What goes wrong:** Schedule components only handle 5 job statuses, but the canonical source has 7 (adding `pending_approval`, `pending_completion_approval`). If a PM-generated job enters approval flow, the schedule currently shows the raw status string.
**How to avoid:** Using the canonical import fixes this automatically -- the fallback `?? job.status` already handles unknown statuses gracefully.

### Pitfall 3: optionalUuid transform breaking downstream
**What goes wrong:** Replacing `.optional().or(z.literal(""))` (preserves `""`) with a transform (converts `""` to `null`) could break action handlers that check for `""`.
**How to avoid:** Check each action handler. For `updateUserSchema` fields (`division_id`, `location_id`), verify the action handler treats `""` and `null` equivalently before replacing.

### Pitfall 4: Import paths in server vs client components
**What goes wrong:** Some consuming files are server components, some are client components. The new constant files must not include `'use client'` directives -- they should be plain TS exports usable by both.
**How to avoid:** Do not add `'use client'` to the new constant files. All existing `lib/constants/*.ts` files are plain exports without directives.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (e2e) |
| Quick run command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map

This is a pure DRY refactor -- no behavior changes. Per CLAUDE.md: "Skip tests for UI-only changes (layout, spacing, colors, copy/terminology, column ordering)." This applies since we're only extracting constants without changing logic.

**However**, the `optionalUuid()` helper introduces a transform function. A unit test for the helper would be valuable:

| Behavior | Test Type | Command |
|----------|-----------|---------|
| `optionalUuid()` accepts valid UUID | unit | `npx vitest run lib/validations/helpers.test.ts` |
| `optionalUuid()` transforms `""` to `null` | unit | same |
| `optionalUuid()` passes `null` through | unit | same |
| `optionalUuid()` rejects invalid strings | unit | same |

### Wave 0 Gaps
- [ ] `lib/validations/helpers.test.ts` -- covers optionalUuid() behavior

## Sources

### Primary (HIGH confidence)
- Direct grep of codebase -- all 4 duplicate sets verified by reading source files
- `lib/constants/job-status.ts` -- canonical source read in full
- `lib/constants/checklist-types.ts` -- existing file read in full
- `lib/constants/roles.ts` -- existing file read in full
- `lib/validations/helpers.ts` -- existing file read in full
- `improvements.md` -- confirmed tracking items #7, #10, #11, #25, #41, #42

## Metadata

**Confidence breakdown:**
- roleColors/roleDisplay extraction: HIGH -- all 4 locations verified, shapes identical
- TYPE_COLORS extraction: HIGH -- all 3 locations byte-identical, target file exists
- JOB_STATUS_LABELS consolidation: HIGH -- canonical source exists, divergences documented
- optionalUuid helper: MEDIUM -- transform semantics need per-site validation before replacing

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable codebase patterns)
