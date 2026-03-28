# Needs Review

> **How to use this file:**
> The nightly janitor adds items here when it finds issues that need human judgment.
> Each item has suggested fixes as checkboxes.
>
> **Your workflow:**
> 1. Skim items below
> 2. Mark suggestions you approve: change `[ ]` to `[v]`
> 3. To give a different instruction, add a new `[v] your instruction here` line under the suggestions
> 4. Run `/do-needs-review` in Claude CLI — it will execute all `[v]` items via `/gsd:quick`
> 5. Items move to the "Completed" section at the bottom after execution
>
> **Status key:** `[ ]` = pending review · `[v]` = approved, will execute · `[x]` = done · `[-]` = skipped

---

<!-- JANITOR: Append new items above the COMPLETED section. Use this format:
## [DATE] CATEGORY — Short title

**What:** Plain-language description of the issue.
**Where:** `file/path.tsx:123`, `other/file.ts:45`
**Why it matters:** One sentence on impact.
**ELI5 (backend terms):** Only include this line if the issue involves backend concepts.

**Suggested fixes:**
- [ ] Option A — description
- [ ] Option B — description
- [ ] Skip this item

---
-->

## 28-Mar-2026 DRY — Signed URL generation duplicated across 11 files

**What:** The pattern for creating Supabase signed URLs and mapping them to attachment objects is copy-pasted across 11 files with 19 instances. Each does the same thing: call `createSignedUrls()`, handle errors, map attachments to URLs, filter out failures.
**Where:** `app/actions/asset-actions.ts:569-591`, `app/actions/request-actions.ts:599-620`, `app/(dashboard)/inventory/[id]/page.tsx:159-221`, `app/(dashboard)/requests/[id]/page.tsx:116-132`, `app/(dashboard)/jobs/[id]/page.tsx`, `components/jobs/job-modal.tsx`, `components/assets/asset-view-modal.tsx`, `components/assets/asset-transfer-respond-modal.tsx`
**Why it matters:** When the signed URL logic needs to change (e.g., different expiry times, error handling, or switching storage providers), you'd have to find and update 19 places. Easy to miss one.

**Suggested fixes:**
- [ ] Option A — Extract a `createSignedUrlsWithMetadata()` utility in `lib/supabase/signed-urls.ts` that takes a bucket name, attachment array, and expiry seconds. Returns typed attachment objects with `url` field. Replace all 19 instances.
- [ ] Option B — Extract just the core pattern (createSignedUrls + error log + map + filter) as a helper, but keep the per-entity typing in each caller. Less abstraction, still removes duplication.
- [ ] Skip — The duplication is annoying but stable. Each call site is slightly different (different buckets, fields). Not worth the abstraction churn right now.

---

## 28-Mar-2026 DRY — Media attachment query pattern repeated across 5+ files

**What:** The Supabase query for fetching media attachments (`.from('media_attachments').select('id, entity_type, ...').eq('entity_type', x).eq('entity_id', id).is('deleted_at', null).order(...)`) is duplicated across detail pages and action files.
**Where:** `app/(dashboard)/inventory/[id]/page.tsx:60-75`, `app/(dashboard)/requests/[id]/page.tsx:57-63`, `app/actions/asset-actions.ts:524-530`, `app/actions/asset-actions.ts:602-608`
**Why it matters:** If the media_attachments table schema changes or you add a field to the select, you need to update every copy.

**Suggested fixes:**
- [ ] Option A — Create `lib/supabase/queries.ts` with a `fetchMediaAttachments(supabase, entityType, entityId)` helper that returns typed results.
- [ ] Option B — Leave as-is. The queries are simple one-liners and changing them is low-risk. The slight differences in `.select()` fields across callers make a shared helper awkward.
- [ ] Skip — These are server-only queries, stable, and easily greppable. Duplication is tolerable.

---

## 28-Mar-2026 TEST GAPS — 14 action files and 10 validation schemas lack unit tests

**What:** Only 1 of 15 action files (`user-company-access-actions.ts`) and 1 of 11 validation schemas (`helpers.ts`) have dedicated test coverage. The other 24 files have no unit tests.
**Where:** All files in `app/actions/` (14 untested) and `lib/validations/` (10 untested). See `__tests__/` for existing coverage.
**Why it matters:** Action files contain business logic (status transitions, authorization checks, data transformations). Without tests, regressions from future changes won't be caught until production. Validation schemas define input boundaries — a wrong `.max()` or missing `.refine()` is invisible until a user hits it.

