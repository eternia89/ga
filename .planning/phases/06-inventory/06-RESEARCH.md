# Phase 6: Inventory - Research

**Researched:** 2026-02-24
**Domain:** Asset registry management with status lifecycle, transfers, and condition photo documentation
**Confidence:** HIGH

## Summary

Phase 6 builds an asset registry system on top of established codebase patterns from Phases 3-4. The `inventory_items` and `inventory_movements` tables already exist in the Phase 1 schema but need schema migration to add fields required by CONTEXT.md decisions (brand, model, serial_number, acquisition_date) and to adjust the movement table for receiver acceptance/rejection workflow (receiver_id, rejection fields, condition photo associations).

The implementation closely mirrors the request management system (Phase 4): same data table pattern with TanStack Table + nuqs URL state for client-side filtering, same server action pattern with `authActionClient`, same photo upload via API route + `media_attachments` polymorphic table, same detail page layout (info panel + timeline), and same `generate_display_id` DB function pattern for AST-YYYY-NNNN IDs.

The key complexity unique to this phase is the transfer workflow: a multi-step process where the initiator creates a movement, the receiver accepts/rejects, and the asset's "In Transit" state is a transient indicator (not a DB status) derived from having a pending movement.

**Primary recommendation:** Follow established Phase 4 patterns exactly. The main technical risk is the schema migration (adding columns to existing tables), the transfer state machine (pending/in_transit/received/rejected/cancelled), and correctly coordinating photo uploads for four distinct event types (creation, status change, transfer initiation, transfer acceptance/rejection).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Required fields on creation:** name, category (shared categories from admin), location, status (defaults to Active)
- **Structured optional fields:** brand, model, serial number
- **Other optional fields:** description/notes, acquisition date, warranty expiry date (single date field only)
- **Condition photos:** required on creation, minimum 1, maximum 5
- **Invoice upload:** multiple files allowed (up to 5), accepts PDF, JPG, PNG
- **Duplicate names allowed** -- assets distinguished by unique AST-YYYY-NNNN ID
- **Permissions:** GA Staff + GA Lead can create and edit assets
- **No deletion:** Sold/Disposed is the terminal state; assets remain in the system for historical records
- **Statuses:** Active, Under Repair, Broken, Sold/Disposed
- **Transitions:** free transitions between Active, Under Repair, and Broken; Sold/Disposed is terminal and irreversible
- **Status change dialog:** clickable status badge on detail page opens dialog
- **Condition photos required on every status change** -- minimum 1, up to 5
- **Status change note:** optional text reason
- **No GPS capture** on status changes
- **Initiator:** any GA Staff or GA Lead can initiate a transfer for any asset
- **Receiver:** initiator selects a specific GA Staff/Lead as the receiver; that person must accept
- **Condition photos required on both sides:** sender uploads photos on initiation, receiver uploads photos on acceptance
- **In Transit indicator:** asset shows "In Transit" with origin, destination, and receiver while transfer is pending; asset cannot be transferred again until current transfer resolves
- **Receiver can reject** with required reason and photos -- rejection immediately clears "In Transit" state, asset returns to origin
- **Initiator can cancel** a pending transfer -- asset goes back to normal at origin
- **Transferable statuses:** any non-terminal status (Active, Under Repair, Broken) can be transferred
- **Incoming transfers:** no separate page; receivers see pending transfers via asset list filter/badge
- **Same data table pattern** as requests and jobs (columns, filters, sorting)
- **Columns:** ID, name, category, location, status, warranty expiry
- **Same detail page pattern** as request/job detail: full info panel at top + unified timeline below
- **Timeline:** Unified chronological timeline mixing status changes, transfers, and condition photos
- **Timeline entries show thumbnail photos**, clickable to open lightbox
- **Warranty expiry:** shown as simple text (no color-coded indicators)
- **Transfer action:** dedicated button on the detail page (not in a dropdown)
- **Status change:** via clickable status badge

