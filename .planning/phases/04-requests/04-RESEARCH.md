# Phase 4: Requests - Research

**Researched:** 19-02-2026
**Domain:** Request submission, triage workflow, file uploads, timeline display in Next.js 16 App Router with Supabase
**Confidence:** HIGH

## Summary

Phase 4 builds the core request lifecycle: submission by General Users, triage by GA Leads, and status tracking for all. The existing codebase from Phase 3 provides a complete pattern library (DataTable, InlineFeedback, server actions via next-safe-action, react-hook-form + Zod forms). Phase 4 reuses all of these patterns heavily.

The three genuinely new technical challenges are: (1) **photo uploads** to Supabase Storage (private bucket, signed URLs for display), (2) **auto-generated Request ID** using the existing `generate_display_id` DB function with a custom 2-digit year variant, and (3) **timeline display** built from the existing `audit_logs` table (which already tracks all field changes on the `requests` table via the existing audit trigger).

The request list page follows the exact same DataTable pattern as admin pages but adds server-side URL-synced filters (nuqs already installed) and clickable rows navigating to a detail page. The triage modal follows the exact same Dialog + react-hook-form pattern as admin entity edit dialogs. The detail page is the only genuinely new layout pattern: two-column (info left, timeline right) that stacks on mobile.

**Primary recommendation:** Reuse all Phase 3 patterns. Add three new shadcn components (Combobox, Breadcrumb, Skeleton). Add one DB migration for `cancelled` status, a custom `generate_request_display_id` function (2-digit year), and a Supabase Storage bucket (`request-photos`, private). Use signed URLs for photo display — never expose storage paths directly to clients.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Request Form & Submission
- **Form page:** Full page at `/requests/new` (not modal) — URL will be shared, often opened on mobile, should feel like a proper form
- **Fields:** Description (required, textarea) + Location (required, dropdown from admin-configured locations) — minimal form
- **No user-facing title:** Title is auto-generated from description on insert (DB trigger or server action). Used as short label in tables.
- **No category/priority on form:** Category, priority, PIC assigned by GA Lead during triage
- **Photos:** Basic upload, up to 3 images. Store originals in Supabase Storage. Phase 8 adds compression/annotation/gallery later.
- **Post-submit:** Redirect to request list page (not detail page)
- **Access:** "New Request" button on the request list toolbar

#### Request ID Format
- **Format:** `[COMPANYCODE]-[YY]-[XXXX]` (e.g., `ABC-26-0001`)
- **Scope:** Per-company sequential numbering
- **Year:** 2-digit year from creation date
- **Sequence:** 4-digit zero-padded, resets per company per year

#### Status Workflow
- **Statuses:** New → Triaged → In Progress → Completed → Accepted / Rejected
- **Additional terminal states:** Cancelled (by requester), Rejected (by GA Lead at triage)
- **Cancellation:** Requester can cancel only while status is New. After triage, cannot cancel.
- **Rejection:** GA Lead can reject during triage. Reason is required. Rejected is final (no re-open).
- **In Progress:** NOT settable in Phase 4. Set automatically by Phase 5 when a job is created.
- **Completed/Accepted/Rejected (post-completion):** Built in Phase 5 with jobs and acceptance workflow.
- **Cost estimation:** Deferred to Phase 5 (approval workflow)

#### Triage Workflow
- **Triage fields:** Category (from request categories), Priority (Low/Medium/High/Urgent), PIC (any active user in company)
- **All three required** to move from New → Triaged
- **Triage UI — from list:** Modal dialog (consistent with admin edit modals). Shows request description, location, all photo thumbnails (read-only) at top, triage fields below.
- **Triage UI — from detail:** Editable inline on the detail page (category/priority/PIC shown as editable fields for GA Lead)
- **Photo thumbnails in triage modal:** All shown at once, clickable to open fullscreen lightbox (100vw/vh, zoomable with native pinch behavior)
- **Reject action:** Available on both list (via modal) and detail page. Requires reason text.

#### Request List & Filters
- **Component:** Reuse existing DataTable pattern (consistent with Settings/Users pages)
- **Default view by role:** General User sees own requests only. GA Staff/Lead/Admin see all company requests.
- **Columns:** ID, Title, Location, Status, Priority, Category, PIC, Created
- **Default sort:** Newest first (created_at descending)
- **Filters:** Status, Priority, Category, Date range
- **Quick filter:** "My Assigned" toggle for users who are PIC on requests
- **Search scope:** Title + description + request ID
- **Row click:** Navigates to request detail page (`/requests/[id]`)
- **Create button:** "New Request" in toolbar

#### Request Detail Page
- **Layout:** Two columns — info left, timeline right. Stacks vertically on mobile.
- **Breadcrumb:** `Requests > ABC-26-0001` at top
- **Requester info:** Prominently displayed at top — name, division, submission date
- **Left column:** Description, location, photos (inline thumbnails, clickable for fullscreen lightbox), triage fields (editable for GA Lead, read-only for others)
- **Right column:** Timeline showing status changes (who + when), triage assignments (old → new values), rejection/cancellation reasons
- **Action buttons:** Prominent, context-sensitive based on status and role (e.g., "Triage" for GA Lead on New request, "Cancel" for requester on New request, "Reject" for GA Lead)
- **Edit:** Requester can edit description/location/photos while status is New. Locked after Triaged.

