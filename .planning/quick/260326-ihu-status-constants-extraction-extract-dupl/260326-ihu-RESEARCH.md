# Status Constants Extraction - Research

**Researched:** 2026-03-26
**Domain:** DRY refactor -- status literal arrays to shared constants
**Confidence:** HIGH

## Summary

Six distinct duplicated status array patterns exist in the source code. Four were specified in the task; two additional ones were discovered via broad scan. All belong in the existing `lib/constants/job-status.ts` and `lib/constants/request-status.ts` files, which already define `JOB_STATUSES`, `JobStatus`, `REQUEST_STATUSES`, and `RequestStatus`. The new constants are semantic subsets of these existing enums.

**Primary recommendation:** Add the six subset constants to the existing files, export `as const` arrays with derived tuple types, and replace every literal occurrence in source code files.

## Existing Infrastructure

Constants files already exist at `lib/constants/`:

| File | Already Exports |
|------|-----------------|
| `job-status.ts` | `JOB_STATUSES`, `JobStatus`, `JOB_STATUS_LABELS`, `JOB_STATUS_COLORS` |
| `request-status.ts` | `REQUEST_STATUSES`, `RequestStatus`, `STATUS_LABELS`, `STATUS_COLORS`, `PRIORITIES`, `Priority` |
| `asset-status.ts` | `ASSET_STATUSES`, `AssetStatus`, `ASSET_STATUS_TRANSITIONS`, etc. |
| `schedule-status.ts` | `getScheduleDisplayStatus()`, labels/colors |
| `approval-status.ts` | `APPROVAL_TYPE_COLORS`, `APPROVAL_DECISION_COLORS`, labels |

No subset/semantic constants exist yet. All six new constants go into the two existing files.

## Pattern Inventory

### 1. JOB_TERMINAL_STATUSES = ['completed', 'cancelled'] as const

**File:** `lib/constants/job-status.ts`
**Semantic meaning:** Job is finished -- no further edits/actions allowed.

| # | File | Line | Usage Pattern |
|---|------|------|---------------|
| 1 | `components/jobs/job-detail-info.tsx` | 90 | `.includes()` -- canEdit guard |
| 2 | `components/jobs/job-detail-client.tsx` | 59 | `.includes()` -- canEdit guard |
| 3 | `components/jobs/job-comment-form.tsx` | 40 | `.includes()` -- block comment submission |
| 4 | `components/jobs/job-modal.tsx` | 628 | `.includes()` -- canEdit guard |
| 5 | `components/jobs/job-modal.tsx` | 635 | `.includes()` -- canCancel guard |
| 6 | `components/jobs/job-detail-actions.tsx` | 105 | `.includes()` -- action visibility |
| 7 | `app/actions/pm-job-actions.ts` | 48 | `.includes()` -- server action guard |
| 8 | `app/actions/pm-job-actions.ts` | 136 | `.includes()` -- server action guard |
| 9 | `components/maintenance/overdue-badge.tsx` | 18 | `.includes()` -- suppress badge |
| 10 | `components/maintenance/pm-checklist.tsx` | 52 | `.includes()` -- isReadOnly |
| 11 | `components/maintenance/pm-checklist.tsx` | 104 | `.includes()` -- UI conditional |
| 12 | `components/maintenance/pm-checklist.tsx` | 111 | `.includes()` -- UI conditional |

**Total: 12 occurrences across 8 source files.** (Matches task report.)

SQL migrations also use `NOT IN ('completed', 'cancelled')` but those are SQL strings and cannot reference TS constants -- leave as-is.

### 2. REQUEST_LINKABLE_STATUSES = ['triaged', 'in_progress'] as const

**File:** `lib/constants/request-status.ts`
**Semantic meaning:** Request is eligible for linking to a job / completing.

| # | File | Line | Usage Pattern |
|---|------|------|---------------|
| 1 | `app/(dashboard)/jobs/page.tsx` | 107 | `.in('status', [...])` -- Supabase filter |
| 2 | `components/jobs/job-modal.tsx` | 303 | `.in('status', [...])` -- Supabase filter |
| 3 | `app/actions/job-actions.ts` | 63 | `.includes()` -- validation guard |
| 4 | `app/actions/job-actions.ts` | 264 | `.includes()` -- validation guard |
| 5 | `app/actions/job-actions.ts` | 589 | `.in('status', [...])` -- cascading update filter |
| 6 | `app/actions/approval-actions.ts` | 204 | `.in('status', [...])` -- cascading update filter |
| 7 | `app/actions/request-actions.ts` | 335 | `.includes()` -- completeRequest guard |
| 8 | `components/requests/request-detail-actions.tsx` | 50 | `.includes()` -- canComplete guard |
| 9 | `components/requests/request-view-modal.tsx` | 446 | `.includes()` -- canComplete guard |

