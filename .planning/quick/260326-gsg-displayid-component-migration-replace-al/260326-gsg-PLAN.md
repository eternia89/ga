---
phase: quick-260326-gsg
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/(dashboard)/jobs/[id]/page.tsx
  - app/(dashboard)/requests/[id]/page.tsx
  - components/assets/asset-view-modal.tsx
  - components/assets/asset-detail-client.tsx
  - components/requests/request-view-modal.tsx
  - components/jobs/job-modal.tsx
  - components/approvals/approval-queue.tsx
  - components/jobs/job-detail-info.tsx
  - components/jobs/job-form.tsx
  - components/jobs/job-preview-dialog.tsx
  - components/jobs/request-preview-dialog.tsx
  - components/requests/request-detail-info.tsx
  - components/audit-trail/audit-trail-columns.tsx
  - components/requests/request-triage-dialog.tsx
  - components/maintenance/pm-checklist-preview.tsx
  - components/maintenance/schedule-view-modal.tsx
autonomous: true
requirements: [UI-CONSISTENCY]

must_haves:
  truths:
    - "Every display_id rendered in JSX uses the DisplayId component (no inline font-mono for display IDs)"
    - "Display IDs that previously lacked font-mono now render with font-mono via DisplayId"
    - "Visual output is identical to before -- headings, links, and badges retain their styling"
    - "No build errors or type errors after migration"
  artifacts:
    - path: "components/display-id.tsx"
      provides: "Shared DisplayId wrapper component (unchanged)"
      exports: ["DisplayId"]
    - path: "app/(dashboard)/jobs/[id]/page.tsx"
      provides: "Job detail page with DisplayId in h1"
      contains: "<DisplayId>"
    - path: "app/(dashboard)/requests/[id]/page.tsx"
      provides: "Request detail page with DisplayId in h1"
      contains: "<DisplayId>"
    - path: "components/approvals/approval-queue.tsx"
      provides: "Approval queue table with DisplayId in cells"
      contains: "<DisplayId>"
  key_links:
    - from: "all 16 modified files"
      to: "components/display-id.tsx"
      via: "import { DisplayId } from '@/components/display-id'"
      pattern: "import.*DisplayId.*from.*display-id"
---

<objective>
Migrate all inline font-mono display ID renders to the shared DisplayId component across 16 files (18 edit sites).

Purpose: Enforce the CLAUDE.md convention that display IDs always render with font-mono, using a single component for consistency and maintainability. Eliminates scattered inline font-mono classes and fixes 2 locations where display_id lacked font-mono entirely.

Output: 16 modified files, zero inline font-mono for display IDs remaining in the codebase.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/260326-gsg-displayid-component-migration-replace-al/260326-gsg-RESEARCH.md

