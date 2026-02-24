# Phase 9: Polish & Integration - Research

**Researched:** 2026-02-24
**Domain:** Cross-cutting quality -- GPS accountability, audit trail UI, loading states, mobile responsiveness, breadcrumbs, UI consistency
**Confidence:** HIGH

## Summary

Phase 9 addresses six cross-cutting concerns that span the entire application: (1) GPS capture on job status changes, (2) an audit trail viewer for admins, (3) skeleton loading states on all data pages, (4) mobile responsiveness for field workers, (5) breadcrumb navigation on all interior pages, and (6) a UI consistency pass across all phases. REQ-UI-003 (dark mode) is DROPPED per user decision.

The technical domain is well-understood. GPS capture uses the standard browser Geolocation API with a custom React hook. The audit trail viewer is a new data table page querying the existing `audit_logs` table (already populated by triggers from Phase 1). Loading skeletons use Next.js `loading.tsx` convention with the existing shadcn Skeleton component. Mobile responsiveness applies the project's desktop-first `max-*` breakpoint convention. Breadcrumbs already have a component from shadcn and one usage on the request detail page -- the pattern just needs to be replicated across all interior pages. The UI consistency pass involves cleaning up `dark:` classes (140+ occurrences across 25 files), standardizing error pages, and ensuring spacing/typography consistency.

**Primary recommendation:** Split into 3 plans: (1) GPS capture with DB migration + client hook + job status integration, (2) Audit trail viewer + loading skeletons for all pages, (3) Mobile responsiveness + breadcrumbs + UI consistency pass. No new npm dependencies are needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- GPS permission requested on first job status change (browser remembers choice)
- If GPS is denied or unavailable, block the status change -- user cannot proceed without granting permission
- GPS captured for all users on all job status changes (not just GA Staff)
- GPS displayed on job detail timeline as a clickable Google Maps link (opens to captured coordinates)
- Filterable data table format for audit trail (like request/job list pages)
- Columns: timestamp, user, action, entity type, entity ID
- Filters: by user, action type, entity type, date range
- Summary-level detail only -- no field-level change diffs
- Entity ID is a clickable link navigating to the affected entity's detail page
- Accessible to Admin and GA Lead roles
- Skeletons on all list pages and all detail pages (every page that fetches data)
- Each page has a custom skeleton matching its exact final layout (not generic patterns)
- Dashboard, request list, job list, asset list, all detail pages -- all get custom skeletons
- Full path breadcrumbs on all interior pages (e.g., Dashboard > Requests > REQ-2026-0042)
- Detail pages use the entity's display ID (not title) in the breadcrumb
- Full audit across all pages from all phases (1-8), not just Phase 9 pages
- Fix inconsistencies in spacing, typography, colors, button styles
- Standardize error states: consistent error pages (404, 500, permission denied) and inline error patterns
- Empty states use text + icon only (no custom illustrations) -- icon with short message and CTA button if applicable
- No dark mode -- light mode only
- Responsive desktop layout adapted with max-* breakpoints (no separate mobile layout)
- Sidebar collapses to hamburger menu on mobile
- Photo upload on mobile uses native camera capture directly (not file picker)
- Tables remain as horizontally scrollable tables on mobile (no card stacking)
- Form dialogs become full-screen sheets on mobile instead of centered modals
- All pages responsive, including admin/settings pages

