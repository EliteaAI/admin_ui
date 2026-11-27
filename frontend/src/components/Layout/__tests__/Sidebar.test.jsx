import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { adminApi } from '@/api/admin.api';
import { Layout } from '@/components/Layout';
import { PERMISSIONS } from '@/constants/permissions.constants';
import store, { setPermissions, setRoles, setSidebarGroupOpen, toggleSidebarCollapsed } from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const theme = createTheme(getDesignTokens('dark'));

const USERS = PERMISSIONS.users.section;
const PROJECTS = PERMISSIONS.projects.list;
const ROLES = PERMISSIONS.roles.section;
const BUDGETS = PERMISSIONS.budgets.view;

const PEOPLE_ITEMS = ['users', 'projects', 'roles', 'app-requests'];

const renderSidebar = (route, permissions) => {
  store.dispatch(adminApi.util.resetApiState());
  store.dispatch(setPermissions(permissions));
  store.dispatch(setRoles([]));

  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route element={<Layout />}>
              <Route
                path="*"
                element={<div>page</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
};

// The store is shared by every test, so the collapsed flag is set explicitly
const setCollapsed = collapsed => {
  if (store.getState().settings.sideBarCollapsed !== collapsed) store.dispatch(toggleSidebarCollapsed());
};

const item = name => screen.queryByTestId(`sidebar-${name}-item`);
const heading = () => screen.queryByTestId('sidebar-people-access-heading');

beforeEach(() => {
  localStorage.clear();
  // The tool-spend list is only asked for when the user can view budgets
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    ),
  );
  store.dispatch(setSidebarGroupOpen({ groupId: 'people-access', open: false }));
  setCollapsed(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Sidebar People & Access group', () => {
  it('lists Users, Projects, Roles and App Requests in order under the heading', () => {
    // The page is outside the group, so the group is opened before rendering to read its order
    store.dispatch(setSidebarGroupOpen({ groupId: 'people-access', open: true }));
    renderSidebar('/budgets', [USERS, PROJECTS, ROLES, BUDGETS]);

    const entries = screen.getAllByTestId(/^sidebar-(users|projects|roles|app-requests)-item$/);
    expect(entries.map(entry => entry.dataset.testid)).toEqual(
      PEOPLE_ITEMS.map(name => `sidebar-${name}-item`),
    );
    expect(heading()).toHaveTextContent('People & Access');
  });

  it('shows only the entries the user has permission for', () => {
    renderSidebar('/projects', [PROJECTS]);

    expect(heading()).toBeInTheDocument();
    expect(item('projects')).toBeInTheDocument();
    expect(item('users')).not.toBeInTheDocument();
    expect(item('roles')).not.toBeInTheDocument();
    expect(item('app-requests')).not.toBeInTheDocument();
  });

  it('renders neither the heading nor the entries when the user has none of the permissions', () => {
    renderSidebar('/budgets', [BUDGETS]);

    expect(heading()).not.toBeInTheDocument();
    PEOPLE_ITEMS.forEach(name => expect(item(name)).not.toBeInTheDocument());
  });

  it('highlights only the current entry', () => {
    renderSidebar('/roles', [USERS, PROJECTS, ROLES]);

    expect(item('roles')).toHaveAttribute('aria-current', 'page');
    expect(item('users')).not.toHaveAttribute('aria-current');
    expect(item('projects')).not.toHaveAttribute('aria-current');
  });

  it('closes and reopens the group from a page outside it', async () => {
    const user = userEvent.setup();
    renderSidebar('/budgets', [USERS, PROJECTS, BUDGETS]);

    expect(item('users')).not.toBeInTheDocument();
    expect(heading()).toHaveAttribute('aria-expanded', 'false');

    await user.click(heading());
    expect(item('users')).toBeInTheDocument();
    expect(heading()).toHaveAttribute('aria-expanded', 'true');

    await user.click(heading());
    expect(item('users')).not.toBeInTheDocument();
  });

  it('cannot close the group that holds the current page', async () => {
    const user = userEvent.setup();
    renderSidebar('/users', [USERS, PROJECTS]);

    await user.click(heading());

    expect(item('users')).toBeInTheDocument();
    expect(heading()).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens a closed group when its page is opened by URL', () => {
    store.dispatch(setSidebarGroupOpen({ groupId: 'people-access', open: false }));
    renderSidebar('/roles', [USERS, ROLES]);

    expect(item('roles')).toBeInTheDocument();
  });

  it('remembers a closed group in the browser', async () => {
    const user = userEvent.setup();
    renderSidebar('/budgets', [USERS, BUDGETS]);

    await user.click(heading());
    await user.click(heading());

    expect(JSON.parse(localStorage.getItem('sidebarGroupsOpen'))).toEqual({ 'people-access': false });
  });

  it('toggles with the keyboard', async () => {
    const user = userEvent.setup();
    renderSidebar('/budgets', [USERS, BUDGETS]);

    heading().focus();
    expect(heading()).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(item('users')).toBeInTheDocument();
    await user.keyboard(' ');
    expect(item('users')).not.toBeInTheDocument();
  });

  it('shows every icon without a heading in the collapsed sidebar, even when the group is closed', () => {
    setCollapsed(true);
    renderSidebar('/budgets', [USERS, PROJECTS, ROLES, BUDGETS]);

    expect(heading()).not.toBeInTheDocument();
    PEOPLE_ITEMS.filter(name => name !== 'app-requests').forEach(name =>
      expect(item(name)).toBeInTheDocument(),
    );
    expect(screen.getByTestId('sidebar-budgets-item')).toBeInTheDocument();
  });
});

