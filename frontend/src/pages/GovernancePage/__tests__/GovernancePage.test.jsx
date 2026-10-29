import { afterEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS, ROUTE_PERMISSIONS, SIDEBAR_PERMISSIONS } from '@/constants/permissions.constants';
import { RouteDefinitions } from '@/constants/routes.constants';
import { GovernancePage } from '@/pages/GovernancePage';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CRED_VIEW } from './credentialsTest.helpers';
import {
  HISTORY_PATH,
  MANAGE,
  SETTINGS_PATH,
  VIEW,
  emptyHistory,
  makeSettings,
  mockApi,
  ok,
  renderWithProviders,
} from './governanceTest.helpers';
import { BINDINGS_VIEW } from './identitiesTest.helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('route and sidebar permissions', () => {
  it('opens the page to anyone who can view settings, bindings or credentials', () => {
    expect(RouteDefinitions.Governance).toBe('/governance');
    expect(SIDEBAR_PERMISSIONS.governance).toEqual([
      PERMISSIONS.governance.settings.view,
      PERMISSIONS.governance.bindings.view,
      PERMISSIONS.credentials.view,
    ]);
    expect(ROUTE_PERMISSIONS['/governance']).toBe(SIDEBAR_PERMISSIONS.governance);
  });

  it('uses the permission keys the backend checks', () => {
    expect(PERMISSIONS.governance.settings.view).toBe('governance.settings.view');
    expect(PERMISSIONS.governance.settings.manage).toBe('governance.settings.manage');
    expect(PERMISSIONS.governance.bindings.view).toBe('governance.bindings.view');
    expect(PERMISSIONS.governance.bindings.manage).toBe('governance.bindings.manage');
    expect(PERMISSIONS.governance.bindings.approve).toBe('governance.bindings.approve');
    expect(PERMISSIONS.credentials.view).toBe('credentials.view');
    expect(PERMISSIONS.credentials.manage).toBe('credentials.manage');
    expect(PERMISSIONS.credentials.probe).toBe('credentials.probe');
    expect(PERMISSIONS.credentials.approve).toBe('credentials.approve');
  });
});

describe('page shell', () => {
  const setup = (route = '/governance', permissions = [VIEW, MANAGE, BINDINGS_VIEW, CRED_VIEW]) => {
    mockApi({
      [`GET ${SETTINGS_PATH}`]: ok(makeSettings()),
      [`GET ${HISTORY_PATH}`]: ok(emptyHistory),
    });
    return renderWithProviders(<GovernancePage />, { permissions, route });
  };

  it('registers all five tabs and opens on Overview', async () => {
    setup();

    expect(await screen.findByTestId('governance-overview')).toBeInTheDocument();
    ['overview', 'identities', 'credentials', 'grants', 'mandates'].forEach(id => {
      expect(screen.getByTestId(`governance-tab-${id}`)).toBeInTheDocument();
    });
    expect(screen.getByTestId('governance-tab-overview')).toHaveAttribute('aria-selected', 'true');
  });

  it('opens the Credentials tab, and the Grants tab, for operators who can view credentials', async () => {
    setup('/governance', [VIEW, CRED_VIEW]);
    const user = userEvent.setup();

    await user.click(screen.getByTestId('governance-tab-credentials'));
    expect(await screen.findByTestId('governance-credentials')).toBeInTheDocument();
    expect(screen.queryByTestId('governance-overview')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('governance-tab-grants'));
    expect(await screen.findByTestId('governance-grants')).toBeInTheDocument();
  });

  it('hides the Credentials and Grants tabs without the credentials view permission', async () => {
    setup('/governance?tab=credentials', [VIEW]);

    expect(await screen.findByTestId('governance-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('governance-tab-credentials')).not.toBeInTheDocument();
    expect(screen.queryByTestId('governance-tab-grants')).not.toBeInTheDocument();
  });

  it('opens the Mandates tab for operators who can view bindings, and hides it from others', async () => {
    setup('/governance?tab=mandates');

    expect(await screen.findByTestId('governance-mandates')).toBeInTheDocument();
    expect(screen.queryByTestId('governance-overview')).not.toBeInTheDocument();
  });

  it('hides the Mandates tab without the bindings view permission', async () => {
    setup('/governance?tab=mandates', [VIEW]);

    expect(await screen.findByTestId('governance-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('governance-tab-mandates')).not.toBeInTheDocument();
  });

  it('opens the Agent identities tab for operators who can view bindings', async () => {
    setup('/governance?tab=identities');

    expect(await screen.findByTestId('governance-identities')).toBeInTheDocument();
    expect(screen.queryByTestId('governance-overview')).not.toBeInTheDocument();
  });

  it('hides the tabs the operator cannot read and opens on the first one left', async () => {
    setup('/governance?tab=overview', [BINDINGS_VIEW]);

    expect(await screen.findByTestId('governance-identities')).toBeInTheDocument();
    expect(screen.queryByTestId('governance-tab-overview')).not.toBeInTheDocument();
    expect(screen.getByTestId('governance-tab-identities')).toHaveAttribute('aria-selected', 'true');
  });

  it('hides the Agent identities tab without the bindings view permission', async () => {
    setup('/governance?tab=identities', [VIEW]);

    expect(await screen.findByTestId('governance-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('governance-tab-identities')).not.toBeInTheDocument();
  });

  it('follows ?tab= for the Grants tab', async () => {
    setup('/governance?tab=grants', [VIEW, CRED_VIEW]);
    expect(await screen.findByTestId('governance-grants')).toBeInTheDocument();
  });

  it('falls back to Overview for an unknown tab', async () => {
    setup('/governance?tab=nope');
    expect(await screen.findByTestId('governance-overview')).toBeInTheDocument();
  });
});
