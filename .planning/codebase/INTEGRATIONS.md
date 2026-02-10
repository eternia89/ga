# External Integrations

**Analysis Date:** 2026-02-10

## APIs & External Services

**Font Delivery:**
- Google Fonts API - Font loading for Geist and Geist Mono
  - SDK/Client: `next/font/google` (built into Next.js)
  - Auth: None required
  - Implementation: `app/layout.tsx` (Geist, Geist_Mono)

## Data Storage

**Databases:**
- None configured

**File Storage:**
- Local filesystem only (Next.js public directory for static assets)
  - Static images: `/next.svg`, `/vercel.svg` referenced in `app/page.tsx`

**Caching:**
- None configured (Next.js built-in caching available but not explicitly configured)

## Authentication & Identity

**Auth Provider:**
- None configured

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Console logging (no structured logging framework)

**Analytics:**
- None configured

## CI/CD & Deployment

**Hosting:**
- Intended for Vercel (boilerplate links in `app/page.tsx`)
- No deployment configuration files detected

**CI Pipeline:**
- None configured

**Build Pipeline:**
- Local build via `npm run build` (Next.js production build)

## Environment Configuration

**Required env vars:**
- None currently required

**Secrets location:**
- Not applicable (no integrations requiring secrets)

**Note:** `.env` files supported by Next.js but none present in project

## Webhooks & Callbacks

**Incoming:**
- None configured

**Outgoing:**
- None configured

## Development Tools

**Image Optimization:**
- Next.js Image component (`next/image`) used in `app/page.tsx`
  - Automatic optimization for images in `/public` directory

## External References

**Documentation Links:**
- Vercel Templates: https://vercel.com/templates?framework=next.js
- Next.js Learning: https://nextjs.org/learn
- Next.js Docs: https://nextjs.org/docs
- Vercel Deploy: https://vercel.com/new

*Note: These are boilerplate links from create-next-app template, not active integrations*

---

*Integration audit: 2026-02-10*
