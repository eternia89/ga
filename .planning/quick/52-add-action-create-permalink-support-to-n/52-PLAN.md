---
phase: quick
plan: 52
type: execute
wave: 1
depends_on: []
files_modified:
  - components/requests/request-create-dialog.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Navigating to /requests?action=create opens the New Request modal automatically"
    - "Clicking the New Request button updates the URL to ?action=create so the address bar is shareable"
    - "Closing the modal (Escape, backdrop click, cancel, or successful submit) removes ?action=create from the URL"
  artifacts:
    - path: "components/requests/request-create-dialog.tsx"
      provides: "Bidirectional URL sync for New Request modal"
  key_links:
    - from: "components/requests/request-create-dialog.tsx"
      to: "URL ?action=create param"
      via: "useSearchParams + useRouter to set on open, clear on close"
---

<objective>
Add bidirectional ?action=create URL sync to RequestCreateDialog, matching the pattern already implemented in JobCreateDialog and AssetCreateDialog.

Purpose: The requests page already reads ?action=create (initialOpen={action === 'create'} in page.tsx), so navigating to /requests?action=create opens the modal. However, clicking the "New Request" button does NOT write ?action=create to the URL, making the link non-shareable from the address bar during a session. The fix adds the same handleOpenChange pattern used in job-create-dialog.tsx.

Output: Updated request-create-dialog.tsx with useSearchParams + useRouter URL management.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Reference implementation — job-create-dialog.tsx (already has the full pattern):
```typescript
import { useRouter, useSearchParams } from "next/navigation";
// ...
const router = useRouter();
const searchParams = useSearchParams();
const [open, setOpen] = useState(initialOpen ?? false);

const handleOpenChange = (value: boolean) => {
  setOpen(value);
  if (value) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("action", "create");
    router.replace(`?${params.toString()}`, { scroll: false });
  } else {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }
};
// Button: onClick={() => handleOpenChange(true)}
// Dialog: onOpenChange={handleOpenChange}
// onSuccess: setOpen(false) — handleOpenChange(false) already called via Dialog onOpenChange on close
```

Current request-create-dialog.tsx gaps:
- Imports `useRouter` only (missing `useSearchParams`)
- Uses `onClick={() => setOpen(true)}` — does not write URL param
- Uses `onOpenChange={setOpen}` on Dialog — does not clear URL param on close
- onSuccess calls `setOpen(false)` directly — needs to be `handleOpenChange(false)` to also clear the URL
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add URL sync to RequestCreateDialog</name>
  <files>components/requests/request-create-dialog.tsx</files>
  <action>
Update request-create-dialog.tsx to use the same bidirectional URL sync pattern as job-create-dialog.tsx.

Changes:
1. Add `useSearchParams` to the import from `"next/navigation"` (already imports `useRouter`).

2. Add `const searchParams = useSearchParams();` after `const router = useRouter();`.

3. Add a `handleOpenChange` function after the existing state declaration:
   ```typescript
   const handleOpenChange = (value: boolean) => {
     setOpen(value);
     if (value) {
       const params = new URLSearchParams(searchParams.toString());
       params.set("action", "create");
       router.replace(`?${params.toString()}`, { scroll: false });
     } else {
       const params = new URLSearchParams(searchParams.toString());
       params.delete("action");
       const qs = params.toString();
       router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
     }
   };
   ```

4. Change Button `onClick` from `() => setOpen(true)` to `() => handleOpenChange(true)`.

5. Change `<Dialog open={open} onOpenChange={setOpen}>` to `<Dialog open={open} onOpenChange={handleOpenChange}>`.

6. Change `onSuccess` callback from `setOpen(false)` to `handleOpenChange(false)` (the router.refresh() call stays).

No other changes. All existing props, DialogContent styling, and RequestSubmitForm wiring remain unchanged.
  </action>
  <verify>
    <automated>npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Build passes with no TypeScript errors
    - Navigating to /requests?action=create opens the New Request modal automatically
    - Clicking "New Request" button adds ?action=create to the URL
    - Closing the modal (any method) removes ?action=create from the URL
    - Successful form submit also removes ?action=create from the URL
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes with no TypeScript errors
2. Visit /requests — click "New Request" button — URL becomes /requests?action=create
3. Close modal via X or Escape — URL returns to /requests
4. Navigate directly to /requests?action=create — modal opens automatically
5. Submit a new request — modal closes, URL returns to /requests (no stale ?action=create)
</verification>

<success_criteria>
RequestCreateDialog is fully permalink-aware: the URL reflects modal state in both directions (open sets ?action=create, close clears it), matching the identical pattern in JobCreateDialog and AssetCreateDialog.
</success_criteria>

<output>
After completion, create `.planning/quick/52-add-action-create-permalink-support-to-n/52-SUMMARY.md`
</output>
