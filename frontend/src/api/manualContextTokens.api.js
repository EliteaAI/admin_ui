import { adminApi } from './admin.api';

const api = adminApi.injectEndpoints({
  endpoints: build => ({
    manualContextTokensSettings: build.query({
      query: () => ({ url: '/admin/manual_context_tokens/administration' }),
      providesTags: [{ type: 'Configuration', id: 'manual_context_tokens' }],
    }),
    manualContextTokensSettingsSave: build.mutation({
      query: body => ({
        url: '/admin/manual_context_tokens/administration',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Configuration', id: 'manual_context_tokens' }],
    }),
  }),
});
export const { useManualContextTokensSettingsQuery, useManualContextTokensSettingsSaveMutation } = api;