### Claude's Discretion
- Auto-generated title implementation (DB trigger vs server action, truncation length)
- Photo upload component implementation details (file input styling, preview before submit)
- Timeline component design (vertical timeline, icons per event type)
- Exact responsive breakpoint for two-column → stacked layout
- Status badge colors for each status
- Priority badge colors (likely: Low=gray, Medium=blue, High=orange, Urgent=red)
- Empty state design for request list
- Lightbox implementation approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

## Critical DB Schema Issues to Resolve

Before planning tasks, two DB schema gaps must be addressed via migration:

### Issue 1: Missing `cancelled` status value
The existing `requests` table CHECK constraint is:
```sql
status text NOT NULL CHECK (status IN ('submitted', 'triaged', 'in_progress', 'pending_approval', 'approved', 'rejected', 'completed', 'accepted', 'closed')) DEFAULT 'submitted'
```

Phase 4 requires a `cancelled` status (requester-initiated, only from `submitted` state). Need a migration to add it.

### Issue 2: `generate_display_id` uses 4-digit year, decisions require 2-digit year
The existing `generate_display_id` function outputs `PREFIX-YYYY-NNNN` (e.g., `ABC-2026-0001`). The decisions specify `[COMPANYCODE]-[YY]-[XXXX]` (e.g., `ABC-26-0001`).

Need a `generate_request_display_id` function that:
1. Takes `p_company_id` and fetches the company's `code` field (not a passed prefix)
2. Uses `TO_CHAR(NOW(), 'YY')` for 2-digit year
3. Resets counter yearly (uses `entity_type = 'request_' || TO_CHAR(NOW(), 'YY')`)

### Issue 3: `status` column maps "New" → `submitted`
The user-facing label is "New" but DB value is `submitted`. All display code must translate `submitted` → "New". No DB change needed — just a display mapping.

### Issue 4: No Supabase Storage bucket for photos
A `request-photos` bucket needs to be created (private, authenticated access only). Migration or setup step required.

## Standard Stack

### Core (already installed — reuse from Phase 3)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | latest | UI components | Already set up — Dialog, Table, Form, Button, Textarea, Select, Badge |
| TanStack Table | v8.21.3 | Request list table | Already installed — identical pattern to admin tables |
| react-hook-form | v7.71.1 | Form state | Already installed — use for submission form and triage form |
| zod | v4.3.6 | Validation | Already installed — request schema + triage schema |
| next-safe-action | v8.0.11 | Server actions | Already installed — use `authActionClient` (not adminActionClient) for request mutations |
| nuqs | v2.8.8 | URL filter state | Already installed — use for list filters (status, priority, category, date range) |
| @supabase/supabase-js | v2.95.3 | Storage upload | Already installed — use `.storage.from('request-photos').upload()` |
| date-fns | v4.1.0 | Date formatting | Already installed — use `format(date, 'dd-MM-yyyy')` per project convention |
| lucide-react | v0.563.0 | Icons | Already installed |

### New Components to Install
| Component | Install Command | Purpose |
|-----------|----------------|---------|
| Combobox (shadcn) | `npx shadcn@latest add command popover` | Location dropdown (many options), Category/PIC dropdowns in triage |
| Breadcrumb (shadcn) | `npx shadcn@latest add breadcrumb` | Detail page `Requests > ABC-26-0001` |
| Skeleton (shadcn) | `npx shadcn@latest add skeleton` | Loading states for detail page |
| Scroll Area (shadcn) | `npx shadcn@latest add scroll-area` | Timeline scrollable panel (if long) |

Note: Combobox is not a standalone shadcn component — it's built from `Command` + `Popover` primitives. Install both and build the Combobox pattern per CLAUDE.md convention.

### No New npm Packages Required
All needed libraries are already installed. File uploads use the existing `@supabase/supabase-js` SDK. No additional image handling library needed in Phase 4 (Phase 8 adds compression).

**Installation:**
```bash
npx shadcn@latest add command popover breadcrumb skeleton scroll-area
```

## Architecture Patterns

### Recommended Project Structure

