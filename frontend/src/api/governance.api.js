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

    // The credential configurations of a project that can be registered (metadata only, never a value)
    credentialCandidateList: build.query({
      query: ({ projectId, limit = 20, offset = 0, search }) => ({
        url: `/configurations/credential_candidates/administration/${encodeURIComponent(projectId)}`,
        params: { section: 'credentials', limit, offset, ...(search && { search }) },
      }),
      providesTags: ['CredentialReferences'],
    }),

    // The registered configuration types and their schemas. The personal-value dialog reads the names of a type's
    // secret fields from the schema, because no endpoint lists them.
    configurationTypeList: build.query({
      query: ({ section = 'credentials' } = {}) => ({
        url: '/configurations/available/',
        params: { section },
      }),
    }),

    credentialReferenceList: build.query({
      query: ({
        projectId,
        limit = 20,
        offset = 0,
        state,
        ownership_class,
        store_kind,
        owner_user_id,
        search,
        sort_by,
        sort_order,
      }) => ({
        url: `/secrets/credential_references/administration/${encodeURIComponent(projectId)}`,
        params: {
          limit,
          offset,
          ...(state && { state }),
          ...(ownership_class && { ownership_class }),
          ...(store_kind && { store_kind }),
          ...(owner_user_id && { owner_user_id }),
          ...(search && { search }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
        },
      }),
      providesTags: ['CredentialReferences'],
    }),

    // One reference with the number of live grants using it and whether a store write is in flight
    credentialReferenceGet: build.query({
      query: ({ projectId, referenceId }) => ({
        url: `/secrets/credential_reference/administration/${encodeURIComponent(projectId)}/${encodeURIComponent(referenceId)}`,
      }),
      providesTags: ['CredentialReferences'],
    }),

    // The body is { configuration_uuid, store_kind, ownership_class }; owner_user_id goes with a personal reference only.
    credentialReferenceCreate: build.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/secrets/credential_references/administration/${encodeURIComponent(projectId)}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CredentialReferences'],
    }),

    // The body is { action }; approve adds approval_ref and policy_revision (both), probe of a personal reference
    // may add check_connection. A refused change invalidates the tag too, so the list is read again.
    credentialReferenceAction: build.mutation({
      query: ({ projectId, referenceId, ...body }) => ({
        url: `/secrets/credential_reference_action/administration/${encodeURIComponent(projectId)}/${encodeURIComponent(referenceId)}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CredentialReferences', 'CredentialGrants'],
    }),

    // Write-only: { fields: { name: value }, expected_generation }. The reply holds the new generation, never a value.
    credentialMaterialPut: build.mutation({
      query: ({ projectId, referenceId, ...body }) => ({
        url: `/secrets/credential_material/administration/${encodeURIComponent(projectId)}/${encodeURIComponent(referenceId)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CredentialReferences'],
    }),

    credentialGrantList: build.query({
      query: ({
        projectId,
        limit = 20,
        offset = 0,
        state,
        subject_user_id,
        agent_binding_ref,
        credential_ref,
        toolkit_id,
        sort_by,
        sort_order,
      }) => ({
        url: `/secrets/credential_grants/administration/${encodeURIComponent(projectId)}`,
        params: {
          limit,
          offset,
          ...(state && { state }),
          ...(subject_user_id && { subject_user_id }),
          ...(agent_binding_ref && { agent_binding_ref }),
          ...(credential_ref && { credential_ref }),
          ...(toolkit_id && { toolkit_id }),
          ...(sort_by && { sort_by }),
          ...(sort_order && { sort_order }),
        },
      }),
      providesTags: ['CredentialGrants'],
    }),

    // The body is { agent_binding_ref, toolkit_id, credential_ref, subject_user_id, valid_until? }
    credentialGrantCreate: build.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/secrets/credential_grants/administration/${encodeURIComponent(projectId)}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CredentialGrants'],
    }),

    // Autonomous mandates of a project (#7131): { total, rows, identity_sources }
    mandateList: build.query({
      query: ({ projectId, limit = 20, offset = 0, state }) => ({
        url: `/elitea_core/autonomous_mandates/administration/${encodeURIComponent(projectId)}`,
        params: { limit, offset, ...(state && { state }) },
      }),
      providesTags: ['Mandates'],
    }),

    mandateCreate: build.mutation({
      query: ({ projectId, ...body }) => ({
        url: `/elitea_core/autonomous_mandates/administration/${encodeURIComponent(projectId)}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Mandates'],
    }),

    // The body is { action }; approve adds approval_ref and policy_revision (both). consent is the owner's own.
    mandateAction: build.mutation({
      query: ({ projectId, mandateId, ...body }) => ({
        url: `/elitea_core/autonomous_mandate_action/administration/${encodeURIComponent(projectId)}/${encodeURIComponent(mandateId)}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Mandates'],
    }),

    // The body is { action }; approve adds approval_ref and policy_revision (both)
    credentialGrantAction: build.mutation({
      query: ({ projectId, grantId, ...body }) => ({
        url: `/secrets/credential_grant_action/administration/${encodeURIComponent(projectId)}/${encodeURIComponent(grantId)}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CredentialGrants'],
    }),
  }),
});

export const {
  useAgentIdentityActionMutation,
  useAgentIdentityCreateMutation,
  useAgentIdentityGetQuery,
  useAgentIdentityListQuery,
  useConfigurationTypeListQuery,
  useCredentialCandidateListQuery,
  useCredentialGrantActionMutation,
  useCredentialGrantCreateMutation,
  useCredentialGrantListQuery,
  useCredentialMaterialPutMutation,
  useCredentialReferenceActionMutation,
  useCredentialReferenceCreateMutation,
  useCredentialReferenceGetQuery,
  useCredentialReferenceListQuery,
  useGovernanceAgentListQuery,
  useGovernanceSettingsGetQuery,
  useGovernanceSettingsUpdateMutation,
  useGovernanceSettingsHistoryListQuery,
  useMandateActionMutation,
  useMandateCreateMutation,
  useMandateListQuery,
  useSecurityAuditListQuery,
  useSecurityAuditSummaryQuery,
} = governanceApi;
