# Phase 5: Jobs & Approvals — Research

**Researched:** 2026-02-24
**Domain:** Job lifecycle management, CEO approval workflow, requester acceptance cycle, cron-based auto-accept
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Job creation flow**
- Full form with prefill when creating from a request (pre-fills title, description, location, category from request; Lead can edit everything before submitting)
- Standalone jobs use the same required fields as request-linked jobs: title, description, location, category
- Creating a job from a request automatically moves the request to "In Progress" status
- Jobs have a single estimated cost field (Rp) — no line item breakdown
- Jobs include a priority field: Low, Medium, High, Urgent
- Priority inherits from linked request; when multiple requests are linked, job takes the highest priority. Standalone jobs set priority manually

**Multi-request linking**
- Searchable dropdown on job creation/edit form to add multiple requests to one job
- Requests already linked to other jobs are shown but marked
- No bulk-select from request list — linking only happens from the job form

**Assignment**
- Single PIC (person in charge) per job — no multi-assignment
- Both PIC and GA Lead can progress the job status
- GA Lead can reassign to a different PIC anytime before completion (status does not reset)
- GA Lead can cancel a job at any status; linked requests go back to "Triaged"

**Job status workflow**
- Standard flow: Created → Assigned → In Progress → Completed
- With CEO approval: Created → Assigned → Pending Approval → In Progress → Completed
- GA Lead manually moves to "Pending Approval" when job has sufficient context and pricing for CEO review
- Not every job goes through approval — only those with estimated cost ≥ budget threshold
- CEO rejection sends job back to "Assigned" (Lead can revise cost/details and resubmit)

**Job detail page**
- Full info panel at top: job ID, title, status badge, PIC name, category, location, priority, description, estimated cost, linked request(s), all dates
- Linked requests shown as compact inline previews on the job detail (title, status, requester)
- Request detail page shows linked job(s) as simple clickable links (job ID + title)
- Unified chronological timeline mixing status changes, comments, and system events

**Comments**
- GA Lead + assigned PIC only can post comments
- Single optional photo per comment
- Comments are immutable — no editing or deleting after posting

**Job list page**
- Same data table pattern as request list (columns, filters, sorting)
- Columns: ID, title, status, PIC, priority, linked request, created date

**CEO approval workflow**
- Approval triggered on the job when estimated cost ≥ budget threshold (configurable per company)
- Dedicated approval queue page listing jobs pending approval (with pending + history tabs)
- Approve/reject action available only on job detail page (not inline on queue list)
- Rejection requires a reason; rejection reason visible to all involved parties as timeline event

**Company Settings**
- New "Company Settings" page under admin
- Super Admin only can configure
- First setting: budget threshold for CEO approval (Rp amount)
- Extensible for future company-level rules

**Acceptance cycle**
- When job is completed, linked request(s) move to "Pending Acceptance" status
- Request list shows a badge/indicator on requests needing acceptance action
- Requester accepts or rejects from the request detail page
- Rejection requires a reason (shows in job timeline so PIC knows what to fix)
- Rejection sends job back to "In Progress" for rework — no limit on rejection cycles
- Accepted requests move to "Completed" status (final state)
- 7-day auto-accept cron: closes without feedback, timeline shows "Auto-accepted (no response within 7 days)"
- No countdown displayed on request detail
- Optional feedback after acceptance: 1-5 star rating + optional text comment

