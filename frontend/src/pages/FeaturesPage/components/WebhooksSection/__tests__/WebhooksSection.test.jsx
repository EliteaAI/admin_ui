import { useCallback, useMemo, useState } from 'react';

import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { FEATURES_SECTIONS } from '@/pages/FeaturesPage/constants/features.constants';
import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WEBHOOKS_CARD } from '../constants/webhooks.constants';

import { WebhooksSection } from '..';

const theme = createTheme(getDesignTokens('dark'));

const integerField = (key, title) => ({
  key,
  title,
  path: `scheduler.${key}`,
  description: `${title} description.`,
  type: 'integer',
  section: 'webhooks',
  minimum: 1,
  maximum: 100,
});

// Schema order differs from the display order on purpose
const WEBHOOKS_FIELDS = [
  integerField('schedules_webhook_max_waiting_runs', 'Webhook waiting runs'),
  integerField('schedules_webhook_project_max_concurrent_runs', 'Webhook project concurrent runs'),
  integerField('schedules_webhook_max_concurrent_runs_limit', 'Webhook concurrent runs limit'),
  integerField('schedules_webhook_max_concurrent_runs', 'Webhook concurrent runs'),
];

const SAVED_VALUES = {
  schedules_webhook_max_concurrent_runs: 5,
  schedules_webhook_max_concurrent_runs_limit: 20,
  schedules_webhook_project_max_concurrent_runs: 3,
  schedules_webhook_max_waiting_runs: 10,
};

const Harness = ({ onChange }) => {
  const [values, setValues] = useState(SAVED_VALUES);
  const change = useCallback(
    (key, value) => {
      onChange(key, value);
      setValues(prev => ({ ...prev, [key]: value }));
    },
    [onChange],
  );
  const webhooksDraft = useMemo(() => ({ values, onChange: change }), [values, change]);
  return (
    <WebhooksSection
      webhooksDraft={webhooksDraft}
      webhooksFields={WEBHOOKS_FIELDS}
    />
  );
};

const renderWithProviders = ui =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </Provider>,
  );

const header = () => screen.getByText('Webhooks').closest('[role="button"]');

describe('Webhooks page', () => {
  it('sits directly after Schedules in the Features navigation', () => {
    const ids = FEATURES_SECTIONS.map(section => section.id);
    const webhooks = FEATURES_SECTIONS.find(section => section.id === 'webhooks');

    expect(ids.indexOf('webhooks')).toBe(ids.indexOf('schedules') + 1);
    expect(webhooks.title).toBe('Webhooks');
    expect(webhooks.backendSectionIds).toEqual(['webhooks']);
  });

  it('shows one collapsed Webhooks card with four settings', () => {
    renderWithProviders(<Harness onChange={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(header()).toHaveAttribute('aria-expanded', 'false');
    expect(within(header()).getByText('4 settings')).toBeInTheDocument();
    expect(WEBHOOKS_CARD.fieldKeys).toHaveLength(4);
  });

  it('lists the webhook settings in display order with their saved values', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={vi.fn()} />);
    await user.click(header());

    expect(screen.getAllByRole('spinbutton').map(input => input.value)).toEqual(['5', '20', '3', '10']);
  });

  it('reports an edit of a webhook setting', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<Harness onChange={onChange} />);
    await user.click(header());

    const [concurrent] = screen.getAllByRole('spinbutton');
    await user.clear(concurrent);
    await user.type(concurrent, '8');

    expect(onChange).toHaveBeenLastCalledWith('schedules_webhook_max_concurrent_runs', 8);
  });

  it('opens the card for a deep link to it', () => {
    renderWithProviders(
      <WebhooksSection
        webhooksDraft={{ values: SAVED_VALUES, onChange: vi.fn() }}
        webhooksFields={WEBHOOKS_FIELDS}
        initialBlock="webhooks"
      />,
    );

    expect(header()).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows an empty card while the backend has not delivered the section yet', () => {
    renderWithProviders(
      <WebhooksSection
        webhooksDraft={{ values: {}, onChange: vi.fn() }}
        webhooksFields={[]}
      />,
    );

    expect(within(header()).getByText('0 settings')).toBeInTheDocument();
  });
});
