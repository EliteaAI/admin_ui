---
name: architecture-check
description:
  Audit a file, folder, or all of frontend/src in admin_ui for violations of the page-colocated layered
  architecture and the component, styling and naming conventions, and report errors/warnings/info with
  file:line and fixes. Use when the user asks to check or audit code against project conventions.
---

# Architecture Check

Audit a file, a folder, or the whole `frontend/src/` for violations of the architecture and code conventions
defined in `CLAUDE.md` and `.claude/rules/`.

## Input

The user provides a file path or a folder path. With no argument, audit all of `frontend/src/`.

## What to check

### Architecture violations

- **Upward imports**:
  - `components/**` importing from `@/pages/…`
  - `hooks/**` importing from `@/components/…` or `@/pages/…`
  - `api/**` importing anything other than `./adminApi` and `@/utils/env`
  - `constants/**` or `utils/**` (except `utils/env.js`) importing project code
- **Page → page imports**: a file in `pages/A/` importing from `@/pages/B/…`. The existing `UsersPage` /
  `ProjectsPage` → `AuditTrailPage/{AuditHeatmap,AuditTrailTable,AuditTraceTable}` imports are known
  exceptions. Report them as **Info**, anything else as **Error**.
- **Misplaced code**: a `components/` file used by only one page (Info: could move into that page), or a
  page-folder file imported by other pages (Error: should move to `components/`/`hooks/`/`utils/`).
- **FSD directories**: any `[fsd]/`, `features/`, `entities/`, `widgets/`, `shared/` folder (Error).
- **`../` imports** instead of `@/` (Warning).
- **Direct `globalThis.admin_ui_config` / `window.admin_ui_config` access** outside `utils/env.js` and
  `store/index.js` (Warning).
- **Hardcoded route strings** instead of `RouteDefinitions` (Warning), and **hardcoded permission strings**
  instead of `PERMISSIONS` (Warning).
- **Raw `fetch`/`axios`** in components or hooks instead of RTK Query (Error).
- **Page registration**: every page in `pages/*Page/` must be wired in `routes.js`, `App.jsx` (via `guard()`),
  `ROUTE_PERMISSIONS`, `SIDEBAR_PERMISSIONS` and `Sidebar.jsx`. Report gaps (Error).
- **API tags**: every tag in `providesTags`/`invalidatesTags` must be listed in `adminApi.js` `tagTypes`
  (Error).

### Component conventions

- **Missing `memo` wrapper** on components
- **Missing `displayName`**
- **Props destructured in the parameter list**: `memo(({ a, b }) =>` or `function X({ a, b })`
- **Multiple components in one file**: more than one top-level component definition per `.jsx` file
- **Function declarations**: `function X(` or `memo(function X(` instead of arrow functions
- **Missing default export** on components

### Styling violations

- **Raw HTML elements**: `<div>`, `<span>`, `<p>`, `<button>`, `<input>`, `<table>` instead of MUI / GridTable
- **Inline styles**: `style={{}}` instead of `sx` with a style function
- **Large inline `sx` objects** (more than one or two properties) instead of the style function
- **Missing or misnamed style function**: new code without `camelCaseNameStyles` + `/** @type {MuiSx} */`
- **px units** in component styles (`'16px'` instead of `'1rem'`). Theme and palette files are exempt.
- **Hardcoded colors** (`#…`, `rgb(`, `rgba(`) outside `lightPalette.js`, `darkPalette.js` and `MainTheme.js`
- **Semantic token misuse**: `background.*` used for `color`, `text.*` used for `backgroundColor`, and so on
- **`useTheme` from `@emotion/react`**
- **Barrel MUI imports** (`from '@mui/material'`) instead of per-path imports

### File naming violations

- Component files not PascalCase. Page entry not `pages/<Name>Page/<Name>Page.jsx`
- **New** hook/helper/constant files missing the `.hooks.js` / `.helpers.js` / `.constants.js` suffix. Check
  `git log --diff-filter=A` or `git status` to tell new files from legacy ones. Report legacy names as Info
  only.
- Component folders not PascalCase
- Tests outside `__tests__/`

## Output

Report findings grouped by severity:

1. **Errors** (must fix): architecture violations, wrong imports, unregistered pages or tags, raw HTML,
   missing memo/displayName in new code
2. **Warnings** (should fix): naming, `../` imports, hardcoded routes/permissions/colors, px units
3. **Info** (suggestions): known legacy exceptions, legacy names, code that could move closer to its only user

For each finding, report:

- The clickable file path and line number
- What the violation is
- How to fix it (briefly)

When auditing all of `src/`, summarize repeated legacy patterns (e.g. "36 components use `function`
declarations") instead of listing every file, and list only the top offenders.

End with a summary count: X errors, Y warnings, Z info.

Offer to write the report to `.claude/reports/architecture_audit.md` for large audits. Do not fix anything
unless the user asks. For fixes, use the `refactor-to-conventions` skill.
