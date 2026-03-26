---
phase: quick-260326-jfw
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/notifications/helpers.ts
  - app/actions/job-actions.ts
  - app/actions/approval-actions.ts
  - app/actions/request-actions.ts
autonomous: true
requirements: [DRY-NOTIF-CATCH]

must_haves:
  truths:
    - "All 15 fire-and-forget notification calls use safeCreateNotifications instead of createNotifications + .catch"
    - "No .catch(err => console.error('[notifications]'...)) chains remain in action files"
    - "createNotifications is still exported for any future callers that need to await"
    - "Build passes with zero type errors"
  artifacts:
    - path: "lib/notifications/helpers.ts"
      provides: "safeCreateNotifications wrapper function"
      exports: ["createNotifications", "safeCreateNotifications", "NotifyParams"]
    - path: "app/actions/job-actions.ts"
      provides: "6 converted call sites using safeCreateNotifications"
    - path: "app/actions/approval-actions.ts"
      provides: "5 converted call sites using safeCreateNotifications"
    - path: "app/actions/request-actions.ts"
      provides: "4 converted call sites using safeCreateNotifications"
  key_links:
    - from: "app/actions/job-actions.ts"
      to: "lib/notifications/helpers.ts"
      via: "import { safeCreateNotifications }"
      pattern: "safeCreateNotifications"
    - from: "app/actions/approval-actions.ts"
      to: "lib/notifications/helpers.ts"
      via: "import { safeCreateNotifications }"
      pattern: "safeCreateNotifications"
    - from: "app/actions/request-actions.ts"
      to: "lib/notifications/helpers.ts"
      via: "import { safeCreateNotifications }"
      pattern: "safeCreateNotifications"
---

<objective>
Extract 15 identical `.catch(err => console.error('[notifications]', ...))` chains into a single `safeCreateNotifications()` wrapper in `lib/notifications/helpers.ts`, then update all call sites in 3 action files.

Purpose: DRY refactor -- eliminate 15 copies of the same error-handling boilerplate across `job-actions.ts` (6), `approval-actions.ts` (5), and `request-actions.ts` (4).
Output: One new exported function, 15 simplified call sites, zero behavior change.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/notifications/helpers.ts
@app/actions/job-actions.ts
@app/actions/approval-actions.ts
@app/actions/request-actions.ts
@.planning/quick/260326-jfw-extract-safecreatenotifications-helper-t/260326-jfw-RESEARCH.md

<interfaces>
<!-- Current exports from lib/notifications/helpers.ts -->
From lib/notifications/helpers.ts:
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

export async function createNotifications(params: NotifyParams): Promise<void>;
```

All 3 action files currently import:
```typescript
import { createNotifications } from '@/lib/notifications/helpers';
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add safeCreateNotifications wrapper to helpers.ts</name>
  <files>lib/notifications/helpers.ts</files>
  <action>
Add the following function at the end of `lib/notifications/helpers.ts`, after the existing `createNotifications` function:

```typescript
/**
 * Fire-and-forget wrapper around createNotifications.
 * Swallows errors with a console.error log -- notification failures
 * should never break the triggering action.
 */
export function safeCreateNotifications(params: NotifyParams): void {
  createNotifications(params).catch(err =>
    console.error('[notifications]', err instanceof Error ? err.message : err)
  );
}
```

Also update the usage comment at the top of the file (lines 1-5) to recommend `safeCreateNotifications` as the default import for fire-and-forget usage, keeping `createNotifications` documented as the awaitable alternative.

IMPORTANT:
- Return type MUST be `void` (not `Promise<void>`) -- this encodes the fire-and-forget intent in the type system.
- Do NOT use `async` keyword -- the function is synchronous; it just kicks off a promise internally.
- Do NOT remove or modify `createNotifications` -- it must remain exported for any future caller that needs to await.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -c "export function safeCreateNotifications" lib/notifications/helpers.ts | grep -q "1" && grep -c "export async function createNotifications" lib/notifications/helpers.ts | grep -q "1" && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>helpers.ts exports both `createNotifications` (awaitable) and `safeCreateNotifications` (fire-and-forget). Usage comment updated.</done>
</task>

