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
npm run storybook    # Storybook at http://localhost:6006
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

## Architecture: Page-Colocated Layered Structure

Admin UI does **not** use Feature-Sliced Design. It uses a flat structure: code is grouped by technical role
(`api/`, `hooks/`, `components/`, …), and each route owns a page folder that holds everything used only by
that page. Keep that structure. Do not introduce `[fsd]/`, `features/`, `entities/`, `widgets/` or `shared/`.

```
frontend/src/
  main.jsx               → entry: Redux Provider, ThemeWrapper (MUI theme + socket.io), LocalizationProvider
  App.jsx                → router: routes wrapped in guard() → <ProtectedRoute>
  routes.js              → RouteDefinitions (route path constants)
  MainTheme.js           → MUI theme: typography variants, component overrides
  lightPalette.js / darkPalette.js → palette tokens (the only place hex colors live)
  store/                 → Redux store: settings + user slices, adminApi reducer
  pages/<Name>Page/      → one folder per route: page component + page-only dialogs, drawers, tables,
                           constants, helpers. Big sub-areas get a nested folder (FeaturesPage/SurveysSection/)
  components/            → UI shared by 2+ pages or by the app shell
                           (Layout, DrawerPage, DrawerPageHeader, GridTable, SchemaForm, LogViewerDrawer, Icons…)
  hooks/                 → shared React hooks (permissions, sorting, debounce, page title, sockets…)
  api/                   → RTK Query: adminApi.js (base) + one <domain>Api.js per backend domain
  constants/             → app-wide constants (permissions.js: PERMISSIONS, SIDEBAR_/ROUTE_PERMISSIONS)
  utils/                 → pure helpers + env.js (runtime config access)
```

### Layers and import direction (top → bottom)

```
app shell (main, App, routes, theme, store)
  → pages/
    → components/
      → hooks/
        → api/
          → constants/ · utils/
```

A layer may import only from layers **below** it:

- `pages/` may import from `components/`, `hooks/`, `api/`, `constants/`, `utils/` and actions from `@/store`.
- `components/` must **never** import from `pages/`.
- `hooks/` must not import components or pages.
- `api/` imports only `./adminApi` and `@/utils/env`.
- `constants/` and `utils/` are pure. They import nothing from the project, except `utils/env.js`, which reads
  `globalThis.admin_ui_config`.
- **No page → page imports in new code.** When a second page needs something from a page folder, move it down
  to `components/` (UI), `hooks/` (hook) or `utils/` (pure logic), then update every importer. The existing
  `UsersPage`/`ProjectsPage` → `AuditTrailPage/{AuditHeatmap,AuditTrailTable,AuditTraceTable}` imports are
  known legacy exceptions. Do not add more.

### Where new code goes

| You are adding…                               | Put it in                                                  |
| --------------------------------------------- | ---------------------------------------------------------- |
| A new admin section (route)                   | `pages/<Name>Page/<Name>Page.jsx` (see `/add-page` skill)  |
| A dialog / drawer / table used by one page    | that page's folder: `pages/<Name>Page/<Thing>.jsx`         |
| A large sub-area of a page with several files | nested folder: `pages/<Name>Page/<Area>Section/`           |
| UI used by 2+ pages or by the layout          | `components/<Name>.jsx` or `components/<Group>/<Name>.jsx` |
| A Configuration/Features schema-driven field  | `components/SchemaForm/`                                   |
| A hook used by 2+ files                       | `hooks/use<Name>.hooks.js`                                 |
| A backend call                                | `api/<domain>Api.js` via `adminApi.injectEndpoints()`      |
| A permission key                              | `constants/permissions.js`                                 |
| A pure helper used by 2+ places               | `utils/<name>.helpers.js`                                  |
| Constants / helpers used by one page only     | `pages/<Name>Page/<name>.constants.js` / `.helpers.js`     |
| Constants used by one file only               | top of that file                                           |

### Runtime config and auth

- The backend (`routes/ui.py`) injects `window.admin_ui_config` into `index.html`: `vite_server_url`,
  `vite_base_uri`, `user_id`, `user_name`, `user_email`, `permissions`, `roles`, plus any `extra_ui_config`.
- Read it only through `@/utils/env` (`getEnvVar(name)` falls back to `import.meta.env.VITE_<NAME>`). Never
  read `globalThis.admin_ui_config` directly in components.
