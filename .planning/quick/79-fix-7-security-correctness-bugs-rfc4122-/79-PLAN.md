---
phase: quick-79
plan: 79
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/00002_rls_helper_functions.sql
  - app/actions/request-actions.ts
  - app/actions/job-actions.ts
  - app/actions/asset-actions.ts
  - app/actions/schedule-actions.ts
  - app/actions/user-actions.ts
  - app/actions/company-settings-actions.ts
  - scripts/reset-database.sql
autonomous: true
requirements: []

must_haves:
  truths:
    - "RLS fallback UUID is RFC 4122 v4 compliant (version=4 at pos 13, variant=a at pos 17)"
    - "Company access checks in request/job/asset actions use .maybeSingle() instead of .single() to avoid throwing on missing rows"
    - "reactivateUser checks for duplicate email among active users before proceeding"
    - "createUser validates that admin has access to the target company"
    - "schedule-actions .maybeSingle() queries check for Supabase error before checking null data"
    - "company-settings existence check uses .maybeSingle() instead of .single()"
    - "reset-database.sql uses valid RFC 4122 v4 UUIDs for instance_id"
  artifacts:
    - path: "supabase/migrations/00002_rls_helper_functions.sql"
      provides: "RFC 4122 compliant fallback UUID"
      contains: "00000000-0000-4000-a000-000000000000"
    - path: "app/actions/request-actions.ts"
      provides: ".maybeSingle() on company access check"
      contains: "maybeSingle"
    - path: "app/actions/job-actions.ts"
      provides: ".maybeSingle() on company access check"
      contains: "maybeSingle"
    - path: "app/actions/asset-actions.ts"
      provides: ".maybeSingle() on company access check"
      contains: "maybeSingle"
    - path: "app/actions/user-actions.ts"
      provides: "Duplicate email check on reactivate + company access validation on create"
    - path: "app/actions/schedule-actions.ts"
      provides: "Error destructuring on .maybeSingle() queries"
    - path: "app/actions/company-settings-actions.ts"
      provides: ".maybeSingle() on existence check"
      contains: "maybeSingle"
    - path: "scripts/reset-database.sql"
      provides: "Valid v4 UUIDs for instance_id"
      contains: "00000000-0000-4000-a000-000000000000"
  key_links:
    - from: "supabase/migrations/00002_rls_helper_functions.sql"
      to: "RLS policies"
      via: "current_user_company_id() fallback"
      pattern: "00000000-0000-4000-a000-000000000000"
    - from: "app/actions/user-actions.ts"
      to: "user_profiles table"
      via: "duplicate email check before reactivate"
      pattern: "email.*deleted_at.*null"
---

<objective>
Fix 7 security and correctness bugs identified by audit across server actions and SQL files.

Purpose: Eliminate RFC 4122 UUID violations, prevent .single() throws on missing rows, add missing authorization and duplicate checks, and add error handling on .maybeSingle() queries.
Output: All 7 bugs fixed across 8 files.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix SQL files — RFC 4122 UUID compliance (BUG 1 + BUG 7)</name>
  <files>supabase/migrations/00002_rls_helper_functions.sql, scripts/reset-database.sql</files>
  <action>
BUG 1 (CRITICAL): In supabase/migrations/00002_rls_helper_functions.sql line 21, change the COALESCE fallback UUID from '00000000-0000-0000-0000-000000000000' to '00000000-0000-4000-a000-000000000000'. This is the fallback value returned by current_user_company_id() when JWT has no company_id claim. The all-zero UUID violates RFC 4122 v4 which Zod's .uuid() validator enforces. Per CLAUDE.md: "Hardcoded UUIDs MUST be RFC 4122 compliant. Use version=4 (pos 13) and variant=a (pos 17)."

BUG 7 (LOW): In scripts/reset-database.sql, replace all 5 occurrences of the invalid instance_id '00000000-0000-0000-0000-000000000000' with '00000000-0000-4000-a000-000000000000'. These are on lines 68, 88, 108, 128, and 148 — the instance_id column for auth.users INSERT statements.
  </action>
  <verify>
    <automated>grep -n '0000-0000-0000-0000' supabase/migrations/00002_rls_helper_functions.sql scripts/reset-database.sql | grep -v '^--' ; echo "Exit: $? (expect no matches = exit 1)"</automated>
  </verify>
  <done>Zero occurrences of the all-zero UUID pattern '0000-0000-0000-0000' remain in either file (excluding comments). All hardcoded UUIDs use valid v4 format with version=4 at pos 13 and variant=a at pos 17.</done>
</task>

<task type="auto">
  <name>Task 2: Fix .single() to .maybeSingle() and add error handling (BUG 2 + BUG 5 + BUG 6)</name>
  <files>app/actions/request-actions.ts, app/actions/job-actions.ts, app/actions/asset-actions.ts, app/actions/schedule-actions.ts, app/actions/company-settings-actions.ts</files>
  <action>
BUG 2 (HIGH): In request-actions.ts, job-actions.ts, and asset-actions.ts, find all multi-company access validation queries that use `.single()` on the `user_company_access` table and change them to `.maybeSingle()`. These queries check if a user has extra company access and intentionally return null when no row exists (the null check + throw already exists). Using `.single()` causes a Supabase error throw when no row exists, preventing the graceful null-check error handling.

Specific locations:
- request-actions.ts line 34: `.single()` in createRequest company access check -> `.maybeSingle()`
- job-actions.ts line 36: `.single()` in createJob company access check -> `.maybeSingle()`
- asset-actions.ts line 47: `.single()` in createAsset company access check -> `.maybeSingle()`

