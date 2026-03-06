---
phase: quick-14
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  # Audit findings scratch file
  - .planning/quick/14-find-any-inconsistencies-in-ui-and-ux-im/AUDIT-FINDINGS.md
  # Page layout fixes
  - app/(dashboard)/page.tsx
  - app/(dashboard)/admin/settings/page.tsx
  # Missing loading.tsx files (skeleton loading states)
  - app/(dashboard)/jobs/loading.tsx
  - app/(dashboard)/jobs/[id]/loading.tsx
  - app/(dashboard)/jobs/new/loading.tsx
  - app/(dashboard)/inventory/loading.tsx
  - app/(dashboard)/inventory/[id]/loading.tsx
  - app/(dashboard)/inventory/new/loading.tsx
  - app/(dashboard)/maintenance/loading.tsx
  - app/(dashboard)/maintenance/templates/loading.tsx
  - app/(dashboard)/maintenance/templates/[id]/loading.tsx
  - app/(dashboard)/maintenance/templates/new/loading.tsx
  - app/(dashboard)/maintenance/schedules/[id]/loading.tsx
  - app/(dashboard)/maintenance/schedules/new/loading.tsx
  - app/(dashboard)/approvals/loading.tsx
  - app/(dashboard)/notifications/loading.tsx
  - app/(dashboard)/admin/company-settings/loading.tsx
  # Skeleton components
  - components/skeletons/list-skeleton.tsx
  - components/skeletons/detail-skeleton.tsx
  - components/skeletons/form-skeleton.tsx
  # Any other files identified during audit
autonomous: true
requirements: [QUICK-14]

must_haves:
  truths:
    - "Every dashboard route has a loading.tsx skeleton that renders while server data loads"
    - "All list pages use identical page header pattern: space-y-6 py-6 wrapper, h1 text-2xl font-bold tracking-tight"
    - "All detail pages use identical page header pattern: space-y-6 py-6 wrapper, h1 text-2xl font-bold tracking-tight"
    - "Empty states, feedback patterns, and interaction patterns are consistent across all pages"
    - "No inconsistencies remain between pages in spacing, typography, button placement, or form patterns"
  artifacts:
    - path: ".planning/quick/14-find-any-inconsistencies-in-ui-and-ux-im/AUDIT-FINDINGS.md"
      provides: "Complete audit findings document with all issues and fix status"
    - path: "components/skeletons/list-skeleton.tsx"
      provides: "Reusable generic list page skeleton for routes without custom skeletons"
    - path: "components/skeletons/detail-skeleton.tsx"
      provides: "Reusable generic detail page skeleton"
    - path: "components/skeletons/form-skeleton.tsx"
      provides: "Reusable generic form/new-entity page skeleton"
  key_links:
    - from: "app/(dashboard)/*/loading.tsx"
      to: "components/skeletons/*.tsx"
      via: "import and render skeleton component"
      pattern: "import.*Skeleton.*from.*components/skeletons"
---

<objective>
Audit all pages in the application for UI/UX inconsistencies, then fix every issue found in a single pass.

Purpose: Ensure visual and interaction consistency across every page — spacing, typography, loading states, feedback patterns, empty states, button placement, form patterns, and all CLAUDE.md conventions.

Output: AUDIT-FINDINGS.md documenting all issues found and their resolutions, plus all fixed files across the codebase.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@.planning/quick/14-find-any-inconsistencies-in-ui-and-ux-im/14-CONTEXT.md

Key patterns already established in the codebase (executor should match these):
- Dashboard layout: `app/(dashboard)/layout.tsx` — p-6 padding, max-w-[1300px] wrapper
- Standard page wrapper: `<div className="space-y-6 py-6">` with `<h1 className="text-2xl font-bold tracking-tight">`
- Loading pattern: `loading.tsx` imports a skeleton from `components/skeletons/` and renders it
- Existing skeletons: `dashboard-skeleton.tsx`, `request-list-skeleton.tsx`, `request-detail-skeleton.tsx`, `request-new-skeleton.tsx`, `settings-skeleton.tsx`, `users-skeleton.tsx`
- Feedback: `InlineFeedback` component with manual dismiss (no auto-dismiss timers)
- Combobox for long lists, Select for short fixed lists
- Desktop-first responsive: `max-*` breakpoints only
- Date format: `dd-MM-yyyy` everywhere
- Currency: IDR with `formatIDR` from `lib/utils.ts`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Comprehensive UI/UX audit across all pages</name>
  <files>
    .planning/quick/14-find-any-inconsistencies-in-ui-and-ux-im/AUDIT-FINDINGS.md
  </files>
  <action>
