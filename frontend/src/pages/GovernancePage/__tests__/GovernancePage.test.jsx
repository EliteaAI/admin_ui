import { afterEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS, ROUTE_PERMISSIONS, SIDEBAR_PERMISSIONS } from '@/constants/permissions.constants';
import { RouteDefinitions } from '@/constants/routes.constants';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GovernancePage from '../GovernancePage';
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
  });
});

describe('page shell', () => {
  const setup = (route = '/governance') => {
    mockApi({
      [`GET ${SETTINGS_PATH}`]: ok(makeSettings()),
      [`GET ${HISTORY_PATH}`]: ok(emptyHistory),
    });
    return renderWithProviders(<GovernancePage />, { permissions: [VIEW, MANAGE], route });
  };

  it('registers all five tabs and opens on Overview', async () => {
    setup();

    expect(await screen.findByTestId('governance-overview')).toBeInTheDocument();
    ['overview', 'identities', 'credentials', 'grants', 'mandates'].forEach(id => {
      expect(screen.getByTestId(`governance-tab-${id}`)).toBeInTheDocument();
    });
    expect(screen.getByTestId('governance-tab-overview')).toHaveAttribute('aria-selected', 'true');
  });

  it('shows a placeholder on the tabs that are not built yet', async () => {
    setup();
    const user = userEvent.setup();

    await user.click(screen.getByTestId('governance-tab-credentials'));

    expect(screen.getByTestId('governance-coming-soon')).toHaveTextContent(
      'Credentials is coming in the next update.',
    );
    expect(screen.queryByTestId('governance-overview')).not.toBeInTheDocument();
  });

  it('follows ?tab= and falls back to Overview for an unknown tab', async () => {
    setup('/governance?tab=grants');
    expect(screen.getByTestId('governance-coming-soon')).toHaveTextContent('Grants');
  });

  it('falls back to Overview for an unknown tab', async () => {
    setup('/governance?tab=nope');
    expect(await screen.findByTestId('governance-overview')).toBeInTheDocument();
  });
});