**Total: 9 occurrences across 7 source files.** (Higher than reported 7/6.)

### 3. REQUEST_TRIAGEABLE_STATUSES = ['submitted', 'triaged'] as const

**File:** `lib/constants/request-status.ts`
**Semantic meaning:** Request can be triaged (assign PIC, set priority) or rejected.

| # | File | Line | Usage Pattern |
|---|------|------|---------------|
| 1 | `components/requests/request-detail-actions.tsx` | 44 | `.includes()` -- canTriage guard |
| 2 | `components/requests/request-view-modal.tsx` | 444 | `.includes()` -- canReject guard |
| 3 | `components/requests/request-detail-info.tsx` | 91 | `.includes()` -- canTriage guard |
| 4 | `app/actions/request-actions.ts` | 141 | `.includes()` -- triageRequest guard |
| 5 | `app/actions/request-actions.ts` | 271 | `.includes()` -- rejectRequest guard |

**Total: 5 occurrences across 4 source files.** (Matches task report.)

### 4. JOB_ACTIVE_STATUSES = ['assigned', 'in_progress'] as const

**File:** `lib/constants/job-status.ts`
**Semantic meaning:** Job is actively being worked on (PIC can update checklist, log photos).

| # | File | Line | Usage Pattern |
|---|------|------|---------------|
| 1 | `components/jobs/job-detail-client.tsx` | 115 | `.includes()` -- PIC checklist edit guard |
| 2 | `components/jobs/job-modal.tsx` | 1059 | `.includes()` -- PIC checklist edit guard |

Note: `pm-checklist.tsx:29` is a JSDoc comment, not executable code -- excluded.

**Total: 2 occurrences across 2 source files.** (Lower than reported 3/3.)

### 5. REQUEST_OPEN_STATUSES = ['submitted', 'triaged', 'in_progress'] as const (DISCOVERED)

**File:** `lib/constants/request-status.ts`
**Semantic meaning:** Request is open / not yet resolved -- used for dashboard counts and open request queries.

| # | File | Line | Usage Pattern |
|---|------|------|---------------|
| 1 | `lib/dashboard/queries.ts` | 110 | `.in('status', [...])` -- GA Lead open requests |
| 2 | `lib/dashboard/queries.ts` | 117 | `.in('status', [...])` -- Admin open requests |
| 3 | `lib/dashboard/queries.ts` | 445 | `.in('status', [...])` -- overdue requests |

**Total: 3 occurrences across 1 source file.**

### 6. JOB_OPEN_STATUSES = ['created', 'assigned', 'in_progress'] as const (DISCOVERED)

**File:** `lib/constants/job-status.ts`
**Semantic meaning:** Job is open / not terminal -- used for dashboard counts, schedule deduplication, and active job queries.

| # | File | Line | Usage Pattern |
|---|------|------|---------------|
| 1 | `lib/dashboard/queries.ts` | 160 | `.in('status', [...])` -- GA Lead open jobs |
| 2 | `lib/dashboard/queries.ts` | 167 | `.in('status', [...])` -- Admin open jobs |
| 3 | `lib/dashboard/queries.ts` | 398 | `.includes()` -- active job check |
| 4 | `app/actions/schedule-actions.ts` | 240 | `.in('status', [...])` -- PM schedule open job check |
| 5 | `app/actions/schedule-actions.ts` | 517 | `.in('status', [...])` -- PM schedule open job check |

**Total: 5 occurrences across 2 source files.**

## Implementation Notes

### Type Signature

Use `as const` arrays with `readonly` inference. Both `.includes()` and Supabase `.in()` accept `readonly` arrays:

```typescript
// In lib/constants/job-status.ts
export const JOB_TERMINAL_STATUSES = ['completed', 'cancelled'] as const;
export const JOB_ACTIVE_STATUSES = ['assigned', 'in_progress'] as const;
export const JOB_OPEN_STATUSES = ['created', 'assigned', 'in_progress'] as const;
```

```typescript
// In lib/constants/request-status.ts
export const REQUEST_LINKABLE_STATUSES = ['triaged', 'in_progress'] as const;
export const REQUEST_TRIAGEABLE_STATUSES = ['submitted', 'triaged'] as const;
export const REQUEST_OPEN_STATUSES = ['submitted', 'triaged', 'in_progress'] as const;
```

### .includes() on readonly arrays

TypeScript's `ReadonlyArray<T>.includes()` requires the argument to be of type `T`. When the status variable is typed as `string` (which it is in most of these locations since it comes from Supabase query results), calling `JOB_TERMINAL_STATUSES.includes(status)` will produce a type error because `status` is `string` but the array element type is `'completed' | 'cancelled'`.

