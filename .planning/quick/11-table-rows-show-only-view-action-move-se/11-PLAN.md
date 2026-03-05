---
phase: quick-11
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-columns.tsx
  - components/maintenance/template-columns.tsx
  - components/maintenance/schedule-columns.tsx
  - components/maintenance/schedule-view-modal.tsx
  - components/assets/asset-view-modal.tsx
autonomous: true
requirements: [QUICK-11]

must_haves:
  truths:
    - "All 5 table action columns render only a View button"
    - "Job modal sticky bar already has Cancel — no regression"
    - "Template modal sticky bar already has Deactivate/Reactivate — no regression"
    - "Schedule modal sticky bar shows Pause, Resume, AND Deactivate buttons"
    - "Asset modal sticky bar shows status change and transfer action buttons"
  artifacts:
    - path: "components/jobs/job-columns.tsx"
      provides: "Job table actions column with View only"
      contains: "View"
    - path: "components/maintenance/template-columns.tsx"
      provides: "Template table actions column with View only"
      contains: "View"
    - path: "components/maintenance/schedule-columns.tsx"
      provides: "Schedule table actions column with View only"
      contains: "View"
    - path: "components/maintenance/schedule-view-modal.tsx"
      provides: "Schedule modal with Deactivate button in sticky bar"
      contains: "Deactivate"
    - path: "components/assets/asset-view-modal.tsx"
      provides: "Asset modal with status change and transfer buttons in sticky bar"
      contains: "Change Status"
  key_links:
    - from: "components/maintenance/schedule-view-modal.tsx"
      to: "app/actions/schedule-actions.ts"
      via: "deleteSchedule import for Deactivate action"
      pattern: "deleteSchedule"
    - from: "components/assets/asset-view-modal.tsx"
      to: "components/assets/asset-status-change-dialog.tsx"
      via: "status change button triggers existing dialog"
      pattern: "setShowStatusDialog"
---

<objective>
Strip all secondary action buttons from table row action columns (Jobs, Templates, Schedules) so each row shows only "View". Add missing Deactivate button to schedule modal sticky bar. Add status change and transfer buttons to asset modal sticky bar.

Purpose: Consistent UX where tables are for browsing/viewing and modals are for taking action.
Output: 5 modified component files with clean separation of concerns.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@components/jobs/job-columns.tsx
@components/maintenance/template-columns.tsx
@components/maintenance/schedule-columns.tsx
@components/maintenance/schedule-view-modal.tsx
@components/assets/asset-view-modal.tsx
@components/assets/asset-detail-actions.tsx

<interfaces>
<!-- Key imports and patterns the executor needs -->

From app/actions/schedule-actions.ts:
```typescript
export const deactivateSchedule  // sets is_active = false (pause)
export const activateSchedule    // sets is_active = true (resume)
export const deleteSchedule      // soft-delete via deleted_at (permanent deactivation)
```

From components/assets/asset-view-modal.tsx (existing state):
```typescript
// Already has these state variables for dialogs:
const [showStatusDialog, setShowStatusDialog] = useState(false);
const [showTransferDialog, setShowTransferDialog] = useState(false);
const [showTransferRespondDialog, setShowTransferRespondDialog] = useState(false);
const [transferRespondMode, setTransferRespondMode] = useState<'accept' | 'reject'>('accept');
```

