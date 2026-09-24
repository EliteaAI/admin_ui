# CLAUDE.md — Admin UI (frontend)

## Project Overview

Admin UI is the React SPA for Elitea **platform administration**: users, roles and permissions, projects,
budgets, secrets, LiteLLM, model prices, audit trail, schedules/tasks, platform configuration and features.

It is the frontend of the `admin_ui` pylon plugin. The plugin (one level up) serves the compiled bundle at
`/admin/app`, and the backend APIs live in other plugins (mostly `admin`, `elitea_core`, `secrets`,
`projects`) under `/api/v2`.

**Stack:** React 18 · Vite 6 · Redux Toolkit + RTK Query · React Router 7 · MUI 7 · Emotion · JavaScript (no
TypeScript)

## Quick Start

```bash
cd frontend
npm install          # install dependencies
npm run dev          # dev server at http://localhost:5174 (proxies /api to VITE_DEV_SERVER)
npm run build        # production build → ../static/dist (hidden from git locally, see below)
npm run lint         # eslint
npm run format       # prettier (formatting + import sorting)
```

Dev setup: copy `.env.example` to `.env` and set `VITE_SERVER_URL` (e.g. `http://<host>/api/v2`),
`VITE_DEV_TOKEN` (a platform API token) and optionally `VITE_DEV_SERVER` (proxy target for `/api`).

### Build output (`static/dist`)

- **`static/dist` is built by CI, never committed locally.** CI (`.github/workflows/build.yml`) rebuilds and
  commits it on every push to `main` / `release/*`, and `versioneer.yml` bumps `metadata.json`. Never stage,
  commit or push `static/dist/**` or a version bump by hand.
- Locally, `static/dist` is hidden from git with `git update-index --skip-worktree`. The flag is re-applied
  after every pull/checkout by local hooks in `.git/hooks/post-merge` and `post-checkout`, which are not
  pushed. `npm run build` is therefore safe and won't show up in `git status`. On a fresh clone, set it up
  once from the repo root (`admin_ui/`):
  ```bash
  git ls-files -z static/dist | xargs -0 git update-index --skip-worktree
  ```
  If `git pull` fails with "would be overwritten" on `static/dist` files, drop the local build and retry:
  ```bash
  git ls-files -z static/dist | xargs -0 git update-index --no-skip-worktree
  git checkout -- static/dist && git pull
  ```

## Architecture: Modules, Colocated by Usage

Admin UI does **not** use Feature-Sliced Design. `src/` has a small set of top-level role folders, and all UI
lives in **modules** that share one shape. Where a file goes depends on **who uses it**. Do not introduce
`[fsd]/`, `features/`, `entities/`, `widgets/` or `shared/`.

### Top level

```
frontend/src/
  main.jsx          → entry: Redux <Provider> + <ThemeWrapper> + <App />
  App.jsx           → router: every route wrapped in guard() → <ProtectedRoute>
  api/              → RTK Query: admin.api.js (base createApi) + one <domain>.api.js per backend domain
  components/       → shared modules: used by 2+ pages, or by the app shell (App.jsx / main.jsx)
  constants/        → app-wide constants: permissions.constants.js, routes.constants.js
  helpers/          → app-wide pure helpers: env.helpers.js (runtime config), exportToExcel.helpers.js
  hooks/            → hooks used by 2+ modules
  pages/            → one module per route: <Name>Page/
  store/            → Redux: index.js (store + action re-exports) + <name>.slice.js per slice
  theme/            → main.theme.js (MUI theme), light.palette.js / dark.palette.js (the only place hex colors live)
```

Nothing else lives at the top level. `components/` contains **only module folders**, never loose files.

### Module shape

A **module** is a shared component folder (`components/<Name>/`), a page folder (`pages/<Name>Page/`) or a
section of a page or shared module (`…/components/<Name>/`). Every module has the same shape. Subfolders exist
only when they have content.

```
<Name>/
  <Name>.jsx        public component(s): the ONLY .jsx files at the module root
  index.js          barrel: `export { default as <Name> } from './<Name>';` per public component. Always present
  components/       private components of this module (flat .jsx files, or section modules, see below)
  constants/        <name>.constants.js used only inside this module
  helpers/          <name>.helpers.js used only inside this module
  hooks/            use<Name>.hooks.js used only inside this module
```

- **Public vs private**: a `.jsx` at the module root is public and exported by `index.js`. Everything under
  `components/`, `constants/`, `helpers/` and `hooks/` is private to the module and never imported from
  outside it.
