---
phase: quick
plan: 260318-bah
type: execute
wave: 1
depends_on: []
files_modified:
  - app/actions/asset-actions.ts
  - components/assets/asset-transfer-respond-modal.tsx
autonomous: true
requirements: [QUICK-TRANSFER-SECURITY-FIXES]
must_haves:
  truths:
    - "createTransfer validates receiver company_id matches asset company_id"
    - "acceptTransfer rolls back movement to pending if asset update fails"
    - "Location-only transfer clears holder_id (sets to null)"
    - "cancelTransfer adds company_id guard on adminSupabase update"
    - "Respond modal shows warning if photo upload fails after accept/reject"
  artifacts:
    - path: "app/actions/asset-actions.ts"
      provides: "Cross-company guard, rollback, holder_id clear, company_id guard"
      contains: "company_id"
    - path: "components/assets/asset-transfer-respond-modal.tsx"
      provides: "Photo upload error handling with user-facing warning"
      contains: "uploadRes.ok"
  key_links: []
---
<objective>Fix 5 security/correctness issues in asset transfer actions.</objective>
<tasks>
<task type="auto">
  <name>Task 1: All 5 fixes</name>
  <files>app/actions/asset-actions.ts, components/assets/asset-transfer-respond-modal.tsx</files>
  <action>Applied all 5 fixes inline.</action>
  <verify><automated>npx tsc --noEmit</automated></verify>
  <done>All 5 security/correctness issues resolved</done>
</task>
</tasks>
