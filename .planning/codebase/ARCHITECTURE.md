# Architecture

**Analysis Date:** 2026-02-10

## Pattern Overview

**Overall:** Next.js App Router with React Server Components

**Key Characteristics:**
- File-system based routing via `app/` directory
- Server-first rendering with React Server Components as default
- CSS-in-JS theming via CSS custom properties
- Static asset serving from `public/` directory

## Layers

**Presentation Layer:**
- Purpose: UI components and page layouts
- Location: `app/`
- Contains: React components (.tsx), page routes, layouts, global styles
- Depends on: Next.js framework, React 19, Tailwind CSS
- Used by: End users via browser requests

**Styling Layer:**
- Purpose: Global styles and theming
- Location: `app/globals.css`
- Contains: Tailwind v4 imports, CSS custom properties, theme tokens
- Depends on: Tailwind CSS v4, PostCSS
- Used by: All UI components

**Static Asset Layer:**
- Purpose: Publicly accessible static files
- Location: `public/`
- Contains: SVG images (next.svg, vercel.svg, file.svg, globe.svg, window.svg)
- Depends on: Nothing
- Used by: Image components via Next.js Image optimization

**Configuration Layer:**
- Purpose: Build, lint, and type-checking configuration
- Location: Root directory
- Contains: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`
- Depends on: TypeScript, ESLint, Next.js
- Used by: Build tools and dev server

## Data Flow

**Page Request Flow:**

1. Browser requests route (e.g., `/`)
2. Next.js matches file-system route to `app/page.tsx`
3. `app/layout.tsx` wraps page component with root HTML structure
4. Server component renders on server, sends HTML to client
5. Client hydrates interactive components (currently none in starter)
6. CSS variables from `globals.css` applied via Tailwind

**State Management:**
- Currently none - starter uses server components only
- No client-side state management library present

## Key Abstractions

**Root Layout:**
- Purpose: Defines HTML document structure and global providers
- Examples: `app/layout.tsx`
- Pattern: React component that wraps all pages, includes metadata export

**Page Components:**
- Purpose: Define route-specific UI
- Examples: `app/page.tsx`
- Pattern: Default export function, server component unless marked with "use client"

**Metadata:**
- Purpose: SEO and document head management
- Examples: `metadata` export in `app/layout.tsx`
- Pattern: Export `metadata` object from layout/page for Next.js to inject

**Font Loading:**
- Purpose: Optimize web font loading
- Examples: Geist fonts in `app/layout.tsx`
- Pattern: Import from `next/font/google`, generate CSS variables, apply to elements

## Entry Points

**Development Server:**
- Location: `package.json` script `"dev": "next dev"`
- Triggers: `npm run dev` command
- Responsibilities: Starts Next.js dev server on port 3000, enables hot reload

**Production Build:**
- Location: `package.json` script `"build": "next build"`
- Triggers: `npm run build` command
- Responsibilities: Compiles TypeScript, bundles assets, optimizes for production

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Provides HTML structure, loads fonts, applies global styles

**Home Page:**
- Location: `app/page.tsx`
- Triggers: Requests to `/` route
- Responsibilities: Renders landing page content

## Error Handling

**Strategy:** Next.js default error boundaries (not customized)

**Patterns:**
- Framework provides automatic error boundaries for route segments
- No custom error.tsx or global-error.tsx files present
- TypeScript strict mode enabled for compile-time error prevention

## Cross-Cutting Concerns

**Logging:** Console only (no logging framework detected)
**Validation:** TypeScript strict mode for type safety
**Authentication:** Not implemented

---

*Architecture analysis: 2026-02-10*