```
app/
├── (dashboard)/
│   ├── requests/
│   │   ├── page.tsx                    # Request list (server component, fetches data)
│   │   ├── new/
│   │   │   └── page.tsx                # Submit form (server component wrapping client form)
│   │   └── [id]/
│   │       └── page.tsx                # Detail page (server component)
│   └── layout.tsx                      # Existing dashboard layout
├── actions/
│   ├── request-actions.ts              # createRequest, updateRequest, triageRequest, cancelRequest, rejectRequest
│   └── media-actions.ts                # getSignedUrls (for displaying photos)
components/
├── ui/                                 # shadcn/ui (add command, popover, breadcrumb, skeleton, scroll-area)
├── requests/
│   ├── request-table.tsx               # Client table component (reuses DataTable)
│   ├── request-columns.tsx             # Column definitions
│   ├── request-submit-form.tsx         # "New Request" form (client component)
│   ├── request-edit-form.tsx           # Edit request form (description/location/photos while New)
│   ├── request-triage-dialog.tsx       # Triage modal (for list view GA Lead action)
│   ├── request-reject-dialog.tsx       # Reject dialog with reason field
│   ├── request-cancel-dialog.tsx       # Cancel confirmation dialog
│   ├── request-detail-layout.tsx       # Two-column detail page layout
│   ├── request-timeline.tsx            # Timeline from audit_logs
│   ├── request-photo-upload.tsx        # Photo upload component (3-image limit)
│   ├── request-photo-lightbox.tsx      # Fullscreen photo viewer
│   └── request-status-badge.tsx        # Colored status badge (submitted→"New" mapping)
├── combobox.tsx                        # Shared Combobox pattern (Location, Category, PIC selectors)
└── data-table/                         # Existing — unchanged
lib/
├── validations/
│   ├── request-schema.ts               # Zod schema for request submission
│   └── triage-schema.ts                # Zod schema for triage (category, priority, pic)
└── types/
    └── database.ts                     # Add Request type
supabase/
└── migrations/
    └── 00007_requests_phase4.sql       # Add 'cancelled' to status, generate_request_display_id fn, trigger
```

### Pattern 1: Request Submit Form (Full Page)

**What:** Full-page form at `/requests/new` with description textarea + location combobox + photo upload
**When to use:** Request submission (mobile-friendly, shareable URL)

```typescript
// Source: Phase 3 patterns + decisions
// app/(dashboard)/requests/new/page.tsx — server component
import { createClient } from '@/lib/supabase/server';
import { RequestSubmitForm } from '@/components/requests/request-submit-form';

export default async function NewRequestPage() {
  const supabase = await createClient();
  // Fetch active locations for dropdown
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .is('deleted_at', null)
    .order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Request</h1>
        <p className="text-muted-foreground mt-2">Submit a maintenance request</p>
      </div>
      <RequestSubmitForm locations={locations || []} />
    </div>
  );
}
```

The client form uses `authActionClient` (not `adminActionClient`) — all authenticated users can create requests:
```typescript
// app/actions/request-actions.ts
'use server';
import { authActionClient } from '@/lib/safe-action';
import { requestSubmitSchema } from '@/lib/validations/request-schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export const createRequest = authActionClient
  .schema(requestSubmitSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Call DB function to generate display_id
    const { data: displayId } = await supabase
      .rpc('generate_request_display_id', { p_company_id: profile.company_id });

    // Auto-generate title from first 100 chars of description
    const title = parsedInput.description.slice(0, 100).trim();

    const { data, error } = await supabase
      .from('requests')
      .insert({
        company_id: profile.company_id,
        division_id: profile.division_id,   // Auto-filled from profile
        location_id: parsedInput.location_id,
        requester_id: profile.id,
        display_id: displayId,
        title,
        description: parsedInput.description,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Upload photos after request created (attach to request ID)
    // ...handled in same action or separate call

    revalidatePath('/requests');
    return { success: true, requestId: data.id };
    // Caller redirects to /requests on success
  });
```

### Pattern 2: Photo Upload via Server Action + Supabase Storage

**What:** Client uploads files via form, server action uploads to Supabase Storage, then inserts rows into `media_attachments`
**When to use:** Photo submission on `/requests/new` and photo editing while `status = submitted`

**Storage path convention:** `{company_id}/{request_id}/{filename}` — keeps multi-tenant isolation

```typescript
// Supabase Storage upload in server action (using admin client for service_role access)
// Source: Context7 /supabase/supabase-js — storage upload
import { createAdminClient } from '@/lib/supabase/admin';

const adminSupabase = createAdminClient();

// Upload each photo file
const { data: uploadData, error: uploadError } = await adminSupabase.storage
  .from('request-photos')
  .upload(
    `${companyId}/${requestId}/${crypto.randomUUID()}-${file.name}`,
    file,
    {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    }
  );

if (uploadError) throw new Error(uploadError.message);

// Insert media_attachments record
await adminSupabase.from('media_attachments').insert({
  company_id: companyId,
  entity_type: 'request',
  entity_id: requestId,
  file_name: file.name,
  file_path: uploadData.path,
  file_size: file.size,
  mime_type: file.type,
  sort_order: index,
  uploaded_by: userId,
});
```

**Photo display with signed URLs:**
```typescript
// Source: Context7 /supabase/supabase-js — createSignedUrls
// Server component or server action for generating display URLs
const { data: signedUrls } = await supabase.storage
  .from('request-photos')
  .createSignedUrls(
    attachments.map(a => a.file_path),
    3600  // 1 hour expiry — sufficient for page view
  );
```

**Critical:** Never expose `file_path` values to client. Only serve signed URLs. Signed URLs expire — generate fresh on each page load.

**FormData schema for file uploads with next-safe-action:**