### Claude's Discretion
- Asset form layout and field ordering
- Filter options on asset list (status, category, location filters)
- Timeline event styling and icons
- Transfer dialog layout
- Invoice viewer/preview implementation
- "In Transit" badge design and placement

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-INV-001 | Asset CRUD with auto-generated ID (AST-YYYY-NNNN) | generate_display_id pattern from Phase 4; schema migration adds missing fields; authActionClient pattern for server actions |
| REQ-INV-002 | Asset fields: name, category, location, status, warranty info, invoice | Schema migration adds brand/model/serial_number/acquisition_date columns; invoice via media_attachments (entity_type='asset_invoice') |
| REQ-INV-003 | Asset status lifecycle: Active -> Under Repair -> Broken -> Sold/Disposed | Status constants file + badge component; DB CHECK constraint migration; transition validation in server actions |
| REQ-INV-004 | Asset list with search, filters (status, category, location), and sorting | TanStack Table + nuqs URL state pattern from request-filters + request-table; client-side filtering |
| REQ-INV-005 | Asset detail page with movement history | Server component page + client wrapper pattern from request detail; audit_logs-based timeline with movement events |
| REQ-INV-006 | Movement tracking: transfer asset between locations | inventory_movements table + schema migration (add receiver_id, rejection fields); transfer dialog with location + receiver selection |
| REQ-INV-007 | Receiver acceptance workflow for asset movements | Transfer state machine (pending -> in_transit/received/rejected/cancelled); receiver photos on acceptance; concurrent transfer guard |
| REQ-INV-008 | Invoice upload for assets (PDF/image) | API route pattern from request-photos; new storage bucket 'asset-files'; media_attachments entity_type='asset_invoice'; PDF+image MIME types |
| REQ-INV-009 | Warranty info visible on asset detail (expiry date) | warranty_expiry date field already in schema; display as formatted text (dd-MM-yyyy) |
| REQ-INV-010 | Broken/sold status auto-pauses linked maintenance schedules | Server action on status change checks for linked maintenance_schedules; sets is_paused=true, paused_at, paused_reason |
| REQ-INV-011 | Condition images: upload photos to document asset condition (create, status change, movement) | media_attachments with distinct entity_types for each event; same photo upload component pattern; photos required on creation and status changes |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, server components, API routes | Already in project |
| React | 19.2.3 | UI rendering | Already in project |
| Supabase JS | 2.95.3 | Database queries, storage, auth | Already in project |
| TanStack Table | 8.21.3 | Data table state management | Already used in request list |
| next-safe-action | 8.0.11 | Type-safe server actions | Already used, authActionClient pattern |
| nuqs | 2.8.8 | URL-synced filter state | Already used in request filters |
| react-hook-form + zod | 7.71.1 / 4.3.6 | Form state + validation | Already used in all forms |
| date-fns | 4.1.0 | Date formatting (dd-MM-yyyy) | Already in project |
| lucide-react | 0.563.0 | Icons | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| cmdk | 1.1.1 | Combobox search (category, location, receiver selection) | Already wrapped in components/combobox.tsx |
| shadcn/ui | 3.8.4 | UI primitives (Dialog, Badge, ScrollArea) | Already in project |

### Alternatives Considered
None -- this phase uses exclusively established project patterns with no new library requirements.

**Installation:**
No new packages needed. All dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (dashboard)/
│   └── inventory/
│       ├── page.tsx                    # Asset list (server component)
│       ├── new/
│       │   └── page.tsx                # Create asset form (server component wrapper)
│       └── [id]/
│           └── page.tsx                # Asset detail (server component)
├── actions/
│   └── asset-actions.ts                # All asset server actions
├── api/
│   └── uploads/
│       ├── asset-photos/
│       │   └── route.ts                # Condition photo uploads
│       └── asset-invoices/
│           └── route.ts                # Invoice file uploads
components/
├── assets/
│   ├── asset-columns.tsx               # TanStack Table column defs
│   ├── asset-table.tsx                 # Data table with client-side filtering
│   ├── asset-filters.tsx               # Search + filter controls (nuqs)
│   ├── asset-status-badge.tsx          # Clickable status badge
│   ├── asset-submit-form.tsx           # Create asset form
│   ├── asset-edit-form.tsx             # Edit asset form
│   ├── asset-detail-client.tsx         # Client wrapper (coordinates state)
│   ├── asset-detail-info.tsx           # Info panel (read/edit mode)
│   ├── asset-status-change-dialog.tsx  # Status transition dialog
│   ├── asset-transfer-dialog.tsx       # Initiate transfer dialog
│   ├── asset-transfer-accept-dialog.tsx # Accept/reject transfer
│   ├── asset-timeline.tsx              # Unified timeline component
│   └── asset-photo-upload.tsx          # Reusable photo upload (inherits pattern)
lib/
├── constants/
│   └── asset-status.ts                 # Status labels, colors, transitions
├── validations/
│   └── asset-schema.ts                 # Zod schemas for all asset forms
└── types/
    └── database.ts                     # Add InventoryItem, InventoryMovement types
