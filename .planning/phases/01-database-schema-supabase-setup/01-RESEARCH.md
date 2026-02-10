# Phase 1: Database Schema & Supabase Setup - Research

**Researched:** 2026-02-10
**Domain:** Supabase (PostgreSQL), Database Schema Design, Row-Level Security (RLS), Multi-Tenancy
**Confidence:** HIGH

## Summary

Phase 1 establishes the database foundation for a multi-tenant GA Operations Tool managing 5-15 subsidiaries with 100-500 users. The research confirms that Supabase's PostgreSQL-based platform with RLS policies is well-suited for shared-schema multi-tenancy. Key findings include: (1) Supabase CLI provides robust migration workflows for local development and production deployment, (2) RLS policies with custom JWT claims enable company isolation without application-layer enforcement, and (3) soft-delete implementation with RLS requires careful policy design to avoid UPDATE conflicts.

Critical challenges identified: soft-delete RLS policies need special handling for UPDATE operations since PostgreSQL validates both old and new row states against SELECT policies. The recommended solution is to use separate UPDATE policies with conditional logic or exclude deleted_at checks from SELECT policies used during updates.

**Primary recommendation:** Use Supabase CLI for all schema changes (never use dashboard for structural changes), implement RLS helper functions early for company_id/division_id/role extraction from JWT claims, and adopt a forward-only migration strategy with explicit rollback migrations for production safety.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase CLI | Latest | Local development, migrations, schema management | Official tool for Supabase workflow, required for migration management |
| PostgreSQL | 15+ | Database engine (via Supabase) | Supabase's underlying database, supports RLS, triggers, JSONB |
| @supabase/supabase-js | v2.58.0+ | Client library for Next.js app | Official TypeScript client, enforces RLS automatically |
| uuid-ossp | Built-in | UUID generation for primary keys | Standard PostgreSQL extension for UUIDs |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pgTAP | Latest | Database testing framework | Testing RLS policies, triggers, and database logic |
| pg_cron | Via Supabase | Scheduled jobs for cleanup/maintenance | Automated tasks like counter resets, notification cleanup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shared schema + RLS | Schema-per-tenant | Shared schema scales better for 5-15 tenants, simpler migrations, RLS provides adequate isolation |
| UUID primary keys | Serial/Bigserial | UUIDs prevent enumeration attacks, work better for distributed systems, slight performance cost acceptable |
| Table-based counters | Sequences | Table-based counters allow reset/customization per company, support human-readable formats |

**Installation:**
```bash
# Install Supabase CLI globally
npm install -g supabase

# Initialize project
supabase init

# Link to remote project (after creating in Supabase dashboard)
supabase login
supabase link --project-ref <your-project-ref>
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/
├── config.toml              # Project configuration
├── seed.sql                 # Seed data for development
└── migrations/
    ├── 20260210000001_initial_schema.sql
    ├── 20260210000002_rls_policies.sql
    ├── 20260210000003_helper_functions.sql
    └── 20260210000004_audit_triggers.sql
```

### Pattern 1: Multi-Tenant RLS with Company Isolation
**What:** Every table has `company_id` as the first column in composite indexes, RLS policies enforce `company_id = auth.user_company_id()` for all operations.
**When to use:** All domain tables (companies, divisions, locations, requests, jobs, inventory, etc.)
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Helper function to extract company_id from JWT
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Example table with RLS
CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  division_id uuid REFERENCES public.divisions(id),
  title text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Baseline SELECT policy with company isolation and soft-delete
CREATE POLICY "Users can view requests from their company"
  ON public.requests
  FOR SELECT
  TO authenticated
  USING (
    company_id = auth.user_company_id()
    AND deleted_at IS NULL
  );
