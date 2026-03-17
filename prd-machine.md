# GA Operations Tool — Product Requirements (Machine-Detailed)

> This PRD is a representation of what this app is about, detailed enough for machine execution, but still readable by humans.

## System Overview

A multi-tenant web application for General Affairs operations management. Multi-company corporate group structure with centralized GA team. Desktop-first responsive design, English-only, IDR currency.

## Architecture

| Component | Technology | Notes |
|-----------|-----------|-------|
| Framework | Next.js 16 (App Router) | `app/` directory, Server Components by default |
| Language | TypeScript | Strict mode |
| UI | React 19 + shadcn/ui + Tailwind CSS v4 | Desktop-first, `max-*` breakpoints only |
| Database | Supabase (PostgreSQL) | RLS for multi-tenant isolation |
| Auth | Supabase Auth | Google OAuth + email/password, admin-only creation |
| Storage | Supabase Storage | Photos, invoices |
| Validation | Zod + react-hook-form | All forms use zodResolver |
| Mutations | next-safe-action | Typed client chains: `authActionClient`, `adminActionClient` |
| Deployment | Vercel | |
| Vision AI | Google Vision API | Auto-describe uploaded images |

## Data Model (Core Entities)

| Entity | Display ID Format | Soft Delete | RLS Scoped | Multi-Company |
|--------|------------------|-------------|------------|---------------|
| Requests | `REQ-{code}-{seq}` | Yes | Yes | Yes |
| Jobs | `JOB-{code}-{seq}` | Yes | Yes | Yes |
| Assets | `AST-{code}-{seq}` | Yes | Yes | Yes |
| Schedules | — | Yes | Yes | Yes |
| Templates | — | Yes | Yes | Yes |
| Companies | — | Yes | Admin only | N/A |
| Divisions | — | Yes | Company-scoped | Yes |
| Locations | — | Yes | Company-scoped | Yes |
| Categories | — | Yes | Company-scoped | Yes |
| Users | — | Yes (deactivate) | Admin only | Yes (via `user_company_access`) |

## Access Control

- **RLS-first:** Row-Level Security policies enforce company scoping at database level
- **Multi-company:** Users have a primary `company_id` + optional access via `user_company_access` table
- **RLS helpers:** `current_user_company_id()`, `current_user_role()`, `current_user_accessible_company_ids()` read from JWT `app_metadata`
- **Action-level:** `assertCompanyAccess()` shared helper validates cross-company mutations
- **Admin bypass:** `adminSupabase` (service role) used when actions manually verify authorization

## Roles & Permissions

| Role | Scope |
|------|-------|
| `general_user` | Submit requests, view own requests, accept/reject completed work |
| `ga_staff` | Execute jobs, manage assets, update job status |
| `ga_lead` | Triage requests, assign priority/PIC, create/delegate jobs, full oversight |
| `finance_approver` | Approve/reject budget requests |
| `admin` | Full system configuration, user management |

## Request Lifecycle

```
submitted → triaged → linked_to_job → in_progress → completed → accepted/rejected
                                                              → auto_accepted (7 days)
```

## Job Lifecycle

```
open → in_progress → pending_completion_approval → completed
     → pending_approval (budget) → approved/rejected
```

## Validation Rules

| Field Type | Max Length | Zod Pattern |
|-----------|-----------|-------------|
| Entity name | 60 | `.max(60)` |
| Person name | 60 | `.max(60)` |
| Code/identifier | 10 | `.max(10)` |
| Email | 60 | `.max(60)` |
| Phone | 20 | `.max(20)` |
| Address | 200 | `.max(200)` |
| Description/notes | 200 | `.max(200)` |
| Long text | 1000 | `.max(1000)` |
| Title | 150 | `.max(150)` |
| Date string | 10 | `isoDateString()` helper |

## UI Patterns

- **Tables:** Ghost buttons with `text-blue-600 hover:underline` for row actions
- **Display IDs:** Always `font-mono` class
- **Date format:** `dd-MM-yyyy` (display), `dd-MM-yyyy, HH:mm:ss` (datetime)
- **Dropdowns:** Combobox for large lists, Select for small fixed lists (< 6 options)
- **Modals:** View modal (`?view={id}`) + Detail page (`/[id]`) dual access
- **Forms:** react-hook-form + zod + shadcn Form components
- **Feedback:** Persistent (no auto-dismiss), manual X button
- **Soft delete UI:** "Deactivate" / "Reactivate" labels only

## File Structure

```
app/
  (dashboard)/          # Authenticated routes with sidebar layout
    requests/           # Request list + detail pages
    jobs/               # Job list + detail pages
    inventory/          # Asset list + detail + create pages
    maintenance/        # Schedules + templates
    approvals/          # Budget approval queue
    admin/settings/     # Admin configuration (tabbed: companies, divisions, etc.)
  actions/              # Server actions (next-safe-action)
  api/                  # API routes (exports, uploads, auth, vision)
components/             # React components organized by domain
lib/                    # Shared utilities, types, validation schemas
  auth/                 # Company access helpers
  validations/          # Zod schemas
  notifications/        # Notification creation helpers
supabase/
  migrations/           # SQL migrations (RLS policies, functions, tables)
  seed.sql              # Seed data
```

---

## Recent Development Activity

### 17-Mar-2026

**Focus: Multi-company security hardening + shared helpers + UI cleanup**

| Task | Key Changes |
|------|------------|
| quick-79 (security bugs) | Fixed RFC-4122 UUIDs in seeds. `.single()` → `.maybeSingle()` where 0 rows valid. Duplicate email check on reactivate. Company access check on user create. |
| quick-80 (shared helpers) | Created `assertCompanyAccess()` in `lib/auth/company-access.ts` — replaces 8 inline patterns across 5 action files. Created `isoDateString()` Zod helper in `lib/validations/helpers.ts`. |
| quick-81 (multi-company) | RLS migration `00027` for INSERT/UPDATE multi-company policies. Removed 17 redundant action-level `.eq('company_id')` filters. Scoped 4 export routes to accessible companies. Updated page dropdowns to use `.in('company_id', allAccessibleCompanyIds)`. |
| quick-82 (asset table) | Removed `warranty_expiry` column from asset columns definition. |
| quick-83 (transfer UX) | Moved Transfer button from modal sticky bar to table row action with `ArrowLeftRight` icon. |
| Multi-company isolation | RLS migration `00026` for supporting tables. Updated all detail pages and approvals page to use multi-company queries. |
| UI fixes | Primary company as disabled checkbox in user form. Removed Type/Interval from schedule table. Removed redundant transfer action company filters. |

**30 commits, ~50 files, focused on multi-company correctness and code consolidation.**
