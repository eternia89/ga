---
phase: quick-80
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/auth/company-access.ts
  - lib/validations/helpers.ts
  - app/actions/request-actions.ts
  - app/actions/job-actions.ts
  - app/actions/asset-actions.ts
  - app/actions/schedule-actions.ts
  - app/actions/user-actions.ts
  - lib/validations/asset-schema.ts
  - lib/validations/schedule-schema.ts
autonomous: true
requirements: [QUICK-80]

must_haves:
  truths:
    - "All company access checks use the shared assertCompanyAccess helper instead of inline code"
    - "All ISO date string fields use the shared isoDateString() Zod helper instead of bare z.string()"
    - "Existing behavior is preserved — no functional changes to access checks or date validation"
  artifacts:
    - path: "lib/auth/company-access.ts"
      provides: "assertCompanyAccess helper function"
      exports: ["assertCompanyAccess"]
    - path: "lib/validations/helpers.ts"
      provides: "isoDateString Zod schema helper"
      exports: ["isoDateString"]
  key_links:
    - from: "app/actions/request-actions.ts"
      to: "lib/auth/company-access.ts"
      via: "import assertCompanyAccess"
      pattern: "assertCompanyAccess"
    - from: "app/actions/job-actions.ts"
      to: "lib/auth/company-access.ts"
      via: "import assertCompanyAccess"
      pattern: "assertCompanyAccess"
    - from: "app/actions/asset-actions.ts"
      to: "lib/auth/company-access.ts"
      via: "import assertCompanyAccess"
      pattern: "assertCompanyAccess"
    - from: "app/actions/schedule-actions.ts"
      to: "lib/auth/company-access.ts"
      via: "import assertCompanyAccess"
      pattern: "assertCompanyAccess"
    - from: "app/actions/user-actions.ts"
      to: "lib/auth/company-access.ts"
      via: "import assertCompanyAccess"
      pattern: "assertCompanyAccess"
    - from: "lib/validations/asset-schema.ts"
      to: "lib/validations/helpers.ts"
      via: "import isoDateString"
      pattern: "isoDateString"
    - from: "lib/validations/schedule-schema.ts"
      to: "lib/validations/helpers.ts"
      via: "import isoDateString"
      pattern: "isoDateString"
---

<objective>
Extract two repeated code patterns into shared helpers to reduce duplication across action and validation files.

Purpose: DRY refactoring — the company access check pattern is copy-pasted across 5+ action files (with 8+ occurrences total), and date string validation is inconsistent across schemas.
Output: Two new helper files, all consumers updated to use them.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@lib/safe-action.ts
@lib/auth/actions.ts
@lib/supabase/server.ts
@lib/supabase/admin.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create shared helpers (assertCompanyAccess + isoDateString)</name>
  <files>lib/auth/company-access.ts, lib/validations/helpers.ts</files>
  <action>
1. Create `lib/auth/company-access.ts` with an exported async function `assertCompanyAccess`:

```typescript
import { type SupabaseClient } from '@supabase/supabase-js';

/**
 * Validates that a user has access to the specified company.
 * Skips check if targetCompanyId matches the user's primary company.
 * Throws if no access row found in user_company_access.
 */
export async function assertCompanyAccess(
  supabase: SupabaseClient,
  userId: string,
  targetCompanyId: string,
  profileCompanyId: string
): Promise<void> {
  if (targetCompanyId === profileCompanyId) return;

  const { data: access } = await supabase
    .from('user_company_access')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', targetCompanyId)
    .maybeSingle();

  if (!access) {
    throw new Error('You do not have access to the selected company.');
  }
}
```

