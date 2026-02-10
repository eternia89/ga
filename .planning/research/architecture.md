# Architecture Research: Multi-Tenant Request/Job/Inventory System

## 1. Database Schema Design

### Multi-Tenancy Model
Shared schema with RLS. All tenant tables have `company_id` column. RLS policies enforce isolation.

### Core Tables
```
companies (id, name, code, ...)
divisions (id, company_id, name, ...)
locations (id, company_id, name, address, ...)
categories (id, company_id, name, type, ...)
user_profiles (id, company_id, division_id, role, full_name, email, ...)

requests (id, company_id, division_id, display_id, requester_id, title, description, status, priority, category_id, assigned_to, requires_budget, estimated_cost, ...)
jobs (id, company_id, display_id, request_id, assigned_to, status, ...)
job_comments (id, job_id, author_id, content, ...)

inventory_items (id, company_id, display_id, name, category_id, location_id, status, ...)
inventory_movements (id, item_id, from_location_id, to_location_id, sender_id, receiver_id, accepted_at, ...)

maintenance_templates (id, company_id, category_id, name, checklist_fields jsonb, ...)
maintenance_schedules (id, company_id, template_id, item_id, interval_days, next_due_at, is_paused, ...)

notifications (id, recipient_id, type, title, message, entity_type, entity_id, read_at, ...)
audit_logs (id, company_id, actor_id, actor_email, action, entity_type, entity_id, description, changes jsonb, metadata jsonb, ...)
```

### Key Design Decisions
- **Money:** Store as `bigint` (IDR whole units, no decimals)
- **Primary keys:** UUID (non-guessable, merge-safe)
- **Soft delete:** `deleted_at timestamptz` on all tenant tables
- **Timestamps:** `created_at`, `updated_at` on all tables

## 2. Human-Readable ID Generation

### Table-Based Counter Approach (Recommended)

```sql
CREATE TABLE id_counters (
  company_id uuid REFERENCES companies(id),
  entity_type text NOT NULL, -- 'request', 'job', 'asset'
  prefix text NOT NULL,       -- 'REQ', 'JOB', 'AST'
  current_value integer NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, entity_type)
);

CREATE OR REPLACE FUNCTION generate_display_id(p_company_id uuid, p_entity_type text)
RETURNS text AS $$
DECLARE
  v_prefix text;
  v_next integer;
  v_year text;
BEGIN
  SELECT prefix INTO v_prefix FROM id_counters
    WHERE company_id = p_company_id AND entity_type = p_entity_type;

  UPDATE id_counters SET current_value = current_value + 1
    WHERE company_id = p_company_id AND entity_type = p_entity_type
    RETURNING current_value INTO v_next;

  v_year := to_char(now(), 'YYYY');
  RETURN v_prefix || '-' || v_year || '-' || lpad(v_next::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

Result: `REQ-2026-0001`, `JOB-2026-0042`, `AST-2026-0103`

## 3. Soft Delete Pattern

- Add `deleted_at timestamptz` column (NULL = active)
- Include `deleted_at IS NULL` in all RLS SELECT policies
- Use partial unique indexes: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`
- Optionally create views: `CREATE VIEW active_requests AS SELECT * FROM requests WHERE deleted_at IS NULL`
- "Delete" action: `UPDATE SET deleted_at = now(), deleted_by = auth.uid()`

## 4. State Machine (TypeScript)

```typescript
type RequestStatus = 'submitted' | 'triaged' | 'pending_approval' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'accepted' | 'closed';

const REQUEST_TRANSITIONS: Record<RequestStatus, { event: string; to: RequestStatus; guard?: (ctx) => boolean }[]> = {
  submitted: [
    { event: 'triage', to: 'triaged', guard: (ctx) => ctx.actor.role === 'ga_lead' || ctx.actor.role === 'admin' },
  ],
  triaged: [
    { event: 'send_for_approval', to: 'pending_approval', guard: (ctx) => ctx.request.requires_budget },
    { event: 'start_work', to: 'in_progress', guard: (ctx) => !ctx.request.requires_budget },
  ],
  pending_approval: [
    { event: 'approve', to: 'approved', guard: (ctx) => ctx.actor.role === 'finance_approver' },
    { event: 'reject', to: 'rejected', guard: (ctx) => ctx.actor.role === 'finance_approver' },
  ],
  // ... etc
};

function transition(currentStatus: RequestStatus, event: string, context: TransitionContext): RequestStatus {
  const transitions = REQUEST_TRANSITIONS[currentStatus];
  const match = transitions?.find(t => t.event === event && (!t.guard || t.guard(context)));
  if (!match) throw new Error(`Invalid transition: ${currentStatus} + ${event}`);
  return match.to;
}
```

