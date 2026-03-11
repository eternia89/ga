---
phase: quick
plan: 47
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-create-dialog.tsx
  - components/assets/asset-create-dialog.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Navigating to /jobs?action=create opens the New Job modal automatically"
    - "Navigating to /inventory?action=create opens the New Asset modal automatically"
    - "Clicking the New Job button updates the URL to ?action=create so the address bar is shareable"
    - "Clicking the New Asset button updates the URL to ?action=create so the address bar is shareable"
    - "Closing either modal (Escape, backdrop click, or cancel) removes ?action=create from the URL"
  artifacts:
    - path: "components/jobs/job-create-dialog.tsx"
      provides: "Bidirectional URL sync for New Job modal"
    - path: "components/assets/asset-create-dialog.tsx"
      provides: "Bidirectional URL sync for New Asset modal"
  key_links:
    - from: "components/jobs/job-create-dialog.tsx"
      to: "URL ?action=create param"
      via: "useRouter + useSearchParams to set/clear on open/close"
    - from: "components/assets/asset-create-dialog.tsx"
      to: "URL ?action=create param"
      via: "useRouter + useSearchParams to set/clear on open/close"
---

<objective>
Add bidirectional URL sync to the New Job and New Asset create modals so that ?action=create is both read on page load (already working) AND written to the URL when the modal opens via button click, and cleared when it closes.

Purpose: Currently both dialogs already open when navigating to /jobs?action=create or /inventory?action=create (initialOpen prop is wired in both page.tsx files). However, clicking the "New Job" or "New Asset" button does NOT update the URL. This means the link is not shareable from the address bar mid-session. The fix adds URL sync: open sets ?action=create, close removes it.

Note: requests/page.tsx has the same gap — this task targets jobs and assets only as scoped.

Output: Updated job-create-dialog.tsx and asset-create-dialog.tsx with useSearchParams + useRouter URL management.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Reference: How the request create dialog works (same initialOpen pattern, no URL sync today):
- components/requests/request-create-dialog.tsx
- app/(dashboard)/requests/page.tsx — passes initialOpen={action === 'create'}
- app/(dashboard)/jobs/page.tsx — already passes initialOpen={action === 'create'}
- app/(dashboard)/inventory/page.tsx — already passes initialOpen={action === 'create'}

The ?view={id} modal pattern uses URL param for shareability (set in table columns, cleared on close).
The ?action=create pattern should mirror this: set on button click, clear on modal close.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add URL sync to JobCreateDialog and AssetCreateDialog</name>
  <files>components/jobs/job-create-dialog.tsx, components/assets/asset-create-dialog.tsx</files>
  <action>
Update both create dialog components to sync ?action=create with the URL, making the permalink truly bidirectional.

**Pattern to apply to BOTH files:**

1. Add `useSearchParams` import from `"next/navigation"` (already imports `useRouter`).

2. Replace the simple `useState(initialOpen ?? false)` with a handler-based approach:
   ```typescript
   const router = useRouter();
   const searchParams = useSearchParams();
   const [open, setOpen] = useState(initialOpen ?? false);

   const handleOpenChange = (value: boolean) => {
     setOpen(value);
     if (value) {
       // Set ?action=create in URL when modal opens via button
       const params = new URLSearchParams(searchParams.toString());
       params.set('action', 'create');
       router.replace(`?${params.toString()}`, { scroll: false });
     } else {
       // Remove ?action=create from URL when modal closes
       const params = new URLSearchParams(searchParams.toString());
       params.delete('action');
       const qs = params.toString();
       router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
     }
   };
   ```

3. Change the Button's `onClick` to use `handleOpenChange(true)` instead of `() => setOpen(true)`.

4. Pass `onOpenChange={handleOpenChange}` to the Dialog/JobModal instead of `setOpen`.

**For job-create-dialog.tsx specifically:**
- The dialog is rendered via `<JobModal ... onOpenChange={setOpen} />` — change to `onOpenChange={handleOpenChange}`.
- The Button's onClick becomes `onClick={() => handleOpenChange(true)}`.

**For asset-create-dialog.tsx specifically:**
- The dialog is rendered via `<Dialog open={open} onOpenChange={setOpen}>` — change to `onOpenChange={handleOpenChange}`.
- The Button's onClick becomes `onClick={() => handleOpenChange(true)}`.

**Important:** `useSearchParams()` must be wrapped in a Suspense boundary when used in a Client Component that is imported by a Server Component. Both dialog components are already Client Components (`"use client"`) rendered inside page.tsx server components — Next.js App Router handles the Suspense boundary automatically for `useSearchParams` in this case. No additional Suspense wrapping required.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Build passes with no TypeScript errors
    - Navigating to /jobs?action=create opens New Job modal
    - Navigating to /inventory?action=create opens New Asset modal
    - Clicking "New Job" button adds ?action=create to the URL
    - Clicking "New Asset" button adds ?action=create to the URL
    - Closing either modal removes ?action=create from the URL
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes with no TypeScript errors
2. Visit /jobs — click "New Job" button — URL becomes /jobs?action=create
3. Close modal — URL returns to /jobs
4. Navigate directly to /jobs?action=create — modal opens automatically
5. Repeat steps 2-4 on /inventory with "New Asset"
</verification>

<success_criteria>
Both create modals are fully permalink-aware: the URL reflects modal state in both directions (open sets param, close clears param), matching the ?view={id} shareability pattern used for view modals throughout the app.
</success_criteria>

<output>
After completion, create `.planning/quick/47-add-permalink-support-to-new-job-and-new/47-SUMMARY.md`
</output>
