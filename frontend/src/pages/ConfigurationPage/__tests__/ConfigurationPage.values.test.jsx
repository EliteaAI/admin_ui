import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen } from '@testing-library/react';

import ConfigurationPage from '../ConfigurationPage';

// Per-test answer of the values query. RTK keeps the previous argument's data while a new argument loads, so the
// mock returns `currentData` only when the arg is the one the test says has finished loading.
const valuesState = vi.hoisted(() => ({ current: null }));

vi.mock('@/api/configuration.api', async importOriginal => ({
  ...(await importOriginal()),
  useConfigSchemasQuery: () => ({
    data: {
      sections: [
        { id: 'support_assistant', title: 'Support Assistant', fields: [] },
        { id: 'resources', title: 'Resources', fields: [] },
        { id: 'runtime', title: 'Runtime', fields: [] },
      ],
    },
  }),
  useConfigValuesQuery: () => valuesState.current,
  useConfigValuesSaveMutation: () => [vi.fn(), {}],
  useConfigRestartMutation: () => [vi.fn(), {}],
}));

vi.mock('@/hooks/useCheckPermission.hooks', () => ({
  useCheckPermission: () => ({ hasAnyPermission: () => true }),
}));

const renderAt = hash => {
  window.history.replaceState(null, '', hash);
  return render(
    <Provider store={store}>
      <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
        <MemoryRouter initialEntries={['/configuration']}>
          <Routes>
            <Route
              path="*"
              element={<ConfigurationPage />}
            />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
};

beforeEach(() => {
  valuesState.current = null;
  window.history.replaceState(null, '', '/');
});

describe('Support Assistant and Help Center wait for their own values', () => {
  it('shows a spinner, not the previous section values, while this section loads', () => {
    // The values query still holds Runtime's data, but its current argument is Support Assistant's and is loading
    valuesState.current = {
      data: { values: { runtime_field: 'runtime-value' } },
      currentData: undefined,
      isFetching: true,
      isLoading: false,
    };

    renderAt('#support_assistant');

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the section once its own values have arrived', () => {
    valuesState.current = {
      data: { values: { support_assistant_name: 'Helper' } },
      currentData: { values: { support_assistant_name: 'Helper' } },
      isFetching: false,
      isLoading: false,
    };

    renderAt('#support_assistant');

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('keeps the section mounted during a refetch after Save', () => {
    // A refetch of the same argument: data for it is already current, so the blocks must stay up
    valuesState.current = {
      data: { values: { support_assistant_name: 'Helper' } },
      currentData: { values: { support_assistant_name: 'Helper' } },
      isFetching: true,
      isLoading: false,
    };

    renderAt('#resources');

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