next-safe-action v8 supports FormData via `zod-form-data`:
```typescript
// Install: npm install zod-form-data
import { zfd } from 'zod-form-data';

const photoUploadSchema = zfd.formData({
  request_id: zfd.text(z.string().uuid()),
  photos: zfd.repeatableOfType(zfd.file(
    z.instanceof(File)
      .refine(f => f.size <= 5 * 1024 * 1024, 'Max 5MB per photo')
      .refine(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type), 'Only JPEG/PNG/WebP')
  )).optional(),
});
```

However, for Phase 4 simplicity: handle photo uploads separately from the request creation form. The `createRequest` action handles the DB insert, then photos are uploaded in a follow-up call. This avoids `FormData` complexity for the main submit flow.

**Simpler approach (recommended for Phase 4):** Two-step flow
1. `createRequest(data)` — creates request, returns `requestId`
2. Client calls `uploadRequestPhotos({ requestId, files })` — uploads files and creates `media_attachments` rows
3. On success, redirect to `/requests`

### Pattern 3: Request List with URL-Synced Filters

**What:** DataTable reuse with nuqs URL state for filters (status, priority, category, date range)
**When to use:** `/requests` page

```typescript
// Source: Context7 /47ng/nuqs — useQueryStates, createSearchParamsCache
// lib/validations/request-filters.ts
import { parseAsString, parseAsStringEnum, parseAsIsoDateTime } from 'nuqs/server';

export const requestFilterParsers = {
  status: parseAsStringEnum(['submitted', 'triaged', 'in_progress', 'completed', 'cancelled', 'rejected']),
  priority: parseAsStringEnum(['low', 'medium', 'high', 'urgent']),
  category_id: parseAsString,
  from: parseAsIsoDateTime,
  to: parseAsIsoDateTime,
  mine: parseAsString.withDefault(''),  // "My Assigned" toggle
  q: parseAsString,
};
```

**Role-based default filter:** General Users see only their own requests. Elevated roles see all. Implement at query level (server component), not filter UI level:
```typescript
// Server component data fetch
let query = supabase.from('requests').select('...');

if (profile.role === 'general_user') {
  query = query.eq('requester_id', profile.id);
}
// Apply URL filter params on top
if (filters.status) query = query.eq('status', filters.status);
```

### Pattern 4: Triage Modal (from List)

**What:** Dialog following Phase 3 admin modal pattern — shows read-only request info + editable triage fields
**When to use:** GA Lead clicks triage action on a request row in the list

The dialog pattern is identical to Phase 3's `LocationFormDialog`. Key additions:
- **Photo thumbnails:** Query `media_attachments` for the request, generate signed URLs server-side, pass to modal as `photoUrls: string[]`
- **Combobox for Category and PIC:** Long dropdown lists need search capability per CLAUDE.md convention

```typescript
// Triage form schema
// lib/validations/triage-schema.ts
export const triageSchema = z.object({
  category_id: z.string().uuid({ message: 'Category is required' }),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], { message: 'Priority is required' }),
  assigned_to: z.string().uuid({ message: 'PIC is required' }),
});
```

Server action:
```typescript
export const triageRequest = authActionClient
  .schema(z.object({ id: z.string().uuid(), data: triageSchema }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    // Permission check — only ga_lead, admin
    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Triage access required');
    }

    const { error } = await supabase
      .from('requests')
      .update({
        category_id: parsedInput.data.category_id,
        priority: parsedInput.data.priority,
        assigned_to: parsedInput.data.assigned_to,
        status: 'triaged',
      })
      .eq('id', parsedInput.id)
      .eq('status', 'submitted');  // Guard: only triage New requests

    if (error) throw new Error(error.message);

    revalidatePath('/requests');
    return { success: true };
  });
```

### Pattern 5: Timeline from audit_logs

**What:** The `audit_logs` table already captures every INSERT/UPDATE on the `requests` table via the existing audit trigger from migration 00004. The timeline displays these entries filtered by `table_name = 'requests' AND record_id = requestId`.
**When to use:** Right column of request detail page

```typescript
// Server component query
const { data: auditLogs } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('table_name', 'requests')
  .eq('record_id', requestId)
  .order('performed_at', { ascending: true });

// Process into timeline events
const timelineEvents = auditLogs?.map(log => {
  if (log.operation === 'INSERT') {
    return { type: 'created', at: log.performed_at, by: log.user_email };
  }
  if (log.operation === 'UPDATE' && log.changed_fields?.includes('status')) {
    return {
      type: 'status_change',
      at: log.performed_at,
      by: log.user_email,
      from: log.old_data?.status,
      to: log.new_data?.status,
    };
  }
  if (log.operation === 'UPDATE' && log.changed_fields?.some(f => ['category_id', 'priority', 'assigned_to'].includes(f))) {
    return { type: 'triage', at: log.performed_at, by: log.user_email, changes: log.changed_fields };
  }
  // ... etc
}).filter(Boolean);
```

**Important:** `audit_logs` SELECT policy is company-scoped (`company_id = current_user_company_id()`). Regular users can read audit_logs for their company — this is intentional and correct for timeline display.

### Pattern 6: Combobox (Reusable)

**What:** Searchable dropdown built from shadcn Command + Popover. Per CLAUDE.md, use for Location (on submit form), Category and PIC (on triage modal/detail).
**When to use:** Any dropdown where list may grow large

