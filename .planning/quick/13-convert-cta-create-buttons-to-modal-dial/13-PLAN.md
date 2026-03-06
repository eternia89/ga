---
phase: quick-13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-submit-form.tsx
  - components/requests/request-create-dialog.tsx
  - components/jobs/job-form.tsx
  - components/jobs/job-create-dialog.tsx
  - components/assets/asset-submit-form.tsx
  - components/assets/asset-create-dialog.tsx
  - components/maintenance/template-create-form.tsx
  - components/maintenance/template-create-dialog.tsx
  - components/maintenance/schedule-form.tsx
  - components/maintenance/schedule-create-dialog.tsx
  - app/(dashboard)/requests/page.tsx
  - app/(dashboard)/jobs/page.tsx
  - app/(dashboard)/inventory/page.tsx
  - app/(dashboard)/maintenance/templates/page.tsx
  - app/(dashboard)/maintenance/page.tsx
autonomous: true
requirements: [QUICK-13]

must_haves:
  truths:
    - "Clicking 'New X' button on any list page opens a modal dialog instead of navigating to /new"
    - "All 5 create forms (Request, Job, Asset, Template, Schedule) work inside dialogs"
    - "On successful creation, dialog closes and table refreshes with new item"
    - "Complex forms with photo uploads and invoice uploads work inside scrollable dialogs"
  artifacts:
    - path: "components/requests/request-create-dialog.tsx"
      provides: "Request create dialog wrapper"
    - path: "components/jobs/job-create-dialog.tsx"
      provides: "Job create dialog wrapper"
    - path: "components/assets/asset-create-dialog.tsx"
      provides: "Asset create dialog wrapper"
    - path: "components/maintenance/template-create-dialog.tsx"
      provides: "Template create dialog wrapper"
    - path: "components/maintenance/schedule-create-dialog.tsx"
      provides: "Schedule create dialog wrapper"
  key_links:
    - from: "app/(dashboard)/*/page.tsx"
      to: "components/*/*-create-dialog.tsx"
      via: "Dialog trigger button replaces Link CTA"
      pattern: "CreateDialog.*open.*onOpenChange"
    - from: "components/*/*-create-dialog.tsx"
      to: "components/*/*-form.tsx"
      via: "Dialog wraps existing form with onSuccess callback"
      pattern: "onSuccess.*router\\.refresh"
---

<objective>
Convert all 5 CTA "New X" buttons from page navigation (`<Link href="/new">`) to modal dialogs. Each form (Request, Job, Asset, Template, Schedule) opens in a Dialog instead of navigating to a dedicated `/new` page. On success: close dialog + router.refresh().

