# Phase 7: Preventive Maintenance - Research

**Researched:** 2026-02-24
**Domain:** Preventive maintenance templates, schedules, cron-based job generation, JSONB form builder
**Confidence:** HIGH

## Summary

Phase 7 builds a preventive maintenance system on top of existing database tables (`maintenance_templates`, `maintenance_schedules`) and the jobs infrastructure from Phase 5. The core challenge is threefold: (1) a template builder UI with 6 checklist item types and drag-and-drop reordering, (2) schedule configuration with fixed/floating interval logic including auto-pause/resume tied to asset status changes, and (3) a daily cron job that auto-generates PM jobs with deduplication.

The database schema is already in place from Phase 1 -- `maintenance_templates` (with JSONB `checklist` column), `maintenance_schedules` (with `interval_days`, `interval_type`, `next_due_at`, `is_paused`, `paused_at`), and `jobs` (with `job_type = 'preventive_maintenance'` and `maintenance_schedule_id` FK). RLS policies, audit triggers, and indexes also exist. The work is primarily UI, server actions, and the cron job function.

**Primary recommendation:** Use `@dnd-kit/core` + `@dnd-kit/sortable` (stable, production-proven) for drag-and-drop reordering, store checklist definitions as typed JSONB arrays in `maintenance_templates.checklist`, store completed checklist responses as JSONB on the PM job, and implement the daily cron via `pg_cron` calling a `SECURITY DEFINER` SQL function directly (no Edge Function needed).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Type-specific "Add" buttons for each field type: + Checkbox, + Pass/Fail, + Numeric, + Text, + Photo, + Dropdown
- Drag-and-drop reordering of checklist items
- Dropdown options configured via add/remove chips UX
- Numeric fields: free numeric input, no min/max range validation
- All checklist items are required when filling out a PM job (no per-item required toggle)
- Template has required name + optional description
- Template linked to a category via dropdown on creation (shared categories from admin)
- Templates can be edited freely; future auto-generated PM jobs use the latest version; completed jobs keep their original checklist
- Templates can be deactivated but not deleted; prevents orphaned schedules
- Lives under a new top-level "Maintenance" nav section (with sub-items: Templates, Schedules)
- Template list shows: name, category, item count, created date -- click to see full details
- GA Lead only can create/edit/deactivate templates
- Both entry points: create schedule from template detail page OR from asset detail page
- Schedule form: select template (filtered by category), select asset (filtered by category), set interval in days, toggle fixed/floating (default: floating), optional start date
- Inline help text on toggle: Fixed = every N days from start date; Floating = N days after last completion
- GA Lead can manually activate/deactivate schedules (independent of asset status auto-pause)
- Schedules can be soft-deleted; historical PM jobs generated from it remain
- No default PIC on schedule -- GA Lead assigns each auto-generated PM job manually
- Schedule shows next due date and last completed date (both visible on list and detail)
- Dedicated page under "Maintenance" nav section
- Columns: template name, asset name, interval (days), type (fixed/floating), status (Active/Paused/Deactivated), next due date
- Asset detail page also shows a "Maintenance Schedules" section listing linked schedules
- PM jobs have a "PM" type badge/tag in the job list and on the job detail page
- Auto-generated title format: "[Template Name] - [Asset Name]"
- Jobs created without an assignee -- GA Lead assigns PIC manually
- Checklist appears inline on the PM job detail page; PIC fills it out item by item with save-as-you-go
- Deduplication: cron skips generation if previous PM job from same schedule is still open
- Overdue PM jobs: red "Overdue" badge on the job list and job detail page header
- Auto-pause on Broken/Under Repair: schedules auto-pause; inline message shown after status change
- Auto-resume on Active: schedules auto-resume when asset returns to Active; inline message shown
- Resume calculation: next due date = resume date + interval (fresh start, time during pause does not count)
- Sold/Disposed (terminal): schedules are permanently deactivated (not just paused)
- Open PM jobs on pause: open PM jobs (Assigned or In Progress) for paused schedules are automatically cancelled
- Schedule status display: Active, Paused (auto), Paused (manual), Deactivated -- distinguishes auto vs manual pause

