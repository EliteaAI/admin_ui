---
name: architecture-check
description:
  Audit a file, folder, or all of frontend/src in admin_ui against the module architecture (module shape,
  placement by usage, barrels, layers), the component, styling and naming conventions, and the no-dead-code
  rule, and report errors/warnings/info with file:line and fixes. Use when the user asks to check or audit
  code against project conventions.
---

# Architecture Check

Audit a file, a folder, or the whole `frontend/src/` against the architecture and code conventions defined in
`CLAUDE.md` and `.claude/rules/`. The codebase is fully conventional, so every finding is a regression.

## Input

The user provides a file path or a folder path. With no argument, audit all of `frontend/src/`.

## What to check

### Structure (see `CLAUDE.md` → Architecture)

- **Top level**: anything in `src/` other than `main.jsx`, `App.jsx` and the role folders `api/`,
  `components/`, `constants/`, `helpers/`, `hooks/`, `pages/`, `store/`, `theme/` (Error). Loose files in
  `src/components/`, which holds only module folders (Error).
- **Module shape**: a module is `components/<Name>/`, `pages/<Name>Page/` or a section `…/components/<Name>/`.
  - no `index.js`, or a barrel that contains anything other than `export { default as X } from './X';` for
    each root `.jsx` (Error)
  - non-component files at a module root instead of `constants/`, `helpers/`, `hooks/` (Error)
  - `.jsx` at the module root that isn't public, i.e. not exported by the barrel (Error)
  - sections nested inside sections (Warning)
- **Placement by usage**:
  - a `src/components/<Name>/`, `src/hooks/` or `src/helpers/` file that only one module uses (Warning: move
    it into that module)
  - a module-private file (under a module's `components/`, `constants/`, `helpers/`, `hooks/`) that another
    module needs (Error: move it to the matching `src/` folder)
  - custom SVG icons outside `src/components/Icons/` (Warning)
- **Imports**:
  - another module imported by file path instead of through its barrel, or a private file imported from
    outside its module (Error)
  - `./` pointing outside the importer's folder and subfolders, or any `../` (Warning)
- **Shared module names**: a `src/components/` module named after a page or feature (e.g.
  `components/AuditTrail/` next to `pages/AuditTrailPage/`) instead of what it provides (Warning).
- **FSD directories**: any `[fsd]/`, `features/`, `entities/`, `widgets/`, `shared/` folder (Error).

### Layers and platform

- **Upward imports** (Error):
  - `components/**` importing from `@/pages/…`
  - `hooks/**` importing from `@/components/…` or `@/pages/…`
  - `api/**` importing anything other than `./admin.api` and `@/helpers/env.helpers`
  - `constants/**` or `helpers/**` (except `helpers/env.helpers.js`) importing project code
- **Page → page imports**: a file in `pages/A/` importing from `@/pages/B/…` (Error).
- **Runtime config**: `globalThis.admin_ui_config` / `window.admin_ui_config` read anywhere except
  `helpers/env.helpers.js` (Warning).
- **Hardcoded route strings** instead of `RouteDefinitions`, **hardcoded permission strings** instead of
  `PERMISSIONS` (Warning).
- **Raw `fetch`/`axios`** in components or hooks instead of RTK Query (Error).
- **Page registration**: every page in `pages/*Page/` must be wired in `constants/routes.constants.js`,
  `App.jsx` (via `guard()`), `ROUTE_PERMISSIONS`, `SIDEBAR_PERMISSIONS` and
  `components/Layout/components/Sidebar.jsx` (Error).
- **API tags**: every tag in `providesTags`/`invalidatesTags` must be listed in `admin.api.js` `tagTypes`
  (Error). Endpoint names not `<entity><Action>` (Warning).
- **Redux**: slices outside `store/<name>.slice.js`, actions not re-exported from `store/index.js`, or server
  data copied into a slice (Warning).

### Dead code

- Files nothing imports (except `main.jsx`) (Error)
- Exports nothing imports, including an exported injected API object
  (`export const xApi = adminApi.injectEndpoints`) and generated hooks no code uses (Warning). Values used
  only in their own file should be plain `const`.
- RTK Query endpoints no code calls (Warning)
- `package.json` dependencies nothing imports and no tool or peer dependency needs (Warning)
- Commented-out code, `console.log` / `console.warn`, `eslint-disable` comments (Warning)

### Component conventions

- **Missing `memo` wrapper**, **missing `displayName`**, **missing `export default`** (Error)
- **Props destructured in the parameter list**: `memo(({ a, b }) =>` or `function X({ a, b })` (Error)
- **Multiple components in one file** (Error)
- **Function declarations**: `function X(`, `memo(function X(` or `export default memo(X)` (Error)
- **New `propTypes`** (Warning)

### Styling violations

- **Raw HTML elements**: `<div>`, `<span>`, `<p>`, `<button>`, `<input>`, `<table>`, `<img>`, … instead of MUI
  / GridTable (Error). Inline text markup (`<strong>`, `<code>`, `<br>`) is allowed.
- **Inline styles**: `style={{}}` (Error). Inline `sx` objects with more than one property (Warning).
- **Style function**: missing, not named `camelCaseComponentNameStyles`, not below `displayName`, or without
  `/** @type {MuiSx} */`; module-level `const styles = { … }`; `styles` used in a hook's dependencies without
  `useMemo(() => fooStyles(), [])` (Warning)
- **px units** or **MUI spacing shorthands** (`mb: 2`, `px: 3`) instead of explicit `rem` properties
  (Warning). Theme and palette files are exempt.
- **Hardcoded colors** (`#…`, `rgb(`, `rgba(`, `palette.mode === 'dark' ? … : …`) outside
  `theme/light.palette.js`, `theme/dark.palette.js` and `theme/main.theme.js` (Warning). A new token added to
  only one palette (Error).
- **Semantic token misuse**: `background.*` used for `color`, `text.*` used for `backgroundColor`, `border.*`
  outside borders, `icon.*` outside icons (Warning)
- **`useTheme` from `@emotion/react`** (Error)
- **Per-path MUI imports** (`from '@mui/material/Box'`) instead of the barrel
  (`import { Box } from '@mui/material'`) (Warning). Icons (`@mui/icons-material/X`) and
  `@mui/material/styles` are exempt; the icons barrel (`from '@mui/icons-material'`) is not allowed (Warning).

### File naming violations

- Component files or module folders not PascalCase. Page module not `pages/<Name>Page/<Name>Page.jsx`
- Non-component files not named `<name>.<role>.js` (`.hooks.js`, `.helpers.js`, `.constants.js`, `.api.js`,
  `.slice.js`, `.theme.js`, `.palette.js`). Only `main.jsx`, `App.jsx`, `store/index.js` and barrels are
  exempt
- Tests outside `__tests__/`

## Output

Report findings grouped by severity:

1. **Errors** (must fix): structure and import violations, unregistered pages or tags, dead files, raw HTML,
   missing memo/displayName
2. **Warnings** (should fix): placement, naming, dead exports and dependencies, hardcoded
   routes/permissions/colors, px units, style-function issues
3. **Info** (suggestions): simplifications and reuse opportunities

For each finding, report:

- The clickable file path and line number
- What the violation is
- How to fix it (briefly)

When auditing all of `src/`, summarize repeated patterns (e.g. "4 components use `function` declarations")
instead of listing every file, and list only the top offenders.

End with a summary count: X errors, Y warnings, Z info.

Offer to write the report to `.claude/reports/architecture_audit.md` for large audits. Do not fix anything
unless the user asks. For fixes, use the `refactor-to-conventions` skill.