<interfaces>
<!-- The DisplayId component API (unchanged, already exists) -->
From components/display-id.tsx:
```typescript
export function DisplayId({ children, className }: { children: React.ReactNode; className?: string }): JSX.Element
// Renders: <span className={cn('font-mono', className)}>{children}</span>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migrate headings, table cells, and span contexts (12 locations, 10 files)</name>
  <files>
    app/(dashboard)/jobs/[id]/page.tsx,
    app/(dashboard)/requests/[id]/page.tsx,
    components/assets/asset-view-modal.tsx,
    components/assets/asset-detail-client.tsx,
    components/requests/request-view-modal.tsx,
    components/jobs/job-modal.tsx,
    components/approvals/approval-queue.tsx,
    components/jobs/job-detail-info.tsx,
    components/jobs/job-form.tsx,
    components/jobs/job-preview-dialog.tsx
  </files>
  <action>
For each file, add `import { DisplayId } from '@/components/display-id';` (skip job-form.tsx which already has it). Then apply these transformations:

**Heading pattern (items 1-6 from research):** Remove `font-mono` from the h1/h2 className. Wrap the display_id text content inside `<DisplayId>`:
- `app/(dashboard)/jobs/[id]/page.tsx` ~line 458: `<h1 className="text-2xl font-bold tracking-tight"><DisplayId>{job.display_id}</DisplayId></h1>`
- `app/(dashboard)/requests/[id]/page.tsx` ~line 390: Same pattern for request.display_id
- `components/assets/asset-view-modal.tsx` ~line 443: `<h2 className="text-xl font-bold tracking-tight"><DisplayId>{asset.display_id}</DisplayId></h2>`
- `components/assets/asset-detail-client.tsx` ~line 100: Same h1 pattern
- `components/requests/request-view-modal.tsx` ~line 570: Same h2 pattern
- `components/jobs/job-modal.tsx` ~line 1012: Same h2 pattern

**Table cell pattern (item 7):** Remove font-mono from TableCell className, wrap content:
- `components/approvals/approval-queue.tsx` ~line 174: `<TableCell><DisplayId className="text-sm font-medium">{job.display_id}</DisplayId></TableCell>` (remove font-mono from TableCell classes, keep other TableCell classes if any)

**Direct span replacement (items 8-12):** Replace `<span className="font-mono ...">` with `<DisplayId className="...">` (omitting font-mono from the className since DisplayId applies it):
- `components/jobs/job-detail-info.tsx` ~line 488: `<DisplayId className="text-xs font-semibold text-muted-foreground shrink-0">`
- `components/jobs/job-form.tsx` ~line 577: `<DisplayId className="text-xs font-semibold text-muted-foreground shrink-0">`
- `components/jobs/job-preview-dialog.tsx` ~line 161: `<DisplayId className="text-sm font-semibold text-muted-foreground">`
- `components/jobs/job-preview-dialog.tsx` ~line 234: `<DisplayId className="text-xs font-semibold text-muted-foreground shrink-0">`

For each replacement: remove `font-mono` from the class list, keep all other classes, change the element tag from `span` to `DisplayId` (or wrap content in `DisplayId` for headings/cells).
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30 && echo "---" && node -e "const fs=require('fs'); const files=['app/(dashboard)/jobs/[id]/page.tsx','app/(dashboard)/requests/[id]/page.tsx','components/assets/asset-view-modal.tsx','components/assets/asset-detail-client.tsx','components/requests/request-view-modal.tsx','components/jobs/job-modal.tsx','components/approvals/approval-queue.tsx','components/jobs/job-detail-info.tsx','components/jobs/job-form.tsx','components/jobs/job-preview-dialog.tsx']; let ok=true; files.forEach(f=>{const c=fs.readFileSync(f,'utf8'); if(!c.includes('DisplayId')){console.log('MISSING DisplayId in '+f);ok=false;}}); if(ok) console.log('All 10 files have DisplayId');"</automated>
  </verify>
  <done>12 inline font-mono display ID locations across 10 files replaced with DisplayId component. No font-mono for display IDs remains in these files. TypeScript compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Migrate link, string-interpolation, and missing-font-mono contexts (6 locations, 6 files)</name>
  <files>
    components/jobs/request-preview-dialog.tsx,
    components/requests/request-detail-info.tsx,
    components/audit-trail/audit-trail-columns.tsx,
    components/requests/request-triage-dialog.tsx,
    components/maintenance/pm-checklist-preview.tsx,
    components/maintenance/schedule-view-modal.tsx
  </files>
  <action>
For each file, add `import { DisplayId } from '@/components/display-id';` (skip schedule-view-modal.tsx which already has it). Then apply:

**Direct span replacement (item 12 from research):**
- `components/jobs/request-preview-dialog.tsx` ~line 45: `<DisplayId className="text-sm font-semibold text-muted-foreground">`

**Link inner-wrap pattern (items 13, 15):** Keep the Link/anchor element and its non-font classes. Wrap the text content inside `<DisplayId>`:
- `components/requests/request-detail-info.tsx` ~line 356: Remove `font-mono` from Link className, wrap text: `<Link className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"><DisplayId>{job.display_id}</DisplayId><ExternalLink .../></Link>`
- `components/audit-trail/audit-trail-columns.tsx` ~line 156: Remove `font-mono` from Link className, wrap text: `<Link className="text-xs text-blue-600 hover:underline hover:text-blue-700 transition-colors"><DisplayId>{displayText}</DisplayId></Link>`

