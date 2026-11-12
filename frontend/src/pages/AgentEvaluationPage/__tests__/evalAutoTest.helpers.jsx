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

export const VIEW = PERMISSIONS.evalAuto.view;
export const EDIT = PERMISSIONS.evalAuto.edit;
export const RUN = PERMISSIONS.evalAuto.run;

export const SETTINGS_PATH = '/admin/eval_auto/administration';
export const DATASET_PATH = '/admin/eval_auto_dataset/administration';
export const ITEMS_PATH = '/admin/eval_auto_items/administration';
export const SCHEDULES_PATH = '/scheduling/schedules/administration/0';

// The real store and RTK Query run; only the network is replaced
export const renderWithProviders = (ui, options = {}) => {
  const { permissions = [VIEW], roles = [], route = '/agent-evaluation' } = options;
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
      const response = result ?? fail(404, { error: `Not mocked: ${request.method} ${path}` });

      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );

  return calls;
};

// GET /eval_auto: the effective settings as elitea_core returns them with nothing stored
export const makeSettings = (overrides = {}) => ({
  project_scope_mode: 'all',
  project_ids: [],
  include_personal_projects: false,
  dataset_policy: 'agent_first',
  max_agents_per_job: 200,
  max_cases_per_agent: 10,
  max_concurrent_runs: 2,
  case_concurrency: 1,
  fail_threshold: 50.0,
  coverage_threshold: 80.0,
  classify_threshold: 0.5,
  reevaluate_after_days: 28,
  window: null,
  ...overrides,
});

export const makeItem = (overrides = {}) => ({
  id: 11,
  job_id: 3,
  project_id: 4,
  application_id: 21,
  application_version_id: 31,
  eval_run_id: 41,
  suite_id: 51,
  agent_name: 'Refund Desk',
  owner_id: 2,
  state: 'done',
  status: 'passed',
  reason_code: null,
  reason_detail: null,
  headline_score: 87.25,
  coverage: 100,
  dataset_tier: 'agent_suite',
  trigger: 'scheduled',
  mode: 'full',
  attempts: 1,
  created_at: '2026-11-11T02:00:00+00:00',
  finished_at: '2026-11-11T02:05:00+00:00',
  ...overrides,
});

export const makeJob = (overrides = {}) => ({
  id: 3,
  trigger: 'scheduled',
  started_at: '2026-11-11T02:00:00+00:00',
  finished_at: '2026-11-11T02:30:00+00:00',
  counters: { queued: 5, carried_forward: 2, deferred: 1 },
  ...overrides,
});

// GET /eval_auto_dataset: the platform health check's probes
export const makeDataset = (overrides = {}) => ({
  name: 'Platform health check',
  probes: ['Who are you and what can you help with?', 'Summarize what you just told me in one sentence.'],
  customized: false,
  updated_at: '2026-11-11T02:00:00+00:00',
  ...overrides,
});
