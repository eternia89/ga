# Quick Task 20: Audit request/job/approval flows for deadlocks - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Test all flows of request, jobs, approvals and identify deadlocks where the UI doesn't allow progress. Document findings and plan fixes.

</domain>

<decisions>
## Implementation Decisions

### Scope of Output
- Create a deadlock analysis document with detailed fix descriptions
- Do NOT implement fixes — user will review the document before any implementation
- Each deadlock should have: description, affected role(s), current state, what's missing, proposed fix

### Testing Method
- Code review only — trace through server actions, status transitions, and UI components
- Find impossible/missing transitions, missing action buttons, unreachable states
- No manual app testing needed

### Role Coverage
- Audit all 5 roles: Admin, GA Lead, GA Staff, Finance Approver, Requester
- Deadlocks may be role-specific (e.g., a role that can see a state but has no action to progress it)

</decisions>

<specifics>
## Specific Ideas

- Check every status in every entity's state machine and verify the UI provides action buttons to transition out of it
- Check that the "happy path" completes end-to-end for each flow: request→triage→job→approval→completion→acceptance→feedback→closed
- Check edge cases: what happens when budget threshold is not configured, when no finance approver exists, when PIC is not assigned
- Check inventory flows: transfer stuck in pending, asset stuck in non-terminal state with no UI to change it
- Check maintenance: schedule paused with no way to resume, PM job stuck

</specifics>
