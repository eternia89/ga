# Quick Task 19: Move Save to bottom bar, clean up bottom bars - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Task Boundary

Save Changes button should be in the sticky bottom bar (not hidden in scrollable form). Bottom bars should contain only action buttons + inline feedback — no informational text. Applies to all modals with sticky bottom bars.

</domain>

<decisions>
## Implementation Decisions

### Save Button Placement
- Move Save Changes button from inside the scrollable form body to the sticky bottom bar in asset-view-modal.tsx
- Use form="asset-edit-form" attribute to connect the external button to the form element
- Remove the Save button from asset-edit-form.tsx

### Info Text in Bottom Bar
- Remove the `{display_id} · {name}` informational text from the asset modal bottom bar entirely
- Header already shows this information — no need to duplicate

### Bottom Bar Pattern (All Modals)
- Bottom bars across ALL modals: only action buttons + inline feedback
- No informational text in any bottom bar
- Currently only asset modal has info text — others already follow this pattern

</decisions>

<specifics>
## Specific Ideas

Modals with sticky bottom bars:
1. `components/assets/asset-view-modal.tsx` — has info text + action buttons (NEEDS FIX: move Save here, remove info text)
2. `components/requests/request-view-modal.tsx` — already has Update button in bottom bar (OK)
3. `components/jobs/job-view-modal.tsx` — action buttons only (OK)
4. `components/maintenance/template-view-modal.tsx` — action buttons only (OK)
5. `components/maintenance/schedule-view-modal.tsx` — action buttons only (OK)

</specifics>
