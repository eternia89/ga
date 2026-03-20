# Quick Task: Centralize Inline Role Arrays - Research

**Researched:** 2026-03-20
**Domain:** Role constant centralization (refactoring)
**Confidence:** HIGH

## Summary

The codebase has a well-established pattern of using role constants from `lib/constants/roles.ts`, which currently exports `ROLES` (individual role strings), `GA_ROLES` (`['ga_staff', 'ga_lead', 'admin']`), and `LEAD_ROLES` (`['ga_lead', 'admin']`). Many files already import these constants. However, a third role set -- `['ga_lead', 'admin', 'finance_approver']` -- is used in 6 places across 5 files but has no constant. Additionally, one file uses `GA_ROLES` inline instead of importing the constant.

**Primary recommendation:** Add `OPERATIONAL_ROLES` to `lib/constants/roles.ts` and replace all 6 inline occurrences. Also replace the inline `GA_ROLES` duplicate in `jobs/page.tsx:228`.

## Current State of `lib/constants/roles.ts`

```typescript
export const ROLES = {
  GENERAL_USER: 'general_user',
  GA_STAFF: 'ga_staff',
  GA_LEAD: 'ga_lead',
  FINANCE_APPROVER: 'finance_approver',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** GA Staff, GA Lead, Admin -- operational roles that manage assets/jobs */
export const GA_ROLES = [ROLES.GA_STAFF, ROLES.GA_LEAD, ROLES.ADMIN] as const;

/** GA Lead, Admin -- leadership roles with elevated permissions */
export const LEAD_ROLES = [ROLES.GA_LEAD, ROLES.ADMIN] as const;
```

## Inline Role Arrays to Replace

### Group 1: OPERATIONAL_ROLES -- `['ga_lead', 'admin', 'finance_approver']`

These 6 occurrences all use the same set (order varies but membership is identical):

| # | File | Line | Current Code | Usage |
|---|------|------|--------------|-------|
| 1 | `app/(dashboard)/page.tsx` | 35 | `const OPERATIONAL_ROLES = ['ga_lead', 'admin', 'finance_approver']` | Local const for dashboard access |
| 2 | `app/(dashboard)/requests/page.tsx` | 171 | `['ga_lead', 'admin', 'finance_approver'].includes(profile.role)` | Export button visibility |
| 3 | `app/(dashboard)/jobs/page.tsx` | 225 | `['ga_lead', 'admin', 'finance_approver'].includes(profile.role)` | Export button visibility |
| 4 | `app/(dashboard)/approvals/page.tsx` | 35 | `!['finance_approver', 'ga_lead', 'admin'].includes(profile.role)` | Page access guard |
| 5 | `app/api/exports/requests/route.ts` | 11 | `const EXPORT_ROLES = ['ga_lead', 'admin', 'finance_approver']` | Export API auth check |
| 6 | `app/api/exports/jobs/route.ts` | 11 | `const EXPORT_ROLES = ['ga_lead', 'admin', 'finance_approver']` | Export API auth check |

**Naming:** `OPERATIONAL_ROLES` -- roles that see the full operational dashboard, can export, and access the approvals page. This name is already used locally in `page.tsx:35`.

**Definition:** `export const OPERATIONAL_ROLES = [ROLES.GA_LEAD, ROLES.ADMIN, ROLES.FINANCE_APPROVER] as const;`

**JSDoc:** `/** GA Lead, Admin, Finance Approver -- roles with full operational visibility (dashboard, exports, approvals) */`

### Group 2: Inline GA_ROLES duplicate

| # | File | Line | Current Code | Usage |
|---|------|------|--------------|-------|
| 1 | `app/(dashboard)/jobs/page.tsx` | 228 | `['ga_lead', 'admin', 'ga_staff'].includes(profile.role)` | Job create CTA visibility |

This is exactly `GA_ROLES` (`['ga_staff', 'ga_lead', 'admin']`) written inline with different order. Replace with `(GA_ROLES as readonly string[]).includes(profile.role)` following the established codebase pattern.

### Out of Scope -- Other inline role patterns

These patterns exist but are NOT the same set as OPERATIONAL_ROLES or GA_ROLES, and are NOT duplicated enough to warrant constants at this time:

