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
- The architecture is **page-colocated layers, not FSD**: app shell (`main`, `App`, `routes`, theme, `store/`)
  → `pages/<Name>Page/` → `components/` → `hooks/` → `api/` → `constants/` / `utils/`. Import only downward.
  `components/` never imports `pages/`. No new page → page imports: move shared code down instead. Don't
  create FSD folders.
- Page-only dialogs, drawers, tables, constants and helpers live in the page folder. Code used by 2+ pages
  goes to `components/`, `hooks/` or `utils/`.
- A new page must be registered in `routes.js`, `constants/permissions.js` (`PERMISSIONS`,
  `SIDEBAR_PERMISSIONS`, `ROUTE_PERMISSIONS`), `App.jsx` (`guard()`) and `components/Layout/Sidebar.jsx`.

## Components and shared UI

- One component per `.jsx` file. Use `const Name = memo(props => { ... })`, destructure props inside the body,
  set `Name.displayName`, and default-export it. Nest `forwardRef` inside `memo`. No new `propTypes`.
- Reuse `DrawerPage`, `DrawerPageHeader`, `GridTable*`, `CollapsibleSection`, `LogViewerDrawer`, `SchemaForm`
  and the hooks `useCheckPermission`, `useTableSort`, `useResponsiveColumns`, `useDebounceValue`,
  `usePageTitle` before writing new equivalents.
- Use MUI components (per-path imports such as `@mui/material/Box`) instead of raw HTML. Tables use
  `GridTable`, not DataGrid.
- Gate actions with `useCheckPermission()` + `PERMISSIONS`. Use `RouteDefinitions` for routes. Read runtime
  config only via `@/utils/env`.
- Extract event handlers into `useCallback` with complete dependencies. Memoize derived arrays/objects passed
  to children.
- New hooks: `use<Name>.hooks.js`. Helpers: `<name>.helpers.js` (pure, named exports). Constants:
  `<name>.constants.js`, `UPPER_SNAKE_CASE`. Constants used in one file only stay local. Don't rename legacy
  files as a side effect.
- All HTTP goes through RTK Query: `api/<domain>Api.js` via `adminApi.injectEndpoints()`, `<entity><Action>`
  endpoint names, and new tags registered in `adminApi.js` `tagTypes` with proper `providesTags` /
  `invalidatesTags`.

## Styling

- Use MUI `sx` and a named `camelCaseComponentStyles` function below `displayName`, annotated
  `/** @type {MuiSx} */`. Keep styles out of inline JSX objects.
- Use rem units and semantic theme palette tokens. No hardcoded colors (new tokens go into both
  `lightPalette.js` and `darkPalette.js`), CSS files, CSS modules, `styled()`, `makeStyles` or `style={{}}`.
- Use background tokens for backgrounds, border tokens for borders, text tokens for text and icon tokens for
  icons. Import `useTheme` from `@mui/material/styles`.
- Merge external styles with `sx={[styles.root, sx]}`.

## Tests and verification

- From `frontend/`: `npm run format`, `npm run lint`, `npm run build` must pass.
- Formatting is two spaces, single quotes, 110 columns, trailing commas, one JSX attribute per line when
  wrapped, and unparenthesized single arrow arguments. Prettier sorts imports.
- No unit-test runner is configured yet. If you add tests, use Vitest + React Testing Library in co-located
  `__tests__/` folders, render inside `ThemeProvider`, select by `data-testid`, and add the `test` script.
- Stories are CSF3 `<Component>.stories.jsx` next to the component.
- Report failed or skipped checks with the actual reason. For UI changes, say which admin role you verified
  with.
- Commits and PR titles: `<type>: [<TICKET>] <Description>`. Branches: `<type>/<TICKET>/<kebab-desc>`. No AI
  attribution.
