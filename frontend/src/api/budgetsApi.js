import { adminApi } from "./adminApi";

export const budgetsApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    projectBudgetList: build.query({
      query: ({
        limit = 20,
        offset = 0,
        search,
        sort_by,
        sort_order,
        project_type,
      } = {}) => ({
        url: "/elitea_core/project_budgets/administration",
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
          ...(project_type && { project_type }),
        },
      }),
      providesTags: ["Budgets"],
    }),

    projectBudgetUpdate: build.mutation({
      query: ({ projectId, monthly_limit, enabled, currency = "USD" }) => ({
        url: `/elitea_core/project_budget/administration/${projectId}/budget`,
        method: "PUT",
        body: { monthly_limit, enabled, currency },
      }),
      invalidatesTags: ["Budgets"],
    }),

    userBudgetList: build.query({
      query: ({ projectId }) => ({
        url: `/elitea_core/user_budgets/administration/${projectId}`,
      }),
      providesTags: ["Budgets"],
    }),

    userBudgetUpdate: build.mutation({
      query: ({
        projectId,
        userId,
        monthly_limit,
        enabled,
        currency = "USD",
      }) => ({
        url: `/elitea_core/user_budget/administration/${projectId}/user_budget/${userId}`,
        method: "PUT",
        body: { monthly_limit, enabled, currency },
      }),
      invalidatesTags: ["Budgets"],
    }),
  }),
});

export const {
  useProjectBudgetListQuery,
  useLazyProjectBudgetListQuery,
  useProjectBudgetUpdateMutation,
  useUserBudgetListQuery,
  useUserBudgetUpdateMutation,
} = budgetsApi;
