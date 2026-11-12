import { adminApi } from './admin.api';

const SETTINGS_BASE = '/admin/eval_auto/administration';
const ITEMS_BASE = '/admin/eval_auto_items/administration';
const DATASET_BASE = '/admin/eval_auto_dataset/administration';

const evalAutoApi = adminApi.injectEndpoints({
  endpoints: build => ({
    evalAutoSettings: build.query({
      query: () => ({ url: SETTINGS_BASE }),
      providesTags: ['EvalAutoSettings'],
    }),

    evalAutoSettingsUpdate: build.mutation({
      query: body => ({ url: SETTINGS_BASE, method: 'PUT', body }),
      invalidatesTags: ['EvalAutoSettings'],
    }),

    evalAutoRunNow: build.mutation({
      query: () => ({ url: SETTINGS_BASE, method: 'POST' }),
      invalidatesTags: ['EvalAutoItems'],
    }),

    evalAutoItems: build.query({
      query: ({ projectId, status, reason, search, limit, offset } = {}) => ({
        url: ITEMS_BASE,
        params: {
          ...(projectId && { project_id: projectId }),
          ...(status && { status }),
          ...(reason && { reason }),
          ...(search && { search }),
          limit,
          offset,
        },
      }),
      providesTags: ['EvalAutoItems'],
    }),

    evalAutoHistory: build.query({
      query: ({ projectId, applicationId }) => ({ url: `${ITEMS_BASE}/${projectId}/${applicationId}` }),
      providesTags: ['EvalAutoItems'],
    }),

    evalAutoDataset: build.query({
      query: () => ({ url: DATASET_BASE }),
      providesTags: ['EvalAutoDataset'],
    }),

    evalAutoDatasetUpdate: build.mutation({
      query: probes => ({ url: DATASET_BASE, method: 'PUT', body: { probes } }),
      invalidatesTags: ['EvalAutoDataset'],
    }),

    evalAutoDatasetResync: build.mutation({
      query: () => ({ url: DATASET_BASE, method: 'POST' }),
    }),
  }),
});

export const {
  useEvalAutoSettingsQuery,
  useEvalAutoSettingsUpdateMutation,
  useEvalAutoRunNowMutation,
  useEvalAutoItemsQuery,
  useEvalAutoHistoryQuery,
  useEvalAutoDatasetQuery,
  useEvalAutoDatasetUpdateMutation,
  useEvalAutoDatasetResyncMutation,
} = evalAutoApi;
