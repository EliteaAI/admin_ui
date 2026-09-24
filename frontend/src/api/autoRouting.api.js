import { adminApi } from './admin.api';

const api = adminApi.injectEndpoints({
  endpoints: build => ({
    autoRoutingSettings: build.query({
      query: () => ({ url: '/admin/auto_routing/administration' }),
      providesTags: [{ type: 'Configuration', id: 'auto_routing' }],
    }),
    autoRoutingSettingsSave: build.mutation({
      query: body => ({
        url: '/admin/auto_routing/administration',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Configuration', id: 'auto_routing' }],
    }),
  }),
});
export const { useAutoRoutingSettingsQuery, useAutoRoutingSettingsSaveMutation } = api;