supabase/
└── migrations/
    └── 00008_inventory_phase6.sql      # Schema changes + storage buckets
```

### Pattern 1: Schema Migration for Missing Fields
**What:** The `inventory_items` table from Phase 1 needs additional columns (brand, model, serial_number, acquisition_date) and the `inventory_movements` table needs columns for the receiver acceptance workflow (receiver_id, rejection_reason, rejected_at, photos association).
**When to use:** Before any UI work begins.
**Details:**

Current `inventory_items` schema has:
- `id, company_id, location_id, category_id, display_id, name, description, status, condition, purchase_date, purchase_price, warranty_expiry, invoice_url, notes, deleted_at, created_at, updated_at`

Needs to ADD:
- `brand text` -- optional, max 100 chars
- `model text` -- optional, max 100 chars
- `serial_number text` -- optional, max 100 chars
- `acquisition_date date` -- maps to CONTEXT decision "acquisition date" (purchase_date already exists but may be redundant; use one or the other)

Needs to MODIFY:
- `status` CHECK constraint: change from `('active', 'under_repair', 'broken', 'sold', 'disposed')` to `('active', 'under_repair', 'broken', 'sold_disposed')` -- CONTEXT says "Sold/Disposed" is a single terminal state
- `invoice_url` should be dropped or left unused -- invoices go through `media_attachments` (entity_type='asset_invoice') for multi-file support
- `condition` field -- CONTEXT decisions don't mention the 'excellent/good/fair/poor' condition enum; photos serve as condition documentation instead. Can leave column but it's unused.

Current `inventory_movements` schema has:
- `id, company_id, item_id, from_location_id, to_location_id, initiated_by, received_by, status, notes, received_at, deleted_at, created_at, updated_at`

Needs to ADD:
- `receiver_id uuid REFERENCES public.user_profiles(id)` -- the designated receiver (not same as received_by which is set on completion)
- `rejection_reason text` -- required when receiver rejects
- `rejected_at timestamptz` -- timestamp of rejection
- `cancelled_at timestamptz` -- timestamp of cancellation

Needs to MODIFY:
- `status` CHECK constraint: change from `('pending', 'in_transit', 'received', 'cancelled')` to `('pending', 'accepted', 'rejected', 'cancelled')` -- CONTEXT says acceptance/rejection, not "in_transit" as intermediate state. The "In Transit" indicator is derived from status='pending'.

Also needs:
- `generate_asset_display_id` function (same pattern as `generate_request_display_id`)
- Storage bucket: `asset-photos` (condition photos, 5MB limit, image types)
- Storage bucket: `asset-invoices` (invoice files, 10MB limit, PDF + image types)
- RLS refinement: `inventory_items` INSERT/UPDATE restricted to ga_staff, ga_lead, admin
- RLS refinement: `inventory_movements` INSERT restricted to ga_staff, ga_lead, admin; UPDATE for acceptance/rejection by receiver

### Pattern 2: Display ID Generation (AST-YYYY-NNNN)
**What:** Atomic counter-based display ID following the `generate_request_display_id` pattern.
**When to use:** On asset creation.
**Example:**
```sql
-- Follows exact pattern from 00007_requests_phase4.sql
CREATE OR REPLACE FUNCTION public.generate_asset_display_id(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_value bigint;
  v_year_key text;
BEGIN
  v_year_key := TO_CHAR(NOW(), 'YYYY');

  UPDATE public.id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = 'asset_' || v_year_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO public.id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, 'asset_' || v_year_key, 'AST', 1, 'yearly')
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN 'AST-' || v_year_key || '-' || LPAD(v_next_value::text, 4, '0');
END;
$$;
```

### Pattern 3: Two-Step Create (Entity + Photos)
**What:** Create the asset record first (returns assetId), then upload photos via API route. Prevents orphaned files.
**When to use:** Asset creation form with required condition photos.
**Example (same pattern as request submit):**
```typescript
// In asset-submit-form.tsx onSubmit:
const result = await createAsset(formData);
const { assetId } = result.data;

