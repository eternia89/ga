# Phase 2: Auth & RBAC - Research

**Researched:** 2026-02-11
**Domain:** Supabase Auth with Next.js 16 App Router, RBAC patterns, multi-session management
**Confidence:** HIGH

## Summary

Phase 2 implements authentication and role-based access control using Supabase Auth with Next.js 16 App Router SSR patterns. The standard stack centers on `@supabase/ssr` for server-side authentication with cookie-based session management, integrated with Next.js middleware for route protection. RBAC is enforced through three layers: RLS policies using JWT custom claims (already scaffolded in Phase 1), application-level permission maps, and UI-level conditional rendering.

The user has made specific implementation decisions (detailed in User Constraints below) that lock in Google-first OAuth, admin-created accounts only, 30-day sessions with concurrent session limits, and a specific UX flow for password reset and account lifecycle. These decisions eliminate architectural ambiguity and create a clear implementation path.

**Primary recommendation:** Use `@supabase/ssr` with `createServerClient` in middleware and server components, `createBrowserClient` for client components. Implement custom JWT claims via Supabase Auth Hooks (Pro plan feature) to inject role/company/division into the JWT, which RLS policies already consume via the Phase 1 helper functions (`current_user_role()`, `current_user_company_id()`, `current_user_division_id()`). Build the permission map as a typed TypeScript object mapping roles to action arrays, exposed through helper functions. Enforce permissions at the data access layer (not just middleware) and use progressive rate limiting via response delays rather than hard lockouts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Login experience
- Google-first login page: large Google OAuth button at top, email/password form below as secondary
- Clean minimal design: centered card on neutral background, app name/logo only, no company-specific branding
- Admin-created accounts only (REQ-AUTH-003): no self-registration
- New users receive an email invite link (Supabase magic link / password-reset flow) to set their password on first login
- Google OAuth users can log in immediately if their email matches an admin-created account
- Button loading state during authentication (spinner on the button, rest of page stays interactive)

#### Password reset flow
- "Forgot password?" link on login page below the password field
- Takes user to an "enter your email" page
- Honest feedback: tell user if email wasn't found (not generic "if account exists" message)
- Reset link lands on a dedicated reset page (standalone, not inline on login page)
- New password + confirm password fields, then redirect to login with success toast
- Google OAuth users CAN set a password from their profile (dual login method supported)

#### Session & multi-device
- Allow 2-3 concurrent sessions per user; new login kicks oldest session
- 30-day session duration, always-on (no "Remember me" checkbox)
- On session expiry: show toast "Session expired, please log in again" then redirect to login page with return URL (user returns to the page they were on after re-login)

#### Post-login landing
- Same dashboard page for all roles — content varies by role permissions
- Phase 2 dashboard: minimal shell with welcome message and user info (content fills in as features ship in later phases)
- Return URL preserved: if user was trying to access a specific page before auth redirect, they land there after login (not forced to dashboard)

#### App shell & sidebar navigation
- Sidebar always expanded (not collapsible to icon-only mode)
- Company name/logo at top of sidebar, user avatar + name at bottom
- Navigation grouped with section headers (e.g., "Operations", "Inventory", "Admin")
- Show all future nav items from the start, but gray out / disable unbuilt sections
- Clicking user info at bottom opens dropdown menu: Profile, Settings, Sign out

#### Role assignment flow
- Bootstrap via seed script: first admin + company created by a setup command run during deployment
- Five roles: general_user, ga_staff, ga_lead, finance_approver, admin
- Multiple admins allowed per company (no artificial limit)
- Roles are changeable by admin at any time, takes effect immediately (JWT claims refreshed on next request)
- Division reassignment allowed, but existing records (e.g., requests) stay with the original division they were created under

#### Account lifecycle
- Deactivation immediately terminates all active sessions (user logged out everywhere)
- Deactivated users see specific message: "Your account has been deactivated. Contact your administrator."
- Reactivation supported: admin flips toggle, user can log in again with same credentials and data
- No password reset required on reactivation
- Deactivated user's data stays intact: requests, jobs, assignments all remain visible, attributed as "[Name] (deactivated)"

