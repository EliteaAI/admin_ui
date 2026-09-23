---
name: review-pr
description:
  Review an EliteaAI/admin_ui pull request against the project's architecture and coding standards and post
  inline comments plus a review verdict from the user's GitHub account. Supports a "short" mode. Use when the
  user gives a PR URL or number to review.
---

# Review PR

Review a pull request against the project's coding standards and post inline comments from the user's GitHub
account. The review should read as if a senior engineer on the team wrote it: natural, direct and helpful.

## Input

The user provides one of:

- A GitHub PR URL (e.g. `https://github.com/EliteaAI/admin_ui/pull/81`)
- A PR number (e.g. `81` or `#81`)

Extract `owner`, `repo` and `pullNumber` from the input. If only a number is given, default to `EliteaAI` /
`admin_ui`.

## Modes

The invocation may also contain a mode keyword. Pick the mode before starting and follow it for the whole
review.

| Mode      | Triggered by                                                       | Behaviour                                                    |
| --------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| **Short** | the word `short`, `brief`, `quick`, or `no summary` in the request | Inline comments only, 1-2 sentences each, no summary message |
| **Full**  | anything else (the default)                                        | Full review as described below, with a summary message       |

Everything in this document applies to both modes unless a section is marked as mode-specific. Review depth,
the checks in step 3 and the filtering in step 4 are identical. Only the output differs.

### Short mode rules

- Each inline comment is **1-2 sentences**. No code suggestion blocks unless the fix is a single line and
  can't be described in words.
- **No summary review message at all.** Submit the review with an empty body.
- GitHub rejects a `COMMENT` review with an empty body, so in short mode submit with `APPROVE` (no blocking
  findings) or `REQUEST_CHANGES` (business logic bug, crash risk or significant architectural violation) and
  `body: ""`. Never use `COMMENT` in short mode.
- If the API still rejects the empty body, retry with a single short sentence, not a summary of the findings.
- If there is nothing worth commenting on, post no inline comments and submit an `APPROVE` with an empty body.
- Keep the number of inline comments low: only what genuinely matters. Cap at 8.

## Steps

### 1. Fetch PR data

Use the GitHub MCP tools to gather context:

- `pull_request_read` with `method: "get"`: PR metadata (title, author, base branch, head SHA)
- `pull_request_read` with `method: "get_diff"`: the full diff
- `pull_request_read` with `method: "get_files"`: the list of changed files

### 2. Read changed files in full

For each changed file, read the **full file** from the local repo (check out the PR branch first if needed, or
read at the head SHA). Reviewing only the diff leads to shallow feedback. Also read
`constants/permissions.js`, `routes.js`, `App.jsx` and `Sidebar.jsx` when the PR adds a page or a permission.

### 3. Review the code

Check the changes against these categories, in priority order:

#### A. Business logic issues (Critical)

- Incorrect conditions, wrong state handling, missing edge cases
- Race conditions, memory leaks (sockets/timers not cleaned up), unhandled promise rejections
- Broken user flows: dialog doesn't reset on close, page not reset to 0 on search/filter change
- Mutations missing `invalidatesTags`, so the table goes stale after save
- Permission gating missing or using the wrong `PERMISSIONS` key. A new page not registered in all of
  `routes.js`, `ROUTE_PERMISSIONS`, `SIDEBAR_PERMISSIONS`, `App.jsx` (`guard()`) and `Sidebar.jsx`
- Security concerns: secrets rendered or logged, XSS via `dangerouslySetInnerHTML`, user input in URLs without
  `encodeURIComponent`

#### B. Code that could crash the app (Critical)

- Property access on possibly null/undefined values without optional chaining (`data.rows` before load)
- Missing `key` props in lists
- Incorrect hook dependency arrays (stale closures, infinite loops)
- Incorrect event handler wiring
- Broken imports (wrong paths, missing exports)

#### C. Code reuse and duplication (Important)

- Re-implementing what `DrawerPage`, `DrawerPageHeader`, `GridTable*`, `useTableSort`, `useResponsiveColumns`,
  `useDebounceValue`, `usePageTitle`, `useCheckPermission` already do
- Duplicated logic that already exists in `utils/`, `hooks/` or another page
- Hardcoded routes or permission strings instead of `RouteDefinitions` / `PERMISSIONS`
- Raw `fetch`/`axios` instead of RTK Query endpoints

#### D. Architecture compliance (Important)

- Upward imports: `components/` → `pages/`, `hooks/` → components/pages, `api/` → anything but
  `adminApi`/`utils/env`
- New page → page imports (the existing `AuditTrailPage` imports are legacy exceptions)
- Page-only code placed in `components/`, or shared code left inside a page folder
- Server data copied into Redux slices or local state instead of read from RTK Query
- `globalThis.admin_ui_config` read directly instead of via `@/utils/env`
- `../` imports instead of `@/`
- Any FSD-style directories (`[fsd]/`, `features/`, `entities/`, `widgets/`, `shared/`). This repo doesn't use
  FSD.

#### E. Component and code conventions

- Missing `memo()` wrapper, missing `displayName`, missing `export default`
- Props destructured in the parameter list instead of in the body
- Multiple components defined in a single file
- `function` declarations or `memo(function X…)` instead of arrow functions
- New `propTypes` added

#### F. Styling conventions

- Raw HTML elements (`<div>`, `<span>`, `<button>`, `<table>`, …) instead of MUI / GridTable
- `px` units or MUI spacing shorthands instead of `rem`
- `style={{}}`, `styled()`, or large inline `sx` objects instead of a `camelCaseNameStyles` style function
  below the component with `/** @type {MuiSx} */`
