# Codebase Concerns

**Analysis Date:** 2026-02-10

## Tech Debt

**Boilerplate Code Not Customized:**
- Issue: Default Next.js template content still present in production code
- Files: `app/page.tsx`, `app/layout.tsx`
- Impact: Page displays "To get started, edit the page.tsx file" placeholder text with template links to Vercel deployment and Next.js docs. Metadata still says "Create Next App". Not production-ready.
- Fix approach: Replace placeholder content with actual application UI, update metadata in `app/layout.tsx` to reflect real app name and description

**Minimal Next.js Configuration:**
- Issue: Empty Next.js config with no production optimizations
- Files: `next.config.ts`
- Impact: Missing potential performance improvements, security headers, image optimization configs, etc.
- Fix approach: Add relevant production config (security headers, image domains if needed, output settings for deployment target)

**Font Loading Strategy Not Optimized:**
- Issue: Two Google Fonts (Geist and Geist Mono) loaded on every page regardless of usage
- Files: `app/layout.tsx`
- Impact: Unnecessary font downloads if mono font is only used in specific sections. Minor performance hit.
- Fix approach: Consider lazy-loading Geist Mono or splitting it to code-only pages if not universally needed

**CSS Variable Mismatch:**
- Issue: Font family fallback in `globals.css` doesn't use the CSS variables defined
- Files: `app/globals.css` (line 25)
- Impact: Body element uses `font-family: Arial, Helvetica, sans-serif` instead of the loaded Geist font via `var(--font-sans)`. Fonts are loaded but not applied.
- Fix approach: Change line 25 to `font-family: var(--font-sans);` to actually use the loaded Geist font

## Known Bugs

**Font Not Applied to Body:**
- Symptoms: Custom Geist font loads but body defaults to Arial/Helvetica
- Files: `app/globals.css` (line 25), `app/layout.tsx`
- Trigger: Any page render - font CSS vars are set but not used
- Workaround: None - requires code change

## Security Considerations

**Missing Environment Variable Validation:**
- Risk: No validation or error handling for missing/invalid environment variables at runtime
- Files: Not applicable (no env usage detected yet)
- Current mitigation: None - app currently has no external integrations requiring secrets
- Recommendations: When adding API keys or secrets, use runtime validation (e.g., zod schema) and fail fast on startup if critical vars are missing

**No Security Headers Configured:**
- Risk: Missing CSP, X-Frame-Options, HSTS, and other security headers
- Files: `next.config.ts`
- Current mitigation: None - relying on deployment platform defaults
- Recommendations: Add security headers in Next.js config for production deployment

**External Links Missing rel Attributes Consistency:**
- Risk: External links in `app/page.tsx` have `rel="noopener noreferrer"` but this could be inconsistent as more links are added
- Files: `app/page.tsx` (lines 42, 57)
- Current mitigation: Template includes proper attributes for existing links
- Recommendations: Enforce via ESLint rule (e.g., `react/jsx-no-target-blank`)

## Performance Bottlenecks

**Unused Font Loaded on Every Page:**
- Problem: Geist Mono font loaded globally but likely only used in code snippets
- Files: `app/layout.tsx` (lines 10-13)
- Cause: Font loaded in root layout regardless of page needs
- Improvement path: Move mono font to specific components that need it, or split into separate layout

**No Image Optimization Configuration:**
- Problem: Next.js Image component used without domain allowlist or size configuration
- Files: `app/page.tsx` (uses Image component), `next.config.ts` (empty config)
- Cause: Default configuration may cause runtime warnings or limit functionality
- Improvement path: Configure `images.remotePatterns` if external images will be used, add `deviceSizes` and `imageSizes` for optimization

## Fragile Areas

**No Error Boundaries or Error Pages:**
- Files: Missing `app/error.tsx`, `app/not-found.tsx`, `app/loading.tsx`
- Why fragile: No graceful error handling - any unhandled error or 404 will show default Next.js error UI
- Safe modification: Add error pages before production deployment
- Test coverage: No error handling tests exist

**Single Page Application:**
- Files: `app/page.tsx` only
- Why fragile: All UI logic in one component - will become hard to maintain as app grows
- Safe modification: Split into smaller components before adding features
- Test coverage: No component tests exist

## Scaling Limits

**Static Assets in Public Directory:**
- Current capacity: 5 SVG files (logos/icons)
- Limit: Public directory not optimized for large numbers of assets
- Scaling path: Consider CDN or image optimization service when asset count grows significantly

**No API Route Structure:**
- Current capacity: No API routes defined yet
- Limit: When API routes are added, no organizational structure exists
- Scaling path: Establish API route organization pattern early (e.g., `app/api/[version]/[resource]`)

## Dependencies at Risk

**TypeScript @types/node Version Gap:**
- Risk: Using @types/node v20 while Node.js LTS is now v22+
- Impact: Missing TypeScript definitions for newer Node.js features
- Migration plan: Update to `@types/node@^22` when upgrading Node.js runtime

**ESLint Major Version Behind:**
- Risk: ESLint 9.x when 10.x is available (breaking changes likely)
- Impact: May miss newer lint rules and security checks
- Migration plan: Review ESLint 10 migration guide, update config format if needed

**Tailwind CSS v4 Early Adoption:**
- Risk: Tailwind v4 is new, may have breaking changes in patches
- Impact: CSS syntax uses new `@import "tailwindcss"` format which differs from v3
- Migration plan: Monitor Tailwind changelog, pin exact version for stability

## Missing Critical Features

**No Testing Infrastructure:**
- Problem: Zero test files in application code (only `.claude/` has test file)
- Blocks: Cannot verify functionality, refactoring is risky, no regression detection
- Priority: High - should be added before significant feature development

**No Environment Variable Management:**
- Problem: No `.env.example` or documentation of required environment variables
- Blocks: New developers cannot set up local environment easily
- Priority: Medium - needed when first external integration is added

**No Logging or Monitoring:**
- Problem: No structured logging, error tracking, or observability setup
- Blocks: Cannot debug production issues, no visibility into app health
- Priority: Medium - needed before production deployment

**No Authentication System:**
- Problem: No user authentication or authorization framework
- Blocks: Cannot build user-specific features or protect routes
- Priority: Depends on application requirements

## Test Coverage Gaps

**No Application Tests:**
- What's not tested: All application code (pages, components, layouts)
- Files: `app/page.tsx`, `app/layout.tsx`
- Risk: Changes could break UI/layout without detection
- Priority: High

**No Integration Tests:**
- What's not tested: Next.js App Router behavior, routing, metadata
- Files: Entire `app/` directory
- Risk: Framework integration issues won't be caught
- Priority: Medium

**No E2E Tests:**
- What's not tested: User flows, page interactions, accessibility
- Files: All pages
- Risk: User-facing bugs won't be caught before deployment
- Priority: Medium

---

*Concerns audit: 2026-02-10*