Purpose: Consistent UX where creation stays in context of the list page, matching admin EntityFormDialog pattern.
Output: 5 create dialog wrappers + modified form components + updated list pages.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@components/admin/entity-form-dialog.tsx (Reference pattern for dialog wrapper)
@components/admin/companies/company-form-dialog.tsx (Example of wrapping form in dialog)
@app/(dashboard)/requests/page.tsx
@app/(dashboard)/jobs/page.tsx
@app/(dashboard)/inventory/page.tsx
@app/(dashboard)/maintenance/templates/page.tsx
@app/(dashboard)/maintenance/page.tsx
@app/(dashboard)/requests/new/page.tsx (Data fetching to move into dialog)
@app/(dashboard)/jobs/new/page.tsx (Data fetching to move into dialog)
@app/(dashboard)/inventory/new/page.tsx (Data fetching to move into dialog)
@app/(dashboard)/maintenance/templates/new/page.tsx (Data fetching to move into dialog)
@app/(dashboard)/maintenance/schedules/new/page.tsx (Data fetching to move into dialog)
@components/requests/request-submit-form.tsx
@components/jobs/job-form.tsx
@components/assets/asset-submit-form.tsx
@components/maintenance/template-create-form.tsx
@components/maintenance/schedule-form.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add onSuccess callback to all 5 form components and create dialog wrappers</name>
  <files>
    components/requests/request-submit-form.tsx,
    components/requests/request-create-dialog.tsx,
    components/jobs/job-form.tsx,
    components/jobs/job-create-dialog.tsx,
    components/assets/asset-submit-form.tsx,
    components/assets/asset-create-dialog.tsx,
    components/maintenance/template-create-form.tsx,
    components/maintenance/template-create-dialog.tsx,
    components/maintenance/schedule-form.tsx,
    components/maintenance/schedule-create-dialog.tsx
  </files>
  <action>
    **For each of the 5 form components**, add an optional `onSuccess?: () => void` prop. When `onSuccess` is provided, call it instead of `router.push(...)`. When not provided, keep existing `router.push` behavior (backward compat for /new pages that still exist). Also remove the Cancel button's `router.push` — when `onSuccess` is provided, the Cancel button should not exist (dialog has its own close).

    Specific changes per form:

    1. **RequestSubmitForm** (`request-submit-form.tsx`):
       - Add `onSuccess?: () => void` to `RequestSubmitFormProps`
       - After successful `createRequest` + photo upload, call `onSuccess?.()` OR `router.push('/requests')` based on prop presence
       - Hide the Cancel/back navigation when `onSuccess` is provided (form is inside dialog)

    2. **JobForm** (`job-form.tsx`):
       - Add `onSuccess?: () => void` to `JobFormProps`
       - After successful `createJob` in create mode, call `onSuccess?.()` OR `router.push(...)` based on prop presence
       - Hide Cancel button when `onSuccess` is provided
       - NOTE: The job form is complex (500+ lines) with request linking, priority calculation, cost formatting. The dialog version should NOT support `prefillRequest` or `requestJobLinks` — those are only used when creating from a request detail page. In the dialog wrapper, pass `prefillRequest={null}` and `requestJobLinks={{}}`.

    3. **AssetSubmitForm** (`asset-submit-form.tsx`):
       - Add `onSuccess?: () => void` to `AssetSubmitFormProps`
       - After successful asset creation + photo/invoice upload, call `onSuccess?.()` OR `router.push(...)` based on prop presence
       - Hide Cancel button when `onSuccess` is provided

    4. **TemplateCreateForm** (`template-create-form.tsx`):
       - Add `onSuccess?: () => void` to `TemplateCreateFormProps`
       - After successful `createTemplate`, call `onSuccess?.()` OR `router.push('/maintenance/templates')` based on prop presence
       - Hide Cancel button when `onSuccess` is provided

    5. **ScheduleForm/ScheduleCreateForm** (`schedule-form.tsx`):
       - Add `onSuccess?: () => void` to `ScheduleFormProps`
       - Pass through to the internal `ScheduleCreateForm` sub-component
       - After successful `createSchedule`, call `onSuccess?.()` OR `router.push('/maintenance')` based on prop presence
       - Hide Cancel button when `onSuccess` is provided

    **Then create 5 dialog wrapper components**, each following this pattern:

    ```tsx
    "use client";
    import { useState } from "react";
    import { useRouter } from "next/navigation";
    import { Plus } from "lucide-react";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import { Button } from "@/components/ui/button";

    export function XxxCreateDialog({ ...dataProps }) {
      const router = useRouter();
      const [open, setOpen] = useState(false);

      return (
        <>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Xxx
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto max-md:h-screen max-md:max-h-screen max-md:w-screen max-md:max-w-screen max-md:rounded-none max-md:border-0">
              <DialogHeader>
                <DialogTitle>New Xxx</DialogTitle>
              </DialogHeader>
              <XxxForm
                {...dataProps}
                onSuccess={() => {
                  setOpen(false);
                  router.refresh();
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      );
    }
    ```

    Dialog sizing per form complexity:
    - **RequestCreateDialog**: `max-w-[600px]` (simple form: location + description + photos)
    - **JobCreateDialog**: `max-w-[700px]` (medium: title, location, category, priority, PIC, cost, requests, description)
    - **AssetCreateDialog**: `max-w-[700px]` (complex: name, category, location, condition, cost, description, photos, invoices)
    - **TemplateCreateDialog**: `max-w-[700px]` (medium: name, category, description, checklist builder)
    - **ScheduleCreateDialog**: `max-w-[600px]` (medium: template, asset, interval, PIC)

    Each dialog wrapper receives the same data props that the form component expects (locations, categories, users, etc.) and passes them through.

    For the **JobCreateDialog**: pass `mode="create"`, `eligibleRequests`, `requestJobLinks={{}}`, `prefillRequest={null}`.
    For the **ScheduleCreateDialog**: pass `mode="create"`, `templates`, `assets`. No `defaultTemplateId`/`defaultAssetId`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -50</automated>
  </verify>
  <done>All 5 form components accept optional onSuccess callback. 5 new dialog wrapper components created. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Update list pages to fetch form data and use dialog wrappers instead of Link CTAs</name>
  <files>
    app/(dashboard)/requests/page.tsx,
    app/(dashboard)/jobs/page.tsx,
    app/(dashboard)/inventory/page.tsx,
    app/(dashboard)/maintenance/templates/page.tsx,
    app/(dashboard)/maintenance/page.tsx
  </files>
  <action>
    Update each of the 5 list pages (all server components) to:

    1. **Fetch the data** that the form needs (currently fetched in the /new pages) in parallel with existing queries via Promise.all
    2. **Replace** the `<Button asChild><Link href="/xxx/new">` CTA with the new dialog wrapper component
    3. **Remove** the `import Link from 'next/link'` if no longer used (check if Link is used elsewhere in the file first)
    4. **Remove** the `import { Plus } from 'lucide-react'` since the Plus icon is now inside the dialog wrapper

    Specific changes per page:

    **requests/page.tsx:**
    - Data already available: `locations` is NOT fetched — add locations fetch to Promise.all (same query as requests/new/page.tsx)
    - Replace CTA Link with `<RequestCreateDialog locations={locations} />`
    - The "New Request" button is shown to ALL roles (no role guard) — keep that behavior

    **jobs/page.tsx:**
    - Add to existing Promise.all: locations, categories (all types), users (all active in company), eligibleRequests (triaged + in_progress)
    - After Promise.all, fetch requestJobLinks for in_progress requests (same pattern as jobs/new/page.tsx)
    - Replace CTA Link with `<JobCreateDialog locations={locations} categories={categories} users={allUsers} eligibleRequests={eligibleRequests} requestJobLinks={requestJobLinks} />`
    - Keep role guard: only `['ga_lead', 'admin']`

    **inventory/page.tsx:**
    - categories and locations already fetched for filters — reuse them
    - Replace CTA Link with `<AssetCreateDialog categories={categories ?? []} locations={locations ?? []} />`
    - Keep role guard: only `['ga_staff', 'ga_lead', 'admin']`

    **maintenance/templates/page.tsx:**
    - Add categories fetch (asset type only) — same query as templates/new/page.tsx
    - Replace CTA Link with `<TemplateCreateDialog categories={categories ?? []} />`
    - Keep role guard: only `['ga_lead', 'admin']`

    **maintenance/page.tsx (schedules):**
    - Add to existing query or separate: fetch templates (active, company-scoped with id, name, category_id) and assets (non-sold_disposed with id, name, display_id, category_id)
    - Replace CTA Link with `<ScheduleCreateDialog templates={templateList} assets={assetList} />`
    - Keep role guard: only `['ga_lead', 'admin']`

    IMPORTANT: The list pages are server components. The dialog wrapper components are client components. This is fine — server components can render client components and pass serializable props.

    NOTE: Do NOT delete the /new pages. They may still be referenced from other places (e.g., job creation from request detail page via "Create Job" button). Keep them as fallback navigation targets.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -50 && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>All 5 list pages show dialog on "New X" click instead of navigating. Data for forms is fetched server-side and passed to dialog wrappers. Build succeeds. /new pages still exist as fallback.</done>
</task>

</tasks>

<verification>
1. TypeScript compiles: `npx tsc --noEmit`
2. Build succeeds: `npm run build`
3. Each list page loads without error in dev
4. Clicking "New X" opens a dialog (not navigating away)
5. Submitting form in dialog closes dialog and table refreshes
</verification>

<success_criteria>
- All 5 CTA buttons (Jobs, Requests, Assets, Templates, Schedules) open modal dialogs instead of navigating
- Forms inside dialogs are scrollable for complex forms (Asset, Job)
- On successful creation: dialog closes, table refreshes via router.refresh()
- No regressions: /new pages still work if navigated to directly
- TypeScript and build pass clean
</success_criteria>

<output>
After completion, create `.planning/quick/13-convert-cta-create-buttons-to-modal-dial/13-SUMMARY.md`
</output>