#### Permission denied experience
- Nav items hidden for roles without access (clean UX)
- Direct URL access to unauthorized pages shows a friendly "You don't have access to this page" message with a button to go to dashboard
- General Users have company-wide READ access (can view all requests, jobs, data across all divisions with full detail including costs)
- General Users can only CREATE/EDIT within their own division
- GA Staff, GA Lead, Finance Approver, Admin see all company data (REQ-RBAC-003)
- NOTE: This overrides original REQ-RBAC-002 ("division-scoped data visibility"). General Users get read-only company-wide visibility, write-scoped to own division.

#### Auth error states
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | Latest | Server-side Supabase client for Next.js App Router | Official Supabase package for SSR frameworks, handles cookie-based session management with framework-agnostic API |
| `@supabase/supabase-js` | v2.58.0+ | Isomorphic Supabase client for auth and data operations | Official Supabase JavaScript client, used by @supabase/ssr internally |
| Next.js | 16.1.6 | Application framework | Already in project, App Router is the canonical Next.js model for 2026 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | Latest | Schema validation for password strength, form inputs | Password reset forms, login validation, permission checks |
| `react-hook-form` | Latest | Form state management | Login, password reset, user profile forms |
| Toast library (TBD) | - | User feedback for auth events | Session expiry, login success/failure, permission denied |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Auth | NextAuth.js / Auth.js v5 | NextAuth gives more control over session storage but requires manual integration with Supabase RLS, duplicates auth logic. Supabase Auth is purpose-built for Supabase RLS and already configured. |
| JWT custom claims via Auth Hooks | Separate user metadata table | Custom claims put role/company/division directly in JWT (no extra query), but require Supabase Pro plan. Metadata table works on free tier but adds latency to every RLS check. User is on Pro plan (Phase 1 evidence: custom domain, production use). |
| Progressive rate limiting | Hard lockout after N attempts | Progressive delay (slowdown) prevents credential stuffing while avoiding legitimate user lockout. User explicitly requested "never full lockout". |

**Installation:**
```bash
npm install @supabase/ssr @supabase/supabase-js zod react-hook-form
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (auth)/                    # Auth route group (no layout sidebar)
│   ├── login/                 # Login page
│   ├── reset-password/        # Password reset request page
│   └── update-password/       # Password reset confirmation page
├── (dashboard)/               # Protected route group (with sidebar layout)
│   ├── layout.tsx             # App shell: sidebar, nav, user menu
│   ├── page.tsx               # Dashboard home (welcome message, user info)
│   └── ...                    # Future feature pages (Phase 3+)
├── api/
│   └── auth/
│       ├── callback/route.ts  # OAuth callback handler
│       └── signout/route.ts   # Server-side signout
├── middleware.ts              # Auth check + session refresh
lib/
├── supabase/
│   ├── server.ts              # createServerClient wrapper
│   ├── client.ts              # createBrowserClient wrapper
│   └── middleware.ts          # Middleware-specific client
├── auth/
│   ├── permissions.ts         # Permission map + helper functions
│   └── session.ts             # Session management utilities
└── utils/
    └── rate-limit.ts          # Progressive rate limiting
```

### Pattern 1: Supabase Client Initialization (Server)
**What:** Create server-side Supabase client with proper cookie handling for Next.js App Router
**When to use:** Middleware, Server Components, Route Handlers, Server Actions
**Example:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```
**Source:** Context7 `/supabase/ssr` - Server Components initialization pattern

### Pattern 2: Supabase Client Initialization (Middleware)
**What:** Middleware-specific client that can modify response cookies
**When to use:** middleware.ts for auth checks and session refresh
**Example:**
```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired
  await supabase.auth.getUser()

  return response
}
```
**Source:** Context7 `/supabase/ssr` - Middleware pattern

### Pattern 3: Supabase Client Initialization (Browser)
**What:** Client-side Supabase client for interactive auth flows
**When to use:** Client Components, login forms, password reset forms
**Example:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```
**Source:** Context7 `/supabase/ssr` - Browser client initialization

### Pattern 4: Auth Middleware with Return URL Preservation
**What:** Protect routes, refresh sessions, preserve intended destination
**When to use:** Every request via middleware.ts
**Example:**
```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Check if user is authenticated
  const supabase = createServerClient(/* ... */)
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isProtectedRoute = !isAuthRoute && !request.nextUrl.pathname.startsWith('/api')

  // Redirect to login if not authenticated
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if already authenticated and visiting auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```
**Source:** Synthesized from Context7 `/supabase/ssr` middleware pattern + Next.js App Router auth guides

