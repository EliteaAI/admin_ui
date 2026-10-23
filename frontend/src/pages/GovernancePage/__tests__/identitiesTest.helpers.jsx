import { PERMISSIONS } from '@/constants/permissions.constants';

import { fail, ok } from './governanceTest.helpers';

export const BINDINGS_VIEW = PERMISSIONS.governance.bindings.view;
export const BINDINGS_MANAGE = PERMISSIONS.governance.bindings.manage;
export const BINDINGS_APPROVE = PERMISSIONS.governance.bindings.approve;

export const PROJECT = { id: 12, name: 'Team Alpha' };
export const PROJECT_STORAGE_KEY = 'admin_ui.governance.project';

export const PROJECTS_PATH = '/admin/projects/administration';
export const LIST_PATH = `/elitea_core/agent_identities/administration/${PROJECT.id}`;
export const AGENTS_PATH = `/elitea_core/governance_agents/administration/${PROJECT.id}`;
export const detailPath = id => `/elitea_core/agent_identity/administration/${PROJECT.id}/${id}`;
export const actionPath = id => `/elitea_core/agent_identity_action/administration/${PROJECT.id}/${id}`;

export const rememberProject = (project = PROJECT) => {
  localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));
};

export const makeIdentity = (overrides = {}) => ({
  id: 'b1',
  application: { id: 5, name: 'Jira helper' },
  version: { id: 51, name: 'v47' },
  identity_mode: 'elitea_native',
  state: 'active',
  definition_digest: '7f3a9c1d2e4b',
  digest_status: 'match',
  policy_revision: 'CHG-1',
  approval_ref: 'TICKET-1',
  revocation_epoch: 0,
  created_by: { id: 1, email: 'creator@example.com' },
  state_changed_by: { id: 1, email: 'creator@example.com' },
  created_at: '2026-10-20T10:00:00+00:00',
  updated_at: '2026-10-20T11:00:00+00:00',
  ...overrides,
});

export const listResponse = rows => ok({ total: rows.length, rows });

export const makeDetail = (overrides = {}) => ({
  ...makeIdentity(),
  definition_digest: 'sha256:7f3a9c1d2e4b0000000000000000000000000000000000000000000000000000',
  digest_now: 'sha256:91be04aa00000000000000000000000000000000000000000000000000000000',
  digest_inputs: {
    agent_type: 'react',
    model: 'gpt-4.1',
    instructions: { length: 2314, sha256: 'ab12cd34' },
    llm_settings_sha256: 'ef56ab78',
    tools: [
      {
        id: 41,
        type: 'github',
        name: 'github',
        credential_configuration_uuid: 'becf88bf-0000-4000-8000-000000000001',
        selected_tools_sha256: '99aa88bb',
        selected_tools_count: 3,
        ref: null,
      },
    ],
  },
  grants_count: null,
  ...overrides,
});

export const agentsResponse = () =>
  ok({
    total: 1,
    rows: [
      {
        id: 5,
        name: 'Jira helper',
        versions: [
          { id: 51, name: 'v47', bindings: [{ id: 'b1', identity_mode: 'elitea_native', state: 'active' }] },
          { id: 52, name: 'v48', bindings: [] },
        ],
      },
    ],
  });

export const refusal = (status, code, message) => fail(status, { error: message, code });
