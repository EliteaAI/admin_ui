import { adminApi } from "./adminApi";
import { V2_BASE } from "@/utils/env";

export const projectsApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    projectList: build.query({
      query: ({
        limit = 20,
        offset = 0,
        search,
        sort_by,
        sort_order,
        project_type,
      } = {}) => ({
        url: `${V2_BASE}/admin/projects/administration`,
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
          ...(project_type && { project_type }),
        },
      }),
      providesTags: ["Projects"],
    }),

    projectCreate: build.mutation({
      query: ({ name, project_admin_email }) => ({
        url: "/projects/project/administration",
        method: "POST",
        body: { name, project_admin_email },
      }),
      invalidatesTags: ["Projects"],
    }),

    projectDelete: build.mutation({
      query: ({ projectId }) => ({
        url: `/projects/project/administration/${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),

    projectAddAdmin: build.mutation({
      query: ({ projectId, email, roles = ["admin"] }) => ({
        url: `/admin/users/administration/${projectId}`,
        method: "POST",
        body: { emails: [email], roles },
      }),
      invalidatesTags: ["Projects"],
    }),

    projectUpdateUserRole: build.mutation({
      query: ({ projectId, userId, roles }) => ({
        url: `/admin/users/administration/${projectId}`,
        method: "PUT",
        body: { id: userId, roles },
      }),
      invalidatesTags: ["Projects"],
    }),

    projectSuspend: build.mutation({
      query: ({ projectId, suspended }) => ({
        url: `/admin/project_suspend/administration/${projectId}`,
        method: "PUT",
        body: { suspended },
      }),
      invalidatesTags: ["Projects"],
    }),

    projectUserList: build.query({
      query: ({ projectId } = {}) => ({
        url: `/admin/users/administration/${projectId}`,
      }),
    }),

    projectUserActivity: build.query({
      query: ({ project_id, date_from, date_to } = {}) => ({
        url: `/elitea_core/project_user_activity/administration`,
        params: {
          project_id,
          ...(date_from && { date_from }),
          ...(date_to && { date_to }),
        },
      }),
    }),
  }),
});

export const {
  useProjectListQuery,
  useLazyProjectListQuery,
  useProjectCreateMutation,
  useProjectDeleteMutation,
  useProjectAddAdminMutation,
  useProjectUpdateUserRoleMutation,
  useProjectSuspendMutation,
  useProjectUserListQuery,
  useProjectUserActivityQuery,
} = projectsApi;