### Pattern 5: Permission Map with Type Safety
**What:** Centralized role-to-permissions mapping with TypeScript
**When to use:** Authorization checks throughout the app
**Example:**
```typescript
// lib/auth/permissions.ts
export const PERMISSIONS = {
  // User management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DEACTIVATE: 'user:deactivate',

  // Request management
  REQUEST_VIEW_ALL: 'request:view:all',        // Cross-division read
  REQUEST_VIEW_OWN: 'request:view:own',        // Own division only
  REQUEST_CREATE: 'request:create',
  REQUEST_TRIAGE: 'request:triage',

  // ... more permissions
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  general_user: [
    PERMISSIONS.REQUEST_VIEW_ALL,      // User decision: company-wide read
    PERMISSIONS.REQUEST_CREATE,        // Write-scoped to own division
    PERMISSIONS.REQUEST_VIEW_OWN,
  ],
  ga_staff: [
    PERMISSIONS.REQUEST_VIEW_ALL,
    PERMISSIONS.REQUEST_CREATE,
    PERMISSIONS.REQUEST_TRIAGE,
    // ... all operational permissions
  ],
  ga_lead: [
    // All ga_staff permissions + assignment, approval
  ],
  finance_approver: [
    // Read-all + budget approval permissions
  ],
  admin: Object.values(PERMISSIONS), // All permissions
}

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function canAccessRoute(role: string, pathname: string): boolean {
  // Map routes to required permissions
  const routePermissions: Record<string, Permission> = {
    '/admin/users': PERMISSIONS.USER_VIEW,
    '/requests/new': PERMISSIONS.REQUEST_CREATE,
    // ...
  }

  const required = routePermissions[pathname]
  return !required || hasPermission(role, required)
}
```
**Source:** Synthesized from Auth.js RBAC guide, Clerk RBAC patterns, medium.com RBAC articles

### Pattern 6: RLS Policies with JWT Custom Claims
**What:** Postgres RLS policies consuming JWT claims for role-based data access
**When to use:** Database-level authorization (already scaffolded in Phase 1)
**Example:**
```sql
-- General User: company-wide read, own-division write
CREATE POLICY "general_user_select_requests"
ON requests FOR SELECT
USING (
  company_id = public.current_user_company_id()
  AND deleted_at IS NULL
  AND public.current_user_role() = 'general_user'
);

CREATE POLICY "general_user_insert_requests"
ON requests FOR INSERT
WITH CHECK (
  company_id = public.current_user_company_id()
  AND division_id = public.current_user_division_id()
  AND public.current_user_role() = 'general_user'
);

-- Elevated roles: full company access
CREATE POLICY "elevated_roles_all_access"
ON requests FOR ALL
USING (
  company_id = public.current_user_company_id()
  AND deleted_at IS NULL
  AND public.current_user_role() IN ('ga_staff', 'ga_lead', 'finance_approver', 'admin')
);
```
**Source:** Context7 `/websites/supabase` - Custom Claims & RBAC guide, Phase 1 RLS helpers

### Pattern 7: Custom JWT Claims via Auth Hooks
**What:** Inject role, company_id, division_id into JWT at token issuance
**When to use:** Supabase Pro plan (required for Auth Hooks)
**Example:**
```typescript
// Supabase Edge Function: auth-hook-custom-claims
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { user_id } = await req.json()

  // Fetch user profile from user_profiles table
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('role, company_id, division_id')
    .eq('user_id', user_id)
    .single()

  return new Response(
    JSON.stringify({
      app_metadata: {
        role: profile.role,
        company_id: profile.company_id,
        division_id: profile.division_id,
      },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```
**Source:** Context7 `/websites/supabase` - Custom Claims guide

### Pattern 8: Progressive Rate Limiting
**What:** Slow down responses after threshold, never hard lockout
**When to use:** Login endpoints, password reset endpoints
**Example:**
```typescript
// lib/utils/rate-limit.ts
const attempts = new Map<string, { count: number; resetAt: number }>()

export function getRateLimitDelay(identifier: string): number {
  const now = Date.now()
  const record = attempts.get(identifier)

  if (!record || now > record.resetAt) {
    attempts.set(identifier, { count: 1, resetAt: now + 60_000 }) // 1 min window
    return 0
  }

  record.count++

  // Progressive delay: 0ms (1-3 attempts), 500ms (4-6), 1000ms (7-10), 2000ms (11+)
  if (record.count <= 3) return 0
  if (record.count <= 6) return 500
  if (record.count <= 10) return 1000
  return 2000
}

export async function applyRateLimit(identifier: string): Promise<void> {
  const delay = getRateLimitDelay(identifier)
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}
```
**Source:** Web search (medium.com, peerlist.io) - Next.js rate limiting patterns

