import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { GuardrailsSection } from '@/components/SchemaForm';
import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const theme = createTheme(getDesignTokens('dark'));

const STARTERS_FIELD = {
  key: 'max_conversation_starters',
  type: 'integer',
  title: 'Max Chat Starters per Version',
  path: 'conversation_starters_guardrail.max_per_version',
  default: 4,
  minimum: 1,
  maximum: 10,
};

const RULES_FIELD = {
  key: 'publish_validation_rules',
  type: 'string',
  format: 'textarea',
  title: 'Publish Validation Rules',
  path: 'publishing_guardrail.publish_validation_rules',
  default: '',
  builtin_default: 'Built-in rules',
};

const renderSection = ({ fields, values, restoreToDefault }) => {
  const onChange = vi.fn();
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <GuardrailsSection
          fields={fields}
          values={values}
          restoreToDefault={restoreToDefault}
          onChange={onChange}
        />
      </ThemeProvider>
    </Provider>,
  );
  return onChange;
};

const restoreButton = key => screen.queryByLabelText(`restore-default-${key}`);

describe('restore to the schema default', () => {
  it('restores a numeric field to its schema default when the section opts in', async () => {
    const onChange = renderSection({
      fields: [STARTERS_FIELD],
      values: { max_conversation_starters: 7 },
      restoreToDefault: true,
    });

    expect(restoreButton('max_conversation_starters')).toBeEnabled();
    await userEvent.click(restoreButton('max_conversation_starters'));

    expect(onChange).toHaveBeenCalledWith('max_conversation_starters', 4);
  });

  it('disables the control when the value already equals the schema default', () => {
    renderSection({
      fields: [STARTERS_FIELD],
      values: { max_conversation_starters: 4 },
      restoreToDefault: true,
    });

    expect(restoreButton('max_conversation_starters')).toBeDisabled();
  });

  it('shows no control when the section does not opt in', () => {
    renderSection({ fields: [STARTERS_FIELD], values: { max_conversation_starters: 7 } });

    expect(restoreButton('max_conversation_starters')).not.toBeInTheDocument();
  });
});

describe('restore to the built-in default', () => {
  it('restores the built-in text, not the empty schema default', async () => {
    const onChange = renderSection({
      fields: [RULES_FIELD],
      values: { publish_validation_rules: 'Custom rules' },
      restoreToDefault: true,
    });

    await userEvent.click(restoreButton('publish_validation_rules'));

    expect(onChange).toHaveBeenCalledWith('publish_validation_rules', 'Built-in rules');
  });

  it('disables the control when the value already equals the built-in text', () => {
    renderSection({ fields: [RULES_FIELD], values: { publish_validation_rules: 'Built-in rules' } });

    expect(restoreButton('publish_validation_rules')).toBeDisabled();
  });
});
