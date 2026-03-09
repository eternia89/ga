---
phase: quick-29
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/request-actions.ts
  - components/requests/request-detail-actions.tsx
  - components/requests/request-view-modal.tsx
autonomous: true
requirements: [QUICK-29]

must_haves:
  truths:
    - "PIC (assigned_to user) sees a Complete Request button on triaged/in_progress requests"
    - "GA Lead/Admin sees a Complete Request button on triaged/in_progress requests"
    - "Clicking Complete Request moves request to pending_acceptance status"
    - "Requester does NOT see Complete Request button"
    - "Normal acceptance flow (accept/reject by requester) continues after direct completion"
  artifacts:
    - path: "app/actions/request-actions.ts"
      provides: "completeRequest server action"
      contains: "completeRequest"
    - path: "components/requests/request-detail-actions.tsx"
      provides: "Complete Request button for detail page"
      contains: "Complete Request"
    - path: "components/requests/request-view-modal.tsx"
      provides: "Complete Request button in modal action bar"
      contains: "Complete Request"
  key_links:
    - from: "components/requests/request-detail-actions.tsx"
      to: "app/actions/request-actions.ts"
      via: "completeRequest import and call"
      pattern: "completeRequest"
    - from: "components/requests/request-view-modal.tsx"
      to: "app/actions/request-actions.ts"
      via: "completeRequest import and call"
      pattern: "completeRequest"
---

<objective>
Allow PIC (assigned_to user) or GA Lead/Admin to directly complete a request without going through the job completion flow. Clicking "Complete Request" on a triaged or in_progress request moves it to pending_acceptance so the requester can accept/reject the work.

Purpose: Some requests can be resolved directly by the PIC without creating a formal job. This removes the forced job-completion-first bottleneck.
Output: New completeRequest server action + Complete Request button in both detail page and modal.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/actions/request-actions.ts
@components/requests/request-detail-actions.tsx
@components/requests/request-view-modal.tsx
@lib/constants/request-status.ts
@lib/types/database.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create completeRequest server action</name>
  <files>app/actions/request-actions.ts</files>
  <action>
Add a new `completeRequest` server action after the existing `rejectRequest` action. The action should:

1. Accept schema: `z.object({ id: z.string().uuid() })`
2. Use `authActionClient`
3. Permission check: user must be either (a) the PIC (request.assigned_to === profile.id), or (b) ga_lead/admin role. If neither, throw "Only the assigned PIC or GA Lead can complete this request."
4. Status check: request must be in 'triaged' or 'in_progress' status. Fetch with `.select('id, status, assigned_to, requester_id, display_id, company_id')`.
5. Update request: set `status: 'pending_acceptance'`, `completed_at: new Date().toISOString()`, `updated_at: new Date().toISOString()`.
6. Send notification to the requester (non-blocking, fire-and-forget with `.catch(() => {})`):
   - title: `Request ${request.display_id} completed`
   - body: `Your request has been completed. Please accept or reject the work.`
   - type: 'completion'
   - entityType: 'request'
   - entityId: request.id
7. Call `revalidatePath('/requests')` and return `{ success: true }`.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>completeRequest action exported from request-actions.ts, TypeScript compiles cleanly</done>
</task>

<task type="auto">
  <name>Task 2: Wire Complete Request button into detail page and modal</name>
  <files>components/requests/request-detail-actions.tsx, components/requests/request-view-modal.tsx</files>
  <action>
**In request-detail-actions.tsx:**

1. Import `completeRequest` from `@/app/actions/request-actions` and `CheckSquare` from `lucide-react`.
2. Import `useAction` from `next-safe-action/hooks` and `InlineFeedback` from `@/components/inline-feedback`.
3. Add `isPic` derivation: `const isPic = request.assigned_to === currentUserId`.
4. Add `canComplete` derivation: `(isPic || isGaLeadOrAdmin) && ['triaged', 'in_progress'].includes(request.status)`.
5. Add `canComplete` to the `hasAnyAction` check.
6. Add state for feedback: `const [completeFeedback, setCompleteFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null)`.
7. Wire `useAction(completeRequest)` with `onSuccess` calling `onActionSuccess` + set success feedback, and `onError` setting error feedback.
8. Add a "Complete Request" button in the left (primary CTA) section, positioned after the Triage button and before Accept Work. Use green styling (`bg-green-600 hover:bg-green-700 text-white`). Icon: `CheckSquare`. Only render when `canComplete` is true.
9. On click, call the action with `{ id: request.id }`. Use a simple confirm via `window.confirm('Complete this request? It will be sent to the requester for acceptance.')` before executing.
10. Show InlineFeedback below the action buttons div if completeFeedback is set.

**In request-view-modal.tsx:**

1. Import `completeRequest` from `@/app/actions/request-actions` and `CheckSquare` from `lucide-react`.
2. Add `isPic` derivation near existing role derivations (around line 434): `const isPic = request?.assigned_to === currentUserId`.
3. Add `canComplete` derivation: `(isPic || isGaLeadOrAdmin) && ['triaged', 'in_progress'].includes(request?.status ?? '')`.
4. Add state: `const [completing, setCompleting] = useState(false)`.
5. Create handler `handleComplete`:
   - Show `window.confirm('Complete this request? It will be sent to the requester for acceptance.')`.
   - If confirmed, set completing=true, call `completeRequest({ id: request!.id })`, on success call handleActionSuccess, on error alert the error, finally set completing=false.
6. In the sticky action bar's left div (primary actions), add a "Complete Request" button after the Update Request button and before Accept Work. Render only when `canComplete`. Use green styling, `CheckSquare` icon, disabled while `completing`. Size="sm" to match other buttons.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Complete Request button visible for PIC and GA Lead/Admin on triaged/in_progress requests in both detail page and modal views. Requester without PIC role does not see the button.</done>
</task>

</tasks>

<verification>
- TypeScript compiles: `npx tsc --noEmit`
- ESLint passes: `npm run lint`
- Build succeeds: `npm run build`
</verification>

<success_criteria>
- PIC (assigned_to) sees "Complete Request" button on triaged and in_progress requests
- GA Lead/Admin sees "Complete Request" button on triaged and in_progress requests
- Regular requester (not PIC) does NOT see the button
- Clicking the button moves request to pending_acceptance with completed_at timestamp
- Requester receives notification about completion
- Normal accept/reject flow continues from pending_acceptance status
</success_criteria>

<output>
After completion, create `.planning/quick/29-allow-pic-or-ga-lead-to-complete-a-reque/29-SUMMARY.md`
</output>
