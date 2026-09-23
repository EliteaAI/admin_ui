---
name: review-uncommitted-changes
description:
  Review the admin_ui working tree (staged, unstaged and untracked changes, optionally scoped to paths)
  against the same standards as a PR review and report findings in the terminal without committing or posting
  anything. Use before committing or when the user asks to review work in progress.
---

# Review Uncommitted Changes

Review the working tree against the project's coding standards, using the same rules as a PR review, and
report the findings in the terminal. Nothing is committed, pushed or posted to GitHub.

## Input

Optional. The user may give:

- Nothing: review every uncommitted change (staged, unstaged and untracked)
- `staged`: review only what is staged (`git diff --cached`)
- `unstaged`: review only what is not staged
- One or more paths: review only changes under those paths

## Steps

### 1. Gather the changes

```bash
git status --short              # what changed, including untracked files
git diff                        # unstaged changes
git diff --cached               # staged changes
```

Scope the diffs to the requested paths if the user gave any (`git diff -- <paths>`). Ignore `static/dist/**`.

If the working tree is clean, say so and stop. There is nothing to review.

Untracked files don't appear in `git diff`, so collect them from `git status --short` (lines starting with
`??`) and treat their whole contents as added code.

### 2. Read changed files in full

For every changed or new file, read the **full file**, not only the diff hunks.

Also read the files the changed code imports from when a finding depends on them (for example, to check that
an export exists, or that a hook in `hooks/` already does the same thing).

### 3. Review the code

Apply the review categories from the `review-pr` skill (`.claude/skills/review-pr/SKILL.md`), sections A
through H. That file is the single source of truth for what to look for:

- **A. Business logic issues** (Critical), including permission gating and page registration
- **B. Code that could crash the app** (Critical)
- **C. Code reuse and duplication** (Important)
- **D. Architecture compliance** (Important): layer direction, no page → page imports, no FSD directories
- **E. Component and code conventions**
- **F. Styling conventions**, including semantic palette token usage
- **G. File naming**
- **H. General best practices**

### 4. Filter and prioritize findings

- Only report things that genuinely matter. Do not nitpick.
- Group several small issues in the same file area into one finding.
- Don't demand a full convention conversion of legacy code the user merely touched. Flag conventions in new or
  substantially rewritten code.
- Skip pure renames and moves with no logic change.
- Prioritize: business bugs > crashes > duplication > architecture > conventions > style.
- Skip generated files, lock files and build artifacts.

### 5. Report in the terminal

Don't post anything to GitHub and don't create a commit.

Group findings by file, most severe first, and mark each with its severity. Reference every finding as a
clickable `path/to/File.jsx:42`, and keep each finding to a couple of lines: what is wrong, and what to do
instead.

```
frontend/src/pages/SecretsPage/SecretsTable.jsx

  Critical  SecretsTable.jsx:24 - `secrets.map` runs before the query resolves, so `secrets` is undefined on
            first render. Default it: `const { secrets = [] } = props;`

  Minor     SecretsTable.jsx:88 - `palette.background.secondary` is a background token used for `color`.
            Use a `text.*` token here.
```

Finish with a one-line verdict:

- **Ready to commit**: nothing found, or only minor suggestions
- **Fix first**: any business logic bug, crash risk or significant architectural violation

Then offer to apply the fixes. Apply them only if the user says yes, and re-check the files afterwards.

## Writing style for findings

- Plain and direct, the way a teammate would say it out loud.
- State the fix, not only the problem.
- One or two lines per finding. Add a short code snippet only when it makes the fix obvious.
- Backticks for code. No emoji, no headers inside a finding, no "Violation:" prefix (the severity column
  already says it).
- State the convention naturally rather than citing CLAUDE.md or this skill by name.

## Rules

- Never commit, stage, push or open a PR from this skill. It is read-only until the user asks for fixes.
- Always read the full changed files, not just the diff hunks.
- Include untracked files. New files are usually where most findings are.
- Maximum 15 findings. Consolidate the rest into a short "also worth a look" line.
- If the user asks for fixes, fix only what was reported and leave unrelated code alone.