// Upload condition photos
const photoFormData = new FormData();
photoFormData.append('asset_id', assetId);
photoFormData.append('photo_type', 'creation'); // Distinguishes creation vs status_change vs transfer
for (const file of photoFiles) {
  photoFormData.append('photos', file);
}
await fetch('/api/uploads/asset-photos', { method: 'POST', body: photoFormData });

// Upload invoices separately
if (invoiceFiles.length > 0) {
  const invoiceFormData = new FormData();
  invoiceFormData.append('asset_id', assetId);
  for (const file of invoiceFiles) {
    invoiceFormData.append('invoices', file);
  }
  await fetch('/api/uploads/asset-invoices', { method: 'POST', body: invoiceFormData });
}
```

### Pattern 4: Transfer State Machine
**What:** Asset transfers follow a multi-step workflow with concurrent transfer guard.
**When to use:** All transfer operations.
**State diagram:**
```
Initiate Transfer
  -> Movement created (status='pending')
  -> Asset shows "In Transit" badge (derived from pending movement)
  -> Asset locked from further transfers

Receiver Accepts
  -> Movement status='accepted', received_at=now()
  -> Asset location_id updated to to_location_id
  -> Receiver condition photos uploaded
  -> "In Transit" cleared

Receiver Rejects
  -> Movement status='rejected', rejected_at=now(), rejection_reason filled
  -> Rejection photos uploaded
  -> Asset stays at origin location
  -> "In Transit" cleared

Initiator Cancels
  -> Movement status='cancelled', cancelled_at=now()
  -> Asset stays at origin location
  -> "In Transit" cleared
```

**Concurrent transfer guard:** Before creating a movement, check:
```typescript
// In createTransfer action:
const { count: pendingCount } = await supabase
  .from('inventory_movements')
  .select('id', { count: 'exact', head: true })
  .eq('item_id', assetId)
  .eq('status', 'pending')
  .is('deleted_at', null);

if (pendingCount && pendingCount > 0) {
  throw new Error('Asset has a pending transfer. Complete or cancel it first.');
}
```

### Pattern 5: "In Transit" as Derived State
**What:** "In Transit" is NOT a DB status -- it's derived from having a pending movement record.
**When to use:** Asset list and detail pages.
**Example:**
```typescript
// On asset detail page (server component):
const { data: pendingTransfer } = await supabase
  .from('inventory_movements')
  .select('id, from_location_id, to_location_id, receiver_id, initiated_by, created_at, from_location:locations!from_location_id(name), to_location:locations!to_location_id(name), receiver:user_profiles!receiver_id(name:full_name)')
  .eq('item_id', assetId)
  .eq('status', 'pending')
  .is('deleted_at', null)
  .maybeSingle();

// Pass pendingTransfer to client component for badge display
// In asset list, a subquery or join can indicate in-transit status
```

### Pattern 6: Unified Timeline from Audit Logs + Movements
**What:** The asset timeline combines audit_logs (for status changes, field edits) with inventory_movements (for transfer events), sorted chronologically. Each entry can have associated photos.
**When to use:** Asset detail page timeline.
**Example:**
```typescript
// Fetch audit logs for the asset
const auditLogs = await supabase
  .from('audit_logs')
  .select('*')
  .eq('table_name', 'inventory_items')
  .eq('record_id', assetId)
  .order('performed_at', { ascending: true });

// Fetch movements for the asset
const movements = await supabase
  .from('inventory_movements')
  .select('*, from_location:locations!from_location_id(name), to_location:locations!to_location_id(name), initiator:user_profiles!initiated_by(name:full_name), receiver:user_profiles!receiver_id(name:full_name)')
  .eq('item_id', assetId)
  .is('deleted_at', null)
  .order('created_at', { ascending: true });