- **Section modules**: a private component that has private files of its own (sub-components, constants,
  helpers) becomes a folder with the same shape, e.g. `pages/FeaturesPage/components/SurveysSection/`. A
  private component without its own files stays a single `.jsx` in `components/`. Nest at most one level:
  sections do not contain sections.
- Most shared modules have one public component (`DrawerPage`). Kits expose several (`GridTable`:
  `GridTableContainer`, `GridTableHeader`, …; `Icons`: every custom SVG icon).

Example:

```
pages/SchedulesTasksPage/
  SchedulesTasksPage.jsx
  index.js
  components/
    TaskLogDrawer.jsx              used by two tabs of this page
    ActiveTasksTab/                section module
      ActiveTasksTab.jsx
      index.js
      components/ ActiveTasksNodeCard.jsx, CopyableCell.jsx, StackDumpDrawer.jsx
      constants/  activeTasks.constants.js
      helpers/    activeTasks.helpers.js
    SchedulesTab/ …
    TasksTab/ …
  hooks/
    useTaskLogSocket.hooks.js
```

### Where a file goes: decided by usage

| The file is used by…                               | It lives in                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| one file only (constants)                          | the top of that file                                                     |
| one module (page, section or shared module)        | that module: `components/`, `constants/`, `helpers/` or `hooks/`         |
| several sections of one page                       | the page module's own `components/` / `constants/` / … folder            |
| 2+ pages, or the app shell (`App.jsx`, `main.jsx`) | `src/components/<Name>/`, `src/hooks/`, `src/helpers/`, `src/constants/` |
| any page (backend call)                            | `src/api/<domain>.api.js`                                                |
| any page (permission key / route path)             | `src/constants/permissions.constants.js` / `routes.constants.js`         |
| any module (custom SVG icon)                       | `src/components/Icons/` — always, it is the project's single icon set    |

When usage changes, the file moves: a page-private component that a second page starts to use moves to
`src/components/<Name>/`, and a shared module that only one page still uses moves into that page. This is why
the Audit Trail page keeps `AuditTrailFilters` in its own `components/`, while the audit tables and heatmap
live in `src/components/AuditEventViews/`: the Users and Projects activity drawers use them too.

**Shared modules are named after what they are, never after a page or feature.** A name like
`components/AuditTrail/` suggests it belongs to the Audit Trail page and invites page-only code into it. Name
the thing it provides instead: `AuditEventViews`, `GridTable`, `LogViewerDrawer`, `SchemaForm`. When a page's
component becomes shared and moves to `src/components/`, rename it if its name ties it to that page.

### Imports

- **Across modules, import through the barrel, by name**:
  `import { GridTableRow } from '@/components/GridTable';`, `import { UsersPage } from '@/pages/UsersPage';`.
  Never reach into another module's files (`@/components/AuditEventViews/components/…` from outside
  `AuditEventViews` is an error).
- **Inside a module**: import files directly. Use `./` for the same folder or a subfolder
  (`./components/CreateSecretDialog`, `./constants/secrets.constants`) and `@/…` for anything else
  (`@/pages/SecretsPage/helpers/secrets.helpers` from `SecretsPage/components/`).
- Top-level role folders are imported by file: `@/hooks/useTableSort.hooks`,
  `@/constants/permissions.constants`, `@/api/users.api`, `@/helpers/env.helpers`, `@/store`.
- Never `../`.

### Layers and import direction (top → bottom)

```
app shell (main.jsx, App.jsx, store/, theme/)
  → pages/
    → components/
      → hooks/
        → api/
          → constants/ · helpers/
```

A layer may import only from layers **below** it:

- `pages/` may import from `components/`, `hooks/`, `api/`, `constants/`, `helpers/` and actions from
  `@/store`.
- `components/` must **never** import from `pages/`. Shared components may dispatch actions from `@/store`.
- `hooks/` must not import components or pages.
- `api/` imports only `./admin.api` and `@/helpers/env.helpers`.
- `constants/` and `helpers/` are pure and import nothing from the project, except `helpers/env.helpers.js`,
  which reads `globalThis.admin_ui_config`.
- **No page → page imports.** Move the shared piece down (see the placement table) and update every importer.

### Runtime config and auth

- The backend (`routes/ui.py`) injects `window.admin_ui_config` into `index.html`: `vite_server_url`,
  `vite_base_uri`, `user_id`, `user_name`, `user_email`, `permissions`, `roles`, plus any `extra_ui_config`.