From components/maintenance/schedule-list.tsx (table meta callbacks):
```typescript
const meta: ScheduleTableMeta = {
  onView: ...,
  onDeactivate: canManage ? handleDeactivate : undefined,  // calls deactivateSchedule (pause)
  onActivate: canManage ? handleActivate : undefined,       // calls activateSchedule (resume)
  onDelete: canManage ? handleDelete : undefined,           // calls deleteSchedule (permanent)
};
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Strip secondary actions from job, template, and schedule table columns</name>
  <files>components/jobs/job-columns.tsx, components/maintenance/template-columns.tsx, components/maintenance/schedule-columns.tsx</files>
  <action>
In job-columns.tsx:
- Remove the Cancel button and its canCancel logic from the actions column cell. Keep ONLY the View button.
- Remove `onCancel` from the JobTableMeta type.
- Remove `currentUserId` and `currentUserRole` from JobTableMeta (no longer needed for row-level permission checks).
- Reduce the actions column `size` from 150 to 80.

In template-columns.tsx:
- Remove the Deactivate/Reactivate buttons from the actions column cell. Keep ONLY the View button.
- Remove `onDeactivate`, `onReactivate`, and `currentUserRole` from TemplateTableMeta type.
- Remove the `canManage` variable from the actions cell.
- Reduce the actions column `size` from 150 to 80.

In schedule-columns.tsx:
- Remove the Pause/Resume/Deactivate buttons from the actions column cell. Keep ONLY the View button.
- Remove `onDeactivate`, `onActivate`, `onDelete`, and `currentUserRole` from ScheduleTableMeta type.
- Remove the `canManage` variable from the actions cell.
- Reduce the actions column `size` from 120 to 80.

IMPORTANT: After removing meta type fields, check that the list components (schedule-list.tsx, template-list.tsx, job table parent) will not have TypeScript errors from passing removed fields. The removed fields will become extra properties which TS allows by default on object literals passed to meta. If any file uses strict type assertion, it may error — but TanStack Table meta is typed as `unknown` internally so extra fields are harmless.
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>All 3 table action columns render only View button. No Cancel in job table, no Deactivate/Reactivate in template table, no Pause/Resume/Deactivate in schedule table.</done>
</task>

<task type="auto">
  <name>Task 2: Add Deactivate to schedule modal and action buttons to asset modal sticky bar</name>
  <files>components/maintenance/schedule-view-modal.tsx, components/assets/asset-view-modal.tsx</files>
  <action>
In schedule-view-modal.tsx:
- Import `deleteSchedule` from `@/app/actions/schedule-actions` (already imports deactivateSchedule and activateSchedule).
- Add a `handleDeactivate` handler that calls `deleteSchedule({ id: schedule.id })`, shows success feedback "Schedule deactivated.", calls handleActionSuccess, then closes the modal via `onOpenChange(false)`.
- In the sticky bar, add a Deactivate button AFTER the existing Pause/Resume button. The Deactivate button should:
  - Use `variant="outline"` `size="sm"` with `className="text-destructive hover:text-destructive"`
  - Show "Processing..." when actionPending
  - Only render when `canManage` is true (same guard as Pause/Resume)
  - Call handleDeactivate on click
- Wrap Pause/Resume and Deactivate in the same flex container.

In asset-view-modal.tsx:
- Replace the current minimal sticky bar (just shows display_id and name) with a functional sticky bar matching the pattern in job-view-modal.tsx.
- The sticky bar should have:
  - Left side: feedback messages (add `const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);` — or reuse existing state if available)
  - Right side: action buttons based on existing permission/state logic already computed in the component:
    - "Change Status" button: renders for GA Staff or higher (`['ga_staff', 'ga_lead', 'admin'].includes(currentUserRole)`) when asset is NOT sold_disposed and NOT in transit (has pending transfer). Calls `setShowStatusDialog(true)`. Use `variant="outline"` `size="sm"`.
    - "Transfer" button: renders for GA Staff or higher when asset is NOT sold_disposed AND no pending transfer. Calls `setShowTransferDialog(true)`. Use `variant="outline"` `size="sm"`.
    - "Accept Transfer" button: renders when there IS a pending transfer AND (current user is receiver OR is GA Lead/Admin). Calls `openTransferRespond('accept')`. Use `size="sm"` with green styling (`className="bg-green-600 hover:bg-green-700 text-white"`).
    - "Reject Transfer" button: same condition as Accept. Calls `openTransferRespond('reject')`. Use `variant="outline"` `size="sm"` with destructive text.
    - "Cancel Transfer" button: renders when pending transfer exists AND (current user is initiator OR GA Lead/Admin). Use `variant="outline"` `size="sm"` with destructive text. This should trigger the cancel transfer logic already in AssetDetailActions — but since that component handles its own AlertDialog, leave the cancel logic there. Instead, just don't duplicate cancel in the sticky bar. Only add Change Status, Transfer, Accept Transfer, and Reject Transfer.
  - Keep the info text (display_id + name) on the left as a subtle label, with action buttons on the right.
- Import InlineFeedback if not already imported.
  </action>
  <verify>npm run build 2>&1 | tail -20</verify>
  <done>Schedule modal sticky bar shows Pause/Resume AND Deactivate buttons. Asset modal sticky bar shows contextual status change and transfer action buttons instead of being info-only.</done>
</task>

</tasks>

<verification>
npm run build completes without errors. Visual inspection confirms:
1. Job table rows: only View button
2. Template table rows: only View button
3. Schedule table rows: only View button
4. Schedule modal: Pause/Resume + Deactivate in sticky bar
5. Asset modal: Change Status + Transfer buttons in sticky bar (contextual based on asset state and user role)
</verification>

<success_criteria>
- All 5 entity tables show only "View" as the row action
- Schedule modal has Deactivate button that soft-deletes the schedule
- Asset modal sticky bar has functional status change and transfer buttons
- Build passes with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/11-table-rows-show-only-view-action-move-se/11-SUMMARY.md`
</output>
