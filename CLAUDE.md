# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server (Next.js)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint (v9 flat config with core-web-vitals + typescript rules)

## Architecture

This is a **Next.js 16** app using the **App Router** (`app/` directory), **React 19**, **TypeScript** (strict mode), and **Tailwind CSS v4**.

- `app/layout.tsx` — Root layout with Geist font family loaded via `next/font/google` (CSS vars: `--font-geist-sans`, `--font-geist-mono`)
- `app/page.tsx` — Home page (server component by default)
- `app/globals.css` — Tailwind v4 import + CSS custom properties for theming (light/dark via `prefers-color-scheme`)

## Key Conventions

- **Import alias:** `@/*` maps to the project root
- **Tailwind v4** uses `@import "tailwindcss"` syntax with `@tailwindcss/postcss` plugin
- **ESLint v9** flat config format (`eslint.config.mjs`), not legacy `.eslintrc`
- **Package manager:** npm

## Responsive Design

- **Desktop-first (MANDATORY).** Default styles target desktop. Use `max-*` breakpoints to override for smaller screens.
  - Correct: `grid-cols-[1fr_380px] max-lg:grid-cols-1`
  - Wrong: `grid-cols-1 lg:grid-cols-[1fr_380px]`
- **Never use mobile-first breakpoints** (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`). Always use `max-sm:`, `max-md:`, `max-lg:`, `max-xl:`, `max-2xl:`.
- **Tailwind arbitrary values use underscores for spaces** (e.g., `grid-cols-[1fr_380px]` not `grid-cols-[1fr,380px]`).

## UI Conventions

- **Dropdowns with many options:** Use shadcn **Combobox** (basic) instead of plain Select for any dropdown where the list may grow large (e.g., Company, Division, Location, Category, User selectors). The combobox turns the trigger into a search box on click, allowing type-to-filter. Only use plain Select for short, fixed lists (e.g., Role with 5 options, Type with 2 options).
- **Duplicate name checks on all write paths:** Create, Update, AND Restore actions must all check for duplicate names among active (non-deleted) entities before proceeding. Restore is easy to miss — a deleted entity's name may conflict with a newly created one.
- **Feedback messages must be persistent.** Never auto-dismiss success/error messages with a timer. Users may be in another tab or not paying attention. Use the `InlineFeedback` component with an `onDismiss` callback (X button) so users dismiss manually.
- **Detail pages ARE edit pages (MANDATORY).** Never have separate "view" and "edit" pages/modes. The detail page should allow inline editing for users with edit permission. No separate edit button that navigates to an edit form — fields are directly editable on the detail page.
- **Content max width:** Defined once in `app/(dashboard)/layout.tsx` via the `max-w-[...]` wrapper around `{children}`. Do NOT add max-width constraints in individual page components -- update the layout value instead.
- **Soft delete terminology:** Always use "Deactivate" / "Reactivate" in UI labels, buttons, and messages. Never use "Delete" / "Restore" for soft-delete operations. The `DeleteConfirmDialog` component handles the deactivate confirmation flow.
- **Display IDs:** Always render display IDs (e.g., `REQ-AC26-001`) with `font-mono` class to visually distinguish machine-readable identifiers from regular text.

## UI Patterns & Components

### Table Row Actions
- Use **ghost buttons** with `text-blue-600 hover:underline` styling for row actions.
- Domain entity tables (requests, jobs, assets, schedules): Show a single **"View"** button that opens a view modal.
- Admin settings tables (companies, divisions, locations, categories, users): Show a single **"Edit"** button that opens a form dialog.

### View Modal + Detail Page (Dual Access)
- Every domain entity (requests, jobs, assets, templates, schedules) has **both** a view modal AND a full detail page (`/[id]`).
- **View modal:** Quick preview from table row "View" button. Read-only with action buttons in a sticky bottom bar.
- **Detail page (`/[id]`):** Full editing with inline fields, two-column layout, timeline.
- Modal opens via URL param `?view={id}` for shareability.

### Create Flows
- New entities are created via **modal dialogs** triggered by CTA buttons in the page header. No separate `/new` pages.
- CTA buttons support permalink via `?action=create` URL param for direct linking.

### Detail Page Layout
- **Two-column grid:** `grid-cols-[1fr_380px] max-lg:grid-cols-1` — left column for content/fields, right column for Activity Timeline.
- Timeline column has `maxHeight: calc(100vh - 200px)` with internal scroll.
- Header shows: display ID (font-mono, text-2xl) + status badge + priority badge + creator line ("Name · Created dd-MM-yyyy").

### Sticky Save Bar
- Detail pages with editable fields show a **sticky bottom bar** fixed to the viewport bottom.
- Bar only appears when the form has unsaved changes (dirty state).
- Contains "Unsaved changes" text + Save button.
- Uses `form={formId}` attribute for external form submission (button lives outside the `<form>` element).
- Components expose `formId`, `onDirtyChange`, and `onSubmittingChange` props.

### Forms
- All forms use **react-hook-form** + **zod** resolver + shadcn `<Form>` / `<FormField>` / `<FormControl>` components.
- Never use raw `useState` for form state — always use `useForm` with `zodResolver`.

### Server Actions
- All mutations use **next-safe-action** with typed client chains defined in `lib/safe-action.ts`:
  - `actionClient` — base (no auth)
  - `authActionClient` — requires authenticated user + profile
  - `adminActionClient` — requires admin role + uses service role Supabase client
- Action files live in `app/actions/`.

### Shared Components
- **`PhotoUpload`** (`components/media/photo-upload.tsx`): Single consolidated photo upload with compression, annotation, mobile capture. Used for requests, assets, jobs, schedules.
- **`PriorityBadge`** (`components/priority-badge.tsx`): Single generic priority badge for all entities.
- **Status badges:** Generic `StatusBadge` base + entity-specific wrappers (`RequestStatusBadge`, `JobStatusBadge`, `AssetStatusBadge`, `ScheduleStatusBadge`).
- **`InlineFeedback`** (`components/inline-feedback.tsx`): Persistent success/error messages with manual dismiss.
- **`DeleteConfirmDialog`** (`components/delete-confirm-dialog.tsx`): Deactivation confirmation with dependency count blocking.

### Admin Settings Pattern
- Settings page at `/admin/settings` uses a **tabbed interface** (Companies, Divisions, Locations, Categories, Users).
- Each tab renders a data table with "Edit" row action opening a form dialog.
- Create via CTA button in tab header → same form dialog in create mode.

## Validation Conventions

- **All text fields MUST have max length in Zod schemas.** Every `z.string()` field must include `.max(N)` — no unbounded strings. Also add `maxLength={N}` on the corresponding `<Input>` component.
- Use **realistic** limits based on what the field actually holds — don't over-allocate. Think about the longest real-world value a user would actually type:
  - **Name fields (company, division, location, category):** 60 chars
  - **Person name:** 60 chars
  - **Code/short identifier:** 10 chars
  - **Email:** 60 chars
  - **Phone:** 20 chars
  - **Address:** 200 chars
  - **Description/notes:** 200 chars
  - **Long text (comments, reasons):** 1000 chars
  - **Title (request, job):** 150 chars

## Formatting Rules

- **Date format (MANDATORY):** Always use `dd-MM-yyyy` (e.g., `13-02-2026`). Never use `MMM d, yyyy` or any other format.
- **Date+time format:** `dd-MM-yyyy, HH:mm:ss` (e.g., `13-02-2026, 14:30:00`). 24-hour clock.
- **Currency:** IDR formatting throughout (Rp prefix, dot thousands separator)
