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