### Claude's Discretion
- Specific skeleton component designs per page
- GPS timeout duration and retry behavior
- Audit trail pagination and default sort
- Exact breakpoints for mobile adaptations
- Error page layout and copy
- Which consistency issues to prioritize

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-JOB-010 | GPS capture on every job status change | Browser Geolocation API via custom `useGeolocation` hook; new `job_status_changes` table with lat/lng columns; blocking GPS requirement before status mutation |
| REQ-DATA-005 | Audit trail viewer (admin) | Query existing `audit_logs` table (RLS already allows company-scoped SELECT); new `/admin/audit-trail` page with DataTable, filters by user/action/entity/date |
| REQ-UI-003 | Light/dark mode support | **DROPPED** per user decision -- no dark mode. Instead, remove `dark:` classes from codebase (cleanup ~140 occurrences across 25 files) |
| REQ-UI-004 | Loading skeletons for all data pages | Next.js `loading.tsx` files + custom skeleton components per page using shadcn Skeleton primitive |
| REQ-UI-006 | Breadcrumb navigation | shadcn Breadcrumb component already installed; replicate request detail pattern to all interior pages |
| REQ-UI-007 | Mobile-responsive for field workflows | Desktop-first `max-*` breakpoints; hamburger menu sidebar; Sheet for mobile dialogs; `capture="environment"` for camera |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, `loading.tsx` convention, Suspense streaming | Already in project; `loading.tsx` is the standard pattern for route-level loading states |
| React | 19.2.3 | Suspense boundaries, hooks for GPS | Already in project; Suspense is the standard React pattern for async loading |
| shadcn/ui | 3.8.4 | Skeleton, Breadcrumb, Sheet, DataTable primitives | Already in project; provides all needed UI primitives |
| @tanstack/react-table | 8.21.3 | Audit trail data table with sorting/filtering | Already in project; used for all existing data tables |
| date-fns | 4.1.0 | Date formatting for audit trail timestamps | Already in project; `dd-MM-yyyy, HH:mm:ss` format |
| lucide-react | 0.563.0 | Icons for breadcrumbs, empty states, error pages | Already in project |
| nuqs | 2.8.8 | URL-synced filter state for audit trail | Already in project; used for request filters |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Browser Geolocation API | N/A (Web API) | GPS coordinate capture | On every job status change action |
| Supabase RLS | N/A | Company-scoped audit log reads | Already configured with `audit_logs_select` policy |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom useGeolocation hook | react-geolocated npm package | External dependency for simple API; custom hook is ~30 lines, no extra dep needed |
| loading.tsx per route | Manual Suspense boundaries in page.tsx | loading.tsx is simpler, auto-wraps in Suspense; manual Suspense needed only for sub-page streaming |
| Cleaning dark: classes | Keeping dark: classes | User said no dark mode; dead code removal keeps codebase clean |

**Installation:**
```bash
# No new packages needed -- all dependencies already in project
```

## Architecture Patterns

### Recommended Project Structure
```
app/(dashboard)/
  admin/
    audit-trail/
      page.tsx              # Audit trail viewer (server component, data fetch)
      loading.tsx            # Audit trail skeleton
  requests/
    loading.tsx              # Request list skeleton
    [id]/
      loading.tsx            # Request detail skeleton
  jobs/
    loading.tsx              # Job list skeleton (Phase 5 pages)
    [id]/
      loading.tsx            # Job detail skeleton
  inventory/
    loading.tsx              # Asset list skeleton (Phase 6 pages)
    [id]/
      loading.tsx            # Asset detail skeleton
  maintenance/
    loading.tsx              # Schedule list skeleton
  page.tsx                   # Dashboard (already exists)
  loading.tsx                # Dashboard skeleton
  not-found.tsx              # Global 404 page
  error.tsx                  # Global error boundary

components/
  skeletons/
    dashboard-skeleton.tsx
    request-list-skeleton.tsx
    request-detail-skeleton.tsx
    job-list-skeleton.tsx
    job-detail-skeleton.tsx
    asset-list-skeleton.tsx
    asset-detail-skeleton.tsx
    audit-trail-skeleton.tsx
    settings-skeleton.tsx
    users-skeleton.tsx
  audit-trail/
    audit-trail-columns.tsx
    audit-trail-table.tsx
    audit-trail-filters.tsx

hooks/
  use-geolocation.ts         # Custom GPS hook

lib/
  constants/
    entity-routes.ts         # Map table_name -> route path for audit trail links

supabase/
  migrations/
    00008_job_status_changes.sql  # New table for GPS-tracked status changes
```

### Pattern 1: GPS Capture with Blocking Requirement
**What:** Custom React hook that wraps `navigator.geolocation.getCurrentPosition` with a Promise-based API. Must resolve with coordinates before job status change action can proceed.
**When to use:** Every job status change action (client-side, before calling server action).

