import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import SchemaField from '@/components/SchemaForm/components/SchemaField';
import getDesignTokens from '@/theme/main.theme';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/api/configuration.api', async importOriginal => ({
  ...(await importOriginal()),
  useConfigSuggestionsQuery: () => ({}),
}));

const NUMBER_FIELD = { type: 'integer', minimum: 1, value_schema: { type: 'integer', minimum: 1 } };
const NULLABLE_FIELD = { type: 'number', minimum: 0, value_schema: { type: ['number', 'null'], minimum: 0 } };

const renderField = (field, value, onChange = vi.fn()) => {
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <SchemaField
        field={field}
        value={value}
        onChange={onChange}
      />
    </ThemeProvider>,
  );
  return { input: screen.getByRole('spinbutton'), onChange };
};

// #7618: a space over the selected value leaves a number input empty; that must never become 0
describe('SchemaField number input', () => {
  it('keeps the stored number when a field that needs a value is emptied', () => {
    const { input, onChange } = renderField(NUMBER_FIELD, 200);

    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(null);
    expect(screen.getByText('Enter a number')).toBeInTheDocument();
  });

  it('shows the stored number again when the emptied field is left', () => {
    const { input } = renderField(NUMBER_FIELD, 200);

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input).toHaveValue(200);
    expect(screen.queryByText('Enter a number')).not.toBeInTheDocument();
  });

  it('clears a nullable field to no value', () => {
    const { input, onChange } = renderField(NULLABLE_FIELD, 20);

    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByText('Enter a number')).not.toBeInTheDocument();
  });

  it('sends a typed number', () => {
    const { input, onChange } = renderField(NUMBER_FIELD, 200);

    fireEvent.change(input, { target: { value: '350' } });

    expect(onChange).toHaveBeenCalledWith(350);
  });
});