// Fetch condition photos for all events
const photos = await supabase
  .from('media_attachments')
  .select('id, entity_type, entity_id, file_name, file_path')
  .in('entity_type', ['asset_creation', 'asset_status_change', 'asset_transfer_send', 'asset_transfer_receive', 'asset_transfer_reject'])
  .eq('entity_id', assetId)  // or movement_id for transfer photos
  .is('deleted_at', null);

// Merge and sort chronologically
// Each timeline entry type: 'created', 'status_change', 'field_update', 'transfer_initiated', 'transfer_accepted', 'transfer_rejected', 'transfer_cancelled'
```

### Pattern 7: Status Change with Required Photos
**What:** Status changes require condition photos (1-5) and an optional note. Implemented as a dialog triggered by clicking the status badge.
**When to use:** All non-terminal status transitions.
**Flow:**
1. User clicks status badge on detail page
2. Dialog opens with: new status selector (dropdown), condition photos (required, 1-5), optional note
3. On submit: update asset status via server action, then upload photos via API route with entity_type='asset_status_change'
4. If new status is broken/sold_disposed: also pause linked maintenance schedules

### Pattern 8: Auto-Pause Maintenance Schedules
**What:** When an asset status changes to 'broken' or 'sold_disposed', any linked maintenance_schedules must be paused.
**When to use:** In the status change server action.
**Example:**
```typescript
// In changeAssetStatus action, after updating asset status:
if (['broken', 'sold_disposed'].includes(newStatus)) {
  await supabase
    .from('maintenance_schedules')
    .update({
      is_paused: true,
      paused_at: new Date().toISOString(),
      paused_reason: `Asset ${newStatus === 'broken' ? 'broken' : 'sold/disposed'}`,
    })
    .eq('item_id', assetId)
    .eq('is_paused', false)
    .is('deleted_at', null);
}
```
Note: Phase 7 (Preventive Maintenance) is not yet built, but the `maintenance_schedules` table exists. This action simply updates the `is_paused` flag; Phase 7 will handle the schedule resume logic.

### Anti-Patterns to Avoid
- **"In Transit" as a DB status:** CONTEXT explicitly says it's a transient indicator, not a status. The DB statuses are only Active, Under Repair, Broken, Sold/Disposed.
- **Separate pages for incoming transfers:** CONTEXT says no separate page; use asset list filter/badge instead.
- **Auto-dismiss feedback:** Project convention mandates persistent InlineFeedback with manual dismiss.
- **Mobile-first breakpoints:** Project uses desktop-first (max-*) exclusively.
- **Single invoice_url field:** CONTEXT requires multiple invoice uploads; use media_attachments.
- **Separate sold and disposed statuses:** CONTEXT says "Sold/Disposed" is ONE terminal state.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Display ID generation | Custom JS counter | DB function `generate_asset_display_id` with atomic UPDATE + INSERT | Race conditions, counter drift |
| File upload handling | Custom upload logic | API route + Supabase Storage (same pattern as request-photos) | Multipart parsing, signed URLs, cleanup |
| URL-synced filter state | useState + manual URL sync | nuqs `useQueryStates` | Hydration mismatches, back-button support |
| Data table | Custom table with sorting | TanStack Table + established data-table components | Sorting, column sizing, pagination |
| Form validation | Manual validation | react-hook-form + zod + zodResolver | Error display, field-level validation |
| Audit trail | Custom logging | Existing audit_trigger (already attached to inventory_items and inventory_movements) | Consistency, SECURITY DEFINER |

**Key insight:** Every UI pattern needed for this phase already exists in the request management module. The risk is not technical complexity but rather thoroughness -- ensuring all the event types (creation, status change, transfer initiation, transfer acceptance, transfer rejection) correctly associate condition photos and appear in the timeline.

## Common Pitfalls

### Pitfall 1: Photo Entity Type Confusion
**What goes wrong:** Using a single `entity_type='asset'` for all photos makes it impossible to distinguish creation photos from status change photos from transfer photos in the timeline.
**Why it happens:** Tempting to simplify by using one type.
**How to avoid:** Use distinct entity_types: `asset_creation`, `asset_status_change`, `asset_transfer_send`, `asset_transfer_receive`, `asset_transfer_reject`. The entity_id should reference the asset ID for creation/status photos and the movement ID for transfer photos.
**Warning signs:** Timeline shows photos but can't associate them with the correct event.

### Pitfall 2: Transfer Photo Entity ID Mismatch
**What goes wrong:** Transfer photos (send/receive/reject) need to reference the movement ID, not the asset ID, so they can be correctly associated with a specific transfer event.
**Why it happens:** Tempting to always use asset_id as entity_id.
**How to avoid:** For transfer-related photos, use entity_id = movement_id. For creation and status change photos, use entity_id = asset_id. When building the timeline, fetch photos for both the asset_id and all related movement_ids.
**Warning signs:** Transfer photos appear under wrong timeline event.

### Pitfall 3: Concurrent Transfer Race Condition
**What goes wrong:** Two users simultaneously initiate transfers for the same asset, creating two pending movements.
**Why it happens:** Check-then-insert without proper locking.
**How to avoid:** The pending movement check + insert should ideally be in a DB function or use a unique partial index: `CREATE UNIQUE INDEX idx_one_pending_movement ON inventory_movements (item_id) WHERE status = 'pending' AND deleted_at IS NULL;` This ensures only one pending movement per asset at the database level.
**Warning signs:** Asset stuck with multiple pending transfers.

### Pitfall 4: Forgetting Maintenance Schedule Auto-Pause
**What goes wrong:** Asset marked as broken/sold but maintenance schedules keep generating jobs.
**Why it happens:** Status change action doesn't include the maintenance_schedules update.
**How to avoid:** Always check for linked maintenance_schedules in the status change action when transitioning to broken or sold_disposed. Even though Phase 7 isn't built yet, the pause flag must be set.
**Warning signs:** Overdue maintenance jobs for broken assets (visible after Phase 7).

### Pitfall 5: Schema Migration Status Value Mismatch
**What goes wrong:** Existing DB has `'sold', 'disposed'` as separate values but CONTEXT decided on `'sold_disposed'` as a single terminal state.
**Why it happens:** Phase 1 schema was created before CONTEXT.md discussion.
**How to avoid:** Migration must ALTER the CHECK constraint. Since no asset data exists yet (Phase 6 is the first to create assets), the migration just needs to replace the constraint, not migrate data.
**Warning signs:** Status change action fails with constraint violation.

### Pitfall 6: RLS Policy Gap for GA Staff
**What goes wrong:** GA Staff cannot create or update assets because the base RLS policies from Phase 1/Phase 5 don't restrict inventory operations to specific roles, but they also don't explicitly allow them.
**Why it happens:** Base inventory_items INSERT/UPDATE policies allow any authenticated user in the company.
**How to avoid:** Refine the RLS policies: inventory_items INSERT/UPDATE should require `current_user_role() IN ('ga_staff', 'ga_lead', 'admin')`. General users and finance_approver can only SELECT (view).
**Warning signs:** Unauthorized users can create/edit assets.

### Pitfall 7: Missing Photo Validation on Status Change
**What goes wrong:** Status change completes without condition photos because the two-step flow (update status, then upload photos) has no enforcement.
**Why it happens:** Server action updates status, but photos are uploaded in a separate API call.
**How to avoid:** The UI must enforce photo selection before allowing form submission. The status change dialog should disable the submit button until at least 1 photo is selected. Additionally, a follow-up check can verify photos were uploaded.
**Warning signs:** Status changes with no condition documentation.

## Code Examples

### Asset Creation Server Action
```typescript
// Source: Mirrors request-actions.ts pattern
export const createAsset = authActionClient
  .schema(assetCreateSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Role check: ga_staff, ga_lead, or admin
    if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('GA Staff access required');
    }

    // Generate display_id
    const { data: displayId, error: rpcError } = await supabase
      .rpc('generate_asset_display_id', { p_company_id: profile.company_id });

    if (rpcError || !displayId) {
      throw new Error('Failed to generate asset ID. Please try again.');
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        company_id: profile.company_id,
        display_id: displayId,
        name: parsedInput.name,
        category_id: parsedInput.category_id,
        location_id: parsedInput.location_id,
        status: 'active',
        brand: parsedInput.brand || null,
        model: parsedInput.model || null,
        serial_number: parsedInput.serial_number || null,
        description: parsedInput.description || null,
        acquisition_date: parsedInput.acquisition_date || null,
        warranty_expiry: parsedInput.warranty_expiry || null,
      })
      .select('id, display_id')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/inventory');
    return { success: true, assetId: data.id, displayId: data.display_id };
  });
