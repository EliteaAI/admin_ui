---
name: refactor-to-conventions
description:
  Bring a legacy admin_ui component, page folder or module up to the project conventions (one component per
  file, memo + displayName, style functions, rem/palette tokens, correct layer placement, file naming) and
  update every importer. Use when the user asks to refactor, clean up or modernize a file or folder. This
  replaces EliteaUI's transfer-to-fsd; admin_ui does not use FSD.
---

# Refactor to Conventions

Refactor a legacy file (or folder) in `frontend/src/` so it follows the conventions in `CLAUDE.md`, and move
it to the correct layer if it's misplaced. Behavior must stay exactly the same.

## Input

The user provides a file path (e.g. `src/pages/SecretsPage/DeleteSecretDialog.jsx`) or a folder path.

## Steps

### 1. Analyze the source

- Read the file and work out what it is: page, page-local component, shared component, hook, helper,
  constants, API file.
- List all imports and all importers (grep for the path and for the exported names).
- Note every convention violation (use the `architecture-check` skill checklist).

### 2. Decide the correct location

- Used by one page only → `pages/<Name>Page/` (nested `<Area>Section/` folder for big sub-areas).
- Used by 2+ pages or by the layout → `components/` (UI), `hooks/` (hook), `utils/` (pure logic), `constants/`
  (app-wide constants).
- Never create FSD directories.
- If the file is already in the right place, don't move it.

### 3. Split and refactor

- **One file = one component**: extract every extra component (`NotFound`, `ActionFieldCard`, …) into its own
  `PascalCase.jsx` file next to its parent, or into `components/` if it's shared.
- Extract module-level pure helpers used by more than this file into `<name>.helpers.js`. Move shared
  constants into `<name>.constants.js`.
- For each component:
  - `const X = memo(props => { const { … } = props; … });`
  - `X.displayName = 'X';` and `export default X;`
  - Arrow functions only
  - Replace `const styles = {…}` / `getStyles()` / inline `sx` objects / `style={{}}` with a
    `camelCaseNameStyles` function below `displayName`, annotated `/** @type {MuiSx} */`
  - `px` → `rem`, MUI spacing shorthands → explicit `rem`, hardcoded colors → palette tokens (add missing
    tokens to **both** palettes), and fix semantic token misuse
  - Raw HTML → MUI components
  - MUI barrel imports → per-path imports
  - Leave existing `propTypes` in place, but update them if props change
- Keep hook dependency arrays complete. Don't change behavior, API calls, text or layout.

### 4. Rename files if needed

Only when the user asked for naming cleanup or the file is being moved anyway:

- hooks → `use<Name>.hooks.js`, helpers → `<name>.helpers.js`, constants → `<name>.constants.js`.

### 5. Update imports throughout the codebase

- Grep for every importer of the old path and names and update them to the new `@/…` path.
- Update or create barrel `index.js` files in `components/` folders that have 2+ public files.
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
- **Follow-ups**: related legacy files worth refactoring next (don't refactor them automatically)
