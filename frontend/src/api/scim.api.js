import { adminApi } from './admin.api';

const TOKENS = '/admin/scim_tokens/administration';
const GROUPS = '/admin/scim_groups/administration';
const SETTINGS = '/admin/scim_settings/administration';
const USERS = '/admin/scim_users/administration';

const scimApi = adminApi.injectEndpoints({
  endpoints: build => ({
    scimTokenList: build.query({
      query: () => ({ url: TOKENS }),
      providesTags: ['ScimTokens'],
    }),

    scimTokenCreate: build.mutation({
      query: ({ name }) => ({ url: TOKENS, method: 'POST', body: { name } }),
      invalidatesTags: ['ScimTokens'],
    }),

    scimTokenRotate: build.mutation({
      query: ({ id }) => ({ url: `${TOKENS}/${id}`, method: 'POST' }),
      invalidatesTags: ['ScimTokens'],
    }),

    scimTokenRevoke: build.mutation({
      query: ({ id }) => ({ url: `${TOKENS}/${id}`, method: 'DELETE' }),
      invalidatesTags: ['ScimTokens'],
    }),

    scimGroupList: build.query({
      query: () => ({ url: GROUPS }),
      providesTags: ['ScimGroups'],
    }),

    scimGroupSync: build.mutation({
      query: ({ groupId }) => ({ url: `${GROUPS}/${encodeURIComponent(groupId)}/sync`, method: 'POST' }),
      invalidatesTags: ['ScimGroups', 'ScimUsers'],
    }),

    scimGroupUnlink: build.mutation({
      query: ({ groupId }) => ({ url: `${GROUPS}/${encodeURIComponent(groupId)}/unlink`, method: 'POST' }),
      invalidatesTags: ['ScimGroups', 'Projects'],
    }),

    scimUserList: build.query({
      query: () => ({ url: USERS }),
      providesTags: ['ScimUsers'],
    }),

    scimSettings: build.query({
      query: () => ({ url: SETTINGS }),
      providesTags: ['ScimSettings'],
    }),

    scimSettingsUpdate: build.mutation({
      query: ({ graphOauthAppId }) => ({
        url: SETTINGS,
        method: 'PUT',
        body: { graph_oauth_app_id: graphOauthAppId || null },
      }),
      invalidatesTags: ['ScimSettings', 'ScimGroups'],
    }),

    scimGraphCheck: build.mutation({
      query: () => ({ url: `${SETTINGS}/check`, method: 'POST' }),
      invalidatesTags: ['ScimSettings', 'ScimGroups'],
    }),
  }),
});

export const {
  useScimTokenListQuery,
  useScimTokenCreateMutation,
  useScimTokenRotateMutation,
  useScimTokenRevokeMutation,
  useScimGroupListQuery,
  useScimGroupSyncMutation,
  useScimGroupUnlinkMutation,
  useScimUserListQuery,
  useScimSettingsQuery,
  useScimSettingsUpdateMutation,
  useScimGraphCheckMutation,
} = scimApi;
