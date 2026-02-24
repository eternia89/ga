# Phase 8: Media, Notifications & Dashboards - Research

**Researched:** 2026-02-24
**Domain:** Client-side image processing, in-app notifications, operational dashboards, Excel export
**Confidence:** HIGH

## Summary

Phase 8 is a cross-cutting feature phase that touches three distinct domains: (1) enhanced media handling with client-side compression, freehand annotation, and AI-powered image descriptions, (2) a polling-based in-app notification system with bell icon, dropdown, and full notification center, and (3) an operational dashboard with KPI cards, horizontal bar charts, tabular views, and Excel export.

The project already has a solid foundation: the `media_attachments` table exists with polymorphic `entity_type`/`entity_id` columns, the `notifications` table exists with user-scoped RLS policies (SELECT/UPDATE only, INSERT via service_role), and the existing upload route (`app/api/uploads/request-photos/route.ts`) demonstrates the established pattern of using API routes for file uploads with admin client for storage writes. The current photo upload component (`RequestPhotoUpload`) and lightbox (`PhotoLightbox`) provide the base patterns to extend for annotation and AI description display.

**Primary recommendation:** Use `browser-image-compression` for WebP conversion, `react-sketch-canvas` for freehand annotation over images, Google Vision REST API (not the heavy SDK) for label/description generation via a server-side API route, `recharts` for dashboard charts, and `exceljs` for styled Excel exports. Implement notification polling with a custom `useNotifications` hook using `setInterval` + server action.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Freehand drawing only -- no text overlay, no shapes, no arrows
- Thumbnail grid layout on detail pages, clicking opens a full-screen modal lightbox with left/right navigation
- Google Vision API auto-triggers on every upload; descriptions stored in DB
- AI-generated descriptions displayed inside lightbox only (not under thumbnails in the grid)
- Client-side compression to WebP, max 800KB before upload
- Up to 10 images per entity, company-scoped storage paths
- Short polling every 30 seconds (not Supabase Realtime)
- Bell icon with unread count badge in the app header
- Dropdown shows 10 most recent notifications with "View all" link to notification center
- Full notification center page: flat reverse-chronological list with filter chips (All, Unread, Requests, Jobs, etc.)
- Auto-read on click (navigating to entity marks notification as read) + "Mark all as read" bulk button
- No manual per-item read toggle
- Notification events: status changes, assignments, approvals, completions, auto-accept warnings
- Never notify the actor about their own action
- Single row of 4-5 KPI cards at top (open requests, overdue jobs, untriaged count, etc.)
- KPI cards show trend indicators -- up/down arrows with percentage change vs previous period
- Clicking a KPI card navigates to the relevant filtered list page
- Date range filter with presets: Today, This Week, This Month, This Quarter, Custom range
- Request and job status distribution: horizontal bar charts (not donut/pie)
- Clicking a chart segment navigates to the filtered list
- Staff workload: table with columns -- Staff name, Active jobs, Completed (this month), Overdue. Sortable.
- Request aging: buckets table with columns -- 0-3 days, 4-7 days, 8-14 days, 15+ days (count of open requests per bucket)
- Maintenance due/overdue summary: list grouped by urgency -- overdue at top (red), due this week (yellow), due this month (normal)
- Inventory counts by status/category
- Styled Excel files: bold headers, auto-fitted column widths, borders, frozen header row
- Export button on each list page toolbar (Requests, Jobs, Inventory, Maintenance)
- Always export all data -- does not respect active page filters
- Entity-only columns -- no denormalized related data

