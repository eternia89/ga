# Quick Task: Extract safeCreateNotifications() Helper - Research

**Researched:** 2026-03-26
**Domain:** DRY refactor -- notification error handling
**Confidence:** HIGH

## Summary

There are exactly 15 identical `.catch(err => console.error('[notifications]', err instanceof Error ? err.message : err))` chains appended to fire-and-forget `createNotifications()` calls across 3 action files. All calls follow the exact same pattern: no `await`, direct `.catch()` on the returned promise. The `.catch` body is character-for-character identical in all 15 locations.

The fix is straightforward: add a `safeCreateNotifications` wrapper in `lib/notifications/helpers.ts` (same file where `createNotifications` lives) that internalizes the `.catch()`, then update all 15 call sites to use the new function.

**Primary recommendation:** Add `safeCreateNotifications` to `lib/notifications/helpers.ts` as a simple pass-through wrapper that calls `createNotifications(params).catch(...)` internally. Update all 15 call sites to use it. No `await` needed -- the wrapper returns `void` (not a Promise).

## Findings

### 1. createNotifications() Signature (HIGH confidence)

Defined in `lib/notifications/helpers.ts`:

```typescript
export interface NotifyParams {
  companyId: string;
  recipientIds: string[];
  actorId: string;
  title: string;
  body?: string;
  type: 'status_change' | 'assignment' | 'approval' | 'completion' | 'auto_accept_warning';
  entityType?: 'request' | 'job' | 'inventory' | 'maintenance_schedule';
  entityId?: string;
}

export async function createNotifications(params: NotifyParams): Promise<void>
```

The function already has internal try/catch that swallows errors. The external `.catch()` is a defensive belt-and-suspenders pattern for truly unexpected failures (e.g., the `createAdminClient()` call itself throwing).

### 2. All 15 .catch Patterns Are Identical (HIGH confidence)

Every single instance uses this exact string:
```typescript
.catch(err => console.error('[notifications]', err instanceof Error ? err.message : err))
```

No variations. No custom context strings. No additional logic.

**Distribution:**
| File | Count |
|------|-------|
| `app/actions/job-actions.ts` | 6 |
| `app/actions/approval-actions.ts` | 5 |
| `app/actions/request-actions.ts` | 4 |
| **Total** | **15** |

Note: `asset-actions.ts` does NOT use `createNotifications` (task description was slightly inaccurate -- only 3 files are affected, not 4).

### 3. Call Pattern (HIGH confidence)

All 15 calls are fire-and-forget (no `await`):
```typescript
createNotifications({
  companyId: ...,
  recipientIds: [...],
  actorId: profile.id,
  title: '...',
  body: '...',
  type: '...',
  entityType: '...',
  entityId: '...',
}).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
```

### 4. Where to Place the Wrapper (HIGH confidence)

**Put it in `lib/notifications/helpers.ts`** -- same file as `createNotifications`.

Rationale:
- `helpers.ts` already exports `createNotifications` and `NotifyParams`
- All 3 consumer files already import from `@/lib/notifications/helpers`
- The wrapper is a thin layer over `createNotifications` -- co-location makes sense
- No need for a new file

The `lib/notifications/` module has 3 files:
- `helpers.ts` -- server-side creation helper (this is where we add)
- `actions.ts` -- server actions for reading/marking notifications
- `hooks.tsx` -- client-side React hooks

### 5. Recommended Implementation (HIGH confidence)

```typescript
/**
 * Fire-and-forget wrapper around createNotifications.
 * Swallows errors with a console.error log — notification failures
 * should never break the triggering action.
 */
export function safeCreateNotifications(params: NotifyParams): void {
  createNotifications(params).catch(err =>
    console.error('[notifications]', err instanceof Error ? err.message : err)
  );
}
```

Key design decisions:
- **Return type is `void`, not `Promise<void>`** -- callers should not await this. The fire-and-forget intent is encoded in the type.
- **Named export alongside `createNotifications`** -- both remain available. Some future callers might want to await + handle errors differently.
- **Import change is minimal** -- callers just change `createNotifications` to `safeCreateNotifications` in their import and remove `.catch(...)`.

### 6. Call Site Transformation

Before:
```typescript
import { createNotifications } from '@/lib/notifications/helpers';
// ...
createNotifications({ ... }).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));
```

After:
```typescript
import { safeCreateNotifications } from '@/lib/notifications/helpers';
// ...
safeCreateNotifications({ ... });
```

If a file still uses `createNotifications` directly for other reasons (none currently do), keep both imports. But in practice, all 3 files can fully switch to `safeCreateNotifications`.

## Common Pitfalls

### Pitfall 1: Accidentally making the wrapper async
**What goes wrong:** If you write `async function safeCreateNotifications` or return the promise, callers might `await` it, defeating the fire-and-forget intent.
**How to avoid:** Return `void` (not `Promise<void>`). Do not use `async`.

### Pitfall 2: Missing a call site
**What goes wrong:** Leaving some `.catch(...)` patterns unconverted creates inconsistency.
**How to avoid:** Use the exact grep pattern `.catch(err => console.error('[notifications]'` to find all 15, then verify count is 0 after refactoring.

### Pitfall 3: Removing createNotifications export
**What goes wrong:** Someone might remove or rename the original export, breaking code that needs to await notifications.
**How to avoid:** Keep both exports. `createNotifications` is the awaitable version, `safeCreateNotifications` is fire-and-forget.

## Validation

After implementation, verify:
```bash
# Should return 0 matches (all .catch patterns removed)
grep -r "createNotifications.*\.catch" app/actions/ | wc -l

# Should return 15 matches (all converted)
grep -r "safeCreateNotifications" app/actions/ | wc -l

# Should return 3 files
grep -rl "safeCreateNotifications" app/actions/

# Build should pass
npm run build
```

## Sources

### Primary (HIGH confidence)
- `lib/notifications/helpers.ts` -- direct source code inspection
- `app/actions/request-actions.ts` -- direct source code inspection
- `app/actions/job-actions.ts` -- direct source code inspection
- `app/actions/approval-actions.ts` -- direct source code inspection
