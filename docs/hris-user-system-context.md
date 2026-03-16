# User System Context — GA Operations Tool
## Reference Document for HRIS Milestone 2 PRD

> **Purpose:** This document describes exactly how users are structured in the existing GA Operations codebase. Any new HRIS program built on this system must respect these constraints to avoid auth failures, RLS data leaks, or broken permission logic.

---

## 1. Core Principle: Admin-Created Accounts Only

Users **cannot self-register**. There is no public sign-up flow.

All accounts are created by an `admin`-role user via the admin settings UI. The creation flow:

1. Admin fills out the user form (email, name, role, company, division, location).
2. System calls Supabase Auth to create an auth user (`email_confirm: true` — pre-verified, no email confirmation required).
3. System inserts a row into the `user_profiles` table.
4. System writes `role`, `company_id`, `division_id` into `auth.users.raw_app_meta_data` — **this is mandatory for RLS to work**.

The user can then sign in immediately via Google OAuth or a password reset link. No invite email is currently sent.

---

## 2. Authentication

### Method
- **Primary:** Google OAuth via Supabase Auth provider
- **Secondary:** Email + password (e.g., via password reset link)

### OAuth Callback Flow (`/api/auth/callback`)
1. Supabase exchanges the OAuth code for a session.
2. The callback handler verifies that a `user_profiles` row exists for the authenticated email.
   - If not found → signs out → redirect to `/login` with error `no_account`
3. Checks if the profile is deactivated (`deleted_at IS NOT NULL`).
   - If deactivated → signs out → redirect to `/login` with error `deactivated`
4. If both checks pass → session cookies set → redirect to dashboard.

### Session Management
- Supabase SSR client with HTTP-only cookies.
- `middleware.ts` refreshes the JWT on every request.
- Middleware also re-checks `user_profiles.deleted_at` on every request — a user deactivated mid-session is kicked out on their very next page load.

### Login Error Codes
| Code | Cause | User-Facing Message |
|---|---|---|
| `no_account` | Email has no `user_profiles` row | "No account found for this email. Contact your administrator." |
| `deactivated` | `deleted_at` is set | "Your account has been deactivated. Contact your administrator." |
| `auth_callback_failed` | OAuth exchange error | "Authentication failed. Please try again." |

---

## 3. User Profile Schema

There are **two separate storage locations** for a user. Both must be kept in sync.

### `auth.users` — Supabase-Managed Auth Table

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, shared with `user_profiles.id` |
| `email` | text | Unique. Cannot be changed via app UI. |
| `email_confirmed_at` | timestamptz | Set to `now()` on admin create (pre-verified) |
| `raw_app_meta_data` | jsonb | **Contains `role`, `company_id`, `division_id` — used by RLS** |
| `raw_user_meta_data` | jsonb | Contains `full_name` for OAuth display |
| `last_sign_in_at` | timestamptz | Shown in admin user table |

### `public.user_profiles` — Application Table

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `id` | uuid | NO | PK = `auth.users.id` |
| `email` | text | NO | Mirror of auth email (convenience for RLS joins) |
| `full_name` | text | NO | Display name |
| `role` | text | NO | One of 5 role values (see §4) |
| `company_id` | uuid | NO | FK → `companies(id)`. User's **primary** company. |
| `division_id` | uuid | YES | FK → `divisions(id)`. Can be NULL. |
| `location_id` | uuid | YES | FK → `locations(id)`. Can be NULL. |
| `avatar_url` | text | YES | Profile photo URL |
| `phone` | text | YES | Contact phone |
| `is_active` | boolean | NO | Default `true`. Legacy flag — **use `deleted_at` for deactivation**. |
| `notification_preferences` | jsonb | NO | Default `{}`. Extensible notification settings. |
| `deleted_at` | timestamptz | YES | Soft-delete. Non-null = deactivated. |
| `created_at` | timestamptz | NO | Auto |
| `updated_at` | timestamptz | NO | Auto-updated by trigger |

### Critical Sync Rule
Any update to `role`, `company_id`, or `division_id` **must update both tables**:
- `user_profiles` (for app-layer queries)
- `auth.users.raw_app_meta_data` (for RLS via JWT)

If only one is updated, the user will see inconsistent access until their next login (JWT is issued at auth time and is not retroactively updated in an active session).

---

## 4. Roles

Five roles exist as a `text` enum. They are defined in `lib/auth/types.ts` and enforced at three layers: Zod schemas, Next.js permissions, and Supabase RLS.

| Role | Internal Key | Description |
|---|---|---|
| General User | `general_user` | End-user. Submits requests for their own division. Read-only on most entities. |
| GA Staff | `ga_staff` | Executes jobs, manages inventory transfers. Full operational access. |
| GA Lead | `ga_lead` | Supervises GA Staff. Triages requests, manages maintenance schedules, views audit logs, exports data. |
| Finance Approver | `finance_approver` | Approves/rejects requests and jobs above budget threshold. No asset/job management. |
| Admin | `admin` | Full system access. Manages users, companies, divisions, locations, categories. |

### Permission Matrix (abbreviated)

