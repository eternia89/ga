# Quick Task: Approval Actions Defense-in-Depth - Research

**Researched:** 2026-03-26
**Domain:** Server action authorization hardening
**Confidence:** HIGH

## Summary

The 4 approval actions (`approveJob`, `rejectJob`, `approveCompletion`, `rejectCompletion`) in `app/actions/approval-actions.ts` use `authActionClient` (RLS-bound `supabase`). Each action fetches the job (which already selects `company_id`), checks `created_by === profile.id`, validates status, then mutates. Company access is only implicitly enforced via RLS on the SELECT -- there is no explicit `assertCompanyAccess` call.

**Primary recommendation:** Add `assertCompanyAccess(supabase, profile.id, job.company_id, profile.company_id)` after the job fetch / null check in all 4 actions. The `company_id` field is already selected. No schema or query changes needed.

## Current State of Each Action

All 4 actions follow an identical structure:

| Action | Client | Selects company_id? | Auth Check | Mutation |
|--------|--------|---------------------|------------|----------|
| `approveJob` | `supabase` (RLS) | YES | `created_by === profile.id` | `supabase.update()` |
| `rejectJob` | `supabase` (RLS) | YES | `created_by === profile.id` | `supabase.update()` |
| `approveCompletion` | `supabase` (RLS) | YES | `created_by === profile.id` | `supabase.update()` |
| `rejectCompletion` | `supabase` (RLS) | YES | `created_by === profile.id` | `supabase.update()` |

Key finding: `company_id` is already in the `.select()` clause of all 4 job fetches. No query modification needed.

## Established Pattern

From `schedule-actions.ts` (the canonical example of fetch-then-assert):

```typescript
const { data: existing } = await adminSupabase
  .from('maintenance_schedules')
  .select('id, company_id, ...')
  .eq('id', parsedInput.id)
  .single();

if (!existing) throw new Error('Schedule not found');

// Verify user has access to this schedule's company
await assertCompanyAccess(adminSupabase, profile.id, existing.company_id, profile.company_id);
```

**For approval-actions, the insertion point is identical:** right after the `if (!job)` null check, before any status validation or mutation.

## assertCompanyAccess Signature

```typescript
// lib/auth/company-access.ts
export async function assertCompanyAccess(
  supabase: SupabaseClient,
  userId: string,
  targetCompanyId: string,
  profileCompanyId: string
): Promise<void>
```

- Fast-path: if `targetCompanyId === profileCompanyId`, returns immediately (no DB call)
- Otherwise: queries `user_company_access` table for cross-company permission
- Throws `'You do not have access to the selected company.'` on failure

## Important Design Note: RLS vs adminSupabase

Per project memory (`feedback_supabase_rls_admin_client.md`): actions that do their own auth checks should use `adminSupabase` for mutations because RLS UPDATE policies can silently affect 0 rows.

The approval actions currently use the RLS-bound `supabase` for both reads and writes. The `created_by === profile.id` check is a manual auth check. Strictly following the established pattern, these actions should ideally use `adminSupabase` for mutations.

**However, the task scope is specifically "add assertCompanyAccess"** -- not "refactor to adminSupabase". The current RLS-based approach has been working. Recommendation:

1. **In scope:** Add `assertCompanyAccess` using the existing `supabase` (RLS-bound) client. This is sufficient because `assertCompanyAccess` only does a SELECT on `user_company_access`.
2. **Out of scope but flagged:** Consider a follow-up to switch mutations to `adminSupabase` via `gaLeadActionClient` or inline `createAdminClient()`. This would fully align with the codebase pattern.

## Exact Changes Needed

**Import to add (line 1-8 area):**
```typescript
import { assertCompanyAccess } from '@/lib/auth/company-access';
```

**Insert in each action (4 locations), right after the `if (!job)` block:**
```typescript
// Defense-in-depth: verify company access beyond RLS
await assertCompanyAccess(supabase, profile.id, job.company_id, profile.company_id);
```

### Insertion Points (line numbers from current file)

| Action | Insert after line | Context |
|--------|-------------------|---------|
| `approveJob` | 28 | After `if (!job) { throw ... }` |
| `rejectJob` | 95 | After `if (!job) { throw ... }` |
| `approveCompletion` | 161 | After `if (!job) { throw ... }` |
| `rejectCompletion` | 277 | After `if (!job) { throw ... }` |

## Common Pitfalls

1. **Forgetting the import.** The `assertCompanyAccess` helper lives at `@/lib/auth/company-access`.
2. **Wrong client parameter.** Use `supabase` (the RLS-bound client from ctx), not a nonexistent `adminSupabase`. The approval actions use `authActionClient`, not `gaLeadActionClient`.
3. **Wrong insertion order.** The assert must come AFTER the null check (need `job.company_id`) but BEFORE status validation and mutation.

## Sources

### Primary (HIGH confidence)
- `app/actions/approval-actions.ts` -- direct code inspection
- `lib/auth/company-access.ts` -- helper implementation
- `lib/safe-action.ts` -- action client chain definitions
- `app/actions/schedule-actions.ts` -- established assertCompanyAccess pattern
- Project memory: `feedback_supabase_rls_admin_client.md`
