---
phase: quick-34
plan: 34
type: execute
wave: 1
depends_on: []
files_modified:
  - components/approvals/approval-queue.tsx
  - app/(dashboard)/approvals/page.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Approval queue table rows have a 'View' button (not full-row click navigation)"
    - "Clicking 'View' opens the job in a JobViewModal dialog (same as jobs page)"
    - "The modal URL updates to ?view={id} — the link is shareable/permalinkable"
    - "Loading /approvals?view={id} directly opens the modal for that job"
    - "No separate approval detail page exists — navigation to /jobs/{id} is removed from this table"
  artifacts:
    - path: "components/approvals/approval-queue.tsx"
      provides: "ApprovalQueue with View button per row and embedded JobViewModal"
      contains: "JobViewModal"
    - path: "app/(dashboard)/approvals/page.tsx"
      provides: "Passes view param and user context to ApprovalQueue"
      contains: "searchParams"
  key_links:
    - from: "approval-queue.tsx TableRow"
      to: "JobViewModal"
      via: "View button sets viewJobId state; modal reads it"
      pattern: "setViewJobId"
    - from: "app/(dashboard)/approvals/page.tsx"
      to: "approval-queue.tsx"
      via: "initialViewId, currentUserId, currentUserRole props"
      pattern: "initialViewId"
---

<objective>
Convert the approval queue from navigating to /jobs/{id} on row click to opening a JobViewModal dialog via ?view={id} URL param — matching the pattern used by the jobs page.

