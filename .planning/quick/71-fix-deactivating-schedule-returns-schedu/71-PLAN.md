---
phase: quick-71
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/schedule-actions.ts
autonomous: true
requirements:
  - QUICK-71

must_haves:
  truths:
    - "Admin with multi-company access can deactivate schedules belonging to any of their accessible companies"
    - "Admin with multi-company access can activate schedules belonging to any of their accessible companies"
    - "Admin with multi-company access can soft-delete schedules belonging to any of their accessible companies"
    - "Admin with multi-company access can update schedules belonging to any of their accessible companies"
    - "Users cannot deactivate/activate/update/delete schedules from companies they have no access to"
  artifacts:
    - path: "app/actions/schedule-actions.ts"
      provides: "Multi-company-aware schedule write actions"
      contains: "user_company_access"
  key_links:
    - from: "app/actions/schedule-actions.ts"
      to: "user_company_access table"
      via: "Supabase query in each write action"
      pattern: "user_company_access.*company_id"
---

<objective>
Fix "schedule not found" error when deactivating/activating/updating/deleting schedules that belong to a company other than the user's primary company.

Purpose: Schedule write actions (updateSchedule, deactivateSchedule, activateSchedule, deleteSchedule) filter with `.eq('company_id', profile.company_id)` which only matches the user's PRIMARY company. But schedules can belong to other companies the user has access to via `user_company_access`. The read actions (getSchedules, getSchedulesByAssetId) already correctly query `user_company_access` and use `.in('company_id', allAccessibleCompanyIds)`, so users can SEE these schedules but get "Schedule not found" when trying to modify them.

Output: Updated schedule-actions.ts with multi-company access checks on all four write actions.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/actions/schedule-actions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix multi-company access check in all schedule write actions</name>
  <files>app/actions/schedule-actions.ts</files>
  <action>
In `schedule-actions.ts`, four write actions use `.eq('company_id', profile.company_id)` to verify schedule ownership. This must be replaced with a multi-company access check matching the pattern already used in `getSchedules` and `getSchedulesByAssetId`.

For each of the four actions — `updateSchedule` (line 116-120), `deactivateSchedule` (line 173-177), `activateSchedule` (line 225-229), `deleteSchedule` (line 271-275) — apply this change:

1. Remove `.eq('company_id', profile.company_id)` from the initial schedule fetch query. Fetch the schedule by `id` only (plus `.is('deleted_at', null)` which is already there).

2. After fetching the schedule (after the `if (!existing)` null check), add a multi-company access verification block:

```typescript
// Verify user has access to this schedule's company
const hasAccess = existing.company_id === profile.company_id;
if (!hasAccess) {
  const { data: accessRow } = await adminSupabase
    .from('user_company_access')
    .select('id')
    .eq('user_id', profile.id)
    .eq('company_id', existing.company_id)
    .maybeSingle();
  if (!accessRow) {
    throw new Error('Schedule not found');
  }
}
```

This pattern:
- First checks if it's the user's primary company (fast path, no extra query).
- Only queries `user_company_access` if the schedule belongs to a different company.
- Uses `adminSupabase` (already available in `gaLeadActionClient` context) to bypass RLS on the access table.
- Returns the same "Schedule not found" error for unauthorized access (no information leakage about schedule existence).

Make sure `existing.company_id` is included in the `.select()` for all four actions (it already is for deactivateSchedule and activateSchedule; verify for updateSchedule and deleteSchedule).

Do NOT change `createSchedule` — it correctly determines company_id from the asset or form input.
Do NOT change `getSchedules` or `getSchedulesByAssetId` — they already use the correct multi-company pattern.
Do NOT change the helper functions (`pauseSchedulesForAsset`, `resumeSchedulesForAsset`, `deactivateSchedulesForAsset`) — they operate on asset-linked schedules using admin/service-role clients passed from the caller.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
All four schedule write actions (updateSchedule, deactivateSchedule, activateSchedule, deleteSchedule) fetch schedule by ID without company filter, then verify the user has access via primary company_id match OR user_company_access row. TypeScript compiles without errors.
  </done>
</task>

<task type="auto">
  <name>Task 2: Build verification</name>
  <files>app/actions/schedule-actions.ts</files>
  <action>
Run `npm run build` to confirm the full production build passes with the schedule-actions changes. This catches any issues that tsc --noEmit might miss (e.g., Next.js-specific build errors, import resolution).

If build fails, fix any issues in schedule-actions.ts.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Production build completes successfully with exit code 0.</done>
</task>

</tasks>

<verification>
1. TypeScript compilation passes: `npx tsc --noEmit`
2. Production build passes: `npm run build`
3. All four write actions (updateSchedule, deactivateSchedule, activateSchedule, deleteSchedule) no longer have `.eq('company_id', profile.company_id)` in schedule fetch
4. All four write actions verify company access via primary company OR user_company_access table
5. Read actions and helper functions remain unchanged
</verification>

<success_criteria>
- Schedule write actions use multi-company access check instead of single-company filter
- Admin with extra company access can deactivate/activate/update/delete schedules from those companies
- Users without access to a schedule's company still get "Schedule not found" (no security regression)
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/71-fix-deactivating-schedule-returns-schedu/71-SUMMARY.md`
</output>