```

### Pattern 2: Soft Delete with RLS-Safe UPDATE Policies
**What:** Separate SELECT and UPDATE policies to avoid conflicts when setting deleted_at.
**When to use:** All tables with soft-delete functionality.
**Critical insight:** UPDATE operations trigger SELECT policy validation on both old and new row states. Setting `deleted_at` makes the new row fail `deleted_at IS NULL` checks.
**Example:**
```sql
-- Source: https://github.com/supabase/supabase-js/issues/1941
-- SELECT policy excludes soft-deleted records
CREATE POLICY "Users view active records only"
  ON public.requests
  FOR SELECT
  TO authenticated
  USING (
    company_id = auth.user_company_id()
    AND deleted_at IS NULL
  );

-- UPDATE policy allows soft-delete operation
-- Does NOT include deleted_at IS NULL check
CREATE POLICY "Users can update their company's records"
  ON public.requests
  FOR UPDATE
  TO authenticated
  USING (
    company_id = auth.user_company_id()
    -- No deleted_at check here - allows soft delete
  )
  WITH CHECK (
    company_id = auth.user_company_id()
    -- Allow transition to deleted state
  );
```

### Pattern 3: JWT Claims Helper Functions
**What:** Create dedicated functions to extract user context from JWT claims for use in RLS policies.
**When to use:** Set up early in Phase 1, used by all subsequent RLS policies.
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/auth/custom-claims-and-role-based-access-control-rbac
-- Extract company_id from JWT app_metadata
CREATE OR REPLACE FUNCTION auth.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'company_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Extract division_id from JWT app_metadata
CREATE OR REPLACE FUNCTION auth.user_division_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'division_id')::uuid;
$$;

-- Extract user role from JWT app_metadata
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'user'
  );
$$;
```

### Pattern 4: JSONB Audit Log with Triggers
**What:** Audit table stores before/after snapshots in JSONB columns, triggered automatically on INSERT/UPDATE/DELETE.
**When to use:** All domain tables requiring audit trail (per REQ-DATA-003).
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/current/plpgsql-trigger
-- Audit log table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRANSITION')),
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  user_id uuid,
  user_email text,
  performed_at timestamptz DEFAULT now()
);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_data_json jsonb;
  new_data_json jsonb;
  changed_fields text[];
BEGIN
  -- Build JSONB representations
  IF TG_OP = 'DELETE' THEN
    old_data_json := to_jsonb(OLD);
    new_data_json := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    -- Identify changed fields
    SELECT ARRAY_AGG(key)
    INTO changed_fields
    FROM jsonb_each(old_data_json)
    WHERE old_data_json->key IS DISTINCT FROM new_data_json->key;
  ELSIF TG_OP = 'INSERT' THEN
    old_data_json := NULL;
    new_data_json := to_jsonb(NEW);
  END IF;

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    user_id,
    user_email
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    old_data_json,
    new_data_json,
    changed_fields,
    auth.uid(),
    auth.email()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach trigger to a table
CREATE TRIGGER requests_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
```

### Pattern 5: Human-Readable ID Counter Table
**What:** Separate counter table per entity type, generates sequential IDs like REQ-2024-001.
**When to use:** Entities requiring human-readable IDs (requests, jobs, purchase orders).
**Example:**
```sql
-- Counter table
CREATE TABLE public.id_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  entity_type text NOT NULL,
  prefix text NOT NULL,
  current_value bigint NOT NULL DEFAULT 0,
  reset_period text CHECK (reset_period IN ('never', 'yearly', 'monthly')),
  last_reset_at timestamptz,
  UNIQUE (company_id, entity_type)
);

-- Function to get next counter value
CREATE OR REPLACE FUNCTION public.next_counter_value(
  p_company_id uuid,
  p_entity_type text,
  p_prefix text
)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_value bigint;
  v_formatted_id text;
BEGIN
  -- Increment counter atomically
  UPDATE public.id_counters
  SET current_value = current_value + 1
  WHERE company_id = p_company_id
    AND entity_type = p_entity_type
  RETURNING current_value INTO v_next_value;

  -- Create counter if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.id_counters (company_id, entity_type, prefix, current_value)
    VALUES (p_company_id, p_entity_type, p_prefix, 1)
    RETURNING current_value INTO v_next_value;
  END IF;

  -- Format as REQ-2024-001
  v_formatted_id := p_prefix || '-' ||
                    TO_CHAR(NOW(), 'YYYY') || '-' ||
                    LPAD(v_next_value::text, 3, '0');

  RETURN v_formatted_id;