### Pattern 9: Multi-Session Management
**What:** Limit concurrent sessions, terminate oldest on new login
**When to use:** Session creation, refresh
**Implementation Note:**
Supabase offers single-session-per-user enforcement (Pro plan) but NOT 2-3 session limits. This requires custom implementation:

```typescript
// Track sessions in user_profiles table
ALTER TABLE user_profiles ADD COLUMN active_session_ids text[] DEFAULT '{}';

// On login, track new session
async function onLoginSuccess(userId: string, newSessionId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('active_session_ids')
    .eq('user_id', userId)
    .single()

  const sessions = profile?.active_session_ids || []
  sessions.push(newSessionId)

  // Keep only 3 most recent
  const updated = sessions.slice(-3)

  await supabase
    .from('user_profiles')
    .update({ active_session_ids: updated })
    .eq('user_id', userId)

  // If sessions were dropped, those tokens become invalid on next refresh
}
```
**Limitation:** Supabase doesn't provide a "revoke specific session by ID" API. Session limits are best-effort: old sessions become invalid when token refresh fails (they're not in active list). For immediate termination, need to track session tokens and validate against list on every request (performance impact).

**Source:** Web search (GitHub supabase/discussions) - Multi-session management

### Pattern 10: UI Permission Gates
**What:** Conditionally render UI elements based on role permissions
**When to use:** Navigation, action buttons, form fields
**Example:**
```typescript
// components/PermissionGate.tsx
import { hasPermission } from '@/lib/auth/permissions'
import { useUser } from '@/lib/hooks/useUser'

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { user, profile } = useUser()

  if (!user || !hasPermission(profile.role, permission)) {
    return fallback
  }

  return <>{children}</>
}

// Usage
<PermissionGate permission={PERMISSIONS.USER_CREATE}>
  <Button>Create User</Button>
</PermissionGate>
```
**Source:** Synthesized from Clerk, Auth.js RBAC documentation

### Anti-Patterns to Avoid
- **Don't rely on middleware alone for auth:** Middleware is for routing and first-line defense. Always verify auth at the data access layer (Server Components, Route Handlers, Server Actions) because middleware can be bypassed in some edge cases.
- **Don't put sensitive logic in Client Components:** Use Server Actions for mutations, verify permissions server-side.
- **Don't use `user_metadata` for RBAC in RLS policies:** Users can modify their own `user_metadata`. Use `app_metadata` (requires service_role key or Auth Hooks to set).
- **Don't forget to index RLS policy columns:** Missing indexes on `company_id`, `division_id` in WHERE clauses destroy RLS performance. Phase 1 already created these indexes.
- **Don't skip session refresh in middleware:** `supabase.auth.getUser()` both verifies the user AND refreshes expired tokens. Skipping this causes session expiry issues.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session management | Custom JWT signing, refresh tokens, cookie handling | Supabase Auth + @supabase/ssr | Session refresh, cookie chunking (3KB+ cookies), PKCE flows, token rotation—too many edge cases. Supabase handles all of this. |
| OAuth flows | Custom OAuth state management, PKCE, token exchange | Supabase Auth `signInWithOAuth` | OAuth 2.0 has 20+ security considerations (state validation, token verification, redirect validation). Supabase's battle-tested implementation. |
| Password hashing | bcrypt, argon2 implementation | Supabase Auth | Supabase uses bcrypt with proper salt rounds, handles upgrades transparently. |
| Rate limiting storage | In-memory Maps, Redis setup | Supabase built-in rate limiting + progressive delay | Supabase already rate-limits auth endpoints (60 req/min per IP). Add progressive delay for UX, not full rate limiting infrastructure. |
| Session storage | Database session tables, Redis | Supabase Auth cookies | Cookies are stateless (no DB lookup), work with edge/serverless, handled by @supabase/ssr. |

**Key insight:** Authentication is the domain where hand-rolled solutions fail most spectacularly. Token refresh race conditions, session fixation, CSRF, timing attacks, cookie security—Supabase Auth solves these. Spend time on UX and permission logic, not reinventing auth primitives.

## Common Pitfalls