| Permission | general_user | ga_staff | ga_lead | finance_approver | admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Create requests | ✓ (own division only) | ✓ | ✓ | — | ✓ |
| View all requests | — | ✓ | ✓ | ✓ | ✓ |
| Triage requests | — | — | ✓ | — | ✓ |
| Create/assign jobs | — | ✓ | ✓ | — | ✓ |
| Manage inventory | — | ✓ | ✓ | — | ✓ |
| Approve requests | — | — | — | ✓ | ✓ |
| Manage maintenance | — | — | ✓ | — | ✓ |
| View audit logs | — | — | ✓ | — | ✓ |
| Manage users | — | — | — | — | ✓ |
| Manage settings | — | — | — | — | ✓ |

Permissions are checked via `hasPermission(role, permission)` (`lib/auth/permissions.ts`) in both server actions and UI components.

---

## 5. Company / Division / Multi-Company Structure

### Org Hierarchy

```
Company
  ├─ Divisions  (company-scoped, 1:N)
  ├─ Locations  (company-scoped, 1:N)
  └─ Categories (company-scoped, 1:N)

User
  ├─ company_id       → primary company (mandatory)
  ├─ division_id      → assigned division (optional)
  └─ location_id      → assigned location (optional)
```

### Multi-Company Access (`user_company_access`)

A user has exactly one **primary company** (`user_profiles.company_id`). They can additionally be granted **read access** to other companies via the `user_company_access` table.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `user_profiles(id)` |
| `company_id` | uuid | FK → `companies(id)` |
| `granted_by` | uuid | FK → `user_profiles(id)` (the admin who granted access) |
| `granted_at` | timestamptz | When access was granted |

Unique constraint: `(user_id, company_id)`.

**Scope of multi-company access:**
- **Read:** User can view data (requests, jobs, assets) from granted companies.
- **Write:** User can only create/update records in their **primary company**. Additional access is read-only.

---

## 6. RLS Architecture

All `public` schema tables have Row Level Security enabled. Access is controlled entirely in the database — the application layer cannot bypass it except via the service role admin client.

### JWT Helper Functions (available to all RLS policies)

```sql
public.current_user_company_id() → uuid   -- from JWT app_metadata.company_id
public.current_user_division_id() → uuid  -- from JWT app_metadata.division_id
public.current_user_role() → text         -- from JWT app_metadata.role
```

These functions read from `auth.jwt() -> 'app_metadata'`. If `raw_app_meta_data` is missing from `auth.users`, all three return NULL and every RLS-protected query returns empty results. **This is the most common integration bug.**

### Common RLS Patterns

**Standard company-scoped select:**
```sql
USING (company_id = public.current_user_company_id() AND deleted_at IS NULL)
```

**Multi-company read (requests, jobs, inventory):**
```sql
USING (
  (
    company_id = public.current_user_company_id()
    OR EXISTS (
      SELECT 1 FROM public.user_company_access
      WHERE user_id = auth.uid() AND company_id = <table>.company_id
    )
  )
  AND deleted_at IS NULL
)
```

**Division-restricted write (general_user only):**
```sql
WITH CHECK (
  company_id = public.current_user_company_id()
  AND (
    public.current_user_role() != 'general_user'
    OR division_id = public.current_user_division_id()
  )
)
```

**Admin-only write:**
```sql
USING (public.current_user_role() = 'admin')
```

### No Hard Deletes
All tables use soft delete (`deleted_at`). Hard `DELETE` operations are blocked by absence of DELETE policies. Audit triggers log all write operations.

---

## 7. Server Action Auth Layer

All mutations go through typed **safe-action** clients (`lib/safe-action.ts`). These enforce auth at the action level before any DB call.

| Client | Auth Check | Supabase Client Used |
|---|---|---|
| `actionClient` | None | — |
| `authActionClient` | User authenticated + `user_profiles` row exists + not deactivated | Anon client (respects RLS) |
| `gaLeadActionClient` | Above + role must be `ga_lead` or `admin` | Anon + admin client |
| `adminActionClient` | Above + role must be `admin` | Admin client (bypasses RLS) |

The `adminActionClient` is the only safe way to create/update/delete users because those operations require the Supabase service role key.

---

## 8. User Management UI

Users are managed in the admin settings page (`/admin/settings`, Users tab).

### Create User Form Fields
| Field | Required | Validation |
|---|---|---|
| Email | Yes | Valid email, max 255 chars |
| Full Name | Yes | Min 1, max 100 chars |
| Role | Yes | One of 5 roles |
| Company | Yes | Must exist |
| Division | Yes (create) / Optional (edit) | Filtered by selected company |
| Location | Yes (create) / Optional (edit) | Filtered by selected company |

### Edit User — Additional Capabilities
- **Additional Company Access:** Checkboxes to grant read access to non-primary companies.
- **Deactivate:** Sets `deleted_at`. User is locked out on next request.
- **Reactivate:** Clears `deleted_at`. Takes effect immediately.
- Email is read-only and cannot be changed via the UI.

### Deactivation Behavior
- Deactivation is a soft delete — `deleted_at` is set, `auth.users` record is preserved.
- Middleware checks `deleted_at` on every request; deactivated users are signed out immediately.
- Reactivation is a simple `deleted_at = NULL` — no re-provisioning needed.