Two clean solutions:
1. **Cast the array to `readonly string[]`** at the call site: `(JOB_TERMINAL_STATUSES as readonly string[]).includes(status)` -- verbose, defeats purpose.
2. **Export a type-guard helper** alongside each constant -- overly complex for this use case.
3. **Preferred: Widen the export type** by adding a typed helper or just using `[...JOB_TERMINAL_STATUSES] as string[]` -- still verbose.
4. **Simplest: Use `as const satisfies readonly JobStatus[]`** and rely on the fact that the status variable type from Supabase is already `string`. Actually, the simplest approach is to just keep the arrays as `readonly string[]` in addition to `as const`:

```typescript
// This works with .includes(stringVar) without casts:
export const JOB_TERMINAL_STATUSES: readonly string[] = ['completed', 'cancelled'];
```

But this loses the literal type information. Best approach:

```typescript
export const JOB_TERMINAL_STATUSES = ['completed', 'cancelled'] as const;
// For .includes() usage, the status values from Supabase come as `string`.
// TypeScript narrows correctly because .in() accepts string[],
// and .includes() on readonly arrays works when the param is `string`
// as long as we use the correct overload.
```

**Actual check:** In this codebase, the pattern is `['completed', 'cancelled'].includes(job.status)` where `job.status` is typed as `string` from Supabase. Replacing the inline array literal with a `const` reference preserves the exact same runtime behavior. TypeScript does NOT error on `(readonly string[]).includes(string)` -- the issue only arises with narrow literal tuple types. Since the existing `JOB_STATUSES` is already `as const` and used in the same way throughout, using `as const` for the subsets is fine.

**Verification needed during implementation:** Run `npm run build` after the replacement to confirm no type errors.

### Supabase .in() compatibility

Supabase's `.in('status', array)` accepts `string[]`. A `readonly` (`as const`) array will work if spread: `.in('status', [...JOB_TERMINAL_STATUSES])`. However, checking the Supabase types, `.in()` actually accepts `readonly` arrays too in recent versions. Either way, spreading is a safe fallback.

**Check existing codebase pattern:** The existing `JOB_STATUSES` (already `as const`) is not currently used in `.in()` calls, so there is no precedent to follow. The planner should verify with a build.

### Files NOT to touch

- SQL migration files (`supabase/migrations/*`) -- these use SQL string literals, not TS constants
- Seed files (`scripts/seed-ops.ts`) -- these define their own local status arrays for seeding; could optionally reference the constants but this is lower priority
- E2E test files (`e2e/tests/*`) -- test files often hardcode values intentionally for clarity
- Planning/docs files (`.planning/*`, `docs/*`, `improvements.md`) -- not executable code

### Scope of source code changes

| Constant | Files to Modify | Total Edits |
|----------|----------------|-------------|
| `JOB_TERMINAL_STATUSES` | 8 files | 12 replacements |
| `REQUEST_LINKABLE_STATUSES` | 7 files | 9 replacements |
| `REQUEST_TRIAGEABLE_STATUSES` | 4 files | 5 replacements |
| `JOB_ACTIVE_STATUSES` | 2 files | 2 replacements |
| `REQUEST_OPEN_STATUSES` | 1 file | 3 replacements |
| `JOB_OPEN_STATUSES` | 2 files | 5 replacements |
| **Total** | **14 unique files** | **36 replacements** |

## Common Pitfalls

### Pitfall 1: TypeScript readonly array vs .includes()
**What goes wrong:** `as const` creates `readonly ['completed', 'cancelled']` which may cause `.includes(stringVar)` to error if `stringVar` is `string` not the literal union.
**How to avoid:** Test with `npm run build` after changes. If errors occur, the simplest fix is to spread: `[...JOB_TERMINAL_STATUSES].includes(status)`.

### Pitfall 2: Missing an occurrence
**What goes wrong:** A literal array is missed, creating inconsistency.
**How to avoid:** The planner should use the exact grep patterns and line numbers from this research. After replacement, re-grep to confirm zero remaining inline literals.

### Pitfall 3: Changing semantics when extracting
**What goes wrong:** Grouping arrays that look the same but mean different things under one constant.
**How to avoid:** Each constant has a clear semantic name. `REQUEST_LINKABLE_STATUSES` and `REQUEST_TRIAGEABLE_STATUSES` overlap (`'triaged'`) but serve different purposes. Do not merge them.

## Sources

### Primary (HIGH confidence)
- Direct grep of all `*.ts` and `*.tsx` files in the project -- every occurrence verified with line numbers
- Existing constants files read: `lib/constants/job-status.ts`, `lib/constants/request-status.ts`