```

### Asset Status Change Action
```typescript
// Source: Follows request status change pattern
export const changeAssetStatus = authActionClient
  .schema(assetStatusChangeSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    if (!['ga_staff', 'ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('GA Staff access required');
    }

    // Fetch current asset
    const { data: asset } = await supabase
      .from('inventory_items')
      .select('id, status')
      .eq('id', parsedInput.asset_id)
      .is('deleted_at', null)
      .single();

    if (!asset) throw new Error('Asset not found');

    // Validate transition
    if (asset.status === 'sold_disposed') {
      throw new Error('Cannot change status of a sold/disposed asset');
    }

    // Update status
    const { error } = await supabase
      .from('inventory_items')
      .update({
        status: parsedInput.new_status,
        notes: parsedInput.note || null,
      })
      .eq('id', parsedInput.asset_id);

    if (error) throw new Error(error.message);

    // Auto-pause maintenance schedules if broken or sold
    if (['broken', 'sold_disposed'].includes(parsedInput.new_status)) {
      await supabase
        .from('maintenance_schedules')
        .update({
          is_paused: true,
          paused_at: new Date().toISOString(),
          paused_reason: `Asset status: ${parsedInput.new_status}`,
        })
        .eq('item_id', parsedInput.asset_id)
        .eq('is_paused', false)
        .is('deleted_at', null);
    }

    revalidatePath('/inventory');
    return { success: true };
  });
