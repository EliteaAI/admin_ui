---
paths:
  - src/pages/**/*
  - src/App.jsx
  - src/constants/routes.constants.js
  - src/components/Layout/**/*
  - src/constants/permissions.constants.js
---

# Page Rules

Every admin section is a route with its own module folder in `src/pages/<Name>Page/`. Pages share one layout
and one set of building blocks. Follow the existing pattern so every section looks and behaves the same.

## Page module layout

```
pages/SecretsPage/
  SecretsPage.jsx           the page component (the only .jsx at the root)
  index.js                  export { default as SecretsPage } from './SecretsPage';
  components/               page-only dialogs, drawers, tables, sections
    CreateSecretDialog.jsx
    SecretsTable.jsx
    <Area>Section/          a sub-area with its own private files: same shape as a module, one level deep
  constants/secrets.constants.js
  helpers/secrets.helpers.js
  hooks/use<Name>.hooks.js
```

Anything a second page needs moves to `src/components/<Name>/` (or `src/hooks/`, `src/helpers/`,
`src/constants/`). See "Where a file goes" in `CLAUDE.md`.

## Anatomy of a list page

```jsx
const SecretsPage = memo(() => {
  usePageTitle('Secrets'); // 1. document title

  const { hasPermission } = useCheckPermission(); // 2. permission flags
  const canCreate = hasPermission(PERMISSIONS.secrets.create);

  const [search, setSearch] = useState(''); // 3. list state
  const debouncedSearch = useDebounceValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const { data, isFetching, isError } = useSecretListQuery(/* params */); // 4. RTK Query
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  // 5. dialog state (open flag + target) and useCallback handlers
  // 6. render
  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="Secrets"
          showSearchInput
          search={search}
          onSearchChange={handleSearchChange}
          showAddButton={canCreate}
          onAdd={handleCreateOpen}
          addButtonTooltip="Create secret"
        />
        {/* error state or <XxxTable … /> built on GridTable */}
      </DrawerPage>

      {/* dialogs/drawers as siblings of DrawerPage */}
      <CreateSecretDialog
        open={createOpen}
        onClose={handleCreateClose}
      />
    </>
  );
});
```

- Container: `DrawerPage`. Header: `DrawerPageHeader` (title, optional `tabs`, search input, add button,
  `extraContent`).
- Tables: a page-local `components/<Name>Table.jsx` built on `GridTableContainer` / `GridTableHeader` /
  `GridTableBody` / `GridTableRow` / `GridTablePagination`. Define columns as a `COLUMNS` constant with
  `field`, `label`, `width` (CSS grid track), `sortable`, `hideBelow` (px breakpoint), and filter them with
  `useResponsiveColumns`.
- Search: always debounce (`useDebounceValue(search, 300)`), and reset `page` to 0 when search, tab, filters
  or page size change.
- Server-side lists pass `limit`, `offset: page * pageSize`, `search`, `sort_by`, `sort_order` to the query.
  Client-side lists use `useTableSort` and slice for pagination.
- Error state: a centered `Box` with `<Typography variant="bodyMedium" color="error">`.
- Suspended/inactive rows render with reduced opacity. Status is shown as a `Chip`.
- Dialogs and drawers each go in their own file in the page's `components/` (`CreateXDialog.jsx`,
  `DeleteXDialog.jsx`, `XActivityDrawer.jsx`) and are rendered as siblings after `DrawerPage`.

## Dialogs

- MUI `Dialog` + `DialogTitle` / `DialogContent` / `DialogActions`, `maxWidth="sm" fullWidth`.
- Run mutations with `.unwrap()` inside `try/catch`. Show the error in an `Alert severity="error"` inside the
  dialog: `err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to <action>.'`
- Disable the action buttons while `isLoading`. Clear local error/form state on close.
- Destructive actions use `color="error"` and name the target in the confirmation text.
- Success feedback for page-level actions: `Snackbar` + `Alert`.

## Adding a new page — every step is required

1. `src/constants/routes.constants.js`: add `RouteDefinitions.<Name>: '/<kebab-path>'`.
2. `src/constants/permissions.constants.js`:
   - add the permission keys to `PERMISSIONS.<section>` (they must match the backend's `check_api([...])`
     permissions),
   - add `SIDEBAR_PERMISSIONS['<kebab-path>']` (the key is the path without the leading slash),
   - add `ROUTE_PERMISSIONS['/<kebab-path>']`.
3. `src/pages/<Name>Page/<Name>Page.jsx` + `src/pages/<Name>Page/index.js`
   (`export { default as <Name>Page } from './<Name>Page';`): the page module, following the layout and
   anatomy above.
4. `src/App.jsx`: `import { <Name>Page } from '@/pages/<Name>Page';` and
   `<Route path={RouteDefinitions.<Name>} element={guard(RouteDefinitions.<Name>, <NamePage />)} />`.
5. `src/components/Layout/components/Sidebar.jsx`: add an item to `TOP_MENU_ITEMS` or `BOTTOM_MENU_ITEMS` with
   `id` equal to the `SIDEBAR_PERMISSIONS` key and an `@mui/icons-material` `*Outlined` icon.
6. `src/api/<domain>.api.js` + new tag types in `src/api/admin.api.js` if the page needs new endpoints.

A page that isn't registered in all of `constants/routes.constants.js`, `permissions.constants.js`, `App.jsx`
and `Sidebar.jsx` is either unreachable or ungated.

## Page-to-page reuse

Never import from another page's folder. Move the shared piece to `src/components/<Name>/` (or `src/hooks/`,
`src/helpers/`, `src/constants/`) and update all importers in the same change.