- Read it only through `@/helpers/env.helpers`: `getEnvVar(name)` (falls back to
  `import.meta.env.VITE_<NAME>`) or `getAdminConfig()` for the whole object. Nothing else reads
  `globalThis.admin_ui_config`.
- Requests use cookie auth (`credentials: 'include'`). In dev, `VITE_DEV_TOKEN` is sent as a Bearer token.
- RBAC: `permissions`/`roles` land in the `user` slice. Check them with `useCheckPermission()`
  (`hasPermission`, `hasAnyPermission`, `isSuperAdmin`, …) against keys from `PERMISSIONS`. Routes are gated
  by `ROUTE_PERMISSIONS`, sidebar items by `SIDEBAR_PERMISSIONS`. UI checks are cosmetic: the backend still
  enforces every permission.

## Code Style Guide

These conventions match EliteaUI, and the whole of `src/` follows them. **All new and changed code must follow
them too.**

### Components

**One file = one component.** Never define multiple components in one file, including small helper components
like `NotFound` or `ActionFieldCard`. Extract each into its own `.jsx` file.

Always use `memo` with an arrow function. Destructure props inside the body, not in the parameter list. Always
set `displayName`. Use a `default` export.

```jsx
import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';

const ProjectCard = memo(props => {
  const { project, isActive = false, onSelect, sx } = props;

  const { hasPermission } = useCheckPermission();
  const canEdit = hasPermission(PERMISSIONS.projects.edit);

  const handleClick = useCallback(() => {
    onSelect?.(project.id);
  }, [onSelect, project.id]);

  const styles = projectCardStyles(isActive);

  return (
    <Box
      sx={[styles.root, sx]}
      onClick={handleClick}
    >
      <Typography variant="headingSmall">{project.name}</Typography>
      {canEdit && (
        <Typography
          variant="bodySmall"
          sx={styles.hint}
        >
          Click to edit
        </Typography>
      )}
    </Box>
  );
});

ProjectCard.displayName = 'ProjectCard';

/** @type {MuiSx} */
const projectCardStyles = isActive => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: isActive ? palette.background.tabButton.active : palette.background.secondary,
  }),
  hint: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default ProjectCard;
```

When `forwardRef` is needed, nest it inside `memo`:

```jsx
const SearchField = memo(
  forwardRef((props, ref) => {
    const { value, onChange, ...restProps } = props;
    return (
      <Input
        inputRef={ref}
        value={value}
        onChange={onChange}
        {...restProps}
      />
    );
  }),
);

SearchField.displayName = 'SearchField';
```

Forms that are **not** allowed: `function Foo({ a, b })` declarations, `memo(function Foo(props) { … })`,
`memo(({ a, b }) => …)`, `export default memo(Foo)`, missing `displayName`.

`PropTypes` is not used (`react/prop-types` is off). Don't add it to new components. If an existing component
already declares `propTypes`, keep them in sync when you change its props.

### Styling

**Use the style-function pattern with the MUI `sx` prop. No `styled()`, no `makeStyles`/`useStyles`, no CSS
files or modules, no `style={{}}` props.**

- Define the style function **below the component**, after `displayName`.
- Name it `camelCaseComponentNameStyles` (e.g. `projectCardStyles`) and annotate it with
  `/** @type {MuiSx} */`.
- It returns an object of named style keys. It may take arguments for conditional styles.
- Use `({ palette }) => ({ … })` for theme-dependent keys.
- **`rem` units only**: never `px` (`0.0625rem` = 1px). No MUI spacing shorthands (`mb: 2`, `px: 3`): use
  explicit properties with `rem` values (`marginBottom: '1rem'`).
- **Never hardcode colors.** Use palette tokens. Hex/rgba values belong only in `theme/light.palette.js` /
  `theme/dark.palette.js`. If a token is missing, add it to **both** palettes.
- **Use semantically correct tokens**:
  - `background.*` / `*.background.*` → only `backgroundColor` / `background`
  - `border.*` → only `border`, `borderColor`, `outline`
  - `text.*` → only `color` on text
  - `icon.*` → only `color` / `fill` on icons
- Merge an external `sx` with array syntax: `sx={[styles.root, sx]}`.
- No layout props directly on `Box` (`display`, `flexDirection`, …). Put them in `sx`.
- Trivial one-property `sx` inline (e.g. `sx={{ flex: 1 }}`) is tolerated. Anything more goes in the style
  function.
