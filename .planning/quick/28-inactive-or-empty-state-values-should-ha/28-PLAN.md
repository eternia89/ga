---
phase: quick-28
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - components/admin/companies/company-columns.tsx
  - components/admin/divisions/division-columns.tsx
  - components/admin/locations/location-columns.tsx
  - components/admin/categories/category-columns.tsx
  - components/admin/users/user-columns.tsx
  - components/jobs/job-columns.tsx
autonomous: true
requirements: [QUICK-28]

must_haves:
  truths:
    - "Empty/null cell values render with muted text color (text-muted-foreground) across all table views"
    - "Empty values use em dash character consistently, not plain hyphen"
    - "Existing muted styling in domain tables (requests, assets, schedules, templates) is preserved"
  artifacts:
    - path: "components/admin/companies/company-columns.tsx"
      provides: "Muted empty state for code, email, phone columns"
    - path: "components/admin/divisions/division-columns.tsx"
      provides: "Muted empty state for code, company, description columns"
    - path: "components/admin/locations/location-columns.tsx"
      provides: "Muted empty state for address, company columns"
    - path: "components/admin/categories/category-columns.tsx"
      provides: "Muted empty state for description column"
    - path: "components/admin/users/user-columns.tsx"
      provides: "Muted empty state for location column"
    - path: "components/jobs/job-columns.tsx"
      provides: "Muted styling on Unassigned PIC text"
  key_links: []
---

<objective>
Standardize empty/null/inactive cell rendering across all table views to use `text-muted-foreground` styling with em dash character.

Purpose: Users should be able to visually distinguish at a glance between cells with data and cells that are empty/not set. Currently, domain tables (requests, assets, schedules, templates) correctly use `<span className="text-muted-foreground">...</span>` for empty values, but admin tables (companies, divisions, locations, categories) and user-columns use plain `-` without muted styling.

Output: All 11 column definition files use consistent muted styling for empty/null values.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md

The codebase has 11 `*-columns.tsx` files defining TanStack Table columns. The correct pattern is already established in domain tables:

```tsx
// CORRECT pattern (used in request-columns, asset-columns, schedule-columns, template-columns):
return name ? (
  <span className="truncate block max-w-[130px]" title={name}>{name}</span>
) : (
  <span className="text-muted-foreground">—</span>  // em dash, muted
);
```

Files that ALREADY use the correct pattern (DO NOT MODIFY):
- `components/requests/request-columns.tsx` — location, PIC columns
- `components/assets/asset-columns.tsx` — category, location, warranty columns
- `components/maintenance/schedule-columns.tsx` — template, asset, next due, last completed columns
- `components/maintenance/template-columns.tsx` — category column
- `components/audit-trail/audit-trail-columns.tsx` — no empty states to fix

Files that need fixing:
1. `components/admin/companies/company-columns.tsx` — code (`|| "-"`), email (`|| "-"`), phone (`|| "-"`)
2. `components/admin/divisions/division-columns.tsx` — code (`|| "-"`), company (`|| "-"`), description (`"-"`)
3. `components/admin/locations/location-columns.tsx` — address (`"-"`), company (`|| "-"`)
4. `components/admin/categories/category-columns.tsx` — description (`"-"`)
5. `components/admin/users/user-columns.tsx` — location uses `'\u2014'` without `text-muted-foreground`; company uses `'—'` without muted
6. `components/jobs/job-columns.tsx` — PIC "Unassigned" text already uses `text-muted-foreground` (good), but should verify
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix admin settings table columns (companies, divisions, locations, categories)</name>
  <files>
    components/admin/companies/company-columns.tsx
    components/admin/divisions/division-columns.tsx
    components/admin/locations/location-columns.tsx
    components/admin/categories/category-columns.tsx
  </files>
  <action>
Replace all plain `-` or `|| "-"` empty value renderings with the muted em dash pattern.

**company-columns.tsx:**
- Code column (line 44): Change `row.getValue("code") || "-"` to a ternary that renders `<span className="text-muted-foreground">—</span>` when falsy
- Email column (line 49): Same pattern
- Phone column (line 54): Same pattern

**division-columns.tsx:**
- Code column (line 44): Change `row.getValue("code") || "-"` to muted em dash span
- Company column (line 54): Change `division.company?.name || "-"` to muted em dash span
- Description column (line 62-69): The falsy branch returns plain `"-"` — change to `<span className="text-muted-foreground">—</span>`

**location-columns.tsx:**
- Address column (line 48-54): The falsy branch returns plain `"-"` — change to `<span className="text-muted-foreground">—</span>`
- Company column (line 63): Change `location.company?.name || "-"` to muted em dash span

**category-columns.tsx:**
- Description column (line 48-53): The falsy branch returns plain `"-"` — change to `<span className="text-muted-foreground">—</span>`

For inline cells (code, email, phone, company) that currently use `|| "-"`, convert to:
```tsx
cell: ({ row }) => {
  const value = row.getValue("field") as string | null;
  return value ? <span>{value}</span> : <span className="text-muted-foreground">—</span>;
},
```
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>All 4 admin column files use `<span className="text-muted-foreground">—</span>` for empty/null values. No plain `-` or `|| "-"` patterns remain.</done>
</task>

<task type="auto">
  <name>Task 2: Fix user-columns and verify job-columns muted styling</name>
  <files>
    components/admin/users/user-columns.tsx
    components/jobs/job-columns.tsx
  </files>
  <action>
**user-columns.tsx:**
- Location column (line 91): Currently `return <span>{location?.name || '\u2014'}</span>` — change to: `return location?.name ? <span>{location.name}</span> : <span className="text-muted-foreground">—</span>;`
- Company column (line 119): Currently `return <span>{company?.name || '—'}</span>` — change to: `return company?.name ? <span>{company.name}</span> : <span className="text-muted-foreground">—</span>;`

**job-columns.tsx:**
- PIC column (line 72): Already renders `<span className="text-muted-foreground">Unassigned</span>` — this is correct, no change needed.
- Linked Requests column (line 89): Already renders `<span className="text-muted-foreground">—</span>` — correct, no change needed.

After all changes, run a global search to confirm no remaining `|| "-"` or `|| '-'` patterns exist in any `*-columns.tsx` file.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit --pretty 2>&1 | head -30 && echo "---CHECK FOR PLAIN HYPHENS---" && grep -rn '|| ["\x27]-["\x27]' components/**/*-columns.tsx components/**/columns.tsx 2>/dev/null; echo "Search done (no output = clean)"</automated>
  </verify>
  <done>All column files use consistent muted styling for empty values. grep for `|| "-"` and `|| '-'` in column files returns zero matches.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles without errors: `npx tsc --noEmit`
2. No plain hyphen fallbacks remain: `grep -rn '|| ["\x27]-["\x27]' components/**/*-columns.tsx` returns empty
3. Lint passes: `npm run lint`
</verification>

<success_criteria>
- All 11 column files use `text-muted-foreground` class on empty/null value spans
- Empty values consistently display em dash character, not plain hyphen
- TypeScript and lint pass cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/28-inactive-or-empty-state-values-should-ha/28-SUMMARY.md`
</output>
