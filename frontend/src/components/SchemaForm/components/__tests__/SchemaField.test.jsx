import { useState } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { FieldErrorsContext } from '@/components/SchemaForm';
import SchemaField from '@/components/SchemaForm/components/SchemaField';
import { useFieldErrors } from '@/hooks/useFieldErrors.hooks';
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
    expect(screen.getByText('Enter a whole number of at least 1')).toBeInTheDocument();
  });

  it('shows the stored number again when the emptied field is left', () => {
    const { input } = renderField(NUMBER_FIELD, 200);

    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);

    expect(input).toHaveValue(200);
    expect(screen.queryByText(/^Enter a/)).not.toBeInTheDocument();
  });

  it('clears a nullable field to no value', () => {
    const { input, onChange } = renderField(NULLABLE_FIELD, 20);

    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.queryByText(/^Enter a/)).not.toBeInTheDocument();
  });

  it('sends a typed number', () => {
    const { input, onChange } = renderField(NUMBER_FIELD, 200);

    fireEvent.change(input, { target: { value: '350' } });

    expect(onChange).toHaveBeenCalledWith(350);
  });
});

const STARTERS_FIELD = {
  key: 'max_conversation_starters',
  type: 'integer',
  minimum: 1,
  maximum: 10,
  value_schema: { type: 'integer', minimum: 1, maximum: 10 },
};
const RANGE_ERROR = 'Enter a whole number from 1 to 10';

// A page with a shared Save bar: the form holds the value, Discard puts the stored one back
const FormWithSaveBar = ({ field, storedValue, onChange }) => {
  const { hasFieldErrors, reportFieldError } = useFieldErrors();
  const [value, setValue] = useState(storedValue);
  const [showField, setShowField] = useState(true);
  const handleChange = next => {
    onChange?.(next);
    setValue(next);
  };
  return (
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <FieldErrorsContext.Provider value={reportFieldError}>
        {showField && (
          <SchemaField
            field={field}
            value={value}
            onChange={handleChange}
          />
        )}
      </FieldErrorsContext.Provider>
      <button disabled={hasFieldErrors}>Save</button>
      <button onClick={() => setValue(storedValue)}>Discard</button>
      <button onClick={() => setShowField(false)}>Hide</button>
    </ThemeProvider>
  );
};

const renderForm = (field, storedValue, onChange) => {
  render(
    <FormWithSaveBar
      field={field}
      storedValue={storedValue}
      onChange={onChange}
    />,
  );
  return {
    input: screen.getByRole('spinbutton'),
    save: screen.getByRole('button', { name: 'Save' }),
    type: text => fireEvent.change(screen.getByRole('spinbutton'), { target: { value: text } }),
    leave: () => fireEvent.blur(screen.getByRole('spinbutton')),
    discard: () => fireEvent.click(screen.getByRole('button', { name: 'Discard' })),
    hide: () => fireEvent.click(screen.getByRole('button', { name: 'Hide' })),
  };
};

// #7747 (#7322 AC-3): every value the backend rejects shows the range error and blocks Save
describe('SchemaField number range', () => {
  it.each(['', '0', '11', '-1', '4.5', '1e1'])('shows the range error and blocks Save for "%s"', text => {
    const { input, save, type } = renderForm(STARTERS_FIELD, 6);

    type(text);

    expect(screen.getByText(RANGE_ERROR)).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(save).toBeDisabled();
  });

  it.each(['1', '10'])('accepts the boundary "%s"', text => {
    const { save, type } = renderForm(STARTERS_FIELD, 6);

    type(text);

    expect(screen.queryByText(RANGE_ERROR)).not.toBeInTheDocument();
    expect(save).toBeEnabled();
  });

  it('keeps blocking Save after the field is left with an out-of-range value', () => {
    const { save, type, leave } = renderForm(STARTERS_FIELD, 6);

    type('11');
    leave();

    expect(screen.getByText(RANGE_ERROR)).toBeInTheDocument();
    expect(save).toBeDisabled();
  });

  it('unblocks Save once the value is fixed', () => {
    const { save, type } = renderForm(STARTERS_FIELD, 6);

    type('11');
    type('7');

    expect(screen.queryByText(RANGE_ERROR)).not.toBeInTheDocument();
    expect(save).toBeEnabled();
  });

  it('stops blocking Save when the field with the error goes away', () => {
    const { save, type, hide } = renderForm(STARTERS_FIELD, 6);

    type('11');
    hide();

    expect(save).toBeEnabled();
  });

  it('uses the value_schema bounds the backend checks', () => {
    const { type } = renderForm(
      { type: 'number', minimum: 0, value_schema: { type: 'number', exclusiveMinimum: 0 } },
      0.008,
    );

    type('0');

    expect(screen.getByText('Enter a number greater than 0')).toBeInTheDocument();
  });

  it('leaves a cleared nullable field without an error', () => {
    const { save, type } = renderForm(NULLABLE_FIELD, 20);

    type('');

    expect(screen.queryByText(/^Enter a/)).not.toBeInTheDocument();
    expect(save).toBeEnabled();
  });
});