END;
$$;
```

### Pattern 6: Composite Indexes for Multi-Tenant Queries
**What:** Multi-column indexes with `company_id` as the first column, followed by commonly filtered columns.
**When to use:** All tables with company_id that are frequently queried.
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/current/indexes-multicolumn
-- Index for filtering requests by company and status
CREATE INDEX idx_requests_company_status
  ON public.requests (company_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for filtering jobs by company and location
CREATE INDEX idx_jobs_company_location
  ON public.jobs (company_id, location_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for foreign key lookups (always index FKs in multi-tenant)
CREATE INDEX idx_requests_company_id ON public.requests (company_id);
CREATE INDEX idx_requests_division_id ON public.requests (division_id);
```

### Anti-Patterns to Avoid
- **Dashboard-driven schema changes:** Always use CLI migrations, never make structural changes via Supabase dashboard (causes version control and environment sync issues)
- **Missing company_id in indexes:** Every WHERE clause will filter by company_id, omitting it from indexes causes poor performance
- **Using user_metadata for authorization:** Use `app_metadata` instead—it's immutable by users and secure for RLS policies
- **Soft-delete in SELECT policies only:** UPDATE operations will fail when setting deleted_at; use separate UPDATE policies
- **Hand-rolling audit triggers per table:** Use a generic trigger function to avoid duplication and maintenance burden

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom UUID logic | `gen_random_uuid()` or `uuid_generate_v4()` | PostgreSQL built-in, cryptographically secure, well-tested |
| RLS bypass detection | Custom authorization middleware | Native RLS policies | Database-enforced, cannot be bypassed by application bugs, faster |
| Migration management | Custom SQL versioning | Supabase CLI migrations | Handles migration history, rollbacks, environment sync automatically |
| Timestamp management | Manual timezone handling | `timestamptz` with `DEFAULT now()` | PostgreSQL handles timezone conversion, audit trails remain accurate |
| Soft delete queries | Application-layer filtering | RLS policies with `deleted_at IS NULL` | Database-enforced, impossible to forget filter, consistent across all queries |
| JWT claim parsing | String manipulation in SQL | Supabase's `auth.jwt()` helper | Validated, type-safe, handles malformed tokens gracefully |

**Key insight:** PostgreSQL and Supabase provide robust primitives for multi-tenancy, authorization, and audit logging. Custom solutions introduce security risks and maintenance burden. Rely on database-level enforcement rather than application-layer checks.

## Common Pitfalls

