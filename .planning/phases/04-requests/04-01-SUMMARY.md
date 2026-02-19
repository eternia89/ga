---
phase: 04-requests
plan: 01
subsystem: api
tags: [supabase, supabase-storage, next-safe-action, react-hook-form, zod, shadcn, combobox, file-upload]

# Dependency graph
requires:
  - phase: 03-admin-system-configuration
    provides: authActionClient pattern, InlineFeedback component, Form/shadcn component library, database types

provides:
  - DB migration adding cancelled status, generate_request_display_id function, and request-photos storage bucket
  - All 7 request server actions (createRequest, updateRequest, triageRequest, cancelRequest, rejectRequest, getRequestPhotos, deleteMediaAttachment)
  - Photo upload API route at /api/uploads/request-photos (multipart, auth-validated, Storage-backed)
  - Reusable Combobox component for searchable dropdowns (Location, Category, PIC)
  - Request submission form at /requests/new (description + location + photos)
  - Status/priority constants with user-facing labels and color classes
  - Request and MediaAttachment types in database.ts

affects: [04-02, 04-03, 05-jobs, 08-media]

# Tech tracking
tech-stack:
  added: [shadcn-command, shadcn-popover, shadcn-breadcrumb, shadcn-skeleton, shadcn-scroll-area]
  patterns:
    - Two-step form submit: create request first, upload photos second (avoids orphaned files)
    - authActionClient + manual role check inside action (not adminActionClient) for request mutations
    - API route for file uploads (not server actions) to handle multipart body size
    - generate_request_display_id: SECURITY DEFINER PostgreSQL function with atomic UPDATE...RETURNING for race-free sequential IDs
    - Private Supabase Storage bucket with signed URLs (never expose file_path to client)

key-files:
  created:
    - supabase/migrations/00007_requests_phase4.sql
    - lib/constants/request-status.ts
    - lib/validations/request-schema.ts
    - components/combobox.tsx
    - app/actions/request-actions.ts
    - app/api/uploads/request-photos/route.ts
    - components/requests/request-submit-form.tsx
    - components/requests/request-photo-upload.tsx
    - app/(dashboard)/requests/new/page.tsx
    - components/ui/command.tsx
    - components/ui/popover.tsx
    - components/ui/breadcrumb.tsx
    - components/ui/skeleton.tsx
    - components/ui/scroll-area.tsx
  modified:
    - lib/types/database.ts

key-decisions:
  - "Two-step photo upload: create request first (returns requestId), then upload photos in follow-up API call to /api/uploads/request-photos — prevents orphaned files in Storage"
  - "Use API route (not server action) for file uploads to handle multipart/form-data without body size limits"
  - "generate_request_display_id uses SECURITY DEFINER so it can read companies and update id_counters regardless of RLS — same pattern as existing generate_display_id"
  - "Combobox uses w-[--radix-popover-trigger-width] CSS variable to match trigger width (Radix UI pattern)"
  - "requestSubmitSchema uses z.string().uuid() for location_id — empty string '' fails uuid validation providing the required-field error"

patterns-established:
  - "Photo upload: POST /api/uploads/request-photos with FormData(request_id + photos[]) — admin client uploads to Storage, inserts media_attachments rows"
  - "Request actions: all use authActionClient, elevated actions (triage/reject) check role inside the action body"
  - "Status display: always use STATUS_LABELS[request.status] from lib/constants/request-status.ts — never display raw DB status value"

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 4 Plan 01: Request Submission Backend and Form Summary

**Full request submission backend: DB migration with cancelled status + generate_request_display_id (2-digit year, atomic counter) + Supabase Storage bucket, 7 server actions with role guards, photo upload API route, Combobox component, and /requests/new form page**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-02-19T08:40:47Z
- **Completed:** 2026-02-19T08:45:41Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments

- Established the complete request data layer: migration, types, constants, schemas, and all 7 server actions
- Built reusable Combobox component (Command + Popover) and photo upload component with preview/remove
- Implemented end-to-end submission flow: /requests/new form → createRequest action → photo upload API → redirect

## Task Commits

Each task was committed atomically:

1. **Task 1: DB migration, constants, types, and Combobox component** - `c8cf93e` (feat)
2. **Task 2: Server actions, photo upload API route, and submission form page** - `8fc0eda` (feat)

## Files Created/Modified

- `supabase/migrations/00007_requests_phase4.sql` - Adds cancelled status constraint, generate_request_display_id function, request-photos bucket + RLS policies
- `lib/constants/request-status.ts` - STATUS_LABELS (submitted->"New" mapping), STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS
- `lib/validations/request-schema.ts` - requestSubmitSchema, requestEditSchema, triageSchema, rejectSchema
- `lib/types/database.ts` - Added Request, RequestWithRelations, MediaAttachment types
- `components/combobox.tsx` - Reusable searchable dropdown built from shadcn Command + Popover
- `app/actions/request-actions.ts` - 7 server actions using authActionClient with role checks
- `app/api/uploads/request-photos/route.ts` - POST handler for multipart file uploads with auth + Storage
- `components/requests/request-photo-upload.tsx` - Preview grid with add/remove, 3-photo limit, 5MB/mime validation
- `components/requests/request-submit-form.tsx` - Description + location combobox + photo upload with two-step submit
- `app/(dashboard)/requests/new/page.tsx` - Server component fetching locations by company, rendering form
- `components/ui/command.tsx`, `popover.tsx`, `breadcrumb.tsx`, `skeleton.tsx`, `scroll-area.tsx` - shadcn components

## Decisions Made

- Two-step photo upload pattern chosen over atomic FormData approach to avoid orphaned files and simplify error handling
- `authActionClient` used for ALL request actions; triage and reject check role inside the action (not `adminActionClient`)
- API route used for file upload instead of server action (avoids Next.js body size limits on multipart)
- `generate_request_display_id` marked `SECURITY DEFINER SET search_path = public` so it can access companies and id_counters across RLS boundaries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Lint shows 2 `<img>` warnings in request-photo-upload.tsx (pre-existing warning pattern in codebase). Using native `<img>` is correct here since blob: URLs from `URL.createObjectURL` are not supported by Next.js `<Image />`. All lint errors are pre-existing from Phase 3 (shadcn components, data-table).

## User Setup Required

**DB migration must be pushed to Supabase:**
```bash
supabase db push
```
This applies the `00007_requests_phase4.sql` migration which creates the `request-photos` storage bucket, adds the `cancelled` status, and creates the `generate_request_display_id` function.

## Next Phase Readiness

- Request submission backend complete — Plan 02 can wire triage/reject/cancel UI to these server actions
- All 7 server actions ready for Plan 02 (request list, triage modal, reject dialog, cancel dialog)
- Combobox component ready for reuse in triage modal (Category and PIC dropdowns)
- Status/priority constants ready for request list column rendering

## Self-Check: PASSED

All 11 files verified to exist. Both task commits (c8cf93e, 8fc0eda) verified in git log. TypeScript compiles clean. Build succeeds.

---
*Phase: 04-requests*
*Completed: 2026-02-19*