// #7747 review: what the backend accepts must never be blocked
describe('SchemaField number checks the backend does not make', () => {
  it('ignores top-level bounds when the field has no value_schema', () => {
    const { save, type } = renderForm({ type: 'integer', minimum: 1000 }, 20000);

    type('500');

    expect(screen.queryByText(/^Enter a/)).not.toBeInTheDocument();
    expect(save).toBeEnabled();
  });

  it('shows a stored out-of-range value as an error without blocking Save', () => {
    const { save } = renderForm(STARTERS_FIELD, 12);

    expect(screen.getByText(RANGE_ERROR)).toBeInTheDocument();
    expect(save).toBeEnabled();
  });

  it('blocks Save once the admin edits a stored out-of-range value to another invalid one', () => {
    const { save, type } = renderForm(STARTERS_FIELD, 12);

    type('13');

    expect(save).toBeDisabled();
  });
});

describe('SchemaField text that is not a whole number', () => {
  it.each(['4.5', '1e1'])(
    'puts "%s" in the form as typed and keeps blocking Save after the field is left',
    text => {
      const onChange = vi.fn();
      const { input, save, type, leave } = renderForm(STARTERS_FIELD, 6, onChange);

      type(text);
      leave();

      expect(onChange).toHaveBeenLastCalledWith(text);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText(RANGE_ERROR)).toBeInTheDocument();
      expect(save).toBeDisabled();
    },
  );

  it('does not save the whole number typed on the way to "12.5"', () => {
    const { save, type, leave } = renderForm({ ...STARTERS_FIELD, value_schema: { type: 'integer' } }, 5);

    type('1');
    type('12');
    type('12.5');
    leave();

    expect(screen.getByText('Enter a whole number')).toBeInTheDocument();
    expect(save).toBeDisabled();
  });

  it('keeps a nullable field blocked when "1e1" passes through an empty value', () => {
    const field = { type: 'integer', value_schema: { type: ['integer', 'null'], minimum: 1, maximum: 100 } };
    const { save, type, leave } = renderForm(field, 20);

    type('1');
    type('');
    type('1e1');
    leave();

    expect(screen.getByText('Enter a whole number from 1 to 100')).toBeInTheDocument();
    expect(save).toBeDisabled();
  });

  it('clears on Discard even when the text was typed over the stored number', () => {
    const { input, save, type, leave, discard } = renderForm(STARTERS_FIELD, 6);

    type('6');
    type('6.5');
    leave();
    discard();

    expect(input).toHaveValue(6);
    expect(screen.queryByText(RANGE_ERROR)).not.toBeInTheDocument();
    expect(save).toBeEnabled();
  });

  it('clears on Discard for a nullable field stored empty', () => {
    const field = { type: 'integer', value_schema: { type: ['integer', 'null'], minimum: 1, maximum: 100 } };
    const { input, save, type, leave, discard } = renderForm(field, null);

    type('1e1');
    leave();
    discard();

    expect(input).toHaveValue(null);
    expect(save).toBeEnabled();
  });
});

describe('SchemaField whole number written with a decimal point', () => {
  it.each(['5.0', '10.00'])('saves "%s" as a whole number', text => {
    const onChange = vi.fn();
    const { save, type } = renderForm(STARTERS_FIELD, 6, onChange);

    type(text);

    expect(onChange).toHaveBeenLastCalledWith(Number(text));
    expect(screen.queryByText(RANGE_ERROR)).not.toBeInTheDocument();
    expect(save).toBeEnabled();
  });
});

describe('SchemaField stored out-of-range value', () => {
  it('does not block Save after the field is cleared and left', () => {
    const { input, save, type, leave } = renderForm(STARTERS_FIELD, 12);

    type('');
    expect(save).toBeDisabled();
    leave();

    expect(input).toHaveValue(12);
    expect(save).toBeEnabled();
  });

  it('does not block Save once the edit is discarded back to it', () => {
    const { save, type, leave, discard } = renderForm(STARTERS_FIELD, 12);

    type('13');
    leave();
    discard();

    expect(screen.getByText(RANGE_ERROR)).toBeInTheDocument();
    expect(save).toBeEnabled();
  });
});