```typescript
// hooks/use-geolocation.ts
'use client';

import { useState, useCallback } from 'react';

type GpsResult = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

type GpsError = {
  code: number;
  message: string;
};

type UseGeolocationReturn = {
  capturing: boolean;
  error: GpsError | null;
  capturePosition: () => Promise<GpsResult>;
};

export function useGeolocation(): UseGeolocationReturn {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<GpsError | null>(null);

  const capturePosition = useCallback((): Promise<GpsResult> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const err = { code: 0, message: 'Geolocation not supported by this browser' };
        setError(err);
        reject(err);
        return;
      }

      setCapturing(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCapturing(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (err) => {
          setCapturing(false);
          const gpsError = {
            code: err.code,
            message: err.code === 1
              ? 'Location permission denied. Please allow location access to update job status.'
              : err.code === 2
                ? 'Location unavailable. Please check your device settings.'
                : 'Location request timed out. Please try again.',
          };
          setError(gpsError);
          reject(gpsError);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,       // 15 seconds timeout
          maximumAge: 60000,    // Accept cached position up to 1 minute old
        }
      );
    });
  }, []);

  return { capturing, error, capturePosition };
}
```

### Pattern 2: Job Status Change Table with GPS
**What:** New `job_status_changes` table that records every status transition with GPS coordinates. Separate from audit_logs because audit_logs stores raw JSONB snapshots while this table stores structured, queryable GPS data.
**When to use:** Every job status change mutation writes both to `jobs` (status update) and `job_status_changes` (GPS record).

```sql
-- supabase/migrations/00008_job_status_changes.sql
CREATE TABLE public.job_status_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  from_status text NOT NULL,
  to_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES public.user_profiles(id),
  latitude double precision,
  longitude double precision,
  gps_accuracy double precision,
  created_at timestamptz DEFAULT now()
);

-- Index for job timeline queries
CREATE INDEX idx_job_status_changes_job_id ON public.job_status_changes(job_id);
CREATE INDEX idx_job_status_changes_company ON public.job_status_changes(company_id);

-- RLS
ALTER TABLE public.job_status_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_status_changes_select" ON public.job_status_changes
  FOR SELECT TO authenticated
  USING (company_id = public.current_user_company_id());

CREATE POLICY "job_status_changes_insert" ON public.job_status_changes
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.current_user_company_id());
```

### Pattern 3: loading.tsx Skeleton Pattern
**What:** Each route directory gets a `loading.tsx` that exports a custom skeleton component matching the page's final layout.
**When to use:** Every route that fetches data server-side.

```typescript
// app/(dashboard)/requests/loading.tsx
import { RequestListSkeleton } from '@/components/skeletons/request-list-skeleton';

export default function Loading() {
  return <RequestListSkeleton />;
}

// components/skeletons/request-list-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function RequestListSkeleton() {
  return (
    <div className="space-y-6 py-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="p-4 space-y-3">
          {/* Table header */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
```

### Pattern 4: Audit Trail Viewer Page
**What:** Server-side data fetch from `audit_logs` with client-side DataTable for filtering/sorting.
**When to use:** New `/admin/audit-trail` route.

```typescript
// Audit trail column definition pattern
const columns: ColumnDef<AuditLogRow>[] = [
  {
    accessorKey: 'performed_at',
    header: 'Timestamp',
    cell: ({ row }) => format(new Date(row.original.performed_at), 'dd-MM-yyyy, HH:mm:ss'),
  },
  {
    accessorKey: 'user_email',
    header: 'User',
  },
  {
    accessorKey: 'operation',
    header: 'Action',
    cell: ({ row }) => {
      const op = row.original.operation;
      const labels: Record<string, string> = {
        INSERT: 'Created',
        UPDATE: 'Updated',
        DELETE: 'Deleted',
        TRANSITION: 'Transition',
      };
      return labels[op] ?? op;
    },
  },
  {
    accessorKey: 'table_name',
    header: 'Entity Type',
    cell: ({ row }) => formatTableName(row.original.table_name),
  },
  {
    accessorKey: 'record_id',
    header: 'Entity',
    cell: ({ row }) => (
      <Link href={getEntityRoute(row.original.table_name, row.original.record_id)}>
        {row.original.record_display_id ?? row.original.record_id.slice(0, 8)}
      </Link>
    ),
  },
];
```

