# Pitfalls Research: CMMS/Operations Tool on Next.js + Supabase

## Critical Pitfalls

### 1. RLS Policy Gaps (Multi-Tenancy Data Leak)
**Risk:** Forgetting RLS on new tables, or missing CRUD operation coverage (e.g., SELECT policy exists but no INSERT/UPDATE policy with company check).
**Mitigation:**
- CI check that every public table has RLS enabled
- Template that generates all 4 CRUD policies per table
- Test suite that verifies data isolation between tenants

### 2. Service Role Key Leaking to Client
**Risk:** `SUPABASE_SERVICE_ROLE_KEY` accidentally exposed via `NEXT_PUBLIC_` prefix or imported in client component.
**Mitigation:**
- Never use `NEXT_PUBLIC_` prefix on sensitive keys
- Use `server-only` package on modules that use service role
- CI check that greps client bundles for key patterns

### 3. Supabase Auth Signup Not Disabled
**Risk:** Anyone can call `supabase.auth.signUp()` with the public anon key, creating unauthorized accounts.
**Mitigation:**
- Disable email signup in Supabase Dashboard
- Restrict Google OAuth to specific email domains
- Create users via admin-only server action using service role

### 4. IDOR (Insecure Direct Object References)
**Risk:** Bypassing RLS by using service role for user-initiated data access.
**Mitigation:**
- Always use user's Supabase client (anon key + JWT) for user-initiated queries
- When service role is necessary, always add explicit `company_id` filter
- Audit all service role usage

### 5. Request Status Race Conditions
**Risk:** Two GA Leads triage the same request simultaneously → inconsistent state.
**Mitigation:**
- Optimistic locking: `UPDATE ... WHERE id = $id AND status = $expected_status`
- If 0 rows updated → conflict error → ask user to refresh

### 6. N+1 Queries in Dashboard
**Risk:** Dashboard fetches individual records and aggregates in JavaScript.
**Mitigation:**
- Use PostgreSQL views/functions for aggregations
- Use `supabase.rpc()` for complex queries
- Cache dashboard results for 30-60 seconds

## Moderate Pitfalls

### 7. Supabase Connection Pooling (Serverless)
**Risk:** Serverless functions create new connections per invocation → exhausts pool.
**Mitigation:** Use Supabase's built-in connection pooler (Supavisor). Ensure connection string uses the pooler endpoint for serverless.

### 8. Next.js Caching Gotchas
**Risk:** `fetch()` in Server Components cached by default → stale data after mutations.
**Mitigation:**
- Use `revalidatePath`/`revalidateTag` after mutations
- Use `{ cache: 'no-store' }` for data that must be fresh
- Supabase client calls are NOT cached by default (not standard fetch)

### 9. Orphaned Storage Objects
**Risk:** User uploads image, then abandons the form. File exists in storage but no database record references it.
**Mitigation:**
- Upload to a "pending" path first
- Move to permanent path on form submission
- Cron job cleans pending files older than 24 hours

### 10. Soft Delete Complexity
**Risk:** Forgetting `WHERE deleted_at IS NULL` in queries. Unique constraints fail on soft-deleted records.
**Mitigation:**
- Include `deleted_at IS NULL` in all RLS SELECT policies
- Use partial unique indexes: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`
- Consider database views that pre-filter deleted records

### 11. Notification Fatigue
**Risk:** Users get notifications for everything → start ignoring all of them.
**Mitigation:**
- Categorize: Critical (approval needed), Normal (assignment), Low (FYI)
- Separate "Requires Action" from "Information" in UI
- Never notify the actor about their own action
- Coalesce rapid changes (max 1 notification per entity per hour for same event type)

### 12. Maintenance Schedule Drift
**Risk:** Confusion between fixed-interval and floating-interval scheduling.
**Mitigation:**
- Explicitly model both: `schedule_type: 'fixed' | 'floating'`
- Default to floating (next_due = last_completion + interval)
- When asset goes broken → pause → resume from pause date, not original schedule

### 13. Excel Export Memory Exhaustion
**Risk:** Loading 50K+ records into memory on serverless function.
**Mitigation:**
- Use streaming writes (exceljs supports this)
- Require date range filters
- Cap at 50K rows
- Configure `maxDuration` on Vercel for export routes

### 14. Schema Migration with RLS
**Risk:** Renaming/removing a column referenced by an RLS policy → policy silently fails.
**Mitigation:**
- Always review/update RLS policies when modifying schemas
- Include policy updates in the same migration
- Post-migration smoke tests for data access

### 15. Code/Schema Deployment Mismatch
**Risk:** Vercel deploys new code instantly but Supabase migration hasn't run → 500 errors.
**Mitigation:**
- Expand-and-contract pattern: add column → deploy code → remove old column
- Never rename columns in single step
- Run migrations before deploying new code

## UX Pitfalls

### 16. Over-Complicated Request Form
**Risk:** Modeling the form after the database schema (too many fields).
**Mitigation:** Minimal required fields: title, description, optional photo. GA Lead fills category/priority during triage.

### 17. Poor Mobile Experience for Field Workers
**Risk:** "Desktop-first" interpreted as "mobile doesn't matter," but GA Staff update jobs in the field.
**Mitigation:**
- Design these workflows mobile-first: view jobs, update status, upload photos, add comments
- Test on mid-range Android phones
- Minimum 44x44px touch targets

### 18. GPS Spoofing
**Risk:** Client-side GPS is fundamentally untrusted.
**Mitigation:** Accept GPS as deterrent not guarantee. Flag large discrepancies (>1km from job location). Require photo evidence for high-value jobs.

### 19. CEO Approval Bottleneck
**Risk:** Single approver on vacation → all monetary requests stuck.
**Mitigation:** Consider delegation feature and auto-escalation rules in a later phase. Show "pending approval" metrics on dashboard.

### 20. Deduplication False Positives
**Risk:** "Similar request" warnings confuse users into not submitting valid requests.
**Mitigation:** Show duplicates to GA Lead during triage, not to user during submission. Start with simple matching (same location + category + 24h window), not NLP.

## Phase-Specific Risk Summary

| Phase Topic | Key Risk | Mitigation |
|------------|----------|------------|
| Auth setup | Service role key leak | `server-only` package, no `NEXT_PUBLIC_` prefix |
| Database schema | Missing RLS | CI check, template for all CRUD policies |
| Multi-tenancy | Data isolation gaps | Always use user's client, not service role |
| Request workflow | Race conditions | Optimistic locking at DB level |
| File uploads | Orphaned files | Pending bucket + cleanup cron |
| Maintenance | Schedule drift | Explicit fixed vs. floating model |
| Dashboards | Slow queries | DB-level aggregation views |
| Excel export | Memory exhaustion | Streaming + date range filters |
| Mobile | GA Staff can't update | Mobile-first for field workflows |
| Notifications | Fatigue | Categorize by urgency |
| Deployment | Code/schema mismatch | Expand-and-contract migrations |
