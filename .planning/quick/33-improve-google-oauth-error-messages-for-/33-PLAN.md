---
phase: quick-33
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/auth/callback/route.ts
autonomous: true
requirements: [QUICK-33]

must_haves:
  truths:
    - "Every failure path in the OAuth callback emits a structured console.error with stage, error code, error message, and user context"
    - "The profile fetch non-404 error path is handled — currently it silently succeeds when the DB query fails with any error other than PGRST116"
    - "User-facing error messages remain unchanged — all changes are server-side log output only"
  artifacts:
    - path: "app/api/auth/callback/route.ts"
      provides: "Structured error logging at every OAuth callback failure point"
      contains: "console.error"
  key_links:
    - from: "app/api/auth/callback/route.ts"
      to: "server console / Vercel logs"
      via: "console.error structured objects"
      pattern: "console\\.error"
---

<objective>
Add structured server-side logging to every failure path in the OAuth callback route so a developer reading server logs can immediately understand what stage failed and why.

Purpose: The current callback has no logging — when OAuth fails, there is zero signal in server logs. Errors like "failed to fetch" on the client give no indication of what failed server-side. This plan adds developer-facing structured log output without changing any user-facing messages.

Output: `app/api/auth/callback/route.ts` with `console.error` calls at every failure branch, each including the stage name, Supabase error code, message, and relevant context.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add structured logging to OAuth callback route</name>
  <files>app/api/auth/callback/route.ts</files>
  <action>
Rewrite `app/api/auth/callback/route.ts` to add structured `console.error` (and `console.warn`) calls at every failure branch. Do NOT change any user-facing behavior, cookie values, or redirect URLs — only add log output before existing return statements.

**Specific changes required:**

1. **No code parameter** (line 9-14): Add `console.warn` logging the URL and note that OAuth errors are sent as hash fragments (not logged server-side since they never reach the server).

2. **`exchangeCodeForSession` failure** (line 42-46): Add `console.error` with:
   - stage: 'exchange_code_for_session'
   - error.code, error.message, error.status (if available on the AuthError)
   - The raw code param (first 8 chars only — truncate to avoid leaking full auth codes)
   - Hint: "Check Supabase OAuth provider config, redirect URI whitelist, and that NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are correct"

3. **`getUser()` returns null** (line 53-57): Add `console.error` with:
   - stage: 'get_user_after_exchange'
   - message: 'exchangeCodeForSession succeeded but getUser() returned null — session cookies may not have been set correctly'
   - Hint: "Check cookie setAll handler — response object must be the same one cookies are set on"

4. **Profile fetch non-404 error** — this is a SILENT BUG in the current code: when `profileError` exists AND `profileError.code !== 'PGRST116'`, the code falls through to the `profile?.deleted_at` check (which evaluates as falsy since profile is null), then returns `response` as success. Add an explicit branch BEFORE the existing PGRST116 check:

   ```typescript
   if (profileError && profileError.code !== 'PGRST116') {
     console.error('[auth/callback] stage=fetch_user_profile error:', {
       code: profileError.code,
       message: profileError.message,
       hint: profileError.hint,
       userId: user.id,
       note: 'Non-404 DB error — check RLS policies on user_profiles table and network connectivity to Supabase',
     })
     const errorResponse = NextResponse.redirect(`${requestUrl.origin}/login`)
     errorResponse.cookies.set('auth_error', 'auth_callback_failed', { maxAge: 10, path: '/' })
     return errorResponse
   }
   ```

5. **Profile not found (PGRST116)** (line 67-72): Add `console.error` with:
   - stage: 'fetch_user_profile'
   - code: 'PGRST116'
   - userId: user.id
   - email: user.email
   - message: 'No user_profiles row found for this auth user — user must be created by an admin before OAuth login is allowed'

6. **Profile deactivated** (line 75-80): Add `console.warn` (not error — this is expected behavior, not a bug) with:
   - stage: 'profile_deactivation_check'
   - userId: user.id
   - email: user.email
   - deletedAt: profile.deleted_at
   - message: 'User attempted login but profile is deactivated'

7. **Success path** (line 82-83): Add `console.log` with:
   - stage: 'success'
   - userId: user.id
   - redirectTo: next
   This gives a baseline confirmation in logs that the flow completed.

**Log prefix convention:** All log calls use `[auth/callback]` prefix as the first part of the message string so they are easy to grep in Vercel/server logs.

**Important:** Do NOT log full auth codes, tokens, or passwords. Truncating the code param to 8 chars (as noted above) is sufficient for correlation.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
- `npm run build` passes with no TypeScript errors
- `app/api/auth/callback/route.ts` contains `console.error` calls at the exchangeCodeForSession failure, getUser null case, non-PGRST116 profile error, PGRST116 profile missing case
- The non-PGRST116 profile error case now has an explicit early return (silent bug fixed)
- No user-facing messages, cookie names, or redirect URLs changed
  </done>
</task>

</tasks>

<verification>
Build must pass: `npm run build`

Manually verify the log structure looks correct by reading the updated file and confirming:
- Every failure branch has a `console.error` or `console.warn` before its return
- The new non-PGRST116 branch exists between the getUser null check and the existing PGRST116 check
- No auth tokens or full codes are logged
</verification>

<success_criteria>
A developer triggering any OAuth failure path can open Vercel Function Logs (or local terminal) and immediately see:
- Which stage failed (`stage` field)
- What the Supabase error was (`code`, `message`)
- Who the user was (userId, email where available)
- A human-readable debugging hint

The silent bug where a non-PGRST116 profile fetch error silently succeeds is fixed.
</success_criteria>

<output>
After completion, create `.planning/quick/33-improve-google-oauth-error-messages-for-/33-SUMMARY.md`
</output>