```typescript
// components/combobox.tsx
'use client';
import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  options: { label: string; value: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

export function Combobox({ options, value, onValueChange, placeholder = 'Select...', searchPlaceholder = 'Search...', emptyText = 'No results.', disabled }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal" disabled={disabled}>
          {selected ? selected.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup>
            {options.map(option => (
              <CommandItem key={option.value} value={option.label} onSelect={() => { onValueChange(option.value); setOpen(false); }}>
                <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### Pattern 7: Status and Priority Badge Colors

**What:** Colored Badge component for status and priority display in table and detail page
**When to use:** Request list columns and detail page header

Status color mapping:
- `submitted` → label "New" → gray/neutral badge
- `triaged` → label "Triaged" → blue badge
- `in_progress` → label "In Progress" → yellow/amber badge
- `completed` → label "Completed" → green badge
- `accepted` → label "Accepted" → emerald badge
- `rejected` → label "Rejected" → red badge
- `cancelled` → label "Cancelled" → stone badge

Priority color mapping:
- `low` → gray
- `medium` → blue
- `high` → orange
- `urgent` → red/destructive

### Pattern 8: Fullscreen Lightbox

**What:** Overlay covering 100vw × 100vh, dark background, clicking a photo thumbnail opens it fullscreen. Uses native pinch-to-zoom (CSS `touch-action: pinch-zoom`, no JS zoom library needed).
**When to use:** Photo thumbnails in triage modal and detail page

Implementation approach — custom, no library needed:
```typescript
// components/requests/request-photo-lightbox.tsx
'use client';
import { useEffect } from 'react';