### Claude's Discretion
- Template builder component implementation and styling
- Drag-and-drop library choice
- Cron job implementation details (Supabase pg_cron, edge function, etc.)
- Checklist completion progress indicator design
- Overdue calculation logic (when exactly a PM becomes "overdue")
- Schedule form layout and validation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-PM-001 | Category-specific maintenance templates (linear form builder) | JSONB checklist column on existing `maintenance_templates` table; template builder UI with type-specific add buttons; category dropdown filtering asset categories |
| REQ-PM-002 | Template checklist item types: checkbox, pass/fail, numeric, text, photo, dropdown | TypeScript discriminated union for 6 item types stored in JSONB; each type has specific `value` shape in completion data |
| REQ-PM-003 | Multiple templates allowed per asset category | No unique constraint on (category_id) in `maintenance_templates` -- multiple templates per category supported by schema |
| REQ-PM-004 | Maintenance schedule: assign template to asset with interval (days) | `maintenance_schedules` table with `template_id`, `item_id`, `interval_days`; schedule form with category-filtered template and asset dropdowns |
| REQ-PM-005 | Fixed and floating interval support (default: floating) | `interval_type` column (fixed/floating); cron job calculates `next_due_at` differently per type; floating recalculates from `last_completed_at`, fixed from `created_at`/`start_date` |
| REQ-PM-006 | Auto-generate jobs from schedules (daily cron) | `pg_cron` calling a `SECURITY DEFINER` SQL function daily; function queries due schedules, inserts jobs with `job_type = 'preventive_maintenance'` |
| REQ-PM-007 | Auto-pause schedule when asset is broken or sold | Database trigger or server action hook on `inventory_items.status` change; updates `is_paused = true`, `paused_at = now()`, `paused_reason` |
| REQ-PM-008 | Resume schedule from pause date when asset is repaired | Server action hook recalculates `next_due_at = now() + interval_days`; clears `is_paused`, `paused_at` |
| REQ-PM-009 | Prevent duplicate job generation (skip if previous PM job still open) | Cron function checks `NOT EXISTS` open job from same `maintenance_schedule_id` before inserting |
| REQ-PM-010 | Overdue PM jobs flagged prominently | Overdue = `next_due_at < now()` AND job status not completed; red "Overdue" badge on job list and detail |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.3.1 | Drag-and-drop context and sensors | Production-stable (1yr+), extensive React ecosystem adoption, accessible by default |
| @dnd-kit/sortable | ^10.0.0 | Sortable list preset for checklist reordering | Built on @dnd-kit/core, provides `useSortable`, `arrayMove`, `verticalListSortingStrategy` |
| @dnd-kit/utilities | ^3.2.2 | CSS transform utilities | Companion package for `CSS.Transform.toString()` in sortable items |
| pg_cron (Supabase) | built-in | Daily PM job generation | Native Postgres extension, no Edge Function overhead, runs SQL directly |
| date-fns | ^4.1.0 | Date calculations for intervals/due dates | Already in project dependencies |
| zod | ^4.3.6 | Schema validation for templates and schedules | Already in project dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hook-form | ^7.71.1 | Template builder and schedule form state | Already in project, standard form pattern |
| next-safe-action | ^8.0.11 | Type-safe server actions | Already in project, authActionClient pattern |
| nuqs | ^2.8.8 | URL-synced filter state on list pages | Already in project, same pattern as request list |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit/core+sortable (stable) | @dnd-kit/react (v0.3.2) | New package is pre-1.0, API still evolving; classic packages are battle-tested |
| pg_cron direct SQL | pg_cron + Edge Function | Edge Function adds network hop, auth complexity; direct SQL is simpler for DB-only operations |
| JSONB checklist column | Separate `checklist_items` table | Normalized table adds query complexity for 6 field types; JSONB is simpler, items always loaded/saved together |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Architecture Patterns

