# Codebase Structure

**Analysis Date:** 2026-02-10

## Directory Layout

```
ga/
├── .claude/           # Claude IDE configuration and commands
├── .git/              # Git repository metadata
├── .next/             # Next.js build output (generated, not committed)
├── .planning/         # GSD planning documents
│   └── codebase/      # Codebase analysis documents
├── app/               # Next.js App Router directory (pages, layouts, components)
├── node_modules/      # npm dependencies (generated, not committed)
├── public/            # Static assets served at root URL path
├── CLAUDE.md          # Project instructions for Claude
├── README.md          # Project documentation
├── eslint.config.mjs  # ESLint v9 flat config
├── next-env.d.ts      # Next.js TypeScript declarations (generated)
├── next.config.ts     # Next.js configuration
├── package-lock.json  # npm lockfile
├── package.json       # npm package manifest
├── postcss.config.mjs # PostCSS configuration for Tailwind
└── tsconfig.json      # TypeScript compiler configuration
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router - contains all routes, layouts, and page components
- Contains: React components (.tsx), page routes (page.tsx), layouts (layout.tsx), global styles (globals.css), favicon
- Key files: `app/layout.tsx` (root layout), `app/page.tsx` (home page), `app/globals.css` (global styles)

**public/:**
- Purpose: Static assets served directly without processing
- Contains: SVG images
- Key files: `next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`

**.claude/:**
- Purpose: Claude IDE configuration and custom commands
- Contains: Settings, agents, hooks, commands, GSD workflow references
- Key files: `settings.json`, custom command definitions

**.planning/:**
- Purpose: GSD (Get Shit Done) planning and codebase analysis documents
- Contains: Codebase analysis markdown files
- Key files: ARCHITECTURE.md, STRUCTURE.md, and other analysis docs

**.next/:**
- Purpose: Next.js build artifacts and cache
- Contains: Compiled pages, optimized assets, type definitions
- Generated: Yes
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: npm package dependencies
- Contains: All installed packages from package.json
- Generated: Yes (via npm install)
- Committed: No (in .gitignore)

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout component, defines HTML structure
- `app/page.tsx`: Home page at `/` route
- `next.config.ts`: Next.js framework configuration

**Configuration:**
- `package.json`: Dependencies, scripts, project metadata
- `tsconfig.json`: TypeScript compiler settings (strict mode, path aliases)
- `eslint.config.mjs`: ESLint v9 flat config with Next.js rules
- `postcss.config.mjs`: PostCSS plugin configuration for Tailwind CSS

**Core Logic:**
- `app/page.tsx`: Main landing page component
- `app/globals.css`: Global styles, Tailwind imports, CSS custom properties

**Testing:**
- Not present - no test files or test framework configured

## Naming Conventions

**Files:**
- `page.tsx`: Route pages (Next.js convention)
- `layout.tsx`: Layout components (Next.js convention)
- `*.config.*`: Configuration files (standard)
- `globals.css`: Global stylesheet (Next.js convention)
- `UPPERCASE.md`: Documentation files (CLAUDE.md, README.md)

**Directories:**
- `app/`: Next.js App Router directory (framework convention)
- `public/`: Static assets (framework convention)
- `.name/`: Hidden directories for tooling (standard)
- `node_modules/`: Dependencies (npm convention)

## Where to Add New Code

**New Feature:**
- Primary code: Create new directory in `app/` for feature-specific routes and components
- Tests: No test directory exists - would need to create `__tests__/` or co-located `.test.tsx` files

**New Page/Route:**
- Implementation: `app/[route-name]/page.tsx` for new route
- Layout: `app/[route-name]/layout.tsx` if route needs custom layout

**New Component/Module:**
- Implementation: Consider creating `app/components/` directory for shared components
- Currently no component library structure - app uses inline components

**Utilities:**
- Shared helpers: Consider creating `lib/` or `utils/` directory at root level (not present yet)

**API Routes:**
- Implementation: `app/api/[endpoint]/route.ts` for API endpoints (Next.js convention)
- Not present in current structure

**Static Assets:**
- Images/fonts: Add to `public/` directory
- Accessed via absolute path from root (e.g., `/image.png`)

## Special Directories

**.next/:**
- Purpose: Build output and cache
- Generated: Yes (by `next build` and `next dev`)
- Committed: No

**.planning/:**
- Purpose: GSD workflow planning documents
- Generated: Yes (by GSD commands)
- Committed: Yes (to track planning state)

**.claude/:**
- Purpose: Claude IDE configuration and custom commands
- Generated: Partially (user-created, may include generated content)
- Committed: Yes (to share IDE configuration)

**node_modules/:**
- Purpose: npm package cache
- Generated: Yes (by npm install)
- Committed: No

---

*Structure analysis: 2026-02-10*
