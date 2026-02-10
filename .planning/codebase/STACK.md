# Technology Stack

**Analysis Date:** 2026-02-10

## Languages

**Primary:**
- TypeScript 5.x - All application code (app directory, config files)
- JavaScript (JSX) - React components transpiled to JSX

**Secondary:**
- CSS - Tailwind v4 with custom properties in `app/globals.css`

## Runtime

**Environment:**
- Node.js v25.2.1+ (detected in environment)

**Package Manager:**
- npm 11.6.2
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router architecture
- React 19.2.3 - UI framework
- React DOM 19.2.3 - React renderer

**Testing:**
- Not configured

**Build/Dev:**
- Next.js built-in compiler (Turbopack/Webpack)
- PostCSS with `@tailwindcss/postcss` plugin
- TypeScript compiler (tsc) for type checking

## Key Dependencies

**Critical:**
- next 16.1.6 - Framework providing routing, rendering, bundling
- react 19.2.3 - Component model and runtime
- react-dom 19.2.3 - DOM rendering layer

**Infrastructure:**
- tailwindcss ^4 - CSS framework (Tailwind v4 beta)
- @tailwindcss/postcss ^4 - PostCSS plugin for Tailwind v4

**Development:**
- typescript ^5 - Type system (strict mode enabled)
- eslint ^9 - Linting (flat config format)
- eslint-config-next 16.1.6 - Next.js ESLint rules (core-web-vitals + TypeScript)
- @types/node ^20 - Node.js type definitions
- @types/react ^19 - React type definitions
- @types/react-dom ^19 - React DOM type definitions

## Configuration

**Environment:**
- No `.env` files detected
- Environment variables loaded via Next.js built-in support (if added)

**Build:**
- `next.config.ts` - Next.js configuration (minimal, no custom options)
- `tsconfig.json` - TypeScript strict mode, ES2017 target, bundler module resolution
- `eslint.config.mjs` - ESLint v9 flat config with Next.js core-web-vitals and TypeScript rules
- `postcss.config.mjs` - PostCSS with Tailwind v4 plugin

**TypeScript:**
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Target: ES2017
- Module resolution: bundler

## Platform Requirements

**Development:**
- Node.js 18.17+ (recommended for Next.js 16)
- npm (included with Node.js)

**Production:**
- Designed for Vercel deployment (references in `app/page.tsx` boilerplate)
- Compatible with any Node.js hosting platform supporting Next.js

---

*Stack analysis: 2026-02-10*
