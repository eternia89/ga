---
status: resolved
trigger: "PIC assignment uses a separate assign dialog instead of being an inline-editable field on the job detail page. Estimated cost treated as special field."
created: 2026-02-26T00:00:00Z
updated: 2026-02-26T00:00:00Z
---

## Current Focus

hypothesis: confirmed - two design violations found
test: code review complete
expecting: n/a
next_action: return diagnosis

## Symptoms

expected: PIC field should be inline-editable on the job detail page (like Category, Location, Priority). Estimated cost should be a regular inline-editable field like all others.
actual: PIC uses a separate "Assign PIC" / "Reassign PIC" button+dialog in job-detail-actions.tsx. Estimated cost has its own special section with unique styling.
errors: n/a (design issue, not runtime error)
reproduction: View any job detail page as GA Lead/Admin
started: From initial implementation

## Eliminated

(none needed — root cause identified on first pass)

## Evidence

- timestamp: 2026-02-26
  checked: job-detail-info.tsx lines 342-352
  found: PIC field is display-only, never enters edit mode. Shows `job.pic?.full_name` or "Unassigned" but has no editing UI when `isEditing` is true.
  implication: PIC was deliberately omitted from the inline edit fields

- timestamp: 2026-02-26
  checked: job-detail-actions.tsx lines 338-490
  found: PIC assignment is handled via a separate Dialog (`assignOpen` state) with a Combobox. Triggered by "Assign PIC" / "Reassign PIC" button in the actions bar.
  implication: PIC assignment was designed as a workflow action rather than an inline field edit

- timestamp: 2026-02-26
  checked: job-detail-actions.tsx line 96-97
  found: `canAssign` only when status=created; `canReassign` when status in [assigned, in_progress, pending_approval, pending_completion_approval]. Uses separate `assignJob` server action.
  implication: Assign has status-based visibility rules + uses its own server action (separate from updateJob)

- timestamp: 2026-02-26
  checked: job-detail-info.tsx lines 247-339
  found: Estimated Cost has its own special section with bg-muted/50 background, 2xl font, lock/unlock badges, and separate budget editing flow (isBudgetEditing state, handleBudgetSubmit). Uses a separate `updateJobBudget` server action.
  implication: Budget was given special prominence instead of being an inline field in the grid

- timestamp: 2026-02-26
  checked: lib/validations/job-schema.ts line 39
  found: updateJobSchema already includes `assigned_to: z.string().uuid().optional()` — the schema supports PIC updates through updateJob
  implication: Backend already supports inline PIC editing via updateJob; only UI is wrong

- timestamp: 2026-02-26
  checked: job-detail-info.tsx lines 113-137 (handleEditSave)
  found: handleEditSave calls updateJob with title, description, location_id, category_id, priority — but NOT assigned_to, even though the schema accepts it
  implication: Adding PIC to inline edit just requires adding the Combobox field + passing assigned_to in the save call

- timestamp: 2026-02-26
  checked: request-detail-info.tsx lines 253-388
  found: Request detail page handles PIC as an inline Combobox within the triage form. This is the convention — PIC editing is inline, not in a dialog.
  implication: Jobs should follow the same pattern

## Resolution

root_cause: |
  Two separate design violations in job-detail-info.tsx and job-detail-actions.tsx:

  1. **PIC field is display-only instead of inline-editable.** In job-detail-info.tsx (lines 342-352), the PIC field only shows the name/Unassigned and never switches to a Combobox in edit mode. Meanwhile, job-detail-actions.tsx has a separate Dialog-based assign flow (lines 338-490). The convention is that detail pages ARE edit pages — fields should be inline-editable. The `updateJobSchema` already accepts `assigned_to`, so the backend supports this.

  2. **Estimated cost is treated as a "special" prominent section** (lines 247-339 in job-detail-info.tsx) with its own styled card, 2xl font, lock/unlock badges, and separate editing state (isBudgetEditing). It should be a regular inline-editable field in the grid alongside Priority, Category, Location, etc.

fix: (not applied — diagnosis only)
verification: (not applicable)
files_changed: []
