import { adminApi } from './adminApi';

export const schedulesApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    scheduleList: build.query({
      query: () => ({
        url: '/scheduling/schedules/administration/0',
      }),
      providesTags: ['Schedules'],
    }),

    scheduleUpdate: build.mutation({
      query: ({ id, ...body }) => ({
        url: '/scheduling/schedules/administration/0',
        method: 'PUT',
        body: { id, ...body },
      }),
      invalidatesTags: ['Schedules'],
    }),
  }),
});

export const {
  useScheduleListQuery,
  useScheduleUpdateMutation,
} = schedulesApi;
