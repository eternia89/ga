---
phase: quick-22
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(dashboard)/requests/page.tsx
  - app/(dashboard)/jobs/page.tsx
  - app/(dashboard)/inventory/page.tsx
  - app/(dashboard)/maintenance/templates/page.tsx
  - app/(dashboard)/maintenance/page.tsx
  - components/requests/request-create-dialog.tsx
  - components/jobs/job-create-dialog.tsx
  - components/assets/asset-create-dialog.tsx
  - components/maintenance/template-create-dialog.tsx
  - components/maintenance/schedule-create-dialog.tsx
autonomous: true
requirements: [QUICK-22]

must_haves:
  truths:
    - "Visiting /requests?action=create auto-opens the New Request dialog for permitted users"
    - "Visiting /jobs?action=create auto-opens the New Job dialog for ga_lead/admin"
    - "Visiting /inventory?action=create auto-opens the New Asset dialog for ga_staff/ga_lead/admin"
    - "Visiting /maintenance/templates?action=create auto-opens the New Template dialog for ga_lead/admin"
    - "Visiting /maintenance?action=create auto-opens the New Schedule dialog for ga_lead/admin"
    - "Users without create permission visiting any ?action=create URL see the page normally with no dialog"
    - "The ?action=create param can coexist with ?view={id} param"
  artifacts:
    - path: "components/requests/request-create-dialog.tsx"
      provides: "RequestCreateDialog with initialOpen prop"
      contains: "initialOpen"
    - path: "components/jobs/job-create-dialog.tsx"
      provides: "JobCreateDialog with initialOpen prop"
      contains: "initialOpen"
    - path: "components/assets/asset-create-dialog.tsx"
      provides: "AssetCreateDialog with initialOpen prop"
      contains: "initialOpen"
    - path: "components/maintenance/template-create-dialog.tsx"
      provides: "TemplateCreateDialog with initialOpen prop"
      contains: "initialOpen"
    - path: "components/maintenance/schedule-create-dialog.tsx"
      provides: "ScheduleCreateDialog with initialOpen prop"
      contains: "initialOpen"
  key_links:
    - from: "app/(dashboard)/requests/page.tsx"
      to: "components/requests/request-create-dialog.tsx"
      via: "initialOpen prop from action searchParam"
      pattern: "initialOpen.*action.*create"
    - from: "app/(dashboard)/jobs/page.tsx"
      to: "components/jobs/job-create-dialog.tsx"
      via: "initialOpen prop from action searchParam"
      pattern: "initialOpen.*action.*create"
---

<objective>
Add permalink support (`?action=create`) to all 5 create modals so they auto-open on page load when the URL param is present. Silently ignore if user lacks permission.

Purpose: Allow users to share direct links to create flows (e.g., `/requests?action=create`) and enable future extensibility for other action params.
Output: 5 page.tsx files updated to read `action` searchParam, 5 create dialog components updated to accept `initialOpen` prop.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/quick/22-add-permalink-support-to-all-5-create-mo/22-CONTEXT.md
</context>

<interfaces>
<!-- All 5 create dialogs follow identical pattern -->
<!-- Current: useState(false) for open state, no initialOpen prop -->
<!-- Each page.tsx: searchParams: Promise<{ view?: string }> -->
<!-- Permission checks already gate whether the dialog component renders -->

From components/requests/request-create-dialog.tsx:
```typescript
interface RequestCreateDialogProps {
  locations: Location[];
}
export function RequestCreateDialog({ locations }: RequestCreateDialogProps) {
  const [open, setOpen] = useState(false);
```

From app/(dashboard)/requests/page.tsx:
```typescript
interface PageProps {
  searchParams: Promise<{ view?: string }>;
}
// Dialog only renders inside permission check:
// {['ga_lead', 'admin', 'finance_approver'].includes(profile.role) && (... not this one
// RequestCreateDialog has no role guard — all users can create requests
```