- No module-level `const styles = { … }` objects. When a style function is used inside a hook (e.g. a
  `renderCell` `useCallback`), memoize it: `const styles = useMemo(() => fooStyles(), []);` and list `styles`
  in the dependency array.

### MUI components and imports

- **Import MUI components from the `@mui/material` barrel**, as one named import per file:
  `import { Box, Checkbox, Typography } from '@mui/material';`. Never use per-component paths
  (`import Box from '@mui/material/Box'`).
- Icons stay per path (the icons barrel is too heavy for the dev server):
  `import EditOutlined from '@mui/icons-material/EditOutlined';`
- Theme utilities (`useTheme`, `createTheme`, `ThemeProvider`, `alpha`) come from `@mui/material/styles`.
- Never use raw HTML elements when MUI has an equivalent:

| Instead of    | Use                                                        |
| ------------- | ---------------------------------------------------------- |
| `<div>`       | `<Box>`                                                    |
| `<span>`      | `<Box component="span">` or `<Typography>`                 |
| `<p>`, `<h*>` | `<Typography variant="…">`                                 |
| `<button>`    | MUI `<Button>` / `<IconButton>`                            |
| `<input>`     | MUI `<TextField>` / `<Input>` / `<Checkbox>` / `<Switch>`  |
| `<select>`    | MUI `<Select>` / `<Autocomplete>`                          |
| `<ul>/<li>`   | MUI `<List>/<ListItem>`                                    |
| `<a>`         | React Router `<Link>` or MUI `<Link>`                      |
| `<table>`     | the project's `GridTable*` components (not MUI X DataGrid) |

- Custom typography variants (from `theme/main.theme.js`): `headingLarge`, `headingMedium`, `headingSmall`,
  `labelMedium`, `labelSmall`, `labelTiny`, `bodyMedium`, `bodySmall`, `bodySmall2`, `subtitle`.
- `useTheme` comes from `@mui/material/styles` (never `@emotion/react`).
- Custom SVG icons live in `components/Icons/`. Otherwise use `@mui/icons-material` `*Outlined` icons.

### Reuse project building blocks before writing new ones

| Need                                   | Use                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------- |
| Page container                         | `@/components/DrawerPage`                                                  |
| Page header (title, tabs, search, add) | `@/components/DrawerPageHeader`                                            |
| Data table                             | `@/components/GridTable` (`GridTableContainer/Header/Body/Row/Pagination`) |
| Column visibility by width             | `useResponsiveColumns` (`hideBelow` per column)                            |
| Client-side sorting                    | `useTableSort`                                                             |
| Debounced search                       | `useDebounceValue(search, 300)`                                            |
| Document title                         | `usePageTitle('Title')`                                                    |
| Permission checks                      | `useCheckPermission` + `PERMISSIONS`                                       |
| Collapsible block                      | `@/components/CollapsibleSection`                                          |
| Log viewers                            | `@/components/LogViewerDrawer`                                             |
| Audit event tables and heatmap         | `@/components/AuditEventViews`                                             |
| Schema-driven config forms             | `@/components/SchemaForm` (`SchemaForm`, `GuardrailsSection`)              |
| Excel export                           | `@/helpers/exportToExcel.helpers`                                          |

### Hooks

- File naming `use<Name>.hooks.js`, named exports only. Placement by usage: `src/hooks/` when 2+ modules use
  it, otherwise the module's own `hooks/` folder.
- Wrap callbacks in `useCallback` and derived values in `useMemo`, with complete dependency arrays
  (`react-hooks/exhaustive-deps` is an error).

```js
import { useCallback, useState } from 'react';

export const useDialogState = (initialTarget = null) => {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState(initialTarget);

  const handleOpen = useCallback((nextTarget = null) => {
    setTarget(nextTarget);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTarget(initialTarget);
  }, [initialTarget]);

  return { open, target, handleOpen, handleClose };
};
```

### Constants

