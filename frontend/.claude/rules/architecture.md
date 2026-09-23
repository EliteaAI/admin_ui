---
paths:
  - src/**/*
---

# Admin UI Architecture Rules

You are working inside `frontend/src/`. All new and substantially rewritten code here MUST follow these rules.
Admin UI uses a **page-colocated layered structure**, not Feature-Sliced Design. Never introduce `[fsd]/`,
`features/`, `entities/`, `widgets/` or `shared/` directories.

## Architecture

- **Layer import direction**: `app shell → pages → components → hooks → api → constants / utils`. A layer may
  only import from layers below it. Never import upward.
  - App shell = `main.jsx`, `App.jsx`, `routes.js`, `MainTheme.js`, `lightPalette.js`, `darkPalette.js`,
    `store/`.
  - `components/` never imports from `pages/`.
  - `hooks/` never imports components or pages.
  - `api/` imports only `./adminApi` and `@/utils/env`.
  - `constants/` and `utils/` are pure and import nothing from the project (`utils/env.js` may read
    `globalThis.admin_ui_config`).
- **No page → page imports in new code.** If a second page needs something from a page folder, move it down to
  `components/`, `hooks/` or `utils/` and update every importer. The existing `UsersPage` / `ProjectsPage` →
  `AuditTrailPage/*` imports are legacy exceptions. Don't add more.
- **Page-only code stays in the page folder** (`pages/<Name>Page/`): dialogs, drawers, tables, constants,
  helpers used only by that route. Large sub-areas get a nested `PascalCase` folder
  (`FeaturesPage/SurveysSection/`).
- **Shared code** (used by 2+ pages or by the layout) goes to `components/`, `hooks/`, `utils/` or
  `constants/`.
- **Server state lives in RTK Query** (`api/`), not in Redux slices or component state copies.
- **Runtime config** only through `@/utils/env`. Never read `globalThis.admin_ui_config` in components.
- **Routes** only through `RouteDefinitions` from `@/routes`. **Permission keys** only through `PERMISSIONS`
  from `@/constants/permissions`.
- Imports: `@/` for anything outside the current folder, `./` inside the same folder, never `../`.

## Component Rules

- **One file = one component.** Never define multiple components in a single file.
- **Always wrap in `memo`**: `const MyComponent = memo(props => { ... });`
- **Destructure props inside the body**, not in the parameter list: `const { prop1, prop2 } = props;`
- **Always set `displayName`**: `MyComponent.displayName = 'MyComponent';`
- **Always `export default`** for components.
- **Arrow functions only.** No `function` declarations, and no `memo(function Name() {})`.
- **`forwardRef` nests inside `memo`**:
  ```jsx
  const MyComp = memo(
    forwardRef((props, ref) => { ... }),
  );
  ```
- No new `propTypes`. Keep existing ones in sync if you change a component's props.
- Gate actions with `useCheckPermission()` + `PERMISSIONS`. Compute `canX` flags once near the top.

## Styling

- **Style function pattern only.** No `styled()`, `makeStyles`, `useStyles`, CSS files/modules, or
  `style={{}}` props.
- Define the style function **below the component**, after `displayName`.
- Name it `camelCaseComponentNameStyles` (e.g. `secretsTableStyles`).
- Annotate with `/** @type {MuiSx} */`.
- Use `({ palette }) =>` for theme-dependent styles.
- **`rem` units only**: never `px`. Use `0.0625rem` for 1px. No MUI spacing shorthands (`mb: 2`) in new code.
- **No hardcoded colors.** Palette tokens only. New tokens go into **both** `lightPalette.js` and
  `darkPalette.js`.
- **Semantic tokens**: `background.*` → backgrounds, `border.*` → borders/outlines, `text.*` → text color,
  `icon.*` → icon color/fill.
- Merge external `sx` with array syntax: `sx={[styles.root, sx]}`.
- **No layout props on MUI components** (`display`, `flexDirection` as props on `Box`). Always use `sx`.
- Legacy `const styles = { … }` objects: leave them alone unless rewriting the component.

## MUI — No Raw HTML

- `<div>` → `<Box>`
- `<span>` → `<Box component="span">` or `<Typography>`
- `<p>` / headings → `<Typography variant="…">` (`headingLarge|Medium|Small`, `labelMedium|Small|Tiny`,
  `bodyMedium|Small|Small2`, `subtitle`)
- `<button>` → MUI `<Button>` / `<IconButton>`
- `<input>` → MUI `<TextField>` / `<Input>` / `<Checkbox>` / `<Switch>`
- `<select>` → MUI `<Select>` / `<Autocomplete>`
- `<ul>/<li>` → MUI `<List>/<ListItem>`
- `<a>` → React Router `<Link>` or MUI `<Link>`
- `<table>` → `GridTable*` from `@/components/GridTable`
- Import MUI **per path**: `import Box from '@mui/material/Box';`
- `useTheme` from `@mui/material/styles`. **Never** from `@emotion/react`.

## File Naming

- Components: `PascalCase.jsx`. Page entry: `pages/<Name>Page/<Name>Page.jsx`
- Component and page folders: `PascalCase/`. Top-level role folders: lowercase
- Hooks: `use<Name>.hooks.js`
- Helpers: `camelCase.helpers.js`
- Constants: `camelCase.constants.js`
- API files: `camelCaseApi.js`
- Redux slices: `store/camelCase.slice.js`
- Stories: `PascalCase.stories.jsx` next to the component
- Tests: `<name>.test.js(x)`, always inside a `__tests__/` folder
- Barrel files: always `index.js`
- Legacy names (`constants.js`, `format.js`, `useTableSort.js`) stay. Don't rename as a side effect.

## Constants

- Used in one file only → top of that file.
- Shared within a page → `pages/<Name>Page/<name>.constants.js`.
- App-wide → `constants/<name>.constants.js`. Permissions always in `constants/permissions.js`.
- `UPPER_SNAKE_CASE` names, named exports.

## Hooks

- File suffix `.hooks.js`, named exports only.
- `useCallback` for handlers passed to children or used in dependency arrays. `useMemo` for derived
  arrays/objects passed down. Complete dependency arrays.

## Barrel Files

- Multi-file `components/` folders get an `index.js`:
  `export { default as GridTableRow } from './GridTableRow';`, `export * from './x.constants';`
- Page folders don't need a barrel.

## Tests

- Always in a `__tests__/` folder co-located with the code under test. Never next to source files.
- Vitest + React Testing Library, `data-testid` selectors, render inside `ThemeProvider`.

## Import Order

Prettier sorts imports automatically (`npm run format`):

1. `react`
2. Third-party libraries
3. `@mui/` imports
4. `@/` project imports
5. Relative imports (`./`)