### Recommended Project Structure
```
app/(dashboard)/
├── maintenance/
│   ├── page.tsx                          # Schedule list page (server component)
│   ├── templates/
│   │   ├── page.tsx                      # Template list page
│   │   ├── new/page.tsx                  # Create template page
│   │   └── [id]/page.tsx                 # Template detail/edit page
│   └── schedules/
│       ├── new/page.tsx                  # Create schedule page
│       └── [id]/page.tsx                 # Schedule detail page

app/actions/
├── template-actions.ts                   # CRUD for maintenance templates
├── schedule-actions.ts                   # CRUD for maintenance schedules
└── pm-job-actions.ts                     # PM job-specific actions (checklist save, etc.)

components/maintenance/
├── template-builder.tsx                  # Main template builder component
├── template-builder-item.tsx             # Sortable checklist item row
├── template-list.tsx                     # Template data table
├── template-columns.tsx                  # TanStack Table column definitions
├── template-detail.tsx                   # Template detail view
├── schedule-form.tsx                     # Schedule create/edit form
├── schedule-list.tsx                     # Schedule data table
├── schedule-columns.tsx                  # TanStack Table column definitions
├── schedule-status-badge.tsx             # Active/Paused(auto)/Paused(manual)/Deactivated badge
├── pm-checklist.tsx                      # Checklist fill-out component on PM job detail
├── pm-checklist-item.tsx                 # Individual checklist item renderer by type
└── overdue-badge.tsx                     # Red "Overdue" badge component

lib/
├── constants/
│   ├── schedule-status.ts                # Schedule status labels, colors
│   └── checklist-types.ts                # Checklist item type definitions
├── validations/
│   ├── template-schema.ts                # Zod schemas for template CRUD
│   └── schedule-schema.ts                # Zod schemas for schedule CRUD
└── types/
    └── maintenance.ts                    # TypeScript types for templates, schedules, checklist items

supabase/migrations/
└── 000XX_pm_phase7.sql                   # Migration: cron job function, schedule status column changes, RLS refinements
```

### Pattern 1: JSONB Checklist Item Schema (Discriminated Union)
**What:** Store checklist items as a typed JSONB array where each item has a `type` discriminator field
**When to use:** Template definition (what items to check) and PM job completion (responses to each item)

```typescript
// lib/types/maintenance.ts

// Template checklist item definition (stored in maintenance_templates.checklist)
type ChecklistItemBase = {
  id: string;          // UUID for stable identity during reordering
  label: string;       // Display label (e.g., "Check oil level")
  sort_order: number;  // Position in list
};

type CheckboxItem = ChecklistItemBase & { type: 'checkbox' };
type PassFailItem = ChecklistItemBase & { type: 'pass_fail' };
type NumericItem = ChecklistItemBase & { type: 'numeric'; unit?: string };
type TextItem = ChecklistItemBase & { type: 'text' };
type PhotoItem = ChecklistItemBase & { type: 'photo' };
type DropdownItem = ChecklistItemBase & { type: 'dropdown'; options: string[] };

type ChecklistItem =
  | CheckboxItem
  | PassFailItem
  | NumericItem
  | TextItem
  | PhotoItem
  | DropdownItem;

// PM job completion data (stored on the job, snapshot of template + responses)
type ChecklistResponse = {
  item_id: string;           // References ChecklistItem.id
  type: ChecklistItem['type'];
  label: string;             // Snapshot of label at time of completion
  value: boolean | 'pass' | 'fail' | number | string | string[] | null;
  completed_at?: string;     // ISO timestamp when this item was filled
};

type PMJobChecklist = {
  template_name: string;     // Snapshot
  template_id: string;       // Reference
  items: ChecklistResponse[];
};
```

### Pattern 2: Schedule Status State Machine
**What:** 4 distinct schedule statuses derived from DB fields, not a single status column
**When to use:** Display and business logic for schedule state

```typescript
// lib/constants/schedule-status.ts

// Derived from DB fields: is_paused, paused_reason, deleted_at, is_active (template)
type ScheduleDisplayStatus = 'active' | 'paused_auto' | 'paused_manual' | 'deactivated';

function getScheduleDisplayStatus(schedule: {
  is_paused: boolean;
  paused_reason: string | null;
  deleted_at: string | null;
}): ScheduleDisplayStatus {
  if (schedule.deleted_at) return 'deactivated';
  // Convention: paused_reason contains 'auto:' prefix for auto-pause
  if (schedule.is_paused && schedule.paused_reason?.startsWith('auto:')) return 'paused_auto';
  if (schedule.is_paused) return 'paused_manual';
  return 'active';
}
```

