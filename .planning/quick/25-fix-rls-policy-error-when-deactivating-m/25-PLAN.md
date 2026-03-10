---
phase: quick-25
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/safe-action.ts
  - app/actions/schedule-actions.ts
autonomous: true
requirements: [QUICK-25]

must_haves:
  truths:
    - "GA Lead can deactivate a maintenance schedule without RLS error"
    - "GA Lead can activate, delete, create, and update schedules without RLS error"
    - "Admin can perform all schedule mutations as before"
    - "Read operations (getSchedules, getSchedulesByAssetId) still work for all authenticated users"
  artifacts:
    - path: "lib/safe-action.ts"
      provides: "gaLeadActionClient middleware allowing ga_lead+admin with adminSupabase"
      contains: "gaLeadActionClient"
    - path: "app/actions/schedule-actions.ts"
      provides: "Schedule mutation actions using gaLeadActionClient"
      contains: "gaLeadActionClient"
  key_links:
    - from: "app/actions/schedule-actions.ts"
      to: "lib/safe-action.ts"
      via: "import gaLeadActionClient"
      pattern: "import.*gaLeadActionClient.*from.*safe-action"
---

<objective>
Fix RLS policy error when GA Lead deactivates a maintenance schedule by switching mutation actions to a new `gaLeadActionClient` that bypasses RLS via adminSupabase.

Purpose: The current `authActionClient` uses the user's Supabase client which is subject to RLS WITH CHECK policies. The `current_user_company_id()` function fails during UPDATE, causing "new row violates row-level security policy" errors. Since these actions already do manual role+company checks, RLS is redundant and should be bypassed.

Output: Working schedule mutations for both GA Lead and Admin roles without RLS errors.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/safe-action.ts
@app/actions/schedule-actions.ts
@lib/supabase/admin.ts

<interfaces>
From lib/safe-action.ts:
```typescript
// Existing chain: actionClient -> authActionClient -> adminActionClient
// adminActionClient restricts to role === "admin" only
// Need new: authActionClient -> gaLeadActionClient (ga_lead + admin, provides adminSupabase)
export const authActionClient = actionClient.use(async ({ next }) => { ... });
export const adminActionClient = authActionClient.use(async ({ ctx, next }) => { ... });
```

From lib/supabase/admin.ts:
```typescript
export function createAdminClient(): SupabaseClient;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add gaLeadActionClient to safe-action.ts</name>
  <files>lib/safe-action.ts</files>
  <action>
Add a new `gaLeadActionClient` middleware between `authActionClient` and `adminActionClient` in lib/safe-action.ts.

```typescript
// GA operations action client — ga_lead or admin, provides adminSupabase (bypasses RLS)
export const gaLeadActionClient = authActionClient.use(async ({ ctx, next }) => {
  if (!['ga_lead', 'admin'].includes(ctx.profile.role)) {
    throw new Error("GA Lead or Admin access required");
  }
  const adminSupabase = createAdminClient();
  return next({ ctx: { ...ctx, adminSupabase } });
});
```

Place this BETWEEN the existing `authActionClient` and `adminActionClient` definitions. Do NOT modify `adminActionClient` (it stays admin-only for settings/config actions).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
  </verify>
  <done>gaLeadActionClient exported from lib/safe-action.ts, TypeScript compiles clean</done>
</task>

<task type="auto">
  <name>Task 2: Switch schedule mutation actions to gaLeadActionClient</name>
  <files>app/actions/schedule-actions.ts</files>
  <action>
In app/actions/schedule-actions.ts:

1. Change import: replace `authActionClient` with `{ authActionClient, gaLeadActionClient }` from `@/lib/safe-action`.

2. Switch these 5 mutation actions from `authActionClient` to `gaLeadActionClient`:
   - createSchedule
   - updateSchedule
   - deactivateSchedule
   - activateSchedule
   - deleteSchedule

3. For each switched action:
   - REMOVE the manual role check block (`if (!['ga_lead', 'admin'].includes(profile.role))`) since `gaLeadActionClient` already enforces this.
   - Change all `supabase` references to `adminSupabase` for database operations (the `ctx` now provides `adminSupabase` from `gaLeadActionClient`). Destructure as `const { adminSupabase, profile } = ctx;` instead of `const { supabase, profile } = ctx;`.

4. Keep `getSchedules` and `getSchedulesByAssetId` on `authActionClient` with regular `supabase` — read operations work fine with RLS and should remain accessible to all authenticated users.

5. The three helper functions at the bottom (pauseSchedulesForAsset, resumeSchedulesForAsset, deactivateSchedulesForAsset) are NOT action clients — they receive a supabase client as parameter. Leave them unchanged. They are called from asset-actions.ts which already passes an appropriate client.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -20 && npm run lint 2>&1 | tail -5</automated>
  </verify>
  <done>All 5 schedule mutation actions use gaLeadActionClient with adminSupabase, no manual role checks, TypeScript and ESLint pass</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npx tsc --noEmit`
2. ESLint passes: `npm run lint`
3. Build succeeds: `npm run build` (check for runtime issues)
</verification>

<success_criteria>
- gaLeadActionClient exists in lib/safe-action.ts allowing ga_lead+admin with adminSupabase
- All 5 schedule mutation actions use gaLeadActionClient and adminSupabase
- Read actions (getSchedules, getSchedulesByAssetId) remain on authActionClient
- No manual role checks in mutation actions (gaLeadActionClient handles it)
- TypeScript, ESLint, and build all pass
</success_criteria>

<output>
After completion, create `.planning/quick/25-fix-rls-policy-error-when-deactivating-m/25-SUMMARY.md`
</output>
