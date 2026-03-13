---
phase: quick-72
plan: 01
subsystem: maintenance
tags: [ui, schedule, cleanup]
dependency_graph:
  requires: []
  provides: [borderless-schedule-sections]
  affects: [schedule-detail, schedule-form, schedule-view-modal]
tech_stack:
  added: []
  patterns: [space-y-4-section-wrapper]
key_files:
  created: []
  modified:
    - components/maintenance/schedule-detail.tsx
    - components/maintenance/schedule-form.tsx
decisions: []
metrics:
  duration_minutes: 1
  completed: "2026-03-13T11:10:29Z"
  tasks_completed: 1
  tasks_total: 1
---

# Quick Task 72: Remove Rounded Border Separators from Maintenance Schedules

Removed all 5 `rounded-lg border border-border p-6` section wrappers from schedule components, replacing with plain `space-y-4` divs for lightweight visual design matching template components.

## Task Results

### Task 1: Remove bordered section wrappers from schedule-detail.tsx and schedule-form.tsx

**Commit:** `9611087`

Replaced 5 bordered section wrappers:
- **schedule-detail.tsx** (2): "Schedule Details" and "PM Jobs" sections in the read-only view
- **schedule-form.tsx** (3): "Template & Asset" and "Schedule Configuration" in ScheduleCreateForm, "Schedule Configuration" in ScheduleEditForm

All h2 headings and Separator components preserved as visual section breaks. Delete confirmation box (`border-destructive/30`) and auto-pause notice (`border-amber-200`) intentionally preserved as they are different UI patterns.

## Verification

- `grep -c "rounded-lg border" schedule-detail.tsx` returns 2 (delete confirm + auto-pause notice only)
- `grep -c "rounded-lg border" schedule-form.tsx` returns 2 (IntervalTypeToggle button styling only)
- Zero occurrences of `border-border p-6` section wrappers remain
- `npm run build` passes with no errors

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