### Claude's Discretion
- Charting library choice (recharts, chart.js, etc.)
- Exact KPI card selection and ordering
- Notification polling implementation details
- Image annotation library/approach
- Excel library choice (exceljs, xlsx, etc.)
- Loading states and skeleton designs for dashboard

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REQ-MEDIA-001 | Client-side image compression before upload (WebP, max 800KB) | `browser-image-compression` with `fileType: 'image/webp'` and `maxSizeMB: 0.8` options; integrates into existing `RequestPhotoUpload` pattern |
| REQ-MEDIA-002 | Image upload to Supabase Storage (company-scoped paths) | Existing pattern in `app/api/uploads/request-photos/route.ts`; generalize to support all entity types with `{company_id}/{entity_type}/{entity_id}/{uuid}-{filename}` paths |
| REQ-MEDIA-003 | WhatsApp-style image annotation (draw, text overlay) before upload | `react-sketch-canvas` with `backgroundImage` prop for freehand-only drawing; export annotated image as PNG data URL then convert to File for upload pipeline |
| REQ-MEDIA-004 | Google Vision API for auto-generating image descriptions | Server-side API route calling Vision REST API with base64 image data; store `labelAnnotations` descriptions in `media_attachments.description` column |
| REQ-MEDIA-005 | Multiple image upload (up to 10 per entity) | Update MAX_FILES constant from 3 to 10; extend upload route to be entity-generic |
| REQ-MEDIA-006 | Image gallery/lightbox on detail pages | Existing `PhotoLightbox` component already supports multi-photo navigation; add AI description display panel inside lightbox |
| REQ-NOTIF-001 | In-app notification system (database + polling) | `notifications` table already exists with RLS; `useNotifications` hook with 30s `setInterval` calling a server action; INSERT via adminClient in server actions |
| REQ-NOTIF-002 | Bell icon with unread count badge in header | Add to dashboard layout header area; `NotificationBell` client component consuming `useNotifications` context |
| REQ-NOTIF-003 | Notification dropdown (recent 10-20 items) | Popover/dropdown triggered by bell click; renders last 10 items with "View all" link |
| REQ-NOTIF-004 | Full notification center page with filters and mark-all-read | `/notifications` page with filter chips (All, Unread, by entity_type); bulk mark-all-read server action |
| REQ-NOTIF-005 | Click notification -> navigate to relevant entity | Entity type + entity ID stored in notification; router.push to appropriate detail page, mark as read on click |
| REQ-NOTIF-006 | Notification events: status changes, assignments, approvals, completions, auto-accept warnings | Helper `createNotification()` function called from existing server actions; notification creation in same transaction as the triggering action |
| REQ-NOTIF-007 | Never notify the actor about their own action | `createNotification()` accepts `actorId` param and filters it from recipient list |
| REQ-DASH-001 | GA Lead dashboard: KPI cards (open requests, overdue jobs, untriaged count) | Server component with parallel Supabase count queries; clickable cards linking to filtered list pages |
| REQ-DASH-002 | Request status distribution chart | `recharts` BarChart with `layout="vertical"` for horizontal bars; onClick handler navigates to filtered list |
| REQ-DASH-003 | Job status distribution chart | Same recharts pattern as REQ-DASH-002 with job status data |
| REQ-DASH-004 | Staff workload view (open jobs per GA Staff) | Server-side aggregation query grouping jobs by `assigned_to`; sortable table component |
| REQ-DASH-005 | Maintenance due/overdue summary | Query `maintenance_schedules` with `next_due_at` ranges; grouped display with color-coded urgency |
| REQ-DASH-006 | Inventory count by status/category | Aggregate query with GROUP BY status and category; tabular display |
| REQ-DASH-007 | Request aging (requests open > X days) | SQL date_part calculation from `created_at` to now(); bucket into 0-3, 4-7, 8-14, 15+ day ranges |
| REQ-DATA-002 | Excel export for requests, jobs, inventory, maintenance | `exceljs` generating styled .xlsx in API routes; streaming response with appropriate Content-Type/Content-Disposition headers |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| browser-image-compression | ^2.0.2 | Client-side image compression to WebP | Most popular browser compression lib, 1.6M+ weekly npm downloads, supports `fileType` override for WebP output, uses Web Workers for non-blocking compression |
| react-sketch-canvas | ^6.2.0 | Freehand drawing annotation on images | SVG-based (resolution independent), supports `backgroundImage` prop for drawing over photos, `exportImage('png')` for composite export, lightweight (~15KB) |
| recharts | ^2.15.0 | Dashboard charts (bar charts) | React-native declarative API, most popular React charting lib (4M+ weekly downloads), built-in ResponsiveContainer, supports `layout="vertical"` for horizontal bars, click event handlers |
| exceljs | ^4.4.0 | Styled Excel file generation | Full .xlsx support with styles, frozen panes, auto-width, borders, fonts; works server-side in Node.js; actively maintained |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 (already installed) | Date calculations for dashboard metrics, aging buckets | Date range calculations, period comparisons |
| lucide-react | ^0.563.0 (already installed) | Bell icon, trend arrows, chart icons | Notification bell, KPI trend indicators |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | chart.js / react-chartjs-2 | Chart.js is imperative, requires more wrapper code; recharts is declarative React-native with better DX |
| exceljs | xlsx (SheetJS) | xlsx community edition lacks styling support (requires paid Pro); exceljs has full styling in free version |
| react-sketch-canvas | Fabric.js / Konva | Fabric.js and Konva are full canvas frameworks -- overkill for freehand-only annotation; react-sketch-canvas is purpose-built |
| @google-cloud/vision SDK | Vision REST API via fetch | SDK is ~50MB+ in node_modules; REST API with fetch is lighter, sufficient for single-feature usage (label detection only) |