### Pattern 5: Mobile Sidebar Hamburger
**What:** Sidebar hidden on mobile, replaced by hamburger menu button that opens sidebar as a Sheet.
**When to use:** Dashboard layout on mobile viewports.

```typescript
// Conceptual pattern for mobile sidebar
// In layout.tsx, wrap Sidebar in responsive container:
<div className="flex h-screen">
  {/* Desktop: visible sidebar */}
  <div className="max-md:hidden">
    <Sidebar companyName={companyName} />
  </div>

  {/* Mobile: hamburger button + Sheet */}
  <div className="hidden max-md:block fixed top-0 left-0 z-40 p-4">
    <MobileMenuButton />
  </div>

  <Sheet>
    <SheetContent side="left" className="w-64 p-0">
      <Sidebar companyName={companyName} />
    </SheetContent>
  </Sheet>

  <main className="flex-1 overflow-auto p-6 max-md:pt-16">
    {children}
  </main>
</div>
```

### Pattern 6: Breadcrumb Navigation
**What:** Full-path breadcrumbs on all interior pages using shadcn Breadcrumb components.
**When to use:** Every page except the dashboard root.
**Existing example:** `app/(dashboard)/requests/[id]/page.tsx` already has breadcrumbs.

```typescript
// Standard breadcrumb pattern for list pages
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Requests</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>

// Standard breadcrumb pattern for detail pages
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/requests">Requests</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>{displayId}</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Anti-Patterns to Avoid
- **Generic skeleton for all pages:** Each page MUST have a custom skeleton that mirrors its final layout. A single "loading spinner" or generic skeleton breaks the user's spatial expectations.
- **Mobile-first breakpoints:** NEVER use `sm:`, `md:`, `lg:`. Always `max-sm:`, `max-md:`, `max-lg:` per project convention.
- **GPS as optional/non-blocking:** User explicitly decided GPS must BLOCK the status change. Do not allow proceeding without GPS. This overrides the earlier architecture research that said "non-blocking."
- **Dark mode classes:** Remove all `dark:` classes since dark mode is dropped. Do not add new ones.
- **Separate mobile routes/layouts:** Use responsive CSS only. No `/mobile/*` routes or conditional rendering based on user agent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading states | Custom loading state management | Next.js `loading.tsx` files | Built-in Suspense integration, automatic route-level loading |
| Data table with filters | Custom table rendering | `@tanstack/react-table` + `DataTable` component | Already have full-featured DataTable with sorting, filtering, pagination |
| Breadcrumb UI | Custom breadcrumb component | shadcn `Breadcrumb` components | Already installed, accessible, consistent styling |
| GPS capture | Raw `navigator.geolocation` calls in each component | Custom `useGeolocation` hook (centralized) | Consistent error handling, DRY across all job status change points |
| Mobile sidebar | CSS-only sidebar toggle | shadcn `Sheet` component for slide-in menu | Proper overlay, focus trapping, accessible |
| Date range filter | Custom date inputs | shadcn Calendar + Popover (DatePicker pattern) | Already have Popover, just need Calendar component |

**Key insight:** Phase 9 is primarily about applying existing patterns to new contexts. Almost all the building blocks (DataTable, Skeleton, Breadcrumb, Sheet) already exist in the codebase. The work is extending coverage, not inventing new abstractions.

## Common Pitfalls

### Pitfall 1: GPS Permission Denial UX
**What goes wrong:** User denies GPS permission, then cannot update job status at all with no clear path to re-enable.
**Why it happens:** Browser remembers the deny choice. There's no way to re-request programmatically.
**How to avoid:** Show a clear error message explaining the user must go to browser settings to re-enable location for this site. Include a help link or instructions. Consider showing this guidance proactively when the GPS request fires.
**Warning signs:** Users complaining they "can't update jobs" after accidentally denying location.

### Pitfall 2: GPS Timeout on Poor Connectivity
**What goes wrong:** Field workers in areas with poor connectivity experience GPS timeouts, blocking their workflow.
**Why it happens:** `enableHighAccuracy: true` can take 30+ seconds on some devices. Default timeout of 10s may be too short.
**How to avoid:** Use 15-second timeout with `maximumAge: 60000` (accept cached position up to 1 minute). Show a "Getting your location..." spinner during capture. If timeout occurs, show retry button with clear messaging.
**Warning signs:** Frequent timeout errors in field worker usage patterns.

### Pitfall 3: Skeleton-Data Layout Mismatch
**What goes wrong:** Skeleton shows a layout that doesn't match the actual page, causing jarring visual shifts when data loads.
**Why it happens:** Skeleton designed once, then the page layout changes but the skeleton isn't updated.
**How to avoid:** Each skeleton mirrors the exact grid/flex structure of its corresponding page. If page layout changes, skeleton must be updated in the same commit.
**Warning signs:** Content "jumping" after loading completes.

### Pitfall 4: Audit Trail Performance
**What goes wrong:** Audit logs table grows very large (every CRUD operation across 14 tables generates rows). Querying without pagination causes slow page loads.
**Why it happens:** audit_logs has no deleted_at, no cleanup. Grows indefinitely.
**How to avoid:** Always paginate server-side. Add appropriate indexes. Consider limiting the default date range (e.g., last 30 days). Use the existing `company_id` index for RLS-filtered queries.
**Warning signs:** Audit trail page load time increasing over weeks of usage.

### Pitfall 5: Sidebar Hamburger Z-Index Conflicts
**What goes wrong:** Mobile hamburger menu or Sheet overlay conflicts with other modals/dialogs.
**Why it happens:** Multiple `z-50` elements stacking incorrectly.
**How to avoid:** Sheet for sidebar uses consistent z-index. Ensure hamburger button z-index is below dialog/alert-dialog overlays. Test with dialog-within-sheet scenarios.
**Warning signs:** Elements appearing behind overlays they should be above.

### Pitfall 6: Dark Mode Cleanup Regression
**What goes wrong:** Removing `dark:` classes accidentally removes needed non-dark styles that happen to be on the same line.
**Why it happens:** Careless find-and-replace or regex removal.
**How to avoid:** Remove `dark:` classes methodically, testing each file. Some components (shadcn UI primitives like button, badge) use `dark:` in their base styles -- those can be removed since no dark mode, but must verify the light mode styles still look correct. The `.dark` block in `globals.css` and the `@custom-variant dark` can be removed entirely.
**Warning signs:** Missing background colors or text colors after cleanup.

### Pitfall 7: Camera Capture on Desktop
**What goes wrong:** Using `capture="environment"` on desktop opens camera instead of file picker.
**Why it happens:** The `capture` attribute is respected on both mobile and desktop.
**How to avoid:** Only add `capture="environment"` on mobile viewports. Use media query or JS check for touch capability to conditionally set the attribute. Alternatively, use `accept="image/*"` everywhere and only add `capture` on mobile.
**Warning signs:** Desktop users forced to use camera instead of file upload dialog.

## Code Examples

### GPS-Gated Job Status Change Flow
```typescript
// In job status change dialog/action button (client component)
'use client';

import { useGeolocation } from '@/hooks/use-geolocation';

function JobStatusChangeButton({ jobId, newStatus }: Props) {
  const { capturing, error, capturePosition } = useGeolocation();
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  async function handleStatusChange() {
    try {
      // Step 1: Capture GPS (blocking)
      const gps = await capturePosition();

      // Step 2: Call server action with GPS data
      const result = await updateJobStatus({
        jobId,
        newStatus,
        latitude: gps.latitude,
        longitude: gps.longitude,
        gpsAccuracy: gps.accuracy,
      });

      if (result?.serverError) {
        setFeedback({ type: 'error', message: result.serverError });
      } else {
        setFeedback({ type: 'success', message: 'Status updated' });
      }
    } catch (gpsError) {
      // GPS denied/unavailable -- block the action
      setFeedback({
        type: 'error',
        message: gpsError.message,
      });
    }
  }

  return (
    <>
      <Button onClick={handleStatusChange} disabled={capturing}>
        {capturing ? 'Getting location...' : `Mark as ${newStatus}`}
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-2">
          {error.message}
        </p>
      )}
    </>
  );
}
```

### Google Maps Link in Job Timeline
```typescript
// In job timeline component, for status change events with GPS
function GpsLink({ latitude, longitude }: { latitude: number; longitude: number }) {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
    >
      <MapPin className="h-3 w-3" />
      View location
    </a>
  );
}
```

### Audit Trail Server Action for Data Fetch
```typescript
// app/(dashboard)/admin/audit-trail/page.tsx
export default async function AuditTrailPage() {
  const supabase = await createClient();

  // Fetch audit logs with date range limit (default: last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*')
    .gte('performed_at', thirtyDaysAgo.toISOString())
    .order('performed_at', { ascending: false })
    .limit(1000);

  // Fetch users for filter dropdown
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, name:full_name, email')
    .order('full_name');

  return <AuditTrailTable data={logs ?? []} users={users ?? []} />;
}
```

### Mobile Camera Capture
```typescript
// Conditional capture attribute for mobile
<input
  type="file"
  accept="image/*"
  capture={isMobile ? 'environment' : undefined}
  onChange={handleFileChange}
/>

// Or using CSS media query approach -- render two inputs, show/hide:
<>
  <input
    type="file"
    accept="image/*"
    capture="environment"
    className="hidden max-md:block"
    onChange={handleFileChange}
  />
  <input
    type="file"
    accept="image/*"
    className="block max-md:hidden"
    onChange={handleFileChange}
  />
</>
```

### Entity Route Mapping for Audit Trail Links
```typescript
// lib/constants/entity-routes.ts
const ENTITY_ROUTES: Record<string, string> = {
  requests: '/requests',
  jobs: '/jobs',
  inventory_items: '/inventory',
  companies: '/admin/settings',
  divisions: '/admin/settings',
  locations: '/admin/settings',
  categories: '/admin/settings',
  user_profiles: '/admin/users',
  maintenance_templates: '/maintenance/templates',
  maintenance_schedules: '/maintenance',
  job_comments: '/jobs',        // Link to parent job
  notifications: '',            // No detail page
  media_attachments: '',        // No detail page
  inventory_movements: '/inventory', // Link to parent asset
};

export function getEntityRoute(tableName: string, recordId: string): string {
  const base = ENTITY_ROUTES[tableName];
  if (!base) return '#';
  // For settings entities, link to settings page (no individual detail page)
  if (['/admin/settings'].includes(base)) return base;
  return `${base}/${recordId}`;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Spinner-only loading states | Skeleton screens matching layout | ~2023 mainstream | Much better perceived performance; Next.js `loading.tsx` makes it trivial |
| Custom responsive sidebars | Sheet component for mobile nav | shadcn v0.4+ | Accessible, animated, focus-trapped out of the box |
| `window.matchMedia` for mobile detection | CSS `max-*` breakpoints + conditional attributes | Always (CSS-first) | Avoids hydration mismatches; project convention is desktop-first CSS |
| Full audit log diffs | Summary-level audit trail | User decision | Simpler UI, faster queries, less storage concern |

**Deprecated/outdated:**
- Dark mode CSS variables in `globals.css` (`.dark` block): Can be removed entirely since dark mode is dropped.
- `@custom-variant dark` in `globals.css`: Can be removed.
- `dark:` Tailwind classes across 25+ files: Should be cleaned up for code hygiene.

## Open Questions

1. **Audit trail entity display IDs**
   - What we know: `audit_logs` stores `record_id` (UUID) but not the human-readable display_id (e.g., REQ-2026-0042). The clickable link needs to show a meaningful identifier.
   - What's unclear: Whether to denormalize `display_id` into audit_logs at write time (via trigger enhancement) or resolve it at read time (join on each entity table).
   - Recommendation: Resolve at read time using a server-side helper. The audit trail page already fetches data server-side, so batch-resolving display IDs for entities that have them (requests, jobs, inventory_items) is straightforward. Entities without display IDs (users, settings) can show the entity name or a truncated UUID. **Claude's discretion** -- planner can decide the exact approach.

2. **Audit trail pagination strategy**
   - What we know: Client-side filtering works for the current request list (~hundreds of records). Audit logs could grow to thousands per day across 14 tables.
   - What's unclear: At what scale client-side filtering breaks down. The current DataTable pattern loads all data client-side.
   - Recommendation: Start with client-side filtering with a default date range filter (last 30 days) and a row limit (1000). This matches the existing pattern and is sufficient for v1. If performance becomes an issue, migrate to server-side pagination later. **Claude's discretion** per CONTEXT.md.

3. **Breadcrumb for admin settings sub-pages**
   - What we know: Settings page uses tabs (Companies, Divisions, Locations, Categories). Breadcrumb should show `Dashboard > Settings`.
   - What's unclear: Whether tab selection should be reflected in the breadcrumb (e.g., `Dashboard > Settings > Companies`).
   - Recommendation: Keep breadcrumb at `Dashboard > Settings` level. Tab state is managed by nuqs URL state, not separate routes, so adding tab info to breadcrumb adds complexity with little value. **Claude's discretion.**

4. **Scope of mobile responsiveness**
   - What we know: Primary mobile use case is job status update + photo upload. All pages should be responsive.
   - What's unclear: Which prior-phase pages (Phases 5-8) will exist by the time Phase 9 runs. If some phases are not yet built, their skeletons and mobile responsiveness cannot be implemented.
   - Recommendation: Plan skeleton/responsive work for pages that exist (Phases 1-4 pages are confirmed). For pages from Phases 5-8, include the pattern but note the executor should create files only for pages that exist at execution time.

## Sources

### Primary (HIGH confidence)
- Context7 `/vercel/next.js/v16.1.6` - loading.tsx convention, Suspense streaming patterns
- Context7 `/shadcn-ui/ui` - Skeleton, Breadcrumb, Sheet, Calendar component documentation
- Codebase analysis: `supabase/migrations/00004_audit_triggers.sql` - existing audit infrastructure
- Codebase analysis: `supabase/migrations/00003_rls_policies.sql` - audit_logs RLS policy (company-scoped SELECT)
- Codebase analysis: `components/requests/request-timeline.tsx` - existing timeline pattern
- Codebase analysis: `app/(dashboard)/requests/[id]/page.tsx` - existing breadcrumb usage
- Codebase analysis: `components/data-table/data-table.tsx` - existing DataTable pattern
- Codebase analysis: `lib/auth/permissions.ts` - existing AUDIT_VIEW permission already defined

### Secondary (MEDIUM confidence)
- MDN Web Docs - Geolocation API (`navigator.geolocation.getCurrentPosition`) - standard Web API, well-documented
- [useGeolocation hooks](https://www.usehooks.io/docs/use-geolocation) - community patterns for React geolocation hooks

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, no new dependencies
- Architecture: HIGH - Patterns derived from existing codebase analysis (data tables, timelines, breadcrumbs all have working examples)
- Pitfalls: HIGH - GPS permission UX is well-documented; skeleton patterns are straightforward; dark mode cleanup is mechanical
- GPS implementation: HIGH - Browser Geolocation API is stable and well-documented; custom hook pattern is simple
- Audit trail: HIGH - Database infrastructure (triggers, RLS, table schema) already exists from Phase 1
- Mobile responsiveness: MEDIUM - Pattern is clear (desktop-first max-* breakpoints), but exact breakpoint choices and hamburger implementation need executor judgment

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable domain, no fast-moving dependencies)
