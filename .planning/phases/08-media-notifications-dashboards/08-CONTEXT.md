# Phase 8: Media, Notifications & Dashboards - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

The application handles images intelligently (compression, annotation, AI descriptions), keeps users informed through in-app notifications, and provides management with operational dashboards and data exports. This phase depends on Phases 5 (Jobs & Approvals), 6 (Inventory), and 7 (Preventive Maintenance) being complete.

</domain>

<decisions>
## Implementation Decisions

### Image annotation & gallery
- Freehand drawing only — no text overlay, no shapes, no arrows
- Thumbnail grid layout on detail pages, clicking opens a full-screen modal lightbox with left/right navigation
- Google Vision API auto-triggers on every upload; descriptions stored in DB
- AI-generated descriptions displayed inside lightbox only (not under thumbnails in the grid)
- Client-side compression to WebP, max 800KB before upload
- Up to 10 images per entity, company-scoped storage paths

### Notification behavior
- Short polling every 30 seconds (not Supabase Realtime)
- Bell icon with unread count badge in the app header
- Dropdown shows 10 most recent notifications with "View all" link to notification center
- Full notification center page: flat reverse-chronological list with filter chips (All, Unread, Requests, Jobs, etc.)
- Auto-read on click (navigating to entity marks notification as read) + "Mark all as read" bulk button
- No manual per-item read toggle
- Notification events: status changes, assignments, approvals, completions, auto-accept warnings
- Never notify the actor about their own action

### Dashboard layout & metrics
- Single row of 4-5 KPI cards at top (open requests, overdue jobs, untriaged count, etc.)
- KPI cards show trend indicators — up/down arrows with percentage change vs previous period
- Clicking a KPI card navigates to the relevant filtered list page
- Date range filter with presets: Today, This Week, This Month, This Quarter, Custom range
- Request and job status distribution: horizontal bar charts (not donut/pie)
- Clicking a chart segment navigates to the filtered list
- Staff workload: table with columns — Staff name, Active jobs, Completed (this month), Overdue. Sortable.
- Request aging: buckets table with columns — 0-3 days, 4-7 days, 8-14 days, 15+ days (count of open requests per bucket)
- Maintenance due/overdue summary: list grouped by urgency — overdue at top (red), due this week (yellow), due this month (normal). Each item shows asset + template + due date.
- Inventory counts by status/category

### Excel exports
- Styled Excel files: bold headers, auto-fitted column widths, borders, frozen header row
- Export button on each list page toolbar (Requests, Jobs, Inventory, Maintenance)
- Always export all data — does not respect active page filters
- Entity-only columns — no denormalized related data (e.g., request export does not include job info)

### Claude's Discretion
- Charting library choice (recharts, chart.js, etc.)
- Exact KPI card selection and ordering
- Notification polling implementation details
- Image annotation library/approach
- Excel library choice (exceljs, xlsx, etc.)
- Loading states and skeleton designs for dashboard

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-media-notifications-dashboards*
*Context gathered: 2026-02-24*
