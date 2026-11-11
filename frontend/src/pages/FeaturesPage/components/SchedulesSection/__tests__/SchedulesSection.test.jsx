import { useCallback, useMemo, useState } from 'react';

import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { FEATURES_SECTIONS } from '@/pages/FeaturesPage/constants/features.constants';
import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SCHEDULES_CARDS } from '../constants/schedules.constants';

import { SchedulesSection } from '..';

const theme = createTheme(getDesignTokens('dark'));

const integerField = (key, title) => ({
  key,
  title,
  path: `scheduler.${key}`,
  description: `${title} description.`,
  type: 'integer',
  section: 'schedules',
  minimum: 1,
  maximum: 100,
});

const booleanField = (key, title) => ({
  key,
  title,
  path: `scheduler.${key}`,
  type: 'boolean',
  section: 'schedules',
});

const cronField = (key, title, switchKey) => ({
  key,
  title,
  path: `scheduler.${key}`,
  type: 'string',
  section: 'schedules',
  visible_when: { field: switchKey, value: true },
});

// Schema order differs from the display order on purpose
const SCHEDULES_FIELDS = [
  cronField('index_scheduling_cron', 'Index cron', 'index_scheduling_enabled'),
  booleanField('index_scheduling_enabled', 'Index schedules enabled'),
  booleanField('toolkit_index_scheduling_enabled', 'Toolkit index schedules enabled'),
  integerField('toolkit_index_min_interval_minutes', 'Toolkit index minimum interval'),
  booleanField('legacy_index_step_enabled', 'Legacy index step'),
  cronField('pipeline_scheduling_cron', 'Pipeline cron', 'pipeline_scheduling_enabled'),
  booleanField('pipeline_scheduling_enabled', 'Pipeline schedules enabled'),
  booleanField('agent_scheduling_enabled', 'Agent schedules enabled'),
  booleanField('schedules_legacy_step_enabled', 'Legacy pipeline step'),
  integerField('schedules_min_interval_minutes', 'Minimum interval'),
  integerField('schedules_max_enabled_per_project', 'Max enabled per project'),
  integerField('schedules_dispatch_cap', 'Dispatch cap'),
  integerField('schedules_stale_run_minutes', 'Stale run minutes'),
  integerField('schedules_max_parallel_runs', 'Max parallel runs'),
  integerField('schedules_approval_wait_hours', 'Approval wait hours'),
  integerField('schedules_webhook_max_concurrent_runs', 'Webhook concurrent runs'),
  integerField('schedules_webhook_max_concurrent_runs_limit', 'Webhook concurrent runs limit'),
  integerField('schedules_webhook_project_max_concurrent_runs', 'Webhook project concurrent runs'),
  integerField('schedules_webhook_max_waiting_runs', 'Webhook waiting runs'),
];

const SAVED_VALUES = {
  schedules_min_interval_minutes: 5,
  schedules_max_enabled_per_project: 50,
  schedules_dispatch_cap: 20,
  schedules_stale_run_minutes: 30,
  schedules_max_parallel_runs: 4,
  schedules_approval_wait_hours: 24,
  pipeline_scheduling_enabled: true,
  pipeline_scheduling_cron: '*/15 * * * *',
  index_scheduling_enabled: false,
  index_scheduling_cron: '0 * * * *',
};

const Harness = ({ initialValues, onChange }) => {
  const [values, setValues] = useState(initialValues);
  const change = useCallback(
    (key, value) => {
      onChange(key, value);
      setValues(prev => ({ ...prev, [key]: value }));
    },
    [onChange],
  );
  const schedulesDraft = useMemo(() => ({ values, onChange: change }), [values, change]);
  return (
    <SchedulesSection
      schedulesDraft={schedulesDraft}
      schedulesFields={SCHEDULES_FIELDS}
    />
  );
};

const setup = (initialValues = SAVED_VALUES) => {
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

describe('Schedules page', () => {
  it('sits directly after Skills Configuration in the Features navigation', () => {
    const ids = FEATURES_SECTIONS.map(section => section.id);
    const schedules = FEATURES_SECTIONS.find(section => section.id === 'schedules');

    expect(ids.indexOf('schedules')).toBe(ids.indexOf('skills') + 1);
    expect(schedules.title).toBe('Schedules');
    expect(schedules.backendSectionIds).toEqual(['schedules']);
  });

  it('shows five collapsed cards in order with their setting counts', () => {
    setup();

    const cards = [
      ['Schedule Settings', '6 settings'],
      ['Agent Schedules', '1 setting'],
      ['Pipeline Schedules', '3 settings'],
      ['Index Schedules', '5 settings'],
      ['Webhooks', '4 settings'],
    ];
    const headers = screen.getAllByRole('button');

    expect(headers.map(header => header.textContent)).toEqual(cards.map(([title, count]) => title + count));
    headers.forEach(header => expect(header).toHaveAttribute('aria-expanded', 'false'));
    expect(SCHEDULES_CARDS.map(card => card.title)).toEqual(cards.map(([title]) => title));
  });

  it('lists the schedule settings in display order with their saved values', async () => {
    const { user } = setup();
    await user.click(blockHeader('Schedule Settings'));

    const inputs = screen.getAllByRole('spinbutton').slice(0, 6);

    expect(inputs.map(input => input.value)).toEqual(['5', '50', '20', '30', '4', '24']);
    expect(screen.getByText('Minimum interval')).toBeInTheDocument();
  });

  it('keeps an edit when its card is collapsed and expanded again', async () => {
    const { onChange, user } = setup();
    await user.click(blockHeader('Schedule Settings'));

    const [interval] = screen.getAllByRole('spinbutton');
    await user.clear(interval);
    await user.type(interval, '30');
    await user.click(blockHeader('Schedule Settings'));
    await user.click(blockHeader('Schedule Settings'));

    expect(onChange).toHaveBeenLastCalledWith('schedules_min_interval_minutes', 30);
    expect(screen.getAllByRole('spinbutton')[0].value).toBe('30');
  });

  it('shows a cron field only while its switch is on', async () => {
    const { user } = setup();
    await user.click(blockHeader('Pipeline Schedules'));
    await user.click(blockHeader('Index Schedules'));

    expect(screen.getByDisplayValue('*/15 * * * *')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('0 * * * *')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('switch').at(-1));

    expect(screen.getByDisplayValue('0 * * * *')).toBeInTheDocument();
  });

  it('shows empty cards while the backend has not delivered the section yet', () => {
    render(
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <SchedulesSection
            schedulesDraft={{ values: {}, onChange: vi.fn() }}
            schedulesFields={[]}
          />
        </ThemeProvider>
      </Provider>,
    );

    expect(within(blockHeader('Webhooks')).getByText('0 settings')).toBeInTheDocument();
  });
});