**Installation:**
```bash
npm install browser-image-compression react-sketch-canvas recharts exceljs
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (dashboard)/
│   ├── page.tsx                        # Dashboard with KPI cards + charts (replaces current placeholder)
│   ├── notifications/
│   │   └── page.tsx                    # Full notification center
│   └── requests/page.tsx               # Add export button to toolbar
├── api/
│   ├── uploads/
│   │   └── entity-photos/route.ts      # Generalized upload route (replaces request-photos)
│   ├── vision/
│   │   └── describe/route.ts           # Google Vision API proxy
│   └── exports/
│       ├── requests/route.ts           # Excel export for requests
│       ├── jobs/route.ts               # Excel export for jobs
│       ├── inventory/route.ts          # Excel export for inventory
│       └── maintenance/route.ts        # Excel export for maintenance
components/
├── media/
│   ├── photo-upload.tsx                # Generic photo upload with compression (extends existing)
│   ├── photo-annotation.tsx            # Freehand annotation dialog using react-sketch-canvas
│   ├── photo-lightbox.tsx              # Enhanced lightbox with AI descriptions
│   └── photo-grid.tsx                  # Thumbnail grid for detail pages
├── notifications/
│   ├── notification-bell.tsx           # Bell icon + unread count badge
│   ├── notification-dropdown.tsx       # Recent 10 items popover
│   ├── notification-list.tsx           # Full list for notification center
│   └── notification-item.tsx           # Single notification row
├── dashboard/
│   ├── kpi-card.tsx                    # Reusable KPI card with trend indicator
│   ├── status-bar-chart.tsx            # Horizontal bar chart wrapper
│   ├── staff-workload-table.tsx        # Sortable staff workload table
│   ├── request-aging-table.tsx         # Aging buckets table
│   ├── maintenance-summary.tsx         # Due/overdue maintenance list
│   ├── inventory-summary.tsx           # Inventory counts display
│   └── date-range-filter.tsx           # Date range presets + custom range
lib/
├── notifications/
│   ├── hooks.tsx                       # useNotifications hook (polling + state)
│   ├── actions.ts                      # Server actions for notifications
│   └── helpers.ts                      # createNotification helper for server-side
├── exports/
│   └── excel-helpers.ts                # Shared ExcelJS styling utilities
└── media/
    └── compression.ts                  # browser-image-compression wrapper
```

### Pattern 1: Client-Side Image Compression Before Upload
**What:** Compress images to WebP (max 800KB) in the browser before sending to server
**When to use:** Every image upload flow (requests, jobs, inventory, maintenance photos)
**Example:**
```typescript
// lib/media/compression.ts
import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.8,              // 800KB max
    maxWidthOrHeight: 1920,       // reasonable max dimension
    useWebWorker: true,
    fileType: 'image/webp',       // force WebP output
    initialQuality: 0.85,
    preserveExif: false,          // strip metadata for privacy
  };
  return imageCompression(file, options);
}
```