export function PhotoLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <img
        src={src}
        alt="Request photo"
        className="max-h-screen max-w-screen object-contain"
        style={{ touchAction: 'pinch-zoom' }}
        onClick={e => e.stopPropagation()} // Don't close when clicking image
      />
    </div>
  );
}
```

No additional library. Native `touch-action: pinch-zoom` enables pinch zoom on mobile without JS. Escape key and click-outside close the lightbox.

### Anti-Patterns to Avoid

- **DON'T use `adminActionClient` for request mutations:** Regular users create and cancel requests — use `authActionClient` which provides `profile` in context. Only triage/reject needs role checking inside the action.
- **DON'T expose storage file paths to client:** Always use signed URLs. File paths reveal bucket structure; signed URLs expire and are safe to render in `<img src>`.
- **DON'T upload photos in the same DB transaction as the request insert:** Uploads can fail independently. Create request first, upload photos second, handle upload failures separately without rolling back the request.
- **DON'T query audit_logs from client components:** The timeline query is slow and should run in a Server Component. Pass the processed timeline events as props.
- **DON'T allow status transition bypasses:** Always add `.eq('status', 'submitted')` guard on the UPDATE query for triage and cancel actions. Prevents concurrent operations from creating invalid states.
- **DON'T re-check RLS for division_id on General User inserts:** The existing RLS policy in migration 00005 already enforces `division_id = current_user_division_id()` for `general_user` role. The server action still sets it from profile for clarity.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Searchable dropdowns | Custom filtered `<Select>` with search state | Combobox (shadcn Command + Popover) | Phase 3 already uses plain Select for short lists — Combobox provides ARIA, keyboard nav, search out of box |
| File upload UI | Raw `<input type="file">` with custom styling | Custom `RequestPhotoUpload` component wrapping native input | Only 3 photos — no need for react-dropzone. Native input with `accept="image/*" multiple` + preview via `URL.createObjectURL` |
| Lightbox/zoom | react-image-lightbox or other library | Custom ~30-line component | Phase 8 will add gallery — keep it simple now. Native pinch-to-zoom handles mobile without JS |
| Timeline | Dedicated events table | `audit_logs` (already populated by DB trigger) | audit_logs already captures every field change with `old_data`, `new_data`, `changed_fields`, `user_email`, `performed_at` |
| Sequential ID generation | Application-level counter | PostgreSQL function `generate_request_display_id` (UPDATE...RETURNING on id_counters) | Atomic counter in DB prevents duplicate IDs under concurrent inserts. App-level counter has race conditions. |
| Date formatting | Custom formatters | `date-fns` `format(date, 'dd-MM-yyyy')` | Already installed. Matches project MANDATORY date format. |

**Key insight:** The biggest Phase 4 risk is inventing new patterns when Phase 3 patterns cover everything. The only genuinely new patterns are Storage uploads and the timeline query.

## Common Pitfalls

### Pitfall 1: Race Condition in Sequential Request ID Generation

**What goes wrong:** Two requests submitted simultaneously by different users get the same display_id (e.g., both get `ABC-26-0001`), causing a UNIQUE constraint violation or silently overwriting.

**Why it happens:** If the ID generation is done in the application layer — read current counter, increment, write back — there's a window between read and write where another request can read the same counter value.

**How to avoid:** The existing `generate_display_id` DB function uses `UPDATE ... RETURNING` (equivalent to `SELECT ... FOR UPDATE`) which is atomic in PostgreSQL. Use it — or create the analogous `generate_request_display_id` function using the same pattern. Never read `id_counters.current_value` in application code and increment manually.

**New function needed:**
```sql
-- Migration 00007
CREATE OR REPLACE FUNCTION public.generate_request_display_id(p_company_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_value bigint;
  v_year_key text;
  v_company_code text;
BEGIN
  -- Get 2-digit year for counter key scoping
  v_year_key := TO_CHAR(NOW(), 'YY');

  -- Get company code
  SELECT code INTO v_company_code
  FROM public.companies
  WHERE id = p_company_id;

  -- Atomic increment using year-scoped entity_type
  UPDATE public.id_counters
  SET current_value = current_value + 1, updated_at = now()
  WHERE company_id = p_company_id AND entity_type = 'request_' || v_year_key
  RETURNING current_value INTO v_next_value;

  IF NOT FOUND THEN
    INSERT INTO public.id_counters (id, company_id, entity_type, prefix, current_value, reset_period)
    VALUES (gen_random_uuid(), p_company_id, 'request_' || v_year_key, v_company_code, 1, 'yearly')
    RETURNING current_value INTO v_next_value;
  END IF;

  RETURN COALESCE(v_company_code, 'REQ') || '-' || v_year_key || '-' || LPAD(v_next_value::text, 4, '0');
END;
$$;
```

**Warning signs:** Duplicate display_id errors in logs, UNIQUE constraint violation errors on `requests.display_id`

### Pitfall 2: Photos Uploaded Before Request Exists (Orphaned Files)

**What goes wrong:** User fills form, uploads 3 photos (photos created in Storage), then the request insert fails. Photos are orphaned in Storage with no `media_attachments` record and no `entity_id`.

**Why it happens:** If photos are uploaded before the request row is created, a failed insert leaves them hanging.

**How to avoid:** Always create the request first, then upload photos with the `request.id` as the `entity_id`. If photo upload fails after request creation, the request still exists (without photos) — user can edit and re-upload. This is acceptable. The reverse (photos without request) is not.

**Warning signs:** Files accumulating in Storage with no corresponding `media_attachments` rows

### Pitfall 3: Signed URL Expiry Breaking Photo Display

**What goes wrong:** User opens a detail page with photos. They leave the tab open for >1 hour. On return, photos show 403/broken image icons because signed URLs expired.

**Why it happens:** `createSignedUrls` with a 1-hour expiry generates URLs that become invalid.

**How to avoid:** Generate signed URLs server-side on each page load — never cache them. For the triage modal opened from the list (client-side), pass signed URLs as props at the time the modal opens (generate them in the server action that fetches request details, or via a small API route). Set expiry to 6 hours for detail pages (reduces impact of long sessions).

**Warning signs:** Broken image icons on detail pages after time passes, 403 errors in Network tab

### Pitfall 4: Timeline Query Performance

**What goes wrong:** Detail page is slow because `audit_logs` query scans the entire table.

**Why it happens:** `audit_logs` will grow large. The existing index is `idx_audit_logs_table_record ON audit_logs(table_name, record_id)`. This is sufficient for querying by `(table_name, record_id)`, but only if the query uses both columns.

**How to avoid:** Always query audit_logs with both `table_name = 'requests'` AND `record_id = requestId`. Never query by `record_id` alone.

**Warning signs:** Detail page load >2 seconds, EXPLAIN ANALYZE showing Seq Scan on audit_logs

### Pitfall 5: `status` Mismatch Between DB and UI Labels

**What goes wrong:** Developer filters requests by `status = 'new'` instead of `status = 'submitted'`, getting zero results. Or displays `submitted` to users.

**Why it happens:** CONTEXT says status is "New" but DB schema uses `submitted`. Easy to forget the mapping.

**How to avoid:** Create a single source of truth mapping:
```typescript
// lib/constants/request-status.ts
export const STATUS_LABELS: Record<string, string> = {
  submitted: 'New',
  triaged: 'Triaged',
  in_progress: 'In Progress',
  completed: 'Completed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

// Use everywhere: STATUS_LABELS[request.status]
```

**Warning signs:** "No results" when filtering by "New", user-facing display showing "submitted"

### Pitfall 6: Missing `division_id` on Request Insert

**What goes wrong:** Request inserts fail with `NOT NULL constraint on division_id` for users with no division assigned.

**Why it happens:** `user_profiles.division_id` is nullable — some users (e.g., admins) may have no division. The requests table has `division_id uuid NOT NULL REFERENCES divisions(id)`.

**How to avoid:** Guard the createRequest action:
```typescript
if (!profile.division_id) {
  throw new Error('Your account has no division assigned. Contact your administrator.');
}
```

**Warning signs:** 500 errors on form submission for admin accounts testing the form

### Pitfall 7: Incorrect Role Check for Triage (Using adminActionClient)

**What goes wrong:** Triage action fails for `ga_lead` role because `adminActionClient` only allows `admin` role.

**Why it happens:** Copy-pasting from Phase 3 action files that use `adminActionClient`.

**How to avoid:** Use `authActionClient` for all request actions, then check role inside:
```typescript
// Correct — authActionClient + manual role check
export const triageRequest = authActionClient
  .schema(triageSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (!['ga_lead', 'admin'].includes(ctx.profile.role)) {
      throw new Error('Triage access required');
    }
    // ...
  });
```

**Warning signs:** GA Lead gets "Admin access required" error when attempting to triage

## Code Examples

Verified patterns from official sources and codebase:

### auto-generated title (server action, truncate to 100 chars)
```typescript
// Source: CONTEXT.md — "Claude's Discretion" for title generation approach
// Using server action (not DB trigger) for simplicity
const title = parsedInput.description
  .replace(/\s+/g, ' ')   // normalize whitespace
  .trim()
  .slice(0, 100);
```

Server action is preferred over DB trigger because:
1. The codebase uses server actions for all mutations
2. A DB trigger would need to be created/maintained separately
3. The logic is simple enough that trigger overhead is not warranted

### Request form Zod schema
```typescript
// lib/validations/request-schema.ts
import { z } from 'zod';

export const requestSubmitSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  location_id: z.string().uuid({ message: 'Location is required' }),
});