<task type="auto">
  <name>Task 2: Convert all 15 call sites to safeCreateNotifications</name>
  <files>app/actions/job-actions.ts, app/actions/approval-actions.ts, app/actions/request-actions.ts</files>
  <action>
In each of the 3 action files, make two changes:

1. **Update the import statement:** Change `createNotifications` to `safeCreateNotifications`:
   ```typescript
   // Before:
   import { createNotifications } from '@/lib/notifications/helpers';
   // After:
   import { safeCreateNotifications } from '@/lib/notifications/helpers';
   ```

2. **Update every call site:** For each `createNotifications({...}).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err))` occurrence, replace with just `safeCreateNotifications({...})`:
   - Remove the entire `.catch(err => console.error('[notifications]', err instanceof Error ? err.message : err))` chain
   - Change the function name from `createNotifications` to `safeCreateNotifications`
   - Keep all the parameter objects exactly as-is -- do not modify any `companyId`, `recipientIds`, `actorId`, `title`, `body`, `type`, `entityType`, or `entityId` values
   - The semicolon after the closing `)` of the function call replaces the semicolon that was after the `.catch(...)` chain

Expected counts:
- `job-actions.ts`: 6 call sites converted
- `approval-actions.ts`: 5 call sites converted
- `request-actions.ts`: 4 call sites converted

IMPORTANT: Do NOT modify any other code in these files. Only touch the import line and the notification call sites.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && CATCH_COUNT=$(grep -r "createNotifications.*\.catch" app/actions/ | wc -l | tr -d ' ') && SAFE_COUNT=$(grep -r "safeCreateNotifications" app/actions/ | wc -l | tr -d ' ') && FILE_COUNT=$(grep -rl "safeCreateNotifications" app/actions/ | wc -l | tr -d ' ') && OLD_IMPORT=$(grep -r "import.*{ createNotifications }" app/actions/ | wc -l | tr -d ' ') && echo "catch_patterns=$CATCH_COUNT (expect 0), safe_calls=$SAFE_COUNT (expect 18, 15 calls + 3 imports), files=$FILE_COUNT (expect 3), old_imports=$OLD_IMPORT (expect 0)" && [ "$CATCH_COUNT" -eq 0 ] && [ "$SAFE_COUNT" -eq 18 ] && [ "$FILE_COUNT" -eq 3 ] && [ "$OLD_IMPORT" -eq 0 ] && npm run build 2>&1 | tail -5 && echo "ALL CHECKS PASS" || echo "CHECKS FAILED"</automated>
  </verify>
  <done>All 15 .catch() chains removed. All 3 action files import and use safeCreateNotifications. Zero instances of the old pattern remain. Build passes.</done>
</task>

</tasks>

<verification>
1. `grep -r "createNotifications.*\.catch" app/actions/` returns 0 matches (all .catch patterns removed)
2. `grep -r "safeCreateNotifications" app/actions/` returns 18 matches (15 calls + 3 imports)
3. `grep -rl "safeCreateNotifications" app/actions/` returns exactly 3 files
4. `grep -r "import.*{ createNotifications }" app/actions/` returns 0 matches (all imports updated)
5. `npm run build` completes with zero errors
6. `lib/notifications/helpers.ts` exports both `createNotifications` and `safeCreateNotifications`
</verification>

<success_criteria>
- safeCreateNotifications is exported from lib/notifications/helpers.ts with return type void (not Promise)
- All 15 fire-and-forget notification calls across 3 action files use safeCreateNotifications
- Zero instances of .catch(err => console.error('[notifications]'...)) remain in action files
- createNotifications remains exported and unchanged for future awaitable usage
- npm run build passes with no type errors
</success_criteria>

<output>
After completion, create `.planning/quick/260326-jfw-extract-safecreatenotifications-helper-t/260326-jfw-SUMMARY.md`
</output>
