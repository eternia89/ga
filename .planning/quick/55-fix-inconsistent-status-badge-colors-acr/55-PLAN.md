---
phase: quick-55
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/constants/request-status.ts
  - lib/constants/job-status.ts
  - lib/constants/asset-status.ts
  - lib/constants/approval-status.ts
  - components/approvals/approval-queue.tsx
  - components/jobs/job-columns.tsx
  - components/jobs/job-modal.tsx
  - components/maintenance/schedule-status-badge.tsx
  - app/(dashboard)/jobs/[id]/page.tsx
  - lib/dashboard/queries.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Every semantic status concept maps to exactly one color across all features"
    - "Positive/terminal-success statuses (accepted, completed, active) all use the same green shade"
    - "Pending-review statuses (pending_acceptance, pending_approval, pending_completion_approval) all use the same purple shade"
    - "All approval queue badges (type, decision) are driven by constants, not hardcoded Tailwind"
    - "PM badge uses a shared constant, not inline Tailwind in three separate files"
    - "Schedule status badge padding matches other entity badges (px-2)"
    - "Dashboard chart hex colors match the canonical Tailwind badge colors (same hue family)"
  artifacts:
    - path: "lib/constants/approval-status.ts"
      provides: "APPROVAL_TYPE_COLORS, APPROVAL_DECISION_COLORS, PM_BADGE_CLASS constants"
      exports: ["APPROVAL_TYPE_COLORS", "APPROVAL_DECISION_COLORS", "PM_BADGE_CLASS"]
    - path: "lib/constants/request-status.ts"
      provides: "accepted maps to bg-green-100 text-green-700 (not emerald)"
    - path: "lib/constants/job-status.ts"
      provides: "pending_approval AND pending_completion_approval both map to bg-violet-100 text-violet-700"
  key_links:
    - from: "components/approvals/approval-queue.tsx"
      to: "lib/constants/approval-status.ts"
      via: "imports APPROVAL_TYPE_COLORS, APPROVAL_DECISION_COLORS"
      pattern: "APPROVAL_TYPE_COLORS\\[job\\.approval_type\\]"
    - from: "components/jobs/job-columns.tsx"
      to: "lib/constants/approval-status.ts"
      via: "imports PM_BADGE_CLASS"
      pattern: "PM_BADGE_CLASS"
    - from: "components/jobs/job-modal.tsx"
      to: "lib/constants/approval-status.ts"
      via: "imports PM_BADGE_CLASS"
      pattern: "PM_BADGE_CLASS"
    - from: "app/(dashboard)/jobs/[id]/page.tsx"
      to: "lib/constants/approval-status.ts"
      via: "imports PM_BADGE_CLASS"
      pattern: "PM_BADGE_CLASS"
    - from: "lib/dashboard/queries.ts"
      to: "canonical color mapping"
      via: "STATUS_HEX_COLORS and JOB_STATUS_HEX_COLORS use matching hex values"
      pattern: "STATUS_HEX_COLORS"
---

<objective>
Audit all status badge color implementations across requests, jobs, assets, schedules, and approvals. Fix every color inconsistency so each semantic status concept uses exactly one color, everywhere.

Purpose: The app has grown organically and several status values that mean the same thing (e.g., "positive outcome") use different shades (emerald vs green, violet vs purple). Approval queue badges are hardcoded with no constants. PM type badges are copy-pasted in three files. Dashboard chart hex colors are also stale (emerald/slate hex values) and do not match the corrected Tailwind badge colors. This creates visual noise and makes future color changes error-prone.

Output: Canonical color mapping in constants files, all badge renders sourced from those constants, dashboard hex colors aligned with the canonical palette.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<canonical_color_mapping>
The following is the canonical mapping to enforce. Use this as the reference during implementation.

## Semantic categories and their canonical color

| Semantic meaning | Canonical Tailwind class | Applies to |
|---|---|---|
| Neutral / initial / not yet processed | `bg-gray-100 text-gray-700` | request:submitted, job:created |
| Informational / assigned / triaged | `bg-blue-100 text-blue-700` | request:triaged, job:assigned, asset:in_transit |
| In-flight / active work | `bg-amber-100 text-amber-700` | request:in_progress, job:in_progress, asset:under_repair, schedule:paused_auto |
| Awaiting human review (pending) | `bg-violet-100 text-violet-700` | request:pending_acceptance, job:pending_approval, job:pending_completion_approval, approval:decision=pending |
| Positive outcome / done / active | `bg-green-100 text-green-700` | request:accepted, job:completed, asset:active, schedule:active, approval:decision=approved |
| Terminal failure / rejected | `bg-red-100 text-red-700` | request:rejected, asset:broken, approval:decision=rejected |
| Archived / closed / disposed | `bg-stone-100 text-stone-600` | request:cancelled, request:closed, job:cancelled, asset:sold_disposed, schedule:deactivated |
| Manual-paused | `bg-yellow-100 text-yellow-700` | schedule:paused_manual |
| Approval type: budget | `bg-violet-100 text-violet-700` | approval_queue: approval_type=budget |
| Approval type: completion | `bg-orange-100 text-orange-700` | approval_queue: approval_type=completion |
| PM job type label | `bg-blue-100 text-blue-700` | job_type=preventive_maintenance badge |