Use optimistic locking: `UPDATE requests SET status = $new WHERE id = $id AND status = $expected`

## 5. File/Media Architecture

### Upload Pipeline
1. Client selects image
2. Client-side compression (browser-image-compression → WebP, max 800KB)
3. Optional annotation (fabric.js canvas)
4. Client uploads to Supabase Storage via signed URL or direct upload
5. Server-side: Supabase webhook/trigger calls Google Vision API
6. Vision API description stored in `media_attachments.ai_description`

### Storage Organization
```
{bucket}/
  {company_id}/
    requests/{request_id}/{uuid}.webp
    jobs/{job_id}/{uuid}.webp
    inventory/{item_id}/{uuid}.webp
```

## 6. GPS Capture Architecture

- Use browser Geolocation API on job status change
- Store as `gps_latitude numeric, gps_longitude numeric, gps_accuracy numeric` on status change records
- Non-blocking: if GPS denied/unavailable, proceed without it (log absence)
- GPS is a deterrent, not a guarantee — document this
- Cross-reference GPS with job location to flag discrepancies (>1km)

## 7. Notification System

### Database Schema
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES user_profiles(id),
  type text NOT NULL,  -- 'request_status_changed', 'job_assigned', etc.
  title text NOT NULL,
  message text NOT NULL,
  entity_type text,    -- 'request', 'job', etc.
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### Delivery: Database + Polling (30s)
Simpler than Supabase Realtime for non-chat use case. Client polls every 30 seconds for unread count.

## 8. Audit Trail

### Schema
```sql
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  actor_email text NOT NULL,  -- Denormalized for readability
  actor_role text NOT NULL,
  action text NOT NULL,       -- 'create', 'update', 'delete', 'transition'
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_display_id text,
  description text NOT NULL,  -- Human-readable
  changes jsonb,              -- { field: { old: value, new: value } }
  metadata jsonb,             -- GPS, IP, user agent
  created_at timestamptz NOT NULL DEFAULT now()
  -- NO updated_at or deleted_at — audit logs are immutable
);
```

Insert via service role key (bypass RLS) in Server Actions. Read via user's RLS (company-scoped).

## 9. Excel Export

Use `exceljs` library — server-side generation in API routes. Supports styled cells, multiple sheets, streaming for large datasets. Cap exports at 50K rows. Apply same RLS-equivalent filters server-side.

## 10. Authorization Architecture (3 Layers)

1. **Supabase RLS (database):** Company isolation, division scoping, soft-delete filtering
2. **Application RBAC (server actions):** Role permission checks, state machine guards
3. **UI authorization (client):** Show/hide buttons based on role (UX only, not security)

### Permission Map
```
general_user: requests.create, requests.view_own, inventory.view
ga_staff: requests.view_all, jobs.update_status, inventory.manage, reports.export
ga_lead: + requests.triage, jobs.create, jobs.assign, maintenance.manage
finance_approver: requests.view_all, requests.approve, reports.export
admin: all permissions
```

## ADR Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Multi-tenancy | Shared schema + RLS | 5-15 companies, RLS provides isolation without schema complexity |
| Primary keys | UUID | Non-guessable, merge-safe |
| Display IDs | Table-based counter | Simpler than sequences, works with Supabase |
| Money | bigint (IDR whole units) | No subunits in IDR, avoids float issues |
| State machine | Custom TypeScript | Simpler than XState for linear workflows |
| Notifications | DB + polling (30s) | Simpler than Realtime for non-chat |
| Audit logs | Append-only, JSONB changes | Immutable history, flexible tracking |
