import { adminApi } from "./adminApi";

const BASE = "/admin/eval_platform_dimensions/administration";
const SYNC_BASE = "/admin/eval_platform_dimension_sync/administration";

export const platformDimensionsApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    platformDimensionList: build.query({
      query: ({ active_only } = {}) => ({
        url: BASE,
        params: { ...(active_only && { active_only: true }) },
      }),
      providesTags: ["PlatformDimensions"],
    }),

    platformDimensionCreate: build.mutation({
      query: (body) => ({ url: BASE, method: "POST", body }),
      invalidatesTags: ["PlatformDimensions"],
    }),

    platformDimensionUpdate: build.mutation({
      query: ({ uuid, ...body }) => ({
        url: `${BASE}/${uuid}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PlatformDimensions"],
    }),

    platformDimensionDeactivate: build.mutation({
      query: ({ uuid }) => ({ url: `${BASE}/${uuid}`, method: "DELETE" }),
      invalidatesTags: ["PlatformDimensions"],
    }),

    platformDimensionResync: build.mutation({
      query: ({ uuid }) => ({ url: `${SYNC_BASE}/${uuid}`, method: "POST" }),
    }),
  }),
});

export const {
  usePlatformDimensionListQuery,
  usePlatformDimensionCreateMutation,
  usePlatformDimensionUpdateMutation,
  usePlatformDimensionDeactivateMutation,
  usePlatformDimensionResyncMutation,
} = platformDimensionsApi;
