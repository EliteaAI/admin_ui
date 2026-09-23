# Admin UI agent guidance

This folder holds the React 18 / Vite 6 / Redux Toolkit + RTK Query / MUI 7 frontend of the `admin_ui` pylon
plugin (platform administration SPA served at `/admin/app`). Use JavaScript. Do not introduce TypeScript or
upgrade dependencies as a side effect. These rules are derived from [CLAUDE.md](./CLAUDE.md). Read it for the
full architecture, examples and conventions before editing UI code.

## Ownership and scope

- The git root is the plugin folder (`admin_ui/`), one level up. Check `git status` before changes and
  preserve unrelated work.
- Never stage or commit `static/dist/**` or `metadata.json` version bumps. CI builds and versions them.
  Locally, `static/dist` is marked skip-worktree, so `npm run build` is safe.
- The architecture is **modules placed by usage, not FSD** (full spec: `CLAUDE.md` → Architecture). `src/` has
  `main.jsx`, `App.jsx` and the role folders
  `api/ components/ constants/ helpers/ hooks/ pages/ store/ theme/`. Layers import only downward: app shell →
  `pages/` → `components/` → `hooks/` → `api/` → `constants/` / `helpers/`. No page → page imports. Don't
  create FSD folders.
- Every module (`components/<Name>/`, `pages/<Name>Page/`, section `…/components/<Name>/`) has the same shape:
  public `.jsx` at the root, an `index.js` barrel with named exports, and private `components/`, `constants/`,
  `helpers/`, `hooks/` subfolders. A file used by one module lives inside it; a file used by 2+ pages or the
  app shell goes to `src/components/<Name>/`, `src/hooks/`, `src/helpers/` or `src/constants/`. Other modules
  are imported only through their barrel. Non-component files are named `<name>.<role>.js`. Shared modules are
  named after what they provide, never after a page.
- No dead code: no unused files, exports, endpoints or dependencies. API files export only the used hooks.
- A new page must be registered in `constants/routes.constants.js`, `constants/permissions.constants.js`
  (`PERMISSIONS`, `SIDEBAR_PERMISSIONS`, `ROUTE_PERMISSIONS`), `App.jsx` (`guard()`) and
  `components/Layout/components/Sidebar.jsx`.

## Components and shared UI

- One component per `.jsx` file. Use `const Name = memo(props => { ... })`, destructure props inside the body,
  set `Name.displayName`, and default-export it. Nest `forwardRef` inside `memo`. No new `propTypes`.
- Reuse `DrawerPage`, `DrawerPageHeader`, `GridTable*`, `CollapsibleSection`, `LogViewerDrawer`, `SchemaForm`,
  `AuditEventViews` and the hooks `useCheckPermission`, `useTableSort`, `useResponsiveColumns`,
  `useDebounceValue`, `usePageTitle` before writing new equivalents.
- Use MUI components (barrel import: `import { Box, Typography } from '@mui/material';`) instead of raw HTML.
  Tables use `GridTable`, not DataGrid.
- Gate actions with `useCheckPermission()` + `PERMISSIONS`. Use `RouteDefinitions` for routes. Read runtime
  config only via `@/helpers/env.helpers`.
- Extract event handlers into `useCallback` with complete dependencies. Memoize derived arrays/objects passed
  to children.
- New hooks: `use<Name>.hooks.js`. Helpers: `<name>.helpers.js` (pure, named exports). Constants:
  `<name>.constants.js`, `UPPER_SNAKE_CASE`. Constants used in one file only stay local.
- All HTTP goes through RTK Query: `api/<domain>.api.js` via `adminApi.injectEndpoints()`, `<entity><Action>`
  endpoint names, and new tags registered in `admin.api.js` `tagTypes` with proper `providesTags` /
  `invalidatesTags`.

## Styling

- Use MUI `sx` and a named `camelCaseComponentStyles` function below `displayName`, annotated
  `/** @type {MuiSx} */`. Keep styles out of inline JSX objects (one-property `sx` is fine). Memoize the style
  call (`useMemo(() => fooStyles(), [])`) when `styles` is used inside a hook.
- Use rem units and semantic theme palette tokens. No hardcoded colors (new tokens go into both
  `theme/light.palette.js` and `theme/dark.palette.js`), CSS files, CSS modules, `styled()`, `makeStyles` or
  `style={{}}`.
- Use background tokens for backgrounds, border tokens for borders, text tokens for text and icon tokens for
  icons. Import `useTheme` from `@mui/material/styles`.
- Merge external styles with `sx={[styles.root, sx]}`.

## Tests and verification

- From `frontend/`: `npm run format`, `npm run lint`, `npm run build` must pass.
- Formatting is two spaces, single quotes, 110 columns, trailing commas, one JSX attribute per line when
  wrapped, and unparenthesized single arrow arguments. Prettier sorts imports.
- No test runner is installed. If you add tests, add Vitest + React Testing Library in co-located `__tests__/`
  folders, render inside `ThemeProvider`, select by `data-testid`, and add the `test` script.
- Report failed or skipped checks with the actual reason. For UI changes, say which admin role you verified
  with.
- Commits and PR titles: `<type>: [<TICKET>] <Description>`. Branches: `<type>/<TICKET>/<kebab-desc>`. No AI
  attribution.
