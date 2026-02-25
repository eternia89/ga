---
phase: 08-media-notifications-dashboards
plan: "02"
subsystem: media
tags: [google-vision, ai, image-description, lightbox, photo-grid, next-js]

# Dependency graph
requires:
  - phase: 08-01
    provides: entity-photos upload route (app/api/uploads/entity-photos/route.ts) and media_attachments table with description column

provides:
  - Google Vision REST API proxy route for label-based image descriptions
  - Fire-and-forget Vision description generation after each photo upload
  - Enhanced PhotoLightbox component with AI description display
  - Reusable PhotoGrid thumbnail component that manages lightbox state

affects: [all detail pages that display entity photos (requests, jobs, inventory, maintenance)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fire-and-forget Vision API call: .then().catch(()=>{}) on file.arrayBuffer() promise, non-blocking, never delays upload response"
    - "Graceful degradation: missing GOOGLE_VISION_API_KEY returns {description: null} with 200 status, never errors"
    - "Entity-agnostic media components: PhotoItem type with optional description field, PhotoGrid manages lightbox state internally"

key-files:
  created:
    - app/api/vision/describe/route.ts
    - components/media/photo-lightbox.tsx
    - components/media/photo-grid.tsx
  modified:
    - app/api/uploads/entity-photos/route.ts

key-decisions:
  - "Vision API call is fire-and-forget directly in upload route (not HTTP self-call) — simpler, avoids auth cookie forwarding complexity"
  - "GOOGLE_VISION_API_KEY is server-side only (no NEXT_PUBLIC_ prefix) — key never exposed to browser"
  - "AI descriptions displayed inside lightbox only (not under thumbnails) — per REQ-MEDIA-006 and existing plan decision"
  - "Insert now returns inserted row id via .select('id').single() to pass attachmentId to Vision fire-and-forget"

patterns-established:
  - "PhotoItem type (id, url, fileName, description?) is shared between photo-lightbox and photo-grid via re-export"
  - "PhotoGrid renders null for empty photos arrays — no empty state UI needed by consumers"

requirements-completed:
  - REQ-MEDIA-004
  - REQ-MEDIA-006

# Metrics
duration: 2min
completed: 2026-02-25
---

# Phase 08 Plan 02: Vision AI Description + Photo Lightbox + Thumbnail Grid Summary

**Google Vision LABEL_DETECTION proxy route with fire-and-forget upload integration, enhanced PhotoLightbox with AI description panel, and reusable PhotoGrid thumbnail component**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-25T05:07:52Z
- **Completed:** 2026-02-25T05:10:00Z
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments

- Vision API proxy route (`app/api/vision/describe/route.ts`) calls Google Vision REST API with LABEL_DETECTION, updates `media_attachments.description` via adminClient, degrades gracefully when API key absent
- Upload route updated to return inserted attachment id and trigger non-blocking Vision description generation as fire-and-forget after each successful upload
- Enhanced `PhotoLightbox` with AI description panel displayed below image (only when `description` is non-null), keyboard navigation (arrows + Escape), and photo counter
- Reusable `PhotoGrid` renders responsive thumbnail grid (grid-cols-5 desktop) and manages lightbox open/close state internally — entity-agnostic

## Task Commits

Each task was committed atomically:

1. **Task 1: Vision API proxy route and fire-and-forget upload integration** - `ab6bc9b` (feat)
2. **Task 2: Enhanced photo lightbox with AI descriptions and thumbnail grid** - `510cca3` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `app/api/vision/describe/route.ts` — POST endpoint: auth check, Vision REST API call (LABEL_DETECTION x5), update media_attachments.description, graceful degradation
- `app/api/uploads/entity-photos/route.ts` — Updated: .select('id').single() on insert, fire-and-forget Vision call via .then().catch(()=>{}) pattern
- `components/media/photo-lightbox.tsx` — Enhanced lightbox: PhotoItem type with optional description, description panel below image, keyboard nav, counter
- `components/media/photo-grid.tsx` — Thumbnail grid: responsive cols, button thumbnails, manages PhotoLightbox state, returns null for empty arrays

## Decisions Made

- Vision API called directly in upload route (not via HTTP self-call to /api/vision/describe) — avoids auth cookie forwarding complexity and is simpler
- `GOOGLE_VISION_API_KEY` env var has no `NEXT_PUBLIC_` prefix — server-side only, never exposed to browser
- Insert in upload route updated to `.select('id').single()` to retrieve the new attachment id for passing to Vision fire-and-forget
- AI descriptions shown in lightbox only, not under thumbnail grid — per plan decision (per REQ-MEDIA-006 lightbox display requirement)

## Deviations from Plan

None - plan executed exactly as written. The plan offered two implementation approaches for Vision integration (HTTP self-call vs. direct fetch); the preferred "simpler" approach (direct Vision fetch in upload route) was used as indicated.

## Issues Encountered

None. Pre-existing TypeScript errors in `components/dashboard/status-bar-chart.tsx` (from Phase 08-05 plan) were observed but are out of scope for this plan.

## User Setup Required

**External service requires manual configuration.** Google Vision API setup needed:
1. Go to Google Cloud Console > APIs & Services > Library > Search "Cloud Vision API" > Enable
2. Go to APIs & Services > Credentials > Create API Key
3. Add to `.env.local`: `GOOGLE_VISION_API_KEY=your-key-here`
4. Without this key, uploads succeed but descriptions remain null (graceful degradation)

## Next Phase Readiness

- `PhotoGrid` and `PhotoLightbox` are ready to be integrated into all entity detail pages (requests, jobs, assets, PM jobs)
- Vision descriptions will auto-populate on new uploads when `GOOGLE_VISION_API_KEY` is configured
- Plan 08-04 (Notification Center UI) can proceed independently

---
*Phase: 08-media-notifications-dashboards*
*Completed: 2026-02-25*