- `UPPER_SNAKE_CASE` for constant names. Named exports.
- **Used in one file only**: define at the top of that file (e.g. a table's `COLUMNS` array).
- **Used across one module**: that module's `constants/<name>.constants.js`.
- **App-wide**: `src/constants/<name>.constants.js`. Permission keys always go in
  `constants/permissions.constants.js`, route paths in `constants/routes.constants.js`.
- Routes live in `RouteDefinitions` (`@/constants/routes.constants`). Never hardcode route strings.

### Helpers

- File naming: `<name>.helpers.js`. Pure arrow functions, named exports, no side effects, no React.
- Placement by usage: the module's own `helpers/` folder, or `src/helpers/` when 2+ modules use it.

### No dead code

- Every file is imported by something, and every export is imported somewhere else. Delete unused components,
  files, endpoints and exports instead of keeping them "just in case". Values used only inside their own file
  are plain `const`, not exported.
- RTK Query: export only the generated hooks that code uses. The injected API object
  (`const secretsApi = adminApi.injectEndpoints(…)`) is not exported. An endpoint that no hook user calls is
  removed.
- `package.json` lists only packages the code imports (or that tooling and peer dependencies need). Remove a
  dependency in the same change that removes its last use. No Storybook, no unused Vite plugins.
- No commented-out code, `console.log`, or `eslint-disable` comments.

### API layer (RTK Query)

- One file per backend domain: `api/<domain>.api.js` using `adminApi.injectEndpoints()`.
- Register every new tag in `tagTypes` in `api/admin.api.js`. Queries `providesTags`; mutations
  `invalidatesTags`.
- Endpoint names follow `<entity><Action>`: `secretList`, `secretCreate`, `projectBudgetUpdate`. The generated
  hooks (`useSecretListQuery`, `useLazySecretRevealQuery`, `useSecretCreateMutation`) are destructured and
  exported at the bottom of the file. Only hooks are exported, not the injected API object.
- No `axios`/`fetch` in components. Every HTTP call goes through RTK Query. Details: `.claude/rules/api.md`.

### Redux

- The store (`store/index.js`) holds `settings` (theme mode, socket status, sidebar state), `user` (user,
  permissions, roles) and the `adminApi` reducer. Import actions from `@/store`.
- Each slice lives in `store/<name>.slice.js` (`settings.slice.js`, `user.slice.js`) and exports the slice and
  its actions. `store/index.js` configures the store and re-exports all actions, so components import from
  `@/store` only.
- Server data belongs in RTK Query, not in slices. Add a slice only for real cross-page client state, and
  register it in `store/index.js`.
- Selectors: `useSelector(state => state.settings.mode)`.

### Barrel files (`index.js`)

Every module folder (`components/<Name>/`, `pages/<Name>Page/`, section folders) has an `index.js` with one
named export per public component, and nothing else:

```js
export { default as GridTableBody } from './GridTableBody';
export { default as GridTableContainer } from './GridTableContainer';
```

- Type folders (`components/`, `constants/`, `helpers/`, `hooks/`) and top-level role folders (`api/`,
  `hooks/`, `helpers/`, `constants/`) have **no** barrel. Import their files directly.
- Private files are never re-exported. If another module needs one, move it (see "Where a file goes").
- `App.jsx` imports pages through their barrels: `import { UsersPage } from '@/pages/UsersPage';`.

## File Naming Conventions

Every **component** file is `PascalCase.jsx`. Every **non-component** file is `<name>.<role>.js`, so the role
is visible from the name wherever the file lives.

| Category            | Convention                                    | Example                                                   |
| ------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Component files     | `PascalCase.jsx`                              | `DeleteSecretDialog.jsx`                                  |
| Module folders      | `PascalCase/`, named after the main component | `GridTable/`, `SurveysSection/`                           |
| Page module         | `pages/<Name>Page/<Name>Page.jsx`             | `pages/SecretsPage/SecretsPage.jsx`                       |
| Type / role folders | lowercase                                     | `components/`, `constants/`, `helpers/`, `hooks/`, `api/` |
| Hook files          | `use<Name>.hooks.js`                          | `useTableSort.hooks.js`                                   |
| Helper files        | `camelCase.helpers.js`                        | `budgetFormat.helpers.js`, `env.helpers.js`               |
| Constant files      | `camelCase.constants.js`                      | `permissions.constants.js`, `secrets.constants.js`        |
| API files           | `camelCase.api.js`                            | `admin.api.js`, `modelPrices.api.js`                      |
| Redux slice files   | `camelCase.slice.js`                          | `store/settings.slice.js`                                 |
| Theme files         | `camelCase.theme.js` / `camelCase.palette.js` | `theme/main.theme.js`, `theme/dark.palette.js`            |
| Test files          | `<name>.test.js(x)` inside `__tests__/`       | `__tests__/SecretsTable.test.jsx`                         |
| Barrel files        | `index.js`                                    | always `index.js`                                         |

The only files without a role suffix are `main.jsx`, `App.jsx`, `store/index.js` and barrels.

## Import Ordering

Prettier sorts imports automatically (`@trivago/prettier-plugin-sort-imports`), with blank lines between
groups:

1. `react`
2. Third-party libraries (`react-redux`, `react-router-dom`, `date-fns`, …)
3. `@mui/` imports
4. `@/` project imports
5. Relative imports (`./`)

The `@` alias maps to `src/`. Use `./` for the same folder or a subfolder of the importing file, `@/` for
everything else, never `../`. Other modules are imported through their barrel (see "Imports" under
Architecture).

## Formatting and linting

Same setup as EliteaUI: `.prettierrc` and `eslint.config.js` live in `frontend/`.

- 110-char print width, 2-space indent, single quotes, semicolons, trailing commas
- One JSX attribute per line when attributes wrap (`singleAttributePerLine`)
- No parens on single-arg arrow functions (`props =>`, `state =>`)
- ESLint: `react-hooks/exhaustive-deps`, `no-unused-vars`, `no-shadow`, `prefer-const`,
  `prefer-arrow-callback`, `import/no-unresolved`, `import/no-duplicates` are errors.
- `no-console` allows only `console.error`. Keep `console.error` in `catch` blocks for debugging. Don't leave
  `console.log`/`console.warn` behind.
- The codebase is lint-clean. Keep it that way: never add `eslint-disable` comments to silence a real issue.

Run `npm run format` and `npm run lint` before committing (see the `/prepare-commit` skill).

## Testing and verification

- **Build**: `npm run build` must pass for every change.
- **Unit tests**: no test runner is installed. If you add tests, add Vitest + React Testing Library, put them
  in a co-located `__tests__/` folder (never next to source files), wrap renders in `ThemeProvider`, select by
  `data-testid`, and add the `test` script in the same change.
- **Manual check**: for UI changes, run `npm run dev` against a real backend and test in the browser. Admin
  actions often need specific permissions, so say which role you checked with.
- Report checks you skipped or that failed, with the reason. Never report them as passing.

## Git

- The git root is the plugin folder (`admin_ui/`), one level above `frontend/`. The GitHub repo is
  `EliteaAI/admin_ui`, and the base branch is `main`.
- Branch: `<type>/<TICKET>/<short-kebab-description>`, e.g. `feat/EL-6687/add-new-palette-token`.
- Commit/PR title: `<type>: [<TICKET>] <Description>`, e.g.
  `fix: [EL-6368] Hide Chat Mentions from Configuration page`.
- Never commit `static/dist/**` or `metadata.json` version bumps. CI owns both.
- No AI attribution in commits or PRs.
- Workflow skills: `/prepare-commit` (format, lint, build) → `/create-branch` → `/commit-changes` →
  `/prepare-pr`. `/ship-changes` runs all four in order for the current working-tree changes.

## Key Conventions Checklist

- [ ] Each file sits where its usage puts it: one module → inside that module (`components/`, `constants/`,
      `helpers/`, `hooks/`); 2+ pages or the app shell → `src/components/<Name>/`, `src/hooks/`,
      `src/helpers/`, `src/constants/`
- [ ] Every module has the standard shape and an `index.js` barrel; other modules are imported through it
- [ ] No imports upward (`components/` → `pages/`) and no new page → page imports
- [ ] One file = one component
- [ ] `memo(props => { … })`, props destructured in the body, `displayName` set, `export default`
- [ ] Arrow functions only (no `function` declarations)
- [ ] Style function below the component, `camelCaseNameStyles`, `/** @type {MuiSx} */`
- [ ] `rem` units, palette tokens only, semantically correct token families
- [ ] MUI components, no raw HTML. MUI imported from the `@mui/material` barrel, icons per path
- [ ] Existing building blocks reused (`DrawerPage`, `DrawerPageHeader`, `GridTable`, hooks)
- [ ] Permission-gated actions use `useCheckPermission` + `PERMISSIONS`
- [ ] API calls via RTK Query with tags registered in `admin.api.js`
- [ ] `useCallback` for handlers passed to children or used in deps; `useMemo` for derived arrays/objects
- [ ] File names follow the table above (`PascalCase.jsx` or `<name>.<role>.js`); no `../` imports
- [ ] No dead code: no unused files, exports, endpoints or dependencies
- [ ] `npm run format`, `npm run lint`, `npm run build` pass; nothing from `static/dist` staged