Key changes from current state:
- `request:accepted` changes from `bg-emerald-100 text-emerald-700` → `bg-green-100 text-green-700`
- `request:closed` changes from `bg-slate-100 text-slate-600` → `bg-stone-100 text-stone-600`
- `job:pending_approval` changes from `bg-purple-100 text-purple-700` → `bg-violet-100 text-violet-700`
- `job:pending_completion_approval` changes from `bg-orange-100 text-orange-700` → `bg-violet-100 text-violet-700` (it is a "waiting for human review" status, same semantic as pending_approval; orange is reserved for the approval_type=completion badge in the approval queue, not for job status badges)
- `approval:decision=pending` changes from hardcoded `bg-yellow-100 text-yellow-700` → driven by `APPROVAL_DECISION_COLORS` constant (value: `bg-violet-100 text-violet-700` to match the pending semantic)
- `approval:decision=approved` stays `bg-green-100 text-green-700`
- `approval:decision=rejected` stays `bg-red-100 text-red-700`
- `schedule-status-badge.tsx` padding corrects from `px-2.5` → `px-2` to match all other badges

Note on approval:decision=pending color: Currently hardcoded yellow. The canonical pending color is violet (matches pending_acceptance, pending_approval, pending_completion_approval). Yellow is reserved for schedule:paused_manual. Change to violet.

Note on pending_completion_approval vs approval_type=completion: These are DIFFERENT concepts. `pending_completion_approval` is a **job status** meaning "awaiting human review" → violet. `approval_type=completion` is a **badge in the approval queue** distinguishing the kind of approval → orange. Do not confuse them.

## Canonical hex colors for dashboard charts

Dashboard charts (recharts) need hex values. These must align with the Tailwind badge color families:

| Status | Old hex | New hex | Tailwind family |
|---|---|---|---|
| request:accepted | `#34d399` (emerald-400) | `#4ade80` (green-400) | green |
| request:closed | `#94a3b8` (slate-400) | `#a8a29e` (stone-400) | stone |
| job:pending_approval | `#c084fc` (purple-400) | `#a78bfa` (violet-400) | violet |
| job:pending_completion_approval | `#f97316` (orange-500) | `#a78bfa` (violet-400) | violet |
</canonical_color_mapping>

<tasks>