### Pattern 3: Cron Job as SECURITY DEFINER SQL Function
**What:** A PostgreSQL function that generates PM jobs, called by pg_cron daily
**When to use:** Auto-generation of PM jobs from due schedules
**Why SECURITY DEFINER:** The cron runs as the `postgres` superuser, but wrapping logic in a function keeps it clean, testable, and auditable

```sql
-- Called daily by pg_cron at e.g., 00:05 UTC
CREATE OR REPLACE FUNCTION public.generate_pm_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_schedule RECORD;
  v_display_id text;
BEGIN
  FOR v_schedule IN
    SELECT
      ms.id AS schedule_id,
      ms.company_id,
      ms.item_id,
      ms.template_id,
      ms.interval_days,
      ms.interval_type,
      ms.next_due_at,
      mt.name AS template_name,
      ii.name AS asset_name,
      mt.checklist
    FROM maintenance_schedules ms
    JOIN maintenance_templates mt ON mt.id = ms.template_id
    JOIN inventory_items ii ON ii.id = ms.item_id
    WHERE ms.deleted_at IS NULL
      AND ms.is_paused = false
      AND mt.is_active = true
      AND ms.next_due_at <= now()
      -- Deduplication: skip if open PM job exists for this schedule
      AND NOT EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.maintenance_schedule_id = ms.id
          AND j.deleted_at IS NULL
          AND j.status NOT IN ('completed', 'cancelled')
      )
  LOOP
    -- Generate display ID
    v_display_id := generate_display_id(v_schedule.company_id, 'job', 'JOB');

    -- Insert PM job
    INSERT INTO jobs (
      company_id, display_id, title, job_type,
      maintenance_schedule_id, status, created_by
    ) VALUES (
      v_schedule.company_id,
      v_display_id,
      v_schedule.template_name || ' - ' || v_schedule.asset_name,
      'preventive_maintenance',
      v_schedule.schedule_id,
      'created',
      -- Use a system user or the schedule creator; details TBD in implementation
      (SELECT id FROM user_profiles WHERE company_id = v_schedule.company_id AND role = 'ga_lead' LIMIT 1)
    );

    -- Update schedule: advance next_due_at based on interval type
    IF v_schedule.interval_type = 'fixed' THEN
      -- Fixed: advance from current next_due_at
      UPDATE maintenance_schedules
      SET next_due_at = v_schedule.next_due_at + (v_schedule.interval_days || ' days')::interval
      WHERE id = v_schedule.schedule_id;
    END IF;
    -- Floating: next_due_at updated when job is COMPLETED (not here)
  END LOOP;
END;
$$;

-- Schedule with pg_cron (run daily at 00:05 UTC)
SELECT cron.schedule('generate-pm-jobs', '5 0 * * *', 'SELECT generate_pm_jobs()');
```

### Pattern 4: Template Builder with dnd-kit Sortable
**What:** React component using @dnd-kit/sortable for reorderable checklist items
**When to use:** Template create/edit pages

```typescript
// Simplified pattern for template builder
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

function TemplateBuilder({ items, onItemsChange }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      onItemsChange(arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
        ...item,
        sort_order: idx,
      })));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableChecklistItem key={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Pattern 5: Auto-Pause/Resume via Server Action Hooks
**What:** When asset status changes in Phase 6, linked maintenance schedules are auto-paused/resumed
**When to use:** Asset status change action (in Phase 6 code, extended by Phase 7)

```typescript
// Inside the asset status change server action (Phase 6)
// After updating inventory_items.status:

if (['broken', 'under_repair'].includes(newStatus)) {
  // Auto-pause all active schedules for this asset
  const { data: pausedSchedules } = await supabase
    .from('maintenance_schedules')
    .update({
      is_paused: true,
      paused_at: new Date().toISOString(),
      paused_reason: `auto:asset_${newStatus}`,
    })
    .eq('item_id', assetId)
    .eq('is_paused', false)
    .is('deleted_at', null)
    .select('id');

  // Cancel open PM jobs for paused schedules
  if (pausedSchedules?.length) {
    const scheduleIds = pausedSchedules.map(s => s.id);
    await supabase
      .from('jobs')
      .update({ status: 'cancelled' })
      .in('maintenance_schedule_id', scheduleIds)
      .in('status', ['created', 'assigned', 'in_progress']);
  }
}