### Claude's Discretion
- Job form layout and field ordering
- Approval queue page column design and sorting
- Timeline event styling and icons
- Comment input component design
- Star rating component implementation
- Auto-accept cron implementation details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-JOB-001 | Create job from request (linked) | Multi-request join table schema; prefill pattern from request data |
| REQ-JOB-002 | Create standalone job (not linked to request) | Same form, no prefill, priority set manually |
| REQ-JOB-003 | Auto-generate human-readable ID (JOB-YYYY-NNNN) | Existing `generate_display_id()` RPC pattern from Phase 4 |
| REQ-JOB-004 | Job status workflow: Created → Assigned → In Progress → Completed | Schema already has status column; need `pending_approval` added to CHECK |
| REQ-JOB-005 | GA Lead assigns/delegates jobs to GA Staff (PIC) | `assigned_to` column exists; action pattern mirrors triage |
| REQ-JOB-006 | Comment thread on jobs (text + optional photo) | `job_comments` table exists; photo via media_attachments |
| REQ-JOB-007 | Job list with filters (status, assignee, date range) and sorting | Mirror request-table pattern: TanStack Table + nuqs URL state |
| REQ-JOB-008 | Job detail page with timeline and comments | Mirror request-detail pattern: audit_logs + job_comments as unified timeline |
| REQ-JOB-009 | Link multiple requests to a single job | SCHEMA GAP: `jobs.request_id` is single FK — needs `job_requests` join table |
| REQ-APR-001 | CEO approval required when job estimated cost ≥ budget threshold | `pending_approval` status on jobs; company_settings table for threshold |
| REQ-APR-002 | Approval queue page for Finance Approver | Server component page with pending + history tabs; role check finance_approver |
| REQ-APR-003 | Approve/reject with required reason on rejection | Server action with role guard; rejection reason stored in job record |
| REQ-APR-004 | Show estimated cost prominently in approval view | Display `estimated_cost` from jobs table in IDR format |
| REQ-REQ-008 | 7-day auto-accept after completion (cron job) | pg_cron PLPGSQL function; daily cron at midnight UTC |
| REQ-REQ-009 | Requester can accept or reject completed work | Status transition on request: pending_acceptance → completed or back to linked job in_progress |
| REQ-REQ-010 | Requester feedback after acceptance (optional rating/comment) | `feedback_rating` and `feedback_comment` columns exist on requests table; star rating built inline |
</phase_requirements>

---

## Summary

Phase 5 builds the Job domain (create, assign, execute, comment) on top of the existing Supabase schema and Next.js App Router patterns established in Phases 1–4. The core work is new UI and server actions mirroring the request module, plus two new workflows: CEO budget approval and requester acceptance.

The most critical schema discovery is a **breaking gap**: the existing `jobs` table has a single `request_id` FK column, but the locked decision requires multi-request linking. A migration must introduce a `job_requests` join table. The current `jobs.request_id` column should be left nullable for backward compatibility during migration, or dropped after back-fill.

The **auto-accept cron** can use Supabase's built-in pg_cron (available on all plans including free tier, confirmed by Supabase maintainer). The function runs as PLPGSQL directly in the database — no Vercel cron needed, no Edge Functions. The **Company Settings** page needs a new `company_settings` table (key-value or structured) seeded with a `budget_threshold` row per company; this table does not exist yet in the schema.

**Primary recommendation:** Use Supabase pg_cron (`cron.schedule`) for auto-accept. Mirror request module patterns exactly for jobs. Add `job_requests` join table migration as the first task.

---

## Standard Stack

### Core (all already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-safe-action | 8.0.11 | Type-safe server actions with middleware | Existing pattern; authActionClient used throughout |
| @supabase/ssr | 0.8.0 | Server-side Supabase client | SSR-compatible cookie auth |
| @tanstack/react-table | 8.21.3 | Data table state management | Existing pattern for request list |
| nuqs | 2.8.8 | URL-synced filter state | Existing pattern for request filters |
| react-hook-form | 7.71.1 | Form state + validation | Existing pattern |
| zod | 4.3.6 | Schema validation | Existing pattern |
| date-fns | 4.1.0 | Date formatting (dd-MM-yyyy) | Mandatory format |
| lucide-react | 0.563.0 | Icons | Existing pattern |

