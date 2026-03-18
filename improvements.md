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