**Non-link span in audit-trail (item 14):**
- `components/audit-trail/audit-trail-columns.tsx` ~line 147: Replace `<span className="font-mono text-xs text-muted-foreground">` with `<DisplayId className="text-xs text-muted-foreground">`

**String-interpolation to JSX (item 16):**
- `components/requests/request-triage-dialog.tsx` ~line 122: Convert the DialogTitle from string interpolation to JSX. Change from template literal with display_id to: `Triage Request{request ? <> -- <DisplayId>{request.display_id}</DisplayId></> : ''}`

**Category B -- add font-mono where missing (items B1, B2):**
- `components/maintenance/pm-checklist-preview.tsx` ~line 93: Replace `<span className="text-muted-foreground font-normal ml-1">({assetDisplayId})</span>` with `<span className="text-muted-foreground font-normal ml-1">(<DisplayId>{assetDisplayId}</DisplayId>)</span>` (keep outer span for the parens + non-font styling, inner DisplayId for the ID text)
- `components/maintenance/schedule-view-modal.tsx` ~line 354: Replace template literal `` ` (${schedule.asset.display_id})` `` with JSX: `{schedule.asset.display_id && <> (<DisplayId className="text-sm">{schedule.asset.display_id}</DisplayId>)</>}`

**SKIP:** `components/maintenance/schedule-detail.tsx` line 152 -- Input value prop is a string, cannot use JSX.
  </action>
  <verify>
    <automated>cd /Users/melfice/code/ga && npx tsc --noEmit 2>&1 | head -30 && echo "---" && node -e "const fs=require('fs'); const files=['components/jobs/request-preview-dialog.tsx','components/requests/request-detail-info.tsx','components/audit-trail/audit-trail-columns.tsx','components/requests/request-triage-dialog.tsx','components/maintenance/pm-checklist-preview.tsx','components/maintenance/schedule-view-modal.tsx']; let ok=true; files.forEach(f=>{const c=fs.readFileSync(f,'utf8'); if(!c.includes('DisplayId')){console.log('MISSING DisplayId in '+f);ok=false;}}); if(ok) console.log('All 6 files have DisplayId');"</automated>
  </verify>
  <done>6 remaining locations migrated: 1 direct span, 2 link inner-wraps, 1 string-to-JSX conversion, 2 missing-font-mono additions. TypeScript compiles without errors.</done>
</task>

</tasks>

<verification>
After both tasks complete, run the following to confirm zero remaining inline font-mono for display IDs:

```bash
# 1. TypeScript compilation
npx tsc --noEmit

# 2. Build succeeds
npm run build

# 3. No remaining inline font-mono for display_id (should only find display-id.tsx itself and Category D non-display-id uses)
grep -rn "font-mono" --include="*.tsx" | grep -i "display_id\|display\.id\|displayId" | grep -v "display-id.tsx" | grep -v "node_modules"
# Expected: empty output (no matches)

# 4. All 16 modified files import DisplayId
grep -rn "import.*DisplayId.*from.*display-id" --include="*.tsx" | wc -l
# Expected: 24+ (16 modified + existing adopters)
```
</verification>

<success_criteria>
- All 18 edit sites migrated (16 inline font-mono replaced + 2 missing font-mono added)
- Zero inline `font-mono` classes used for display_id rendering in JSX (grep confirms)
- `npm run build` passes with zero errors
- All 16 files import `DisplayId` from `@/components/display-id`
- Visual rendering unchanged (font-mono still applied via DisplayId component)
</success_criteria>

<output>
After completion, create `.planning/quick/260326-gsg-displayid-component-migration-replace-al/260326-gsg-SUMMARY.md`
</output>
