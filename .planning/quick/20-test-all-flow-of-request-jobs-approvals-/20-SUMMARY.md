---
phase: quick-20
plan: 01
subsystem: workflow-audit
tags: [deadlock-analysis, state-machine, audit, request-flow, job-flow, approval-flow, asset-flow, maintenance-flow]
dependency_graph:
  requires: []
  provides: [deadlock-analysis-document]
  affects: [request-actions, job-actions, approval-actions, schedule-actions]
tech_stack:
  added: []
  patterns: [state-machine-audit, transition-tracing]
key_files:
  created:
    - .planning/quick/20-test-all-flow-of-request-jobs-approvals-/20-DEADLOCK-ANALYSIS.md
  modified: []
decisions:
  - Analysis only -- no code changes implemented
  - Identified 2 blocking issues, 7 degraded UX, 3 cosmetic across all 5 entity state machines
  - advanceFloatingSchedule TODO is the highest-priority fix (PM schedules broken without it)
  - Multi-job request premature acceptance is the second-highest priority
metrics:
  duration: 4min
  completed: 2026-03-06
---

# Quick Task 20: Deadlock Analysis Summary

Complete audit of all entity state machines (request, job, asset, inventory movement, maintenance schedule) across all 5 roles, tracing server actions and UI action components to identify deadlocks, missing transitions, and edge cases.

## What Was Done

- Traced all statuses and transitions for 5 entity types through constants, server actions, and UI components
- Mapped available UI actions per status per role for requests (11 statuses x 6 role variants), jobs (7 statuses x 5 role variants), assets (4 statuses + 4 movement statuses), and schedules (4 display statuses)
- Identified 12 issues total: 2 blocking functional bugs, 7 degraded UX problems, 3 cosmetic items
- Analyzed 7 edge cases: no budget threshold, no finance approver, no PIC, no linked requests, multi-job requests, auto-pause/resume, deactivation/reactivation

## Key Findings

### Blocking Issues
1. **advanceFloatingSchedule TODO not integrated** -- PM job completion never advances floating schedule next_due_at, causing perpetual overdue and duplicate job generation
2. **Multi-job request premature acceptance** -- When a request is linked to multiple jobs, the first job's completion moves the request to pending_acceptance even if other jobs are still in progress

### Notable Degraded UX
3. Start Work silently reroutes to pending_approval when estimated_cost > 0 -- misleading success message
4. Approval queue is read-only with no inline approve/reject buttons
5. No manual pause for maintenance schedules (only destructive deactivate exists)

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 92af395 | Complete deadlock analysis document (424 lines) |

## Deviations from Plan

None -- plan executed exactly as written.

## Self-Check: PASSED

- [x] 20-DEADLOCK-ANALYSIS.md exists (424 lines, well above 100-line minimum)
- [x] All 5 entity state machines audited
- [x] All 5 roles checked per status
- [x] Every finding has proposed fix
- [x] No code changes made -- analysis only
