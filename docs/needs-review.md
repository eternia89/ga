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

## Completed

<!-- Items moved here after /do-needs-review executes them -->
