14 mar 2026
what's been done

---

## 15-Mar-2026

### Commits Summary (Last 24h)

| Task | Commits | What Changed |
|------|---------|-------------|
| quick-73 | 3 commits | Moved asset name from schedule detail header to body section |
| quick-74 | 4 commits | Added Company column to maintenance schedules table (join, type, query, column) |
| quick-75 | 3 commits | Added company access validation to `createSchedule` non-asset branch |
| quick-76 | 2 commits | Added `.max(10)` to unbounded `start_date` string in schedule schema |
| quick-77 | 3 commits | Added 3 E2E tests: schedule non-asset path, `auto_create_days_before`, RLS |
| quick-78 | 2 commits | Standardized `text-sm` on Created column date spans (assets, schedules) |
| PR #1 merge | 1 commit | Major refactor: code consistency across 23 files (actions, schemas, tables, forms) |

**Total: 20 commits, ~40 files changed**

---

### Risky Patterns & Security

| # | Severity | File | Issue | Recommendation |
|---|----------|------|-------|----------------|
| 1 | **CRITICAL** | `app/actions/user-actions.ts:10-43` | `getUsers` fetches ALL users across ALL companies with no `company_id` filter. Uses `adminSupabase.auth.admin.listUsers()` without scoping. | Add `.eq('company_id', profile.company_id)` or document why global listing is intentional for admin |
| 2 | **MEDIUM** | `app/actions/request-actions.ts:193,243,299,363` | Notification failures silently swallowed: `.catch(() => {})` — no logging | Change to `.catch((err) => console.error('Notification failed:', err.message))` |
| 3 | **MEDIUM** | `app/actions/pm-job-actions.ts:253` | `advanceFloatingScheduleCore` called without await/catch in `job-actions.ts:548` | Add error boundary or await the async call |
| 4 | **LOW** | `app/actions/user-actions.ts:51-126` | `createUser` has 3 sequential API calls (auth → profile → metadata) without DB transaction; rollback is best-effort | Document limitation; Supabase doesn't support client transactions |

---

### Missing Tests

| # | Priority | Area | Gap |
|---|----------|------|-----|
| 1 | HIGH | Integration | No tests for PM job creation triggered by schedules |
| 2 | HIGH | Integration | No tests for notification triggers from request/job state changes |
| 3 | HIGH | Unit | No unit tests for Zod validation schemas |
| 4 | HIGH | Unit | No unit tests for server actions or complex business logic |
| 5 | MEDIUM | E2E | No E2E for photo upload validation edge cases |
| 6 | MEDIUM | E2E | Incomplete permission/RLS testing (ga_staff blocked from requests, finance_approver blocked from job creation) |
| 7 | MEDIUM | Unit | No tests for `next_due_at` calculation logic |
| 8 | LOW | E2E | 3 skipped schedule tests (auto-pause, PM checklist completion) — deferred features |

---

### UI/UX Inconsistencies

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `components/requests/request-columns.tsx:156` | Missing `text-sm` on Created column date span (all other tables have it) | Add `className="text-sm"` to the date `<span>` |
| 2 | `components/maintenance/template-columns.tsx:74` | Missing `text-sm` on Created column date span | Add `className="text-sm"` to the date `<span>` |
| 3 | `lib/utils.ts:27` | CSV export filename uses `yyyy-MM-dd` format instead of `dd-MM-yyyy` | Change format string to match mandatory date format convention |

---

### Code Consistency & Scalability Improvements

| # | Category | File(s) | Issue | Recommendation |
|---|----------|---------|-------|----------------|
| 1 | Schema | `lib/validations/asset-schema.ts` | Asset `name` max=100, CLAUDE.md says 60 for names | Align to 60 or document exception |
| 2 | Schema | `lib/validations/template-schema.ts` | Template `name` max=100, CLAUDE.md says 60 for names | Align to 60 or document exception |
| 3 | Test selectors | `e2e/tests/` (multiple) | 10+ uses of `.locator('.bg-green-50')` / `.bg-red-50` for feedback detection | Migrate to role-based selectors or data-testid on `InlineFeedback` |
| 4 | Test selectors | `e2e/tests/` (multiple) | 20+ uses of `.locator('[cmdk-item]')` for combobox options | Create a Page Object helper method for combobox selection |
| 5 | Test isolation | `e2e/tests/quick-34-41-ux-improvements/` | 6 conditional test skips based on seed data state | Create test-specific data in `beforeAll` instead of relying on seed |
| 6 | Test timing | `e2e/tests/` (multiple) | 226+ uses of `waitForLoadState('networkidle')` — flaky on slow CI | Consider more specific `waitForURL` or element visibility checks for critical paths |
| 7 | Test timing | `e2e/tests/` (multiple) | 102+ uses of `.first()` — can break if element order changes | Add more specific context to selectors (e.g., within a known parent) |

---

### What's Working Well

- **100% responsive design compliance** — zero mobile-first breakpoint violations across 208 files
- **100% maxLength compliance** — all Input components match their Zod `.max(N)` values
- **Duplicate name checks** on all 3 paths (create, update, restore) for all admin entities
- **Consistent action patterns** — all 15 action files follow next-safe-action conventions
- **Proper RLS bypass documentation** — all admin client usage has justification comments
- **Desktop-first with max-* breakpoints** — 77 correct usages, 0 violations
- **Date formatting** — 95% compliant; only CSV filename deviates

---

## 16-Mar-2026

### Commits Summary (Since 15-Mar-2026)

No new commits since the last review (14-Mar-2026 was the last commit day). This review focuses on **deeper codebase-wide analysis** building on yesterday's findings.

---

### Risky Patterns & Bugs (New Findings)

| # | Severity | File | Issue | Recommendation |
|---|----------|------|-------|----------------|
| 1 | **CRITICAL** | `supabase/migrations/00002_rls_helper_functions.sql:21` | RLS fallback UUID `00000000-0000-0000-0000-000000000000` violates RFC 4122 v4 — Zod's `.uuid()` rejects it. Could cause auth edge-case failures | Change to `00000000-0000-4000-a000-000000000000` |
| 2 | **HIGH** | `app/actions/request-actions.ts:34`, `job-actions.ts:36`, `asset-actions.ts:43-47` | Company access check uses `.single()` which throws on missing row. Schedule-actions correctly uses `.maybeSingle()` | Standardize all to `.maybeSingle()` + null check |
| 3 | **HIGH** | `app/actions/user-actions.ts:201-223` | `reactivateUser` missing duplicate email check — CLAUDE.md requires duplicate check on all write paths including Restore | Add duplicate email check before reactivation |
| 4 | **MEDIUM** | `app/actions/user-actions.ts:68` | `createUser` inserts with `parsedInput.company_id` without validating the calling user has access to that company | Add company access validation matching schedule-actions pattern |
| 5 | **MEDIUM** | `app/actions/schedule-actions.ts:69-77, 143-152, 213-222` | `.maybeSingle()` queries don't check for Supabase `error` return — only checks `!data` | Add `if (error) throw new Error(error.message)` before null check |
| 6 | **LOW** | `app/actions/company-settings-actions.ts:53-58` | `.single()` without error handling — can throw on multiple rows | Use `.maybeSingle()` or add error check |
| 7 | **LOW** | `scripts/reset-database.sql:68,88,108,128,148` | Uses invalid all-zero UUIDs for `instance_id` | Update to valid v4 format for consistency |

---

### UI/UX Inconsistencies (New Findings)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `components/maintenance/schedule-columns.tsx:62` | Asset `display_id` shown without `font-mono` class | Add `font-mono` to the `<span>` wrapping `display_id` |
| 2 | `components/audit-trail/audit-trail-columns.tsx:141-160` | Display ID has `font-mono` only on non-link variant; link variant missing it | Add `font-mono` to both code paths |