### Supporting (new for Phase 5)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pg_cron (Supabase built-in) | N/A | Auto-accept cron job | 7-day auto-accept |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase pg_cron | Vercel cron jobs | Vercel cron is HTTP-based (more overhead); Supabase pg_cron runs directly in DB (faster, no cold start). Supabase is preferred since the scheduler is closer to the data. |
| Inline star rating (Lucide Star icon) | react-stars, react-rating | No additional dependencies needed; star rating is simple enough to build with Lucide icons and React state |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (dashboard)/
│   ├── jobs/
│   │   ├── page.tsx              # Job list (server component)
│   │   ├── new/
│   │   │   └── page.tsx          # Create job form page
│   │   └── [id]/
│   │       └── page.tsx          # Job detail (server component)
│   ├── approvals/
│   │   └── page.tsx              # Approval queue (server component, finance_approver only)
│   └── admin/
│       └── company-settings/
│           └── page.tsx          # Company Settings (admin only)
app/
├── actions/
│   ├── job-actions.ts            # createJob, updateJob, updateJobStatus, cancelJob
│   ├── approval-actions.ts       # approveJob, rejectJob
│   └── request-actions.ts        # (add acceptRequest, rejectCompletedWork, submitFeedback)
├── api/
│   └── uploads/
│       └── job-photos/
│           └── route.ts          # Job comment photo uploads
components/
├── jobs/
│   ├── job-columns.tsx
│   ├── job-table.tsx
│   ├── job-filters.tsx
│   ├── job-form.tsx              # Shared create/edit form
│   ├── job-detail-client.tsx
│   ├── job-detail-info.tsx
│   ├── job-detail-actions.tsx
│   ├── job-timeline.tsx          # Unified timeline (status events + comments)
│   ├── job-comment-form.tsx
│   ├── job-status-badge.tsx
│   └── job-priority-badge.tsx    # Can import from request-priority-badge
├── approvals/
│   └── approval-queue.tsx
└── admin/
    └── company-settings/
        └── company-settings-form.tsx
lib/
├── constants/
│   └── job-status.ts             # JOB_STATUS_LABELS, JOB_STATUS_COLORS
├── types/
│   └── database.ts               # Add Job, JobComment, JobWithRelations, CompanySetting
└── validations/
    └── job-schema.ts             # createJobSchema, updateJobSchema, commentSchema
supabase/
└── migrations/
    └── 00008_jobs_phase5.sql     # Schema additions for phase 5
```

### Pattern 1: Mirror Request Module for Job Detail
**What:** The job detail page follows the exact same two-column layout as request detail: server component fetches all data + audit logs, processes into timeline events, passes to a client wrapper.
**When to use:** Job detail page with unified timeline.
**Example:**
```typescript
// app/(dashboard)/jobs/[id]/page.tsx
// Same pattern as app/(dashboard)/requests/[id]/page.tsx

const [jobResult, auditLogsResult, commentsResult] = await Promise.all([
  supabase.from('jobs').select(
    '*, location:locations(name), category:categories(name), pic:user_profiles!assigned_to(name:full_name), created_by_user:user_profiles!created_by(name:full_name)'
  ).eq('id', id).is('deleted_at', null).single(),

  supabase.from('audit_logs').select('*')
    .eq('table_name', 'jobs').eq('record_id', id)
    .order('performed_at', { ascending: true }),

  supabase.from('job_comments').select(
    '*, user:user_profiles!user_id(name:full_name)'
  ).eq('job_id', id).is('deleted_at', null).order('created_at', { ascending: true }),
]);
```

### Pattern 2: Job Timeline — Unified Audit + Comments
**What:** The job timeline merges audit_log events and job_comments into a single chronological array, sorted by timestamp. Comments appear as `type: 'comment'` events.
**When to use:** Job detail right column.
**Example:**
```typescript
type JobTimelineEvent =
  | { type: 'created' | 'status_change' | 'assignment' | 'approval' | 'rejection' | 'cancellation' | 'acceptance_rejection'; at: string; by: string; details?: Record<string, unknown> }
  | { type: 'comment'; at: string; by: string; content: string; photoUrl?: string };