if (newStatus === 'active' && previousStatus !== 'active') {
  // Auto-resume schedules that were auto-paused
  await supabase
    .from('maintenance_schedules')
    .update({
      is_paused: false,
      paused_at: null,
      paused_reason: null,
      next_due_at: new Date(Date.now() + schedule.interval_days * 86400000).toISOString(),
    })
    .eq('item_id', assetId)
    .like('paused_reason', 'auto:%')
    .is('deleted_at', null);
}

if (['sold', 'disposed'].includes(newStatus)) {
  // Permanently deactivate (soft-delete) all schedules
  await supabase
    .from('maintenance_schedules')
    .update({ deleted_at: new Date().toISOString() })
    .eq('item_id', assetId)
    .is('deleted_at', null);
}
```

### Pattern 6: PM Job Checklist Completion (Save-as-you-go)
**What:** Store checklist responses on the PM job as JSONB, auto-saving each item independently
**When to use:** PM job detail page when PIC fills out the checklist

```typescript
// Server action: save a single checklist item response
export const savePMChecklistItem = authActionClient
  .schema(z.object({
    jobId: z.string().uuid(),
    itemId: z.string(),
    value: z.union([z.boolean(), z.string(), z.number(), z.null()]),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase } = ctx;

    // Fetch current checklist_responses from the job
    const { data: job } = await supabase
      .from('jobs')
      .select('id, checklist_responses')
      .eq('id', parsedInput.jobId)
      .single();

    // Update the specific item's value in the JSONB array
    const responses = (job?.checklist_responses || []) as ChecklistResponse[];
    const idx = responses.findIndex(r => r.item_id === parsedInput.itemId);
    if (idx >= 0) {
      responses[idx].value = parsedInput.value;
      responses[idx].completed_at = new Date().toISOString();
    }

    await supabase
      .from('jobs')
      .update({ checklist_responses: responses })
      .eq('id', parsedInput.jobId);

    return { success: true };
  });
