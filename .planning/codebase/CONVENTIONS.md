# Coding Conventions

**Analysis Date:** 2026-02-10

## Naming Patterns

**Files:**
- React components: `layout.tsx`, `page.tsx` (lowercase)
- Config files: `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs` (lowercase with extensions)
- Type declaration files: `next-env.d.ts` (kebab-case with `.d.ts` suffix)

**Functions:**
- React components: `RootLayout`, `Home` (PascalCase)
- Regular functions: camelCase (inferred from React/Next.js patterns)
- Variables: camelCase (e.g., `geistSans`, `geistMono`)

**Types:**
- TypeScript types: PascalCase (e.g., `Metadata`, `NextConfig`)

## Code Style

**Formatting:**
- No Prettier config detected (not enforced)
- Indentation: 2 spaces (observed in all source files)
- Quotes: Double quotes for imports and JSX attributes
- Semicolons: Used consistently
- Trailing commas: Not observed in sample code

**Linting:**
- ESLint v9 with flat config format (`eslint.config.mjs`)
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Import Organization

**Order:**
1. Next.js framework imports (`next/image`, `next/font/google`)
2. Type imports (`import type { ... }`)
3. Local/relative imports (`./globals.css`)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)

## TypeScript Configuration

**Strict Mode:**
- `"strict": true` enabled in `tsconfig.json`
- Target: ES2017
- JSX: `react-jsx` (React 19 automatic runtime)
- Module resolution: bundler

## Error Handling

**Patterns:**
- No explicit error handling patterns observed in app code
- React components use standard Next.js patterns (no try/catch in samples)

## Logging

**Framework:** console (standard JavaScript)

**Patterns:**
- No logging observed in current app code
- No dedicated logging library detected

## Comments

**When to Comment:**
- Config files include inline comments (e.g., `/* config options here */`)
- Type imports use explicit `type` keyword for clarity

**JSDoc/TSDoc:**
- Not used in current codebase
- Type annotations used instead for TypeScript

## Function Design

**Size:** Functions are concise (under 40 lines in all samples)

**Parameters:** React component props use explicit TypeScript types with `Readonly<>` wrapper

**Return Values:**
- React components return JSX
- Metadata exports use typed `Metadata` from Next.js

## Module Design

**Exports:**
- Default exports for page components (`export default function Home()`)
- Named exports for metadata and config (`export const metadata: Metadata`)

**Barrel Files:**
- Not used (small codebase, direct imports)

## React/Next.js Specific

**Components:**
- Server components by default (no `"use client"` directive needed)
- Async components supported (React 19)

**Styling:**
- Tailwind CSS v4 with utility classes
- CSS custom properties for theming (`--background`, `--foreground`)
- Dark mode via `prefers-color-scheme` media query

**Fonts:**
- Loaded via `next/font/google`
- Applied using CSS variables (`--font-geist-sans`, `--font-geist-mono`)

---

*Convention analysis: 2026-02-10*