```

### Zod Schemas
```typescript
// Source: Follows request-schema.ts pattern with CLAUDE.md max-length rules
import { z } from 'zod';

export const assetCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  category_id: z.string().uuid({ message: 'Category is required' }),
  location_id: z.string().uuid({ message: 'Location is required' }),
  brand: z.string().max(100, 'Brand must be under 100 characters').optional().or(z.literal('')),
  model: z.string().max(100, 'Model must be under 100 characters').optional().or(z.literal('')),
  serial_number: z.string().max(100, 'Serial number must be under 100 characters').optional().or(z.literal('')),
  description: z.string().max(200, 'Description must be under 200 characters').optional().or(z.literal('')),
  acquisition_date: z.string().optional().or(z.literal('')),
  warranty_expiry: z.string().optional().or(z.literal('')),
});

export const assetEditSchema = assetCreateSchema; // Same fields editable

export const assetStatusChangeSchema = z.object({
  asset_id: z.string().uuid(),
  new_status: z.enum(['active', 'under_repair', 'broken', 'sold_disposed']),
  note: z.string().max(1000, 'Note must be under 1000 characters').optional().or(z.literal('')),
});

export const assetTransferSchema = z.object({
  asset_id: z.string().uuid(),
  to_location_id: z.string().uuid({ message: 'Destination location is required' }),
  receiver_id: z.string().uuid({ message: 'Receiver is required' }),
  notes: z.string().max(200, 'Notes must be under 200 characters').optional().or(z.literal('')),
});

export const transferAcceptSchema = z.object({
  movement_id: z.string().uuid(),
});

export const transferRejectSchema = z.object({
  movement_id: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required').max(1000, 'Reason must be under 1000 characters'),
});
```

### Status Constants
```typescript
// Source: Follows lib/constants/request-status.ts pattern
export const ASSET_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  under_repair: 'Under Repair',
  broken: 'Broken',
  sold_disposed: 'Sold/Disposed',
};

export const ASSET_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  under_repair: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  broken: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  sold_disposed: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

export const ASSET_STATUSES = ['active', 'under_repair', 'broken', 'sold_disposed'] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];

