import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen, waitFor } from '@testing-library/react';

import ConfigurationPage from '../../ConfigurationPage/ConfigurationPage';
import FeaturesPage from '../FeaturesPage';

// Records every value the values query is asked for, so a redirect that starts loading Features sections shows up
const valuesRequests = vi.hoisted(() => []);
// One stable object: a fresh one per call re-renders the page on every render
const STABLE_VALUES = vi.hoisted(() => ({
  data: { values: {} },
  currentData: { values: {} },
  isFetching: false,
  isLoading: false,
}));

vi.mock('@/api/configuration.api', async importOriginal => ({
  ...(await importOriginal()),
  useConfigSchemasQuery: () => ({ data: { sections: [] } }),
  // RTK does not run a query that is skipped, so only unskipped calls count as requests
  useConfigValuesQuery: (arg, options) => {
    if (!options?.skip) valuesRequests.push(arg?.sectionId);
    return options?.skip
      ? { data: undefined, currentData: undefined, isFetching: false, isLoading: false }
      : STABLE_VALUES;
  },
  useConfigValuesSaveMutation: () => [vi.fn(), {}],
  useConfigRestartMutation: () => [vi.fn(), {}],
}));

vi.mock('@/hooks/useCheckPermission.hooks', () => ({
  useCheckPermission: () => ({ hasAnyPermission: () => true, hasPermission: () => true }),
}));

// Reports where the app ended up, and how many history entries the redirect left behind
const Probe = () => {
  const location = useLocation();
  return (
    <div>
      <div data-testid="path">{location.pathname}</div>
      <div data-testid="hash">{location.hash}</div>
    </div>
  );
};

const renderAt = route => {
  window.history.replaceState(null, '', route);
  return render(
    <Provider store={store}>
      <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route
              path="/features"
              element={
                <>
                  <FeaturesPage />
                  <Probe />
                </>
              }
            />
            <Route
              path="/configuration"
              element={
                <>
                  <ConfigurationPage />
                  <Probe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
};

beforeEach(() => {
  valuesRequests.length = 0;
  window.history.replaceState(null, '', '/');
});

describe('old Features links to sections that moved to Configuration', () => {
  it.each([
    ['#surveys', 'surveys'],
    ['#help_center', 'resources'],
    ['#support_assistant', 'support_assistant'],
    ['#custom_theme', 'custom_theme'],
  ])('lands %s on Configuration, on that section', async (hash, target) => {
    renderAt(`/features${hash}`);

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/configuration'));
    expect(screen.getByTestId('hash')).toHaveTextContent(`#${target}`);
  });

  it('leaves no extra history entries behind the redirect', async () => {
    const before = window.history.length;
    renderAt('/features#surveys');

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/configuration'));
    // A redirect replaces the Features entry; writing a Features hash on the way would push one more entry
    expect(window.history.length - before).toBeLessThanOrEqual(1);
  });

  it('does not overwrite the target hash with a Features section on the way', async () => {
    renderAt('/features#surveys');

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/configuration'));
    expect(screen.getByTestId('hash')).not.toHaveTextContent('chat_configuration');
    expect(screen.getByTestId('hash')).not.toHaveTextContent('#advanced');
  });

  it('does not load values for Features sections while redirecting', async () => {
    renderAt('/features#custom_theme');

    await waitFor(() => expect(screen.getByTestId('path')).toHaveTextContent('/configuration'));
    expect(valuesRequests).not.toContain('chat_configuration');
    expect(valuesRequests).not.toContain('guardrails');
  });
});