describe('Sidebar Agent Evaluation group', () => {
  const EVALUATION = PERMISSIONS.evalAuto.view;
  const DIMENSIONS = PERMISSIONS.platformDimensions.view;
  const evaluationHeading = () => screen.queryByTestId('sidebar-agent-evaluation-heading');

  it('lists Evaluation then Dimensions after the Security group', () => {
    renderSidebar('/agent-evaluation', [PERMISSIONS.runtime.plugins, EVALUATION, DIMENSIONS]);

    const all = screen.getAllByTestId(/^sidebar-.*-(item|heading)$/).map(entry => entry.dataset.testid);
    expect(all.indexOf('sidebar-security-heading')).toBeLessThan(
      all.indexOf('sidebar-agent-evaluation-heading'),
    );
    expect(all.indexOf('sidebar-evaluation-item')).toBeLessThan(all.indexOf('sidebar-dimensions-item'));
    expect(evaluationHeading()).toHaveTextContent('Agent Evaluation');
    expect(item('evaluation')).toHaveTextContent('Evaluation');
    expect(item('dimensions')).toHaveTextContent('Dimensions');
  });

  it('highlights each entry on its own page, which still uses its old route', () => {
    renderSidebar('/platform-dimensions', [EVALUATION, DIMENSIONS]);

    expect(item('dimensions')).toHaveAttribute('aria-current', 'page');
    expect(item('evaluation')).not.toHaveAttribute('aria-current');
  });

  it('shows Dimensions alone, with the heading, to a user who only has its permission', () => {
    renderSidebar('/platform-dimensions', [DIMENSIONS]);

    expect(evaluationHeading()).toBeInTheDocument();
    expect(item('dimensions')).toBeInTheDocument();
    expect(item('evaluation')).not.toBeInTheDocument();
  });

  it('shows no heading to a user with neither permission', () => {
    renderSidebar('/users', [USERS]);

    expect(evaluationHeading()).not.toBeInTheDocument();
  });
});

const mockToolSpend = features =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async request => {
      const body = request.url.includes('tool_spend_features') ? features : [];
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );

describe('Sidebar Cost & Usage group', () => {
  const LITELLM = PERMISSIONS.litellm.section;
  const PRICES = PERMISSIONS.modelPrices.view;
  const costHeading = () => screen.queryByTestId('sidebar-cost-usage-heading');
  const order = () => screen.getAllByTestId(/^sidebar-.*-(item|heading)$/).map(entry => entry.dataset.testid);

  it('lists Budgets, the tool-spend entries, LiteLLM and Model Prices in order, after Agent Evaluation', async () => {
    mockToolSpend([{ feature: 'web_search', label: 'Web search' }]);
    renderSidebar('/budgets', [BUDGETS, LITELLM, PRICES, PERMISSIONS.evalAuto.view]);

    await screen.findByTestId('sidebar-tool-spend-web_search-item');
    const ids = order();

    expect(ids.indexOf('sidebar-agent-evaluation-heading')).toBeLessThan(
      ids.indexOf('sidebar-cost-usage-heading'),
    );
    expect(
      ids.filter(id => /budgets|tool-spend|litellm|model-prices/.test(id) && id.endsWith('-item')),
    ).toEqual([
      'sidebar-budgets-item',
      'sidebar-tool-spend-web_search-item',
      'sidebar-litellm-item',
      'sidebar-model-prices-item',
    ]);
  });

  it('keeps every tool-spend entry between Budgets and LiteLLM, in the backend order', async () => {
    mockToolSpend([
      { feature: 'web_search', label: 'Web search' },
      { feature: 'image_gen', label: 'Image generation' },
    ]);
    renderSidebar('/budgets', [BUDGETS, LITELLM]);

    await screen.findByTestId('sidebar-tool-spend-image_gen-item');

    expect(order().filter(id => id.endsWith('-item'))).toEqual([
      'sidebar-budgets-item',
      'sidebar-tool-spend-web_search-item',
      'sidebar-tool-spend-image_gen-item',
      'sidebar-litellm-item',
    ]);
  });

  it('still shows Budgets, LiteLLM and Model Prices when the tool-spend request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 500 })),
    );
    renderSidebar('/budgets', [BUDGETS, LITELLM, PRICES]);

    expect(item('budgets')).toBeInTheDocument();
    expect(item('litellm')).toBeInTheDocument();
    expect(item('model-prices')).toBeInTheDocument();
    expect(screen.queryByTestId(/^sidebar-tool-spend-/)).not.toBeInTheDocument();
  });

  it('highlights only the tool-spend entry on its page, and opens the group', async () => {
    mockToolSpend([{ feature: 'web_search', label: 'Web search' }]);
    renderSidebar('/tool-spend/web_search', [BUDGETS]);

    const entry = await screen.findByTestId('sidebar-tool-spend-web_search-item');

    expect(entry).toHaveAttribute('aria-current', 'page');
    expect(item('budgets')).not.toHaveAttribute('aria-current');
    expect(costHeading()).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the heading and LiteLLM alone, and requests no tool-spend list, with only configuration.litellm', () => {
    const fetchMock = vi.fn(async () => new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    renderSidebar('/litellm', [LITELLM]);

    expect(costHeading()).toBeInTheDocument();
    expect(item('litellm')).toBeInTheDocument();
    expect(item('budgets')).not.toBeInTheDocument();
    expect(item('model-prices')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows no heading to a user with none of the four permissions', () => {
    renderSidebar('/users', [USERS]);

    expect(costHeading()).not.toBeInTheDocument();
  });
});