### Pitfall 1: Session State "Behind" After Redirects
**What goes wrong:** User logs in via OAuth, gets redirected to dashboard, but UI still shows "Login" button instead of user avatar.
**Why it happens:** OAuth callback creates session server-side, but client-side components haven't fetched the new session yet. Race condition between redirect and session fetch.
**How to avoid:**
1. After OAuth callback, trigger a session refresh before redirect: `await supabase.auth.getSession()` in the callback route handler
2. Use Supabase's `onAuthStateChange` listener in root layout to sync client state
3. Server Components automatically see fresh session (they call `getUser()` on every render)
**Warning signs:** Login button visible after successful login, inconsistent auth state between page refresh

**Source:** GitHub supabase/discussions #19484 - Session state behind after redirect

### Pitfall 2: redirectTo URLs Not Respected
**What goes wrong:** Password reset `redirectTo` parameter ignored, user lands on default Supabase page instead of your reset page.
**Why it happens:** Supabase requires `redirectTo` URLs to be whitelisted in Dashboard → Authentication → URL Configuration. HTTPS/HTTP mismatch or subdomain differences cause silent failure.
**How to avoid:**
1. Add ALL redirect URLs to Supabase Dashboard whitelist (e.g., `http://localhost:3000/update-password`, `https://yourapp.com/update-password`)
2. Use exact matches—no wildcards
3. Check Supabase logs (Dashboard → Logs) for "redirect URL not allowed" errors
4. For password reset email templates, use `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}` pattern
**Warning signs:** Users complain password reset links go to wrong page, `redirectTo` param in code but not working

**Source:** GitHub supabase/supabase #832, supabase/discussions #21972 - redirectTo not respected

### Pitfall 3: RLS Policies Not Hitting Indexes
**What goes wrong:** RLS policies work but queries are slow (500ms+ for simple selects).
**Why it happens:** RLS adds WHERE clauses to every query. If `company_id`, `division_id`, or `deleted_at` columns aren't indexed, Postgres does sequential scans.
**How to avoid:**
Phase 1 already created composite indexes with `company_id` as leading column. Verify with:
```sql
EXPLAIN ANALYZE SELECT * FROM requests WHERE company_id = '...' AND deleted_at IS NULL;
```
Should show "Index Scan" not "Seq Scan". If RLS policies get more complex (e.g., role-based + division-based), add indexes matching the policy logic.
**Warning signs:** Slow queries in production, EXPLAIN shows Seq Scan, high CPU on Supabase dashboard

**Source:** Context7 `/websites/supabase` - RLS best practices

### Pitfall 4: Using user_metadata for RBAC in RLS
**What goes wrong:** User changes their own role by calling `supabase.auth.updateUser({ data: { role: 'admin' } })` and gains unauthorized access.
**Why it happens:** `user_metadata` is user-writable. RLS policies reading from `auth.jwt() -> 'user_metadata'` are vulnerable.
**How to avoid:**
- Use `app_metadata` for RBAC claims (only settable by service_role or Auth Hooks)
- Phase 1 RLS helpers already read from `app_metadata` (safe)
- Never expose service_role key to browser
**Warning signs:** Security audit finds `user_metadata` in RLS policies, role escalation possible

**Source:** Context7 `/websites/supabase` - Token Security guide

### Pitfall 5: Forgetting to Disable Self-Registration
**What goes wrong:** Anyone can create an account via Supabase's signup endpoint, bypassing admin-only user creation.
**Why it happens:** Supabase Auth defaults to public signups enabled.
**How to avoid:**
1. Supabase Dashboard → Authentication → Settings → "Enable User Sign-Ups" → **Toggle OFF**
2. Admin creates users via `supabase.auth.admin.createUser()` (requires service_role key, called from secure backend)
3. Use `inviteUserByEmail()` to send magic link for first-time password setup
**Warning signs:** Unexpected users in auth.users table, no corresponding user_profiles entry

**Source:** Web search (kulik.io, supabase docs) - Disable self-registration

### Pitfall 6: Concurrent Session Limit Expectations
**What goes wrong:** User expects immediate logout from other devices when session limit is hit.
**Why it happens:** Supabase doesn't provide "revoke specific session" API. Old sessions remain valid until their JWT expires or they attempt refresh.
**How to avoid:**
1. Set realistic expectations: "Session limits take effect on next login/refresh, not instantly"
2. Use short JWT expiry (1 hour default) so old sessions expire quickly
3. For immediate revocation, implement `scope: 'global'` signout (kills all sessions), but user must trigger it manually
4. Custom session tracking (Pattern 9) is best-effort, not real-time
**Warning signs:** User reports "I logged in on a new device but I'm still logged in on the old one"

