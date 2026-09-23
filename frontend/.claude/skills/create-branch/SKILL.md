---
name: create-branch
description:
  Create a new git branch in the admin_ui repo following the <type>/<TICKET>/<kebab-description> convention,
  from an up-to-date origin/main. Use when the user asks to start work on a ticket or create a branch.
---

# Create Branch

Create a new git branch following the project's naming convention.

## Input

The user provides:

- **Ticket number** (e.g. `EL-6687`)
- **Short description** (e.g. `add new palette token`)
- **Type** (optional, defaults to `feat`): `feat`, `fix`, `hotfix`, `refactor`, `chore`

## Branch naming convention

```
<type>/<ticket>/<short-kebab-description>
```

Examples:

- `feat/EL-6687/add-new-palette-token`
- `fix/EL-6157/survey-validation`
- `hotfix/EL-6178/budget-export`
- `refactor/EL-6500/secrets-page-conventions`

## Steps

1. Git commands work from anywhere inside the repo. The git root is `admin_ui/`, one level above `frontend/`.
2. Run `git status` to make sure the working tree is clean. If there are uncommitted changes, warn the user
   and stop. `static/dist` is hidden locally (skip-worktree), so a local build does not count as a change.
3. Fetch the latest from origin: `git fetch origin`.
4. Create the branch from `origin/main`: `git checkout -b <branch-name> origin/main`.
5. Confirm the branch was created and report its name.

## Rules

- The description must be kebab-case (convert spaces and underscores automatically).
- Keep the description short: 3-5 words max.
- The ticket number is always uppercase (convert automatically).
- If the user gives only a ticket number and a description, without a type, default to `feat`.
- Release fixes branch from `release/<version>` only when the user says so.
