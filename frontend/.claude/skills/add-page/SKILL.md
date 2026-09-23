---
name: add-page
description:
  Scaffold a new admin section in admin_ui - route constant, permission keys, page folder with
  DrawerPage/DrawerPageHeader/GridTable, App.jsx guarded route, Sidebar entry and RTK Query API file. Use when
  the user asks to add a new page, section, route or sidebar item to the admin UI.
---

# Add Page

Create a new admin section wired end to end: route, permissions, page, router, sidebar and API.

## Input

Ask for anything missing:

- **Name**: e.g. `Widgets` → `WidgetsPage`, path `/widgets`
- **Sidebar label and placement**: top list (`topMenuItems`) or bottom list (`bottomMenuItems`)
- **Backend endpoints** the page uses (URL, method, params). Never invent endpoints. If the backend isn't
  ready, ask.
- **Permission keys** the backend checks (from the endpoint's `check_api([...])`)

## Steps

Read `.claude/rules/pages.md` and `.claude/rules/api.md` first. Then:

1. **Route**: `src/routes.js` → `Widgets: '/widgets'` in `RouteDefinitions`.
2. **Permissions**: `src/constants/permissions.js`:
   - `PERMISSIONS.widgets = { view: '…', create: '…', edit: '…', delete: '…' }`
   - `SIDEBAR_PERMISSIONS.widgets = [PERMISSIONS.widgets.view]` (key = path without the slash; quote keys that
     contain dashes)
   - `ROUTE_PERMISSIONS['/widgets'] = SIDEBAR_PERMISSIONS.widgets`
3. **API**: `src/api/widgetsApi.js` with `adminApi.injectEndpoints()`. Add the new tag (e.g. `'Widgets'`) to
   `tagTypes` in `src/api/adminApi.js`.
4. **Page folder**: `src/pages/WidgetsPage/`
   - `WidgetsPage.jsx`: `usePageTitle`, permission flags, search/page/pageSize state, the query,
     `DrawerPage` + `DrawerPageHeader`, error state, the table, dialogs as siblings
   - `WidgetsTable.jsx`: `GridTable*` components, `COLUMNS` constant, `useResponsiveColumns`, `renderCell` /
     `renderActions`
   - one file per dialog/drawer (`CreateWidgetDialog.jsx`, `DeleteWidgetDialog.jsx`, …)
   - `widgets.constants.js` / `widgets.helpers.js` only if they are shared within the page
   - Every component follows the `CLAUDE.md` pattern: `memo(props => …)`, `displayName`, a style function with
     `/** @type {MuiSx} */`, `rem`, palette tokens, per-path MUI imports
5. **Router**: `src/App.jsx` → import the page and add
   `<Route path={RouteDefinitions.Widgets} element={guard(RouteDefinitions.Widgets, <WidgetsPage />)} />`
   before the `*` route.
6. **Sidebar**: `src/components/Layout/Sidebar.jsx` → add
   `{ id: 'widgets', label: 'Widgets', icon: <Some>OutlinedIcon, url: RouteDefinitions.Widgets }` to the
   chosen list. `id` must equal the `SIDEBAR_PERMISSIONS` key.

Use an existing page of similar shape as the reference: `SecretsPage` (client-side list with dialogs),
`BudgetsPage` / `ProjectsPage` (server-side pagination), `PlatformDimensionsPage` (dialog-based CRUD).

## Verify

From `frontend/`:

```bash
npm run format
npm run lint
npm run build
```

Then run `npm run dev` and check that the sidebar item appears only for users with the permission, that the
route redirects when the permission is missing, and that the list loads.

## Output

- Files created and files modified
- Permission keys added (the backend must define the same keys)
- Check results, plus anything that couldn't be verified (e.g. no backend available)
