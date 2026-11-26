import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { fireEvent, render, screen } from '@testing-library/react';

import ConfigurationPage from '../ConfigurationPage';

const valuesState = vi.hoisted(() => ({ current: null }));
const saveValues = vi.hoisted(() => vi.fn());

vi.mock('@/api/configuration.api', async importOriginal => ({
  ...(await importOriginal()),
  useConfigSchemasQuery: () => ({
    data: {
      sections: [
        {
          id: 'limits',
          title: 'Limits',
          fields: [
            {
              key: 'max_items',
              type: 'integer',
              title: 'Max Items',
              minimum: 1,
              maximum: 10,
              value_schema: { type: 'integer', minimum: 1, maximum: 10 },
            },
            { key: 'note', type: 'string', title: 'Note' },
          ],
        },
      ],
    },
  }),
  useConfigValuesQuery: () => valuesState.current,
  useConfigValuesSaveMutation: () => [saveValues, {}],
  useConfigRestartMutation: () => [vi.fn(), {}],
  useConfigSuggestionsQuery: () => ({}),
}));

vi.mock('@/hooks/useCheckPermission.hooks', () => ({
  useCheckPermission: () => ({ hasAnyPermission: () => true }),
}));

const renderWithStored = values => {
  valuesState.current = { data: { values }, currentData: { values }, isFetching: false, isLoading: false };
  window.history.replaceState(null, '', '#limits');
  render(
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
  return {
    numberInput: screen.getByRole('spinbutton'),
    noteInput: screen.getByPlaceholderText('Enter value...'),
    save: screen.getByRole('button', { name: 'Save' }),
  };
};

beforeEach(() => {
  saveValues.mockReset();
  saveValues.mockReturnValue({ unwrap: () => Promise.resolve({}) });
});

// #7747: the values arrive after the form first renders, so a stored value must never count as the admin's input
describe('Configuration number fields and the Save button', () => {
  it('lets an unrelated change be saved while a stored value is out of range', () => {
    const { noteInput, save } = renderWithStored({ max_items: 50, note: 'a' });

    fireEvent.change(noteInput, { target: { value: 'ab' } });

    expect(screen.getByText('Enter a whole number from 1 to 10')).toBeInTheDocument();
    expect(save).toBeEnabled();
  });

  it('lets an unrelated change be saved while the stored value is in range', () => {
    const { noteInput, save } = renderWithStored({ max_items: 5, note: 'a' });

    fireEvent.change(noteInput, { target: { value: 'ab' } });

    expect(save).toBeEnabled();
  });

  it('blocks Save when the admin types an out-of-range value', () => {
    const { numberInput, save } = renderWithStored({ max_items: 5, note: 'a' });

    fireEvent.change(numberInput, { target: { value: '50' } });

    expect(save).toBeDisabled();
  });

  it('blocks Save when the admin types the out-of-range value back after saving a fix', async () => {
    const { numberInput, save } = renderWithStored({ max_items: 50, note: 'a' });

    fireEvent.change(numberInput, { target: { value: '7' } });
    fireEvent.click(save);
    await screen.findByText('Configuration saved successfully');
    fireEvent.change(numberInput, { target: { value: '50' } });

    expect(save).toBeDisabled();
  });
});
