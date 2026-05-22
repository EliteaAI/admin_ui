import { adminApi } from "./adminApi";

export const appRequestsApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    appRequestsList: build.query({
      query: ({
        limit = 20,
        offset = 0,
        search,
        status,
        issue_type,
        project_id,
        entity_id,
        sort_by,
        sort_order,
      } = {}) => ({
        url: "admin/moderation_statuses/administration",
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(status && { status }),
          ...(issue_type && { issue_type }),
          ...(project_id && { project_id }),
          ...(entity_id && { entity_id }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
        },
      }),
      providesTags: ["AppRequests"],
    }),

    appRequestUpdate: build.mutation({
      query: ({ id, status, rejection_comment = null, meta = {} }) => ({
        url: "admin/moderation_status/administration",
        method: "PUT",
        body: {
          id,
          status,
          rejection_comment,
          meta,
        },
      }),
      invalidatesTags: ["AppRequests"],
    }),
  }),
});

export const { useAppRequestsListQuery, useAppRequestUpdateMutation } =
  appRequestsApi;