// Merge and sort:
const allEvents: JobTimelineEvent[] = [
  ...auditEvents,
  ...comments.map(c => ({
    type: 'comment' as const,
    at: c.created_at,
    by: c.user?.name ?? 'Unknown',
    content: c.content,
    photoUrl: c.photoUrl, // resolved from media_attachments
  }))
].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
```

### Pattern 3: Server Action — Job Status Transitions
**What:** All job status transitions go through `authActionClient` with role checks in the action body. The pattern matches `triageRequest`.
**Example:**
```typescript
// app/actions/job-actions.ts
export const updateJobStatus = authActionClient
  .schema(z.object({
    id: z.string().uuid(),
    status: z.enum(['assigned', 'in_progress', 'completed', 'pending_approval']),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Only GA Lead or assigned PIC can progress status
    const { data: job } = await supabase
      .from('jobs')
      .select('id, status, assigned_to, created_by')
      .eq('id', parsedInput.id)
      .single();

    const isLead = ['ga_lead', 'admin'].includes(profile.role);
    const isPIC = job?.assigned_to === profile.id;

    if (!isLead && !isPIC) {
      throw new Error('Permission denied');
    }

    // ... transition logic
  });
```

### Pattern 4: Multi-Request Linking via Join Table
**What:** A `job_requests` junction table replaces the single `jobs.request_id` FK for the multi-request requirement.
**When to use:** Job creation and edit forms use a combobox to search and select multiple requests.
**Key query:**
```typescript
// Fetch jobs with linked requests
supabase.from('jobs').select(`
  *,
  job_requests(
    request:requests(id, display_id, title, status, requester:user_profiles!requester_id(name:full_name))
  )
`)
```

### Pattern 5: Supabase pg_cron for Auto-Accept
**What:** A PLPGSQL function runs daily via pg_cron, finding all requests in `pending_acceptance` status where `completed_at` is older than 7 days, and auto-accepting them.
**Example (migration SQL):**
```sql
-- Function: auto_accept_completed_requests
CREATE OR REPLACE FUNCTION public.auto_accept_completed_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.requests
  SET
    status = 'completed',
    accepted_at = now(),
    auto_accepted = true,
    updated_at = now()
  WHERE
    status = 'pending_acceptance'
    AND completed_at IS NOT NULL
    AND completed_at < now() - INTERVAL '7 days'
    AND deleted_at IS NULL;
END;
$$;

-- Schedule: every day at 01:00 UTC
SELECT cron.schedule(
  'auto-accept-completed-requests',
  '0 1 * * *',
  'SELECT public.auto_accept_completed_requests()'
);
```

### Pattern 6: Company Settings Table
**What:** A `company_settings` table stores key-value pairs per company. This enables extensibility for future configurable rules.
**Schema:**
```sql
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  key text NOT NULL,
  value text NOT NULL,
  updated_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, key)
);
```
Keys in Phase 5: `budget_threshold` (value: integer stored as text, e.g. `'5000000'`).

### Pattern 7: Comment Photo Upload
**What:** Single photo per comment follows the two-step upload pattern: insert `job_comments` row first (get `commentId`), then POST to `/api/uploads/job-photos` with `comment_id`. Mirror of request-photos route.

### Anti-Patterns to Avoid
- **Storing multi-request links in a JSON array column:** Breaks relational integrity, can't index, can't join. Always use a proper join table.
- **Using a separate approval table:** The approval state lives on the job (status = 'pending_approval', approved_by, approved_at, rejection_reason columns). A separate approvals table adds unnecessary complexity for a single-approver flow.
- **Auto-accept via application timer:** Never use setTimeout or application-level timers for the 7-day rule. Always use pg_cron — it survives server restarts and deployment gaps.
- **Checking budget threshold in UI only:** Always check `estimated_cost >= budget_threshold` in the server action (not just the form validation), to prevent bypassing the approval gate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scheduled auto-accept | Custom server-side timer, Vercel cron | Supabase pg_cron | pg_cron runs in the database, survives deployments, no HTTP overhead, no cold starts |
| IDR currency display | Custom formatter | `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` | Handles edge cases (rounding, zero-width spaces) |
| Job display ID generation | Custom counter logic | `generate_display_id()` or new `generate_job_display_id()` RPC | Same SECURITY DEFINER atomic counter pattern used for requests |
| Multi-request combobox search | Custom search input | shadcn Combobox (existing in project) | Already used for other large dropdowns per CLAUDE.md |
| Star rating | External npm package | Inline with Lucide `Star` icon + `StarOff` icon | Simple 1–5 click interaction; zero deps needed |

**Key insight:** The pg_cron auto-accept is the highest-risk item to hand-roll incorrectly. The edge case is: a request in `pending_acceptance` with a null `completed_at` must not be auto-accepted. Always guard with `completed_at IS NOT NULL`.

---

## Common Pitfalls

### Pitfall 1: Single request_id vs. join table
**What goes wrong:** Implementing multi-request linking as a JSONB array or comma-separated IDs in `jobs.request_id`.
**Why it happens:** The existing schema has `request_id uuid` which looks sufficient at first glance.
**How to avoid:** Migration 00008 must create `job_requests(job_id, request_id)` join table. The existing `request_id` column on `jobs` should be kept nullable and eventually retired (or kept for PM jobs which have a 1:1 relationship).
**Warning signs:** Any code that does `.eq('request_id', someId)` on jobs needs to become a join through `job_requests`.

### Pitfall 2: Request status "pending_acceptance" not in DB CHECK constraint
**What goes wrong:** Inserting `status = 'pending_acceptance'` fails with a CHECK violation.
**Why it happens:** The current requests CHECK constraint (00007) does not include `pending_acceptance` — it has: `submitted`, `triaged`, `in_progress`, `pending_approval`, `approved`, `rejected`, `completed`, `accepted`, `closed`, `cancelled`.
**How to avoid:** Migration 00008 must alter the requests status CHECK to add `pending_acceptance`. Also update `STATUS_LABELS` in `lib/constants/request-status.ts` and `Request` type in `lib/types/database.ts`.
**Warning signs:** Supabase insert/update error on status field.

### Pitfall 3: Job status "pending_approval" missing from jobs CHECK constraint
**What goes wrong:** Setting `jobs.status = 'pending_approval'` fails.
**Why it happens:** The current jobs table CHECK is: `('created', 'assigned', 'in_progress', 'completed', 'cancelled')`. `pending_approval` is missing.
**How to avoid:** Migration 00008 must alter the jobs status CHECK to add `pending_approval`.

### Pitfall 4: Auto-accept running on requests with null completed_at
**What goes wrong:** Requests that never had a job completed get auto-accepted prematurely.
**Why it happens:** If status got set to `pending_acceptance` without setting `completed_at`.
**How to avoid:** Always set `completed_at = now()` when transitioning job to `completed`. Guard the cron function with `completed_at IS NOT NULL`.

### Pitfall 5: Approval threshold check only on frontend
**What goes wrong:** User manually sets a job's status to `pending_approval` via API even when cost is below threshold, or the threshold changes after the form renders.
**Why it happens:** Only validating in the UI form.
**How to avoid:** Server action for `submitForApproval` must re-fetch `company_settings` and validate `estimated_cost >= budget_threshold` before allowing status transition.

### Pitfall 6: Comment permissions not enforced server-side
**What goes wrong:** Any authenticated user can POST a comment by calling the action directly.
**Why it happens:** Only hiding the UI for non-GA users.
**How to avoid:** The `addJobComment` server action must verify: `profile.role in ['ga_lead', 'admin']` OR `profile.id === job.assigned_to`.

### Pitfall 7: Linked request status not updated when job is cancelled
**What goes wrong:** Linked requests remain in `in_progress` after job cancellation, leaving them stuck.
**Why it happens:** Only updating job status without cascading to linked requests.
**How to avoid:** `cancelJob` server action must also update all linked requests (via `job_requests`) back to `triaged` status.

### Pitfall 8: Priority auto-calculation on multi-request jobs
**What goes wrong:** Priority not recalculated when a second request is linked whose priority is higher.
**Why it happens:** Priority only set at job creation.
**How to avoid:** On the job form, when requests are added/removed, recalculate the max priority client-side and set it in the priority field. On save, the server action also re-computes from the linked request IDs.

---

## Code Examples

Verified patterns from existing codebase and official docs:

### Zod schema for job creation
```typescript
// lib/validations/job-schema.ts
import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(1000),
  location_id: z.string().uuid({ message: 'Location is required' }),
  category_id: z.string().uuid({ message: 'Category is required' }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigned_to: z.string().uuid({ message: 'PIC is required' }).optional(),
  estimated_cost: z.number().min(0).optional(),
  linked_request_ids: z.array(z.string().uuid()).default([]),
});