- `useTheme` imported from `@emotion/react`
- Hardcoded colors instead of palette tokens, or a new token added to only one of `lightPalette.js` /
  `darkPalette.js`
- **Wrong palette token for the CSS property**: `background.*` only for backgrounds, `border.*` only for
  borders, `text.*` only for text color, `icon.*` only for icons
- MUI imported from the barrel (`@mui/material`) instead of per path

#### G. File naming

- Component files not PascalCase, or a page entry not `pages/<Name>Page/<Name>Page.jsx`
- New hook/helper/constant files missing the `.hooks.js` / `.helpers.js` / `.constants.js` suffix
- Tests outside a `__tests__/` folder

#### H. General best practices

- Overly complex logic that could be simplified
- Missing `useCallback` / `useMemo` where it matters (props passed to children, dependency arrays)
- Comments that explain "what" instead of "why", or unnecessary comments
- Dead code, unused imports, `console.log` left behind

### 4. Filter and prioritize findings

- Only comment on things that genuinely matter. Do not nitpick.
- Group several small issues in the same file area into one comment when appropriate.
- If the PR only touches legacy code, don't demand a full conversion to the new conventions. Flag convention
  issues only in newly written or substantially rewritten code.
- Skip files that were only renamed or moved with no logic change.
- Never review `static/dist/**`, lock files or other generated files. But if `static/dist` or a
  `metadata.json` version bump is **in** the PR, flag it: CI owns those.
- Prioritize: business bugs > crashes > duplication > architecture > conventions > style.

### 5. Post the review on GitHub

Use the GitHub MCP tools to post a formal review:

1. **Create a pending review:**

   ```
   mcp__github__pull_request_review_write
     method: "create"
     owner, repo, pullNumber
     commitID: <head SHA from step 1>
   ```

2. **Add inline comments** for each finding:

   ```
   mcp__github__add_comment_to_pending_review
     owner, repo, pullNumber
     path: <file path relative to repo root, e.g. frontend/src/pages/UsersPage/UsersPage.jsx>
     line: <line number in the new file>
     side: "RIGHT"
     subjectType: "LINE"
     body: <comment text>
   ```

   For multi-line findings, use `startLine` + `line` to highlight a range.

3. **Submit the review:**

   ```
   mcp__github__pull_request_review_write
     method: "submit_pending"
     owner, repo, pullNumber
     event: <"COMMENT" | "REQUEST_CHANGES" | "APPROVE">
     body: <summary>
   ```

   Choose the event from the findings:
   - **APPROVE**: no issues, or only minor suggestions
   - **COMMENT**: minor suggestions or style issues only
   - **REQUEST_CHANGES**: any business logic bug, crash risk or significant architectural violation

   **Full mode:** the summary body is 2-3 sentences max. Mention what looks good if appropriate, then state
   the main concern, if any.

   **Short mode:** `body: ""` and the event is `APPROVE` or `REQUEST_CHANGES` only.

### 6. Update PR labels

After submitting, set the review-status label with `mcp__github__issue_write` (`method: "update"`, the PR
number as `issue_number`). Read the current labels, remove any review-status labels, add the new one and pass
the full resulting array. Keep all other labels.

| Review event      | Set label        | Remove labels                                         |
| ----------------- | ---------------- | ----------------------------------------------------- |
| `APPROVE`         | `ready to merge` | `review in progress`, `need review`, `need updates`   |
| `REQUEST_CHANGES` | `need updates`   | `review in progress`, `need review`, `ready to merge` |
| `COMMENT`         | `need review`    | `review in progress`, `ready to merge`                |

If a label doesn't exist in the repo, skip it and mention that in the report. Don't create labels.

### 7. Report to the user

- The review outcome (approved / commented / requested changes)
- How many comments were posted
- The label that was applied
- The PR URL

## Writing style for comments

Comments are posted from the user's GitHub account, so they must read like a real person wrote them.

**Do:**

- Write in first person ("I think", "we should", "this could")
- Be direct and concise: one short paragraph per comment, two at most
- Suggest the fix, not just the problem ("Consider using `Box` here instead of `div`")
- Use a casual-professional tone, like a helpful review from a teammate
- Use regular hyphens (-), not em dashes
- Use simple formatting: backticks for code, nothing fancy
- For a code change, use a GitHub suggestion block:
  ````
  ```suggestion
  <corrected code>
  ```
  ````

**Do not:**

- Use em dashes (—), arrows (→) or other special punctuation
- Write overly formal or robotic language
- Start comments with "Issue:", "Problem:", "Violation:" or similar labels
- Use numbered lists or headers inside comments
- Reference CLAUDE.md, rules files or any internal documentation by name. State the convention naturally ("We
  wrap components in `memo()` in this project")
- Use emoji
- Write more than 4-5 lines per comment unless showing a code suggestion
- Mention AI, Claude, automation, or that the review was generated

**Short mode tightens this further:** 1-2 sentences per comment, straight to the point, e.g. "This will blow
up if `data` is undefined on first render - default it with `data?.rows ?? []`."

## Rules

- Never approve a PR that has business logic bugs or crash risks.
- If the PR has no issues, approve it with a short positive summary (full mode) or an empty body (short mode).
- Maximum 15 inline comments per review in full mode, 8 in short mode. Consolidate if there are more.
- If you can't determine the line number for a finding, use `subjectType: "FILE"`.
- Always read the full changed files, not just the diff hunks.