### Pattern 2: Freehand Annotation Over Image
**What:** Full-screen dialog with react-sketch-canvas overlaying the selected photo, export merged result
**When to use:** Before uploading a photo, user can optionally annotate with freehand drawing
**Example:**
```typescript
// Simplified annotation flow
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';

function AnnotationDialog({ imageUrl, onSave, onCancel }) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

  const handleSave = async () => {
    // exportImage returns base64 data URL with background image included
    const dataUrl = await canvasRef.current?.exportImage('png');
    if (dataUrl) {
      // Convert data URL to File object
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'annotated.png', { type: 'image/png' });
      onSave(file); // This file then goes through compression pipeline
    }
  };

  return (
    <ReactSketchCanvas
      ref={canvasRef}
      backgroundImage={imageUrl}
      exportWithBackgroundImage={true}
      strokeWidth={4}
      strokeColor="red"
      width="100%"
      height="100%"
    />
  );
}
```

### Pattern 3: Google Vision REST API (No SDK)
**What:** Call Vision API directly via fetch from a Next.js API route, avoiding the heavy @google-cloud/vision SDK
**When to use:** After each successful image upload, trigger async description generation
**Example:**
```typescript
// app/api/vision/describe/route.ts
export async function POST(request: NextRequest) {
  const { imageBase64 } = await request.json();

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: imageBase64 },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 5 },
          ],
        }],
      }),
    }
  );

  const data = await response.json();
  const labels = data.responses?.[0]?.labelAnnotations || [];
  const description = labels.map((l: any) => l.description).join(', ');

  return NextResponse.json({ description });
}
```

### Pattern 4: Notification Polling Hook
**What:** Custom hook that polls for unread notifications every 30 seconds via server action
**When to use:** Wraps the entire dashboard layout, provides notification state to bell + dropdown
**Example:**
```typescript
// lib/notifications/hooks.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getUnreadNotifications, getUnreadCount } from './actions';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const refresh = useCallback(async () => {
    const [count, recent] = await Promise.all([
      getUnreadCount(),
      getUnreadNotifications({ limit: 10 }),
    ]);
    setUnreadCount(count);
    setNotifications(recent);
  }, []);

  useEffect(() => {
    refresh(); // Initial fetch
    const interval = setInterval(refresh, 30_000); // 30s polling
    return () => clearInterval(interval);
  }, [refresh]);

  return { unreadCount, notifications, refresh };
}
```

### Pattern 5: Server Action for Notification Creation
**What:** Helper function called within existing server actions to create notifications
**When to use:** Every mutation that should trigger a notification (status change, assignment, etc.)
**Example:**
```typescript
// lib/notifications/helpers.ts
import { createAdminClient } from '@/lib/supabase/admin';

interface NotifyParams {
  companyId: string;
  recipientIds: string[];   // users to notify
  actorId: string;          // user who performed the action (excluded from recipients)
  title: string;
  body?: string;
  type: string;             // e.g., 'status_change', 'assignment', 'approval'
  entityType?: string;      // e.g., 'request', 'job'
  entityId?: string;
}

export async function createNotifications(params: NotifyParams) {
  const { companyId, recipientIds, actorId, title, body, type, entityType, entityId } = params;
  const adminSupabase = createAdminClient();

  // Filter out the actor (never notify about own action)
  const filteredRecipients = recipientIds.filter(id => id !== actorId);

  if (filteredRecipients.length === 0) return;

  const rows = filteredRecipients.map(userId => ({
    company_id: companyId,
    user_id: userId,
    title,
    body,
    type,
    entity_type: entityType,
    entity_id: entityId,
  }));

  await adminSupabase.from('notifications').insert(rows);
}
```

