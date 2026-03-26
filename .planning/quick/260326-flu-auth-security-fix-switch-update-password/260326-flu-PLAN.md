---
phase: quick
plan: 260326-flu
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(auth)/update-password/page.tsx
autonomous: true
requirements: [SECURITY-AUTH-GETUSER]

must_haves:
  truths:
    - "update-password page validates user session against auth server, not just local JWT"
    - "No getSession() calls remain in production code"
    - "Password reset flow still works end-to-end (valid link shows form, invalid link shows error)"
  artifacts:
    - path: "app/(auth)/update-password/page.tsx"
      provides: "Server-validated auth check on password reset page"
      contains: "supabase.auth.getUser()"
  key_links:
    - from: "app/(auth)/update-password/page.tsx"
      to: "supabase.auth.getUser()"
      via: "useEffect on mount"
      pattern: "supabase\\.auth\\.getUser\\(\\)"
---

<objective>
Replace the single remaining `getSession()` call with `getUser()` in the update-password page for server-validated auth checking.

Purpose: `getSession()` reads the JWT from local storage without server validation -- a tampered or expired token appears valid. `getUser()` validates against the Supabase auth server, which is the pattern used everywhere else in the codebase.
Output: Updated `app/(auth)/update-password/page.tsx` with zero `getSession()` usage remaining.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260326-flu-auth-security-fix-switch-update-password/260326-flu-RESEARCH.md
@app/(auth)/update-password/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace getSession() with getUser() in update-password page</name>
  <files>app/(auth)/update-password/page.tsx</files>
  <action>
In `app/(auth)/update-password/page.tsx`, modify the `useEffect` block (lines 18-27) to use `getUser()` instead of `getSession()`:

1. Change destructuring from `data: { session }` to `data: { user }`
2. Change `supabase.auth.getSession()` to `supabase.auth.getUser()`
3. Change `setHasSession(!!session)` to `setHasSession(!!user)`

The resulting useEffect should be:
```typescript
useEffect(() => {
  const checkSession = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setHasSession(!!user)
  }
  checkSession()
}, [supabase.auth])
```

Do NOT rename `hasSession` state variable or `checkSession` function -- they are internal and descriptive enough. The fix is strictly the 3-line change inside the async function.

After making the change, verify no other `getSession` calls exist in the codebase:
```bash
grep -r "getSession" --include="*.ts" --include="*.tsx" app/ lib/ components/
```
This should return zero results.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx grep -r "getSession" --include="*.ts" --include="*.tsx" app/ lib/ components/ ; test $? -eq 1 && echo "PASS: No getSession calls found" || echo "FAIL: getSession still present"</automated>
    <automated>cd /Users/melfice/code/ga && grep -c "supabase.auth.getUser()" app/\(auth\)/update-password/page.tsx | grep -q "1" && echo "PASS: getUser() present" || echo "FAIL: getUser() not found"</automated>
    <automated>cd /Users/melfice/code/ga && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
    - `app/(auth)/update-password/page.tsx` uses `supabase.auth.getUser()` instead of `getSession()`
    - Zero `getSession()` calls remain in any production `.ts` or `.tsx` file
    - Build succeeds without errors
  </done>
</task>

</tasks>

<verification>
1. `grep -r "getSession" --include="*.ts" --include="*.tsx" app/ lib/ components/` returns no results
2. `grep "getUser" app/(auth)/update-password/page.tsx` shows the new call
3. `npm run build` completes successfully
</verification>

<success_criteria>
- The update-password page validates auth via server round-trip (getUser) not local JWT (getSession)
- No getSession() calls remain anywhere in production code
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260326-flu-auth-security-fix-switch-update-password/260326-flu-SUMMARY.md`
</output>