Permission guards per page (who sees the create button):
- Requests: ALL users (no guard, dialog always rendered)
- Jobs: ga_lead, admin
- Inventory: ga_staff, ga_lead, admin
- Templates: ga_lead, admin
- Schedules: ga_lead, admin
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add initialOpen prop to all 5 create dialog components</name>
  <files>
    components/requests/request-create-dialog.tsx,
    components/jobs/job-create-dialog.tsx,
    components/assets/asset-create-dialog.tsx,
    components/maintenance/template-create-dialog.tsx,
    components/maintenance/schedule-create-dialog.tsx
  </files>
  <action>
For each of the 5 create dialog components, make two changes:

1. Add `initialOpen?: boolean` to the props interface
2. Change `useState(false)` to `useState(initialOpen ?? false)`

Example for RequestCreateDialog:
```typescript
interface RequestCreateDialogProps {
  locations: Location[];
  initialOpen?: boolean;  // ADD
}

export function RequestCreateDialog({ locations, initialOpen }: RequestCreateDialogProps) {
  const [open, setOpen] = useState(initialOpen ?? false);  // CHANGE
```

Apply the same pattern to all 5 dialogs. No other changes needed — the dialog already uses controlled `open` state with `onOpenChange={setOpen}`, so closing works normally.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>All 5 create dialog components accept initialOpen prop and use it as initial useState value</done>
</task>

<task type="auto">
  <name>Task 2: Wire action searchParam from page.tsx to create dialogs</name>
  <files>
    app/(dashboard)/requests/page.tsx,
    app/(dashboard)/jobs/page.tsx,
    app/(dashboard)/inventory/page.tsx,
    app/(dashboard)/maintenance/templates/page.tsx,
    app/(dashboard)/maintenance/page.tsx
  </files>
  <action>
For each of the 5 page.tsx files, make three changes:

1. Update searchParams type to include `action`:
```typescript
interface PageProps {
  searchParams: Promise<{ view?: string; action?: string }>;
}
```

2. Destructure `action` alongside `view`:
```typescript
const { view, action } = await searchParams;
```

3. Pass `initialOpen` to the create dialog component. The dialog only renders inside existing permission guards, so if the user lacks permission the dialog never renders and the param is silently ignored. Add the prop:
```typescript
<RequestCreateDialog locations={locations} initialOpen={action === 'create'} />
```

Apply to all 5 pages:
- requests/page.tsx: `<RequestCreateDialog locations={locations} initialOpen={action === 'create'} />`
- jobs/page.tsx: `<JobCreateDialog ... initialOpen={action === 'create'} />`
- inventory/page.tsx: `<AssetCreateDialog ... initialOpen={action === 'create'} />`
- maintenance/templates/page.tsx: `<TemplateCreateDialog categories={assetCategories ?? []} initialOpen={action === 'create'} />`
- maintenance/page.tsx: `<ScheduleCreateDialog templates={templateList} assets={assetList} initialOpen={action === 'create'} />`

The `?action=create` param stays in the URL (consistent with existing `?view={id}` pattern per CONTEXT.md decision).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | head -30 && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>All 5 pages read action searchParam and pass initialOpen to their create dialog. Unauthorized users see the page normally with no dialog. Build succeeds.</done>
</task>

</tasks>

<verification>
1. `npm run build` succeeds with no errors
2. TypeScript compilation passes
3. Each page.tsx destructures `action` from searchParams
4. Each create dialog accepts and uses `initialOpen` prop
</verification>

<success_criteria>
- Visiting any of the 5 pages with `?action=create` auto-opens the create modal for users with permission
- Visiting with `?action=create` as a user without permission shows the page normally (no error, no modal)
- Existing `?view={id}` functionality is unaffected
- Both params can coexist: `?view={id}&action=create`
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/22-add-permalink-support-to-all-5-create-mo/22-SUMMARY.md`
</output>
