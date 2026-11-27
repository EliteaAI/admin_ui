import { useCallback, useMemo, useState } from 'react';

import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ChatConfigurationSection } from '..';

const theme = createTheme(getDesignTokens('dark'));

const GUARDRAILS_FIELDS = [
  {
    key: 'next_input_suggestion_timeout_seconds',
    title: 'Next-input Suggestion Timeout',
    path: 'next_input_suggestion_guardrail.timeout_seconds',
    type: 'integer',
    section: 'guardrails',
    minimum: 1,
    maximum: 60,
  },
  {
    key: 'max_conversation_starters',
    title: 'Max Chat Starters per Version',
    path: 'conversation_starters_guardrail.max_per_version',
    description: 'Allowed range: 1–10.',
    type: 'integer',
    section: 'guardrails',
    minimum: 1,
    maximum: 10,
  },
];

const EMPTY_DRAFT = { values: {}, onChange: () => {} };

const Harness = ({ initialValues, onChange }) => {
  const [values, setValues] = useState(initialValues);
  const change = useCallback(
    (key, value) => {
      onChange(key, value);
      setValues(prev => ({ ...prev, [key]: value }));
    },
    [onChange],
  );
  const guardrailsDraft = useMemo(() => ({ values, onChange: change }), [values, change]);
  return (
    <ChatConfigurationSection
      voiceDraft={EMPTY_DRAFT}
      mentionsDraft={EMPTY_DRAFT}
      guardrailsDraft={guardrailsDraft}
      guardrailsFields={GUARDRAILS_FIELDS}
    />
  );
};

const setup = (initialValues = { max_conversation_starters: 4 }) => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Harness
          initialValues={initialValues}
          onChange={onChange}
        />
      </ThemeProvider>
    </Provider>,
  );
  return { onChange, user };
};

const blockHeader = title => screen.getByText(title).closest('[role="button"]');

describe('Chat Configuration — Chat Starters block', () => {
  it('shows a collapsed Chat Starters block with only the starters setting', () => {
    setup();

    const block = blockHeader('Chat Starters');
    expect(within(block).getByText('1 setting')).toBeInTheDocument();
    expect(block).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the saved limit with its 1–10 range and edits it through the guardrails draft', async () => {
    const { onChange, user } = setup();
    const header = blockHeader('Chat Starters');
    await user.click(header);

    // Every block stays mounted, so look inside the Chat Starters content only
    const content = document.getElementById(header.getAttribute('aria-controls'));
    expect(within(content).getByText('Max Chat Starters per Version')).toBeInTheDocument();
    const input = within(content).getByRole('spinbutton');
    expect(input.value).toBe('4');
    expect([input.min, input.max]).toEqual(['1', '10']);

    await user.clear(input);
    await user.type(input, '7');

    expect(onChange).toHaveBeenLastCalledWith('max_conversation_starters', 7);
  });
});
