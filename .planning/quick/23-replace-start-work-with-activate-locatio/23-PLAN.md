---
phase: quick-23
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - hooks/use-geolocation.ts
  - components/jobs/job-detail-actions.tsx
  - components/jobs/job-modal.tsx
autonomous: true
requirements: [QUICK-23]

must_haves:
  truths:
    - "PIC sees 'Activate Location' button when geolocation permission is not yet granted on an assigned job"
    - "After PIC grants geolocation permission, button changes to 'Start Work'"
    - "PIC must click 'Start Work' separately after activating location (two-step flow)"
    - "'Mark Complete' is NOT gated behind location activation"
  artifacts:
    - path: "hooks/use-geolocation.ts"
      provides: "useGeolocationPermission hook exporting permission state"
      exports: ["useGeolocationPermission"]
    - path: "components/jobs/job-detail-actions.tsx"
      provides: "Activate Location / Start Work two-step button on job detail page"
    - path: "components/jobs/job-modal.tsx"
      provides: "Activate Location / Start Work two-step button in job modal"
  key_links:
    - from: "components/jobs/job-detail-actions.tsx"
      to: "hooks/use-geolocation.ts"
      via: "useGeolocationPermission import"
      pattern: "useGeolocationPermission"
    - from: "components/jobs/job-modal.tsx"
      to: "hooks/use-geolocation.ts"
      via: "useGeolocationPermission import"
      pattern: "useGeolocationPermission"
---

<objective>
Replace the "Start Work" button with an "Activate Location" button when the browser has not yet granted geolocation permission. After PIC activates location (grants browser permission), the button swaps to "Start Work" for the actual status transition. This enforces location activation as a prerequisite before starting work.

Purpose: Ensures PIC consciously activates their location before starting work, making GPS capture reliable.
Output: Updated geolocation hook + two updated components with the two-step button flow.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@hooks/use-geolocation.ts
@components/jobs/job-detail-actions.tsx
@components/jobs/job-modal.tsx
</context>

<interfaces>
<!-- Existing hook contract (will be extended) -->
From hooks/use-geolocation.ts:
```typescript
export type GpsResult = { latitude: number; longitude: number; accuracy: number };
export type GpsError = { code: number; message: string };
export function useGeolocation(): { capturing: boolean; error: GpsError | null; capturePosition: () => Promise<GpsResult> };
```

From components/jobs/job-detail-actions.tsx:
```typescript
interface JobDetailActionsProps {
  job: JobWithRelations;
  currentUserId: string;
  currentUserRole: string;
  users?: { id: string; full_name: string }[];
  onActionSuccess: () => void;
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add useGeolocationPermission hook and implement Activate Location flow</name>
  <files>hooks/use-geolocation.ts, components/jobs/job-detail-actions.tsx, components/jobs/job-modal.tsx</files>
  <action>
**1. Add `useGeolocationPermission` hook to `hooks/use-geolocation.ts`:**

Add a new exported hook `useGeolocationPermission` that returns `{ permissionState: 'granted' | 'prompt' | 'denied' | 'unknown' }`.

Implementation:
- Use `useState` initialized to `'unknown'`
- In a `useEffect`, call `navigator.permissions.query({ name: 'geolocation' })` to get initial state
- Map the result's `.state` to the local state (`'granted'`, `'prompt'`, `'denied'`)
- Subscribe to the `change` event on the PermissionStatus object to reactively update when user grants/denies
- Wrap the permissions API call in try/catch — if `navigator.permissions` is undefined (Safari older versions), default to `'unknown'`
- Treat both `'unknown'` and `'prompt'` as "not yet granted" for the button logic
- Clean up the event listener on unmount

Keep the existing `useGeolocation` hook unchanged.

**2. Update `components/jobs/job-detail-actions.tsx`:**

- Import `useGeolocationPermission` from `@/hooks/use-geolocation`
- Call it at the top of the component: `const { permissionState } = useGeolocationPermission()`
- Derive `const locationActivated = permissionState === 'granted'`
- In the `canStartWork` button section (lines ~356-361), implement the two-step flow:
  - If `canStartWork && !locationActivated`: Show "Activate Location" button (with `MapPin` icon from lucide-react instead of `Play`)
    - onClick: call `capturePosition()` — this triggers the browser permission prompt. On success, `useGeolocationPermission` will reactively update to `'granted'` via the change event, swapping the button. Show success feedback "Location activated. You can now start work."
    - On error: show the GPS error feedback as usual
  - If `canStartWork && locationActivated`: Show the existing "Start Work" button with `Play` icon (current behavior, unchanged)
- Do NOT gate "Mark Complete" behind location activation (per locked decision)

**3. Update `components/jobs/job-modal.tsx`:**

Apply the exact same pattern as job-detail-actions.tsx:
- Import `useGeolocationPermission`
- Call at top of component
- Derive `locationActivated`
- In the `canStartWork` button section (~lines 1089-1094), implement the same two-step:
  - Not activated: "Activate Location" button with MapPin icon, calls `capturePosition()` on click
  - Activated: existing "Start Work" button unchanged
- Do NOT gate "Mark Complete"

**Important details:**
- The "Activate Location" click handler should be a separate function `handleActivateLocation` that calls `capturePosition()`, catches errors (shows feedback), and on success shows "Location activated. You can now start work." The permission state update happens reactively via the PermissionStatus change listener.
- If `permissionState` is `'denied'`, still show "Activate Location" — when clicked, `capturePosition()` will fail and the existing error message "Location permission denied..." will display, guiding the user to fix browser settings.
- The `capturingGps` disabled state should apply to "Activate Location" button too.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
- PIC on an assigned job sees "Activate Location" button when geolocation permission is not granted
- Clicking "Activate Location" triggers browser permission prompt via capturePosition()
- After granting permission, button reactively changes to "Start Work" (no page refresh needed)
- "Start Work" click proceeds with GPS capture + status change as before
- "Mark Complete" is unaffected (no location activation gate)
- Both job-detail-actions.tsx and job-modal.tsx implement the same two-step flow
- TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — no TypeScript errors
2. `npm run build` — production build succeeds
3. Manual: Navigate to an assigned job as PIC, verify "Activate Location" button appears, click it, grant permission, verify button changes to "Start Work"
</verification>

<success_criteria>
- "Activate Location" button shown when geolocation permission not granted, on both job detail page and job modal
- After granting permission, button swaps to "Start Work" reactively
- Two-step flow enforced: activate first, then start work
- Mark Complete remains ungated
- No TypeScript or build errors
</success_criteria>

<output>
After completion, create `.planning/quick/23-replace-start-work-with-activate-locatio/23-SUMMARY.md`
</output>