**Suggested fixes:**
- [ ] Option A — Prioritize tests for the highest-risk actions first: `approval-actions.ts` (approval flow), `asset-actions.ts` (transfer lifecycle), `request-actions.ts` (triage + status transitions), `job-actions.ts` (job lifecycle). Add validation schema tests for `job-schema.ts` and `request-schema.ts` which have complex conditional refinements.
- [ ] Option B — Add validation schema tests only (they're pure functions, fast to test, high value). Leave action tests for later since they need Supabase mocking.
- [ ] Skip — E2E tests cover the critical paths. Unit tests would be nice but the e2e suite is comprehensive enough for now.

---

## 28-Mar-2026 LINT — setState in useEffect in use-geolocation hook

**What:** The `use-geolocation.ts` hook calls `setPermissionState('unknown')` synchronously inside a `useEffect`, which React's linter flags as potentially causing cascading renders.
**Where:** `hooks/use-geolocation.ts:33`
**Why it matters:** Could cause unnecessary re-renders. The React team recommends updating state in effect cleanup or callbacks, not synchronously in the effect body.

**Suggested fixes:**
- [ ] Option A — Move the Safari fallback logic (`setPermissionState('unknown')`) to run before the effect via `useState` initializer or a ref, so the effect only handles the async permissions API path.
- [ ] Option B — Wrap in a microtask (`queueMicrotask(() => setPermissionState('unknown'))`) to avoid synchronous setState in effect. Quick fix but slightly hacky.
- [ ] Skip — This is a minor performance concern in a low-usage hook. The behavior is correct even if the pattern is suboptimal.

---

## 28-Mar-2026 GIT HYGIENE — 2 merged branches can be cleaned up

**What:** Two local branches are already merged into main and can be safely deleted.
**Where:** `claude/pensive-williamson`, `hris`
**Why it matters:** Merged branches clutter `git branch` output and can cause confusion about what's active work vs completed.

**Suggested fixes:**
- [ ] Option A — Delete both: `git branch -d claude/pensive-williamson hris`
- [ ] Skip — They're harmless. Clean up when the branch list gets longer.

---

## 29-Mar-2026 SECURITY — Open redirect in auth callback

**What:** The `/api/auth/callback` route takes a `next` URL parameter and redirects to it after login, but doesn't validate the path. An attacker could craft a link like `/api/auth/callback?next=//evil.com` to redirect users to an external site after they authenticate.
**Where:** `app/api/auth/callback/route.ts:7,22`
**Why it matters:** This is a textbook open redirect vulnerability. An attacker sends a phishing link that looks like your real login URL, the user authenticates normally, then gets redirected to a fake version of your app that steals credentials or session tokens.
**Backend ELI5:** Think of it like a route guard that, after letting you in, sends you to wherever the URL says — even if that's someone else's website. The fix is like adding a whitelist of allowed redirect destinations.

**Suggested fixes:**
- [ ] Option A — Validate `next` starts with `/` and doesn't contain `//` (prevents protocol-relative URLs like `//evil.com`). Simple regex check before the redirect.
- [ ] Option B — Whitelist allowed path prefixes (`/`, `/jobs`, `/requests`, `/inventory`, `/maintenance`, `/approvals`, `/admin`, `/notifications`). More restrictive but prevents any future path injection.
- [ ] Skip — Low risk in practice since the app is internal-only. But trivial to fix.

---

## 29-Mar-2026 LINT — setState in useEffect across 3 components

**What:** Three components call `setState()` synchronously inside `useEffect`, which React 19's compiler flags as causing cascading renders. These are the same class of issue as the `use-geolocation.ts` item from 28-Mar, but in different files.
**Where:** `app/(auth)/login/page.tsx:45`, `components/admin/users/user-form-dialog.tsx:103`, `components/requests/request-detail-client.tsx:61`
**Why it matters:** Each synchronous setState in an effect triggers a re-render before the browser paints, which can cause visible flicker and wasted work. React 19's stricter linting treats this as an error.

**Suggested fixes:**
- [ ] Option A — **login/page.tsx:** Move cookie-based error message into a `useMemo` or `useState` initializer so it runs during render, not in an effect. **user-form-dialog.tsx:** Derive initial state from props using `useMemo` + reset key pattern instead of syncing in useEffect. **request-detail-client.tsx:** Use URL search params check in a `useMemo` or move into an event handler.
- [ ] Option B — Suppress the lint warnings with inline `// eslint-disable-next-line` comments. The behavior is correct even if the pattern is suboptimal.
- [ ] Skip — These work correctly today. The React compiler will skip optimizing these components but they'll still render fine.

---

## 29-Mar-2026 LINT — Dead code in schedule-list, template-list, and user-table

**What:** Several components have defined-but-never-used variables, handlers, and state. These look like scaffolded code for features that are either WIP or were never wired up.
**Where:**
- `components/maintenance/schedule-list.tsx:22,28,30,45,60` — `isPending`, `canManage`, `handleDeactivate`, `handleActivate`, `handleDelete`
- `components/maintenance/template-list.tsx:22,28,30,45` — `isPending`, `canManage`, `handleDeactivate`, `handleReactivate`
- `components/admin/users/user-table.tsx:50` — `isProcessing` (state is set but never read)
- `components/assets/asset-detail-info.tsx:33` — `currentUserId` prop destructured but unused
- `components/jobs/job-detail-info.tsx:50` — `currentUserId` prop destructured but unused
**Why it matters:** Dead code makes it harder to understand what a component actually does and creates false signals in lint output. The unused handlers in list components also import action functions that are never called.

**Suggested fixes:**
- [ ] Option A — For schedule-list and template-list: if these handlers are meant to be used via table row actions (modal buttons), wire them up through table meta. If not needed, remove them along with the unused imports.
- [ ] Option B — Remove all dead code. If the handlers are needed later, they can be re-added from git history.
- [ ] Skip — They're warnings, not errors. The code runs fine. Clean up when touching these files for other reasons.

---

## 29-Mar-2026 LINT — Components created during render in dashboard and checklist

**What:** Three components define sub-components inside the render function body, which React 19's compiler flags as an error. Each render creates a new component identity, resetting any internal state.
**Where:** `components/dashboard/kpi-card.tsx:45-60`, `components/dashboard/staff-workload-table.tsx:53-60`, `components/maintenance/pm-checklist-item.tsx:72`
**Why it matters:** React treats `const MyComponent = () => ...` inside a render function as a new component every render. Any state or refs inside these components reset on every parent render, causing bugs and performance issues.

**Suggested fixes:**
- [ ] Option A — Move the inner components outside the parent component function. If they need access to parent state, pass it as props. This is the React-recommended fix.
- [ ] Option B — Convert the inner components to plain render functions (not components) by removing JSX element usage and inlining the logic. Works for simple cases.
- [ ] Skip — These components currently have no internal state, so the re-creation is harmless. But it blocks the React compiler from optimizing these components.

---

## 29-Mar-2026 RLS — finance_approver role missing from database policies

**What:** The `finance_approver` role exists in the application constants (`lib/constants/roles.ts`) and in the database schema's CHECK constraint, but is NOT referenced in any RLS (Row Level Security) policy across all 29 migration files. Users with this role fall back to whatever the "catch-all" policy allows.
**Where:** `lib/constants/roles.ts:5`, `supabase/migrations/00001_initial_schema.sql:91` (CHECK constraint)
**Why it matters:** Without explicit RLS policies, `finance_approver` users either see everything (if there's a permissive catch-all) or nothing (if policies only whitelist specific roles). Either way, the access isn't intentionally designed.
**Backend ELI5:** RLS policies are like invisible if-statements in the database that filter rows by user role. Think of them as server-side route guards — if your role isn't mentioned in the guard, you either get blocked entirely or slip through a gap. The `finance_approver` role has no guards written for it, so the database doesn't know what data to show these users.

**Suggested fixes:**
- [ ] Option A — Audit all RLS policies and add explicit `finance_approver` rules. They should see: approval-related data (jobs pending cost approval), dashboard metrics, but NOT manage assets, jobs, or maintenance directly.
- [ ] Option B — Verify that `finance_approver` inherits `general_user` access via catch-all policies (e.g., `current_user_role() != 'general_user'` patterns). If access is already correct by default, document this as intentional.
- [ ] Skip — If finance approvers are working fine in testing, the existing policy structure handles them implicitly. Document the implicit behavior.

---

## 29-Mar-2026 UI — Select instead of Combobox for large dropdowns in user form

**What:** The user form dialog uses plain `<Select>` components for Company, Division, and Location dropdowns. Per CLAUDE.md, these should use Combobox since the lists can grow large (dozens of companies/divisions/locations).
**Where:** `components/admin/users/user-form-dialog.tsx:260` (Company), `:311` (Division), `:340` (Location)
**Why it matters:** With 15+ subsidiaries and many divisions/locations, users have to scroll through a long list instead of typing to filter. Combobox turns the trigger into a search box on click.

**Suggested fixes:**
- [ ] Option A — Replace all three `<Select>` with the shadcn Combobox pattern already used elsewhere in the app (e.g., asset forms, request forms). Keep the Role selector as a plain Select since it only has 5 options.
- [ ] Skip — The current Select works. Upgrade when the user form gets its next feature touch.

---

## Completed

<!-- Items moved here after /do-needs-review executes them -->