export const jobCommentSchema = z.object({
  job_id: z.string().uuid(),
  content: z.string().min(1).max(1000),
  // photo handled separately via upload API
});

export const approvalDecisionSchema = z.object({
  job_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().max(1000).optional(), // required when rejected
}).refine(data => data.decision === 'approved' || (data.reason && data.reason.length > 0), {
  message: 'Rejection reason is required',
  path: ['reason'],
});

export const acceptanceSchema = z.object({
  request_id: z.string().uuid(),
  decision: z.enum(['accepted', 'rejected']),
  reason: z.string().max(1000).optional(), // required when rejected
});

export const feedbackSchema = z.object({
  request_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(200).optional(),
});

export const companySettingsSchema = z.object({
  budget_threshold: z.number().int().min(0).max(999_999_999_999),
});
```

### Job status constants (mirror of request-status.ts)
```typescript
// lib/constants/job-status.ts
export const JOB_STATUS_LABELS: Record<string, string> = {
  created: 'Created',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending_approval: 'Pending Approval',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const JOB_STATUS_COLORS: Record<string, string> = {
  created: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  pending_approval: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};
```

### pg_cron auto-accept function (full SQL)
```sql
-- Source: Supabase pg_cron docs (cron.schedule pattern)
CREATE OR REPLACE FUNCTION public.auto_accept_completed_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.requests
  SET
    status = 'completed',
    accepted_at = now(),
    auto_accepted = true,
    updated_at = now()
  WHERE
    status = 'pending_acceptance'
    AND completed_at IS NOT NULL
    AND completed_at < now() - INTERVAL '7 days'
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log to audit_logs if any were auto-accepted
  -- (The audit trigger handles this automatically via UPDATE trigger)
END;
$$;

-- Enable pg_cron extension (if not already enabled — check Dashboard first)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: daily at 01:00 UTC
SELECT cron.schedule(
  'auto-accept-completed-requests',
  '0 1 * * *',
  'SELECT public.auto_accept_completed_requests()'
);
```

### IDR currency formatting (existing project pattern)
```typescript
// Matches REQ-DATA-004 and CLAUDE.md IDR formatting rule
export function formatIDR(amount: number | null): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  // Output: "Rp 5.000.000"
}
```

### Multi-request join table query
```typescript
// Supabase JS v2 — querying many-to-many via join table
const { data: job } = await supabase
  .from('jobs')
  .select(`
    *,
    location:locations(name),
    category:categories(name),
    pic:user_profiles!assigned_to(name:full_name),
    job_requests(
      request:requests(
        id, display_id, title, status,
        requester:user_profiles!requester_id(name:full_name)
      )
    )
  `)
  .eq('id', jobId)
  .is('deleted_at', null)
  .single();
