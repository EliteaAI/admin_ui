---
name: ship-changes
description:
  Take the admin_ui working-tree changes all the way to an open pull request by running prepare-commit,
  create-branch, commit-changes and prepare-pr in order, stopping at the first failure. Use when the user asks
  to ship, deliver or "commit and open a PR" for the current changes.
---

# Ship Changes

Run the four delivery skills one after another:

```
prepare-commit  →  create-branch  →  commit-changes  →  prepare-pr
```

Each step follows its own skill file in `.claude/skills/`. This skill only fixes the order, collects the input
once, and defines what happens between the steps. Stop at the first step that fails and report where it
stopped.

## Input

Collect everything up front, in one question, so the rest runs without interruptions:

- **Ticket** (e.g. `EL-6687`). Required. Use `EL-0000` only if the user says so.
- **Type**: `feat`, `fix`, `hotfix`, `refactor` or `chore`. Suggest one from the changes.
- **Short description** for the branch (3-5 words, e.g. `align frontend structure`).

If the current branch already follows `<type>/<TICKET>/<description>` (not `main` or `release/*`), take the
ticket and type from it and skip the question and step 2.

## Steps

### 1. prepare-commit

Follow `.claude/skills/prepare-commit/SKILL.md`: `npm run format`, `npm run lint`, `npm run build` from
`frontend/`.

- Any failure: **stop**. Report the errors and don't create a branch.
- Format may rewrite files. That's expected, and those changes go into the commit.
- Confirm afterwards that no `static/dist/**` path shows up in `git status`.

### 2. create-branch

Follow `.claude/skills/create-branch/SKILL.md` for the branch name (`<type>/<TICKET>/<kebab-description>`),
with one difference: the working tree is **supposed** to be dirty here, and the changes must move to the new
branch.

- `git fetch origin`
- If `HEAD` is not `origin/main` (or the `release/*` branch the user named), stop and ask. Branching from an
  outdated or unrelated base would put foreign commits into the PR.
- `git switch -c <branch-name>`. This carries all uncommitted changes to the new branch. Don't stash, reset or
  check out `origin/main` over them.
- Skip this step if you are already on a matching feature branch (see Input).

### 3. commit-changes

Follow `.claude/skills/commit-changes/SKILL.md`:

- Message: `<type>: [<TICKET>] <Description>`, derived from the branch.
- Stage files by path. Never stage `static/dist/**`, a `metadata.json` version bump, `.env` files or unrelated
  files. Include deletions and moves (`git add -A -- frontend/src frontend/.claude …` scoped to the changed
  paths is fine).
- No AI attribution and no `Co-Authored-By` trailer.
- If the changes are clearly several unrelated pieces of work, say so and ask whether to split them into
  several commits before committing.

### 4. prepare-pr

Follow `.claude/skills/prepare-pr/SKILL.md`:

- Push with `git push -u origin <branch-name>`. Never force push.
- Open the PR against `main` (or the named `release/*` branch) with the Summary / Changes / Backend /
  permissions / Testing / Ticket body. Describe manual checks honestly. If something wasn't verified in the
  browser, say so in Testing.
- No AI attribution in the PR body.

## Output

Report once at the end:

- **Checks**: format / lint / build results
- **Branch**: name, and the base it was created from
- **Commit**: hash and message
- **PR**: URL and title

If the flow stopped early, report the step, the reason and what the user needs to do before running this skill
again. Steps that already succeeded don't need to be redone. For example, if the push fails, fix the problem
and continue from step 4.

## Rules

- Never run a later step after an earlier one failed.
- Never commit to `main` or `release/*` directly. Step 2 always runs first unless you're already on a feature
  branch.
- Never use `--no-verify`, `--force`, `git reset --hard` or `git stash` in this flow.
- The rules of the four underlying skills (no `static/dist`, no version bumps, no AI attribution, ticket
  format) all still apply.