- Requests use cookie auth (`credentials: 'include'`). In dev, `VITE_DEV_TOKEN` is sent as a Bearer token.
- RBAC: `permissions`/`roles` land in the `user` slice. Check them with `useCheckPermission()`
  (`hasPermission`, `hasAnyPermission`, `isSuperAdmin`, …) against keys from `PERMISSIONS`. Routes are gated
  by `ROUTE_PERMISSIONS`, sidebar items by `SIDEBAR_PERMISSIONS`. UI checks are cosmetic: the backend still
  enforces every permission.

## Code Style Guide

These conventions match EliteaUI. Existing files don't all follow them yet. **All new code, and any component
you substantially rewrite, must follow them.** Do not refactor untouched legacy code as a side effect.

### Components

**One file = one component.** Never define multiple components in one file, including small helper components
like `NotFound` or `ActionFieldCard`. Extract each into its own `.jsx` file.

Always use `memo` with an arrow function. Destructure props inside the body, not in the parameter list. Always
set `displayName`. Use a `default` export.

```jsx
import { memo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { PERMISSIONS } from '@/constants/permissions';
import { useCheckPermission } from '@/hooks/useCheckPermission';

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

Legacy forms you will see and should **not** copy into new code: `function Foo({ a, b })` declarations,
`memo(function Foo(props) { … })`, `memo(({ a, b }) => …)`, missing `displayName`. When you substantially edit
such a component, convert it to the pattern above.

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
- **`rem` units only**: never `px` (`0.0625rem` = 1px). MUI spacing shorthands (`mb: 2`, `px: 3`) are legacy.
  Use explicit `rem` values in new code.
- **Never hardcode colors.** Use palette tokens. Hex/rgba values belong only in `lightPalette.js` /
  `darkPalette.js`. If a token is missing, add it to **both** palettes.
- **Use semantically correct tokens**:
  - `background.*` / `*.background.*` → only `backgroundColor` / `background`
  - `border.*` → only `border`, `borderColor`, `outline`
  - `text.*` → only `color` on text
  - `icon.*` → only `color` / `fill` on icons
- Merge an external `sx` with array syntax: `sx={[styles.root, sx]}`.
- No layout props directly on `Box` (`display`, `flexDirection`, …). Put them in `sx`.
- Trivial one-property `sx` inline (e.g. `sx={{ flex: 1 }}`) is tolerated. Anything more goes in the style
  function.
- Legacy files use a module-level `const styles = { … }` object. Leave them alone unless you are rewriting the
  component, and then switch to the style function.

### MUI components and imports

- **Import MUI per component path** (this repo's convention, not the barrel):
  `import Box from '@mui/material/Box';`, `import EditOutlined from '@mui/icons-material/EditOutlined';`
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

- Custom typography variants (from `MainTheme.js`): `headingLarge`, `headingMedium`, `headingSmall`,
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
| Plugin/config forms                    | `@/components/SchemaForm`                                                  |
| Excel export                           | `@/utils/exportToExcel`, `@/utils/exportSurveyXlsx`                        |

### Hooks

- Shared hooks: `hooks/use<Name>.hooks.js`. Named exports only. Page-only hooks may live in the page folder
  with the same naming.
- Wrap callbacks in `useCallback` and derived values in `useMemo`, with complete dependency arrays
  (`react-hooks/exhaustive-deps` is an error).
- Existing hooks keep their legacy names (`useTableSort.js`, …). Import them as they are. Do not rename them
  as a side effect.

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
- **Shared within one page**: `pages/<Name>Page/<name>.constants.js`.
- **App-wide**: `constants/<name>.constants.js`, except permission keys, which always go in
  `constants/permissions.js`.
- Routes live in `RouteDefinitions` (`@/routes`). Never hardcode route strings.

### Helpers

- File naming: `<name>.helpers.js`. Pure arrow functions, named exports, no side effects, no React.
- Page-only helpers go in the page folder. Shared helpers go in `utils/`.

### API layer (RTK Query)

- One file per backend domain: `api/<domain>Api.js` using `adminApi.injectEndpoints()`.
- Register every new tag in `tagTypes` in `api/adminApi.js`. Queries `providesTags`; mutations
  `invalidatesTags`.
- Endpoint names follow `<entity><Action>`: `secretList`, `secretCreate`, `projectBudgetUpdate`. The generated
  hooks (`useSecretListQuery`, `useLazySecretRevealQuery`, `useSecretCreateMutation`) are destructured and
  exported at the bottom of the file.
- No `axios`/`fetch` in components. Every HTTP call goes through RTK Query. Details: `.claude/rules/api.md`.

### Redux

- The store (`store/index.js`) holds `settings` (theme mode, socket status, sidebar state), `user` (user,
  permissions, roles) and the `adminApi` reducer. Import actions from `@/store`.
- Server data belongs in RTK Query, not in slices. Add a slice only for real cross-page client state, as
  `store/<name>.slice.js`, registered in `store/index.js`. Mirror it in `.storybook/storybookStore.js` if
  components in stories read it.
- Selectors: `useSelector(state => state.settings.mode)`.

### Barrel files (`index.js`)

Multi-file component folders expose a barrel (`GridTable/`, `LogViewerDrawer/`,
`SchemaForm/CustomThemeSection/`). Add one when a `components/` folder has 2+ public files:

```js
export { default as GridTableContainer } from './GridTableContainer';
export * from './customTheme.constants';
```

Page folders don't need a barrel. `App.jsx` imports `@/pages/<Name>Page/<Name>Page` directly.

## File Naming Conventions

| Category               | Convention                                       | Example                             |
| ---------------------- | ------------------------------------------------ | ----------------------------------- |
| Component files        | `PascalCase.jsx`                                 | `DeleteSecretDialog.jsx`            |
| Page entry             | `pages/<Name>Page/<Name>Page.jsx`                | `pages/SecretsPage/SecretsPage.jsx` |
| Component/page folders | `PascalCase/`                                    | `GridTable/`, `SurveysSection/`     |
| Top-level role folders | lowercase                                        | `api/`, `hooks/`, `utils/`          |
| Hook files             | `use<Name>.hooks.js`                             | `useDialogState.hooks.js`           |
| Helper files           | `camelCase.helpers.js`                           | `budgetFormat.helpers.js`           |
| Constant files         | `camelCase.constants.js`                         | `secrets.constants.js`              |
| API files              | `camelCaseApi.js`                                | `modelPricesApi.js`                 |
| Redux slice files      | `camelCase.slice.js`                             | `store/filters.slice.js`            |
| Story files            | `PascalCase.stories.jsx` (next to the component) | `ExampleButton.stories.jsx`         |
| Test files             | `<name>.test.js(x)` inside `__tests__/`          | `__tests__/SecretsTable.test.jsx`   |
| Barrel files           | `index.js`                                       | always `index.js`                   |

Legacy names (`constants.js`, `format.js`, `groupTasks.js`, `useTableSort.js`) stay until a dedicated
refactor. Don't rename files as a side effect of an unrelated change.

## Import Ordering

Prettier sorts imports automatically (`@trivago/prettier-plugin-sort-imports`), with blank lines between
groups:

1. `react`
2. Third-party libraries (`react-redux`, `react-router-dom`, `date-fns`, …)
3. `@mui/` imports
4. `@/` project imports
5. Relative imports (`./`)

The `@` alias maps to `src/`. Use `@/` for anything outside the current folder. Use `./` only inside the same
folder. Never use `../`.

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
- **Storybook**: stories use CSF3 (`export default { title, component }` + named story objects), colocated as
  `<Component>.stories.jsx`. The decorator in `.storybook/preview.jsx` provides the theme, the Redux
  `storybookStore` and the date localization.
- **Unit tests**: no runner script is configured yet. If you add tests, use Vitest + React Testing Library,
  put them in a co-located `__tests__/` folder (never next to source files), wrap renders in `ThemeProvider`,
  select by `data-testid`, and add the `test` script in the same change.
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

## Key Conventions Checklist

- [ ] Code sits in the right layer: page-only → page folder; shared → `components/` / `hooks/` / `utils/`
- [ ] No imports upward (`components/` → `pages/`) and no new page → page imports
- [ ] One file = one component
- [ ] `memo(props => { … })`, props destructured in the body, `displayName` set, `export default`
- [ ] Arrow functions only (no `function` declarations)
- [ ] Style function below the component, `camelCaseNameStyles`, `/** @type {MuiSx} */`
- [ ] `rem` units, palette tokens only, semantically correct token families
- [ ] MUI components, no raw HTML. MUI imported per path
- [ ] Existing building blocks reused (`DrawerPage`, `DrawerPageHeader`, `GridTable`, hooks)
- [ ] Permission-gated actions use `useCheckPermission` + `PERMISSIONS`
- [ ] API calls via RTK Query with tags registered in `adminApi.js`
- [ ] `useCallback` for handlers passed to children or used in deps; `useMemo` for derived arrays/objects
- [ ] File names follow the table above; `@/` imports, no `../`
- [ ] `npm run format`, `npm run lint`, `npm run build` pass; nothing from `static/dist` staged
