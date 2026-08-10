import { adminApi } from "./adminApi";

export const modelPricesApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    modelPriceList: build.query({
      query: ({ limit = 50, offset = 0, search, mode, custom_only } = {}) => ({
        url: "/costs/prices/administration/0",
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(mode && { mode }),
          ...(custom_only && { custom_only }),
        },
      }),
      providesTags: ["ModelPrices"],
    }),

    modelPriceGet: build.query({
      query: ({ modelName }) => ({
        url: `/costs/price/administration/0/${encodeURIComponent(modelName)}`,
      }),
      providesTags: ["ModelPrices"],
    }),

    modelPriceCreate: build.mutation({
      query: (body) => ({
        url: "/costs/price/administration/0",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ModelPrices"],
    }),

    modelPriceUpdate: build.mutation({
      query: ({ modelName, ...body }) => ({
        url: `/costs/price/administration/0/${encodeURIComponent(modelName)}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ModelPrices"],
    }),

    modelPriceReset: build.mutation({
      query: ({ modelName }) => ({
        url: `/costs/price/administration/0/${encodeURIComponent(modelName)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ModelPrices"],
    }),

    modelPriceSources: build.query({
      query: () => ({
        url: "/costs/sources/administration/0",
      }),
      providesTags: ["ModelPrices"],
    }),

    modelPriceReimport: build.mutation({
      query: ({ source_id }) => ({
        url: "/costs/sources/administration/0",
        method: "POST",
        body: { source_id },
      }),
      invalidatesTags: ["ModelPrices"],
    }),
  }),
});

export const {
  useModelPriceListQuery,
  useLazyModelPriceListQuery,
  useModelPriceGetQuery,
  useModelPriceCreateMutation,
  useModelPriceUpdateMutation,
  useModelPriceResetMutation,
  useModelPriceSourcesQuery,
  useModelPriceReimportMutation,
} = modelPricesApi;
