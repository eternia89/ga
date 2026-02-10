# Research Summary — GA Operations Tool

## Key Insights Across All Research Tracks

### Architecture (High Confidence)

1. **Shared schema + RLS** is the right multi-tenancy model for 5-15 companies. No need for schema-per-tenant complexity.
2. **3-layer authorization** (RLS → App RBAC → UI gates) provides defense in depth. RLS is the security floor.
3. **No ORM needed.** The Supabase client respects RLS automatically via user JWT. ORMs bypass RLS with service role connections.
4. **No global client state needed.** Server Components fetch data, URL params handle filters, React Hook Form handles form state.
5. **State machine in TypeScript** with optimistic locking at DB level prevents race conditions on workflow transitions.

### Stack (High Confidence)

1. **Supabase SSR (`@supabase/ssr`)** handles auth session management with Next.js App Router seamlessly.
2. **Server Actions** are the right choice for all user-initiated CRUD. Reserve Edge Functions/pg_cron for background tasks (auto-accept, PM job generation).
3. **React Hook Form + Zod + shadcn/ui** is the canonical form stack. Schemas shared between client validation and server actions.
4. **shadcn/ui sidebar component** provides the dashboard layout pattern out of the box.
5. **ExcelJS** for server-side Excel generation with streaming support for large datasets.

### Domain (High Confidence)

1. **Minimal request form is critical for adoption.** Title + description + optional photo only. GA Lead handles category/priority during triage. Target: submit in <60 seconds.
2. **4-level priority** (Low/Medium/High/Urgent) is industry standard.
3. **Calendar-based PM scheduling** with floating intervals is the right default. Meter-based and condition-based are irrelevant for corporate GA.
4. **Notification categorization** prevents fatigue: Critical (action required) vs Normal (status update) vs Low (FYI).
5. **7-day auto-accept** is a genuinely good feature — prevents "completion limbo" common in CMMS tools.

### Pitfalls (High Confidence)

1. **#1 risk: RLS policy gaps.** Every new table needs policies for all CRUD operations. CI check required.
2. **#2 risk: Service role key exposure.** Use `server-only` package, never `NEXT_PUBLIC_` prefix.
3. **#3 risk: Race conditions.** Optimistic locking (`WHERE status = $expected`) on all state transitions.
4. **#4 risk: Form complexity kills adoption.** Over-engineering the request form is the #1 reason CMMS implementations fail.
5. **#5 risk: Mobile neglect for field workers.** Even though "desktop-first," GA Staff job status updates + photo uploads MUST work on mobile.

## Differentiators (Features Setting This Tool Apart)

| Feature | Why It Matters |
|---------|---------------|
| WhatsApp-style image annotation | Rare in CMMS tools; faster/clearer than plain photos |
| Google Vision auto-descriptions | Reduces manual data entry; not seen in mainstream CMMS |
| Multi-subsidiary division scoping | Tailored to corporate group structure (most CMMS = single site) |
| Receiver acceptance for asset transfers | Ensures physical tracking accuracy; missing from most tools |
| CEO-only conditional approval | Right-sized (not every request); cleaner than most CMMS approval chains |
| PM auto-pause on broken/sold | Smart default, surprisingly missing from many tools |

## Implementation Priority

### Phase 1: Foundation
Auth, RBAC, RLS, user management, company/division/location/category CRUD

### Phase 2: Core Workflow
Request submission, GA Lead triage, job creation/execution, comment threads, basic notifications

### Phase 3: Approvals & Completion
CEO approval workflow, job completion, 7-day auto-accept, requester feedback

### Phase 4: Inventory
Asset registry, movement tracking, receiver acceptance, invoice upload

### Phase 5: Maintenance
PM templates (form builder), scheduling, auto-job generation, auto-pause

### Phase 6: Media & Intelligence
Image compression, annotation, Google Vision API integration

### Phase 7: Dashboards & Reporting
Dashboard metrics (Tier 1 + 2), Excel export, audit trail views

### Phase 8: Polish
GPS capture, notification preferences, deduplication awareness, SLA indicators

## Critical Technical Decisions

| Decision | Recommendation | Confidence |
|----------|---------------|------------|
| Use Supabase client directly (no ORM) | Yes | HIGH |
| Database-level state machine (optimistic locking) | Yes | HIGH |
| Calendar-based PM only (defer meter/condition) | Yes | HIGH |
| Polling for notifications (not Realtime) | Yes for v1 | MEDIUM |
| GPS as deterrent only (not trusted data) | Yes | HIGH |
| Minimal request form (3 fields) | Yes | HIGH |
| Table-based ID counters (not sequences) | Yes | MEDIUM |
| ExcelJS for exports (not SheetJS) | Yes | MEDIUM |

## Verification Notes

Items to verify against current docs before implementation:
- `@supabase/ssr` API signatures (createServerClient/createBrowserClient)
- Next.js 16 specifics (searchParams as Promise, async cookies())
- shadcn/ui CLI compatibility with Tailwind v4
- Supabase Auth hooks (JWT claims) availability by plan tier
- pg_cron availability on Supabase Pro plan
