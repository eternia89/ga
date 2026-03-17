---
phase: quick
plan: 260317-ccy
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/approval-actions.ts
  - app/actions/job-actions.ts
  - app/actions/request-actions.ts
autonomous: true
requirements: [QUICK-FIX-NOTIFICATION-ERROR-HANDLING]

must_haves:
  truths:
    - "All createNotifications() calls in approval-actions.ts have .catch() with console.error logging"
    - "All createNotifications() calls in job-actions.ts have .catch() with console.error logging"
    - "All createNotifications() calls in request-actions.ts have .catch() with console.error logging instead of silent .catch(() => {})"
    - "No createNotifications() call in any action file is fire-and-forget without error handling"
  artifacts:
    - path: "app/actions/approval-actions.ts"
      provides: "5 createNotifications calls with .catch error logging"
      contains: "console.error"
    - path: "app/actions/job-actions.ts"
      provides: "6 createNotifications calls with .catch error logging"
      contains: "console.error"
    - path: "app/actions/request-actions.ts"
      provides: "4 createNotifications calls with .catch error logging instead of silent swallow"
      contains: "console.error"
  key_links: []
---

<objective>
Fix fire-and-forget createNotifications() calls across all action files. Currently 5 calls in approval-actions.ts and 6 in job-actions.ts have NO error handling. 4 calls in request-actions.ts have `.catch(() => {})` which silently swallows errors. Add `.catch(err => console.error('[notifications]', err.message))` to all 15 call sites.

Purpose: If notification creation fails, there's currently zero visibility. This fix ensures failures are logged for debugging without blocking the main action flow.
Output: All 15 createNotifications() calls have error logging via .catch().
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/actions/approval-actions.ts
@app/actions/job-actions.ts
@app/actions/request-actions.ts

<interfaces>
Current call sites:

approval-actions.ts (5 calls, NO handler):
- Line 52: createNotifications({...});
- Line 123: createNotifications({...});
- Line 214: createNotifications({...});
- Line 229: createNotifications({...});
- Line 301: createNotifications({...});

job-actions.ts (6 calls, NO handler):
- Line 343: createNotifications({...});
- Line 404: createNotifications({...});
- Line 545: createNotifications({...});
- Line 585: createNotifications({...});
- Line 600: createNotifications({...});
- Line 657: createNotifications({...});

request-actions.ts (4 calls, silent swallow):
- Line 179-188: createNotifications({...}).catch(() => {});
- Line 229-238: createNotifications({...}).catch(() => {});
- Line 285-294: createNotifications({...}).catch(() => {});
- Line 349-358: createNotifications({...}).catch(() => {});
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add error logging to createNotifications calls in approval-actions.ts and job-actions.ts</name>
  <files>app/actions/approval-actions.ts, app/actions/job-actions.ts</files>
  <action>
For each `createNotifications({...});` call (closing `});`):
- Replace the closing `});` with `}).catch(err => console.error('[notifications]', err instanceof Error ? err.message : err));`

**approval-actions.ts** — 5 calls at lines ending ~61, ~137, ~220, ~235, ~307 (the `});` closing the createNotifications call)
**job-actions.ts** — 6 calls at lines ending ~356, ~417, ~558, ~598, ~613, ~670

Be careful to only modify the `createNotifications()` calls, not other `});` lines.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -c "console.error.*notifications" app/actions/approval-actions.ts app/actions/job-actions.ts</automated>
  </verify>
  <done>
    - 5 calls in approval-actions.ts have .catch with console.error
    - 6 calls in job-actions.ts have .catch with console.error
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace silent .catch(() => {}) with error logging in request-actions.ts</name>
  <files>app/actions/request-actions.ts</files>
  <action>
For each `}).catch(() => {});` in request-actions.ts:
- Replace `.catch(() => {})` with `.catch(err => console.error('[notifications]', err instanceof Error ? err.message : err))`

There are 4 instances at lines ~188, ~238, ~294, ~358.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && grep -c "console.error.*notifications" app/actions/request-actions.ts && grep -c "catch(() => {})" app/actions/request-actions.ts</automated>
  </verify>
  <done>
    - 4 calls in request-actions.ts have .catch with console.error
    - Zero instances of .catch(() => {}) remain
  </done>
</task>

</tasks>

<verification>
1. `grep -c "console.error.*notifications" app/actions/approval-actions.ts` returns 5
2. `grep -c "console.error.*notifications" app/actions/job-actions.ts` returns 6
3. `grep -c "console.error.*notifications" app/actions/request-actions.ts` returns 4
4. `grep -c "catch(() => {})" app/actions/request-actions.ts` returns 0
5. `npx tsc --noEmit` passes
</verification>

<success_criteria>
- All 15 createNotifications() calls have .catch() with console.error logging
- No silent .catch(() => {}) remains
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260317-ccy-fix-fire-and-forget-createnotifications-/260317-ccy-SUMMARY.md`
</output>
