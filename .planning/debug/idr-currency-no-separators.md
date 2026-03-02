---
status: diagnosed
trigger: "Rp (IDR currency) values are displayed without dot thousand separators. Users see Rp 1500000 instead of Rp 1.500.000."
created: 2026-02-26T00:00:00Z
updated: 2026-02-26T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two root causes: (1) Input fields use type="number" which never shows thousand separators, (2) No shared formatIDR utility - 3 duplicate local copies exist, and input fields lack formatting entirely
test: Reviewed all currency rendering locations in codebase
expecting: Found both input and display issues
next_action: Return diagnosis

## Symptoms

expected: Currency displays as "Rp 1.500.000" with dot thousand separators per CLAUDE.md
actual: Currency displays as "Rp 1500000" without separators in input fields; display-only locations may format correctly via local formatIDR functions
errors: None (visual formatting issue)
reproduction: View any page with IDR currency values (job form, company settings budget threshold input, job detail inline budget edit)
started: Since currency fields were first implemented

## Eliminated

- hypothesis: formatIDR function produces wrong output (no separators)
  evidence: All 3 copies of formatIDR use Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', minimumFractionDigits:0 }) which correctly produces dots as thousand separators in id-ID locale
  timestamp: 2026-02-26

## Evidence

- timestamp: 2026-02-26
  checked: lib/utils.ts for shared currency formatter
  found: No shared formatIDR utility exists. Only cn() and emptyToNull() in lib/utils.ts
  implication: Currency formatting is duplicated locally in 3 separate files

- timestamp: 2026-02-26
  checked: All files with formatIDR function definitions
  found: 3 identical local copies in job-detail-info.tsx:28, job-preview-dialog.tsx:51, approval-queue.tsx:59
  implication: DRY violation, maintenance risk, but all use correct Intl.NumberFormat config

- timestamp: 2026-02-26
  checked: Input fields that display currency values
  found: 3 input fields with "Rp" prefix label but raw number display:
    (1) job-form.tsx:382 - type="number" for estimated cost
    (2) company-settings-form.tsx:72 - type="number" for budget threshold
    (3) job-detail-info.tsx:293 - type="text" inputMode="numeric" for inline budget edit
  implication: type="number" inputs NEVER show thousand separators in any browser. Users see "Rp 1500000" in these fields.

- timestamp: 2026-02-26
  checked: Server-side notification formatting
  found: 3 locations in server actions use toLocaleString('id-ID') for notification body text:
    (1) approval-actions.ts:90
    (2) job-actions.ts:424
    (3) job-actions.ts:573
  implication: These produce dots correctly in Node.js with full-icu, but format may vary if running with small-icu

- timestamp: 2026-02-26
  checked: Display-only locations using formatIDR
  found: 3 locations correctly use formatIDR:
    (1) job-detail-info.tsx:334 - budget display (non-edit mode)
    (2) job-preview-dialog.tsx:200 - preview dialog cost
    (3) approval-queue.tsx:206 - approval queue cost column
  implication: These SHOULD display correctly with dots when Intl locale id-ID is available

## Resolution

root_cause: |
  Two issues:
  1. PRIMARY: Input fields (job-form, company-settings-form, job-detail-info inline edit) use type="number" or raw text inputs with an "Rp" prefix label. HTML number inputs never display thousand separators - browsers render them as plain digits. Users see "Rp 1500000" instead of "Rp 1.500.000".
  2. SECONDARY (DRY violation): No shared formatIDR utility exists. Three identical copies are scattered across components. This means any fix or format change must be applied in 3+ places.
fix:
verification:
files_changed: []
