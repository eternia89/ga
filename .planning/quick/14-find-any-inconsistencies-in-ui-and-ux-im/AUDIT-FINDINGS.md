# UI/UX Audit Findings

## Summary

Total issues: 17
- Category A (Page Layout): 2 issues
- Category B (Loading States): 15 issues (missing loading.tsx files)
- Category C (Empty States): 0 issues
- Category D (Form Patterns): 0 issues
- Category E (Button Placement): 0 issues
- Category F (Feedback Patterns): 0 issues
- Category G (CLAUDE.md Conventions): 0 issues
- Category H (Typography/Color): 0 issues
- Category I (Interaction Patterns): 0 issues

## Category A: Page Layout Consistency

| # | File | Issue | Severity | Fix | Status |
|---|------|-------|----------|-----|--------|
| A1 | `app/(dashboard)/page.tsx` | Wrapper uses `space-y-6` without `py-6`. h1 uses `text-2xl font-bold text-foreground` instead of `text-2xl font-bold tracking-tight` | major | Add `py-6` to wrapper, replace `text-foreground` with `tracking-tight` on h1 | PENDING |
| A2 | `app/(dashboard)/admin/settings/page.tsx` | Wrapper uses `space-y-4` without `py-6`. Standard is `space-y-6 py-6` | major | Change to `space-y-6 py-6` | PENDING |

### Pages with correct pattern (confirmed):
- `requests/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `requests/[id]/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `requests/new/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `jobs/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `jobs/[id]/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `jobs/new/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `inventory/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `inventory/[id]/page.tsx` -- space-y-6 py-6 (h1 in client component)
- `inventory/new/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `maintenance/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `maintenance/templates/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `maintenance/templates/[id]/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `maintenance/templates/new/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `maintenance/schedules/[id]/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `maintenance/schedules/new/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `approvals/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `notifications/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `admin/company-settings/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight
- `admin/audit-trail/page.tsx` -- space-y-6 py-6, text-2xl font-bold tracking-tight

## Category B: Loading States

Routes missing `loading.tsx` (confirmed by filesystem check):

| # | Route | Type | Skeleton to use | Status |
|---|-------|------|-----------------|--------|
| B1 | `jobs/` | list | ListSkeleton | PENDING |
| B2 | `jobs/[id]/` | detail | DetailSkeleton | PENDING |
| B3 | `jobs/new/` | form | FormSkeleton | PENDING |
| B4 | `inventory/` | list | ListSkeleton | PENDING |
| B5 | `inventory/[id]/` | detail | DetailSkeleton | PENDING |
| B6 | `inventory/new/` | form | FormSkeleton | PENDING |
| B7 | `maintenance/` | list | ListSkeleton | PENDING |
| B8 | `maintenance/templates/` | list | ListSkeleton | PENDING |
| B9 | `maintenance/templates/[id]/` | detail | DetailSkeleton | PENDING |
| B10 | `maintenance/templates/new/` | form | FormSkeleton | PENDING |
| B11 | `maintenance/schedules/[id]/` | detail | DetailSkeleton | PENDING |
| B12 | `maintenance/schedules/new/` | form | FormSkeleton | PENDING |
| B13 | `approvals/` | list | ListSkeleton | PENDING |
| B14 | `notifications/` | list | ListSkeleton | PENDING |
| B15 | `admin/company-settings/` | form | FormSkeleton | PENDING |

### Routes with existing loading.tsx (confirmed):
- `(dashboard)/` -- DashboardSkeleton
- `requests/` -- RequestListSkeleton
- `requests/[id]/` -- RequestDetailSkeleton
- `requests/new/` -- RequestNewSkeleton
- `admin/settings/` -- SettingsSkeleton
- `admin/audit-trail/` -- has loading.tsx
- `admin/users/` -- has loading.tsx (redirect page)

### Skeleton components needed:
- `components/skeletons/list-skeleton.tsx` -- generic, reusable for all list pages
- `components/skeletons/detail-skeleton.tsx` -- generic, reusable for all detail pages
- `components/skeletons/form-skeleton.tsx` -- generic, reusable for all create/new pages

## Category C: Empty States -- No Issues Found

Verified: DataTable component handles empty states consistently. All list components use DataTable which renders a "No results" row when data is empty.

## Category D: Form Patterns -- No Issues Found

All forms use Zod schemas with `.max(N)` limits. Input components have matching `maxLength` props. Checked: request-submit-form, job-form, asset-submit-form, entity-form-dialog, template-create-form, schedule-form, company-settings-form.

## Category E: Button Placement -- No Issues Found

All list pages follow the same header pattern: title left, CTA buttons right. Form pages have submit buttons consistently positioned. Back/cancel links are consistent.

## Category F: Feedback Patterns -- No Issues Found

Grep confirmed: No `setTimeout` with dismiss, no auto-dismiss patterns, no `useToast` or `sonner` usage anywhere. All forms use `InlineFeedback` with manual dismiss.

## Category G: CLAUDE.md Convention Compliance -- No Issues Found

- **Date formats:** All `yyyy-MM-dd` occurrences are for URL parameters and ISO data transport (not display). All display dates use `dd-MM-yyyy`.
- **Currency:** IDR formatting via `formatIDR` from `lib/utils.ts`.
- **Responsive:** No mobile-first breakpoints in app code. One `md:flex-row` in `components/ui/calendar.tsx` (shadcn/ui generated -- out of scope).
- **Combobox vs Select:** Long lists use Combobox, short fixed lists use Select.

## Category H: Typography and Color -- No Issues Found

All page titles use `text-2xl font-bold tracking-tight` (except A1 dashboard). Section headers within pages use consistent `text-base font-semibold` or card headers. Muted text consistently uses `text-muted-foreground`. Badge colors consistent per status/priority.

## Category I: Interaction Patterns -- No Issues Found

View modals consistent across all entity types (request, job, asset, template, schedule). Detail pages allow inline editing for authorized roles. Delete/deactivate confirmations use `DeleteConfirmDialog` consistently.

## Notes

- `components/ui/calendar.tsx` has `md:flex-row` (mobile-first breakpoint) but this is a shadcn/ui generated component. Not fixed -- would break on regeneration.
- Existing skeleton components (`request-list-skeleton.tsx`, `request-detail-skeleton.tsx`, `request-new-skeleton.tsx`) use `space-y-4` in their wrapper, while page content uses `space-y-6 py-6`. Skeletons don't need `py-6` because the loading.tsx is wrapped by the same layout padding. The slight difference in internal spacing is acceptable since skeletons are transient.
