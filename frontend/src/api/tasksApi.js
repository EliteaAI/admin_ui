import { adminApi } from "./adminApi";

export const tasksApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    taskNames: build.query({
      query: () => ({
        url: "/admin/tasks/administration/",
        params: { action: "names" },
      }),
      transformResponse: (response) => {
        const tasks = response.tasks || [];
        const groupsMap = {};
        tasks.forEach((t) => {
          if (t.group) groupsMap[t.name] = t.group;
        });
        return {
          names: response.names || [],
          tasks,
          groupsMap,
        };
      },
      providesTags: ["TaskNames"],
    }),

    taskList: build.query({
      query: () => ({
        url: "/admin/tasks/administration/",
        params: { action: "list", scope: "task" },
      }),
      providesTags: ["Tasks"],
    }),

    taskStart: build.mutation({
      query: ({ name, param = "" }) => ({
        url: "/admin/tasks/administration/",
        params: { action: "start", scope: `${name}:${param}` },
      }),
      invalidatesTags: ["Tasks"],
    }),

    taskStop: build.mutation({
      query: ({ taskId }) => ({
        url: "/admin/tasks/administration/",
        params: { action: "stop", scope: taskId },
      }),
      invalidatesTags: ["Tasks"],
    }),

    taskLogs: build.query({
      query: (taskId) => ({
        url: "/admin/tasks/administration/",
        params: { action: "logs", scope: taskId },
      }),
      transformResponse: (response) => response.lines || [],
    }),

    activeTasksList: build.query({
      query: () => ({
        url: "/admin/active_tasks/administration",
      }),
      providesTags: ["ActiveTasks"],
    }),

    activeTasksRefresh: build.mutation({
      query: ({ node, scope }) => ({
        url: "/admin/active_tasks/administration",
        params: { action: "refresh", node, scope },
      }),
      invalidatesTags: ["ActiveTasks"],
    }),

    activeTasksStop: build.mutation({
      query: ({ node, taskId }) => ({
        url: "/admin/active_tasks/administration",
        params: { action: "stop", node, scope: taskId },
      }),
      invalidatesTags: ["ActiveTasks"],
    }),

    // Read-only stack dump; a mutation because each press is a fresh capture
    // and consecutive presses are compared to tell stuck from spinning.
    taskDump: build.mutation({
      query: ({ taskId }) => ({
        url: "/admin/tasks/administration/",
        params: { action: "dump", scope: taskId },
      }),
    }),
  }),
});

export const {
  useTaskNamesQuery,
  useTaskListQuery,
  useTaskStartMutation,
  useTaskStopMutation,
  useLazyTaskLogsQuery,
  useActiveTasksListQuery,
  useActiveTasksRefreshMutation,
  useActiveTasksStopMutation,
  useTaskDumpMutation,
} = tasksApi;