<task type="auto">
  <name>Task 1: Fix color constants and create approval-status constants</name>
  <files>
    lib/constants/request-status.ts,
    lib/constants/job-status.ts,
    lib/constants/approval-status.ts
  </files>
  <action>
    Apply the canonical color mapping documented above.

    **lib/constants/request-status.ts** — two color fixes:
    - `accepted`: change `bg-emerald-100 text-emerald-700` → `bg-green-100 text-green-700`
    - `closed`: change `bg-slate-100 text-slate-600` → `bg-stone-100 text-stone-600`

    **lib/constants/job-status.ts** — two color fixes:
    - `pending_approval`: change `bg-purple-100 text-purple-700` → `bg-violet-100 text-violet-700`
    - `pending_completion_approval`: change `bg-orange-100 text-orange-700` → `bg-violet-100 text-violet-700`
      Rationale: `pending_completion_approval` is a job status meaning "awaiting human review" — same semantic as `pending_approval`. Orange is reserved for the approval_type=completion badge in the approval queue, which is a different UI concept. Both pending job statuses must use violet.

    **lib/constants/approval-status.ts** — create this new file:
    ```typescript
    // Approval type badge colors (budget vs completion approval)
    export const APPROVAL_TYPE_COLORS: Record<string, string> = {
      budget: 'bg-violet-100 text-violet-700',
      completion: 'bg-orange-100 text-orange-700',
    };

    // Approval decision badge colors
    export const APPROVAL_DECISION_COLORS: Record<string, string> = {
      pending: 'bg-violet-100 text-violet-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };

    // Canonical Tailwind class for the PM (Preventive Maintenance) job type badge
    export const PM_BADGE_CLASS =
      'inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700';

    // Canonical labels for approval types and decisions
    export const APPROVAL_TYPE_LABELS: Record<string, string> = {
      budget: 'Budget',
      completion: 'Completion',
    };

    export const APPROVAL_DECISION_LABELS: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    ```
  </action>
  <verify>
    Run: `grep -n "emerald\|slate-100\|purple-100\|orange-100" /Users/melfice/code/ga/lib/constants/request-status.ts /Users/melfice/code/ga/lib/constants/job-status.ts` — must return no matches.
    Run: `grep -n "pending_completion_approval" /Users/melfice/code/ga/lib/constants/job-status.ts` — must show `bg-violet-100 text-violet-700` (not orange).
    Run: `cat /Users/melfice/code/ga/lib/constants/approval-status.ts` — must show all 5 exports.
  </verify>
  <done>
    request-status.ts uses green for accepted and stone for closed. job-status.ts uses violet for both pending_approval and pending_completion_approval. approval-status.ts exists with APPROVAL_TYPE_COLORS, APPROVAL_DECISION_COLORS, PM_BADGE_CLASS, and label constants.
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace hardcoded badge colors with constants in all consumer files</name>
  <files>
    components/approvals/approval-queue.tsx,
    components/jobs/job-columns.tsx,
    components/jobs/job-modal.tsx,
    components/maintenance/schedule-status-badge.tsx,
    app/(dashboard)/jobs/[id]/page.tsx,
    lib/dashboard/queries.ts
  </files>
  <action>
    **components/approvals/approval-queue.tsx:**
    - Add import: `import { APPROVAL_TYPE_COLORS, APPROVAL_TYPE_LABELS, APPROVAL_DECISION_COLORS, APPROVAL_DECISION_LABELS } from '@/lib/constants/approval-status';`
    - Replace the approval_type Badge block (currently two conditional `<Badge className="bg-purple-100...">Budget</Badge>` and `<Badge className="bg-orange-100...">Completion</Badge>`) with:
      ```tsx
      <Badge className={`${APPROVAL_TYPE_COLORS[job.approval_type] ?? 'bg-gray-100 text-gray-700'} border-0 whitespace-nowrap`}>
        {APPROVAL_TYPE_LABELS[job.approval_type] ?? job.approval_type}
      </Badge>
      ```
    - Replace the three decision Badge blocks (currently three if blocks with hardcoded yellow/green/red) with:
      ```tsx
      <Badge className={`${APPROVAL_DECISION_COLORS[job.decision] ?? 'bg-gray-100 text-gray-700'} border-0`}>
        {APPROVAL_DECISION_LABELS[job.decision] ?? job.decision}
      </Badge>
      ```

    **components/jobs/job-columns.tsx:**
    - Add import: `import { PM_BADGE_CLASS } from '@/lib/constants/approval-status';`
    - Replace the inline `<span className="inline-flex items-center rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700 shrink-0">PM</span>` with `<span className={`${PM_BADGE_CLASS} shrink-0`}>PM</span>` — note the existing code uses `px-1.5` (slightly tighter for the table cell). Keep the `shrink-0` class appended. The PM_BADGE_CLASS uses `px-2`; it's fine to keep `px-1.5` here by using the constant's base classes minus the padding and appending it, OR just use `PM_BADGE_CLASS` and accept `px-2`. Use PM_BADGE_CLASS directly and append `shrink-0` — the `px-2` from the constant is fine.

    **components/jobs/job-modal.tsx:**
    - Add import: `import { PM_BADGE_CLASS } from '@/lib/constants/approval-status';`
    - Replace `<span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">PM</span>` with `<span className={PM_BADGE_CLASS}>PM</span>`

    **app/(dashboard)/jobs/[id]/page.tsx:**
    - Add import: `import { PM_BADGE_CLASS } from '@/lib/constants/approval-status';`
    - Replace the same hardcoded PM span with `<span className={PM_BADGE_CLASS}>PM</span>`

    **components/maintenance/schedule-status-badge.tsx:**
    - Change `px-2.5` → `px-2` in the badge span className to match all other entity status badges

    **lib/dashboard/queries.ts:**
    - Remove the local `JOB_STATUS_LABELS` const (lines 27-35) — it's a duplicate of the exported constant in `lib/constants/job-status.ts`
    - Add import at top: `import { JOB_STATUS_LABELS } from '@/lib/constants/job-status';`
    - The file already imports from request-status. Keep existing imports, just add this one.
    - Update `STATUS_HEX_COLORS` (the request status hex map):
      - Change `accepted` from `'#34d399'` (emerald-400) to `'#4ade80'` (green-400) — aligns with bg-green-100 badge
      - Change `closed` from `'#94a3b8'` (slate-400) to `'#a8a29e'` (stone-400) — aligns with bg-stone-100 badge
    - Update `JOB_STATUS_HEX_COLORS`:
      - Change `pending_approval` from `'#c084fc'` (purple-400) to `'#a78bfa'` (violet-400) — aligns with bg-violet-100 badge
      - Change `pending_completion_approval` from `'#f97316'` (orange-500) to `'#a78bfa'` (violet-400) — aligns with the corrected bg-violet-100 job status badge
    - Verify no other local redefinitions remain after removal of JOB_STATUS_LABELS.

    After all changes, run: `npm run lint` and fix any TypeScript or ESLint errors.
  </action>
  <verify>
    Run: `npm run build 2>&1 | tail -20` — must complete with no TypeScript errors.
    Run: `grep -n "bg-purple-100\|bg-yellow-100\|bg-orange-100\|bg-green-100\|bg-red-100" /Users/melfice/code/ga/components/approvals/approval-queue.tsx` — must return no matches.
    Run: `grep -n "approval-status" /Users/melfice/code/ga/components/approvals/approval-queue.tsx` — must return at least one match (confirms the import from approval-status.ts was added).
    Run: `grep -n "bg-blue-100" /Users/melfice/code/ga/components/jobs/job-columns.tsx /Users/melfice/code/ga/components/jobs/job-modal.tsx /Users/melfice/code/ga/app/\(dashboard\)/jobs/\[id\]/page.tsx` — must return no matches (all PM badges now use PM_BADGE_CLASS).
    Run: `grep -n "px-2.5" /Users/melfice/code/ga/components/maintenance/schedule-status-badge.tsx` — must return no matches.
    Run: `grep -n "#34d399\|#94a3b8\|#c084fc" /Users/melfice/code/ga/lib/dashboard/queries.ts` — must return no matches (stale emerald, slate, and purple hex values removed).
    Run: `grep -n "pending_completion_approval" /Users/melfice/code/ga/lib/dashboard/queries.ts` — must show `'#a78bfa'` (violet-400).
  </verify>
  <done>
    approval-queue.tsx sources all badge colors from APPROVAL_TYPE_COLORS and APPROVAL_DECISION_COLORS with the import confirmed. All three PM badge occurrences use PM_BADGE_CLASS. Schedule status badge uses px-2. queries.ts uses the shared JOB_STATUS_LABELS import and STATUS_HEX_COLORS/JOB_STATUS_HEX_COLORS use corrected hex values aligned with the canonical Tailwind palette. Build passes with zero TypeScript errors.
  </done>
