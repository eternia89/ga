---
phase: quick-260326-ihu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/constants/job-status.ts
  - lib/constants/request-status.ts
  - components/jobs/job-detail-info.tsx
  - components/jobs/job-detail-client.tsx
  - components/jobs/job-comment-form.tsx
  - components/jobs/job-modal.tsx
  - components/jobs/job-detail-actions.tsx
  - components/maintenance/overdue-badge.tsx
  - components/maintenance/pm-checklist.tsx
  - components/requests/request-detail-actions.tsx
  - components/requests/request-view-modal.tsx
  - components/requests/request-detail-info.tsx
  - app/actions/pm-job-actions.ts
  - app/actions/job-actions.ts
  - app/actions/request-actions.ts
  - app/actions/approval-actions.ts
  - app/actions/schedule-actions.ts
  - app/(dashboard)/jobs/page.tsx
  - lib/dashboard/queries.ts
autonomous: true
requirements: [DRY-STATUS-CONSTANTS]

must_haves:
  truths:
    - "No inline status literal arrays remain in source code for the 6 defined constant patterns"
    - "All 36 occurrences reference shared constants instead of inline arrays"
    - "Build passes with zero type errors"
    - "Runtime behavior is identical (same status checks, same filters)"
  artifacts:
    - path: "lib/constants/job-status.ts"
      provides: "JOB_TERMINAL_STATUSES, JOB_ACTIVE_STATUSES, JOB_OPEN_STATUSES constants"
      contains: "JOB_TERMINAL_STATUSES"
    - path: "lib/constants/request-status.ts"
      provides: "REQUEST_LINKABLE_STATUSES, REQUEST_TRIAGEABLE_STATUSES, REQUEST_OPEN_STATUSES constants"
      contains: "REQUEST_LINKABLE_STATUSES"
  key_links:
    - from: "components/jobs/*.tsx"
      to: "lib/constants/job-status.ts"
      via: "import { JOB_TERMINAL_STATUSES, JOB_ACTIVE_STATUSES }"
      pattern: "JOB_TERMINAL_STATUSES"
    - from: "app/actions/*-actions.ts"
      to: "lib/constants/job-status.ts"
      via: "import { JOB_TERMINAL_STATUSES, JOB_OPEN_STATUSES }"
      pattern: "JOB_TERMINAL_STATUSES|JOB_OPEN_STATUSES"
    - from: "components/requests/*.tsx"
      to: "lib/constants/request-status.ts"
      via: "import { REQUEST_LINKABLE_STATUSES, REQUEST_TRIAGEABLE_STATUSES }"
      pattern: "REQUEST_LINKABLE_STATUSES|REQUEST_TRIAGEABLE_STATUSES"
    - from: "app/actions/*-actions.ts"
      to: "lib/constants/request-status.ts"
      via: "import { REQUEST_LINKABLE_STATUSES, REQUEST_TRIAGEABLE_STATUSES }"
      pattern: "REQUEST_LINKABLE_STATUSES|REQUEST_TRIAGEABLE_STATUSES"
---

<objective>
Extract 6 duplicated status literal arrays into shared constants in `lib/constants/job-status.ts` and `lib/constants/request-status.ts`, then replace all 36 inline occurrences across 14 source files.

Purpose: Eliminate duplication so status groupings are defined once and future status changes propagate automatically.
Output: 2 updated constants files + 14 updated consumer files with zero inline status arrays remaining.
</objective>

<context>
@lib/constants/job-status.ts
@lib/constants/request-status.ts
@.planning/quick/260326-ihu-status-constants-extraction-extract-dupl/260326-ihu-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Define 6 status subset constants in existing constants files</name>
  <files>lib/constants/job-status.ts, lib/constants/request-status.ts</files>
  <action>
Add 3 new exported constants to `lib/constants/job-status.ts` (append before the re-export block at the bottom):

```typescript
// Semantic status subsets
export const JOB_TERMINAL_STATUSES = ['completed', 'cancelled'] as const;
export const JOB_ACTIVE_STATUSES = ['assigned', 'in_progress'] as const;
export const JOB_OPEN_STATUSES = ['created', 'assigned', 'in_progress'] as const;
```

Add 3 new exported constants to `lib/constants/request-status.ts` (append after the `PRIORITIES` block at the bottom):

