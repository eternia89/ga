---
phase: quick-60
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/category-actions.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Creating a request category with a name already used by an active request category in the same company is blocked with a clear error"
    - "Creating an asset category with a name already used by an active asset category in the same company is blocked with a clear error"
    - "Updating a category to a name already used by another active category of the same type in the same company is blocked"
    - "Reactivating a category whose name conflicts with an existing active category of the same type in the same company is blocked"
    - "Company name uniqueness checks remain intact (already implemented — no change needed)"
  artifacts:
    - path: "app/actions/category-actions.ts"
      provides: "Company-scoped duplicate name checks on create, update, restore"
      contains: ".eq(\"company_id\","
  key_links:
    - from: "createCategory"
      to: "categories table"
      via: "duplicate check with company_id + name ilike + type + deleted_at is null"
      pattern: "company_id.*ilike.*type.*deleted_at"
---

<objective>
Enforce company-scoped uniqueness for request and asset categories. The duplicate name check currently operates globally (name+type across all companies). This task narrows the scope so uniqueness is enforced per company: two companies may use the same category name, but one company cannot have two active categories with the same name and type.

Company name uniqueness (global) is already fully implemented in company-actions.ts and requires no changes.

Purpose: Prevent accidental name collisions within a company's category list while allowing different companies to share names.
Output: Updated category-actions.ts with company-scoped duplicate checks on create, update, and restore.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@app/actions/category-actions.ts

Decision [03-02]: Categories are GLOBAL for display/selection purposes — all SELECT queries fetch all categories without company filter. However, company_id IS stored on each category row (auto-filled from admin profile at creation). This task adds company_id scoping only to the duplicate-name guard queries, not to any data-fetch queries.

Note: company-actions.ts already has complete duplicate checks (create, update, restore). No changes needed there.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add company-scoped duplicate name checks to category actions</name>
  <files>app/actions/category-actions.ts</files>
  <action>
Modify the three duplicate-check queries in category-actions.ts to add `.eq("company_id", ...)` so uniqueness is enforced within a company, not globally.

Specific changes:

1. **createCategory** — Duplicate check already uses `ilike("name", ...) + eq("type", ...) + is("deleted_at", null)`. Add `.eq("company_id", profile.company_id)` to narrow scope to admin's company. The `profile.company_id` is already available in `ctx`.

2. **updateCategory** — Duplicate check fetches current category type first, then checks for conflicts. Add `.eq("company_id", ...)` to that second query. The company_id must be fetched from the first query: change `select("type")` to `select("type, company_id")` and then use `current.company_id` in the duplicate check.

3. **restoreCategory** — Duplicate check uses `category.name + category.type`. Add `.eq("company_id", ...)` by changing `select("name, type")` to `select("name, type, company_id")` and then use `category.company_id` in the conflict check.

Error messages remain unchanged (they already show category type and name, which is sufficient context).

Do NOT change any data-fetch queries, the insert logic, or company-actions.ts.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - createCategory duplicate check includes .eq("company_id", profile.company_id)
    - updateCategory duplicate check includes .eq("company_id", current.company_id) after fetching company_id alongside type
    - restoreCategory duplicate check includes .eq("company_id", category.company_id) after fetching company_id alongside name and type
    - Build passes with no TypeScript errors
  </done>
</task>

</tasks>

<verification>
Manual smoke test in /admin/settings Categories tab:
1. Create a request category named "Test Cat" for Company A — succeeds
2. Try to create another request category named "Test Cat" for Company A — blocked with error
3. Try to create a request category named "Test Cat" for Company B — succeeds (different company)
4. Update an existing category to a name already used by another category of the same type in same company — blocked
</verification>

<success_criteria>
- Company-scoped uniqueness enforced on all three write paths (create, update, restore)
- No global uniqueness regression (same-name across different companies still allowed)
- Build passes
</success_criteria>

<output>
No SUMMARY.md needed for quick tasks. Update STATE.md quick tasks table with task 67 entry.
</output>
