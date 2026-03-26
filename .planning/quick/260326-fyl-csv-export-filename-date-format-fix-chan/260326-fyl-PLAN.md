---
phase: quick-260326-fyl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/utils.ts
autonomous: true
requirements:
  - DATE-FORMAT-CONSISTENCY

must_haves:
  truths:
    - "CSV export filenames use dd-MM-yyyy date format (e.g., companies-26-03-2026.csv)"
    - "No yyyy-MM-dd format violations exist in user-visible filename generation"
  artifacts:
    - path: "lib/utils.ts"
      provides: "downloadCSV function with correct dd-MM-yyyy filename format"
      contains: "format(new Date(), 'dd-MM-yyyy')"
  key_links:
    - from: "lib/utils.ts:downloadCSV"
      to: "5 admin table components"
      via: "direct function call"
      pattern: "downloadCSV\\("
---

<objective>
Fix the CSV export filename date format from yyyy-MM-dd to dd-MM-yyyy in the downloadCSV utility function.

Purpose: Enforce the mandatory dd-MM-yyyy date format rule (CLAUDE.md) for user-visible filenames. This is the only remaining date format violation in the codebase -- all server-side export routes already use the correct format.
Output: Corrected lib/utils.ts with dd-MM-yyyy format in downloadCSV.
</objective>

<execution_context>
@/Users/melfice/code/ga/.claude/get-shit-done/workflows/execute-plan.md
@/Users/melfice/code/ga/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/utils.ts
@.planning/quick/260326-fyl-csv-export-filename-date-format-fix-chan/260326-fyl-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix downloadCSV filename date format</name>
  <files>lib/utils.ts</files>
  <action>
On line 27 of lib/utils.ts, change the date format string in the downloadCSV function from 'yyyy-MM-dd' to 'dd-MM-yyyy'.

Before: `a.download = \`\${filenamePrefix}-\${format(new Date(), 'yyyy-MM-dd')}.csv\`;`
After:  `a.download = \`\${filenamePrefix}-\${format(new Date(), 'dd-MM-yyyy')}.csv\`;`

This is a single format string change. The function already imports `format` from date-fns (line 3). No other files need modification -- research confirmed all other yyyy-MM-dd usages are legitimate ISO transport (URL params, DB queries).
  </action>
  <verify>
    <automated>grep -n "dd-MM-yyyy" lib/utils.ts | grep downloadCSV || grep -n "dd-MM-yyyy" lib/utils.ts | head -5</automated>
  </verify>
  <done>The downloadCSV function in lib/utils.ts generates filenames with dd-MM-yyyy format (e.g., companies-26-03-2026.csv). No yyyy-MM-dd format remains in any user-visible filename generation code.</done>
</task>

</tasks>

<verification>
1. `grep "yyyy-MM-dd" lib/utils.ts` returns NO matches (the old format is gone)
2. `grep "dd-MM-yyyy" lib/utils.ts` returns the downloadCSV line
3. `npm run build` passes (no TypeScript errors introduced)
</verification>

<success_criteria>
- downloadCSV filename uses dd-MM-yyyy format
- Build passes without errors
- No other date format violations introduced
</success_criteria>

<output>
After completion, create `.planning/quick/260326-fyl-csv-export-filename-date-format-fix-chan/260326-fyl-SUMMARY.md`
</output>