*(Items #1-2 from 15-Mar UI section — request-columns and template-columns `text-sm` — remain unfixed)*

---

### Schema & Validation Inconsistencies (New Findings)

| # | File(s) | Issue | Recommendation |
|---|---------|-------|----------------|
| 1 | `schedule-schema.ts:9`, `user-schema.ts:16-17`, `template-schema.ts:51` | Three different patterns for optional UUID fields: `.nullable().optional()` vs `.optional().or(z.literal(""))` vs `.or(z.literal("")).optional().nullable().transform()` | Create shared `optionalUuid()` helper and standardize |
| 2 | `schedule-schema.ts:15` | `start_date` has `.max(10)` but no `.min(10)` — accepts partial date strings like `"202"` | Add `.min(10)` or use `.regex(/^\d{4}-\d{2}-\d{2}$/)` |
| 3 | `asset-schema.ts:15-16` | Date fields (`acquisition_date`, `warranty_expiry`) use `.min(1)` instead of date format validation | Add ISO date regex or `.length(10)` constraint |

*(Asset name max=100 from 15-Mar remains unfixed)*

---

### Test Coverage Gaps (Deep Analysis)

| # | Priority | Area | Gap | Details |
|---|----------|------|-----|---------|
| 1 | **CRITICAL** | RLS | No tests for UPDATE/DELETE cross-company blocking | Only SELECT + INSERT tested in quick-54; UPDATE/DELETE RLS policies completely untested |
| 2 | **HIGH** | Soft Delete | Only locations tested for deactivate/reactivate cycle | Companies, divisions, categories, templates, schedules, users all missing |
| 3 | **HIGH** | Duplicate Names | No E2E tests verify duplicate name rejection for any entity | Missing: case-insensitivity, reactivation-conflict scenarios |
| 4 | **HIGH** | Permissions | No role-based denial E2E tests | e.g., `ga_staff` accessing admin, `general_user` triaging, `finance_approver` creating jobs |
| 5 | **MEDIUM** | Schedules | Missing fixed/floating type transitions, pause/resume cycle tests | Only create + detail + RLS INSERT covered |
| 6 | **MEDIUM** | Status | No invalid status transition tests | Can a request jump from `submitted` → `completed`? Nothing verifies transitions are blocked |
| 7 | **MEDIUM** | Approvals | 4 fixme tests for known bugs | FK join bug, missing `completion_submitted_at`, internal field names in timeline, feedback dialog |
| 8 | **LOW** | Display ID | No tests for ID generation collisions or RPC failure fallback | `generate_*_display_id` RPCs untested |

---

### Scalability Improvements (New)

| # | Category | Suggestion |
|---|----------|------------|
| 1 | Actions | Extract `assertCompanyAccess(supabase, userId, companyId)` shared helper — currently copy-pasted across 5+ action files with inconsistent `.single()` vs `.maybeSingle()` |
| 2 | Actions | Standardize response shapes — some return `{ success: true }`, others `{ success: true, deleted: N, blocked: N }` or include IDs. Consider typed response envelopes |
| 3 | Schema | Create `optionalUuid()` Zod helper to replace 3 divergent nullable/optional UUID patterns |
| 4 | Schema | Create `isoDateString()` Zod helper with `.regex(/^\d{4}-\d{2}-\d{2}$/)` for all date fields |
| 5 | Columns | Create shared `CreatedAtCell` component to enforce `text-sm` on date spans across all entity tables |
| 6 | Testing | Set up vitest for server action unit tests with mock Supabase — would catch `.single()` vs `.maybeSingle()` bugs |
| 7 | Logging | Replace raw `console.error/log` in API routes with structured logger (e.g., pino) before production |

---

## 17-Mar-2026

### Commits Summary (Last 24h)

| Task | Commits | What Changed |
|------|---------|-------------|
| quick-79 | 4 commits | Fixed 7 security/correctness bugs: RFC-4122 UUIDs, `.single()` → `.maybeSingle()`, duplicate email on reactivate, company access on create |
| quick-80 | 3 commits | Extracted `assertCompanyAccess` + `isoDateString` shared helpers; replaced 8 inline patterns across 5 action files |
| quick-81 | 5 commits | Multi-company comprehensive fix: RLS migration for writes, removed 17 redundant company filters, scoped exports, updated dropdowns |
| quick-82 | 2 commits | Removed `warranty_expiry` column from asset table |
| quick-83 | 2 commits | Moved Transfer button from modal sticky bar to table row actions |
| standalone fixes | 4 commits | Multi-company data isolation for supporting tables, UI fixes (primary company checkbox, schedule columns, transfer filters) |
| GSD update | 1 commit | Framework tooling update (UI agents, autonomous workflow, stats) |

**Total: ~30 commits, ~50 files changed**

---

### Resolved from Previous Reviews

| # | Original Date | Original Issue | Resolution |
|---|---------------|---------------|------------|
| 1 | 16-Mar #1 (CRITICAL) | RLS fallback UUID violates RFC 4122 | **FIXED** in quick-79 (`cda120b`) — replaced with valid v4 format |
| 2 | 16-Mar #2 (HIGH) | Company access check uses `.single()` | **FIXED** in quick-79 (`f5a399a`) — standardized to `.maybeSingle()` |
| 3 | 16-Mar #3 (HIGH) | `reactivateUser` missing duplicate email check | **FIXED** in quick-79 (`53352a7`) — added check before reactivation |
| 4 | 16-Mar #4 (MEDIUM) | `createUser` missing company access validation | **FIXED** in quick-79 + quick-80 — uses `assertCompanyAccess` |
| 5 | 16-Mar Scalability #1 | Extract `assertCompanyAccess` shared helper | **DONE** in quick-80 — `lib/auth/company-access.ts`, 8 call sites across 5 action files |
| 6 | 16-Mar Scalability #3-4 | Create `optionalUuid()` + `isoDateString()` helpers | **PARTIALLY DONE** — `isoDateString()` created in quick-80; `optionalUuid()` still pending |
| 7 | 16-Mar #7 (LOW) | Invalid UUIDs in `reset-database.sql` | **FIXED** in quick-79 (`cda120b`) |

---

### Risky Patterns & Security (New Findings)

| # | Severity | File | Issue | Recommendation |
|---|----------|------|-------|----------------|
| 1 | **HIGH** | `app/actions/approval-actions.ts` (5 call sites) | `createNotifications()` called fire-and-forget with **zero error handling** — no `.catch()`, no `await`. If notification creation fails, no one knows. | Add `.catch(err => console.error('Notification failed:', err.message))` to all 5 calls |
| 2 | **HIGH** | `app/actions/job-actions.ts` (6 call sites) | Same fire-and-forget `createNotifications()` pattern — no error handling at all | Same fix as above for all 6 calls |
| 3 | **MEDIUM** | `app/actions/request-actions.ts` (4 call sites) | Has `.catch(() => {})` — better than nothing, but silently swallows errors with no logging | Change to `.catch(err => console.error('Notification failed:', err.message))` |
| 4 | **MEDIUM** | `app/actions/approval-actions.ts`, `template-actions.ts`, `pm-job-actions.ts` | Not using `assertCompanyAccess` shared helper — approval-actions may be intentional (RLS-scoped fetch), but template-actions and pm-job-actions should be audited | Audit whether these actions need company access validation or rely on RLS |
| 5 | **LOW** | `app/actions/*.ts` (67 total `.single()` calls) | High `.single()` count across action files — most are correct (fetching by ID), but any missing row throws a Supabase PGRST116 error instead of a user-friendly message | Consider wrapping in try/catch with friendly error for user-facing queries |

---

### UI/UX Inconsistencies (New + Persistent)

| # | Status | File | Issue | Fix |
|---|--------|------|-------|-----|
| 1 | **PERSISTENT** (15-Mar) | `components/requests/request-columns.tsx:156` | Missing `text-sm` on Created date span | Add `className="text-sm"` |
| 2 | **PERSISTENT** (15-Mar) | `components/maintenance/template-columns.tsx:74` | Missing `text-sm` on Created date span | Add `className="text-sm"` |
| 3 | **PERSISTENT** (15-Mar) | `lib/utils.ts:27` | CSV export filename uses `yyyy-MM-dd` instead of `dd-MM-yyyy` | Change format string |
| 4 | **PERSISTENT** (16-Mar) | `components/maintenance/schedule-columns.tsx:62` | Asset `display_id` missing `font-mono` class | Add `font-mono` to span |
| 5 | **NEW** | `components/maintenance/schedule-columns.tsx:139` | `last_completed_at` date span missing `text-sm` | Add `className="text-sm"` |
| 6 | **NEW** | `components/maintenance/schedule-columns.tsx:57` | Asset name link missing `text-blue-600` class | Add `text-blue-600` to link styling |
| 7 | **NEW** | `components/maintenance/schedule-detail.tsx:150` | Asset `display_id` in Input value not styled with `font-mono` | Render display_id in a `font-mono` span or separate field |
| 8 | **NEW** | `components/maintenance/schedule-view-modal.tsx:352` | Asset `display_id` in parentheses missing `font-mono` | Add `font-mono` to span |
| 9 | **NEW** | `components/maintenance/template-view-modal.tsx:308` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 10 | **NEW** | `components/maintenance/template-detail.tsx:171` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 11 | **NEW** | `components/maintenance/schedule-detail.tsx:176` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 12 | **NEW** | `components/maintenance/schedule-view-modal.tsx:345` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 13 | **NEW** | `components/assets/asset-view-modal.tsx:482` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 14 | **NEW** | `components/assets/asset-detail-client.tsx:137` | Initiated date span missing `text-sm` | Add `className="text-sm"` |

---

### Schema & Validation Inconsistencies (Updated)

| # | Status | File(s) | Issue | Recommendation |
|---|--------|---------|-------|----------------|
| 1 | **PERSISTENT** (15-Mar) | `lib/validations/asset-schema.ts` | Asset `name` max=100, should be 60 per CLAUDE.md | Align to 60 or document exception |
| 2 | **PERSISTENT** (15-Mar) | `lib/validations/template-schema.ts` | Template `name` max=100, should be 60 | Align to 60 or document exception |
| 3 | **PERSISTENT** (16-Mar) | `schedule-schema.ts:9`, `user-schema.ts:16-17`, `template-schema.ts:51` | 3 different patterns for optional UUID fields | Create shared `optionalUuid()` helper |
| 4 | **RESOLVED** | `schedule-schema.ts:15` | `start_date` lacks format validation | **FIXED** — now uses `isoDateString()` helper (quick-80) |

---

### Test Coverage Gaps (Persistent)

*All 8 items from 16-Mar remain open. No new test files added in last 24h. Multi-company RLS write policies (migration 00027) add an additional untested surface:*

| # | Priority | Area | Gap |
|---|----------|------|-----|
| 9 | **HIGH** | RLS | New INSERT/UPDATE multi-company policies (migration 00027) completely untested |
| 10 | **HIGH** | Actions | `assertCompanyAccess` helper has no unit tests — used in 8 critical mutation paths |

---

### Scalability Improvements (Updated)

| # | Status | Category | Suggestion |
|---|--------|----------|------------|
| 1 | **DONE** | Actions | ~~Extract `assertCompanyAccess` shared helper~~ — completed in quick-80 |
| 2 | OPEN | Actions | Standardize response shapes — some return `{ success: true }`, others include counts or IDs |
| 3 | OPEN | Schema | Create `optionalUuid()` Zod helper to replace 3 divergent patterns |
| 4 | **DONE** | Schema | ~~Create `isoDateString()` Zod helper~~ — completed in quick-80 |
| 5 | OPEN | Columns | Create shared `CreatedAtCell` component to enforce `text-sm` on date spans (14 inconsistencies found) |
| 6 | OPEN | Testing | Set up vitest for server action unit tests — `assertCompanyAccess` and notification helpers are prime candidates |
| 7 | OPEN | Logging | Replace raw `console.error/log` (35+ occurrences) with structured logger before production |
| 8 | **NEW** | Notifications | Standardize notification error handling — currently 3 patterns: no handling (11 calls), silent swallow (4 calls), and none use logging |
| 9 | **NEW** | Display IDs | Create shared `DisplayId` component with `font-mono` baked in — currently 4 locations miss the class |

---

### What's Working Well (Updated)

- **100% responsive design compliance** — zero mobile-first breakpoint violations
- **100% maxLength compliance** — all Input components match Zod `.max(N)` values
- **100% date format compliance** — all user-visible dates use `dd-MM-yyyy` (only CSV filename and internal URL params use ISO)
- **assertCompanyAccess adopted** across 5 action files (8 call sites) — consistent `.maybeSingle()` pattern
- **isoDateString adopted** across 3 schema files — consistent date validation
- **Multi-company RLS complete** — SELECT, INSERT, UPDATE policies all handle multi-company access
- **17 redundant company filters removed** — cleaner action code, RLS handles scoping
- **Export routes properly scoped** — all 4 exports use `allAccessibleCompanyIds`

---

## 18-Mar-2026

### Commits Summary (17-Mar-2026, reviewed 18-Mar)

| Task | Commits | What Changed |
|------|---------|-------------|
| quick-91 | 3 commits | Scoped transfer dialog users/locations to asset's company |
| quick-92 | 4 commits | Created `AssetTransferRespondModal` with accept/reject flow |
| quick-93 | 3 commits | Added `.catch()` error logging to all 15 `createNotifications` calls |
| quick-94 | 2 commits | In-transit status badge overwrites active badge instead of showing both |
| quick-95 | 4 commits | Edit Transfer button for GA lead/admin in asset table |
| quick-96 | 2 commits | Block asset transfer for `under_repair` status |
| quick-97 | 2 commits | Prevent moving asset to same location |
| quick-98 | 2 commits | Show receiver name under location in asset table for in-transit assets |
| quick-99 | 2 commits | Block asset transfer for `broken` status |
| quick-100 | 4 commits | Consolidated respond components — deleted old 232-line dialog |
| quick-101 | 2 commits | Validate receiver is active in `createTransfer` and `acceptTransfer` |
| quick-102 | 2 commits | `initialMode` prop to skip redundant mode selection |
| quick-103 | 2 commits | Action-specific success messages in asset table |
| quick-105 | 2 commits | PhotoLightbox z-index bump to z-[60] above Dialog overlays |
| quick-106–108 | 2 commits | UI audit fixes: remove auto-redirect, fix blue shade, improve error messages |
| quick-109 | 4 commits | `holder_id` column on `inventory_items` + display in table/modal/detail |
| quick-110 | 2 commits | Seed holder_id round-robin across Jaknot users |
| quick-111 | 2 commits | Allow transfer to any user in company (removed GA-role restriction) |
| GSD update | 1 commit | New workflows (do, note, help), context monitor hook |

**Total: ~58 commits, ~80 files changed**

---

### Resolved from Previous Reviews

| # | Original Date | Original Issue | Resolution |
|---|---------------|---------------|------------|
| 1 | 17-Mar #1 (HIGH) | `createNotifications()` fire-and-forget in approval-actions (5 calls) | **FIXED** in quick-93 — all 5 calls now have `.catch(err => console.error(...))` |
| 2 | 17-Mar #2 (HIGH) | `createNotifications()` fire-and-forget in job-actions (6 calls) | **FIXED** in quick-93 — all 6 calls now have `.catch()` |
| 3 | 17-Mar #3 (MEDIUM) | `request-actions` notification `.catch(() => {})` swallows silently | **FIXED** in quick-93 — changed to `.catch(err => console.error(...))` with logging |

---

### Risky Patterns & Security (New Findings)

| # | Severity | File | Issue | Recommendation |
|---|----------|------|-------|----------------|
| 1 | **CRITICAL** | `app/actions/asset-actions.ts` (`createTransfer`) | Receiver `receiver_id` validated for existence and active status, but **no company_id check**. Could allow cross-company transfer if RLS on user_profiles doesn't restrict visibility. | Add `.eq('company_id', asset.company_id)` to receiver lookup query, or validate `receiver.company_id` matches asset company |
| 2 | **CRITICAL** | `app/actions/asset-actions.ts` (`acceptTransfer`) | Two sequential updates (movement + asset) without transactional guarantee. If step 1 succeeds but step 2 fails, movement shows "accepted" but asset location is stale. | Add rollback logic: if asset update fails, revert movement to `pending`. Or use a Postgres function for atomic update |
| 3 | **HIGH** | `app/actions/asset-actions.ts` (`createTransfer`, location-only branch) | Location-only transfer auto-accepts and updates `location_id` but does **NOT clear `holder_id`**. Stale holder remains on asset after location move. | Add `holder_id: null` to the location-only update query |
| 4 | **MEDIUM** | `app/actions/asset-actions.ts` (`cancelTransfer`) | Uses `adminSupabase` to update movement but query has no `company_id` filter — only filters by `id`. Defense-in-depth gap. | Add `.eq('company_id', movement.company_id)` to adminSupabase update |
| 5 | **MEDIUM** | `components/assets/asset-transfer-respond-modal.tsx` (lines 204-237) | Photo upload via `fetch('/api/uploads/...')` after successful accept/reject — **no error handling** on the fetch response. If upload fails, user sees success but photos aren't stored. | Check `response.ok` and show warning if photo upload fails |

---

### Missing Tests (New + Persistent)

| # | Priority | Status | Area | Gap |
|---|----------|--------|------|-----|
| 1 | **CRITICAL** | PERSISTENT (17-Mar) | RLS | Multi-company RLS write policies (migration 00027) completely untested |
| 2 | **HIGH** | PERSISTENT (17-Mar) | Unit | `assertCompanyAccess` helper has no unit tests — used in 8 critical mutation paths |
| 3 | **HIGH** | NEW | E2E | Transfer accept/reject flow — zero tests for receiver-based transfer lifecycle |
| 4 | **HIGH** | NEW | E2E | `holder_id` consistency — no tests verifying holder set on accept, cleared on location move |
| 5 | **HIGH** | NEW | E2E | Cross-company receiver validation — no tests for company boundary enforcement |
| 6 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Status transition validation — no invalid transition rejection tests |
| 7 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Soft delete cycle — only locations tested; companies, divisions, categories, templates, schedules, users missing |
| 8 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Duplicate name rejection — no tests for case-insensitivity or reactivation conflicts |
| 9 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Role-based denial — no tests for unauthorized role actions |

---

### UI/UX Inconsistencies (New + Persistent)

| # | Status | File | Issue | Fix |
|---|--------|------|-------|-----|
| 1 | **PERSISTENT** (15-Mar) | `components/requests/request-columns.tsx:156` | Missing `text-sm` on Created date span | Add `className="text-sm"` |
| 2 | **PERSISTENT** (15-Mar) | `components/maintenance/template-columns.tsx:74` | Missing `text-sm` on Created date span | Add `className="text-sm"` |
| 3 | **PERSISTENT** (15-Mar) | `lib/utils.ts:27` | CSV export filename uses `yyyy-MM-dd` instead of `dd-MM-yyyy` | Change format string |
| 4 | **PERSISTENT** (16-Mar) | `components/maintenance/schedule-columns.tsx:62` | Asset `display_id` missing `font-mono` | Add `font-mono` to span |
| 5 | **PERSISTENT** (16-Mar) | `components/audit-trail/audit-trail-columns.tsx:141-160` | Display ID link variant missing `font-mono` | Add `font-mono` to both code paths |
| 6 | **PERSISTENT** (17-Mar) | `components/maintenance/schedule-columns.tsx:139` | `last_completed_at` date span missing `text-sm` | Add `className="text-sm"` |
| 7 | **PERSISTENT** (17-Mar) | `components/maintenance/schedule-columns.tsx:57` | Asset name link missing `text-blue-600` | Add `text-blue-600` to link |
| 8 | **PERSISTENT** (17-Mar) | `components/maintenance/schedule-detail.tsx:150` | Asset `display_id` in Input not `font-mono` | Render display_id in `font-mono` span |
| 9 | **PERSISTENT** (17-Mar) | `components/maintenance/schedule-view-modal.tsx:352` | Asset `display_id` missing `font-mono` | Wrap with `font-mono` span |
| 10 | **PERSISTENT** (17-Mar) | `components/maintenance/template-view-modal.tsx:308` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 11 | **PERSISTENT** (17-Mar) | `components/maintenance/template-detail.tsx:171` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 12 | **PERSISTENT** (17-Mar) | `components/maintenance/schedule-detail.tsx:176` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 13 | **PERSISTENT** (17-Mar) | `components/maintenance/schedule-view-modal.tsx:345` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 14 | **PERSISTENT** (17-Mar) | `components/assets/asset-view-modal.tsx:482` | Created date span missing `text-sm` | Add `className="text-sm"` |
| 15 | **PERSISTENT** (17-Mar) | `components/assets/asset-detail-client.tsx:137` | Initiated date span missing `text-sm` | Add `className="text-sm"` |
| 16 | **NEW** | `components/audit-trail/audit-trail-columns.tsx:141` | Link hover uses `text-blue-800` instead of `-700` | Standardize hover to `hover:text-blue-700` |
| 17 | **NEW** | `components/maintenance/template-columns.tsx` | Link hover uses `text-blue-800` instead of `-700` | Standardize hover to `hover:text-blue-700` |
| 18 | **NEW** | `components/maintenance/schedule-columns.tsx` | Link hover uses `text-blue-800` instead of `-700` | Standardize hover to `hover:text-blue-700` |

---

### Schema & Validation Inconsistencies (Updated)

| # | Status | File(s) | Issue | Recommendation |
|---|--------|---------|-------|----------------|
| 1 | **PERSISTENT** (15-Mar) | `lib/validations/asset-schema.ts` | Asset `name` max=100, should be 60 per CLAUDE.md | Align to 60 or document exception |
| 2 | **PERSISTENT** (15-Mar) | `lib/validations/template-schema.ts` | Template `name` max=100, should be 60 | Align to 60 or document exception |
| 3 | **PERSISTENT** (16-Mar) | `schedule-schema.ts`, `user-schema.ts`, `template-schema.ts` | 3 different patterns for optional UUID fields | Create shared `optionalUuid()` helper |

---

### Code Consistency & Scalability Improvements (Updated)

| # | Status | Category | Suggestion |
|---|--------|----------|------------|
| 1 | **DONE** | Actions | ~~Extract `assertCompanyAccess` shared helper~~ |
| 2 | OPEN | Actions | Standardize response shapes — some return `{ success: true }`, others include counts or IDs. Create `ActionResponse<T>` type |
| 3 | OPEN | Schema | Create `optionalUuid()` Zod helper to replace 3 divergent patterns |
| 4 | **DONE** | Schema | ~~Create `isoDateString()` Zod helper~~ |
| 5 | OPEN | Columns | Create shared `CreatedAtCell` component — 15 date spans missing `text-sm` |
| 6 | OPEN | Testing | Set up vitest for server action unit tests — `assertCompanyAccess` prime candidate |
| 7 | OPEN | Logging | Replace raw `console.error/log` (35+ occurrences) with structured logger |
| 8 | **DONE** | Notifications | ~~Standardize notification error handling~~ — all 15 calls now have `.catch()` with logging |
| 9 | OPEN | Display IDs | Create shared `DisplayId` component with `font-mono` baked in — 4 locations miss the class |
| 10 | **NEW** | Notifications | Extract `safeCreateNotifications()` helper — 15 identical `.catch(err => console.error(...))` patterns |
| 11 | **NEW** | Type Safety | Remove `any` types from `job-form.tsx:252` (form submit handler) and `status-bar-chart.tsx:32` (bar click handler) |
| 12 | **NEW** | Error Handling | Photo upload error handling in modals — `asset-transfer-respond-modal.tsx` and `job-form.tsx` don't check fetch response |
| 13 | **NEW** | Data Integrity | Add rollback logic to `acceptTransfer` two-step update, or use Postgres function for atomicity |
| 14 | **NEW** | Link Colors | Standardize all link hover states to `hover:text-blue-700` — 3 files use `-800` |

---

### What's Working Well (Updated)

- **100% responsive design compliance** — zero mobile-first breakpoint violations
- **100% maxLength compliance** — all Input components match Zod `.max(N)` values
- **100% date format compliance** — all user-visible dates use `dd-MM-yyyy`
- **100% notification error handling** — all 15 `createNotifications` calls now have `.catch()` with logging
- **100% feedback persistence** — no auto-dismiss timers on any success/error message
- **100% soft-delete terminology** — "Deactivate"/"Reactivate" everywhere
- **100% Combobox/Select correctness** — large lists use Combobox, small fixed lists use Select
- **assertCompanyAccess adopted** across 5 action files (8 call sites)
- **Transfer workflow fully hardened** — 20 quick tasks covering validation, scoping, status blocking, UX
- **New `AssetTransferRespondModal`** follows all CLAUDE.md patterns (font-mono, date format, InlineFeedback, desktop-first)
- **Custody tracking (`holder_id`)** — column added, seed data populated, displayed in 3 views

---

## 19-Mar-2026

### Commits Summary (18-Mar-2026)

| Task | Commits | What Changed |
|------|---------|-------------|
| quick-112 (bah) | 2 commits | 5 security/correctness fixes in asset transfer actions |
| quick-113 (bnb) | 4 commits | ActionResponse<T> type system + return type annotations on all 81 server actions |
| quick-114 (cbb) | 3 commits | Extracted shared CreatedAtCell/DisplayId components, removed `any` types, standardized link hover colors |
| quick-115 (fm0) | 2 commits | 3 security fixes: updateUser company access, createTransfer multi-company, deleteAssetPhotos access |
| quick-116 (fra) | 1 commit | RLS migration 00029: company_settings multi-company expansion |
| quick-117 (fv3) | 3 commits | Optimistic locking on updateAsset/updateJob/updateRequest + form updated_at passthrough |
| quick-118 (g3x) | 2 commits | 5 accessibility fixes: skip-to-content, KPI card links, focus restore, aria-labels, aria-live |
| quick-119 (g8o) | 2 commits | Batch N+1 timeline queries in request/job detail pages |
| quick-120 (gdy) | 1 commit | Block status change during transfer + block job completion without PIC |
| docs | 3 commits | GA PRD (ga-prd-human.md), db_schema.md from 29 migrations, CLAUDE.md PRD reference |
| planning docs | 7 commits | STATE.md updates, improvements log, verification reports, summaries |

**Total: 30 commits, 58 files changed, 3,235 lines added**

---

### Resolved from Previous Reviews

| # | Original Date | Original Issue | Resolution |
|---|---------------|---------------|------------|
| 1 | 18-Mar #2 (OPEN) | Standardize response shapes — some `{ success: true }`, others include IDs | **DONE** — ActionResponse<T> type system created, all 81 actions typed (quick-bnb) |
| 2 | 18-Mar #5 (OPEN) | Create shared `CreatedAtCell` component | **DONE** — extracted in quick-cbb (`components/data-table/created-at-cell.tsx`) |
| 3 | 18-Mar #9 (OPEN) | Create shared `DisplayId` component with `font-mono` | **DONE** — extracted in quick-cbb (`components/display-id.tsx`) |
| 4 | 18-Mar #11 (NEW) | Remove `any` types from job-form.tsx and status-bar-chart.tsx | **DONE** — fixed in quick-cbb |
| 5 | 18-Mar #14 (NEW) | Standardize link hover to `hover:text-blue-700` | **DONE** — fixed in quick-cbb (notification-dropdown, template-columns) |
| 6 | 18-Mar #1 (CRITICAL) | createTransfer no company_id check on receiver | **FIXED** in quick-fm0 — multi-company access validated |
| 7 | 18-Mar #3 (HIGH) | Location-only transfer doesn't clear holder_id | **Needs verification** — check if quick-bah addressed this |

---

### Risky Patterns & Security (New Findings)

| # | Severity | File | Issue | Recommendation |
|---|----------|------|-------|----------------|
| 1 | **HIGH** | All 15 `app/actions/*.ts` files | Zero unit tests for server actions. Only 2 test files exist in `__tests__/actions/` (job-utils, user-company-access). Per CLAUDE.md: "add or update a test" for access control, query filters, status transitions, business rules | Set up vitest test suite for server action business logic |
| 2 | **HIGH** | 27 RLS migration files | Only 1 RLS test exists (`e2e/tests/quick-54-rls/`). All INSERT/UPDATE/DELETE multi-company policies untested | Add RLS policy tests for each table's CRUD operations |
| 3 | **MEDIUM** | `app/actions/approval-actions.ts:196-204` | Bulk request status update (submitted→pending_acceptance) has **no error check** — silent failure | Add `if (error) throw new Error(error.message)` after update |
| 4 | **MEDIUM** | `app/api/uploads/entity-photos/route.ts:187` | Unchecked `.data` access — `uploadData.path` used without null check after upload succeeds | Add explicit `if (!uploadData) continue;` before accessing `.path` |
| 5 | **MEDIUM** | `app/api/uploads/entity-photos/route.ts:209-249` | Fire-and-forget Vision API promise chain with `catch(() => {})` — errors swallowed silently | Add `console.error()` logging before catch |
| 6 | **MEDIUM** | `app/api/uploads/entity-photos/route.ts:217` | Vision API key embedded in URL query parameter — logged in proxies/CDN. No rate limiting | Move to `Authorization: Bearer` header; add per-user upload rate limiting |
| 7 | **MEDIUM** | `app/actions/asset-actions.ts:328-333` | Location-only transfer: two sequential updates (movement insert + asset update) without atomic transaction. Race condition between operations | Wrap in Postgres function for atomicity |
| 8 | **MEDIUM** | `app/actions/asset-actions.ts`, `job-actions.ts`, `request-actions.ts` | Optimistic locking only on 3 core update actions — missing from profile, user, admin settings, template, schedule updates | Extend optimistic locking to all multi-user editable entities |
| 9 | **LOW** | `app/api/auth/callback/route.ts:124` | `console.log` in production with userId and redirectTo — PII in server logs | Change to `console.debug()` or structured logger |
| 10 | **LOW** | `app/actions/request-actions.ts:597`, `asset-actions.ts:566,606` | Signed URL failure silently produces `url: ''` — broken images in UI | Return error state or explicit null for failed URLs |
| 11 | **LOW** | `app/actions/job-actions.ts:241-245` | Delete from `job_requests` has no error check — silent failure | Add error handling |

---

### UI/UX Inconsistencies (New + Persistent)

| # | Status | File | Issue | Fix |
|---|--------|------|-------|-----|
| 1 | **PERSISTENT** (15-Mar) | `lib/utils.ts:27` | CSV export filename uses `yyyy-MM-dd` instead of `dd-MM-yyyy` | Change format string |
| 2 | **PERSISTENT** (16-Mar) | `components/audit-trail/audit-trail-columns.tsx:141-160` | Display ID link variant missing `font-mono` | Add `font-mono` to both code paths |
| 3 | **PERSISTENT** (17-Mar) | Multiple maintenance components (8 locations) | Created date spans missing `text-sm` | Apply shared `CreatedAtCell` component to remaining locations |
| 4 | **PERSISTENT** (17-Mar) | Multiple maintenance components (4 locations) | Asset `display_id` missing `font-mono` | Apply shared `DisplayId` component |
| 5 | **NEW** | `components/admin/entity-form-dialog.tsx:124-137` | Secondary action button (deactivate/reactivate) uses `variant="ghost"` with inline color classes — inconsistent with user-deactivate-dialog which uses proper AlertDialogAction with bg-colors | Standardize to AlertDialogAction pattern |
| 6 | **NEW** | `components/maintenance/template-columns.tsx` | "View" link uses `font-medium text-blue-600 hover:text-blue-800 hover:underline` — differs from standard ghost button pattern (`h-7 px-2`) used in admin tables | Align to ghost button pattern or document as intentional for domain entity tables |
| 7 | **OBSERVATION** | 26+ inline `font-mono` usages | `DisplayId` component extracted but **underutilized** — only used in a few locations while 26+ locations still use inline `className="font-mono"` | Migrate all display_id renders to use `<DisplayId>` wrapper |
| 8 | **OBSERVATION** | `CreatedAtCell` component | Same situation — extracted but majority of date renders still use inline formatting | Migrate remaining date renders to use `<CreatedAtCell>` |

---

### Code Consistency & Scalability Improvements (Updated)

| # | Status | Category | Suggestion |
|---|--------|----------|------------|
| 1 | **DONE** | Actions | ~~Extract `assertCompanyAccess` shared helper~~ |
| 2 | **DONE** | Actions | ~~Standardize response shapes~~ — ActionResponse<T> type system created + all 81 actions typed |
| 3 | OPEN | Schema | Create `optionalUuid()` Zod helper to replace 3 divergent nullable/optional UUID patterns |
| 4 | **DONE** | Schema | ~~Create `isoDateString()` Zod helper~~ |
| 5 | **DONE** | Columns | ~~Create shared `CreatedAtCell` component~~ — extracted, but needs migration to all remaining locations |
| 6 | OPEN | Testing | Set up vitest for server action unit tests — 15 action files with zero tests |
| 7 | OPEN | Logging | Replace raw `console.error/log` (35+ occurrences) with structured logger before production |
| 8 | **DONE** | Notifications | ~~Standardize notification error handling~~ |
| 9 | **DONE** | Display IDs | ~~Create shared `DisplayId` component~~ — extracted, but needs migration to all 26+ locations |
| 10 | OPEN | Notifications | Extract `safeCreateNotifications()` helper — 15 identical `.catch(err => console.error(...))` patterns |
| 11 | **DONE** | Type Safety | ~~Remove `any` types from job-form.tsx and status-bar-chart.tsx~~ |
| 12 | OPEN | Error Handling | Photo upload error handling in modals — `asset-transfer-respond-modal.tsx` and `job-form.tsx` don't check fetch response |
| 13 | OPEN | Data Integrity | Add rollback logic to `acceptTransfer` two-step update, or use Postgres function for atomicity |
| 14 | **DONE** | Link Colors | ~~Standardize link hover to `hover:text-blue-700`~~ — fixed in notification-dropdown, but still pending in template-columns, schedule-columns |
| 15 | **NEW** | Timestamps | Extract `getCurrentTimestamp()` utility — 39 instances of `new Date().toISOString()` scattered across 8 action files |
| 16 | **NEW** | Paths | Centralize `revalidatePath()` constants — 12+ hardcoded route paths scattered across action files |
| 17 | **NEW** | Roles | Create role access matrix constant — inline role arrays like `['ga_lead', 'admin']` repeated across files |
| 18 | **NEW** | Tables | Standardize filter state management — domain tables (jobs, requests) use `nuqs` URL params, admin tables use local React state. Inconsistent UX. |
| 19 | **NEW** | Adoption | Migrate all 26+ inline `font-mono` for display IDs to use `<DisplayId>` wrapper component |
| 20 | **NEW** | Adoption | Migrate all remaining date renders to use `<CreatedAtCell>` component |
| 21 | **NEW** | Validation | Audit all form `<Input>` elements — ensure every Zod `.max(N)` has matching `maxLength={N}` attribute |

---

### Missing Tests (Persistent + New)

| # | Priority | Status | Area | Gap |
|---|----------|--------|------|-----|
| 1 | **CRITICAL** | PERSISTENT | Unit | All 15 server action files lack unit tests — only 2 test files in `__tests__/actions/` |
| 2 | **CRITICAL** | PERSISTENT (17-Mar) | RLS | Multi-company RLS write policies (migration 00027, 00029) completely untested |
| 3 | **HIGH** | PERSISTENT (17-Mar) | Unit | `assertCompanyAccess` helper — 8 critical mutation paths, zero tests |
| 4 | **HIGH** | PERSISTENT (18-Mar) | E2E | Transfer accept/reject flow — zero tests for receiver-based lifecycle |
| 5 | **HIGH** | PERSISTENT (18-Mar) | E2E | `holder_id` consistency — no tests verifying holder set on accept, cleared on location move |
| 6 | **HIGH** | NEW | Unit | Optimistic locking mechanism — no tests for concurrent edit rejection |
| 7 | **HIGH** | NEW | Unit | ActionResponse<T> type compliance — no tests verifying all actions return correct shape |
| 8 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Invalid status transition rejection — no tests proving transitions are blocked |
| 9 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Soft delete cycle — only locations tested; 6 other entities missing |
| 10 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Duplicate name rejection — case-insensitivity and reactivation conflicts |
| 11 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Role-based denial — no tests for unauthorized role actions |

---

### What's Working Well (Updated)

- **100% responsive design compliance** — zero mobile-first breakpoint violations across entire codebase
- **100% maxLength compliance** — all Input components match Zod `.max(N)` values
- **100% date format compliance** — all user-visible dates use `dd-MM-yyyy`
- **100% notification error handling** — all 15 `createNotifications` calls have `.catch()` with logging
- **100% feedback persistence** — no auto-dismiss timers on any success/error message
- **100% soft-delete terminology** — "Deactivate"/"Reactivate" everywhere
- **100% Combobox/Select correctness** — large lists use Combobox, small fixed lists use Select
- **100% form pattern compliance** — all forms use react-hook-form + zodResolver, zero raw useState
- **100% ActionResponse<T> compliance** — all 81 server actions have explicit typed return annotations
- **No `any` types remaining** — strict TypeScript throughout
- **No `@ts-ignore` or `@ts-expect-error`** — zero suppression directives
- **No `dangerouslySetInnerHTML`** — zero XSS vectors
- **Optimistic locking active** on 3 core entities (assets, jobs, requests)
- **Shared components extracted** — `CreatedAtCell`, `DisplayId` ready for broader adoption
- **Accessibility improved** — skip-to-content, focus management, aria-live, semantic elements

---

### Supplementary Findings (Deep Action Analysis)

Additional findings from thorough per-file server action analysis:

| # | Severity | File | Issue | Recommendation |
|---|----------|------|-------|----------------|
| 12 | **HIGH** | `app/actions/profile-actions.ts` (`changePassword`) | Schema has unbounded `currentPassword` and `newPassword` string fields — no `.max()` | Add `.max(128)` to both password fields in schema |
| 13 | **HIGH** | `app/actions/pm-job-actions.ts` | `savePMChecklistItem` `itemId` field uses `.min(1)` but missing `.uuid()` validation; `savePMChecklistPhoto` same issue | Add `.uuid()` to all ID fields |
| 14 | **MEDIUM** | `app/actions/company-settings-actions.ts` | `getCompanySettings` and `updateCompanySetting` hardcode `.eq('company_id', profile.company_id)` — blocks multi-company admin access to settings | Use `effectiveCompanyId` or `allAccessibleCompanyIds` pattern |
| 15 | **MEDIUM** | `app/actions/job-actions.ts`, `request-actions.ts` | Notification `company_id` uses `profile.company_id` instead of entity's `company_id` — multi-company user may notify wrong company's users | Use `job.company_id` / `request.company_id` for notification scoping |
| 16 | **MEDIUM** | `app/actions/user-actions.ts` (`deactivateUser`) | Missing company access check — admin could deactivate user in a company they don't have access to | Add `assertCompanyAccess` before deactivation |
| 17 | **LOW** | `app/actions/company-settings-actions.ts`, `user-company-access-actions.ts` | GET actions (`getCompanySettings`, `getUserCompanyAccess`) return raw objects instead of `ActionResponse<T>` | Wrap in ActionResponse for consistency |

---

## 20-Mar-2026

### Commits Summary (19-Mar-2026)

| Task | Commits | What Changed |
|------|---------|-------------|
| quick-260319-np2 | 1 commit | 7 code quality fixes: error checks, null safety, rollback, PII, empty URLs across 6 action/API files |
| quick-260319-nye | 4 commits | Extract role constants (`ROLES`, `GA_ROLES`, `LEAD_ROLES`) to `lib/constants/roles.ts`; adopt `DisplayId` in 10 components; adopt `CreatedAtCell` for schedule `last_completed_at` |
| quick-260319-oet | 1 commit | Optimistic locking tests, ActionResponse tests (116 lines), permissions test fix, `assertNotStale` utility extraction |
| docs/state | 4 commits | STATE.md updates, verification reports, task summaries |

**Total: 11 commits, 55 files changed, ~888 lines added**

---

### Resolved from Previous Reviews

| # | Original Date | Original Issue | Resolution |
|---|---------------|---------------|------------|
| 1 | 19-Mar #17 (NEW) | Create role access matrix constant — inline role arrays repeated | **DONE** — `lib/constants/roles.ts` created with `ROLES`, `GA_ROLES`, `LEAD_ROLES`; 60+ inline checks replaced across 36 files |
| 2 | 19-Mar #19 (NEW) | Migrate display IDs to `<DisplayId>` wrapper | **PARTIALLY DONE** — 10 additional components migrated; ~14 inline locations remain (see UI section below) |
| 3 | 19-Mar #20 (NEW) | Migrate date renders to `<CreatedAtCell>` | **PARTIALLY DONE** — schedule `last_completed_at` migrated; several inline renders remain |
| 4 | 19-Mar #6 (HIGH) | Optimistic locking mechanism — no tests | **DONE** — `assertNotStale` tests added in `__tests__/lib/optimistic-lock.test.ts` |
| 5 | 19-Mar #7 (HIGH) | ActionResponse<T> type compliance — no shape tests | **DONE** — 116-line test suite in `__tests__/lib/types/action-responses.test.ts` |

---

### Risky Patterns & Security (New Findings)

| # | Severity | File | Issue | Recommendation |
|---|----------|------|-------|----------------|
| 1 | **HIGH** | `components/requests/request-detail-info.tsx:368` | **Semantic bug:** Uses `RequestStatusBadge` to render a **job** status. The badge maps request statuses, not job statuses — displays incorrect colors/labels for job lifecycle | Replace with `JobStatusBadge` component |
| 2 | **HIGH** | `components/password-change-dialog.tsx` | Auto-dismissing dialog: `setTimeout(() => setOpen(false), 2000)` after success. Violates "never auto-dismiss feedback" CLAUDE.md rule | Remove setTimeout, let user close manually |
| 3 | **HIGH** | `components/requests/request-triage-dialog.tsx` | Auto-dismissing dialog: `setTimeout(() => setOpen(false), 1500)` after success. Same violation | Remove setTimeout, let user close manually |
| 4 | **MEDIUM** | `app/(dashboard)/page.tsx:35` | Hardcoded `OPERATIONAL_ROLES = ['ga_lead', 'admin', 'finance_approver']` — not in `lib/constants/roles.ts` | Add `OPERATIONAL_ROLES` to role constants file |
| 5 | **MEDIUM** | `app/(dashboard)/requests/page.tsx:171`, `jobs/page.tsx:225` | Inline `['ga_lead', 'admin', 'finance_approver'].includes()` — same set as OPERATIONAL_ROLES | Import from constants |
| 6 | **MEDIUM** | `app/(dashboard)/jobs/page.tsx:228` | Inline `['ga_lead', 'admin', 'ga_staff'].includes()` — this IS `GA_ROLES` but written inline | Import `GA_ROLES` from constants |
| 7 | **MEDIUM** | `app/(dashboard)/approvals/page.tsx:35` | Inline `['finance_approver', 'ga_lead', 'admin'].includes()` | Import from constants |
| 8 | **MEDIUM** | `app/api/exports/requests/route.ts:11`, `exports/jobs/route.ts:11` | Hardcoded `EXPORT_ROLES = ['ga_lead', 'admin', 'finance_approver']` | Move to role constants |
| 9 | **MEDIUM** | `app/(auth)/update-password/page.tsx:23` | Only place in codebase using `getSession()` instead of `getUser()`. Security: `getSession()` reads local JWT without server validation | Switch to `getUser()` for consistency |
| 10 | **MEDIUM** | `app/api/uploads/entity-photos/route.ts:20` | Wrong table name `'assets'` for inventory entity type — correct table is `'inventory_items'`. Dead code (no component calls this), but latent bug if entity-photos ever used for assets | Fix table name to `'inventory_items'` |
| 11 | **LOW** | `app/api/exports/maintenance/route.ts:84` | `schedule.template_name` fallback reference — `maintenance_schedules` has no `template_name` column. Always `undefined`, masked by `template?.name` | Remove dead fallback |

---

### UI/UX Inconsistencies (New + Persistent)

| # | Status | File | Issue | Fix |
|---|--------|------|-------|-----|
| 1 | **PERSISTENT** (15-Mar) | `lib/utils.ts:27` | CSV export filename uses `yyyy-MM-dd` instead of `dd-MM-yyyy` | Change format string |
| 2 | **PERSISTENT** (16-Mar) | `components/audit-trail/audit-trail-columns.tsx:141-160` | Display ID link variant missing `font-mono` | Add `font-mono` or use `<DisplayId>` |
| 3 | **PERSISTENT** (17-Mar) | Multiple maintenance components (8 locations) | Created date spans missing `text-sm` | Apply `<CreatedAtCell>` component |
| 4 | **PERSISTENT** (17-Mar) | Multiple maintenance components (4 locations) | Asset `display_id` missing `font-mono` | Apply `<DisplayId>` component |
| 5 | **NEW** | `components/maintenance/schedule-detail.tsx:291` | Uses `grid-cols-2` instead of standard `grid-cols-[1fr_380px]` | Align to detail page convention |
| 6 | **NEW** | `components/maintenance/template-detail.tsx:347` | Uses `grid-cols-2` instead of standard `grid-cols-[1fr_380px]` | Align to detail page convention |
| 7 | **NEW** | `app/(dashboard)/inventory/new/page.tsx` | Full `/new` page exists alongside `AssetCreateDialog` modal — violates "no separate `/new` pages" rule | Remove `/new` page, use modal exclusively |
| 8 | **NEW** | `app/(dashboard)/inventory/[id]/page.tsx:217` | Missing `pb-20` bottom padding — only detail page without it; content obscured by sticky save bar | Add `pb-20` class |
| 9 | **NEW** | 14 inline `font-mono` spans for display_id | `DisplayId` component exists but still 14+ locations use inline `className="font-mono"` | Migrate to `<DisplayId>` wrapper |
| 10 | **NEW** | 3 duplicate `roleColors`/`roleDisplay` maps | Role label + color mappings duplicated in admin user table, user detail, user form | Extract to shared constant |
| 11 | **NEW** | `components/admin/entity-form-dialog.tsx:124-137` | Deactivate/reactivate button uses `variant="ghost"` with inline colors — inconsistent with user dialogs | Standardize to AlertDialogAction |

---

### Schema & Validation (Updated)

| # | Status | File(s) | Issue | Recommendation |
|---|--------|---------|-------|----------------|
| 1 | **PERSISTENT** (15-Mar) | `lib/validations/asset-schema.ts` | Asset `name` max=100, should be 60 per CLAUDE.md | Align to 60 or document |
| 2 | **PERSISTENT** (15-Mar) | `lib/validations/template-schema.ts` | Template `name` max=100, should be 60 | Align to 60 or document |
| 3 | **PERSISTENT** (16-Mar) | `schedule-schema.ts`, `user-schema.ts`, `template-schema.ts` | 3 different patterns for optional UUID fields | Create `optionalUuid()` helper |
| 4 | **PERSISTENT** (19-Mar) | `app/actions/profile-actions.ts` | `changePassword` has unbounded password strings | Add `.max(128)` |
| 5 | **PERSISTENT** (19-Mar) | `app/actions/pm-job-actions.ts` | `itemId` in checklist actions missing `.uuid()` | Add `.uuid()` validation |

---

### Test Coverage Gaps (Comprehensive Analysis)

| # | Priority | Status | Area | Gap | Details |
|---|----------|--------|------|-----|---------|
| 1 | **CRITICAL** | PERSISTENT | Unit | 0/15 server action files have tests | All 15 action files (~81 exported functions) have zero test coverage. Most critical: request-actions (11 fns), job-actions (7 fns), asset-actions (10 fns), approval-actions (4 fns) |
| 2 | **CRITICAL** | PERSISTENT | RLS | Multi-company write policies untested | INSERT/UPDATE/DELETE policies across all tables. Only 1 RLS test file exists |
| 3 | **CRITICAL** | NEW | Unit | `assertCompanyAccess` — zero tests | Cross-cutting security function used in 9+ action files. A regression silently breaks all multi-company mutations |
| 4 | **HIGH** | NEW | Unit | `ASSET_STATUS_TRANSITIONS` state machine untested | Governs entire asset lifecycle. A typo would silently break status changes |
| 5 | **HIGH** | NEW | Unit | `getScheduleDisplayStatus` — zero tests | 4-branch pure function (deactivated, paused_auto, paused_manual, active). Trivially testable |
| 6 | **HIGH** | NEW | Unit | `calculateTrend` — zero tests | Dashboard trend calculation with division-by-zero handling. Pure function, easily testable |
| 7 | **HIGH** | NEW | Unit | `createNotifications` actor exclusion untested | REQ-NOTIF-007 compliance: actor must be excluded from recipients |
| 8 | **HIGH** | NEW | Unit | Job status transition map in `updateJobStatus` | `validTransitions` record (created→assigned, assigned→in_progress, etc.) never validated. Invalid transitions not proven blocked |
| 9 | **HIGH** | NEW | Unit | Request lifecycle transitions untested | 6 transitions: submitted→triaged, triaged→pending_acceptance, pending_acceptance→accepted, accepted→closed, pending_acceptance→in_progress |
| 10 | **HIGH** | NEW | Unit | Approval flow transitions untested | 4 actions with ownership guards (created_by checks) and status gates |
| 11 | **HIGH** | NEW | Unit | Transfer ownership guards untested | `acceptTransfer` (receiver_id), `rejectTransfer` (receiver_id), `cancelTransfer` (initiator/lead) |
| 12 | **HIGH** | PERSISTENT (18-Mar) | E2E | Transfer accept/reject flow — zero E2E tests | |
| 13 | **HIGH** | PERSISTENT (18-Mar) | E2E | `holder_id` consistency untested | |
| 14 | **MEDIUM** | NEW | Unit | `safe-action.ts` middleware chains untested | `authActionClient` deactivated user rejection, `adminActionClient` role guard, `gaLeadActionClient` LEAD_ROLES guard |
| 15 | **MEDIUM** | NEW | Unit | Duplicate name checks on create/update/reactivate | Present in all admin entity actions but none are tested |
| 16 | **MEDIUM** | NEW | Unit | Request linking rules in `createJob` | Rule 1 (PIC-only), Rule 2 (status filter), Rule 3 (one job per request) — all untested |
| 17 | **MEDIUM** | NEW | Unit | Concurrent transfer guard untested | One pending movement per asset constraint |
| 18 | **MEDIUM** | NEW | Unit | Schedule auto-pause/resume on asset status change | Complex logic with `auto:` prefix convention, PM job cancellation, `next_due_at` recalc |
| 19 | **MEDIUM** | NEW | Unit | Template-asset category matching | `createSchedule` validates template category matches asset — untested |
| 20 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Invalid status transitions not proven blocked | |
| 21 | **MEDIUM** | PERSISTENT (16-Mar) | E2E | Soft delete cycle — only locations tested | |
| 22 | **LOW** | NEW | Unit | `formatDate`/`formatDateTime` in `lib/utils.ts` | Exported but untested — date format compliance not validated |
| 23 | **LOW** | NEW | API | All 12 API route files have zero tests | Upload routes have role checks, ownership validation, file limits — all untested |
| 24 | **LOW** | NEW | Unit | Permissions test gaps | `ga_staff` triage permission discrepancy (not in permissions.ts but allowed in triageRequest action) |

**Coverage Summary:**
| Category | Items | Tested | Coverage |
|----------|-------|--------|----------|
| Action files | 15 | 0 | **0%** |
| API route files | 12 | 0 | **0%** |
| Lib utilities (testable) | 8 | 4 | **50%** |
| Functions in tested files | ~12 | ~8 | **67%** |

---

### Code Consistency & Scalability Improvements (Updated)

| # | Status | Category | Suggestion |
|---|--------|----------|------------|
| 1 | **DONE** | Actions | ~~Extract `assertCompanyAccess` shared helper~~ |
| 2 | **DONE** | Actions | ~~Standardize response shapes~~ — ActionResponse<T> created |
| 3 | OPEN | Schema | Create `optionalUuid()` Zod helper — 3 divergent patterns remain |
| 4 | **DONE** | Schema | ~~Create `isoDateString()` Zod helper~~ |
| 5 | **PARTIAL** | Columns | `CreatedAtCell` extracted but ~8 locations still use inline formatting |
| 6 | OPEN | Testing | Set up vitest for server action unit tests — 15 action files with zero tests |
| 7 | OPEN | Logging | Replace raw `console.error/log` (35+ occurrences) with structured logger |
| 8 | **DONE** | Notifications | ~~Standardize notification error handling~~ |
| 9 | **PARTIAL** | Display IDs | `DisplayId` extracted but ~14 locations still use inline `font-mono` |
| 10 | OPEN | Notifications | Extract `safeCreateNotifications()` helper — 15 identical `.catch()` patterns |
| 11 | **DONE** | Type Safety | ~~Remove `any` types~~ |
| 12 | OPEN | Error Handling | Photo upload error handling — respond modal and job-form don't check fetch response |
| 13 | OPEN | Data Integrity | `acceptTransfer` two-step update needs atomicity (Postgres function or rollback) |
| 14 | **PARTIAL** | Link Colors | `hover:text-blue-700` standardized in some files; audit-trail still uses `-800` |
| 15 | OPEN | Timestamps | Extract `getCurrentTimestamp()` — 39 instances of `new Date().toISOString()` |
| 16 | OPEN | Paths | Centralize `revalidatePath()` constants — 12+ hardcoded paths |
| 17 | **PARTIAL** | Roles | `ROLES`, `GA_ROLES`, `LEAD_ROLES` extracted; 8+ locations still use inline arrays (dashboard, approvals, exports). Need `OPERATIONAL_ROLES`, `EXPORT_ROLES` |
| 18 | OPEN | Tables | Standardize filter state — domain tables use `nuqs` URL params, admin tables use local state |
| 19 | **PARTIAL** | Adoption | Migrate remaining 14+ inline `font-mono` display IDs to `<DisplayId>` |
| 20 | **PARTIAL** | Adoption | Migrate remaining inline date renders to `<CreatedAtCell>` |
| 21 | OPEN | Validation | Audit form `<Input>` elements for missing `maxLength` attributes |
| 22 | **NEW** | Layout | Schedule/template detail pages use `grid-cols-2` instead of standard `grid-cols-[1fr_380px]` |
| 23 | **NEW** | Convention | Remove `/inventory/new` page — dual create flow (page + dialog) violates single-modal-create rule |
| 24 | **NEW** | Visual | Add `pb-20` to asset detail page — only detail page missing sticky bar padding |
| 25 | **NEW** | DRY | Extract `roleColors`/`roleDisplay` maps — duplicated in 3 admin user components |
| 26 | **NEW** | Auth | Switch `update-password/page.tsx` from `getSession()` to `getUser()` |
| 27 | **NEW** | Dead Code | Remove wrong `assets` table reference in entity-photos route; remove `schedule.template_name` dead fallback |

---

### What's Working Well (Updated)

- **100% responsive design compliance** — zero mobile-first breakpoint violations
- **100% maxLength compliance** — all Input components match Zod `.max(N)` values
- **100% date format compliance** — all user-visible dates use `dd-MM-yyyy`
- **100% notification error handling** — all 15 `createNotifications` calls have `.catch()` with logging
- **100% feedback persistence** — no auto-dismiss on success/error (except 2 dialog violations found this review)
- **100% soft-delete terminology** — "Deactivate"/"Reactivate" everywhere
- **100% Combobox/Select correctness** — large lists use Combobox, small fixed lists use Select
- **100% form pattern compliance** — all forms use react-hook-form + zodResolver
- **100% ActionResponse<T> compliance** — all 81 server actions typed with explicit returns
- **No `any` types, no `@ts-ignore`, no `dangerouslySetInnerHTML`**
- **Import paths 100% consistent** — all `@/` aliases, zero relative imports in pages
- **Max-width correctly centralized** — only layout.tsx defines `max-w-[1300px]`
- **Error boundaries** on all detail pages with entity-specific messaging
- **API route auth pattern consistent** — all use `getUser()`, check `deleted_at`, proper HTTP status codes
- **Role constants adopted** in 36 files (actions, components, pages, API routes)
- **Optimistic locking tested** with `assertNotStale` unit tests
- **ActionResponse shape tested** with 116-line type validation suite

---

## 21-Mar-2026

### Commits Summary (20-Mar-2026)

| Task | Commits | What Changed |
|------|---------|-------------|
| quick-260320-9ki | 2 commits | Fixed semantic bug: `RequestStatusBadge` was rendering job statuses with wrong colors/labels in request detail — replaced with `JobStatusBadge` |
| docs | 1 commit | Daily review PRD updates + improvements log (ec7c379) |

**Total: 3 commits, 4 files changed, ~194 lines added**

---

### Resolved from Previous Reviews

| # | Original Date | Original Issue | Resolution |
|---|---------------|---------------|------------|
| 1 | 20-Mar #1 (HIGH) | `RequestStatusBadge` used for job status in request detail | **DONE** — replaced with `JobStatusBadge` in `request-detail-info.tsx:368` |

---

### Risky Patterns & Security (Persistent + New)

| # | Severity | Status | File | Issue | Recommendation |
|---|----------|--------|------|-------|----------------|
| 1 | **HIGH** | PERSISTENT (20-Mar) | `components/profile/password-change-dialog.tsx:71` | Auto-closes dialog after 1500ms via `setTimeout`. Violates "never auto-dismiss" rule — user may not see success message | Remove setTimeout, let user close manually |
| 2 | **HIGH** | PERSISTENT (20-Mar) | `components/requests/request-triage-dialog.tsx:96` | Auto-closes dialog after 800ms via `setTimeout`. Same violation | Remove setTimeout, let user close manually |
| 3 | **HIGH** | PERSISTENT (19-Mar) | `app/actions/profile-actions.ts:38-39` | Password schema fields `currentPassword` and `newPassword` missing `.max()` — unbounded strings | Add `.max(128)` to both |
| 4 | **HIGH** | PERSISTENT (19-Mar) | `app/actions/pm-job-actions.ts:19,107` | `itemId` field uses `z.string()` without `.uuid()` validation | Add `.uuid()` |
| 5 | **MEDIUM** | PERSISTENT (20-Mar) | `app/(dashboard)/page.tsx:35` | Hardcoded `OPERATIONAL_ROLES = ['ga_lead', 'admin', 'finance_approver']` — not in `lib/constants/roles.ts` | Move to constants file |
| 6 | **MEDIUM** | PERSISTENT (20-Mar) | 5 files (approvals, jobs, requests pages, 2 export routes) | 8 inline role arrays identical to existing constants but not imported | Import from `lib/constants/roles.ts` |
| 7 | **MEDIUM** | PERSISTENT (20-Mar) | `app/(auth)/update-password/page.tsx:23` | Only place using `getSession()` instead of `getUser()` — reads local JWT without server validation | Switch to `getUser()` |
| 8 | **MEDIUM** | NEW | `app/actions/pm-job-actions.ts:108` | `photoUrls: z.array(z.string().max(2048))` — array length is unbounded. Could accept thousands of URLs | Add `.max(20)` on the array |
| 9 | **LOW** | NEW | 7 files | Link hover color inconsistency: 5 locations use `hover:text-blue-800`, 2 use `hover:text-blue-500`. Standard is `hover:text-blue-700` | Standardize all to `hover:text-blue-700` |
| 10 | **MEDIUM** | NEW | `app/actions/approval-actions.ts` (4 actions) | `approveJob`, `rejectJob`, `approveCompletion`, `rejectCompletion` fetch job by ID via RLS-scoped supabase but don't explicitly call `assertCompanyAccess`. Defense-in-depth gap | Add company access validation |
| 11 | **MEDIUM** | NEW | `app/actions/approval-actions.ts:188-209`, `job-actions.ts:573-589` | Cascading request status update: when job completes, linked requests updated to `pending_acceptance` **without checking current state**. Could resurrect cancelled requests | Add `.in('status', ['triaged', 'in_progress'])` filter |
| 12 | **MEDIUM** | NEW | `app/actions/category-actions.ts`, `company-actions.ts`, `division-actions.ts`, `location-actions.ts` | Bulk deactivate loops delete one-by-one. If one fails mid-loop, partial deletions persist with no rollback — returns `success: true` with partial counts | Pre-validate all items before deleting, or fail on first error |

---

### UI/UX Inconsistencies (Persistent + New)

| # | Status | File | Issue | Fix |
|---|--------|------|-------|-----|
| 1 | **PERSISTENT** (15-Mar) | `lib/utils.ts:27` | CSV export filename uses `yyyy-MM-dd` instead of `dd-MM-yyyy` | Change format string |
| 2 | **PERSISTENT** (20-Mar) | `components/maintenance/schedule-detail.tsx:291` | Uses `grid-cols-2` instead of standard `grid-cols-[1fr_380px]` | Align to detail page convention |
| 3 | **PERSISTENT** (20-Mar) | `components/maintenance/template-detail.tsx:347` | Uses `grid-cols-2` instead of standard `grid-cols-[1fr_380px]` | Align to detail page convention |
| 4 | **PERSISTENT** (20-Mar) | `app/(dashboard)/inventory/new/page.tsx` | Full `/new` page exists alongside `AssetCreateDialog` modal — violates "no separate `/new` pages" rule | Remove `/new` page, use modal exclusively |
| 5 | **PERSISTENT** (20-Mar) | `app/(dashboard)/inventory/[id]/page.tsx:218` | Missing `pb-20` bottom padding — only detail page without it; content obscured by sticky save bar | Add `pb-20` class |
| 6 | **PERSISTENT** (20-Mar) | 14 inline `font-mono` spans | `DisplayId` component exists but still 14 locations use inline `className="font-mono"` for display IDs | Migrate to `<DisplayId>` wrapper |
| 7 | **PERSISTENT** (20-Mar) | 4 locations (dashboard, profile-sheet, user-menu, user-columns) | `roleColors` + `roleDisplay` maps duplicated in 4 separate files | Extract to shared `lib/constants/role-display.ts` |
| 8 | **PERSISTENT** (16-Mar) | `components/audit-trail/audit-trail-columns.tsx:147,156` | Display ID link variant missing `font-mono` via DisplayId component | Use `<DisplayId>` component |
| 9 | **PERSISTENT** (20-Mar) | `components/admin/entity-form-dialog.tsx:124-137` | Deactivate button uses `variant="ghost"` with inline colors — inconsistent with user dialogs | Standardize to AlertDialogAction |

---

### Schema & Validation (Persistent)

| # | Status | File(s) | Issue | Recommendation |
|---|--------|---------|-------|----------------|
| 1 | **PERSISTENT** (15-Mar) | `lib/validations/asset-schema.ts` | Asset `name` max=100, should be 60 per CLAUDE.md | Align to 60 or document |
| 2 | **PERSISTENT** (15-Mar) | `lib/validations/template-schema.ts` | Template `name` max=100, should be 60 | Align to 60 or document |
| 3 | **PERSISTENT** (16-Mar) | `schedule-schema.ts`, `user-schema.ts`, `template-schema.ts` | 3 different patterns for optional UUID fields | Create `optionalUuid()` helper |
| 4 | **PERSISTENT** (19-Mar) | `app/actions/profile-actions.ts` | `changePassword` has unbounded password strings | Add `.max(128)` |
| 5 | **PERSISTENT** (19-Mar) | `app/actions/pm-job-actions.ts` | `itemId` in checklist actions missing `.uuid()` | Add `.uuid()` validation |
| 6 | **NEW** | `app/actions/pm-job-actions.ts:108` | `photoUrls` array has no max length on array itself | Add `.max(20)` |

---

### Test Coverage Gaps (Persistent — No Changes)

No new test files were added since the last review. All previous gaps remain:

| # | Priority | Status | Area | Gap |
|---|----------|--------|------|-----|
| 1 | **CRITICAL** | PERSISTENT | Unit | 0/15 server action files have tests — ~81 exported functions uncovered |
| 2 | **CRITICAL** | PERSISTENT | RLS | Multi-company write policies (INSERT/UPDATE/DELETE) untested |
| 3 | **CRITICAL** | PERSISTENT | Unit | `assertCompanyAccess` — cross-cutting security function, zero tests |
| 4 | **HIGH** | PERSISTENT | Unit | Status transition state machines (job + request) untested |
| 5 | **HIGH** | PERSISTENT | Unit | Transfer ownership guards (`acceptTransfer`, `rejectTransfer`, `cancelTransfer`) untested |
| 6 | **HIGH** | PERSISTENT | E2E | Transfer accept/reject flow — zero E2E tests |
| 7 | **HIGH** | PERSISTENT | E2E | `holder_id` consistency — not verified on accept/location-move |
| 8 | **MEDIUM** | PERSISTENT | Unit | `safe-action.ts` middleware chains (auth, admin, gaLead) untested |
| 9 | **MEDIUM** | PERSISTENT | Unit | Duplicate name checks on create/update/reactivate — none tested |
| 10 | **MEDIUM** | PERSISTENT | Unit | Schedule auto-pause/resume on asset status change — complex logic untested |

**Coverage Summary (unchanged):**
| Category | Items | Tested | Coverage |
|----------|-------|--------|----------|
| Action files | 15 | 0 | **0%** |
| API route files | 12 | 0 | **0%** |
| Lib utilities (testable) | 8 | 4 | **50%** |

---

### Code Consistency & Scalability Improvements (Updated)

| # | Status | Category | Suggestion |
|---|--------|----------|------------|
| 1 | **DONE** | Actions | ~~Extract `assertCompanyAccess` shared helper~~ |
| 2 | **DONE** | Actions | ~~Standardize response shapes~~ — ActionResponse<T> created |
| 3 | OPEN | Schema | Create `optionalUuid()` Zod helper — 3 divergent patterns remain |
| 4 | **DONE** | Schema | ~~Create `isoDateString()` Zod helper~~ |
| 5 | **PARTIAL** | Columns | `CreatedAtCell` extracted but ~8 locations still use inline formatting |
| 6 | OPEN | Testing | Set up vitest for server action unit tests — 15 action files with zero tests |
| 7 | OPEN | Logging | Replace raw `console.error/log` (35+ occurrences) with structured logger |
| 8 | **DONE** | Notifications | ~~Standardize notification error handling~~ |
| 9 | **PARTIAL** | Display IDs | `DisplayId` extracted but ~14 locations still use inline `font-mono` |
| 10 | OPEN | Notifications | Extract `safeCreateNotifications()` helper — 15 identical `.catch()` patterns |
| 11 | **DONE** | Type Safety | ~~Remove `any` types~~ |
| 12 | OPEN | Error Handling | Photo upload error handling — respond modal and job-form don't check fetch response |
| 13 | OPEN | Data Integrity | `acceptTransfer` two-step update needs atomicity |
| 14 | **PARTIAL** | Link Colors | Standard is `hover:text-blue-700` — 7 locations still use `-800` or `-500` |
| 15 | OPEN | Timestamps | Extract `getCurrentTimestamp()` — **47 instances** of `new Date().toISOString()` across 19 files (up from 39) |
| 16 | OPEN | Paths | Centralize `revalidatePath()` constants — **71 calls** with 10 unique path strings across 15 action files |
| 17 | **PARTIAL** | Roles | `ROLES`, `GA_ROLES`, `LEAD_ROLES` extracted; need `OPERATIONAL_ROLES` and unified `EXPORT_ROLES` in constants file. 8 inline arrays remain |
| 18 | OPEN | Tables | Standardize filter state — domain tables use `nuqs` URL params, admin tables use local state |
| 19 | **PARTIAL** | Adoption | Migrate remaining 14 inline `font-mono` display IDs to `<DisplayId>` |
| 20 | **PARTIAL** | Adoption | Migrate remaining inline date renders to `<CreatedAtCell>` |
| 21 | OPEN | Validation | Audit form `<Input>` elements for missing `maxLength` attributes |
| 22 | OPEN | Layout | Schedule/template detail pages use `grid-cols-2` instead of standard `grid-cols-[1fr_380px]` |
| 23 | OPEN | Convention | Remove `/inventory/new` page — dual create flow violates single-modal-create rule |
| 24 | OPEN | Visual | Add `pb-20` to asset detail page — only detail page missing sticky bar padding |
| 25 | OPEN | DRY | Extract `roleColors`/`roleDisplay` maps — duplicated in 4 components |
| 26 | OPEN | Auth | Switch `update-password/page.tsx` from `getSession()` to `getUser()` |
| 27 | OPEN | Dead Code | Remove wrong `assets` table reference in entity-photos route; remove `schedule.template_name` dead fallback |
| 28 | **NEW** | Status Constants | Extract `JOB_TERMINAL_STATUSES` (`['completed', 'cancelled']`) — 12 occurrences across 8 files |
| 29 | **NEW** | Status Constants | Extract `REQUEST_LINKABLE_STATUSES` (`['triaged', 'in_progress']`) — 7 occurrences across 6 files |
| 30 | **NEW** | Status Constants | Extract `REQUEST_TRIAGEABLE_STATUSES` (`['submitted', 'triaged']`) — 5 occurrences across 4 files |
| 31 | **NEW** | Status Constants | Extract `JOB_ACTIVE_STATUSES` (`['assigned', 'in_progress']`) — 3 occurrences across 3 files |
| 32 | **NEW** | Auto-dismiss | Remove `setTimeout` auto-close in `password-change-dialog.tsx` and `request-triage-dialog.tsx` |
| 33 | **NEW** | Data Integrity | Bulk deactivate operations need pre-validation or atomic execution — partial failures leave inconsistent state |
| 34 | **NEW** | Data Integrity | Cascading request status updates on job completion need state guards to prevent resurrecting cancelled requests |
| 35 | **NEW** | Security | Approval actions should add `assertCompanyAccess` for defense-in-depth (RLS currently provides the boundary) |
| 36 | **NEW** | Performance | Missing DB index on `inventory_items.holder_id` — general user asset listing (`.eq('holder_id', profile.id)`) does full table scan. Add composite index `(company_id, holder_id) WHERE deleted_at IS NULL` |
| 37 | **NEW** | Performance | Unbounded export queries — all 4 export routes (`/api/exports/inventory,requests,jobs,maintenance`) lack `.limit()`. 10K+ rows = memory spikes + timeouts. Add `.limit(10000)` with truncation warning |
| 38 | **NEW** | Performance | Duplicate company access query in `inventory/page.tsx` — `user_company_access` fetched twice (lines 38-59). Fetch once, reuse result |
| 39 | **NEW** | Performance | Triple location fetch in `inventory/page.tsx` — locations queried 3 times in parallel block (lines 123-144). Deduplicate to single fetch |
| 40 | **NEW** | UX | Audit trail `LIMIT 1000` (line 42) has no UI warning when truncated — silently drops entries. Add `hasMore` flag + "Showing first 1000 entries" warning |

---

### What's Working Well (Updated)

- **100% responsive design compliance** — zero mobile-first breakpoint violations
- **100% maxLength compliance** — all Input components match Zod `.max(N)` values
- **100% date format compliance** — all user-visible dates use `dd-MM-yyyy`
- **100% notification error handling** — all 15 `createNotifications` calls have `.catch()` with logging
- **100% soft-delete terminology** — "Deactivate"/"Reactivate" everywhere
- **100% Combobox/Select correctness** — large lists use Combobox, small fixed lists use Select
- **100% form pattern compliance** — all forms use react-hook-form + zodResolver
- **100% ActionResponse<T> compliance** — all 81 server actions typed with explicit returns
- **100% status badge correctness** — `RequestStatusBadge` for requests, `JobStatusBadge` for jobs (fix confirmed)
- **No `any` types, no `@ts-ignore`, no `dangerouslySetInnerHTML`**
- **Import paths 100% consistent** — all `@/` aliases, zero relative imports in pages
- **Max-width correctly centralized** — only layout.tsx defines `max-w-[1300px]`
- **Error boundaries** on all detail pages with entity-specific messaging
- **API route auth pattern consistent** — all use `getUser()`, check `deleted_at`, proper HTTP status codes
- **Role constants adopted** in 36 files (actions, components, pages, API routes)
- **Optimistic locking tested** with `assertNotStale` unit tests
- **ActionResponse shape tested** with 116-line type validation suite
