---
name: refactor-to-conventions
description:
  Bring an admin_ui component, page module or folder that drifted from the project conventions back in line
  (module shape and placement by usage, barrels, one component per file, memo + displayName, style functions,
  rem/palette tokens, file naming, no dead code) and update every importer. Use when the user asks to
  refactor, clean up or modernize a file or folder. This replaces EliteaUI's transfer-to-fsd; admin_ui does
  not use FSD.
---

# Refactor to Conventions

Refactor a file (or folder) in `frontend/src/` so it follows the conventions in `CLAUDE.md`, and move it to
where its usage puts it if it's misplaced. Behavior must stay exactly the same.

## Input

The user provides a file path (e.g. `src/pages/SecretsPage/components/DeleteSecretDialog.jsx`) or a folder
path.

## Steps

### 1. Analyze the source

- Read the file and work out what it is: page, page-local component, shared component, hook, helper,
  constants, API file.
- List all imports and all importers (grep for the path and for the exported names).
- Note every convention violation (use the `architecture-check` skill checklist).

### 2. Decide the correct location

Follow "Where a file goes" and "Module shape" in `CLAUDE.md`:

- Used by one module (page, section or shared module) → inside that module: private components in
  `components/`, constants in `constants/`, helpers in `helpers/`, hooks in `hooks/`. A private component with
  its own private files becomes a section module (`components/<Name>/` with the same shape, one level deep).
- Used by 2+ pages or by the app shell → `src/components/<Name>/` (a module folder with `index.js`),
  `src/hooks/`, `src/helpers/` or `src/constants/`.
- A module moved to `src/components/` is named after what it provides, not after the page it came from
  (`AuditEventViews`, not `AuditTrail`).
- Never create FSD directories.
- If the file is already in the right place, don't move it.

### 3. Split and refactor

- **One file = one component**: extract every extra component (`NotFound`, `ActionFieldCard`, …) into its own
  `PascalCase.jsx` file in the module's `components/` folder, or into `src/components/<Name>/` if it's shared.
- Extract pure helpers used by more than this file into the module's `helpers/<name>.helpers.js` and shared
  constants into `constants/<name>.constants.js`.
- For each component:
  - `const X = memo(props => { const { … } = props; … });`
  - `X.displayName = 'X';` and `export default X;`
  - Arrow functions only
  - Replace `const styles = {…}` / `getStyles()` / inline `sx` objects / `style={{}}` with a
    `camelCaseNameStyles` function below `displayName`, annotated `/** @type {MuiSx} */`. When `styles` is
    used inside a hook, memoize it (`useMemo(() => fooStyles(), [])`) and list it in the deps
  - `px` → `rem`, MUI spacing shorthands → explicit `rem` properties, hardcoded colors (including
    `palette.mode === 'dark' ? … : …`) → palette tokens. Add missing tokens to **both** palettes with the
    exact current values so nothing changes visually. Fix semantic token misuse
  - Raw HTML → MUI components
  - Per-path MUI imports → one `import { … } from '@mui/material';` (icons stay per path)
  - Leave existing `propTypes` in place, but update them if props change
- Keep hook dependency arrays complete. Don't change behavior, API calls, text or layout.
- Remove dead code you find on the way: unused files, exports, endpoints, hooks and dependencies. Values used
  only in their own file become plain `const`.

### 4. Rename files if needed

Every non-component file is `<name>.<role>.js`: `use<Name>.hooks.js`, `<name>.helpers.js`,
`<name>.constants.js`, `<name>.api.js`, `<name>.slice.js`.

### 5. Update imports throughout the codebase

- Grep for every importer of the old path and names and update them. Other modules import through the barrel
  (`import { X } from '@/components/X';`); inside a module use `./` for the same folder or a subfolder and
  `@/` otherwise. Never `../`.
- Every module folder you create or change has an `index.js` exporting exactly its root `.jsx` files by name.
- Remove stale barrel exports.

### 6. Clean up

- Delete the original file if it was moved. Remove directories that are now empty.

### 7. Verify

From `frontend/`:

```bash
npm run format
npm run lint
npm run build
```

Where possible, compare the refactored UI in `npm run dev` with the previous behavior.

## Output

Provide a summary:

- **Refactored**: file → what changed (split components, style function, tokens, …)
- **Moved**: old path → new path (if any)
- **Updated imports**: files whose imports changed
- **Checks**: format / lint / build results
- **Removed**: dead code deleted (files, exports, endpoints, dependencies)
- **Follow-ups**: related files worth refactoring next (don't refactor them automatically)
