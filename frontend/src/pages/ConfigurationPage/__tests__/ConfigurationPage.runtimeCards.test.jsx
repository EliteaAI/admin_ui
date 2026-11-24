import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { fireEvent, render, screen } from '@testing-library/react';

import ConfigurationPage from '../ConfigurationPage';

// The page syncs server values with an effect keyed on the response object, so the mocks return stable objects
const mocks = vi.hoisted(() => {
  const RUNTIME_FIELDS = [
    {
      key: 'reload_enabled',
      title: 'Plugin Hot Reload',
      type: 'boolean',
      pylon_id: 'pylon_main_9f8e7d6c-1111-2222-3333-555555555555',
    },
    {
      key: 'sdk_dev_reload',
      title: 'SDK Hot Reload',
      type: 'boolean',
      pylon_id: 'pylon_indexer_1a2b3c4d-1111-2222-3333-444444444444',
    },
    {
      key: 'task_queue_debug',
      title: 'Task Queue Debug',
      type: 'boolean',
      pylon_id: 'pylon_indexer_1a2b3c4d-1111-2222-3333-444444444444',
    },
  ];
  const schemas = { data: { sections: [{ id: 'runtime', title: 'Runtime', fields: RUNTIME_FIELDS }] } };
  const values = {
    values: { reload_enabled: true, sdk_dev_reload: false, task_queue_debug: false },
    fields_meta: {},
  };
  const valuesResponse = { data: values, currentData: values, isFetching: false, isLoading: false };
  // What RTK Query returns while the same section refetches after Save: the previous data stays as currentData
  const refetchingResponse = { ...valuesResponse, isFetching: true };
  return { schemas, settledResponse: valuesResponse, valuesResponse, refetchingResponse };
});

vi.mock('@/api/configuration.api', async importOriginal => ({
  ...(await importOriginal()),
  useConfigSchemasQuery: () => mocks.schemas,
  useConfigValuesQuery: () => mocks.valuesResponse,
  useConfigValuesSaveMutation: () => [vi.fn(), {}],
  useConfigRestartMutation: () => [vi.fn(), {}],
}));

vi.mock('@/hooks/useCheckPermission.hooks', () => ({
  useCheckPermission: () => ({ hasAnyPermission: () => true }),
}));

afterEach(() => {
  mocks.valuesResponse = mocks.settledResponse;
  window.history.replaceState(null, '', window.location.pathname);
});

const renderPage = () => (
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
  </Provider>
);

describe('Runtime section', () => {
  it('groups the settings into a Pylon Indexer card and a Pylon Main card, collapsed by default', () => {
    window.history.replaceState(null, '', '#runtime');
    render(renderPage());

    const indexerHeader = screen.getByRole('button', { name: /Pylon Indexer/ });
    const mainHeader = screen.getByRole('button', { name: /Pylon Main/ });

    expect(indexerHeader).toHaveAttribute('aria-expanded', 'false');
    expect(mainHeader).toHaveAttribute('aria-expanded', 'false');
    expect(indexerHeader.textContent).toContain('2 settings');
    expect(mainHeader.textContent).toContain('1 setting');
  });

  it('keeps an expanded card open while its values refetch after Save', () => {
    window.history.replaceState(null, '', '#runtime');
    const { rerender } = render(renderPage());
    fireEvent.click(screen.getByRole('button', { name: /Pylon Indexer/ }));
    expect(screen.getByRole('button', { name: /Pylon Indexer/ })).toHaveAttribute('aria-expanded', 'true');

    mocks.valuesResponse = mocks.refetchingResponse;
    rerender(renderPage());
    expect(screen.getByRole('button', { name: /Pylon Indexer/ })).toHaveAttribute('aria-expanded', 'true');

    mocks.valuesResponse = mocks.settledResponse;
    rerender(renderPage());
    expect(screen.getByRole('button', { name: /Pylon Indexer/ })).toHaveAttribute('aria-expanded', 'true');
  });
});
