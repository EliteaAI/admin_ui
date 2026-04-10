import { adminApi } from "./adminApi";
import { VITE_SERVER_URL } from "@/utils/env";

export const usersApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    userList: build.query({
      query: ({
        limit = 20,
        offset = 0,
        search,
        user_type,
        sort_by,
        sort_order,
      } = {}) => ({
        url: `${VITE_SERVER_URL}/admin/auth_users/administration`,
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(user_type && { user_type }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
        },
      }),
      providesTags: ["Users"],
    }),

    userDelete: build.mutation({
      query: ({ userIds }) => ({
        url: "/admin/auth_users/administration",
        method: "POST",
        body: {
          action: "delete",
          users: userIds.map((id) => ({ id })),
        },
      }),
      invalidatesTags: ["Users"],
    }),

    userToggleAdmin: build.mutation({
      query: ({ userId, isAdmin }) => ({
        url: "/admin/auth_users/administration",
        method: "POST",
        body: {
          action: "toggle_admin",
          user_id: userId,
          is_admin: isAdmin,
        },
      }),
      invalidatesTags: ["Users"],
    }),

    userSuspend: build.mutation({
      query: ({ userId, suspended }) => ({
        url: `${VITE_SERVER_URL}/admin/user_suspend/administration/${userId}`,
        method: "PUT",
        body: { suspended },
      }),
      invalidatesTags: ["Users"],
    }),

    roleList: build.query({
      query: ({ targetMode = "default" } = {}) => ({
        url: `/admin/roles/administration/${targetMode}`,
      }),
      providesTags: ["Roles"],
    }),

    permissionMatrix: build.query({
      query: ({ targetMode = "default" } = {}) => ({
        url: `/admin/permissions/administration/${targetMode}`,
      }),
      providesTags: ["Permissions"],
    }),

    permissionMatrixUpdate: build.mutation({
      query: ({ targetMode = "default", rows }) => ({
        url: `/admin/permissions/administration/${targetMode}`,
        method: "PUT",
        body: rows,
      }),
      invalidatesTags: ["Permissions"],
    }),

    publicPermissionMatrix: build.query({
      query: ({ targetMode = "default" } = {}) => ({
        url: `/admin/permissions/public/${targetMode}`,
      }),
      providesTags: ["PublicPermissions"],
    }),

    publicPermissionMatrixUpdate: build.mutation({
      query: ({ targetMode = "default", rows }) => ({
        url: `/admin/permissions/public/${targetMode}`,
        method: "PUT",
        body: rows,
      }),
      invalidatesTags: ["PublicPermissions"],
    }),
  }),
});

export const {
  useUserListQuery,
  useLazyUserListQuery,
  useUserDeleteMutation,
  useUserToggleAdminMutation,
  useUserSuspendMutation,
  useRoleListQuery,
  usePermissionMatrixQuery,
  usePermissionMatrixUpdateMutation,
  usePublicPermissionMatrixQuery,
  usePublicPermissionMatrixUpdateMutation,
} = usersApi;
