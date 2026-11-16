import { adminApi } from './admin.api';

const BASE = '/admin/oauth_apps/administration';

const oauthAppsApi = adminApi.injectEndpoints({
  endpoints: build => ({
    oauthAppList: build.query({
      query: () => ({ url: BASE }),
      providesTags: ['OAuthApps'],
    }),

    // Providers and, per credential type, the scopes its credential schema offers
    oauthAppProviderList: build.query({
      query: () => ({ url: '/admin/oauth_app_providers/administration' }),
      transformResponse: response => response?.rows ?? [],
    }),

    oauthAppCreate: build.mutation({
      query: body => ({ url: BASE, method: 'POST', body }),
      invalidatesTags: ['OAuthApps'],
    }),

    oauthAppUpdate: build.mutation({
      query: ({ id, ...body }) => ({ url: `${BASE}/${id}`, method: 'PUT', body }),
      invalidatesTags: ['OAuthApps'],
    }),

    oauthAppCheck: build.mutation({
      query: ({ id, ...body }) => ({
        url: `/admin/oauth_app_check/administration${id ? `/${id}` : ''}`,
        method: 'POST',
        body,
      }),
    }),

    oauthAppDelete: build.mutation({
      query: ({ id }) => ({ url: `${BASE}/${id}`, method: 'DELETE' }),
      invalidatesTags: ['OAuthApps'],
    }),
  }),
});

// RTK Query derives hook names from the endpoint names (oauthAppList -> useOauthAppListQuery)
export const {
  useOauthAppListQuery: useOAuthAppListQuery,
  useOauthAppProviderListQuery: useOAuthAppProviderListQuery,
  useOauthAppCreateMutation: useOAuthAppCreateMutation,
  useOauthAppUpdateMutation: useOAuthAppUpdateMutation,
  useOauthAppCheckMutation: useOAuthAppCheckMutation,
  useOauthAppDeleteMutation: useOAuthAppDeleteMutation,
} = oauthAppsApi;
