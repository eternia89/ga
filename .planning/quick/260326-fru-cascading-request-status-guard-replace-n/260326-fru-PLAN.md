---
phase: quick-260326-fru
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/approval-actions.ts
  - app/actions/job-actions.ts
autonomous: true

must_haves:
  truths:
    - "Cascading request updates from job completion only transition requests in 'triaged' or 'in_progress' status"
    - "Requests in terminal states (accepted, closed, rejected, cancelled) are never resurrected to pending_acceptance"
    - "Requests in pending_acceptance are not re-updated (preserving original completed_at)"
    - "Requests in submitted status are not prematurely advanced"
  artifacts:
    - path: "app/actions/approval-actions.ts"
      provides: "Correct allowlist guard in approveCompletion cascading update"
      contains: ".in('status', ['triaged', 'in_progress'])"
    - path: "app/actions/job-actions.ts"
      provides: "Correct allowlist guard in updateJobStatus cascading update"
      contains: ".in('status', ['triaged', 'in_progress'])"
  key_links:
    - from: "app/actions/approval-actions.ts"
      to: "requests table"
      via: "supabase .update().in('id', requestIds).in('status', [...])"
      pattern: "\\.in\\('status',\\s*\\['triaged',\\s*'in_progress'\\]\\)"
    - from: "app/actions/job-actions.ts"
      to: "requests table"
      via: "supabase .update().in('id', requestIds).in('status', [...])"
      pattern: "\\.in\\('status',\\s*\\['triaged',\\s*'in_progress'\\]\\)"
---

<objective>
Fix cascading request status guard in job completion paths to prevent invalid state resurrection.

Purpose: When a job completes, linked requests transition to `pending_acceptance`. The current `.neq('status', 'cancelled')` filter is a denylist that only excludes cancelled requests, allowing 5 other invalid transitions (submitted, pending_acceptance, accepted, closed, rejected). Replace with an allowlist `.in('status', ['triaged', 'in_progress'])` to match the authoritative guard in `completeRequest` (request-actions.ts:335).

Output: Two corrected cascading update queries using allowlist pattern consistent with existing codebase conventions.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260326-fru-cascading-request-status-guard-replace-n/260326-fru-RESEARCH.md
@app/actions/approval-actions.ts
@app/actions/job-actions.ts
@app/actions/request-actions.ts

<interfaces>
<!-- Authoritative guard pattern from request-actions.ts:335 -->
```typescript
// completeRequest enforces this:
if (!['triaged', 'in_progress'].includes(request.status)) {
  throw new Error('Request can only be completed when in Triaged or In Progress status');
}
```

<!-- Existing correct allowlist patterns in job-actions.ts -->
```typescript
// Line 175 - job creation cascading update:
.in('status', ['triaged'])

// Line 303 - job update / link new requests:
.in('status', ['triaged'])

// Line 695 - job cancellation cascading revert:
.in('status', ['in_progress', 'pending_acceptance'])
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace denylist with allowlist in both cascading update locations</name>
  <files>app/actions/approval-actions.ts, app/actions/job-actions.ts</files>
  <action>
In `app/actions/approval-actions.ts` line 204:
Replace `.neq('status', 'cancelled')` with `.in('status', ['triaged', 'in_progress'])`.

In `app/actions/job-actions.ts` line 589:
Replace `.neq('status', 'cancelled')` with `.in('status', ['triaged', 'in_progress'])`.

Both changes are single-line replacements. The surrounding code (the `.update()` payload setting `status: 'pending_acceptance'`, `completed_at: now`, `updated_at: now` and the `.in('id', requestIds)` filter) remains unchanged.

This aligns both cascading paths with:
1. The authoritative guard in `completeRequest` (request-actions.ts:335)
2. The existing allowlist convention used elsewhere in job-actions.ts (lines 175, 303, 695)

Per Bug Fix Protocol: Research confirmed only 2 instances of this bug exist. All other `.neq()` calls in action files are for different purposes (duplicate name checks, ID exclusions) and are correct.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -n "\.neq('status', 'cancelled')" app/actions/approval-actions.ts app/actions/job-actions.ts; echo "---"; grep -n "\.in('status', \['triaged', 'in_progress'\])" app/actions/approval-actions.ts app/actions/job-actions.ts; echo "---"; npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
- Zero matches for `.neq('status', 'cancelled')` in both files
- Both files contain `.in('status', ['triaged', 'in_progress'])` at the cascading update locations
- Build succeeds with no type errors
  </done>
</task>

</tasks>

<verification>
1. `grep -rn "\.neq('status'" app/actions/` returns zero results for cascading request updates (only legitimate `.neq()` calls remain)
2. `grep -rn "\.in('status'" app/actions/job-actions.ts app/actions/approval-actions.ts` shows allowlist pattern at both locations
3. `npm run build` succeeds
</verification>

<success_criteria>
- Both cascading request status updates use `.in('status', ['triaged', 'in_progress'])` allowlist
- No `.neq('status', 'cancelled')` denylist pattern remains in cascading update paths
- Build passes cleanly
- Codebase is consistent: all 5 cascading request status updates in job/approval actions now use allowlist `.in('status', [...])` pattern
</success_criteria>

<output>
After completion, create `.planning/quick/260326-fru-cascading-request-status-guard-replace-n/260326-fru-SUMMARY.md`
</output>
