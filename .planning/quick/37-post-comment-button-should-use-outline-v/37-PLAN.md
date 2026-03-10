---
phase: quick-37
plan: 37
type: execute
wave: 1
depends_on: []
files_modified:
  - components/jobs/job-comment-form.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Post Comment button renders with outline variant (border, no filled background)"
    - "CTA (default filled) button variant is no longer used for posting comments"
  artifacts:
    - path: components/jobs/job-comment-form.tsx
      provides: "Job comment form with outline Post Comment button"
      contains: "variant=\"outline\""
  key_links:
    - from: components/jobs/job-comment-form.tsx
      to: Button component
      via: variant prop
      pattern: "variant=\"outline\""
---

<objective>
Change the Post Comment submit button in the job comment form from the default CTA (filled primary) variant to the outline variant.

Purpose: Reserve the filled CTA button style for mandatory primary actions only. Comment submission is a secondary, optional action and should use the less prominent outline style.
Output: Updated job-comment-form.tsx with `variant="outline"` on the submit Button.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Change Post Comment button to outline variant</name>
  <files>components/jobs/job-comment-form.tsx</files>
  <action>
    On line 201 of `components/jobs/job-comment-form.tsx`, update the Button element:

    Current:
    ```tsx
    <Button type="submit" size="sm" disabled={isSubmitting}>
    ```

    Change to:
    ```tsx
    <Button type="submit" size="sm" variant="outline" disabled={isSubmitting}>
    ```

    No other changes needed. The button text ("Post Comment" / "Posting...") and disabled behavior remain unchanged.
  </action>
  <verify>
    <automated>grep -n 'variant="outline"' /Users/melfice/code/ga/components/jobs/job-comment-form.tsx</automated>
  </verify>
  <done>The Post Comment button has `variant="outline"` and no longer uses the default filled CTA style.</done>
</task>

</tasks>

<verification>
Run `npm run build` from the project root to confirm no TypeScript errors were introduced.
</verification>

<success_criteria>
- `components/jobs/job-comment-form.tsx` contains `variant="outline"` on the submit button
- Build passes without errors
- Post Comment button visually renders as outline (border only, no filled background) in the job detail page comment form
</success_criteria>

<output>
After completion, create `.planning/quick/37-post-comment-button-should-use-outline-v/37-SUMMARY.md`
</output>
