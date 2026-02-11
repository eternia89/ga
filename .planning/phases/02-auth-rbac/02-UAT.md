---
status: complete
phase: 02-auth-rbac
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-02-11T05:00:00Z
updated: 2026-02-11T06:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Unauthenticated redirect to login
expected: Visit http://localhost:3000/ while not logged in. You should be redirected to /login with ?redirect=%2F in the URL.
result: pass

### 2. Login page layout
expected: The login page shows a centered card with "GA Operations" title. A large "Sign in with Google" button appears at the top (primary). Below it is an "or" divider, then email and password fields with a "Sign in" button. A "Forgot password?" link appears below the password field. There is NO "Sign up" or "Create account" link anywhere.
result: pass

### 3. Google OAuth login
expected: Click "Sign in with Google". You should be redirected to Google's consent screen. After selecting your account, you should land on the dashboard with a sidebar and welcome message.
result: pass

### 4. Email/password login
expected: Enter a valid email/password for a user in the database. Click "Sign in". You should land on the dashboard. The button shows a spinner while loading.
result: pass

### 5. Invalid credentials error
expected: Enter an incorrect email or password and click "Sign in". An error message "Invalid email or password" appears above the form.
result: pass

### 6. Session persistence
expected: After logging in, close the browser tab. Open a new tab and visit http://localhost:3000/. You should still be logged in and see the dashboard.
result: pass

### 7. Password reset flow
expected: On the login page, click "Forgot password?". You see a reset page with an email field. Enter your email and click "Send reset link". A success message appears.
result: pass

### 8. Deactivated user rejection
expected: If a user's profile has deleted_at set, attempting to log in shows "Your account has been deactivated. Contact your administrator."
result: pass

### 9. Unregistered Google email rejection
expected: If someone logs in via Google with an email that has no matching user_profiles row, they see "No account found for this email. Contact your administrator to get access."
result: pass

### 10. Dashboard welcome and user info
expected: After login, the dashboard shows a greeting with your name, role badge, company and division info, and placeholder text.
result: pass

### 11. Sidebar navigation structure
expected: Sidebar visible on left with company name at top. Navigation grouped into sections. Dashboard is active/clickable. Other items grayed out with "Coming soon".
result: pass

### 12. Sidebar role-based filtering
expected: As admin, all nav sections visible including Admin. As general_user, Admin section hidden entirely.
result: pass

### 13. User menu dropdown
expected: At sidebar bottom, avatar/initials, name, and role displayed. Clicking opens dropdown with Profile, Settings, Sign out. Closes on click outside.
result: pass

### 14. Sign out
expected: Click "Sign out" redirects to /login. Visiting / after signing out redirects back to /login.
result: pass

### 15. Unauthorized page
expected: Visit /unauthorized directly. Friendly "Access Denied" page with explanation and "Go to Dashboard" button.
result: pass

### 16. Admin seed script
expected: Run npx tsx scripts/seed-admin.ts with no arguments. Shows usage message with required arguments without crashing.
result: pass

## Summary

total: 16
passed: 16
issues: 0
pending: 0
skipped: 0

## Gaps

[none]

## Fixes Applied During UAT

The following bugs were found and fixed during testing:

1. **OAuth callback 500 error**: Route handler used cookies() from next/headers which failed to set session cookies. Fixed by switching to response-based cookie pattern.
2. **Double-encoded redirect URL**: `next` param was double-encoded (%252F). Fixed with decodeURIComponent.
3. **Root page showing default Next.js starter**: Deleted app/page.tsx so app/(dashboard)/page.tsx serves /.
4. **Password reset flash error**: Update password page showed "Invalid reset link" briefly before session loaded. Fixed with loading state.
5. **Password reset auto-login**: After setting new password, user stayed logged in. Fixed by calling signOut() before redirect to login.
6. **Deactivated user wrong error message**: RLS soft-delete filter hid deactivated profiles, showing "No account" instead of "Deactivated". Fixed with new RLS policy allowing users to see own profile regardless of deleted_at.
7. **Error messages in URL params**: Auth errors passed via URL query params (copy-paste problem). Switched to short-lived cookies for flash messages.
8. **Deactivated user email/password infinite spinner**: signInWithPassword succeeded but middleware loop caused stuck state. Fixed by checking profile deactivation in login page before navigating.
9. **Unregistered Google email wrong message**: Supabase returns signup_disabled error in URL hash fragment, not to callback route. Fixed login page to read hash fragment errors.
10. **Double-encoded redirect in middleware**: encodeURIComponent + searchParams.set double-encoded. Removed redundant encodeURIComponent.
11. **Seed script missing .env.local**: Standalone tsx scripts don't load .env.local automatically. Added dotenv with .env.local path.
12. **Password visibility toggle**: Added show/hide password eye icon to login form (user request).