// Valid transitions (from -> allowed targets)
export const ASSET_STATUS_TRANSITIONS: Record<string, string[]> = {
  active: ['under_repair', 'broken', 'sold_disposed'],
  under_repair: ['active', 'broken', 'sold_disposed'],
  broken: ['active', 'under_repair', 'sold_disposed'],
  sold_disposed: [], // Terminal -- no transitions out
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single invoice_url field | media_attachments polymorphic table | Phase 1 schema design | Multiple invoices supported; consistent with photo handling |
| Separate sold/disposed statuses | Single 'sold_disposed' status | CONTEXT.md discussion (2026-02-24) | Schema migration needed to modify CHECK constraint |
| GPS on status changes | No GPS capture | CONTEXT.md discussion (2026-02-24) | Simpler implementation; location tracked as asset field |

**Deprecated/outdated:**
- `condition` column in `inventory_items` (excellent/good/fair/poor enum): Not mentioned in CONTEXT.md decisions; condition is documented via photos instead. Column can remain but is unused.
- `invoice_url` column in `inventory_items`: Replaced by media_attachments for multi-file support.
- `purchase_price` column: Not mentioned in CONTEXT.md required fields. Can remain unused.

## Open Questions

1. **Entity ID for Status Change Photos**
   - What we know: Status change photos document asset condition at a point in time. The media_attachments entity_id field needs a reference.
   - What's unclear: Should entity_id reference the asset ID (grouping all status photos together) or should we create a separate `asset_status_changes` table to store each status change event and reference that?
   - Recommendation: Use asset_id as entity_id with entity_type='asset_status_change'. To associate photos with specific status changes, include a description field or rely on the temporal ordering (photos uploaded at the same time as the audit log entry for the status change). This avoids adding a new table while maintaining photo-to-event correlation. The audit_logs table captures the status change details; photos captured within the same request can be correlated by timestamp.

2. **Photo Upload Entity Association for Transfers**
   - What we know: Transfer photos need to associate with a specific movement, not just the asset.
   - What's unclear: How to handle the two-step create pattern when the movement_id is needed for photo uploads.
   - Recommendation: Follow the same two-step pattern: create movement first (returns movement_id), then upload photos with entity_type='asset_transfer_send' and entity_id=movement_id. Receiver acceptance follows the same: accept action updates movement, then photos uploaded with entity_type='asset_transfer_receive' and entity_id=movement_id.

3. **Purchase Date vs Acquisition Date**
   - What we know: Schema has `purchase_date`; CONTEXT says "acquisition date".
   - What's unclear: Are these the same field?
   - Recommendation: Treat `purchase_date` as the acquisition date field. Rename in the migration to `acquisition_date` for clarity, or add `acquisition_date` as an alias. Since no data exists yet, a rename is cleaner.

## Sources

### Primary (HIGH confidence)
- Project codebase analysis: `supabase/migrations/00001_initial_schema.sql` -- existing table structure
- Project codebase analysis: `supabase/migrations/00007_requests_phase4.sql` -- display ID generation pattern
- Project codebase analysis: `app/actions/request-actions.ts` -- server action pattern
- Project codebase analysis: `components/requests/request-submit-form.tsx` -- form submission + photo upload pattern
- Project codebase analysis: `components/requests/request-timeline.tsx` -- timeline component pattern
- Project codebase analysis: `app/api/uploads/request-photos/route.ts` -- file upload API route pattern
- Project codebase analysis: `lib/auth/permissions.ts` -- permission map (inventory permissions already defined)
- Project codebase analysis: `components/requests/request-filters.tsx` -- nuqs filter pattern
- Project codebase analysis: `.planning/phases/06-inventory/06-CONTEXT.md` -- all implementation decisions

### Secondary (MEDIUM confidence)
- Project conventions: `CLAUDE.md` -- validation limits, formatting rules, responsive design rules
- Project state: `.planning/STATE.md` -- accumulated decisions from Phases 1-4

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in use in the project; no new dependencies needed
- Architecture: HIGH -- every pattern directly mirrors existing Phase 4 request management code
- Pitfalls: HIGH -- identified from direct codebase analysis and CONTEXT.md constraint evaluation

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable -- all patterns are project-internal, not dependent on external library changes)