### Pattern 6: Dashboard KPI Cards with Trend Indicators
**What:** Server component fetching aggregate counts with period-over-period comparison
**When to use:** Dashboard page KPI row
**Example:**
```typescript
// Fetch KPI data server-side with parallel queries
const [openRequests, overdueJobs, untriagedCount] = await Promise.all([
  supabase.from('requests').select('id', { count: 'exact', head: true })
    .in('status', ['submitted', 'triaged', 'in_progress'])
    .is('deleted_at', null),
  supabase.from('jobs').select('id', { count: 'exact', head: true })
    .eq('status', 'in_progress')
    .lt('created_at', overdueThreshold.toISOString())
    .is('deleted_at', null),
  supabase.from('requests').select('id', { count: 'exact', head: true })
    .eq('status', 'submitted')
    .is('deleted_at', null),
]);
```

### Pattern 7: Horizontal Bar Chart with Click Navigation
**What:** Recharts BarChart with layout="vertical" for horizontal bars, onClick navigating to filtered lists
**When to use:** Request and job status distribution charts
**Example:**
```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRouter } from 'next/navigation';

function StatusDistributionChart({ data, entityPath }) {
  const router = useRouter();

  const handleClick = (entry: any) => {
    router.push(`/${entityPath}?status=${entry.status}`);
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <XAxis type="number" />
        <YAxis type="category" dataKey="label" width={80} />
        <Tooltip />
        <Bar dataKey="count" onClick={(_, index) => handleClick(data[index])}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} cursor="pointer" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### Pattern 8: Excel Export via API Route
**What:** Server-side Excel generation returning .xlsx file as download response
**When to use:** Export buttons on list page toolbars
**Example:**
```typescript
// app/api/exports/requests/route.ts
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  // Auth check, fetch all data...
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Requests', {
    views: [{ state: 'frozen', ySplit: 1 }],  // Frozen header row
  });

  sheet.columns = [
    { header: 'ID', key: 'display_id', width: 18 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Status', key: 'status', width: 15 },
    // ...more columns
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data rows
  data.forEach(row => sheet.addRow(row));

  // Apply borders to all cells
  sheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Return as download
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="requests-export.xlsx"`,
    },
  });
}
```

### Anti-Patterns to Avoid
- **Server-side image compression:** Never process images on the server. The user's browser does the work via Web Workers, keeping server load minimal.
- **Heavy Vision SDK in server actions:** The `@google-cloud/vision` SDK is ~50MB. Use the REST API with `fetch` instead since we only need label detection.
- **Supabase Realtime for notifications:** User decided on short polling (30s). Do not import Realtime channels.
- **Mobile-first breakpoints:** Per CLAUDE.md, use `max-*` breakpoints only. Dashboard grid should be desktop-first.
- **Auto-dismissing notification toasts:** Per CLAUDE.md, feedback must be persistent (InlineFeedback with manual dismiss).
- **Polling in server components:** Polling must happen client-side. The notification hook must be a client component using `useEffect` + `setInterval`.
- **Fetching all notifications in the poll:** Only fetch unread count + recent 10 in the poll. Full history loads on the notification center page with pagination.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image compression in browser | Canvas-based resize + quality loop | `browser-image-compression` | WebP conversion, size targeting, Web Worker offloading, EXIF handling -- dozens of edge cases |
| Freehand canvas drawing | Raw HTML5 Canvas touch/mouse event handling | `react-sketch-canvas` | Touch normalization, SVG path smoothing, undo/redo, export with background -- complex interaction code |
| Excel file generation | CSV generation or manual XML construction | `exceljs` | .xlsx is a ZIP of XML files with complex relationships; styling, frozen panes, column widths need the full spec |
| Chart rendering | SVG path calculation / D3 directly | `recharts` | Responsive container, animation, tooltip positioning, axis scaling -- large surface area of bugs |
| Image label detection | Custom ML model or external OCR | Google Vision REST API | Pre-trained model with broad label vocabulary; single HTTP call with API key |

**Key insight:** Each of these domains (image processing, canvas interaction, spreadsheet format, chart layout, computer vision) has deep complexity beneath a simple surface. Using purpose-built libraries saves weeks of edge-case handling.

## Common Pitfalls

### Pitfall 1: WebP Compression Output Not Actually WebP
**What goes wrong:** `browser-image-compression` may fall back to JPEG/PNG if the browser doesn't support `canvas.toBlob('image/webp')`.
**Why it happens:** Safari older versions lacked WebP canvas export support (fixed in Safari 16+).
**How to avoid:** Set `fileType: 'image/webp'` explicitly in options. Check the output file's type after compression. All modern browsers (2024+) support WebP encoding.
**Warning signs:** Uploaded files showing as `image/jpeg` MIME type despite WebP configuration.

### Pitfall 2: react-sketch-canvas Export Without Background
**What goes wrong:** Exported image is just the drawing strokes on a transparent/white background, missing the original photo.
**Why it happens:** `exportWithBackgroundImage` defaults to `false`.
**How to avoid:** Always set `exportWithBackgroundImage={true}` on the canvas component. Verify in dev tools that the exported data URL contains the background.
**Warning signs:** Annotated images appear as red scribbles on white background.

### Pitfall 3: Notification Polling Memory Leak
**What goes wrong:** Multiple `setInterval` instances accumulate if the hook mounts/unmounts frequently (e.g., route changes).
**Why it happens:** Missing cleanup in `useEffect`, or stale closures capturing old state.
**How to avoid:** Always return cleanup function from `useEffect` that calls `clearInterval`. Use `useCallback` for the refresh function to maintain stable reference.
**Warning signs:** Network tab shows increasing polling frequency over time.

### Pitfall 4: Google Vision API Key Exposure
**What goes wrong:** API key ends up in client-side JavaScript bundle.
**Why it happens:** Calling the Vision API directly from the client, or importing the API key in a client component.
**How to avoid:** ALWAYS call Vision API from a server-side API route. Store the API key in `.env.local` as `GOOGLE_VISION_API_KEY` (without `NEXT_PUBLIC_` prefix). The client calls `/api/vision/describe` which proxies to Google.
**Warning signs:** API key visible in browser DevTools network requests.

### Pitfall 5: ExcelJS Buffer in Next.js Edge Runtime
**What goes wrong:** ExcelJS fails in Edge Runtime because it uses Node.js Buffer APIs.
**Why it happens:** Next.js API routes may default to Edge Runtime.
**How to avoid:** Explicitly set `export const runtime = 'nodejs'` in export API route files (or don't set runtime at all, as Node.js is the default for route handlers).
**Warning signs:** "Buffer is not defined" or "fs is not available" errors.

### Pitfall 6: Dashboard Queries Ignoring Soft Deletes
**What goes wrong:** KPI counts include soft-deleted records, inflating metrics.
**Why it happens:** Aggregate count queries forget to add `.is('deleted_at', null)` filter.
**How to avoid:** RLS policies already filter `deleted_at IS NULL` on SELECT, so queries through the authenticated Supabase client will automatically exclude soft-deleted records. However, if using `adminClient` (service_role), you MUST add the filter manually.
**Warning signs:** KPI counts don't match list page record counts.

### Pitfall 7: Notification INSERT Without service_role
**What goes wrong:** Notification creation fails silently due to RLS.
**Why it happens:** The `notifications` table has no INSERT policy for authenticated users (by design -- INSERT is via service_role only).
**How to avoid:** Always use `createAdminClient()` (service_role) for notification INSERTs, matching the existing pattern in the photo upload route.
**Warning signs:** No notifications appearing despite triggering actions.

### Pitfall 8: Recharts ResponsiveContainer Inside Flex/Grid Without Height
**What goes wrong:** Chart renders at 0 height or doesn't appear.
**Why it happens:** `ResponsiveContainer` needs an explicit height or a parent with explicit height. In flex/grid layouts, height may be implicit.
**How to avoid:** Always wrap `ResponsiveContainer` in a `<div>` with explicit `height` or `min-height`. Example: `<div style={{ height: 300 }}><ResponsiveContainer>...</ResponsiveContainer></div>`.
**Warning signs:** Chart area is blank; inspecting shows SVG with 0 height.

## Code Examples

### Generalized Upload Route (Entity-Agnostic)
```typescript
// app/api/uploads/entity-photos/route.ts
// Extends existing request-photos pattern to any entity type
const ENTITY_CONFIGS: Record<string, { bucket: string; maxFiles: number }> = {
  request: { bucket: 'request-photos', maxFiles: 10 },
  job: { bucket: 'job-photos', maxFiles: 10 },
  inventory: { bucket: 'inventory-photos', maxFiles: 10 },
  job_comment: { bucket: 'job-photos', maxFiles: 3 },
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const entityType = formData.get('entity_type') as string;
  const entityId = formData.get('entity_id') as string;

  const config = ENTITY_CONFIGS[entityType];
  if (!config) return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });

  // ... auth, validation, upload using config.bucket and config.maxFiles
  // Storage path: `${companyId}/${entityType}/${entityId}/${uuid}-${filename}`
}
```

### Notification Creation in Existing Server Actions
```typescript
// Inside triageRequest server action (existing in request-actions.ts)
// After successful triage update:
await createNotifications({
  companyId: profile.company_id,
  recipientIds: [request.requester_id, ...(assignedTo ? [assignedTo] : [])],
  actorId: profile.id,
  title: `Request ${request.display_id} triaged`,
  body: `Priority set to ${priority}, assigned to ${assigneeName}`,
  type: 'status_change',
  entityType: 'request',
  entityId: request.id,
});
```

### Dashboard Date Range Filter
```typescript
// Presets for date range filter
const DATE_PRESETS = [
  { label: 'Today', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'This Week', getValue: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'This Quarter', getValue: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
];
// "Custom" opens a date range picker (two date inputs)
```

### KPI Trend Calculation
```typescript
// Server-side: compare current period count vs previous period
function calculateTrend(current: number, previous: number): { direction: 'up' | 'down' | 'flat'; percentage: number } {
  if (previous === 0) return { direction: current > 0 ? 'up' : 'flat', percentage: 0 };
  const change = ((current - previous) / previous) * 100;
  return {
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    percentage: Math.abs(Math.round(change)),
  };
}
```

### Excel Export Helper (Shared Styling)
```typescript
// lib/exports/excel-helpers.ts
import ExcelJS from 'exceljs';

export function applyStandardStyles(sheet: ExcelJS.Worksheet) {
  // Bold white headers on blue background
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;

  // Borders on all cells
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Auto-fit columns (approximate based on header length + padding)
  sheet.columns.forEach((col) => {
    if (col.header && typeof col.header === 'string') {
      const minWidth = col.header.length + 4;
      col.width = Math.max(col.width || 10, minWidth);
    }
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side image resize (Sharp/ImageMagick) | Client-side compression with Web Workers | 2022+ with browser-image-compression v2 | Zero server CPU for image processing; immediate preview |
| WebSocket for notifications | Short polling for simple apps, SSE for moderate, WebSocket for real-time | Ongoing | Polling at 30s is perfectly adequate for this use case; avoids connection management complexity |
| CSV export | Styled .xlsx via ExcelJS | 2023+ ExcelJS v4 | Users expect styled Excel files, not raw CSVs; ExcelJS handles the full spec |
| @google-cloud/vision SDK (50MB+) | Vision REST API with API key | Always available | REST API is the lighter option when only using one feature (label detection) |
| canvas-based drawing (manual) | SVG-based drawing (react-sketch-canvas) | 2023+ react-sketch-canvas v6 | SVG is resolution-independent, better for mobile, smoother strokes |

**Deprecated/outdated:**
- `react-canvas-draw`: Abandoned in 2021, last npm publish 3+ years ago. Use `react-sketch-canvas` instead.
- `xlsx` (SheetJS Community): Free version cannot style cells. Use `exceljs` for styled exports.

## Open Questions

1. **Google Vision API Key vs Service Account**
   - What we know: REST API supports both API key and OAuth token authentication. API key is simpler for server-side usage.
   - What's unclear: Whether the user has an existing Google Cloud project or needs to create one. Whether they prefer API key or service account auth.
   - Recommendation: Use API key auth (simpler). Document the setup steps: create GCP project, enable Vision API, create API key, add to `.env.local`.

2. **Supabase Storage Bucket Configuration**
   - What we know: The existing `request-photos` bucket is used by the current upload route. We need buckets for jobs, inventory, maintenance.
   - What's unclear: Whether `request-photos` bucket is public or private (signed URLs vs public URLs). Current code uses `adminSupabase.storage` for uploads but the detail page must generate URLs for display.
   - Recommendation: Use private buckets with signed URLs (more secure, company-scoped). Generate signed URLs server-side when loading detail pages. The existing pattern in the request detail page likely already handles this.

3. **Vision API Cost and Rate Limits**
   - What we know: Vision API charges per image ($1.50/1000 images for label detection as of 2025). First 1000 units/month free.
   - What's unclear: Expected upload volume per month.
   - Recommendation: Implement the Vision API call as async (fire-and-forget after upload). If it fails, the description field remains null (graceful degradation). Add error handling that doesn't block the upload flow.

4. **Dashboard Access for Non-GA-Lead Roles**
   - What we know: Requirements say "GA Lead dashboard" but the current `DASHBOARD_VIEW` permission is granted to all roles. KPI cards reference operational metrics that only GA Lead/Admin would act on.
   - What's unclear: Whether general_user and ga_staff see the same dashboard or a simpler version.
   - Recommendation: Show the full dashboard to ga_lead, admin, and finance_approver. Show a simpler welcome/overview to general_user and ga_staff (their existing dashboard with perhaps just their own request/job counts).

## Sources

### Primary (HIGH confidence)
- [/donaldcwl/browser-image-compression] - Context7: compression API, options including `fileType` for WebP, `maxSizeMB`, Web Worker support
- [/vinothpandian/react-sketch-canvas] - Context7: `backgroundImage` prop, `exportImage('png')`, `exportWithBackgroundImage` option, ref-based API
- [/recharts/recharts] - Context7: BarChart with layout="vertical", ResponsiveContainer, Cell component for conditional colors, click event handling
- [/exceljs/exceljs] - Context7: Workbook/Worksheet API, frozen panes `{ state: 'frozen', ySplit: 1 }`, cell borders, font/fill styling, column definitions
- [/supabase/supabase-js] - Context7: Storage upload/download API, signed URLs, public URLs, createSignedUrl

### Secondary (MEDIUM confidence)
- [Google Cloud Vision API docs](https://docs.cloud.google.com/vision/docs/labels) - Label detection REST API endpoint, request/response format, Node.js client examples
- [Google Vision REST API](https://cloud.google.com/vision/docs/reference/rest/v1/images/annotate) - REST endpoint `https://vision.googleapis.com/v1/images:annotate`, base64 image input format
- [react-sketch-canvas docs](https://vinoth.info/react-sketch-canvas/) - Props API including `backgroundImage`, `preserveBackgroundImageAspectRatio`, `exportWithBackgroundImage`
- [Recharts BarChart API](https://recharts.github.io/en-US/api/BarChart/) - `layout` prop documentation, vertical layout for horizontal bars

### Tertiary (LOW confidence)
- Browser WebP support statistics (97%+ as of 2024) - web search, multiple sources agree
- ExcelJS vs xlsx comparison (styling support) - community consensus, verified by exceljs README

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All recommended libraries verified via Context7 with current documentation and active maintenance
- Architecture: HIGH - Patterns align with existing codebase conventions (API routes for uploads, server actions for mutations, admin client for service_role operations)
- Pitfalls: HIGH - Documented from verified library documentation and established Next.js/Supabase patterns
- Notifications: HIGH - Database table and RLS policies already exist; polling pattern is straightforward React
- Dashboard: MEDIUM - Chart interaction patterns verified, but exact query performance for aggregate KPIs depends on data volume (should be fine for expected scale)
- Vision API: MEDIUM - REST API approach verified, but API key setup and cost model need user confirmation

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (30 days - stable libraries, established patterns)