```

### Inline star rating component (no dependencies)
```tsx
// components/requests/feedback-star-rating.tsx
'use client';
import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, readOnly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          className="disabled:cursor-default"
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `jobs.request_id` single FK | `job_requests` join table | Required for multi-request linking; schema migration needed |
| `status = 'accepted'` on requests | `status = 'pending_acceptance'` then `'completed'` | Clearer flow — "pending_acceptance" indicates awaiting requester action |
| Manual cron scripts | Supabase pg_cron built-in | Zero infrastructure — scheduled PLPGSQL runs inside Postgres |

**Deprecated/outdated:**
- `jobs.request_id`: The existing single FK column was provisioned in Phase 1 for simple 1:1 cases. Phase 5 supersedes it with the join table for the multi-link requirement. The column stays on the table for PM job backward compatibility but new request links go through `job_requests`.

---

## Critical Schema Changes Required (Migration 00008)

These are the schema changes the planner must include as Wave 0 tasks:

1. **Alter `jobs` status CHECK** — add `pending_approval`:
   ```sql
   ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
   ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
     CHECK (status IN ('created', 'assigned', 'in_progress', 'pending_approval', 'completed', 'cancelled'));
   ```

2. **Alter `requests` status CHECK** — add `pending_acceptance`:
   ```sql
   ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;
   ALTER TABLE public.requests ADD CONSTRAINT requests_status_check
     CHECK (status IN ('submitted', 'triaged', 'in_progress', 'pending_approval', 'approved',
                       'rejected', 'completed', 'pending_acceptance', 'accepted', 'closed', 'cancelled'));
   ```