Purpose: Finance approvers can review and act on approvals without leaving the approvals queue. The modal gives them the full job detail (approve/reject actions included) while keeping context.
Output: approval-queue.tsx with JobViewModal wired in, page.tsx passing searchParams for permalink support. No separate approval detail page to remove (there isn't one — just the row click navigation).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Key reference — the job table pattern this should match:
- `app/(dashboard)/jobs/page.tsx` passes `initialViewId={view}` from searchParams to JobTable
- `components/jobs/job-table.tsx` holds `viewJobId` state, initializes from `initialViewId`, wires JobViewModal
- `components/jobs/job-view-modal.tsx` wraps `JobModal` — accepts `jobId`, `onOpenChange`, `currentUserId`, `currentUserRole`

Current approval queue behavior: TableRow has `onClick={() => router.push('/jobs/${job.id}')}` — full-page navigation. This must be replaced with a "View" button column opening a modal.

CLAUDE.md table action pattern: ghost buttons with `text-blue-600 hover:underline` for row actions. Domain entity tables show a single "View" button.
</context>

<interfaces>
<!-- From components/jobs/job-view-modal.tsx -->
```typescript
interface JobViewModalProps {
  jobId: string | null;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  currentUserRole: string;
  onActionSuccess?: () => void;
  jobIds?: string[];
  onNavigate?: (jobId: string) => void;
}
export function JobViewModal(props: JobViewModalProps): JSX.Element
```

<!-- From components/approvals/approval-queue.tsx (current) -->
```typescript
interface ApprovalQueueProps {
  jobs: ApprovalJob[];
}
```
<!-- Must be extended to: -->
```typescript
interface ApprovalQueueProps {
  jobs: ApprovalJob[];
  initialViewId?: string;
  currentUserId: string;
  currentUserRole: string;
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Wire JobViewModal into ApprovalQueue component</name>
  <files>components/approvals/approval-queue.tsx</files>
  <action>
Refactor approval-queue.tsx to open a modal instead of navigating to the job detail page:

1. Import `JobViewModal` from `@/components/jobs/job-view-modal`.
2. Import `useRouter` is already present — keep it for any remaining navigation needs. Remove the `router.push('/jobs/${job.id}')` onClick from TableRow.
3. Add new props to `ApprovalQueueProps`: `initialViewId?: string`, `currentUserId: string`, `currentUserRole: string`.
4. Add state: `const [viewJobId, setViewJobId] = useState<string | null>(initialViewId ?? null)`.
5. Replace the full-row `onClick` and `cursor-pointer` on TableRow with a dedicated "View" button cell (last column, `w-[80px]`). Button uses ghost styling: `variant="ghost"` with `className="text-blue-600 hover:underline font-normal h-auto p-0"` and text label "View". On click: `setViewJobId(job.id)`.
6. Add a "Actions" `<TableHead className="w-[80px]">` at the end of the header row.
7. Add `<TableCell>` containing the View button at the end of each data row.
8. Remove `cursor-pointer` and `hover:bg-muted/50` from TableRow (rows are no longer clickable themselves).
9. Render `<JobViewModal>` at the bottom of the component (outside the table), passing:
   - `jobId={viewJobId}`
   - `onOpenChange={(open) => { if (!open) setViewJobId(null); }}`
   - `currentUserId={currentUserId}`
   - `currentUserRole={currentUserRole}`
   - `onActionSuccess={() => { /* router.refresh() handled by modal internally */ }}`
   - `jobIds={visibleJobs.map(j => j.id)}` (for prev/next navigation; deduplicate since same job can appear twice for budget+completion)
   - `onNavigate={setViewJobId}`
10. For `jobIds`, deduplicate by job.id using `[...new Set(visibleJobs.map(j => j.id))]` since a job can appear twice (budget row + completion row).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | grep -E "approval-queue" || echo "No TS errors in approval-queue"</automated>
  </verify>
  <done>
    - ApprovalQueueProps has initialViewId, currentUserId, currentUserRole
    - Each table row has a View button (no full-row click)
    - JobViewModal renders at bottom of component
    - TypeScript compiles without errors in this file
  </done>
</task>

<task type="auto">
  <name>Task 2: Update approvals page to pass view param and user context</name>
  <files>app/(dashboard)/approvals/page.tsx</files>
  <action>
Update the approvals page server component to support the ?view= permalink pattern:

1. Add `searchParams` to the page props interface:
   ```typescript
   interface PageProps {
     searchParams: Promise<{ view?: string }>;
   }
   export default async function ApprovalsPage({ searchParams }: PageProps)
   ```
2. At the top of the function body, destructure: `const { view } = await searchParams;`
3. Update the `<ApprovalQueue>` call to pass the new props:
   ```tsx
   <ApprovalQueue
     jobs={jobs}
     initialViewId={view}
     currentUserId={profile.id}
     currentUserRole={profile.role}
   />
   ```
No other changes needed — profile.id and profile.role are already fetched.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | grep -E "approvals/page|approval-queue" || echo "No TS errors in approvals pages"</automated>
  </verify>
  <done>
    - Page accepts searchParams with view param
    - ApprovalQueue receives initialViewId, currentUserId, currentUserRole
    - Visiting /approvals?view={jobId} opens the modal for that job
    - TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
Full TypeScript check: `cd /Users/melfice/code/ga-refactor && npx tsc --noEmit 2>&1 | tail -20`

Manual check:
1. Visit /approvals — table shows "View" button per row, no row-level click navigation
2. Click "View" on any row — JobViewModal opens with full job detail and approve/reject actions
3. Visit /approvals?view={some-job-id} — modal opens immediately (permalink works)
4. Close modal — returns to /approvals list
</verification>

<success_criteria>
- Approval queue rows have a "View" ghost button (text-blue-600 hover:underline)
- Clicking View opens JobViewModal (same dialog used by jobs page)
- ?view={id} query param enables shareable/direct links to approval details
- Finance approvers can approve/reject directly from the modal
- Full-row navigation to /jobs/{id} is removed from this table
- Zero TypeScript errors
</success_criteria>

<output>
After completion, create `.planning/quick/34-approval-detail-should-use-modal-with-pe/34-SUMMARY.md` with what was built, files changed, and any decisions made.
</output>
