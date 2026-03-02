---
status: diagnosed
trigger: "Photo upload '+' button does nothing when clicked on /requests/new"
created: 2026-02-21T00:00:00Z
updated: 2026-02-21T00:00:00Z
---

## Current Focus

hypothesis: The hidden file input has `aria-hidden="true"` which in some browsers/React versions prevents label-triggered clicks from activating the input
test: Check if aria-hidden on input prevents label htmlFor association
expecting: aria-hidden="true" should not block label click, but sr-only + aria-hidden combined may cause issues
next_action: Return diagnosis

## Symptoms

expected: Clicking the "+" photo upload button should open the browser file picker dialog
actual: Nothing happens — no file picker opens
errors: None visible in console (silent failure)
reproduction: Go to /requests/new, click the "+" photo button
started: Since implementation in Phase 4

## Eliminated

- hypothesis: Component is not a client component
  evidence: File starts with 'use client' directive (line 1)
  timestamp: 2026-02-21

- hypothesis: inputRef is not connected to file input
  evidence: inputRef is declared on line 29 and attached to input on line 125, but the label-based approach does not use inputRef.current.click() — it uses htmlFor/id association instead
  timestamp: 2026-02-21

- hypothesis: Duplicate IDs on page
  evidence: Only one RequestPhotoUpload is rendered in request-submit-form.tsx (line 156)
  timestamp: 2026-02-21

## Evidence

- timestamp: 2026-02-21
  checked: request-photo-upload.tsx component structure
  found: The "+" button is a `<label htmlFor="photo-upload-input">` (lines 109-116). The hidden file input has `id="photo-upload-input"` and `className="sr-only"` and `aria-hidden="true"` (lines 123-133).
  implication: The label-for-input click delegation approach is used instead of an explicit onClick handler

- timestamp: 2026-02-21
  checked: The hidden input element attributes
  found: The input has `aria-hidden="true"` on line 132. This attribute tells browsers the element is not part of the accessibility tree. Some browsers interpret this as a signal to not allow interaction with the element, which can prevent the label click from triggering the file input.
  implication: This is the likely root cause

- timestamp: 2026-02-21
  checked: request-submit-form.tsx for wrapping context
  found: The RequestPhotoUpload is rendered inside a `<Form>` (shadcn/react-hook-form) and `<form>` element. The label is NOT inside a FormField — it's in a plain `<div>`. This is fine and should not interfere.
  implication: Form wrapping is not the issue

## Resolution

root_cause: |
  The `<input>` element on line 123-133 of `request-photo-upload.tsx` has `aria-hidden="true"` (line 132).
  When a `<label htmlFor="photo-upload-input">` is clicked, the browser should delegate the click to the
  associated input. However, `aria-hidden="true"` can cause browsers (particularly Safari/WebKit and some
  Chromium builds) to skip activating the input because they treat `aria-hidden` elements as non-interactive.

  Additionally, `sr-only` in Tailwind uses `position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0,0,0,0)` which makes the element visually hidden but still in the DOM. Combined with
  `aria-hidden="true"`, some browser engines simply refuse to activate the input via label association.

  The safer and more reliable approach is to use an explicit click handler on the button/label that
  programmatically calls `inputRef.current?.click()` instead of relying on label-for-input association
  with a hidden input.

fix: ""
verification: ""
files_changed: []