3. **Create `job_requests` join table**:
   ```sql
   CREATE TABLE public.job_requests (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     job_id uuid NOT NULL REFERENCES public.jobs(id),
     request_id uuid NOT NULL REFERENCES public.requests(id),
     linked_at timestamptz DEFAULT now(),
     linked_by uuid REFERENCES public.user_profiles(id),
     UNIQUE (job_id, request_id)
   );
   CREATE INDEX idx_job_requests_job ON public.job_requests (job_id);
   CREATE INDEX idx_job_requests_request ON public.job_requests (request_id);
   ```

4. **Create `company_settings` table**:
   ```sql
   CREATE TABLE public.company_settings (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     company_id uuid NOT NULL REFERENCES public.companies(id),
     key text NOT NULL,
     value text NOT NULL,
     updated_by uuid REFERENCES public.user_profiles(id),
     created_at timestamptz DEFAULT now(),
     updated_at timestamptz DEFAULT now(),
     UNIQUE (company_id, key)
   );
   -- RLS: company-scoped read for all, write for admin only
   CREATE INDEX idx_company_settings_company ON public.company_settings (company_id);
   ```

5. **Add job approval columns** (if not already present):
   ```sql
   ALTER TABLE public.jobs
     ADD COLUMN IF NOT EXISTS approval_submitted_at timestamptz,
     ADD COLUMN IF NOT EXISTS approved_at timestamptz,
     ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.user_profiles(id),
     ADD COLUMN IF NOT EXISTS approval_rejected_at timestamptz,
     ADD COLUMN IF NOT EXISTS approval_rejected_by uuid REFERENCES public.user_profiles(id),
     ADD COLUMN IF NOT EXISTS approval_rejection_reason text;
   ```

6. **Create `generate_job_display_id` RPC** (mirror of `generate_request_display_id`):
   ```sql
   CREATE OR REPLACE FUNCTION public.generate_job_display_id(p_company_id uuid)
   RETURNS text
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   AS $$
   DECLARE
     v_next_value bigint;
     v_year_key text;
   BEGIN
     v_year_key := TO_CHAR(NOW(), 'YY');
     UPDATE public.id_counters
     SET current_value = current_value + 1, updated_at = now()
     WHERE company_id = p_company_id AND entity_type = 'job_' || v_year_key
     RETURNING current_value INTO v_next_value;
     IF NOT FOUND THEN
       INSERT INTO public.id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
       VALUES (gen_random_uuid(), p_company_id, 'job_' || v_year_key, 'JOB', 1, 'yearly')
       RETURNING current_value INTO v_next_value;
     END IF;
     RETURN 'JOB-' || v_year_key || '-' || LPAD(v_next_value::text, 4, '0');
   END;
   $$;
   ```