```

### Anti-Patterns to Avoid
- **Storing checklist items in a separate table:** Creates N+1 query complexity for 6 field types with varying schemas. JSONB keeps template definition self-contained.
- **Using Edge Functions for cron:** Adds unnecessary network hop and auth complexity when the cron only needs to run SQL queries. Direct `pg_cron` + SQL function is simpler and faster.
- **Recalculating floating interval in the cron job:** Floating interval `next_due_at` should only be updated when the PM job is marked completed, not in the cron. The cron only generates jobs and advances fixed schedules.
- **Using @dnd-kit/react (v0.3.2):** Pre-1.0 package with unstable API. Use the classic `@dnd-kit/core` + `@dnd-kit/sortable` which are stable and well-documented.
- **Single status column for schedule state:** The 4 states (Active, Paused auto, Paused manual, Deactivated) are better derived from `is_paused`, `paused_reason`, and `deleted_at` fields rather than adding a new enum column. This avoids state synchronization issues.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sortable list reordering | Custom drag handlers with mousedown/touchstart events | @dnd-kit/sortable | Keyboard accessibility, touch support, collision detection, smooth animations -- 100+ edge cases |
| Cron scheduling | Node.js setInterval or external cron service | pg_cron (Supabase built-in) | Runs in-database, no cold start, no separate infrastructure, survives server restarts |
| JSONB array item updates | Manual JSON string manipulation | Supabase JSONB operators or full-replace pattern | PostgreSQL has native JSONB operators; for checklist save-as-you-go, fetch-modify-replace pattern is clearest |
| Form state for dynamic items | Manual useState arrays | react-hook-form useFieldArray | Handles add/remove/reorder with proper validation state management |

**Key insight:** The template builder is the most complex UI component but is fundamentally a sortable list with type-specific configuration per item. Using @dnd-kit/sortable reduces this to a known, well-tested pattern.

## Common Pitfalls

### Pitfall 1: Completed PM Jobs Losing Their Checklist Definition
**What goes wrong:** Template is edited after PM job is generated; completed job's checklist no longer matches the template
**Why it happens:** If PM job only stores responses (values) and references the template for labels/types, editing the template corrupts historical data
**How to avoid:** When generating a PM job, snapshot the entire checklist definition into the job record. Store both the template definition (items with labels/types) AND responses together in the job's JSONB column.
**Warning signs:** Completed PM jobs showing blank labels or mismatched field types

### Pitfall 2: Floating Interval Advancing in the Wrong Place
**What goes wrong:** Floating schedule's `next_due_at` is advanced by the cron job, causing it to calculate from the generation date rather than the completion date
**Why it happens:** Confusion between fixed (advance from due date) and floating (advance from completion date) logic
**How to avoid:** Cron job only advances `next_due_at` for FIXED schedules. For FLOATING schedules, `next_due_at` is only updated when the PM job is marked as completed (in the job completion server action).
**Warning signs:** Floating schedules generating new jobs immediately after a late completion

### Pitfall 3: Race Condition in Deduplication Check
**What goes wrong:** Two cron runs (or rapid manual triggers) generate duplicate PM jobs for the same schedule
**Why it happens:** The `NOT EXISTS` check and the `INSERT` are not atomic in a simple implementation
**How to avoid:** The `generate_pm_jobs()` function runs as a single transaction. pg_cron guarantees serial execution of the same job. Additionally, add a unique partial index: `CREATE UNIQUE INDEX idx_jobs_schedule_open ON jobs (maintenance_schedule_id) WHERE deleted_at IS NULL AND status NOT IN ('completed', 'cancelled')`.
**Warning signs:** Multiple open PM jobs for the same schedule appearing in the job list

### Pitfall 4: Auto-Pause Not Cancelling Open PM Jobs
**What goes wrong:** Asset is marked broken, schedules are paused, but the PM job that was already generated remains open and assignable
**Why it happens:** Only pausing the schedule without addressing already-generated jobs
**How to avoid:** When auto-pausing schedules, also cancel all open PM jobs (status IN created, assigned, in_progress) linked to those schedules. The CONTEXT.md explicitly requires this.
**Warning signs:** PIC working on a PM job for a broken asset

### Pitfall 5: Schedule Status Display Inconsistency
**What goes wrong:** UI shows "Active" for a schedule that should be "Paused (auto)" or vice versa
**Why it happens:** Deriving display status from multiple fields (is_paused, paused_reason, deleted_at) without a consistent helper function
**How to avoid:** Create a single `getScheduleDisplayStatus()` utility used everywhere. Distinguish auto vs manual pause via `paused_reason` prefix convention (e.g., `auto:asset_broken`).
**Warning signs:** Schedule list showing different status than schedule detail page

### Pitfall 6: Overdue Calculation Ambiguity
**What goes wrong:** PM jobs are flagged "Overdue" at inconsistent times
**Why it happens:** Unclear definition of when a PM becomes overdue
**How to avoid:** Define clearly: a PM job is "Overdue" when `maintenance_schedules.next_due_at < now()` AND the linked job status is NOT completed/cancelled. The overdue badge goes on the **job**, not the schedule. Calculate at display time by comparing the schedule's `next_due_at` against current time.
**Warning signs:** Jobs showing overdue immediately after creation

### Pitfall 7: Category Filtering Mismatch Between Template and Asset
**What goes wrong:** Schedule links a template for category "Vehicles" to an asset in category "Electronics"
**Why it happens:** Schedule form doesn't enforce template-asset category matching
**How to avoid:** On the schedule form, when a template is selected, filter the asset dropdown to only show assets matching that template's category (and vice versa). Validate on the server side too.
**Warning signs:** PM checklists that make no sense for the assigned asset

## Code Examples

### Checklist Item JSONB Schema (Zod Validation)
```typescript
// lib/validations/template-schema.ts
import { z } from 'zod';

const checklistItemBase = z.object({
  id: z.string().uuid(),
  label: z.string().min(1, 'Label is required').max(200),
  sort_order: z.number().int().min(0),
});

const checkboxItem = checklistItemBase.extend({ type: z.literal('checkbox') });
const passFailItem = checklistItemBase.extend({ type: z.literal('pass_fail') });
const numericItem = checklistItemBase.extend({ type: z.literal('numeric'), unit: z.string().max(20).optional() });
const textItem = checklistItemBase.extend({ type: z.literal('text') });
const photoItem = checklistItemBase.extend({ type: z.literal('photo') });
const dropdownItem = checklistItemBase.extend({
  type: z.literal('dropdown'),
  options: z.array(z.string().max(100)).min(1, 'At least one option required').max(20),
});

