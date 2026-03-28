You are executing approved items from the needs-review queue.

## Step 1: Read the queue

Read `docs/needs-review.md`. Parse all sections (each `## [DATE]` heading is one item).

For each item, find all checkbox lines (`- [v]`, `- [ ]`, `- [x]`, `- [-]`).

Collect only items that have at least one `[v]` checkbox — these are approved by the user.

If no `[v]` items found, tell the user: "No approved items in needs-review.md. Mark items with [v] first."

## Step 2: Plan and confirm

Show the user a numbered summary of what you're about to do:
```
Found N approved items:
1. [CATEGORY] Short title — "the [v] instruction"
2. [CATEGORY] Short title — "the [v] instruction"
```

Ask: "Proceed with all N items?" Wait for confirmation.

## Step 3: Execute each item

For each approved item, execute it using `/gsd:quick` with `--full --research` flags.

The task description for gsd:quick should be the `[v]` line's text combined with the **What**, **Where**, and context from the needs-review entry.

After each item completes successfully:
1. In `docs/needs-review.md`, change the `[v]` to `[x]` for the executed suggestion
2. Change any remaining `[ ]` in that same item to `[-]` (skipped — a different option was chosen)
3. Move the entire item section to the `## Completed` section at the bottom
4. Commit the fix with an appropriate `chore:` or `fix:` prefix

If an item fails:
1. Leave the `[v]` as-is (don't change to `[x]`)
2. Add a line: `> **Failed (DATE):** reason for failure`
3. Continue to the next item

## Step 4: Summary

After all items are processed, write a short human-readable summary. Keep it casual, like a teammate reporting back. No jargon, no code blocks, no bullet-point walls. Just a few sentences.

Example tone:

> Done — knocked out 3 items. Cleaned up the duplicate date formatting in the job detail pages, removed 4 unused imports from the asset components, and fixed the missing alt text on the dashboard icons. One item failed (the RLS policy thing — needs a migration I can't write safely without your sign-off). That one's still in the queue for next time.

Rules for the summary:
- Lead with how many items were done
- Name what changed in plain English (no file paths unless it helps)
- If something failed, say why in one sentence
- End with what's left, if anything
- Total length: 2-5 sentences max

## Important rules
- NEVER modify business logic without explicit approval in the [v] instruction
- Each item gets its own git commit
- If an item's [v] instruction is vague, ask the user for clarification before executing
- Read CLAUDE.md before executing any code changes