Systematically audit EVERY page and component in the application. For each page, read the full source and check against these criteria. Record ALL findings in AUDIT-FINDINGS.md organized by category.

**Audit checklist (check every page against each item):**

**A. Page Layout Consistency**
- Wrapper: Must use `<div className="space-y-6 py-6">` (not space-y-4, not missing py-6)
- Title: `<h1 className="text-2xl font-bold tracking-tight">` (not text-foreground, not missing tracking-tight)
- Exception: Dashboard page may have slightly different header due to date filter — but wrapper should still be consistent

**B. Loading States**
- Every `app/(dashboard)/*/page.tsx` route must have a sibling `loading.tsx`
- Pages currently MISSING loading.tsx (confirmed): jobs, jobs/[id], jobs/new, inventory, inventory/[id], inventory/new, maintenance, maintenance/templates, maintenance/templates/[id], maintenance/templates/new, maintenance/schedules/[id], maintenance/schedules/new, approvals, notifications, company-settings
- Auth pages and simple redirects (admin/users) do NOT need loading.tsx

**C. Empty States**
- Check all table/list components for empty state rendering
- Should show a consistent message pattern (not just blank space or raw "No data")
- Check: request-table, job-table, asset-table, template-list, schedule-list, approval-queue, audit-trail-table, notification-center

**D. Form Patterns**
- All text inputs must have `maxLength` prop matching Zod schema `.max(N)`
- Check create/edit forms: request-submit-form, request-edit-form, job-form, asset-submit-form, asset-edit-form, entity-form-dialog, template-create-form, template-detail, schedule-form, company-settings-form, user-table (create/edit dialogs)

**E. Button Placement and Styling**
- CTA buttons (Create/Export) should be in page header area
- Form submit buttons should be consistently positioned
- Cancel/Back buttons should be consistent

**F. Feedback Patterns**
- All forms using InlineFeedback should NOT have auto-dismiss (no setTimeout)
- Check for any remaining toast usage that should be InlineFeedback

**G. CLAUDE.md Convention Compliance**
- Date formats: grep for any non-`dd-MM-yyyy` date formatting
- Currency: grep for any non-IDR formatting
- Responsive: grep for any mobile-first breakpoints (sm:, md:, lg: without max- prefix)
- Combobox vs Select: verify long lists use Combobox

**H. Typography and Color Consistency**
- Section headers within pages (h2, h3) should use consistent sizing
- Muted text should consistently use `text-muted-foreground`
- Badge colors should be consistent for same status values

**I. Interaction Patterns**
- View modals should be consistent across entity types
- Detail pages should allow inline editing consistently
- Delete/deactivate confirmations should be consistent

**Pages to audit (read EVERY one):**
1. `app/(dashboard)/page.tsx` (dashboard)
2. `app/(dashboard)/requests/page.tsx` (request list)
3. `app/(dashboard)/requests/[id]/page.tsx` (request detail)
4. `app/(dashboard)/requests/new/page.tsx` (new request)
5. `app/(dashboard)/jobs/page.tsx` (job list)
6. `app/(dashboard)/jobs/[id]/page.tsx` (job detail)
7. `app/(dashboard)/jobs/new/page.tsx` (new job)
8. `app/(dashboard)/inventory/page.tsx` (inventory list)
9. `app/(dashboard)/inventory/[id]/page.tsx` (asset detail)
10. `app/(dashboard)/inventory/new/page.tsx` (new asset)
11. `app/(dashboard)/maintenance/page.tsx` (schedule list)
12. `app/(dashboard)/maintenance/templates/page.tsx` (template list)
13. `app/(dashboard)/maintenance/templates/[id]/page.tsx` (template detail)
14. `app/(dashboard)/maintenance/templates/new/page.tsx` (new template)
15. `app/(dashboard)/maintenance/schedules/[id]/page.tsx` (schedule detail)
16. `app/(dashboard)/maintenance/schedules/new/page.tsx` (new schedule)
17. `app/(dashboard)/approvals/page.tsx` (approval queue)
18. `app/(dashboard)/notifications/page.tsx` (notifications)
19. `app/(dashboard)/admin/settings/page.tsx` (admin settings)
20. `app/(dashboard)/admin/settings/settings-content.tsx` (settings tabs)
21. `app/(dashboard)/admin/company-settings/page.tsx` (company settings)
22. `app/(dashboard)/admin/audit-trail/page.tsx` (audit trail)
23. `app/(auth)/login/page.tsx`
24. `app/(auth)/reset-password/page.tsx`
25. `app/(auth)/update-password/page.tsx`