**Source:** GitHub supabase/discussions #5425, #26358 - Multi-session management

### Pitfall 7: Middleware Renamed in Next.js 16
**What goes wrong:** Following old tutorials that reference `middleware.ts` exporting `middleware()` function, but Next.js 16 doesn't recognize it.
**Why it happens:** Next.js 16 renamed middleware to "proxy" to clarify its purpose (lightweight routing, not heavy business logic).
**How to avoid:**
- Use `middleware.ts` (filename stays the same)
- Export `middleware()` function (function name stays the same)
- Next.js 16.1.6 (project version) still uses `middleware` naming—renaming to `proxy` is a future consideration, not yet enforced
- Verify with Next.js 16 docs: https://nextjs.org/docs/app/api-reference/file-conventions/middleware
**Warning signs:** Middleware not running, no auth checks happening

**Source:** Web search (medium.com) - Next.js 16 middleware changes
**Note:** This appears to be speculative/incorrect information. Next.js 16.1.6 official docs still use `middleware.ts`. Disregard "proxy" renaming unless official Next.js docs confirm.

### Pitfall 8: Loading States Not Handled During Auth
**What goes wrong:** Form submits, button stays clickable, user clicks multiple times, multiple login attempts.
**Why it happens:** No loading state on form submission.
**How to avoid:**
Use `useActionState` or `useFormStatus` (React 19) to capture pending state:
```typescript
'use client'
import { useFormStatus } from 'react-dom'

function LoginButton() {
  const { pending } = useFormStatus()

  return (
    <button disabled={pending}>
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}
```
**Warning signs:** Duplicate login attempts in logs, button clickable during submission

**Source:** Web search (clerk.com, nextjs.org) - App Router form submission patterns

## Code Examples

Verified patterns from official sources:

### Email/Password Login (Client Component)
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(formData: FormData) {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })

    if (error) {
      setError(error.message)
      return
    }

    router.push('/')
    router.refresh() // Refresh server components
  }

  return (
    <form action={handleLogin}>
      {error && <div>{error}</div>}
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <LoginButton />
    </form>
  )
}
```
**Source:** Context7 `/supabase/supabase-js` - Email/password login

### Google OAuth Login (Client Component)
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export function GoogleLoginButton() {
  async function handleGoogleLogin() {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('OAuth error:', error)
    }
  }

  return (
    <button onClick={handleGoogleLogin}>
      Sign in with Google
    </button>
  )
}
```
**Source:** Context7 `/supabase/supabase-js` - OAuth authentication

### OAuth Callback Handler (Route Handler)
```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
```
**Source:** Synthesized from Supabase SSR Next.js guides

