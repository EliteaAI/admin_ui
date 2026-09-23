---
paths:
  - src/api/**/*
  - src/store/**/*
---

# API and Store Rules

## RTK Query

All HTTP goes through RTK Query. `axios` is not a dependency: don't add it. No raw `fetch` in components.

- `api/admin.api.js` is the single base API: `fetchBaseQuery` with `baseUrl: V2_BASE` (`/api/v2`),
  `credentials: 'include'`, and `Authorization: Bearer <VITE_DEV_TOKEN>` in dev only. Don't create a second
  `createApi`.
- One file per backend domain: `api/<domain>.api.js`:

```js
import { adminApi } from './admin.api';

const widgetsApi = adminApi.injectEndpoints({
  endpoints: build => ({
    widgetList: build.query({
      query: ({ limit = 20, offset = 0, search, sort_by, sort_order } = {}) => ({
        url: '/admin/widgets/administration',
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
        },
      }),
      providesTags: ['Widgets'],
    }),

    widgetUpdate: build.mutation({
      query: ({ widgetId, ...body }) => ({
        url: `/admin/widget/administration/${widgetId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Widgets'],
    }),
  }),
});

export const { useWidgetListQuery, useWidgetUpdateMutation } = widgetsApi;
```

### Rules

- **Tags**: add every new tag to `tagTypes` in `admin.api.js`. Queries `providesTags`; every mutation that
  changes list data `invalidatesTags`. A missing invalidation means a stale table after save.
- **Endpoint names**: `<entity><Action>` in camelCase (`secretList`, `secretReveal`, `secretCreate`,
  `projectBudgetUpdate`, `userSuspend`). Hooks come out as `use<Entity><Action>Query/Mutation`, and lazy
  queries as `useLazy<Entity><Action>Query`.
- **URLs** are relative to `/api/v2` and follow the pylon pattern
  `/<plugin>/<resource>/administration[/<id>…]`. The mode segment is `administration` for admin endpoints.
  Platform-level (non-project) resources use project id `0` where the backend expects one (e.g. secrets).
- Wrap user-supplied path segments in `encodeURIComponent`.
- Optional query params: spread conditionally (`...(search && { search })`) so empty values aren't sent.
- Omit (don't null) body fields the caller doesn't manage when the backend treats "absent" as "unchanged". Add
  a short comment explaining it.
- Response shaping: `transformResponse` in the endpoint, or a pure helper in the module's `helpers/` (or
  `src/helpers/` when shared). Don't reshape in several components.
- Export the generated hooks with one destructuring statement at the bottom of the file, and only those. The
  injected API object stays unexported. Remove endpoints and hooks nothing uses.
- The backend enforces permissions. The UI only hides actions. Never rely on UI gating for security.

## Redux store

- `store/index.js` configures the store: `settings` (`mode`, `socketConnected`, `sideBarCollapsed`), `user`
  (`user`, `permissions`, `roles`) and `adminApi`.
- Server data belongs in RTK Query, never duplicated into slices.
- Each slice lives in `store/<name>.slice.js` (`settings.slice.js`, `user.slice.js`):
  `export const <name>Slice = createSlice(…)` and `export const { actionA, actionB } = <name>Slice.actions;`.
  Register the reducer in `store/index.js` and re-export the actions from there, so components import actions
  from `@/store` only.
- The `user` slice seeds its initial state from `getAdminConfig()` (`@/helpers/env.helpers`), never from
  `globalThis.admin_ui_config` directly.
- `localStorage` persistence (like `mode` and `sideBarCollapsed`) happens inside reducers. Keep the key names
  stable.
