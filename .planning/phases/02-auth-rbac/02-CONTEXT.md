# Phase 2: Auth & RBAC - Context

**Gathered:** 2026-02-10 (updated 2026-02-11)
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can log in (Google OAuth or email/password), sessions persist across browser reloads, unauthenticated users are redirected, and the application enforces role-based permissions at every layer. Covers: login page, auth middleware, session management, role definitions, permission map, RLS role policies, UI permission gates, password reset flow, app shell with sidebar navigation, and account lifecycle management.

</domain>

<decisions>
## Implementation Decisions

### Login experience
- Google-first login page: large Google OAuth button at top, email/password form below as secondary
- Clean minimal design: centered card on neutral background, app name/logo only, no company-specific branding
- Admin-created accounts only (REQ-AUTH-003): no self-registration
- New users receive an email invite link (Supabase magic link / password-reset flow) to set their password on first login
- Google OAuth users can log in immediately if their email matches an admin-created account
- Button loading state during authentication (spinner on the button, rest of page stays interactive)

### Password reset flow
- "Forgot password?" link on login page below the password field
- Takes user to an "enter your email" page
- Honest feedback: tell user if email wasn't found (not generic "if account exists" message)
- Reset link lands on a dedicated reset page (standalone, not inline on login page)
- New password + confirm password fields, then redirect to login with success toast
- Google OAuth users CAN set a password from their profile (dual login method supported)

### Session & multi-device
- Allow 2-3 concurrent sessions per user; new login kicks oldest session
- 30-day session duration, always-on (no "Remember me" checkbox)
- On session expiry: show toast "Session expired, please log in again" then redirect to login page with return URL (user returns to the page they were on after re-login)

### Post-login landing
- Same dashboard page for all roles — content varies by role permissions
- Phase 2 dashboard: minimal shell with welcome message and user info (content fills in as features ship in later phases)
- Return URL preserved: if user was trying to access a specific page before auth redirect, they land there after login (not forced to dashboard)

### App shell & sidebar navigation
- Sidebar always expanded (not collapsible to icon-only mode)
- Company name/logo at top of sidebar, user avatar + name at bottom
- Navigation grouped with section headers (e.g., "Operations", "Inventory", "Admin")
- Show all future nav items from the start, but gray out / disable unbuilt sections
- Clicking user info at bottom opens dropdown menu: Profile, Settings, Sign out

### Role assignment flow
- Bootstrap via seed script: first admin + company created by a setup command run during deployment
- Five roles: general_user, ga_staff, ga_lead, finance_approver, admin
- Multiple admins allowed per company (no artificial limit)
- Roles are changeable by admin at any time, takes effect immediately (JWT claims refreshed on next request)
- Division reassignment allowed, but existing records (e.g., requests) stay with the original division they were created under

### Account lifecycle
- Deactivation immediately terminates all active sessions (user logged out everywhere)
- Deactivated users see specific message: "Your account has been deactivated. Contact your administrator."
- Reactivation supported: admin flips toggle, user can log in again with same credentials and data
- No password reset required on reactivation
- Deactivated user's data stays intact: requests, jobs, assignments all remain visible, attributed as "[Name] (deactivated)"

### Permission denied experience
- Nav items hidden for roles without access (clean UX)
- Direct URL access to unauthorized pages shows a friendly "You don't have access to this page" message with a button to go to dashboard
- General Users have company-wide READ access (can view all requests, jobs, data across all divisions with full detail including costs)
- General Users can only CREATE/EDIT within their own division
- GA Staff, GA Lead, Finance Approver, Admin see all company data (REQ-RBAC-003)
- NOTE: This overrides original REQ-RBAC-002 ("division-scoped data visibility"). General Users get read-only company-wide visibility, write-scoped to own division.

### Auth error states
- Failed Google OAuth (user denies consent, Google down): return to login page with clear error message
- Unrecognized Google email (no admin-created account): "No account found for this email. Contact your administrator to get access."
- Failed login attempts: progressive rate limiting (slow down responses), never full lockout. Rely on Supabase built-in rate limiting as baseline.

### Claude's Discretion
- Login page exact layout, spacing, and typography
- Error message exact wording and display duration
- Password strength requirements
- Rate limiting thresholds and progressive delay curve
- Permission map data structure and enforcement pattern
- Sidebar section grouping specifics and icon choices
- Welcome page content and layout

</decisions>

<specifics>
## Specific Ideas

- Login should feel fast and frictionless — Google OAuth as the primary path means most users tap one button
- Email invite flow should be clear: user gets email, clicks link, sets password, lands on dashboard
- The "no permission" page should be friendly, not accusatory — "You don't have access" not "Access denied"
- Sidebar should preview the full app even before features are built — disabled items show what's coming
- Deactivation message should guide the user ("contact your administrator") rather than just blocking them

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-auth-rbac*
*Context gathered: 2026-02-10, updated 2026-02-11*