</task>

</tasks>

<verification>
After both tasks complete, verify the canonical mapping is fully enforced:

1. grep for any remaining `bg-emerald-100` in components/ — must be zero
2. grep for any remaining `bg-slate-100` in components/ — must be zero (stone is now canonical for archived states)
3. grep for any remaining `bg-purple-100` in components/ or lib/ (outside node_modules) — must be zero
4. grep for `#34d399` or `#94a3b8` in lib/dashboard/queries.ts — must be zero (stale hex values gone)
5. grep for `#c084fc` or `#f97316` in lib/dashboard/queries.ts — must be zero (purple and orange hex replaced with violet)
6. `npm run build` completes with no errors
7. Visual check: open `/jobs` list — PM badge appears, job status badges use correct shades; pending_completion_approval shows violet (not orange)
8. Visual check: open `/admin/approvals` — Budget badge is violet, Completion badge is orange, decision badges (Pending/Approved/Rejected) match violet/green/red
</verification>

<success_criteria>
- Zero instances of `bg-emerald-100`, `bg-slate-100`, or `bg-purple-100` used for status badges in the app (these shades are now retired from status badge usage)
- `pending_completion_approval` job status badge is violet, not orange (orange is reserved for approval_type=completion in the approval queue)
- `approval-status.ts` is the single source of truth for approval type and decision badge colors
- PM type badge sourced from `PM_BADGE_CLASS` constant in all three render locations
- Schedule status badge padding is `px-2` matching all other badges
- `lib/dashboard/queries.ts` has no local JOB_STATUS_LABELS duplicate and no stale emerald/slate/purple hex values
- `npm run build` passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/55-fix-inconsistent-status-badge-colors-acr/55-SUMMARY.md` documenting:
- Canonical color mapping table (final)
- Files changed and what changed in each
- Any deviations from the plan and why
</output>
