---
paths:
  - src/**/*
---

# Admin UI Architecture Rules

You are working inside `frontend/src/`. All code here follows these rules, and every change must keep it that
way. Admin UI groups code into **modules** that share one shape, placed by **who uses them**. It is not
Feature-Sliced Design: never introduce `[fsd]/`, `features/`, `entities/`, `widgets/` or `shared/`
directories.

## Structure

- **Top level of `src/`**: `main.jsx`, `App.jsx` and the role folders `api/`, `components/`, `constants/`,
  `helpers/`, `hooks/`, `pages/`, `store/`, `theme/`. Nothing else. `components/` holds only module folders.
- **Module** = `components/<Name>/`, `pages/<Name>Page/`, or a section `…/components/<Name>/`. Shape:
  ```
  <Name>/
    <Name>.jsx      public component(s): the only .jsx at the module root
    index.js        named exports of the public components (always present, nothing else)
    components/     private components (flat .jsx, or section modules of the same shape)
    constants/      <name>.constants.js   private to the module
    helpers/        <name>.helpers.js     private to the module
    hooks/          use<Name>.hooks.js    private to the module
  ```
  Create a subfolder only when it has content. A private component with its own private files becomes a
  section module. Sections don't nest further.
- **Placement by usage**:
  - used by one file → top of that file (constants only)
  - used by one module → inside that module
  - used by several sections of one page → the page module's own type folders
  - used by 2+ pages or by the app shell → `src/components/<Name>/`, `src/hooks/`, `src/helpers/`,
    `src/constants/`
  - custom SVG icons → always `src/components/Icons/`
- **When usage changes**, move the file in the same change and update every importer.
- **Shared module names** describe what the module provides (`AuditEventViews`, `GridTable`), never a page or
  feature name, so a shared module never looks page-owned.
- **Imports**: other modules only through their barrel, by name
  (`import { GridTableRow } from '@/components/GridTable';`,
  `import { UsersPage } from '@/pages/UsersPage';`). Never import another module's private files. Inside a
  module: `./` for the same folder or a subfolder, `@/` otherwise. Never `../`.

## Layers

- **Import direction**:
  `app shell (main.jsx, App.jsx, store/, theme/) → pages → components → hooks → api → constants / helpers`. A
  layer may only import from layers below it.
  - `components/` never imports from `pages/` (it may dispatch actions from `@/store`).
  - `hooks/` never imports components or pages.
  - `api/` imports only `./admin.api` and `@/helpers/env.helpers`.
  - `constants/` and `helpers/` are pure and import nothing from the project (`helpers/env.helpers.js` is the
    only reader of `globalThis.admin_ui_config`).
- **No page → page imports.** Move the shared piece down and update every importer.
- **Server state lives in RTK Query** (`api/`), not in Redux slices or component state copies.
- **Runtime config** only through `@/helpers/env.helpers` (`getEnvVar`, `getAdminConfig`).
- **Routes** only through `RouteDefinitions` from `@/constants/routes.constants`. **Permission keys** only
  through `PERMISSIONS` from `@/constants/permissions.constants`.

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
- **`rem` units only**: never `px`. Use `0.0625rem` for 1px. No MUI spacing shorthands (`mb: 2`): use explicit
  properties (`marginBottom: '1rem'`).
- **No hardcoded colors.** Palette tokens only. New tokens go into **both** `theme/light.palette.js` and
  `theme/dark.palette.js`.
- **Semantic tokens**: `background.*` → backgrounds, `border.*` → borders/outlines, `text.*` → text color,
  `icon.*` → icon color/fill.
- Merge external `sx` with array syntax: `sx={[styles.root, sx]}`.
- **No layout props on MUI components** (`display`, `flexDirection` as props on `Box`). Always use `sx`.
- No module-level `const styles = { … }` objects. Memoize the style function call
  (`useMemo(() => fooStyles(), [])`) when `styles` is used inside a hook.

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
- Import MUI components from the **barrel**: `import { Box, Checkbox, Typography } from '@mui/material';`.
  Never `import Box from '@mui/material/Box'`. Icons stay per path:
  `import EditOutlined from '@mui/icons-material/EditOutlined';`
- `useTheme` from `@mui/material/styles`. **Never** from `@emotion/react`.

## File Naming

- Components: `PascalCase.jsx`. Page module: `pages/<Name>Page/<Name>Page.jsx`
- Module folders: `PascalCase/`, named after their main component. Type and role folders: lowercase
- Every non-component file is `<name>.<role>.js`:
  - hooks `use<Name>.hooks.js`, helpers `camelCase.helpers.js`, constants `camelCase.constants.js`
  - API `camelCase.api.js`, Redux slices `store/camelCase.slice.js`
  - theme `theme/<name>.theme.js`, palettes `theme/<name>.palette.js`
- Tests: `<name>.test.js(x)`, always inside a `__tests__/` folder
- Barrel files: always `index.js`
- Only `main.jsx`, `App.jsx`, `store/index.js` and barrels have no role suffix

## No Dead Code

- No unused files, components, endpoints or exports. Export only what another file imports; values used only
  in their own file are plain `const`.
- API files export only the generated hooks that are used, never the injected API object.
- Remove a dependency in the same change that removes its last import. No commented-out code, `console.log` or
  `eslint-disable`.

## Constants

- Used in one file only → top of that file.
- Used across one module → that module's `constants/<name>.constants.js`.
- App-wide → `src/constants/<name>.constants.js`. Permissions always in `constants/permissions.constants.js`,
  route paths in `constants/routes.constants.js`.
- `UPPER_SNAKE_CASE` names, named exports.

## Hooks

- `use<Name>.hooks.js`, named exports only. `src/hooks/` when 2+ modules use it, otherwise the module's
  `hooks/`.
- `useCallback` for handlers passed to children or used in dependency arrays. `useMemo` for derived
  arrays/objects passed down. Complete dependency arrays.

## Barrel Files

- Every module has an `index.js` with one named export per public component:
  `export { default as GridTableRow } from './GridTableRow';`. Nothing else goes in it.
- Type folders and top-level role folders (`api/`, `constants/`, `helpers/`, `hooks/`) have no barrel.

## Tests

- Always in a `__tests__/` folder co-located with the code under test. Never next to source files.
- Vitest + React Testing Library, `data-testid` selectors, render inside `ThemeProvider`.

## Import Order

Prettier sorts imports automatically (`npm run format`):

1. `react`
2. Third-party libraries
3. `@mui/` imports
4. `@/` project imports
5. Relative imports (`./` — same folder or a subfolder only)