**Also audit key shared components:**
- `components/data-table/data-table.tsx` (empty state pattern)
- All view modals: request-view-modal, job-view-modal, asset-view-modal, template-view-modal, schedule-view-modal
- All form components listed above
- `components/inline-feedback.tsx` (verify no auto-dismiss)
- `components/status-badge.tsx`, `components/priority-badge.tsx`

**Use grep/glob to additionally check:**
- `grep -rn "setTimeout.*dismiss\|autoD\|auto_dismiss\|setInterval.*feedback" components/` — auto-dismiss anti-pattern
- `grep -rn "format(.*'MMM\|format(.*'MMMM\|format(.*'MM/\|format(.*'yyyy-MM" app/ components/ lib/` — wrong date formats
- `grep -rn " sm:| md:| lg:| xl:| 2xl:" --include="*.tsx" app/ components/` — mobile-first breakpoints (violations)
- `grep -rn "toast\|useToast\|sonner" components/ app/` — toast usage check

Write AUDIT-FINDINGS.md with:
```
# UI/UX Audit Findings

## Summary
Total issues: N
By category: ...

## Category A: Page Layout
| # | File | Issue | Severity | Fix |
...

## Category B: Loading States
...
(etc for each category)

## Category X: No Issues Found
(list categories with zero findings)
```

Mark severity as: critical (broken UX), major (visible inconsistency), minor (subtle/cosmetic).
  </action>
  <verify>
    <automated>test -f .planning/quick/14-find-any-inconsistencies-in-ui-and-ux-im/AUDIT-FINDINGS.md && grep -c "##" .planning/quick/14-find-any-inconsistencies-in-ui-and-ux-im/AUDIT-FINDINGS.md</automated>
  </verify>
  <done>AUDIT-FINDINGS.md exists with structured findings covering all 9 audit categories (A-I), listing every inconsistency found with file path, description, severity, and planned fix.</done>
</task>

<task type="auto">
  <name>Task 2: Fix all inconsistencies found in the audit</name>
  <files>
    app/(dashboard)/page.tsx
    app/(dashboard)/admin/settings/page.tsx
    app/(dashboard)/jobs/loading.tsx
    app/(dashboard)/jobs/[id]/loading.tsx
    app/(dashboard)/jobs/new/loading.tsx
    app/(dashboard)/inventory/loading.tsx
    app/(dashboard)/inventory/[id]/loading.tsx
    app/(dashboard)/inventory/new/loading.tsx
    app/(dashboard)/maintenance/loading.tsx
    app/(dashboard)/maintenance/templates/loading.tsx
    app/(dashboard)/maintenance/templates/[id]/loading.tsx
    app/(dashboard)/maintenance/templates/new/loading.tsx
    app/(dashboard)/maintenance/schedules/[id]/loading.tsx
    app/(dashboard)/maintenance/schedules/new/loading.tsx
    app/(dashboard)/approvals/loading.tsx
    app/(dashboard)/notifications/loading.tsx
    app/(dashboard)/admin/company-settings/loading.tsx
    components/skeletons/list-skeleton.tsx
    components/skeletons/detail-skeleton.tsx
    components/skeletons/form-skeleton.tsx
  </files>
  <action>
Fix every issue documented in AUDIT-FINDINGS.md. Work through each category systematically.

**Known fixes (from pre-audit analysis):**

