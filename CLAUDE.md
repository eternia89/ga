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

## UI Conventions

- **Dropdowns with many options:** Use shadcn **Combobox** (basic) instead of plain Select for any dropdown where the list may grow large (e.g., Company, Division, Location, Category, User selectors). The combobox turns the trigger into a search box on click, allowing type-to-filter. Only use plain Select for short, fixed lists (e.g., Role with 5 options, Type with 2 options).
- **Duplicate name checks on all write paths:** Create, Update, AND Restore actions must all check for duplicate names among active (non-deleted) entities before proceeding. Restore is easy to miss — a deleted entity's name may conflict with a newly created one.
- **Feedback messages must be persistent.** Never auto-dismiss success/error messages with a timer. Users may be in another tab or not paying attention. Use the `InlineFeedback` component with an `onDismiss` callback (X button) so users dismiss manually.

## Validation Conventions

- **All text fields MUST have max length in Zod schemas.** Every `z.string()` field must include `.max(N)` — no unbounded strings. Also add `maxLength={N}` on the corresponding `<Input>` component.
- Use **realistic** limits based on what the field actually holds — don't over-allocate. Think about the longest real-world value a user would actually type:
  - **Name fields (company, division, location, category):** 100 chars
  - **Person name:** 100 chars
  - **Code/short identifier:** 10 chars
  - **Email:** 255 chars
  - **Phone:** 20 chars
  - **Address:** 200 chars
  - **Description/notes:** 200 chars
  - **Long text (comments, reasons):** 1000 chars
  - **Title (request, job):** 150 chars

## Formatting Rules

- **Date format (MANDATORY):** Always use `dd-MM-yyyy` (e.g., `13-02-2026`). Never use `MMM d, yyyy` or any other format.
- **Date+time format:** `dd-MM-yyyy, HH:mm:ss` (e.g., `13-02-2026, 14:30:00`). 24-hour clock.
- **Currency:** IDR formatting throughout (Rp prefix, dot thousands separator)