Key design decisions:
- Accepts generic `SupabaseClient` so it works with both `supabase` (RLS-bound) and `adminSupabase` (service role) clients
- Uses `.maybeSingle()` (NOT `.single()`) per quick-79 fix
- Skips check when targetCompanyId === profileCompanyId (user's own company)
- Error message matches existing pattern exactly

2. Create `lib/validations/helpers.ts` with an exported function `isoDateString`:

```typescript
import { z } from 'zod';

/**
 * Zod schema for YYYY-MM-DD date strings.
 * Use with .optional(), .nullable() chains as needed at the call site.
 */
export function isoDateString(message = 'Invalid date format (expected YYYY-MM-DD)') {
  return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);
}
```
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Both helper files exist, export correct functions, and pass TypeScript type checking</done>
</task>

<task type="auto">
  <name>Task 2: Replace inline patterns with shared helpers across all action and schema files</name>
  <files>app/actions/request-actions.ts, app/actions/job-actions.ts, app/actions/asset-actions.ts, app/actions/schedule-actions.ts, app/actions/user-actions.ts, lib/validations/asset-schema.ts, lib/validations/schedule-schema.ts</files>
  <action>
**Part A — Replace company access checks in action files:**

For each action file, add `import { assertCompanyAccess } from '@/lib/auth/company-access';` and replace the inline company access check pattern.

1. **`app/actions/request-actions.ts`** (createRequest, ~lines 28-36): Replace the `if (parsedInput.company_id && parsedInput.company_id !== profile.company_id)` block with:
   ```typescript
   if (parsedInput.company_id) {
     await assertCompanyAccess(supabase, profile.id, parsedInput.company_id, profile.company_id);
   }
   ```
   Note: The guard `parsedInput.company_id &&` is still needed because company_id is optional in the schema. The helper internally handles the `=== profileCompanyId` skip.

2. **`app/actions/job-actions.ts`** (createJob, ~lines 30-38): Same replacement pattern as request-actions. Uses `supabase` client.

3. **`app/actions/asset-actions.ts`** (createAsset, ~lines 41-49): Same replacement pattern. Uses `supabase` client.

4. **`app/actions/schedule-actions.ts`** — This file has **5 occurrences** of the pattern (createSchedule non-asset branch, updateSchedule, deactivateSchedule, activateSchedule, deleteSchedule). For each:
   - The create uses `adminSupabase` and the guard `if (parsedInput.company_id && parsedInput.company_id !== profile.company_id)` — replace with `if (parsedInput.company_id) { await assertCompanyAccess(adminSupabase, profile.id, parsedInput.company_id, profile.company_id); }`
   - The update/deactivate/activate/delete patterns use `adminSupabase` and check `existing.company_id` against `profile.company_id`. Replace the `if (!hasXxxAccess) { ... }` blocks with:
     ```typescript
     await assertCompanyAccess(adminSupabase, profile.id, existing.company_id, profile.company_id);
     ```
     Remove the `hasXxxAccess` boolean variable since the helper now handles the skip logic internally. Also remove the `if (accessError)` error check — the helper simply throws if no access (the current accessError check was an extra guard that isn't needed since maybeSingle doesn't throw on missing rows).
   - IMPORTANT: The schedule actions currently throw 'Schedule not found' on access denial (obfuscated error). The helper throws 'You do not have access to the selected company.' which is the standard message. This is acceptable — the error message change is an improvement for debuggability and matches all other action files.

5. **`app/actions/user-actions.ts`** (createUser, ~lines 53-63): Uses `adminSupabase`. Replace the `if (parsedInput.company_id !== profile.company_id)` block. Note this one does NOT have the `parsedInput.company_id &&` guard because company_id is required in the user create schema. Call: `await assertCompanyAccess(adminSupabase, profile.id, parsedInput.company_id, profile.company_id);` — the helper skips if same company.

**Part B — Replace date string fields with isoDateString helper:**

1. **`lib/validations/asset-schema.ts`**:
   - Add `import { isoDateString } from '@/lib/validations/helpers';`
   - Replace `acquisition_date: z.string().min(1, 'Acquisition date is required')` with `acquisition_date: isoDateString('Acquisition date must be YYYY-MM-DD')`
   - Replace `warranty_expiry: z.string().optional()` with `warranty_expiry: isoDateString().optional()`

2. **`lib/validations/schedule-schema.ts`**:
   - Add `import { isoDateString } from '@/lib/validations/helpers';`
   - Replace `start_date: z.string().max(10).optional()` with `start_date: isoDateString().optional()`
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | head -30 && npm run lint 2>&1 | tail -5</automated>
  </verify>
  <done>
- Zero inline `from('user_company_access')` patterns remain in the 5 action files (only the helper and user-company-access-actions.ts should reference this table)
- Zero bare `z.string()` date fields remain in asset-schema.ts and schedule-schema.ts (replaced by isoDateString)
- TypeScript compiles without errors
- ESLint passes
  </done>
</task>

</tasks>

<verification>
- `grep -r "from('user_company_access')" app/actions/ --include="*.ts" | grep -v user-company-access-actions` should return empty (all inline checks removed)
- `grep "isoDateString" lib/validations/asset-schema.ts lib/validations/schedule-schema.ts` should show 3 usages (acquisition_date, warranty_expiry, start_date)
- `npx tsc --noEmit` passes
- `npm run lint` passes
- `npm run build` succeeds
</verification>

<success_criteria>
- assertCompanyAccess helper exists and is used in all 5 action files (request, job, asset, schedule, user)
- isoDateString helper exists and is used for all date string fields in asset-schema and schedule-schema
- No inline company access check patterns remain in action files
- Build and type-check pass with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/80-extract-shared-helpers-for-company-acces/80-SUMMARY.md`
</output>
