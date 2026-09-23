import { V2_BASE } from '@/helpers/env.helpers';

import { adminApi } from './admin.api';

const serviceDescriptorsApi = adminApi.injectEndpoints({
  endpoints: build => ({
    serviceDescriptorList: build.query({
      query: () => ({
        url: `${V2_BASE}/elitea_core/admin/administration`,
      }),
      providesTags: ['ServiceDescriptors'],
      transformResponse: response => {
        // We know the API response is { total, rows }
        return response.rows || [];
      },
    }),

    serviceDescriptorDelete: build.mutation({
      query: ({ project_id, provider_name, service_location_url }) => ({
        url: `${V2_BASE}/elitea_core/register_descriptor/${project_id}`,
        method: 'DELETE',
        params: {
          provider_name,
          service_location_url,
        },
      }),
      invalidatesTags: ['ServiceDescriptors'],
    }),
  }),
});

export const { useServiceDescriptorListQuery, useServiceDescriptorDeleteMutation } = serviceDescriptorsApi;
