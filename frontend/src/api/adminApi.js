import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { V2_BASE, VITE_DEV_TOKEN } from '@/utils/env';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: V2_BASE,
    credentials: 'include',
    prepareHeaders: (headers) => {
      if (VITE_DEV_TOKEN) {
        headers.set('Authorization', `Bearer ${VITE_DEV_TOKEN}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Users', 'Roles', 'Permissions', 'AuditTrail', 'Projects', 'Schedules', 'Tasks', 'TaskNames', 'Configuration', 'ActiveTasks', 'Secrets', 'ServiceDescriptors'],
  endpoints: () => ({}),
});