---

## 9. Technical Constraints & Gotchas for HRIS

These are the issues most likely to cause silent failures in a new milestone if not addressed upfront.

### 9.1 — `raw_app_meta_data` Must Be Set on Every User
**Risk:** If a new user is created (or an existing user's role/company changes) without updating `raw_app_meta_data`, all RLS-protected queries will silently return empty results. The user sees a blank app with no error.

**Rule:** Any user creation or update that changes `role`, `company_id`, or `division_id` must call:
```typescript
supabase.auth.admin.updateUserById(id, {
  app_metadata: { role, company_id, division_id }
})
```

### 9.2 — New Tables Must Include `company_id`
**Risk:** A table without `company_id` cannot be scoped per tenant. All users across all companies will see all rows.

**Rule:** Every new HRIS table must have `company_id uuid NOT NULL` as a column, and a corresponding RLS policy that filters by `public.current_user_company_id()`.

### 9.3 — Hardcoded UUIDs Must Be RFC 4122 v4 Compliant
**Risk:** Zod's `.uuid()` validator enforces version 4 format. Postgres accepts `00000000-0000-0000-...` but Zod rejects it at the application layer.

**Rule:** Seed UUIDs must follow the pattern: version digit `4` at position 13, variant digit `a`/`8`/`9`/`b` at position 17.
- ✅ `00000000-0000-4000-a000-000000000001`
- ❌ `00000000-0000-0000-0000-000000000001`

### 9.4 — JWT Claims Are Stale Until Next Login
**Risk:** Changing a user's role or company in the database takes effect for new sessions only. An active session retains the old JWT claims.

**Implication for HRIS:** If HRIS introduces a role change workflow (e.g., promotion), the user must re-login for the change to take effect in RLS. Design any approval workflows with this latency in mind.

### 9.5 — Division and Location Are Company-Scoped
**Risk:** Assigning a `division_id` or `location_id` that belongs to a different company than the user's `company_id` produces a broken FK reference. RLS will filter the division/location out of SELECT queries, but the FK will still exist.

**Rule:** When setting `division_id` or `location_id` on a user, always validate that the division/location belongs to the same `company_id`.

### 9.6 — Soft Delete Everywhere
**Risk:** Reusing deleted entities. If an employee record is "deactivated" (soft-deleted), a new record with the same name/ID can be created. Duplicate name checks must always filter `WHERE deleted_at IS NULL`.

**Rule:** All duplicate-check queries in HRIS must include `AND deleted_at IS NULL`. This applies to create, update, AND restore operations.

### 9.7 — Admin Client Is Required for User Operations
**Risk:** Using the anon Supabase client for user admin operations will fail — `auth.admin.*` methods require the service role key.

**Rule:** Any server action that creates/updates/deactivates users must use `adminActionClient` (which provides the `adminSupabase` context using `SUPABASE_SERVICE_ROLE_KEY`). Never use the anon client for user management.

---

## 10. Extension Points for HRIS

The following patterns are safe extension points that don't require changes to existing auth infrastructure.

| Need | Approach |
|---|---|
| New employee fields (employee_id, hire_date, etc.) | Add columns to `user_profiles` via a new migration |
| New HRIS-specific roles | Extend the `role` CHECK constraint and `lib/auth/permissions.ts` |
| HRIS-specific permissions | Add entries to the `PERMISSIONS` object and `ROLE_PERMISSIONS` map |
| New HRIS tables | Include `company_id NOT NULL` + RLS policy mirroring existing patterns |
| HRIS data isolated from GA Operations data | Separate tables with their own RLS; share `user_profiles` as the identity anchor |
| Employee self-service profile edits | Use `authActionClient` (not `adminActionClient`) + restrict updatable fields via Zod |
| Org chart / reporting structure | Add `manager_id uuid REFERENCES user_profiles(id)` to `user_profiles` or a separate `org_structure` table |

---

## 11. Key Files Reference

| Purpose | Path |
|---|---|
| User schema (migrations) | `supabase/migrations/00001_initial_schema.sql` |
| RLS helper functions | `supabase/migrations/00002_rls_helper_functions.sql` |
| Baseline RLS policies | `supabase/migrations/00003_rls_policies.sql` |
| Multi-company table | `supabase/migrations/00018_user_company_access.sql` |
| Multi-company RLS | `supabase/migrations/00020_rls_multi_company_access.sql` |
| Auth middleware | `middleware.ts` |
| OAuth callback | `app/api/auth/callback/route.ts` |
| Safe-action clients | `lib/safe-action.ts` |
| User server actions | `app/actions/user-actions.ts` |
| Multi-company access actions | `app/actions/user-company-access-actions.ts` |
| Role types & UserProfile type | `lib/auth/types.ts` |
| Permission mapping | `lib/auth/permissions.ts` |
| User Zod schemas | `lib/validations/user-schema.ts` |
| Admin user form UI | `components/admin/users/user-form-dialog.tsx` |
| Seed data (test users) | `supabase/seed.sql` |