```typescript
// Semantic status subsets
export const REQUEST_LINKABLE_STATUSES = ['triaged', 'in_progress'] as const;
export const REQUEST_TRIAGEABLE_STATUSES = ['submitted', 'triaged'] as const;
export const REQUEST_OPEN_STATUSES = ['submitted', 'triaged', 'in_progress'] as const;
```

These use `as const` matching the existing `JOB_STATUSES` / `REQUEST_STATUSES` pattern already in these files. The `as const` arrays work with both `.includes()` and Supabase `.in()` as-is because the status variables from Supabase are typed as `string` which satisfies `ReadonlyArray<string>.includes(string)`.
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>Both files export the 6 new constants. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Replace all 36 inline status arrays with constant references</name>
  <files>
    components/jobs/job-detail-info.tsx,
    components/jobs/job-detail-client.tsx,
    components/jobs/job-comment-form.tsx,
    components/jobs/job-modal.tsx,
    components/jobs/job-detail-actions.tsx,
    components/maintenance/overdue-badge.tsx,
    components/maintenance/pm-checklist.tsx,
    components/requests/request-detail-actions.tsx,
    components/requests/request-view-modal.tsx,
    components/requests/request-detail-info.tsx,
    app/actions/pm-job-actions.ts,
    app/actions/job-actions.ts,
    app/actions/request-actions.ts,
    app/actions/approval-actions.ts,
    app/actions/schedule-actions.ts,
    app/(dashboard)/jobs/page.tsx,
    lib/dashboard/queries.ts
  </files>
  <action>
Replace every inline status literal array with the corresponding imported constant. For each file, add the necessary import and replace the inline arrays.

**JOB_TERMINAL_STATUSES** -- replace `['completed', 'cancelled']` (12 occurrences in 8 files):
- `components/jobs/job-detail-info.tsx:90` -- `!['completed', 'cancelled'].includes(job.status)` -> `!JOB_TERMINAL_STATUSES.includes(job.status)`
- `components/jobs/job-detail-client.tsx:59` -- same pattern
- `components/jobs/job-comment-form.tsx:40` -- same pattern
- `components/jobs/job-modal.tsx:628` -- same pattern
- `components/jobs/job-modal.tsx:635` -- same pattern
- `components/jobs/job-detail-actions.tsx:105` -- same pattern
- `app/actions/pm-job-actions.ts:48` -- same pattern
- `app/actions/pm-job-actions.ts:136` -- same pattern
- `components/maintenance/overdue-badge.tsx:18` -- same pattern
- `components/maintenance/pm-checklist.tsx:52` -- same pattern
- `components/maintenance/pm-checklist.tsx:104` -- same pattern
- `components/maintenance/pm-checklist.tsx:111` -- same pattern

**JOB_ACTIVE_STATUSES** -- replace `['assigned', 'in_progress']` (2 occurrences in 2 files):
- `components/jobs/job-detail-client.tsx:115` -- `.includes()` usage
- `components/jobs/job-modal.tsx:1059` -- `.includes()` usage
Note: `pm-checklist.tsx:29` is a JSDoc comment -- leave it as-is.

**JOB_OPEN_STATUSES** -- replace `['created', 'assigned', 'in_progress']` (5 occurrences in 2 files):
- `lib/dashboard/queries.ts:160` -- `.in('status', ...)` usage
- `lib/dashboard/queries.ts:167` -- `.in('status', ...)` usage
- `lib/dashboard/queries.ts:398` -- `.includes()` usage
- `app/actions/schedule-actions.ts:240` -- `.in('status', ...)` usage
- `app/actions/schedule-actions.ts:517` -- `.in('status', ...)` usage

**REQUEST_LINKABLE_STATUSES** -- replace `['triaged', 'in_progress']` (9 occurrences in 7 files):
- `app/(dashboard)/jobs/page.tsx:107` -- `.in('status', ...)` usage
- `components/jobs/job-modal.tsx:303` -- `.in('status', ...)` usage
- `app/actions/job-actions.ts:63` -- `.includes()` usage
- `app/actions/job-actions.ts:264` -- `.includes()` usage
- `app/actions/job-actions.ts:589` -- `.in('status', ...)` usage
- `app/actions/approval-actions.ts:204` -- `.in('status', ...)` usage
- `app/actions/request-actions.ts:335` -- `.includes()` usage
- `components/requests/request-detail-actions.tsx:50` -- `.includes()` usage
- `components/requests/request-view-modal.tsx:446` -- `.includes()` usage

