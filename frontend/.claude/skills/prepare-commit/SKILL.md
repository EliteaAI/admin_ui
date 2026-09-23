---
name: prepare-commit
description:
  Run the admin_ui frontend quality gate (Prettier format, ESLint, production build) and report results
  without committing. Use before committing or when the user asks whether the code is ready.
---

# Prepare Commit

Run all code quality checks to make sure the code is ready to commit. This does NOT create a commit. It only
validates.

## Steps

Run these from `frontend/`, in order, and stop on the first failure:

### 1. Format code

```bash
npm run format
```

This runs Prettier with the project's `.prettierrc` (single quotes, trailing commas, 110-char width, one JSX
attribute per line, import sorting).

### 2. Lint

```bash
npm run lint
```

If there are auto-fixable issues, run `npx eslint --fix <files>` on the changed files and report what was
fixed. Report errors that can't be auto-fixed with file paths and line numbers so the user can fix them.

### 3. Build check

```bash
npm run build
```

Verify that the production build succeeds, and report any errors. The output goes to `../static/dist`, which
is hidden from git locally (skip-worktree) and must never be committed. Run `git status` afterwards and make
sure no `static/dist` paths appear. If they do, the skip-worktree flag is missing: re-apply it from the repo
root with `git ls-files -z static/dist | xargs -0 git update-index --skip-worktree`.

## Output

Report the result of each step:

- **Format**: passed / X files reformatted
- **Lint**: passed / X errors (list them)
- **Build**: passed / failed (with errors)

If all checks pass, tell the user the code is ready to commit (suggest `/commit-changes`).
