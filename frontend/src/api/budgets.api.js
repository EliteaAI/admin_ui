import { adminApi } from './admin.api';

const budgetsApi = adminApi.injectEndpoints({
  endpoints: build => ({
    projectBudgetList: build.query({
      query: ({ limit = 20, offset = 0, search, sort_by, sort_order, project_type, feature } = {}) => ({
        url: '/elitea_core/project_budgets/administration',
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
          ...(project_type && { project_type }),
          ...(feature && { feature }),
        },
      }),
      providesTags: ['Budgets'],
    }),

    projectBudgetUpdate: build.mutation({
      query: ({ projectId, monthly_limit, enabled, currency = 'USD', member_default_limit }) => ({
        url: `/elitea_core/project_budget/administration/${projectId}/budget`,
        method: 'PUT',
        body: {
          monthly_limit,
          enabled,
          currency,
          // Omitted rather than nulled when undefined: the backend leaves an absent
          // field alone, so a caller that doesn't manage it can't clear every member's default
          ...(member_default_limit !== undefined && { member_default_limit }),
        },
      }),
      invalidatesTags: ['Budgets'],
    }),

    userBudgetList: build.query({
      query: ({ projectId, ...params }) => ({
        url: `/elitea_core/user_budgets/administration/${projectId}`,
        params,
      }),
      providesTags: ['Budgets'],
    }),

    userBudgetUpdate: build.mutation({
      query: ({ projectId, userId, monthly_limit, enabled, currency = 'USD' }) => ({
        url: `/elitea_core/user_budget/administration/${projectId}/user_budget/${userId}`,
        method: 'PUT',
        body: { monthly_limit, enabled, currency },
      }),
      invalidatesTags: ['Budgets'],
    }),

    // Tool Spend features (e.g. web search), from toolkit metadata; one admin page each
    toolSpendFeatures: build.query({
      query: () => ({ url: '/elitea_core/tool_spend_features/administration' }),
    }),

    // Feature limits use their own fields; only the ones passed are sent, so LLM budgets stay untouched
    projectFeatureBudgetUpdate: build.mutation({
      query: ({ projectId, feature, ...body }) => ({
        url: `/elitea_core/project_budget/administration/${projectId}/budget`,
        method: 'PUT',
        params: { feature },
        body,
      }),
      invalidatesTags: ['Budgets'],
    }),

    userFeatureBudgetUpdate: build.mutation({
      query: ({ projectId, userId, feature, ...body }) => ({
        url: `/elitea_core/user_budget/administration/${projectId}/user_budget/${userId}`,
        method: 'PUT',
        params: { feature },
        body,
      }),
      invalidatesTags: ['Budgets'],
    }),
  }),
});

export const {
  useProjectBudgetListQuery,
  useLazyProjectBudgetListQuery,
  useProjectBudgetUpdateMutation,
  useUserBudgetListQuery,
  useUserBudgetUpdateMutation,
  useToolSpendFeaturesQuery,
  useProjectFeatureBudgetUpdateMutation,
  useUserFeatureBudgetUpdateMutation,
} = budgetsApi;