**REQUEST_TRIAGEABLE_STATUSES** -- replace `['submitted', 'triaged']` (5 occurrences in 4 files):
- `components/requests/request-detail-actions.tsx:44` -- `.includes()` usage
- `components/requests/request-view-modal.tsx:444` -- `.includes()` usage
- `components/requests/request-detail-info.tsx:91` -- `.includes()` usage
- `app/actions/request-actions.ts:141` -- `.includes()` usage
- `app/actions/request-actions.ts:271` -- `.includes()` usage

**REQUEST_OPEN_STATUSES** -- replace `['submitted', 'triaged', 'in_progress']` (3 occurrences in 1 file):
- `lib/dashboard/queries.ts:110` -- `.in('status', ...)` usage
- `lib/dashboard/queries.ts:117` -- `.in('status', ...)` usage
- `lib/dashboard/queries.ts:445` -- `.in('status', ...)` usage

**Import patterns to add:**
- Files using job constants: `import { JOB_TERMINAL_STATUSES } from '@/lib/constants/job-status';` (add other constants to the same import as needed: `JOB_ACTIVE_STATUSES`, `JOB_OPEN_STATUSES`)
- Files using request constants: `import { REQUEST_LINKABLE_STATUSES } from '@/lib/constants/request-status';` (add other constants to the same import as needed: `REQUEST_TRIAGEABLE_STATUSES`, `REQUEST_OPEN_STATUSES`)
- If the file already imports from `@/lib/constants/job-status` or `@/lib/constants/request-status`, add the new constants to the existing import statement instead of adding a duplicate import.

**For Supabase `.in()` calls:** Use `[...CONSTANT]` spread syntax to convert readonly to mutable array: `.in('status', [...JOB_OPEN_STATUSES])`. This avoids any potential readonly type issues with the Supabase client.

**For `.includes()` calls:** Use the constant directly: `JOB_TERMINAL_STATUSES.includes(status)`. This works because the status variables from Supabase are typed as `string`.

**If `.includes()` produces a type error during build** (readonly tuple type not accepting `string` argument), use the spread pattern instead: `[...JOB_TERMINAL_STATUSES].includes(status)`. Apply consistently across all `.includes()` call sites if needed.

**Post-replacement verification grep:** After all replacements, run grep to confirm zero remaining inline literals for each pattern. Any hits in SQL migrations, seed files, JSDoc comments, or planning docs are expected and should be left alone.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
All 36 inline status literal arrays replaced with constant references. `npm run build` succeeds. Grep confirms no remaining inline status arrays in source files (excluding migrations, seeds, JSDoc, planning docs).
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes with zero errors
2. Grep for each literal pattern returns zero hits in source files:
   - `grep -r "\['completed',\s*'cancelled'\]" --include="*.ts" --include="*.tsx" components/ app/ lib/` returns nothing
   - `grep -r "\['triaged',\s*'in_progress'\]" --include="*.ts" --include="*.tsx" components/ app/ lib/` returns nothing
   - `grep -r "\['submitted',\s*'triaged'\]" --include="*.ts" --include="*.tsx" components/ app/ lib/` returns nothing
   - `grep -r "\['assigned',\s*'in_progress'\]" --include="*.ts" --include="*.tsx" components/ app/ lib/` returns nothing (except JSDoc in pm-checklist.tsx)
   - `grep -r "\['submitted',\s*'triaged',\s*'in_progress'\]" --include="*.ts" --include="*.tsx" components/ app/ lib/` returns nothing
   - `grep -r "\['created',\s*'assigned',\s*'in_progress'\]" --include="*.ts" --include="*.tsx" components/ app/ lib/` returns nothing
3. Constants files export all 6 new constants
</verification>

<success_criteria>
- 6 new constants defined in 2 files (3 in job-status.ts, 3 in request-status.ts)
- 36 inline arrays replaced across 14 source files
- Zero type errors, zero build errors
- Zero remaining inline status literal arrays in source code
</success_criteria>

<output>
After completion, create `.planning/quick/260326-ihu-status-constants-extraction-extract-dupl/260326-ihu-SUMMARY.md`
</output>
