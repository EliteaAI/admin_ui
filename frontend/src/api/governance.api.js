import { adminApi } from './admin.api';

const governanceApi = adminApi.injectEndpoints({
  endpoints: build => ({
    governanceSettingsGet: build.query({
      query: () => ({ url: '/elitea_core/governance_settings/administration' }),
      providesTags: ['GovernanceSettings'],
    }),

    // The body is built by the caller (mode, flags, change_note, expected_revision, ...) and sent as is.
    // The response is the new state, in the same shape as the GET.
    governanceSettingsUpdate: build.mutation({
      query: body => ({
        url: '/elitea_core/governance_settings/administration',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['GovernanceSettings'],
    }),

    governanceSettingsHistoryList: build.query({
      query: ({ limit = 20, offset = 0 } = {}) => ({
        url: '/elitea_core/governance_settings_history/administration',
        params: { limit, offset },
      }),
      providesTags: ['GovernanceSettings'],
    }),

    securityAuditList: build.query({
      query: ({ limit = 20, offset = 0, would_deny } = {}) => ({
        url: '/tracing/security_audit/administration',
        params: {
          limit,
          offset,
          ...(would_deny != null && { would_deny: String(would_deny) }),
        },
      }),
      providesTags: ['SecurityEvents'],
    }),

    securityAuditSummary: build.query({
      query: ({ since_hours = 24, would_deny } = {}) => ({
        url: '/tracing/security_audit_summary/administration',
        params: {
          since_hours,
          ...(would_deny != null && { would_deny: String(would_deny) }),
        },
      }),
      providesTags: ['SecurityEvents'],
    }),
  }),
});

export const {
  useGovernanceSettingsGetQuery,
  useGovernanceSettingsUpdateMutation,
  useGovernanceSettingsHistoryListQuery,
  useSecurityAuditListQuery,
  useSecurityAuditSummaryQuery,
} = governanceApi;
