---
phase: quick-260326-jot
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/approval-actions.ts
autonomous: true
requirements:
  - QUICK-260326-JOT

must_haves:
  truths:
    - "All 4 approval actions (approveJob, rejectJob, approveCompletion, rejectCompletion) call assertCompanyAccess before any status validation or mutation"
    - "A user from company B cannot approve/reject a job belonging to company A, even if RLS is misconfigured"
    - "The assertCompanyAccess call uses the correct parameters: supabase client, profile.id, job.company_id, profile.company_id"
  artifacts:
    - path: "app/actions/approval-actions.ts"
      provides: "Defense-in-depth company access checks on all 4 approval actions"
      contains: "assertCompanyAccess"
  key_links:
    - from: "app/actions/approval-actions.ts"
      to: "lib/auth/company-access.ts"
      via: "import and call assertCompanyAccess"
      pattern: "assertCompanyAccess\\(supabase, profile\\.id, job\\.company_id, profile\\.company_id\\)"
---

<objective>
Add `assertCompanyAccess` defense-in-depth checks to all 4 approval actions in `approval-actions.ts`.

Purpose: These actions currently rely solely on RLS for company scoping. Adding an explicit `assertCompanyAccess` call after the job fetch ensures a user cannot approve/reject jobs from another company even if RLS is misconfigured or bypassed.
Output: Updated `approval-actions.ts` with 4 new `assertCompanyAccess` calls and 1 new import.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/actions/approval-actions.ts
@.planning/quick/260326-jot-approval-actions-defense-in-depth-add-as/260326-jot-RESEARCH.md

<interfaces>
<!-- assertCompanyAccess signature from lib/auth/company-access.ts -->
```typescript
export async function assertCompanyAccess(
  supabase: SupabaseClient,
  userId: string,
  targetCompanyId: string,
  profileCompanyId: string
): Promise<void>
// Fast-path: targetCompanyId === profileCompanyId returns immediately
// Otherwise: queries user_company_access table
// Throws: 'You do not have access to the selected company.'
```

<!-- Established pattern from schedule-actions.ts -->
```typescript
// After entity fetch + null check, before any mutation:
await assertCompanyAccess(adminSupabase, profile.id, existing.company_id, profile.company_id);
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add assertCompanyAccess to all 4 approval actions</name>
  <files>app/actions/approval-actions.ts</files>
  <action>
1. Add import at top of file (after existing imports, around line 8):
   ```typescript
   import { assertCompanyAccess } from '@/lib/auth/company-access';
   ```

2. In `approveJob` action: Insert after the `if (!job) { throw new Error('Job not found'); }` block (after line 28), BEFORE the `created_by` check:
   ```typescript
   // Defense-in-depth: verify company access beyond RLS
   await assertCompanyAccess(supabase, profile.id, job.company_id, profile.company_id);
   ```

3. In `rejectJob` action: Insert after the `if (!job) { throw new Error('Job not found'); }` block (after line 95), BEFORE the `created_by` check:
   ```typescript
   // Defense-in-depth: verify company access beyond RLS
   await assertCompanyAccess(supabase, profile.id, job.company_id, profile.company_id);
   ```

4. In `approveCompletion` action: Insert after the `if (!job) { throw new Error('Job not found'); }` block (after line 162), BEFORE the `created_by` check:
   ```typescript
   // Defense-in-depth: verify company access beyond RLS
   await assertCompanyAccess(supabase, profile.id, job.company_id, profile.company_id);
   ```

5. In `rejectCompletion` action: Insert after the `if (!job) { throw new Error('Job not found'); }` block (after line 277), BEFORE the `created_by` check:
   ```typescript
   // Defense-in-depth: verify company access beyond RLS
   await assertCompanyAccess(supabase, profile.id, job.company_id, profile.company_id);
   ```

Use `supabase` (the RLS-bound client from ctx) as the first argument -- these actions use `authActionClient`, not `gaLeadActionClient`. The `assertCompanyAccess` helper only does a SELECT on `user_company_access`, so the RLS client is sufficient.

Do NOT change any other logic, query structure, or client usage.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -c "assertCompanyAccess" app/actions/approval-actions.ts | grep -q "4" && grep -q "import { assertCompanyAccess } from '@/lib/auth/company-access'" app/actions/approval-actions.ts && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
- `assertCompanyAccess` is imported from `@/lib/auth/company-access`
- All 4 actions (approveJob, rejectJob, approveCompletion, rejectCompletion) call `assertCompanyAccess(supabase, profile.id, job.company_id, profile.company_id)` after the null check and before status validation
- `npm run build` succeeds with no type errors
- No other logic changed
  </done>
</task>

</tasks>

<verification>
1. `grep -c "assertCompanyAccess" app/actions/approval-actions.ts` outputs `4` (one call per action, not counting the import)
2. `grep "import.*assertCompanyAccess" app/actions/approval-actions.ts` shows the import line
3. `npm run build` completes without errors
4. Visual inspection: each `assertCompanyAccess` call appears between the `if (!job)` null check and the `created_by` ownership check
</verification>

<success_criteria>
All 4 approval actions have defense-in-depth company access verification. Build passes. No behavioral changes to the happy path (same-company users proceed as before). Cross-company access attempts are blocked with a clear error before any mutation occurs.
</success_criteria>

<output>
After completion, create `.planning/quick/260326-jot-approval-actions-defense-in-depth-add-as/260326-jot-SUMMARY.md`
</output>