| Pattern | Files | Notes |
|---------|-------|-------|
| `['general_user', 'ga_staff'].includes(...)` | `jobs/page.tsx:62`, `jobs/[id]/page.tsx:84` | Only 2 uses, semantically "non-lead roles" -- not worth a constant now |
| `.in('role', ['ga_staff', 'ga_lead'])` | `jobs/page.tsx:74`, `lib/dashboard/queries.ts:358` | Supabase query filter for "GA field personnel" -- different from GA_ROLES (no admin) |

## Implementation Pattern

The codebase already has a well-established pattern for how role constants are used. Follow it exactly:

```typescript
// In lib/constants/roles.ts -- add after LEAD_ROLES:
/** GA Lead, Admin, Finance Approver -- roles with full operational visibility (dashboard, exports, approvals) */
export const OPERATIONAL_ROLES = [ROLES.GA_LEAD, ROLES.ADMIN, ROLES.FINANCE_APPROVER] as const;
```

```typescript
// Usage pattern (matches existing codebase convention):
import { OPERATIONAL_ROLES } from '@/lib/constants/roles';

// For .includes() checks, cast is needed because of `as const`:
(OPERATIONAL_ROLES as readonly string[]).includes(profile.role)
```

Note: The files in `app/api/exports/{requests,jobs}/route.ts` currently define a local `const EXPORT_ROLES = [...]`. Replace these with:
```typescript
import { OPERATIONAL_ROLES } from '@/lib/constants/roles';
const EXPORT_ROLES: readonly string[] = OPERATIONAL_ROLES;
```
This matches the exact pattern used in `app/api/exports/inventory/route.ts` (which does `const EXPORT_ROLES: readonly string[] = GA_ROLES`) and `app/api/exports/maintenance/route.ts` (which does `const EXPORT_ROLES: readonly string[] = LEAD_ROLES`).

## Common Pitfalls

### Pitfall 1: TypeScript `as const` readonly array vs `.includes()`
**What goes wrong:** `['ga_lead', 'admin', 'finance_approver'].includes(profile.role)` works fine with a plain array, but `OPERATIONAL_ROLES.includes(profile.role)` fails because `OPERATIONAL_ROLES` is `readonly ['ga_lead', 'admin', 'finance_approver']` and `.includes()` expects the exact union type, not `string`.
**How to avoid:** Cast to `(OPERATIONAL_ROLES as readonly string[]).includes(profile.role)`. This is the established pattern used everywhere in the codebase for `GA_ROLES` and `LEAD_ROLES`.

### Pitfall 2: Missing import replacement
**What goes wrong:** Replacing the inline array but forgetting to add the import statement.
**How to avoid:** For files that don't already import from `@/lib/constants/roles`, add the import. For files that already import (e.g., if they use `GA_ROLES`), add `OPERATIONAL_ROLES` to the existing import.

## Files Changed Summary

| File | Action |
|------|--------|
| `lib/constants/roles.ts` | Add `OPERATIONAL_ROLES` constant |
| `app/(dashboard)/page.tsx` | Replace local `OPERATIONAL_ROLES` const with import |
| `app/(dashboard)/requests/page.tsx` | Replace inline array with `OPERATIONAL_ROLES` import |
| `app/(dashboard)/jobs/page.tsx` | Replace inline array at L225 with `OPERATIONAL_ROLES`, replace inline array at L228 with `GA_ROLES` |
| `app/(dashboard)/approvals/page.tsx` | Replace inline array with `OPERATIONAL_ROLES` import |
| `app/api/exports/requests/route.ts` | Replace local `EXPORT_ROLES` definition with import |
| `app/api/exports/jobs/route.ts` | Replace local `EXPORT_ROLES` definition with import |

Total: 7 files changed, 1 constant added, 7 inline arrays eliminated.

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `lib/constants/roles.ts` -- existing constants and patterns
- Grep of all `.ts`/`.tsx` files for inline role arrays -- complete enumeration
- Existing usage patterns of `GA_ROLES` and `LEAD_ROLES` across 40+ files -- established convention

## Metadata

**Confidence breakdown:**
- Scope: HIGH -- exhaustive grep confirms exactly these 7 inline arrays match
- Pattern: HIGH -- copying established convention from 40+ existing usages
- Naming: HIGH -- `OPERATIONAL_ROLES` already used as local const name in `page.tsx`

**Research date:** 2026-03-20
**Valid until:** 2026-04-20