export type RequestSubmitFormData = z.infer<typeof requestSubmitSchema>;

export const requestEditSchema = requestSubmitSchema;
```

### Photo upload preview (client-side, before submit)
```typescript
// Source: MDN File API — URL.createObjectURL
// components/requests/request-photo-upload.tsx
'use client';
import { useState, useRef } from 'react';
import { X } from 'lucide-react';

const MAX_PHOTOS = 3;
const MAX_SIZE_MB = 5;

export function RequestPhotoUpload({ onChange }: { onChange: (files: File[]) => void }) {
  const [previews, setPreviews] = useState<{ url: string; file: File }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files
      .filter(f => f.size <= MAX_SIZE_MB * 1024 * 1024)
      .slice(0, MAX_PHOTOS - previews.length);

    const newPreviews = valid.map(f => ({ url: URL.createObjectURL(f), file: f }));
    const combined = [...previews, ...newPreviews].slice(0, MAX_PHOTOS);
    setPreviews(combined);
    onChange(combined.map(p => p.file));
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onChange(updated.map(p => p.file));
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {previews.map((p, i) => (
          <div key={i} className="relative w-20 h-20">
            <img src={p.url} className="w-full h-full object-cover rounded" alt="" />
            <button type="button" onClick={() => remove(i)}
              className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {previews.length < MAX_PHOTOS && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground hover:border-primary">
            +
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp"
        className="sr-only" onChange={handleChange} multiple />
    </div>
  );
}
```

### Two-column detail layout
```typescript
// components/requests/request-detail-layout.tsx
// Source: Phase 3 patterns + CONTEXT.md layout spec
<div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
  <div className="space-y-6">
    {/* Left column: description, location, photos, triage fields */}
  </div>
  <div>
    {/* Right column: timeline */}
  </div>
</div>
```
Responsive breakpoint: `lg` (1024px) — stacks below that.

### Status badge component
```typescript
// components/requests/request-status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/lib/constants/request-status';

const STATUS_VARIANTS: Record<string, string> = {
  submitted: 'bg-gray-100 text-gray-700',
  triaged: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-stone-100 text-stone-600',
};

export function RequestStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_VARIANTS[status] ?? ''}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
```

### Triage action guard (only allow when status = submitted)
```typescript
// Guard in triageRequest server action
const { data: request, error: fetchErr } = await supabase
  .from('requests')
  .select('status')
  .eq('id', parsedInput.id)
  .single();

if (!request || request.status !== 'submitted') {
  throw new Error('Request can only be triaged when in New status');
}
```

### Cancel action guard (only allow when status = submitted + requester only)
```typescript
export const cancelRequest = authActionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    const { error } = await supabase
      .from('requests')
      .update({ status: 'cancelled' })
      .eq('id', parsedInput.id)
      .eq('requester_id', profile.id)    // Only own requests
      .eq('status', 'submitted');         // Only when New

    if (error) throw new Error(error.message);
    revalidatePath('/requests');
    return { success: true };
  });
```

The `.eq('status', 'submitted')` ensures this silently fails if status already changed — check `data` return to detect if row was updated.

### Reject action (requires reason, GA Lead only)
```typescript
export const rejectRequest = authActionClient
  .schema(z.object({
    id: z.string().uuid(),
    reason: z.string().min(1, 'Reason is required').max(1000),
  }))
  .action(async ({ parsedInput, ctx }) => {
    const { supabase, profile } = ctx;

    if (!['ga_lead', 'admin'].includes(profile.role)) {
      throw new Error('Triage access required');
    }

    const { error } = await supabase
      .from('requests')
      .update({
        status: 'rejected',
        rejection_reason: parsedInput.reason,
        rejected_at: new Date().toISOString(),
        rejected_by: profile.id,
      })
      .eq('id', parsedInput.id)
      .in('status', ['submitted', 'triaged']);  // Can reject from New or Triaged

    if (error) throw new Error(error.message);
    revalidatePath('/requests');
    return { success: true };
  });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| S3 direct upload with presigned POST | Supabase Storage with `adminClient.storage.from().upload()` | Supabase v2 | Simpler — no separate S3 bucket setup, uses service role key already in project |
