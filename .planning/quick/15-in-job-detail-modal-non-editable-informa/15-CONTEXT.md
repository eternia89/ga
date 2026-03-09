# Quick Task 15: Job detail modal non-editable info placement - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

In job detail modal, non-editable information should be placed below the ID (current implementation) without duplicating on the other section

</domain>

<decisions>
## Implementation Decisions

### Which fields are non-editable
- Header-only info: Status badge, priority badge, PM badge, creator name, created date
- These are already in the header and are never editable through the form

### Priority duplication
- Remove priority from the form when in read-only mode
- Show priority badge in header only when form is read-only
- Show priority in form field only when editable (canEdit = true)

### Info section layout
- Inline with ID row: keep everything on 1-2 lines after the ID
- Line 1: JOB-XXX [Status] [Priority] [PM]
- Line 2: Creator name · Created date
- Minimal vertical space, similar to current layout but restructured

</decisions>

<specifics>
## Specific Ideas

- Current header already has this layout (lines 890-939 of job-modal.tsx)
- Priority badge is in header + form field is in JobForm — need to conditionally hide form field when readOnly
- No new components needed, just conditional rendering adjustments

</specifics>