### Pitfall 1: Soft-Delete RLS UPDATE Conflict
**What goes wrong:** Setting `deleted_at` via UPDATE fails with RLS permission error, even though the user has UPDATE permission.
**Why it happens:** PostgreSQL validates the updated row against SELECT policies. If your SELECT policy has `deleted_at IS NULL`, the newly soft-deleted row (with `deleted_at` set) fails validation.
**How to avoid:** Create separate UPDATE policies without `deleted_at IS NULL` checks. Allow soft-delete transitions explicitly in the WITH CHECK clause.
**Warning signs:** `permission denied for table` errors when calling `.update({ deleted_at: new Date() })` from client.
**Sources:** [Bug Report: RLS WITH CHECK Clause Fails for Soft Delete](https://github.com/supabase/supabase-js/issues/1941), [Fixing Supabase RLS 403 Error](https://medium.com/@bloodturtle/fixing-supabase-rls-403-error-policy-conflict-during-update-e2b7c4cb29d6)

### Pitfall 2: Using user_metadata Instead of app_metadata for Authorization
**What goes wrong:** Users can modify their own roles/permissions, bypassing authorization checks.
**Why it happens:** `user_metadata` is editable via `supabase.auth.update()`, while `app_metadata` is server-only and immutable by users.
**How to avoid:** Always store authorization data (company_id, division_id, role) in `app_metadata`. Use custom access token hooks to populate it.
**Warning signs:** Authorization bypasses in testing, users seeing data from other companies.
**Sources:** [JWT Claims Reference](https://supabase.com/docs/guides/auth/jwt-fields), [Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)

### Pitfall 3: Missing company_id from Index Leading Columns
**What goes wrong:** Queries are slow despite having indexes, full table scans on large datasets.
**Why it happens:** Every multi-tenant query filters by `company_id`, but if indexes don't start with `company_id`, PostgreSQL can't use them efficiently.
**How to avoid:** Always make `company_id` the first column in composite indexes for multi-tenant tables. Add it to foreign key indexes too.
**Warning signs:** EXPLAIN ANALYZE shows sequential scans or index scans reading thousands of rows.
**Sources:** [Multi-Tenant Apps & Postgres](https://www.crunchydata.com/blog/designing-your-postgres-database-for-multi-tenancy), [Supabase Multi-Tenancy Best Practices](https://roughlywritten.substack.com/p/supabase-multi-tenancy-simple-and)

### Pitfall 4: Forward-Only Migrations Without Rollback Plan
**What goes wrong:** Production migration causes issues, no automated way to rollback, manual SQL fixes required under pressure.
**Why it happens:** Supabase uses forward-only migrations. Running `migration down` locally doesn't create production rollback migrations.
**How to avoid:** For risky migrations, write explicit rollback migrations before deploying. Test locally with `supabase db reset` to validate full migration history.
**Warning signs:** No rollback strategy documented, destructive migrations (DROP COLUMN) without backup plan.
**Sources:** [Rollback Migrations Discussion](https://github.com/orgs/supabase/discussions/11263), [Database Migrations Docs](https://supabase.com/docs/guides/deployment/database-migrations)

### Pitfall 5: RLS Policy Testing Only in Production
**What goes wrong:** RLS bugs discovered after deployment, user data exposure, costly emergency fixes.
**Why it happens:** RLS policies are complex and difficult to debug. Postgres logs are cryptic. Developers skip testing until integration.
**How to avoid:** Use pgTAP for unit testing RLS policies locally. Test with multiple user contexts (different companies, roles). Use supashield CLI for automated RLS security scanning.
**Warning signs:** No automated RLS tests, relying on manual testing with dashboard SQL editor.
**Sources:** [Testing RLS with pgTAP](https://usebasejump.com/blog/testing-on-supabase-with-pgtap), [supashield CLI](https://github.com/Rodrigotari1/supashield)

### Pitfall 6: Direct Production Schema Changes via Dashboard
**What goes wrong:** Local and production schemas diverge, migrations fail, can't reproduce production state locally.
**Why it happens:** Dashboard is convenient for quick fixes, but changes aren't tracked in migrations, don't sync to git.
**How to avoid:** Make ALL structural changes via CLI migrations, even in emergencies. Use `supabase db pull` to capture untracked changes as migrations.
**Warning signs:** `migration already applied` errors, differences between local and production schemas, missing migrations in version control.
**Sources:** [Managing Config](https://supabase.com/docs/guides/local-development/managing-config), [Supabase CLI Best Practices](https://bix-tech.com/supabase-cli-best-practices-how-to-boost-security-and-control-in-your-development-workflow/)

## Code Examples

Verified patterns from official sources:

### Custom Access Token Hook for app_metadata Population
```typescript
// Source: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook
// Supabase Edge Function to populate app_metadata into JWT claims
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

Deno.serve(async (req) => {
  const payload = await req.text()
  const base64_secret = Deno.env.get('CUSTOM_ACCESS_TOKEN_SECRET')
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(base64_secret)

  try {
    const { user_id, claims, authentication_method } = wh.verify(payload, headers)

    // Extract app_metadata and add to claims
    if (claims.app_metadata && claims.app_metadata.company_id) {
      claims['company_id'] = claims.app_metadata.company_id
      claims['division_id'] = claims.app_metadata.division_id
      claims['role'] = claims.app_metadata.role
    }

    return new Response(JSON.stringify({ claims }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

### Migration Workflow Commands
```bash
# Source: https://context7.com/supabase/cli/llms.txt
# Initialize new project
supabase init

# Link to remote project
supabase login
supabase link --project-ref <your-project-ref>

# Create new migration
supabase migration new initial_schema

# Apply migrations locally
supabase db reset  # Tears down and rebuilds from scratch
supabase migration up  # Apply pending migrations

# Generate diff migration from manual changes
supabase db diff --local -f capture_manual_changes

# Pull remote schema as migration
supabase db pull baseline_schema

# Push migrations to production
supabase db push --dry-run  # Preview first
supabase db push  # Apply to remote
```

### Testing RLS Policies with pgTAP
```sql
-- Source: https://usebasejump.com/blog/testing-on-supabase-with-pgtap
BEGIN;
  SELECT plan(3);

  -- Create test user with company_id in app_metadata
  SELECT tests.create_supabase_user('user1', 'user1@example.com', '555-1234');

  SELECT tests.authenticate_as('user1');

  -- Test: User can only see their company's requests
  SELECT results_eq(
    'SELECT COUNT(*)::int FROM public.requests',
    ARRAY[5],  -- Expected count for user1's company
    'User sees only their company requests'
  );

  -- Test: User cannot insert request for another company
  SELECT throws_ok(
    $$INSERT INTO public.requests (company_id, title)
      VALUES ('00000000-0000-0000-0000-000000000001', 'Unauthorized request')$$,
    'new row violates row-level security policy',
    'User cannot create requests for other companies'
  );

  -- Test: Soft-deleted requests are hidden
  UPDATE public.requests SET deleted_at = now() WHERE id = 'test-id';
  SELECT is(
    (SELECT COUNT(*)::int FROM public.requests WHERE id = 'test-id'),
    0,
    'Soft-deleted requests are hidden from SELECT'
  );

  SELECT * FROM finish();
ROLLBACK;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual RLS policy writing | Custom access token hooks + helper functions | 2024 | Cleaner policies, centralized JWT claim extraction, easier to maintain |
| Schema-per-tenant | Shared schema + RLS | Ongoing trend | Better for small-to-medium tenant counts (5-50), simpler migrations, foreign keys work |
| Manual migration ordering | Timestamp-based migrations | Standard practice | Automatic ordering, no conflicts in team environments |
| UUIDv4 | UUIDv7 (sequential) | PostgreSQL 18+ | Better index locality, reduced fragmentation, timestamp-sortable |
| Row-based audit triggers | Statement-level triggers with transition tables | PostgreSQL 10+ | More efficient for bulk operations, captures all changes in one log entry |

**Deprecated/outdated:**
- **Supabase Auth Helpers for Next.js 12:** Replaced by `@supabase/ssr` package for App Router (Next.js 13+)
- **Manual JWT parsing with `current_setting('request.jwt.claims')`:** Use `auth.jwt()` helper function instead
- **`supabase db remote commit`:** Deprecated in favor of `supabase db pull` for capturing remote schema

## Open Questions

1. **Optimal audit log retention and partitioning strategy**
   - What we know: JSONB audit logs grow quickly, partitioning by time range is recommended
   - What's unclear: Specific retention period for this domain (GA operations), partition size (monthly vs quarterly)
   - Recommendation: Start with 2-year retention, monthly partitions. Implement in Phase 1, defer optimization to later phase.

2. **Custom claims population timing (signup vs login hook)**
   - What we know: Custom access token hooks run before token issuance, can add app_metadata claims
   - What's unclear: Whether to populate company_id during signup (user creation hook) or dynamically at login
   - Recommendation: Populate during user creation and update via admin API when user changes companies/roles. Reduces complexity in access token hook.

3. **Storage bucket strategy for media attachments**
   - What we know: Supabase Storage supports RLS policies, buckets can be public or private
   - What's unclear: Whether to use one bucket with folder structure or separate buckets per company
   - Recommendation: Single private bucket with company_id-based folder structure, RLS policies on storage.objects table for isolation. Simpler than managing multiple buckets.

4. **Testing approach for migration rollbacks**
   - What we know: Production rollbacks require forward-only migrations, should test locally first
   - What's unclear: Best practice for simulating rollback scenarios in CI/CD
   - Recommendation: Create rollback migrations alongside feature migrations, test both paths with `supabase db reset` in CI. Document rollback procedure in migration comments.

## Sources

### Primary (HIGH confidence)
- [Supabase CLI Context7](https://context7.com/supabase/cli/llms.txt) - Migration commands, local development workflow
- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - RLS policies, auth.jwt() usage
- [Supabase Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - Helper functions, access token hooks
- [PostgreSQL Triggers Documentation](https://www.postgresql.org/docs/current/plpgsql-trigger) - Audit trigger patterns
- [PostgreSQL Indexes Documentation](https://www.postgresql.org/docs/current/indexes-multicolumn) - Composite index strategies
- [Supabase Database Migrations Docs](https://supabase.com/docs/guides/deployment/database-migrations) - Migration workflow, deployment

### Secondary (MEDIUM confidence)
- [Multi-Tenant Applications with RLS on Supabase](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/) - Multi-tenancy patterns
- [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices) - General best practices
- [Supabase Multi-Tenancy Simple and Fast](https://roughlywritten.substack.com/p/supabase-multi-tenancy-simple-and) - Implementation patterns
- [Designing Postgres for Multi-Tenancy](https://www.crunchydata.com/blog/designing-your-postgres-database-for-multi-tenancy) - Index optimization
- [PostgreSQL Audit Logging](https://oneuptime.com/blog/post/2026-01-21-postgresql-audit-logging/view) - JSONB audit patterns
- [Testing RLS with pgTAP](https://usebasejump.com/blog/testing-on-supabase-with-pgtap) - Testing strategies
- [Supabase CLI Best Practices](https://bix-tech.com/supabase-cli-best-practices-how-to-boost-security-and-control-in-your-development-workflow/) - Workflow recommendations

### Tertiary (LOW confidence - flagged for validation)
- [supashield RLS Testing CLI](https://github.com/Rodrigotari1/supashield) - Automated RLS security scanning (newer tool, validate in testing)
- [Time-Sorted UUIDs (TSIDs)](https://www.foxhound.systems/blog/time-sorted-unique-identifiers/) - Alternative to UUIDv7 (evaluate if UUIDv7 support is limited)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase docs and PostgreSQL documentation confirm all recommendations
- Architecture patterns: HIGH - Verified with Context7, official Supabase docs, and PostgreSQL documentation
- Multi-tenancy RLS: HIGH - Multiple authoritative sources (Supabase docs, Crunchy Data, community examples)
- Soft-delete RLS conflict: HIGH - Documented in Supabase GitHub issues with confirmed workarounds
- Audit logging: MEDIUM - PostgreSQL docs confirm trigger patterns, JSONB approach is community best practice
- Migration workflow: HIGH - Supabase CLI documentation and Context7 examples
- Pitfalls: MEDIUM-HIGH - Most from official docs and GitHub issues, some from community experience

**Research date:** 2026-02-10
**Valid until:** 2026-03-12 (30 days - stable domain, but Supabase CLI updates regularly)

**Notes for planner:**
- RLS helper functions (auth.user_company_id, auth.user_division_id, auth.user_role) should be created in early migration (Plan 01-01)
- Soft-delete UPDATE policy pattern is critical - must be implemented correctly to avoid blocking soft-delete operations
- All tables need both company_id denormalization and indexes starting with company_id for performance
- Custom access token hook implementation may require Edge Function deployment (Supabase platform feature)
- Storage bucket RLS policies follow same pattern as table RLS but operate on storage.objects table
