---
phase: quick-75
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/schedule-actions.ts
autonomous: true
requirements:
  - QUICK-75

must_haves:
  truths:
    - "A multi-company user creating a schedule without an asset for a non-primary company they have access to succeeds"
    - "A user creating a schedule without an asset for a company they do NOT have access to is rejected"
    - "Asset-linked schedule creation is unaffected (company_id derived from asset, no change needed)"
    - "The error message for unauthorized company access is opaque (does not reveal company existence)"
  artifacts:
    - path: "app/actions/schedule-actions.ts"
      provides: "Company access validation in createSchedule non-asset branch"
      contains: "user_company_access"
  key_links:
    - from: "app/actions/schedule-actions.ts"
      to: "user_company_access table"
      via: "adminSupabase query with explicit user_id filter"
      pattern: "adminSupabase.*user_company_access.*user_id.*profile\\.id"
---

<objective>
Add company access validation to createSchedule's non-asset branch (lines 63-66 in schedule-actions.ts).

Purpose: Fix authorization bypass where a multi-company user could submit any company_id when creating a schedule without an asset. Without validation, a GA Lead could create schedules for companies they don't have access to.

Output: Updated createSchedule action that validates company access before inserting, matching the pattern from createAsset (asset-actions.ts lines 41-48).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/actions/schedule-actions.ts
@app/actions/asset-actions.ts (reference pattern at lines 41-48)
@lib/safe-action.ts (gaLeadActionClient provides adminSupabase = service role)
</context>

<interfaces>
<!-- Key context for executor -->

From lib/safe-action.ts:
- gaLeadActionClient provides ctx.adminSupabase (service role, bypasses RLS) and ctx.profile
- adminSupabase has NO user context — queries must include explicit user_id filter

From app/actions/asset-actions.ts (createAsset lines 41-48 — the pattern to match):
```typescript
// Validate extra company access if a different company was selected
if (parsedInput.company_id && parsedInput.company_id !== profile.company_id) {
  const { data: access } = await supabase
    .from('user_company_access')
    .select('id')
    .eq('user_id', profile.id)
    .eq('company_id', parsedInput.company_id)
    .single();
  if (!access) throw new Error('You do not have access to the selected company.');
}
```

IMPORTANT difference: createAsset uses `supabase` (user-scoped RLS client) while createSchedule uses `adminSupabase` (service role). The query on user_company_access with adminSupabase will return ALL rows regardless of RLS, so the `.eq('user_id', profile.id)` filter is essential for correctness.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add company access validation to createSchedule non-asset branch</name>
  <files>app/actions/schedule-actions.ts</files>
  <action>
In the createSchedule action, replace the non-asset else branch (lines 63-66):

```typescript
} else {
  // No asset: use company_id from form (multi-company user) or fall back to profile
  companyId = parsedInput.company_id ?? profile.company_id;
}
```

With:

```typescript
} else {
  // No asset: use company_id from form (multi-company user) or fall back to profile
  companyId = parsedInput.company_id ?? profile.company_id;

  // Validate company access when a different company was selected
  if (parsedInput.company_id && parsedInput.company_id !== profile.company_id) {
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
}
```

Key details:
- Use `adminSupabase` (not `supabase`) since gaLeadActionClient only provides adminSupabase. Must include explicit `.eq('user_id', profile.id)` since adminSupabase bypasses RLS.
- Use `.maybeSingle()` (consistent with the pattern in updateSchedule/deactivateSchedule/activateSchedule/deleteSchedule which already have this validation).
- Error message matches the existing createAsset pattern for consistency.
- Place the validation AFTER setting companyId so the flow is clear: derive value, then validate.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>createSchedule non-asset branch validates company access via user_company_access query before inserting; TypeScript compiles cleanly; error thrown for unauthorized company_id matches existing pattern.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npx tsc --noEmit`
2. Code review: the createSchedule non-asset branch now has company access validation matching the pattern from createAsset and the existing write actions (updateSchedule, deactivateSchedule, activateSchedule, deleteSchedule)
3. All 5 schedule write actions (create, update, deactivate, activate, delete) now consistently validate company access
</verification>

<success_criteria>
- createSchedule rejects non-asset schedule creation when parsedInput.company_id is set to a company the user does not have access to
- createSchedule allows non-asset schedule creation for the user's primary company (no company_id or same company_id)
- createSchedule allows non-asset schedule creation for a company the user has explicit access to via user_company_access
- Asset-linked schedule creation path is unchanged
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/75-add-company-access-validation-to-creates/75-SUMMARY.md`
</output>