BUG 5 (MEDIUM): In schedule-actions.ts, the 5 company access validation `.maybeSingle()` queries correctly use `.maybeSingle()` already, but they only destructure `{ data }` and don't check for errors. If the Supabase query itself fails (network, RLS, etc.), the error is silently ignored and the code falls through to the null check, which would incorrectly throw "Schedule not found" instead of surfacing the actual error.

Fix the 5 locations by adding `error` destructuring and throwing if error exists, BEFORE the null data check:
- createSchedule (around line 69-76): Change `const { data: access }` to `const { data: access, error: accessError }`. Add `if (accessError) throw new Error('Failed to verify company access');` before `if (!access)`.
- updateSchedule (around line 143-151): Change `const { data: accessRow }` to `const { data: accessRow, error: accessError }`. Add `if (accessError) throw new Error('Failed to verify company access');` before `if (!accessRow)`.
- deactivateSchedule (around line 213-222): Same pattern.
- activateSchedule (around line 279-287): Same pattern.
- deleteSchedule (around line 337-346): Same pattern.

BUG 6 (LOW): In company-settings-actions.ts line 53-58, the existence check for a setting uses `.single()` which throws when no row exists. Change to `.maybeSingle()` so it returns null (the subsequent if/else already handles both existing and non-existing cases correctly).
  </action>
  <verify>
    <automated>grep -n '\.single()' app/actions/request-actions.ts app/actions/job-actions.ts app/actions/asset-actions.ts app/actions/company-settings-actions.ts | grep -i 'company_access\|company_settings.*key' ; echo "Exit: $? (expect no matches = exit 1)" && grep -c 'accessError' app/actions/schedule-actions.ts | xargs -I{} test {} -ge 5 && echo "schedule-actions has >= 5 accessError checks"</automated>
  </verify>
  <done>All user_company_access queries in request/job/asset actions use .maybeSingle(). All 5 schedule-actions company access queries destructure and check error before null. Company-settings existence check uses .maybeSingle().</done>
</task>

<task type="auto">
  <name>Task 3: Fix user-actions — duplicate email check on reactivate + company access on create (BUG 3 + BUG 4)</name>
  <files>app/actions/user-actions.ts</files>
  <action>
BUG 3 (HIGH): The reactivateUser action (lines 200-223) is missing a duplicate email check. Per CLAUDE.md: "Duplicate name checks on all write paths: Create, Update, AND Restore actions must all check for duplicate names among active (non-deleted) entities before proceeding."

Before clearing deleted_at, add:
1. Fetch the user being reactivated to get their email: query user_profiles by id (include deleted records, since this user IS deleted).
2. Check if another ACTIVE user_profile (deleted_at IS NULL) has the same email, excluding the current user's id.
3. If a duplicate exists, throw: "Cannot reactivate: another active user already has this email address."

Implementation:
```typescript
// Fetch the user being reactivated to get their email
const { data: userToReactivate, error: fetchError } = await adminSupabase
  .from('user_profiles')
  .select('id, email')
  .eq('id', parsedInput.id)
  .single();

if (fetchError || !userToReactivate) {
  throw new Error('User not found');
}

// Check for duplicate email among active users
const { data: duplicateEmail } = await adminSupabase
  .from('user_profiles')
  .select('id')
  .eq('email', userToReactivate.email)
  .is('deleted_at', null)
  .neq('id', parsedInput.id)
  .maybeSingle();

if (duplicateEmail) {
  throw new Error('Cannot reactivate: another active user already has this email address.');
}
```

BUG 4 (MEDIUM): The createUser action (line 48) destructures only `{ parsedInput }` from the action callback, omitting `ctx`. This means there is no company access validation — any admin can create users in any company without verifying they have access.

Fix:
1. Change `async ({ parsedInput })` to `async ({ parsedInput, ctx })` on the createUser action.
2. After the initial `const adminSupabase = createAdminClient();` line, add company access validation:

```typescript
// Validate admin has access to the target company
const { profile } = ctx;
if (parsedInput.company_id !== profile.company_id) {
  const { data: access } = await adminSupabase
    .from('user_company_access')
    .select('id')
    .eq('user_id', profile.id)
    .eq('company_id', parsedInput.company_id)
    .maybeSingle();
  if (!access) {
    throw new Error('You do not have access to the selected company.');
  }
}
```
  </action>
  <verify>
    <automated>grep -n 'duplicateEmail\|another active user' app/actions/user-actions.ts && grep -n 'parsedInput, ctx' app/actions/user-actions.ts | grep 'createUser' ; echo "Exit: $?"</automated>
  </verify>
  <done>reactivateUser checks for duplicate email among active users before clearing deleted_at. createUser destructures ctx and validates admin company access against parsedInput.company_id.</done>
</task>

</tasks>

<verification>
- `npm run build` passes (TypeScript compilation + Next.js build)
- No `.single()` calls remain on user_company_access queries or company_settings existence checks
- All RFC 4122 non-compliant UUIDs replaced
- reactivateUser has duplicate email guard
- createUser has company access validation
</verification>

<success_criteria>
All 7 bugs fixed:
1. RLS helper function uses valid v4 UUID fallback
2. request/job/asset company access checks use .maybeSingle()
3. reactivateUser checks duplicate email before proceeding
4. createUser validates admin company access
5. schedule-actions .maybeSingle() queries check for error return
6. company-settings existence check uses .maybeSingle()
7. reset-database.sql uses valid v4 UUIDs for instance_id
</success_criteria>

<output>
After completion, create `.planning/quick/79-fix-7-security-correctness-bugs-rfc4122-/79-SUMMARY.md`
</output>