describe('Sidebar Monitoring & Audit group', () => {
  const AUDIT = PERMISSIONS.lifecycleAudit.view;
  const TRAIL = PERMISSIONS.auditTrail.view;
  const REPORTS = PERMISSIONS.surveys.reports;
  const monitoringHeading = () => screen.queryByTestId('sidebar-monitoring-audit-heading');

  it('lists Membership Audit, Audit Trail and Survey Reports in order, after Cost & Usage', () => {
    renderSidebar('/audit', [AUDIT, TRAIL, REPORTS, BUDGETS]);

    const ids = screen.getAllByTestId(/^sidebar-.*-(item|heading)$/).map(entry => entry.dataset.testid);
    expect(ids.indexOf('sidebar-cost-usage-heading')).toBeLessThan(
      ids.indexOf('sidebar-monitoring-audit-heading'),
    );
    expect(ids.filter(id => /audit|reports/.test(id) && id.endsWith('-item'))).toEqual([
      'sidebar-membership-audit-item',
      'sidebar-audit-trail-item',
      'sidebar-survey-reports-item',
    ]);
    expect(item('membership-audit')).toHaveTextContent('Membership Audit');
    expect(item('survey-reports')).toHaveTextContent('Survey Reports');
  });

  it('highlights Membership Audit on /audit, which was never highlighted before', () => {
    renderSidebar('/audit', [AUDIT, TRAIL]);

    expect(item('membership-audit')).toHaveAttribute('aria-current', 'page');
    expect(item('audit-trail')).not.toHaveAttribute('aria-current');
    expect(monitoringHeading()).toHaveAttribute('aria-expanded', 'true');
  });

  it('highlights Audit Trail and Survey Reports on their own pages', () => {
    renderSidebar('/reports', [AUDIT, TRAIL, REPORTS]);

    expect(item('survey-reports')).toHaveAttribute('aria-current', 'page');
    expect(item('membership-audit')).not.toHaveAttribute('aria-current');
  });

  it('shows each entry only with its own permission, and no heading without any', () => {
    renderSidebar('/audit-trail', [TRAIL]);

    expect(item('audit-trail')).toBeInTheDocument();
    expect(item('membership-audit')).not.toBeInTheDocument();
    expect(item('survey-reports')).not.toBeInTheDocument();
  });

  it('gives Membership Audit an icon no other entry uses', () => {
    renderSidebar('/audit', [AUDIT, TRAIL, REPORTS, USERS, PERMISSIONS.evalAuto.view]);

    const iconOf = name => item(name).querySelector('svg')?.getAttribute('data-testid');
    const icons = screen
      .getAllByTestId(/^sidebar-.*-item$/)
      .map(entry => entry.querySelector('svg')?.getAttribute('data-testid'));

    expect(iconOf('membership-audit')).toBe('PersonSearchOutlinedIcon');
    expect(icons.filter(icon => icon === 'PersonSearchOutlinedIcon')).toHaveLength(1);
  });
});

describe('Sidebar Features and Administration groups', () => {
  const PLUGINS = PERMISSIONS.runtime.plugins;
  const SCHEDULING = PERMISSIONS.scheduling.view;
  const groupIds = () =>
    screen
      .getAllByTestId(/^sidebar-.*-heading$/)
      .map(entry => entry.dataset.testid.replace(/^sidebar-|-heading$/g, ''));

  it('puts Features after Monitoring & Audit and Administration last, with all seven groups in order', () => {
    store.dispatch(setSidebarGroupOpen({ groupId: 'features', open: true }));
    renderSidebar('/features', [
      USERS,
      PLUGINS,
      PERMISSIONS.evalAuto.view,
      BUDGETS,
      PERMISSIONS.auditTrail.view,
    ]);

    expect(groupIds()).toEqual([
      'people-access',
      'security',
      'agent-evaluation',
      'cost-usage',
      'monitoring-audit',
      'features',
      'administration',
    ]);
  });

  it('shows the Features heading with the Features entry only with runtime.plugins', () => {
    renderSidebar('/features', [PLUGINS]);

    expect(screen.getByTestId('sidebar-features-heading')).toHaveTextContent('Features');
    expect(item('features')).toBeInTheDocument();
  });

  it('shows no Features heading without runtime.plugins', () => {
    renderSidebar('/users', [USERS]);

    expect(screen.queryByTestId('sidebar-features-heading')).not.toBeInTheDocument();
  });

  it('lists Configuration then System Tasks under Administration', () => {
    renderSidebar('/configuration', [PLUGINS]);

    const ids = screen.getAllByTestId(/^sidebar-.*-item$/).map(entry => entry.dataset.testid);
    expect(ids.indexOf('sidebar-configuration-item')).toBeLessThan(ids.indexOf('sidebar-system-tasks-item'));
    expect(screen.getByTestId('sidebar-administration-heading')).toHaveTextContent('Administration');
    expect(item('system-tasks')).toHaveTextContent('System Tasks');
  });

  it('shows System Tasks alone to a user who can only view schedules', () => {
    renderSidebar('/schedules-tasks', [SCHEDULING]);

    expect(item('system-tasks')).toHaveAttribute('aria-current', 'page');
    expect(item('configuration')).not.toBeInTheDocument();
  });

  it('shows no Administration heading to a user with neither permission', () => {
    renderSidebar('/users', [USERS]);

    expect(screen.queryByTestId('sidebar-administration-heading')).not.toBeInTheDocument();
  });

  it('leaves no entry outside a group', () => {
    renderSidebar('/users', [USERS, PLUGINS, BUDGETS, SCHEDULING]);

    const headings = screen.getAllByTestId(/^sidebar-.*-heading$/);
    expect(headings.length).toBeGreaterThan(0);
    // Every visible entry sits inside an expanded group, so none is rendered next to the groups
    screen.getAllByTestId(/^sidebar-.*-item$/).forEach(entry => {
      expect(entry.parentElement.parentElement.querySelector('[data-testid$="-heading"]')).not.toBeNull();
    });
  });
});