export const checklistItemSchema = z.discriminatedUnion('type', [
  checkboxItem, passFailItem, numericItem, textItem, photoItem, dropdownItem,
]);

export const templateCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(200).optional(),
  category_id: z.string().uuid({ message: 'Category is required' }),
  checklist: z.array(checklistItemSchema).min(1, 'At least one checklist item required'),
});

export const templateEditSchema = templateCreateSchema;

export type ChecklistItem = z.infer<typeof checklistItemSchema>;
export type TemplateCreateFormData = z.infer<typeof templateCreateSchema>;
```

### Schedule Validation Schema
```typescript
// lib/validations/schedule-schema.ts
import { z } from 'zod';

export const scheduleCreateSchema = z.object({
  template_id: z.string().uuid({ message: 'Template is required' }),
  item_id: z.string().uuid({ message: 'Asset is required' }),
  interval_days: z.number().int().min(1, 'Minimum 1 day').max(365, 'Maximum 365 days'),
  interval_type: z.enum(['fixed', 'floating']).default('floating'),
  start_date: z.string().optional(), // ISO date string; if omitted, defaults to now()
});

export type ScheduleCreateFormData = z.infer<typeof scheduleCreateSchema>;
```

### Database Migration: New Columns and Cron Job
```sql
-- Migration: Phase 7 PM additions

-- Add checklist_responses to jobs table for PM completion data
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS checklist_responses jsonb DEFAULT NULL;

-- Add schedule_status to maintenance_schedules for manual deactivation tracking
-- (is_paused covers pause; this distinguishes manual deactivation from soft-delete)
-- Actually: per CONTEXT.md, manual deactivation is distinct from soft-delete and from pause
-- We need a way to track: GA Lead manually deactivated vs system auto-paused
-- Current fields handle this: is_paused + paused_reason for pause; deleted_at for deactivation
-- But CONTEXT says "GA Lead can manually activate/deactivate schedules (independent of auto-pause)"
-- So we need a separate is_active field for manual deactivation
ALTER TABLE public.maintenance_schedules
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Unique partial index to prevent duplicate open PM jobs per schedule
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_schedule_open_unique
  ON public.jobs (maintenance_schedule_id)
  WHERE deleted_at IS NULL AND status NOT IN ('completed', 'cancelled')
    AND maintenance_schedule_id IS NOT NULL;

-- Index for overdue PM job queries
CREATE INDEX IF NOT EXISTS idx_jobs_pm_type
  ON public.jobs (job_type, status)
  WHERE deleted_at IS NULL AND job_type = 'preventive_maintenance';

-- The generate_pm_jobs function (see Architecture Patterns, Pattern 3 above)
-- Scheduled via: SELECT cron.schedule('generate-pm-jobs', '5 0 * * *', 'SELECT generate_pm_jobs()');
```

### RLS Policy Refinements for Phase 7
```sql
-- Maintenance templates: only ga_lead and admin can INSERT/UPDATE
DROP POLICY IF EXISTS "maintenance_templates_insert" ON public.maintenance_templates;
DROP POLICY IF EXISTS "maintenance_templates_update" ON public.maintenance_templates;

CREATE POLICY "maintenance_templates_insert_ga_lead" ON public.maintenance_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_role() IN ('ga_lead', 'admin')
  );

CREATE POLICY "maintenance_templates_update_ga_lead" ON public.maintenance_templates
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_role() IN ('ga_lead', 'admin')
  )
  WITH CHECK (company_id = public.current_user_company_id());

-- Maintenance schedules: only ga_lead and admin can INSERT/UPDATE
DROP POLICY IF EXISTS "maintenance_schedules_insert" ON public.maintenance_schedules;
DROP POLICY IF EXISTS "maintenance_schedules_update" ON public.maintenance_schedules;

CREATE POLICY "maintenance_schedules_insert_ga_lead" ON public.maintenance_schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.current_user_company_id()
    AND public.current_user_role() IN ('ga_lead', 'admin')
  );

