---
phase: quick
plan: 260317-fri
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-transfer-dialog.tsx
  - app/actions/asset-actions.ts
autonomous: true
requirements: [QUICK-BLOCK-SAME-LOCATION-TRANSFER]

must_haves:
  truths:
    - "Location dropdown in Move to Location mode filters out the asset's current location"
    - "createTransfer server action rejects when to_location_id equals asset.location_id"
  artifacts:
    - path: "components/assets/asset-transfer-dialog.tsx"
      provides: "Filter current location from location options"
      contains: "asset.location_id"
    - path: "app/actions/asset-actions.ts"
      provides: "Server-side same-location validation"
      contains: "Destination location is the same"
  key_links: []
---

<objective>
Prevent moving an asset to the same location it's already at. Filter current location from the dropdown options and add server-side validation.
</objective>

<tasks>
<task type="auto">
  <name>Task 1: Filter current location from dropdown and add server validation</name>
  <files>components/assets/asset-transfer-dialog.tsx, app/actions/asset-actions.ts</files>
  <action>Already executed inline — UI filter + server guard.</action>
  <verify><automated>npx tsc --noEmit</automated></verify>
  <done>
    - Current location filtered from dropdown options
    - Server rejects same-location transfers
  </done>
</task>
</tasks>

<output>
After completion, create `.planning/quick/260317-fri-prevent-moving-asset-to-same-location-as/260317-fri-SUMMARY.md`
</output>