describe('Sidebar Security group', () => {
  const PLUGINS = PERMISSIONS.runtime.plugins;
  const SCIM = PERMISSIONS.scim.manage;
  const SECRETS = PERMISSIONS.secrets.list;
  const GOVERNANCE = PERMISSIONS.governance.settings.view;
  const securityHeading = () => screen.queryByTestId('sidebar-security-heading');

  it('lists Secrets, Authentication, SCIM Provisioning, Guardrails and Governance in order, after People & Access', () => {
    renderSidebar('/secrets', [USERS, SECRETS, PLUGINS, SCIM, GOVERNANCE]);

    const all = screen.getAllByTestId(/^sidebar-.*-(item|heading)$/).map(entry => entry.dataset.testid);
    expect(
      all.filter(id =>
        /^sidebar-(secrets|authentication|scim-provisioning|guardrails|governance)-item$/.test(id),
      ),
    ).toEqual([
      'sidebar-secrets-item',
      'sidebar-authentication-item',
      'sidebar-scim-provisioning-item',
      'sidebar-guardrails-item',
      'sidebar-governance-item',
    ]);
    expect(all.indexOf('sidebar-people-access-heading')).toBeLessThan(
      all.indexOf('sidebar-security-heading'),
    );
  });

  it('shows SCIM Provisioning only to users with both runtime.plugins and admin.scim.manage', () => {
    renderSidebar('/authentication', [PLUGINS]);

    expect(item('authentication')).toBeInTheDocument();
    expect(item('guardrails')).toBeInTheDocument();
    expect(item('scim-provisioning')).not.toBeInTheDocument();
  });

  it('does not show SCIM Provisioning with admin.scim.manage alone', () => {
    renderSidebar('/secrets', [SCIM, SECRETS]);

    expect(item('scim-provisioning')).not.toBeInTheDocument();
  });

  it('shows no Security heading to a user without any of the five permissions', () => {
    renderSidebar('/users', [USERS]);

    expect(securityHeading()).not.toBeInTheDocument();
  });

  it('highlights Authentication and opens Security on /authentication', () => {
    renderSidebar('/authentication', [PLUGINS]);

    expect(item('authentication')).toHaveAttribute('aria-current', 'page');
    expect(item('guardrails')).not.toHaveAttribute('aria-current');
    expect(securityHeading()).toHaveAttribute('aria-expanded', 'true');
  });

  it('no longer lists Governance in the ungrouped block', () => {
    renderSidebar('/governance', [GOVERNANCE]);

    expect(screen.getAllByTestId('sidebar-governance-item')).toHaveLength(1);
  });
});
