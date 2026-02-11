# Phase 2: Auth & RBAC - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can log in (Google OAuth or email/password), sessions persist across browser reloads, unauthenticated users are redirected, and the application enforces role-based permissions at every layer. Covers: login page, auth middleware, session management, role definitions, permission map, RLS role policies, and UI permission gates.

</domain>

<decisions>
## Implementation Decisions

### Login experience
- Google-first login page: large Google OAuth button at top, email/password form below as secondary
- Clean minimal design: centered card on neutral background, app name/logo only, no company-specific branding
- Admin-created accounts only (REQ-AUTH-003): no self-registration
- New users receive an email invite link (Supabase magic link / password-reset flow) to set their password on first login
- Google OAuth users can log in immediately if their email matches an admin-created account

### Session & multi-device
- Allow 2-3 concurrent sessions per user; new login kicks oldest session
- 30-day session duration, always-on (no "Remember me" checkbox)
- On session expiry: show toast "Session expired, please log in again" then redirect to login page with return URL (user returns to the page they were on after re-login)

### Role assignment flow
- Bootstrap via seed script: first admin + company created by a setup command run during deployment
- Five roles: general_user, ga_staff, ga_lead, finance_approver, admin
- Multiple admins allowed per company (no artificial limit)
- Roles are changeable by admin at any time, takes effect immediately (JWT claims refreshed on next request)
- Division reassignment allowed, but existing records (e.g., requests) stay with the original division they were created under

### Permission denied experience
- Nav items hidden for roles without access (clean UX)
- Direct URL access to unauthorized pages shows a friendly "You don't have access to this page" message with a button to go to dashboard
- General Users have company-wide READ access (can view all requests, jobs, data across all divisions with full detail including costs)
- General Users can only CREATE/EDIT within their own division
- GA Staff, GA Lead, Finance Approver, Admin see all company data (REQ-RBAC-003)
- NOTE: This overrides original REQ-RBAC-002 ("division-scoped data visibility"). General Users get read-only company-wide visibility, write-scoped to own division.

### Claude's Discretion
- Login page exact layout, spacing, and typography
- Error messages for failed login attempts (wording, display duration)
- Password strength requirements
- Rate limiting implementation details (REQ-AUTH-006)
- Permission map data structure and enforcement pattern

</decisions>

<specifics>
## Specific Ideas

- Login should feel fast and frictionless — Google OAuth as the primary path means most users tap one button
- Email invite flow should be clear: user gets email, clicks link, sets password, lands on dashboard
- The "no permission" page should be friendly, not accusatory — "You don't have access" not "Access denied"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-auth-rbac*
*Context gathered: 2026-02-10*
