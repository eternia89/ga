# Stack Research: Next.js 16 + Supabase + shadcn/ui

## 1. Supabase RLS for Multi-Tenant Division Scoping

### Helper Functions (DRY)

```sql
CREATE OR REPLACE FUNCTION auth.user_company_id() RETURNS uuid AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.user_division_id() RETURNS uuid AS $$
  SELECT division_id FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

- `SECURITY DEFINER` runs as function owner (superuser), needed because RLS context is the authed user
- `STABLE` lets PostgreSQL cache the result per query — critical for performance

### Policy Pattern

```sql
-- General users: own division only. GA Staff/Lead/Admin: all company data
CREATE POLICY "Division-scoped read" ON requests FOR SELECT USING (
  deleted_at IS NULL
  AND company_id = auth.user_company_id()
  AND (
    auth.user_role() IN ('ga_staff', 'ga_lead', 'finance_approver', 'admin')
    OR division_id = auth.user_division_id()
  )
);
```

## 2. Supabase Auth with Next.js App Router

Use `@supabase/ssr` package:
- **Server Components:** `createServerClient` with `cookies()` (async in Next.js 16)
- **Client Components:** `createBrowserClient` with cookie-based session
- **Middleware:** Refresh session on every request to prevent stale tokens
- **Auth callback:** `app/auth/callback/route.ts` handles OAuth redirects

Key pattern: Always call `supabase.auth.getUser()` (server-side verified) rather than `getSession()` (client-side JWT only).

## 3. File Uploads with Client-Side Compression

Pipeline: Select image → `browser-image-compression` (WebP, max 800KB) → Optional canvas annotation (fabric.js) → Upload to Supabase Storage

Storage bucket structure: `{company_id}/{entity_type}/{entity_id}/{filename}`

RLS on storage via bucket policies scoped to company_id path prefix.

## 4. shadcn/ui Form Patterns

- **Stack:** React Hook Form + Zod + shadcn/ui Form components
- **Multi-step:** Single `useForm` with per-step validation via `trigger(fieldNames)`
- **Dynamic fields:** `useFieldArray` for checklist builder (PM templates)
- **Key components to install:** form, input, textarea, select, checkbox, card, dialog, table, data-table, sidebar, breadcrumb, dropdown-menu, sonner, skeleton

## 5. App Router Dashboard Structure

```
app/
  (auth)/login/page.tsx
  (auth)/auth/callback/route.ts
  (dashboard)/layout.tsx          ← Sidebar + auth check
  (dashboard)/dashboard/page.tsx
  (dashboard)/requests/page.tsx
  (dashboard)/requests/[id]/page.tsx
  (dashboard)/jobs/...
  (dashboard)/inventory/...
  (dashboard)/maintenance/...
  (dashboard)/admin/...
```

- Server Components for data fetching (RLS filters automatically)
- Server Actions for mutations with `revalidatePath`
- URL search params for filter/pagination state (consider `nuqs` library)
- `loading.tsx` for skeleton states

## 6. Server Actions vs Supabase Edge Functions

| Use Case | Approach |
|----------|----------|
| All CRUD from UI | Next.js Server Actions |
| 7-day auto-accept cron | pg_cron or Supabase Edge Function |
| PM job auto-generation | pg_cron (daily check) |
| Google Vision processing | Edge Function triggered by storage upload |
| Webhooks from external | Supabase Edge Functions |

## 7. Zod Patterns

- Shared schemas in `lib/schemas/` — used by both client forms and server actions
- `z.discriminatedUnion('type', [...])` for checklist field types
- `z.refine()` for cross-field validation (budget requires cost)
- `z.coerce.number()` for form inputs that arrive as strings
- IDR: `z.coerce.number().min(0).max(999_999_999_999).transform(Math.round)`

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | None — use Supabase client directly | RLS enforcement requires user JWT context; ORMs bypass RLS |
| State management | None — Server Components + URL state | CRUD-heavy app, no complex client state needed |
| Forms | React Hook Form | Uncontrolled inputs, shadcn/ui integration |
| Charts | Recharts | React-native, sufficient for operational dashboards |
| Tables | TanStack Table | Headless, works with shadcn/ui styling |
| Image annotation | fabric.js | Good docs for draw-on-image use case |
| Image compression | browser-image-compression | WebWorker support, WebP conversion |

## Recommended Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npm install browser-image-compression
npm install date-fns nuqs recharts @tanstack/react-table exceljs
npx shadcn@latest init
```
