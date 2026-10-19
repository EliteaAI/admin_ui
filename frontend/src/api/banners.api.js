import { adminApi } from './admin.api';

const BANNER_MODE = 'administration';

const bannersApi = adminApi.injectEndpoints({
  endpoints: build => ({
    bannerList: build.query({
      query: () => ({ url: `social/banners/${BANNER_MODE}` }),
      transformResponse: response => response.result ?? [],
      providesTags: ['Banners'],
    }),

    bannerCreate: build.mutation({
      query: body => ({
        url: `social/banners/${BANNER_MODE}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),

    bannerUpdate: build.mutation({
      query: ({ bannerId, ...body }) => ({
        url: `social/banner/${BANNER_MODE}/${bannerId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),

    bannerDelete: build.mutation({
      query: bannerId => ({
        url: `social/banner/${BANNER_MODE}/${bannerId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),
  }),
});

export const {
  useBannerListQuery,
  useBannerCreateMutation,
  useBannerUpdateMutation,
  useBannerDeleteMutation,
} = bannersApi;