| Global Supabase Storage RLS (public buckets) | Private bucket + signed URLs generated server-side | Supabase Storage v2 | Prevents unauthorized access to other tenants' photos |
| Separate event/history tables | Query `audit_logs` directly | Already in schema | No new table needed — audit_logs already captures all changes with field-level diff |
| Client-side filters with useState | nuqs URL-synced filters | Already installed | Filters persist across page refreshes, shareable URLs |
| FormData with `zod-form-data` for file uploads | Two-step: DB insert then Storage upload | Phase 4 approach | Avoids FormData complexity, simpler error handling |

**Deprecated/outdated:**
- **react-dropzone:** Not needed for 3-photo upload use case. Native file input with `multiple` + `URL.createObjectURL` preview is sufficient. Phase 8 may revisit.
- **Separate `request_history` table:** Would duplicate what `audit_logs` already provides.

## Open Questions

1. **Supabase Storage bucket creation: migration vs manual setup**
   - What we know: Storage buckets can be created via SQL migration (`SELECT storage.create_bucket(...)`) or via Supabase dashboard
   - What's unclear: Whether the project uses `supabase db push` workflow that would include storage migration, or manual dashboard setup
   - Recommendation: Create bucket via SQL migration in `00007_requests_phase4.sql` for reproducibility. Use `INSERT INTO storage.buckets ...` approach verified in Supabase docs.

2. **Photo upload: atomic vs two-step**
   - What we know: Two-step (create request → upload photos) is simpler. One-step (FormData with request + photos) is more atomic.
   - What's unclear: UX preference — if the page shows "submitting..." and photos fail, does user retry just photos or the whole form?
   - Recommendation: Two-step. Handle photo upload error separately with a retry UI. Request is still saved (user doesn't lose the form). Photos can be added/removed while status is `submitted`.

3. **File upload: server action vs API route**
   - What we know: `next-safe-action` v8 supports FormData via `zod-form-data`. But large file uploads (multi-MB) through server actions may have size limits.
   - What's unclear: Next.js 16 body size limit for Server Actions (default 1MB for JSON, configurable)
   - Recommendation: Use a Next.js API Route at `/api/uploads/request-photos` for the actual file upload to Supabase Storage. This gives explicit control over body size limits and doesn't tie up Server Action infrastructure with file I/O. The API route validates auth (checks session) and handles upload.

4. **`generate_request_display_id` null company code handling**
   - What we know: `companies.code` is nullable (the schema has `code text UNIQUE` without NOT NULL)
   - What's unclear: What prefix to use if company code is NULL
   - Recommendation: Fall back to first 3 chars of company name uppercased, or use `'REQ'` as universal fallback. This should never happen in practice if admin system properly enforces code entry.

## Sources

### Primary (HIGH confidence)
- Codebase: `/Users/melfice/code/ga/supabase/migrations/00001_initial_schema.sql` — `requests` table schema, `generate_display_id` function, `id_counters` table, `media_attachments` table
- Codebase: `/Users/melfice/code/ga/supabase/migrations/00003_rls_policies.sql` — existing RLS policies for requests
- Codebase: `/Users/melfice/code/ga/supabase/migrations/00004_audit_triggers.sql` — audit trigger on requests table
- Codebase: `/Users/melfice/code/ga/supabase/migrations/00005_role_rls_refinements.sql` — division-scoped insert + role-aware update policies
- Codebase: `/Users/melfice/code/ga/lib/safe-action.ts` — `authActionClient` and `adminActionClient` definitions
- Context7 `/supabase/supabase-js` — Storage file operations, signed URL generation (HIGH confidence, official SDK)
- Context7 `/theedoran/next-safe-action` — FormData file upload pattern with `zod-form-data`
- Context7 `/47ng/nuqs` — `createSearchParamsCache`, `useQueryStates` for URL filter state

### Secondary (MEDIUM confidence)
- Codebase: `/Users/melfice/code/ga/components/data-table/data-table.tsx` — DataTable props and usage patterns
- Codebase: `/Users/melfice/code/ga/components/admin/locations/location-form-dialog.tsx` — modal form pattern
- Codebase: `/Users/melfice/code/ga/app/actions/category-actions.ts` — server action patterns with authActionClient/adminActionClient

### Tertiary (LOW confidence)
- MDN File API — `URL.createObjectURL` for photo previews (standard Web API, not a library)
- Native CSS `touch-action: pinch-zoom` for lightbox (standard CSS property)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All libraries verified in codebase, no new dependencies except `zod-form-data` (optional)
- Architecture: HIGH — Reuses Phase 3 patterns directly; only Storage upload and timeline are new, both verified via Context7
- DB schema: HIGH — Read directly from migration files; gaps identified with proposed SQL fixes
- Pitfalls: HIGH — Race conditions and signed URL expiry sourced from official Supabase documentation and known PostgreSQL patterns
- Open questions: MEDIUM — Storage bucket creation and upload mechanism need implementation choice (documented as open questions)

**Research date:** 19-02-2026
**Valid until:** ~60 days (stable ecosystem — no fast-moving dependencies introduced)