CREATE POLICY "maintenance_schedules_update_ga_lead" ON public.maintenance_schedules
  FOR UPDATE TO authenticated
  USING (
    company_id = public.current_user_company_id()
    AND public.current_user_role() IN ('ga_lead', 'admin')
  )
  WITH CHECK (company_id = public.current_user_company_id());
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit/core + @dnd-kit/sortable | 2022+ | react-beautiful-dnd is unmaintained; dnd-kit is the React ecosystem standard |
| External cron services (AWS EventBridge, etc.) | pg_cron built into Supabase | 2024+ | No external infrastructure needed; runs inside database |
| Normalized checklist_items table | JSONB column with typed discriminated union | Current best practice | Simpler queries, no N+1, items always loaded together |

**Deprecated/outdated:**
- **react-beautiful-dnd:** Officially unmaintained, does not support React 19. Do not use.
- **@dnd-kit/react (v0.3.2):** Pre-1.0, still experimental. Not recommended for production yet.

## Open Questions

1. **PM Job `created_by` field in cron-generated jobs**
   - What we know: The cron function runs as `postgres` superuser, but `jobs.created_by` requires a valid `user_profiles.id`
   - What's unclear: Which user should be recorded as the creator of auto-generated PM jobs
   - Recommendation: Use the first `ga_lead` in the company as the creator, or create a dedicated "system" user profile per company. The planner should decide during implementation.

2. **`checklist_responses` JSONB column on `jobs` table**
   - What we know: Need to add this column; it doesn't exist yet in the schema
   - What's unclear: Whether to store the full template snapshot (items + responses) or just responses
   - Recommendation: Store the full snapshot (template name, items with labels/types, plus response values). This ensures completed PM jobs are self-contained and immune to template edits. Per CONTEXT.md: "completed jobs keep their original checklist."

3. **`is_active` field on `maintenance_schedules`**
   - What we know: CONTEXT.md says "GA Lead can manually activate/deactivate schedules (independent of asset status auto-pause)". Currently the schema only has `is_paused` and `deleted_at`.
   - What's unclear: Whether manual deactivation should use `deleted_at` (soft delete) or a separate `is_active` boolean
   - Recommendation: Add `is_active` boolean (default true). This keeps manual deactivation separate from soft-delete (which is permanent removal) and from auto-pause (which is `is_paused`). Schedule display status becomes: if `!is_active` -> Deactivated, if `is_paused && auto` -> Paused (auto), if `is_paused && manual` -> Paused (manual), else -> Active.

4. **Overdue badge timing**
   - What we know: PM jobs should show "Overdue" when past due
   - What's unclear: Exactly when the badge appears -- at `next_due_at` or some grace period after
   - Recommendation: Overdue = `next_due_at < now()` with no grace period. Simple, unambiguous. The schedule's `next_due_at` is the deadline; past it means overdue.

## Sources

### Primary (HIGH confidence)
- Context7 `/websites/dndkit` - dnd-kit sortable preset documentation, DndContext/SortableContext patterns, useSortable hook API
- Context7 `/websites/supabase` - pg_cron scheduling, cron.schedule() syntax, Edge Function invocation patterns
- Supabase official docs - [Cron overview](https://supabase.com/docs/guides/cron), [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart)
- Existing codebase - database schema (00001), RLS policies (00003, 00005), server action patterns, sidebar navigation, permission system

### Secondary (MEDIUM confidence)
- [NPM @dnd-kit/react](https://www.npmjs.com/package/@dnd-kit/react) - v0.3.2 version check, confirmed pre-1.0
- [NPM @dnd-kit/core](https://www.npmjs.com/package/@dnd-kit/core) - v6.3.1, stable
- [NPM @dnd-kit/sortable](https://www.npmjs.com/package/@dnd-kit/sortable) - v10.0.0, stable
- Supabase pg_cron extension docs - scheduling syntax, limitations (8 concurrent jobs, 10min max runtime)

### Tertiary (LOW confidence)
- General CMMS patterns for fixed vs floating interval PM scheduling - verified against CONTEXT.md user decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @dnd-kit packages are production-proven with millions of downloads; pg_cron is Supabase-native
- Architecture: HIGH - All database tables already exist; patterns follow established project conventions (server actions, data tables, Zod schemas)
- Pitfalls: HIGH - Pitfalls derived from domain analysis and CONTEXT.md requirements; checklist snapshot pattern is well-established

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable domain, no fast-moving dependencies)
