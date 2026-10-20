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

    agentIdentityList: build.query({
      query: ({
        projectId,
        limit = 20,
        offset = 0,
        state,
        identity_mode,
        application_id,
        search,
        sort_by,
        sort_order,
      }) => ({
        url: `/elitea_core/agent_identities/administration/${encodeURIComponent(projectId)}`,
        params: {
          limit,
          offset,
          ...(state && { state }),
          ...(identity_mode && { identity_mode }),
          ...(application_id && { application_id }),
          ...(search && { search }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
        },
      }),
      providesTags: ['AgentIdentities'],
    }),

    // One binding with its full digest and the digest inputs (hashes and counts, never the instruction text)
    agentIdentityGet: build.query({
      query: ({ projectId, bindingId }) => ({
        url: `/elitea_core/agent_identity/administration/${encodeURIComponent(projectId)}/${encodeURIComponent(bindingId)}`,
      }),
      providesTags: ['AgentIdentities'],
    }),

    // The agents of a project with their versions and the identities each version already has
    governanceAgentList: build.query({
      query: ({ projectId, limit = 20, offset = 0, search }) => ({
        url: `/elitea_core/governance_agents/administration/${encodeURIComponent(projectId)}`,
        params: { limit, offset, ...(search && { search }) },
      }),
      providesTags: ['AgentIdentities'],
    }),

    agentIdentityCreate: build.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/agent_identities/administration/${encodeURIComponent(projectId)}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AgentIdentities'],
    }),

    // The body is { action, expected_state }; approval_ref and policy_revision go with `activate` only.
    // A refused change (for example CONCURRENT_CHANGE) invalidates the tag too, so the list is read again.
    agentIdentityAction: build.mutation({
      query: ({ projectId, bindingId, ...body }) => ({
        url: `/elitea_core/agent_identity_action/administration/${encodeURIComponent(projectId)}/${encodeURIComponent(bindingId)}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AgentIdentities'],
    }),
  }),
});

export const {
  useAgentIdentityActionMutation,
  useAgentIdentityCreateMutation,
  useAgentIdentityGetQuery,
  useAgentIdentityListQuery,
  useGovernanceAgentListQuery,
  useGovernanceSettingsGetQuery,
  useGovernanceSettingsUpdateMutation,
  useGovernanceSettingsHistoryListQuery,
  useSecurityAuditListQuery,
  useSecurityAuditSummaryQuery,
} = governanceApi;
