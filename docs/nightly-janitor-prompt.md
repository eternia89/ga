# Nightly Janitor — Scheduled Task Prompt

You are maintaining the GA app at `code/ga`. Read `CLAUDE.md` first — it defines all conventions.

Run this checklist. For each item: if the fix is **mechanical** (two developers would do the identical thing), apply and commit. If it **requires judgment**, append to `docs/needs-review.md` using the format described below.

## How to write needs-review entries

Use this exact format for every item you log. The user is a **frontend developer** — explain backend concepts in plain language.

```markdown
## [DATE] CATEGORY — Short plain-English title

**What:** One sentence describing the problem as if explaining to a teammate who hasn't seen the code today.
**Where:** `file/path.tsx:123`, `other/file.ts:45`
**Why it matters:** One sentence on what could go wrong if this stays unfixed.
**Backend ELI5:** (Only include if the issue involves backend concepts like RLS, migrations, policies, indexes, etc. Explain what the backend thing does in frontend terms — e.g., "RLS policies are like route guards but enforced by the database itself, so even if the UI forgets to filter, the DB won't return unauthorized rows.")

**Suggested fixes:**
- [ ] Option A — description of what this fix does and its trade-off
- [ ] Option B — alternative approach and its trade-off
- [ ] Skip — not worth fixing right now because [reason]
```

Always provide at least 2 fix options plus a Skip option. Each option must explain *what* it does and *why* you'd pick it over the other.

---

## CHECKLIST

### 1. LINT
Run `npm run lint`. Auto-fix what ESLint can. Commit separately with `chore: lint auto-fix`.

### 2. BUILD
Run `npm run build`. If it fails:
- Diagnose and fix **type errors or import issues** (mechanical fixes only).
- Do NOT change business logic to fix a build — log to needs-review.md with suggested fixes instead.

### 3. DRY — DATE FORMATTING
Find all raw `format(new Date(...), 'dd-MM-yyyy')` and `format(new Date(...), 'dd-MM-yyyy, HH:mm:ss')` calls in `components/` and `app/`. Replace with `formatDate()` or `formatDateTime()` from `@/lib/utils`. These utilities already exist.

### 4. DRY — PATTERN SCAN
Find duplicated logic blocks (>10 lines identical or near-identical across 2+ files). Log to needs-review.md with file paths and line numbers. Include suggested extractions. Do NOT refactor — just report.

### 5. UNUSED CODE
- **Unused imports:** Remove them directly (mechanical). Commit as `chore: remove unused imports`.
- **Unreachable code & dead exports:** Log to needs-review.md. Suggest whether to remove or keep (it might be used externally).

### 6. SECURITY SCAN
Search for:
- Hardcoded secrets or API keys in source files (not `.env`)
- `dangerouslySetInnerHTML` usage without sanitization
- Supabase `.rpc()` calls with string interpolation instead of parameterized arguments
- Missing input validation at API boundaries (server actions accepting unvalidated input)

Log ALL findings to needs-review.md. Never auto-fix security issues — always require human sign-off.

**Backend ELI5 for the entry:** Explain what each vulnerability means in terms the user would understand. E.g., "String interpolation in a database call is like building a URL by concatenating user input — an attacker could inject extra commands. Parameterized queries are like using template variables that the database treats as data, never as commands."

### 7. DEAD ROUTES & BROKEN LINKS
Check that every `<Link href="...">` and `router.push(...)` points to an existing page in `app/`. Also check `redirect()` calls in server actions. Log broken internal links to needs-review.md with the source file and the dead target.

### 8. CONVENTION DRIFT — RECENT COMMITS
Check files changed in the last 24 hours (`git log --since="24 hours ago" --name-only`). For each changed file, verify it follows CLAUDE.md rules:
- Date format uses `dd-MM-yyyy` (not `MMM d, yyyy` or similar)
- Responsive breakpoints use `max-*` (not `sm:`, `md:`, `lg:`)
- Display IDs use `font-mono`
- Feedback messages use `InlineFeedback` (not auto-dismissing toasts)

Auto-fix mechanical violations (wrong date format, wrong breakpoint prefix). Log judgment calls to needs-review.md.

### 9. UI CONVENTIONS SPOT-CHECK
Pick 5 random component files and check against CLAUDE.md UI Conventions:
- Display IDs use `font-mono`
- Dropdowns with many options use Combobox not Select
- Feedback messages are persistent (not auto-dismissed)
- Forms use react-hook-form + zod (not raw useState)
- Detail pages are edit pages (no separate view/edit modes)

Log violations to needs-review.md with suggested fixes.

### 10. DEPENDENCY PATCHES
Run `npm outdated`. For **patch-level only** updates (where CURRENT differs from WANTED):
1. Run `npm update`
2. Run `npm run lint && npm run build && npm test`
3. If ANY of those fail, revert: `git checkout package.json package-lock.json && npm install`
4. If all pass, commit as `chore: patch-level dependency updates`

### 11. ACCESSIBILITY
- `<img>` without `alt` → fix decorative images with `alt=""` (mechanical). Log meaningful images that need real alt text to needs-review.md.
- `<button>` without accessible label → log to needs-review.md.
- Clickable `<div>` without `role="button"` → log to needs-review.md with suggested fix.

### 12. TEST GAPS (report only)
Compare files in `app/actions/` and `lib/validations/` against `__tests__/`. For any validation schema without a test file, log to needs-review.md with the schema name, file path, and what the test should cover. Do NOT auto-generate test files during nightly runs — the user will approve these via `/do-needs-review`.

### 13. RLS POLICY DRIFT
Compare roles referenced in `supabase/migrations/` RLS policies against the role values used in the app code. Flag any mismatch to needs-review.md.

**Backend ELI5 for the entry:** "RLS (Row-Level Security) policies are like invisible `if` statements that run inside the database. When your React component calls Supabase, these policies automatically filter which rows come back based on the logged-in user's role. If the app code uses a role name that doesn't match what's in the policy, that role silently gets zero results — like a route guard that blocks everyone because the role name is misspelled."

### 14. GIT HYGIENE (report only)
List local branches that are already merged into main. Log to needs-review.md for manual cleanup. Do NOT delete branches automatically.

---

## AFTER ALL STEPS

### Maintenance log

Append a dated entry to `docs/maintenance-log.md` using this format:

```markdown
## [DATE] Nightly Janitor

[2-4 sentences summarizing what happened tonight, written like a teammate's Slack message. Lead with what was fixed, mention what was flagged for review, note if anything unusual came up. No jargon.]

**Fixed:** [count] items across [count] commits
**Flagged for review:** [count] new items in needs-review.md
**Tests:** all passing / N failing (details)
**Build:** clean / broken (details)
```

Example tone:
> Cleaned up 12 unused imports across the asset and job components, patched 3 minor dependency updates, and fixed a couple of date formats that slipped through in yesterday's commits. Flagged 2 things for review — there's a duplicated validation block in the request forms that could probably be shared, and a Supabase RPC call that uses string concatenation instead of parameters. Build and tests are green.

### Commits

Each fix category gets its own git commit with a descriptive message:
- Prefix: `chore:` for cleanup, `fix:` for corrections
- Example: `chore: remove 12 unused imports across asset components`
- Example: `fix: replace raw date format() calls with formatDate() utility`

### Hard rules

- Do NOT create new features
- Do NOT change UX flows
- Do NOT modify business logic
- Do NOT alter database schemas or migrations
- Do NOT push to remote — commits stay local for morning review
