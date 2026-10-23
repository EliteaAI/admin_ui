import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { adminApi } from '@/api/admin.api';
import { PERMISSIONS } from '@/constants/permissions.constants';
import store, { setPermissions, setRoles } from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render } from '@testing-library/react';

const theme = createTheme(getDesignTokens('dark'));

export const VIEW = PERMISSIONS.governance.settings.view;
export const MANAGE = PERMISSIONS.governance.settings.manage;

// The real store and RTK Query run; only the network is replaced
export const renderWithProviders = (ui, options = {}) => {
  const { permissions = [], roles = [], route = '/governance' } = options;
  store.dispatch(adminApi.util.resetApiState());
  store.dispatch(setPermissions(permissions));
  store.dispatch(setRoles(roles));

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
};

export const ok = body => ({ status: 200, body });
export const fail = (status, body) => ({ status, body });

/**
 * Replaces fetch. `handlers` maps "METHOD /path" (relative to /api/v2) to a response, or to a function
 * ({ body, params }) => response. Returns every request that was made.
 */
export const mockApi = handlers => {
  const calls = [];

  vi.stubGlobal(
    'fetch',
    vi.fn(async request => {
      const url = new URL(request.url);
      const path = url.pathname.replace('/api/v2', '');
      const params = Object.fromEntries(url.searchParams);
      const text = request.method === 'GET' ? '' : await request.clone().text();
      const body = text ? JSON.parse(text) : undefined;
      calls.push({ method: request.method, path, params, body });

      const handler = handlers[`${request.method} ${path}`];
      const result = typeof handler === 'function' ? handler({ body, params }) : handler;
      const response =
        result ?? fail(404, { error: `Not mocked: ${request.method} ${path}`, code: 'NOT_FOUND' });

      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );

  return calls;
};

export const SETTINGS_PATH = '/elitea_core/governance_settings/administration';
export const HISTORY_PATH = '/elitea_core/governance_settings_history/administration';
export const SUMMARY_PATH = '/tracing/security_audit_summary/administration';
export const AUDIT_PATH = '/tracing/security_audit/administration';

const OK_CHECKS = [
  'identity_verifier',
  'auth_rpc_mode',
  'security_audit',
  'audit_backlog',
  'credential_facts',
  'master_key',
  'settings_table',
].map(id => ({ id, status: 'ok', code: 'OK', blocking: true, message: null }));

export const storedRow = (overrides = {}) => ({
  mode: 'audit_only',
  policy_revision: 'CHG-1',
  admit_legacy_pat: false,
  allow_runtime_domain_binding: false,
  environment: null,
  revision: 3,
  updated_by: 7,
  updated_at: '2026-10-20T18:02:00+00:00',
  ...overrides,
});

// The body of GET /governance_settings: nothing stored, nothing locked, everything ready
export const makeSettings = (overrides = {}) => ({
  effective: {
    mode: 'off',
    policy_revision: null,
    admit_legacy_pat: false,
    allow_runtime_domain_binding: false,
    environment: null,
    capped: false,
    unavailable: false,
  },
  stored: null,
  locks: {},
  ceiling: { max_mode: 'enforce', source: 'default' },
  preflight: { ok: true, state: 'ready', checks: OK_CHECKS },
  table_present: true,
  read: 'ok',
  ...overrides,
});

export const failingPreflight = () => ({
  ok: false,
  state: 'not_ready',
  checks: OK_CHECKS.map(check =>
    check.id === 'master_key'
      ? {
          ...check,
          status: 'fail',
          code: 'MASTER_KEY_MISSING',
          message: 'The secrets master key is not set.',
        }
      : check,
  ),
});

export const emptyHistory = { total: 0, rows: [], table_present: true };
