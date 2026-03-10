---
phase: quick-33
plan: 01
subsystem: auth
tags: [oauth, logging, debugging, silent-bug-fix]
dependency_graph:
  requires: []
  provides: [structured-oauth-error-logging]
  affects: [app/api/auth/callback/route.ts]
tech_stack:
  added: []
  patterns: [structured-console-logging, explicit-error-branching]
key_files:
  created: []
  modified:
    - app/api/auth/callback/route.ts
decisions:
  - "console.warn used for deactivation check (expected behavior, not a bug) vs console.error for unexpected failures"
  - "Auth code truncated to 8 chars in logs to avoid leaking full OAuth codes"
  - "Non-PGRST116 profile fetch error now has explicit early return — previously silently fell through to profile?.deleted_at check which evaluated falsy and returned a success response"
metrics:
  duration: "5 min"
  completed: "2026-03-10"
  tasks_completed: 1
  files_modified: 1
---

# Phase quick-33 Plan 01: Improve Google OAuth Error Messages Summary

**One-liner:** Structured `console.error`/`console.warn` logging at every OAuth callback failure path, plus silent bug fix for non-PGRST116 profile fetch errors.

## What Was Built

Added developer-facing structured log output to `app/api/auth/callback/route.ts` at every failure branch. No user-facing behavior, cookie values, or redirect URLs were changed.

**Log points added:**

| Stage | Log Level | When |
|-------|-----------|------|
| `no_code` | warn | OAuth error hash fragment received (no code param) |
| `exchange_code_for_session` | error | Supabase code exchange fails |
| `get_user_after_exchange` | error | Session set but `getUser()` returns null |
| `fetch_user_profile` (non-PGRST116) | error | Unexpected DB error querying user_profiles |
| `fetch_user_profile` (PGRST116) | error | No user_profiles row for auth user |
| `profile_deactivation_check` | warn | User profile has deleted_at set |
| `success` | log | OAuth flow completed successfully |

**Silent bug fixed:** When `profileError` existed with a code other than `PGRST116`, the old code fell through to `profile?.deleted_at` (which evaluated as falsy since profile was null), then returned a success response. Now an explicit early-return branch catches this case, logs it, and redirects to `/login` with `auth_callback_failed` cookie.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add structured logging to OAuth callback route | badb514 | app/api/auth/callback/route.ts |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npm run build` passed with zero TypeScript errors
- Every failure branch has a `console.error` or `console.warn` before its return statement
- Non-PGRST116 branch exists between getUser null check and PGRST116 check (lines 82-93)
- Auth code truncated to 8 chars (`.slice(0, 8)`) — no full tokens logged
- All cookie names (`auth_callback_failed`, `no_account`, `deactivated`), redirect URLs, and user-facing behavior unchanged

## Self-Check: PASSED

- [x] `app/api/auth/callback/route.ts` — exists and contains all 7 log points
- [x] Commit `badb514` — confirmed in git log
- [x] Build passed — no TypeScript errors