**Fix 1: Dashboard page header consistency**
In `app/(dashboard)/page.tsx`, change the h1 from `text-2xl font-bold text-foreground` to `text-2xl font-bold tracking-tight`. Add `py-6` to the wrapper div if missing (currently uses `space-y-6` without `py-6`).

**Fix 2: Settings page wrapper consistency**
In `app/(dashboard)/admin/settings/page.tsx`, change `space-y-4` to `space-y-6 py-6`. The settings page delegates to SettingsContent which has its own header inside — verify the h1 pattern is consistent there too.

**Fix 3: Create generic skeleton components**
Create 3 reusable skeleton components in `components/skeletons/`:

`list-skeleton.tsx` — Generic list page skeleton:
- Matches the standard page layout: space-y-6 py-6 wrapper
- Skeleton h1 (w-48 h-8)
- Skeleton toolbar row (search box + filter placeholders)
- Skeleton table with 5-6 rows, matching DataTable column widths approximately
- Use existing Skeleton component from `components/ui/skeleton`

`detail-skeleton.tsx` — Generic detail page skeleton:
- space-y-6 py-6 wrapper
- Skeleton h1 + status badges row
- Two-column layout skeleton (main content left, sidebar right on desktop)
- Several skeleton card blocks

`form-skeleton.tsx` — Generic new/create form skeleton:
- space-y-6 py-6 wrapper
- Skeleton h1
- Several form field rows (label + input skeletons)
- Submit button skeleton at bottom

**Fix 4: Create loading.tsx for every missing route**
For each route missing loading.tsx, create a file that imports and renders the appropriate skeleton:

List pages (jobs, inventory, maintenance, maintenance/templates, approvals, notifications, audit-trail if missing) → use `ListSkeleton`
Detail pages (jobs/[id], inventory/[id], maintenance/templates/[id], maintenance/schedules/[id]) → use `DetailSkeleton`
Create/new pages (jobs/new, inventory/new, maintenance/templates/new, maintenance/schedules/new) → use `FormSkeleton`
Company settings → use `FormSkeleton` (it's a settings form)

Each loading.tsx follows the established pattern:
```tsx
import { ListSkeleton } from '@/components/skeletons/list-skeleton';

export default function Loading() {
  return <ListSkeleton />;
}
```

**Fix 5+: Apply all other fixes from AUDIT-FINDINGS.md**
For each remaining issue found during the audit:
- Read the target file
- Apply the specific fix
- Verify the fix is consistent with the established pattern

**After all fixes, verify:**
- `npm run build` passes with no errors
- `npm run lint` passes with no errors
- Grep confirms no remaining mobile-first breakpoints in modified files
- Grep confirms no remaining wrong date formats in modified files

Update AUDIT-FINDINGS.md to mark each issue as FIXED with a note of what was changed.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npm run build 2>&1 | tail -5</automated>
  </verify>
  <done>
    All inconsistencies from the audit are fixed:
    - Dashboard and settings pages use consistent wrapper and h1 patterns
    - All 15+ dashboard routes have loading.tsx with appropriate skeleton
    - 3 reusable skeleton components created (list, detail, form)
    - All other audit findings resolved
    - Build and lint pass
    - AUDIT-FINDINGS.md updated with fix status for every issue
  </done>
</task>

</tasks>

<verification>
- `npm run build` completes successfully
- `npm run lint` passes
- Every `app/(dashboard)/*/page.tsx` route has a sibling `loading.tsx` (except admin/users which is a redirect)
- All page wrappers use `space-y-6 py-6` pattern
- All page titles use `text-2xl font-bold tracking-tight` pattern
- No mobile-first breakpoints (sm:, md:, lg: without max-) in any modified file
- No wrong date formats in any modified file
- AUDIT-FINDINGS.md documents all issues found and their resolution
</verification>

<success_criteria>
- Zero UI/UX inconsistencies remain across all audited pages
- Every dashboard route has a loading skeleton
- Page headers, spacing, and typography are uniform
- AUDIT-FINDINGS.md provides complete traceability of every issue found and fixed
- Build and lint pass cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/14-find-any-inconsistencies-in-ui-and-ux-im/14-SUMMARY.md`
</output>