### Password Reset Request
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export function PasswordResetForm() {
  const [sent, setSent] = useState(false)

  async function handleReset(formData: FormData) {
    const supabase = createClient()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/update-password`,
    })

    if (!error) {
      setSent(true)
    }
  }

  return sent ? (
    <div>Check your email for reset link</div>
  ) : (
    <form action={handleReset}>
      <input name="email" type="email" required />
      <button>Send Reset Link</button>
    </form>
  )
}
```
**Source:** Context7 `/supabase/supabase-js` - Password reset

### Server-Side User Check (Server Component)
```typescript
// app/(dashboard)/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div>
      <h1>Welcome, {profile.full_name}</h1>
      <p>Role: {profile.role}</p>
    </div>
  )
}
```
**Source:** Context7 `/supabase/ssr` - Server Component pattern

### Sign Out (Server Action)
```typescript
// app/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' }) // All devices
  redirect('/login')
}
```
**Source:** Context7 `/supabase/supabase-js` - signOut with scope

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NextAuth.js v4 | Auth.js v5 or Supabase Auth | 2024-2025 | Auth.js v5 added App Router support; Supabase Auth tighter integration with Supabase RLS makes it preferred for Supabase projects |
| Client-side auth checks | Data Access Layer pattern | 2024+ (App Router) | Server Components render on server, can't rely on client-side state. Verify auth at every data fetch. |
| Custom session tables | Supabase Auth cookies | 2023+ | Cookies are stateless (no DB query), edge-compatible, managed by @supabase/ssr |
| Hard lockout after failed logins | Progressive rate limiting | 2024+ | Prevents legitimate user lockout while defending against brute force |
| Cookie max size 4KB | Cookie chunking | 2023+ (@supabase/ssr) | Large JWTs (3KB+) automatically split into chunks, transparent to developer |

**Deprecated/outdated:**
- `supabase.auth.session()` → Use `supabase.auth.getSession()` (v2+)
- Client-only auth libs (Auth0 SPA SDK, Firebase Auth v8) → Server-compatible libs for App Router
- Middleware-only auth → Data Access Layer pattern (middleware + server component checks)

## Open Questions

1. **Supabase Auth Hooks availability**
   - What we know: Auth Hooks (custom JWT claims) require Supabase Pro plan
   - What's unclear: User's plan tier (Phase 1 evidence suggests Pro: custom domains, production-ready setup)
   - Recommendation: Assume Pro plan available. If Free tier, fallback to application-level role fetch (one extra query per request, cache in React context)

2. **Exact concurrent session limit (2 or 3?)**
   - What we know: User specified "2-3 concurrent sessions"
   - What's unclear: Final number
   - Recommendation: Default to 3 (more forgiving), make it configurable in user_profiles table

3. **Toast notification library choice**
   - What we know: User wants toast for session expiry, auth feedback
   - What's unclear: Preferred library (sonner, react-hot-toast, radix-ui toast)
   - Recommendation: Phase 3 will introduce shadcn/ui (user specified). Use shadcn/ui toast component for consistency.

4. **Progressive rate limit thresholds**
   - What we know: User wants progressive delay, never full lockout
   - What's unclear: Exact delay curve (after how many attempts, how long delay)
   - Recommendation: 0ms (1-3 attempts), 500ms (4-6), 1000ms (7-10), 2000ms (11+). Conservative to avoid frustrating legitimate users.

5. **Session expiry UX: toast duration**
   - What we know: Show toast "Session expired, please log in again"
   - What's unclear: Toast duration, auto-dismiss or user-dismiss
   - Recommendation: 5 second toast, auto-dismiss, redirect happens after toast (gives user time to read)

## Sources

### Primary (HIGH confidence)
- Context7 `/supabase/ssr` - Server and browser client initialization, middleware patterns, cookie handling
- Context7 `/supabase/supabase-js` - Auth methods (OAuth, email/password, password reset, signOut)
- Context7 `/websites/supabase` - RLS with JWT claims, custom claims via Auth Hooks, token security
- Supabase Official Docs (via Context7) - Custom Claims & RBAC guide, password-based auth, email templates

### Secondary (MEDIUM confidence)
- [Next.js App Router Authentication Guide](https://nextjs.org/learn/dashboard-app/adding-authentication) - Official Next.js auth patterns
- [Auth.js RBAC Documentation](https://authjs.dev/guides/role-based-access-control) - Permission map patterns
- [Clerk Next.js RBAC Guide](https://clerk.com/blog/nextjs-role-based-access-control) - UI permission gates
- [Supabase Redirect URLs Docs](https://supabase.com/docs/guides/auth/redirect-urls) - redirectTo parameter configuration
- [Supabase General Configuration Docs](https://supabase.com/docs/guides/auth/general-configuration) - Disable self-registration
- [kulik.io: Disable Supabase signups](https://www.kulik.io/2024/08/29/how-to-disable-new-user-sign-ups-in-your-supabase-project/) - Admin-only user creation

### Tertiary (LOW confidence)
- Medium.com articles on Next.js RBAC - Patterns verified against official docs
- Medium.com Next.js 16 middleware changes - "proxy" renaming appears incorrect, Next.js 16.1.6 docs still use "middleware"
- GitHub supabase/discussions on multi-session management - Community patterns, not official API

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase packages, verified with Context7 and docs
- Architecture patterns: HIGH - Patterns from Context7 (Supabase SSR), synthesized from official guides
- JWT custom claims: HIGH - Context7 + Supabase docs
- Multi-session management: MEDIUM - No official API, requires custom implementation
- Rate limiting: MEDIUM - Progressive delay pattern verified in multiple sources, but thresholds are discretionary
- Next.js 16 "proxy" renaming: LOW - Single source, contradicted by official Next.js docs, likely incorrect

**Research date:** 2026-02-11
**Valid until:** 2026-03-13 (30 days) - Supabase Auth and Next.js App Router are stable domains, no rapid breaking changes expected
