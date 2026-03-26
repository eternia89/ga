# Quick Task: Auth Security Fix — Switch update-password from getSession() to getUser()

**Researched:** 2026-03-26
**Domain:** Supabase Auth — client-side session validation
**Confidence:** HIGH

## Summary

The file `app/(auth)/update-password/page.tsx` (line 23) is the **only place in the entire codebase** using `supabase.auth.getSession()`. Every other auth check -- middleware, server components, API routes, client hooks -- uses `supabase.auth.getUser()`. This is a well-documented persistent issue (flagged in improvements.md since 20-Mar).

The fix is a 3-line change: replace `getSession()` with `getUser()` and adjust the destructuring from `session` to `user`.

**Primary recommendation:** Replace `getSession()` with `getUser()` and check for `user` instead of `session`.

## Current Code (Lines 18-27)

```typescript
useEffect(() => {
  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    setHasSession(!!session)
  }
  checkSession()
}, [supabase.auth])
```

**Problem:** `getSession()` reads the JWT from local storage without contacting the Supabase auth server. A tampered or expired token would still appear "valid." `getUser()` makes a request to the auth server to validate the token, which is the security-correct approach.

## Fix Pattern

The established codebase pattern for client-side `getUser()` is visible in `lib/auth/hooks.tsx:36`:

```typescript
supabase.auth.getUser().then(({ data: { user } }) => {
  setUser(user);
});
```

For this page, the fix is:

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

## Key Considerations

### Return type difference
- `getSession()` returns `{ data: { session: Session | null }, error }` where `session` contains `user`, `access_token`, `refresh_token`
- `getUser()` returns `{ data: { user: User | null }, error }` with just the user object

The page only checks for truthiness (`!!session` / `!!user`) to determine if the reset link created a valid auth context, so the return type difference does not affect logic.

### Why this is safe
- The page does NOT use any session properties (no `session.access_token`, no `session.user` fields)
- It only checks existence: "does a valid auth context exist from the reset link?"
- `getUser()` provides the same boolean answer with stronger validation
- The subsequent `supabase.auth.updateUser()` call on line 48 already validates server-side independently

### No other getSession() usages
Confirmed via grep: `app/(auth)/update-password/page.tsx:23` is the **only** production code usage. All other hits are in planning docs, PRD, and improvements.md referencing this same issue.

### Blast radius
- **Zero.** This change is isolated to one file, one function call, one variable name. No exports, no shared state, no downstream consumers.

## Verification

After fix, verify:
1. Navigate to update-password page without a valid reset session -- should show "Invalid reset link" message
2. Use a valid password reset flow -- should show the password form
3. Submit new password -- should update and redirect to login
