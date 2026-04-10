import { adminApi } from './adminApi';

export const tasksApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    taskNames: build.query({
      query: () => ({
        url: '/admin/tasks/administration/',
        params: { action: 'names' },
      }),
      transformResponse: (response) => ({
        names: response.names || [],
        tasks: response.tasks || [],
      }),
      providesTags: ['TaskNames'],
    }),

    taskList: build.query({
      query: () => ({
        url: '/admin/tasks/administration/',
        params: { action: 'list', scope: 'task' },
      }),
      providesTags: ['Tasks'],
    }),

    taskStart: build.mutation({
      query: ({ name, param = '' }) => ({
        url: '/admin/tasks/administration/',
        params: { action: 'start', scope: `${name}:${param}` },
      }),
      invalidatesTags: ['Tasks'],
    }),

    taskStop: build.mutation({
      query: ({ taskId }) => ({
        url: '/admin/tasks/administration/',
        params: { action: 'stop', scope: taskId },
      }),
      invalidatesTags: ['Tasks'],
    }),

    taskLogs: build.query({
      query: (taskId) => ({
        url: '/admin/tasks/administration/',
        params: { action: 'logs', scope: taskId },
      }),
      transformResponse: (response) => response.lines || [],
    }),

    activeTasksList: build.query({
      query: () => ({
        url: '/admin/active_tasks/administration',
      }),
      providesTags: ['ActiveTasks'],
    }),

    activeTasksRefresh: build.mutation({
      query: ({ node, scope }) => ({
        url: '/admin/active_tasks/administration',
        params: { action: 'refresh', node, scope },
      }),
      invalidatesTags: ['ActiveTasks'],
    }),

    activeTasksStop: build.mutation({
      query: ({ node, taskId }) => ({
        url: '/admin/active_tasks/administration',
        params: { action: 'stop', node, scope: taskId },
      }),
      invalidatesTags: ['ActiveTasks'],
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
} = tasksApi;
