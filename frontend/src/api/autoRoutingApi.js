import { adminApi } from './adminApi';

const api = adminApi.injectEndpoints({
  endpoints: build => ({
    autoRoutingSettings: build.query({
      query: () => ({ url: '/admin/auto_routing/administration' }),
      providesTags: [{ type: 'Configuration', id: 'auto_routing' }],
    }),
    saveAutoRoutingSettings: build.mutation({
      query: body => ({
        url: '/admin/auto_routing/administration',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Configuration', id: 'auto_routing' }],
    }),
  }),
});
export const { useAutoRoutingSettingsQuery, useSaveAutoRoutingSettingsMutation } = api;