7. **Register pg_cron job** (in migration or Dashboard):
   ```sql
   SELECT cron.schedule(
     'auto-accept-completed-requests',
     '0 1 * * *',
     'SELECT public.auto_accept_completed_requests()'
   );
   ```

8. **Storage bucket for job comment photos** (mirror of request-photos):
   ```sql
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES ('job-photos', 'job-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
   ON CONFLICT (id) DO NOTHING;
   ```

---

## Open Questions

1. **pg_cron already enabled on project Supabase instance?**
   - What we know: pg_cron is available on all Supabase plans (confirmed by Supabase maintainer)
   - What's unclear: Whether the current project instance has pg_cron enabled in the Extensions dashboard
   - Recommendation: Wave 0 task should include "verify pg_cron is enabled in Supabase Dashboard → Database → Extensions" before writing the cron migration

2. **`requests.accepted` vs `requests.completed` — final state naming**
   - What we know: The schema has `accepted` status and `completed` status. The CONTEXT.md says "Accepted requests move to 'Completed' status (final state)." The existing status CHECK has both.
   - What's unclear: Should the final state after requester acceptance be `accepted` or `completed`? The flow described is: Pending Acceptance → Completed (per CONTEXT.md) — but this conflicts with `accepted` status on the existing type.
   - Recommendation: Use `accepted` as the final state after requester acceptance (matches existing schema and type), and treat the CONTEXT.md "Completed" as the user-facing label. Update STATUS_LABELS accordingly. Or confirm with user during planning.

3. **RLS policy for job_requests join table**
   - What we know: All existing join-like tables use `company_id` as isolation column
   - What's unclear: `job_requests` has no `company_id` directly — needs to inherit from parent `jobs` or explicitly join
   - Recommendation: Add `company_id` to `job_requests` for consistent RLS pattern (copy from parent job at insert time), OR use a RLS policy that checks via join: `EXISTS (SELECT 1 FROM jobs WHERE id = job_requests.job_id AND company_id = current_user_company_id())`

4. **Navigation for approval queue**
   - What we know: finance_approver role needs a dedicated page
   - What's unclear: Is the approvals link always visible to finance_approver, or conditionally shown only when items are pending?
   - Recommendation: Always show in sidebar for finance_approver role (even when empty); the queue page shows an empty state when no pending items

---

## Sources

### Primary (HIGH confidence)
- Supabase pg_cron docs — `cron.schedule()` syntax, DB function calling pattern
- Supabase GitHub Discussion #37405 — pg_cron availability on free tier (confirmed by Supabase maintainer: "Cron is only limited by the resources it uses CPU/Memory/Disk wise on any tier")
- Vercel Cron Jobs docs — plan limits (Hobby: once/day; Pro: per-minute)
- next-safe-action Context7 (`/theedoran/next-safe-action`) — middleware chaining patterns
- Existing codebase (`supabase/migrations/00001_initial_schema.sql`) — jobs, job_comments, requests, media_attachments schema
- Existing codebase (`app/actions/request-actions.ts`) — server action patterns
- Existing codebase (`components/requests/request-timeline.tsx`) — timeline event pattern

### Secondary (MEDIUM confidence)
- shadcnblocks.com rating component examples — star rating with Lucide icons pattern (verified consistent with Lucide Star icon available in project)
- WebSearch: Supabase many-to-many join table patterns

### Tertiary (LOW confidence)
- None — all critical findings verified with primary sources

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in project, no new deps
- Architecture: HIGH — mirrors Phase 4 request module exactly; schema gaps confirmed by direct code reading
- Pitfalls: HIGH — identified by direct schema inspection (not assumptions)
- pg_cron: HIGH — confirmed by Supabase maintainer comment, official docs pattern

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (30 days — stable stack)
