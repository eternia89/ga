---
phase: quick
plan: 260317-ffi
type: execute
wave: 1
depends_on: []
files_modified:
  - components/assets/asset-status-badge.tsx
autonomous: true
requirements: [QUICK-STATUS-BADGE-OVERWRITE]

must_haves:
  truths:
    - "When showInTransit is true, only the In Transit badge is rendered (active status badge is hidden)"
    - "When showInTransit is false, the normal status badge renders as before"
  artifacts:
    - path: "components/assets/asset-status-badge.tsx"
      provides: "Conditional rendering: In Transit replaces active status"
      contains: "showInTransit"
  key_links: []
---

<objective>
When an asset is in transit, the status column should show ONLY the "In Transit" badge, not both the active status and in-transit badges. The in-transit status overwrites/replaces the active status entirely.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/assets/asset-status-badge.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: In-transit badge replaces active status badge</name>
  <files>components/assets/asset-status-badge.tsx</files>
  <action>
Modify the return JSX so that when `showInTransit` is true, ONLY the In Transit badge renders:

```tsx
return (
  <span className="inline-flex items-center gap-1.5">
    {showInTransit ? (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        <Truck className="h-3 w-3" />
        In Transit
      </span>
    ) : (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass} ${
          clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`}
      >
        {label}
      </span>
    )}
  </span>
);
```
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - In Transit badge shown exclusively when showInTransit=true
    - Normal status badge shown when showInTransit=false
    - No TypeScript errors
  </done>
</task>

</tasks>

<output>
After completion, create `.planning/quick/260317-ffi-asset-status-badge-in-transit-overwrites/260317-ffi-SUMMARY.md`
</output>
