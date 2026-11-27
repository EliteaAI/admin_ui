import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen, waitFor } from '@testing-library/react';

import ConfigurationPage from '../ConfigurationPage';

vi.mock('@/api/configuration.api', async importOriginal => ({
  ...(await importOriginal()),
  useConfigSchemasQuery: () => ({
    data: {
      sections: [
        { id: 'runtime', title: 'Runtime' },
        { id: 'notifications', title: 'User Management' },
        { id: 'auth', title: 'Authentication', fields: [] },
        { id: 'guardrails', title: 'Guardrails', fields: [] },
        { id: 'advanced', title: 'Advanced' },
        { id: 'maintenance', title: 'Maintenance' },
        { id: 'resources', title: 'Resources', fields: [] },
        { id: 'support_assistant', title: 'Support Assistant', fields: [] },
        { id: 'Usage', title: 'Usage', fields: [] },
      ],
    },
  }),
  useConfigValuesQuery: () => ({}),
  useConfigValuesSaveMutation: () => [vi.fn(), {}],
  useConfigRestartMutation: () => [vi.fn(), {}],
}));

vi.mock('@/hooks/useCheckPermission.hooks', () => ({
  useCheckPermission: () => ({ hasAnyPermission: () => true }),
}));

// Sections that own their data (Pylons & Plugins, Surveys, Custom Theme) call the API through the store
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } })),
  );
});

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderPage = (props = {}, route = '/configuration') =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <ConfigurationPage {...props} />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );

describe('Configuration sections', () => {
  afterEach(() => window.history.replaceState(null, '', window.location.pathname));

  it('does not show the Notifications section owned by Features', () => {
    window.history.replaceState(null, '', '#runtime');
    renderPage();

    expect(screen.getByText('Runtime')).toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });

  it('does not list Authentication, SCIM Provisioning or Guardrails, which have their own pages', () => {
    window.history.replaceState(null, '', '#runtime');
    renderPage();

    expect(screen.queryByText('Authentication')).not.toBeInTheDocument();
    expect(screen.queryByText('SCIM Provisioning')).not.toBeInTheDocument();
    expect(screen.queryByText('Guardrails')).not.toBeInTheDocument();
  });

  it.each([
    ['auth', '/authentication'],
    ['scim', '/scim-provisioning'],
    ['guardrails', '/guardrails'],
  ])('sends the old #%s link to %s', async (hash, route) => {
    window.history.replaceState(null, '', `#${hash}`);
    renderPage();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(route));
  });
});

describe('Configuration regrouped sections', () => {
  afterEach(() => window.history.replaceState(null, '', window.location.pathname));

  const menuTitles = () =>
    screen
      .getAllByText(
        /^(Pylons & Plugins|Maintenance|Banner|MCP Servers|OAuth Apps|Service Descriptors|Runtime|Observability|Support Assistant|Help Center|Surveys|Custom Theme|Advanced|Resources|Usage)$/,
      )
      .map(node => node.textContent);

  it('lists the sections in the new order, with the moved ones last and Usage gone', () => {
    window.history.replaceState(null, '', '#runtime');
    renderPage();

    expect(menuTitles()).toEqual([
      'Pylons & Plugins',
      'Maintenance',
      'OAuth Apps',
      'Service Descriptors',
      'Runtime',
      'Support Assistant',
      'Help Center',
      'Surveys',
      'Custom Theme',
    ]);
  });

  it('shows the frontend names instead of the backend titles Advanced and Resources', () => {
    window.history.replaceState(null, '', '#runtime');
    renderPage();

    expect(screen.queryByText('Advanced')).not.toBeInTheDocument();
    expect(screen.queryByText('Resources')).not.toBeInTheDocument();
  });

  it('opens Pylons & Plugins by default and titles the tab after it', () => {
    renderPage();

    expect(document.title).toBe('Configuration: Pylons & Plugins - Elitea Admin');
  });

  it('keeps the old #advanced link on Pylons & Plugins', () => {
    window.history.replaceState(null, '', '#advanced');
    renderPage();

    expect(document.title).toBe('Configuration: Pylons & Plugins - Elitea Admin');
  });

  it('sends the old #Usage link to Cost & Usage with Usage Settings open', async () => {
    window.history.replaceState(null, '', '#Usage');
    renderPage();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/features'));
  });

  it('shows the Add survey button only on Surveys, which saves on its own', () => {
    window.history.replaceState(null, '', '#surveys');
    renderPage();

    expect(screen.getByLabelText('Add survey')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('shows Custom Theme without the shared Save bar', () => {
    window.history.replaceState(null, '', '#custom_theme');
    renderPage();

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('shows the Save bar on Support Assistant and Help Center', () => {
    window.history.replaceState(null, '', '#support_assistant');
    renderPage();

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});

describe('Configuration single-section pages', () => {
  afterEach(() => window.history.replaceState(null, '', window.location.pathname));

  it('shows one section under its own title, without the sub-menu', () => {
    renderPage({ sectionId: 'auth' }, '/authentication');

    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.queryByText('Runtime')).not.toBeInTheDocument();
    expect(document.title).toBe('Authentication - Elitea Admin');
  });

  it('titles the Guardrails page after the section and keeps the save bar', () => {
    renderPage({ sectionId: 'guardrails' }, '/guardrails');

    expect(document.title).toBe('Guardrails - Elitea Admin');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
  });

  it('does not write a hash into the URL', () => {
    renderPage({ sectionId: 'auth' }, '/authentication');

    expect(window.location.hash).toBe('');
  });
});
