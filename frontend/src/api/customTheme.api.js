import { V2_BASE } from '@/helpers/env.helpers';

import { adminApi } from './admin.api';

const customThemeApi = adminApi.injectEndpoints({
  endpoints: build => ({
    /**
     * Get custom theme configuration for admin view
     * Returns full theme data with metadata
     */
    customThemeAdmin: build.query({
      query: () => ({
        url: `${V2_BASE}/admin/custom_theme/administration`,
      }),
      providesTags: ['CustomTheme'],
    }),

    /**
     * Save custom theme configuration
     * Creates or updates the theme palette
     */
    customThemeSave: build.mutation({
      query: body => ({
        url: `${V2_BASE}/admin/custom_theme/administration`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CustomTheme'],
    }),

    /**
     * Delete custom theme configuration
     * Removes both palette and logo
     */
    customThemeDelete: build.mutation({
      query: () => ({
        url: `${V2_BASE}/admin/custom_theme/administration`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CustomTheme'],
    }),

    /**
     * Upload custom theme logo
     * Accepts FormData with 'file' field
     * Note: No invalidatesTags - we update local state directly to preserve unsaved palette changes
     */
    customThemeLogoUpload: build.mutation({
      query: formData => ({
        url: `${V2_BASE}/admin/custom_theme_logo/administration`,
        method: 'POST',
        body: formData,
      }),
    }),

    /**
     * Delete custom theme logo
     * Keeps the palette, only removes the logo
     * Note: No invalidatesTags - we update local state directly to preserve unsaved palette changes
     */
    customThemeLogoDelete: build.mutation({
      query: () => ({
        url: `${V2_BASE}/admin/custom_theme_logo/administration`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useCustomThemeAdminQuery,
  useCustomThemeSaveMutation,
  useCustomThemeDeleteMutation,
  useCustomThemeLogoUploadMutation,
  useCustomThemeLogoDeleteMutation,
} = customThemeApi;
