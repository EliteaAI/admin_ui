import { PERMISSIONS } from '@/constants/permissions.constants';

import { ok } from './governanceTest.helpers';
import { PROJECT } from './identitiesTest.helpers';

export const CRED_VIEW = PERMISSIONS.credentials.view;
export const CRED_MANAGE = PERMISSIONS.credentials.manage;
export const CRED_PROBE = PERMISSIONS.credentials.probe;
export const CRED_APPROVE = PERMISSIONS.credentials.approve;

const SECRETS = `/secrets`;

export const REFS_PATH = `${SECRETS}/credential_references/administration/${PROJECT.id}`;
export const refDetailPath = id => `${SECRETS}/credential_reference/administration/${PROJECT.id}/${id}`;
export const refActionPath = id =>
  `${SECRETS}/credential_reference_action/administration/${PROJECT.id}/${id}`;
export const materialPath = id => `${SECRETS}/credential_material/administration/${PROJECT.id}/${id}`;
export const GRANTS_PATH = `${SECRETS}/credential_grants/administration/${PROJECT.id}`;
export const grantActionPath = id => `${SECRETS}/credential_grant_action/administration/${PROJECT.id}/${id}`;
export const CANDIDATES_PATH = `/configurations/credential_candidates/administration/${PROJECT.id}`;
export const TYPES_PATH = '/configurations/available/';
export const USERS_PATH = `/admin/users/administration/${PROJECT.id}`;

export const OPERATOR_ID = 99;

export const makeReference = (overrides = {}) => ({
  id: 'r1',
  configuration: { uuid: 'becf88bf-0000-4000-8000-000000000001', title: 'github_config' },
  provider: 'github',
  ownership_class: 'service',
  owner: null,
  store_kind: 'database',
  state: 'active',
  generation: 1,
  validated: true,
  configuration_changed: false,
  approval_ref: 'TICKET-1',
  policy_revision: 'CHG-1',
  created_by: { id: 1, email: 'creator@example.com' },
  approved_by: { id: 2, email: 'approver@example.com' },
  written_by: { id: 1, email: 'creator@example.com' },
  expires_at: null,
  created_at: '2026-10-20T10:00:00+00:00',
  updated_at: '2026-10-20T11:00:00+00:00',
  ...overrides,
});

export const makePersonal = (overrides = {}) =>
  makeReference({
    id: 'p1',
    configuration: { uuid: 'becf88bf-0000-4000-8000-000000000002', title: 'jira_epam' },
    provider: 'github',
    ownership_class: 'personal',
    owner: { id: 7, email: 'u1@epam.com' },
    state: 'pending',
    generation: 1,
    validated: false,
    approved_by: null,
    approval_ref: null,
    policy_revision: null,
    ...overrides,
  });

export const makeGrant = (overrides = {}) => ({
  id: 'g1',
  binding: { id: 'b1', application_name: 'Jira helper', version_name: 'v47' },
  toolkit: { id: '41', name: 'jira', type: 'jira' },
  credential: {
    id: 'r1',
    provider: 'jira',
    configuration_title: 'jira_epam',
    ownership_class: 'personal',
  },
  subject: { ref: 'idp:t:o', user: { id: 7, email: 'u1@epam.com' } },
  state: 'pending_approval',
  valid_from: '2026-10-20T10:00:00+00:00',
  valid_until: null,
  approval_ref: null,
  created_by: { id: 1, email: 'creator@example.com' },
  approved_by: null,
  revocation_epoch: 0,
  ...overrides,
});

export const listOf = rows => ok({ total: rows.length, rows });

// What GET /configurations/available/ returns: the registered types with their schemas
export const makeTypes = () => [
  {
    type: 'github',
    section: 'credentials',
    config_schema: {
      properties: {
        data: {
          properties: {
            base_url: { type: 'string' },
            access_token: { type: 'string', format: 'password', title: 'Access token' },
            app: {
              type: 'object',
              properties: {
                private_key: { anyOf: [{ type: 'string', format: 'password' }, { type: 'null' }] },
              },
            },
          },
        },
      },
    },
  },
  {
    type: 'openapi',
    section: 'credentials',
    config_schema: {
      properties: {
        data: {
          properties: {
            headers: { type: 'object', additionalProperties: { type: 'string', format: 'password' } },
          },
        },
      },
    },
  },
];

export const candidatesResponse = () =>
  ok({
    total: 2,
    rows: [
      {
        configuration_id: 1,
        uuid: 'becf88bf-0000-4000-8000-000000000001',
        configuration_type: 'github',
        title: 'github_config',
        label: 'github_config',
        section: 'credentials',
        generation: 1,
        shared: false,
        author_id: 1,
        created_at: '2026-10-20T10:00:00+00:00',
        has_secret_fields: true,
      },
      {
        configuration_id: 2,
        uuid: 'becf88bf-0000-4000-8000-000000000009',
        configuration_type: 'plain',
        title: 'plain_config',
        label: 'plain_config',
        section: 'credentials',
        generation: 1,
        shared: false,
        author_id: 1,
        created_at: '2026-10-20T10:00:00+00:00',
        has_secret_fields: false,
      },
    ],
  });

export const usersResponse = () =>
  ok({
    total: 2,
    rows: [
      { id: 7, email: 'u1@epam.com', roles: ['viewer'] },
      { id: 8, email: 'u2@epam.com', roles: ['editor'] },
    ],
  });
