import { adminApi } from './adminApi';
import { VITE_SERVER_URL } from '@/utils/env';

export const auditTrailApi = adminApi.injectEndpoints({
  endpoints: (build) => ({
    auditTrailList: build.query({
      query: ({
        limit = 50,
        offset = 0,
        search,
        sort_by,
        sort_order,
        event_type,
        http_method,
        is_error,
        user_id,
        project_id,
        trace_id,
        date_from,
        date_to,
        duration_min,
        duration_max,
      } = {}) => ({
        url: `${VITE_SERVER_URL}/elitea_core/audit/administration`,
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
          ...(event_type && { event_type }),
          ...(http_method && { http_method }),
          ...(is_error != null && { is_error: String(is_error) }),
          ...(user_id && { user_id }),
          ...(project_id && { project_id }),
          ...(trace_id && { trace_id }),
          ...(date_from && { date_from }),
          ...(date_to && { date_to }),
          ...(duration_min != null && { duration_min }),
          ...(duration_max != null && { duration_max }),
        },
      }),
      providesTags: ['AuditTrail'],
    }),

    auditHeatmap: build.query({
      query: ({
        date_from,
        date_to,
        search,
        event_type,
        is_error,
        user_id,
        project_id,
        trace_id,
      } = {}) => ({
        url: `${VITE_SERVER_URL}/elitea_core/audit_heatmap/administration`,
        params: {
          ...(date_from && { date_from }),
          ...(date_to && { date_to }),
          ...(search && { search }),
          ...(event_type && { event_type }),
          ...(is_error != null && { is_error: String(is_error) }),
          ...(user_id && { user_id }),
          ...(project_id && { project_id }),
          ...(trace_id && { trace_id }),
        },
      }),
      providesTags: ['AuditHeatmap'],
    }),

    auditTraceList: build.query({
      query: ({
        limit = 50,
        offset = 0,
        search,
        sort_by,
        sort_order,
        event_type,
        is_error,
        user_id,
        project_id,
        trace_id,
        date_from,
        date_to,
        duration_min,
        duration_max,
      } = {}) => ({
        url: `${VITE_SERVER_URL}/elitea_core/audit_traces/administration`,
        params: {
          limit,
          offset,
          ...(search && { search }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
          ...(event_type && { event_type }),
          ...(is_error != null && { is_error: String(is_error) }),
          ...(user_id && { user_id }),
          ...(project_id && { project_id }),
          ...(trace_id && { trace_id }),
          ...(date_from && { date_from }),
          ...(date_to && { date_to }),
          ...(duration_min != null && { duration_min }),
          ...(duration_max != null && { duration_max }),
        },
      }),
      providesTags: ['AuditTraceList'],
    }),

    auditTraceHeatmap: build.query({
      query: ({
        date_from,
        date_to,
        search,
        event_type,
        is_error,
        user_id,
        project_id,
        trace_id,
      } = {}) => ({
        url: `${VITE_SERVER_URL}/elitea_core/audit_trace_heatmap/administration`,
        params: {
          ...(date_from && { date_from }),
          ...(date_to && { date_to }),
          ...(search && { search }),
          ...(event_type && { event_type }),
          ...(is_error != null && { is_error: String(is_error) }),
          ...(user_id && { user_id }),
          ...(project_id && { project_id }),
          ...(trace_id && { trace_id }),
        },
      }),
      providesTags: ['AuditTraceHeatmap'],
    }),
  }),
});

export const {
  useAuditTrailListQuery,
  useAuditHeatmapQuery,
  useAuditTraceListQuery,
  useAuditTraceHeatmapQuery,
} = auditTrailApi;
