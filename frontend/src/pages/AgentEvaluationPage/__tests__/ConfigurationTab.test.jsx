import { afterEach, describe, expect, it, vi } from 'vitest';

import ConfigurationTab from '@/pages/AgentEvaluationPage/components/ConfigurationTab';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DATASET_PATH,
  EDIT,
  SETTINGS_PATH,
  VIEW,
  fail,
  makeDataset,
  makeSettings,
  mockApi,
  ok,
  renderWithProviders,
} from './evalAutoTest.helpers';

const setup = async (settings = makeSettings(), { permissions = [VIEW, EDIT], put } = {}) => {
  const calls = mockApi({
    [`GET ${SETTINGS_PATH}`]: ok(settings),
    [`GET ${DATASET_PATH}`]: ok(makeDataset()),
    [`PUT ${SETTINGS_PATH}`]: put ?? (({ body }) => ok({ ...settings, ...body })),
  });
  const user = userEvent.setup();
  renderWithProviders(<ConfigurationTab />, { permissions });
  await screen.findByTestId('eval-auto-field-max_agents_per_job');
  return { calls, user };
};

const putCalls = calls => calls.filter(call => call.method === 'PUT');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('permission gating', () => {
  it('renders read-only without the edit permission: disabled fields, no Save', async () => {
    await setup(makeSettings(), { permissions: [VIEW] });

    expect(screen.getByTestId('eval-auto-field-max_agents_per_job')).toBeDisabled();
    expect(screen.getByTestId('eval-auto-include-personal')).toBeDisabled();
    expect(screen.queryByTestId('eval-auto-settings-save')).not.toBeInTheDocument();
    expect(screen.getByTestId('eval-auto-read-only')).toBeInTheDocument();
  });

  it('enables the form with the edit permission, Save off until something changes', async () => {
    await setup();

    expect(screen.getByTestId('eval-auto-field-max_agents_per_job')).toBeEnabled();
    expect(screen.getByTestId('eval-auto-settings-save')).toBeDisabled();
  });
});

describe('default dataset', () => {
  it('shows the platform probes below the settings', async () => {
    await setup();

    expect(screen.getByTestId('eval-auto-default-dataset')).toBeInTheDocument();
    expect(await screen.findByTestId('eval-auto-probe-0')).toHaveValue(makeDataset().probes[0]);
  });
});

describe('loading the form', () => {
  it('shows the stored values, the listed projects and the window', async () => {
    await setup(
      makeSettings({
        project_scope_mode: 'allow',
        project_ids: [4, 12],
        window: { start: '22:00', end: '06:00' },
      }),
    );

    expect(screen.getByTestId('eval-auto-field-max_cases_per_agent')).toHaveValue(10);
    expect(screen.getByTestId('eval-auto-project-ids')).toHaveValue('4, 12');
    expect(screen.getByTestId('eval-auto-window-start')).toHaveValue('22:00');
    expect(screen.getByTestId('eval-auto-window-end')).toHaveValue('06:00');
  });

  it('hides the project list while the scope is all projects', async () => {
    await setup();

    expect(screen.queryByTestId('eval-auto-project-ids')).not.toBeInTheDocument();
  });

  it('says so when the settings cannot be read', async () => {
    mockApi({ [`GET ${SETTINGS_PATH}`]: fail(500, { error: 'boom' }) });
    renderWithProviders(<ConfigurationTab />, { permissions: [VIEW] });

    expect(await screen.findByText('Failed to load the settings.')).toBeInTheDocument();
  });
});

describe('saving', () => {
  it('sends only the changed keys', async () => {
    const { calls, user } = await setup();

    const field = screen.getByTestId('eval-auto-field-max_cases_per_agent');
    await user.clear(field);
    await user.type(field, '25');
    await user.click(screen.getByTestId('eval-auto-settings-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).toEqual({ max_cases_per_agent: 25 });
    expect(await screen.findByTestId('eval-auto-settings-notice')).toHaveTextContent('Settings saved.');
  });

  it('shows the value the server stored after it clamps one', async () => {
    const { user } = await setup(makeSettings(), {
      put: () => ok(makeSettings({ max_concurrent_runs: 50 })),
    });

    const field = screen.getByTestId('eval-auto-field-max_concurrent_runs');
    await user.clear(field);
    await user.type(field, '999');
    await user.click(screen.getByTestId('eval-auto-settings-save'));

    await waitFor(() => expect(field).toHaveValue(50));
  });

  it('does not send 0 for a cleared number field', async () => {
    await setup();

    await userEvent.clear(screen.getByTestId('eval-auto-field-max_cases_per_agent'));

    expect(screen.getByTestId('eval-auto-settings-save')).toBeDisabled();
  });

  it('sends the parsed project ids with the scope', async () => {
    const { calls, user } = await setup();

    await user.click(screen.getByTestId('eval-auto-scope'));
    await user.click(await screen.findByTestId('eval-auto-scope-deny'));
    await user.type(screen.getByTestId('eval-auto-project-ids'), '12, 4, x, 4');
    await user.click(screen.getByTestId('eval-auto-settings-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).toEqual({ project_scope_mode: 'deny', project_ids: [4, 12] });
  });

  it('blocks Save on a half-set window and sends a full one', async () => {
    const { calls, user } = await setup();

    fireEvent.change(screen.getByTestId('eval-auto-window-start'), { target: { value: '22:00' } });
    expect(screen.getByText('Set both ends, or neither')).toBeInTheDocument();
    expect(screen.getByTestId('eval-auto-settings-save')).toBeDisabled();

    fireEvent.change(screen.getByTestId('eval-auto-window-end'), { target: { value: '06:00' } });
    await user.click(screen.getByTestId('eval-auto-settings-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).toEqual({ window: { start: '22:00', end: '06:00' } });
  });

  it('shows the server error and keeps the draft', async () => {
    const { user } = await setup(makeSettings(), {
      put: () => fail(400, { ok: false, error: 'body must be a JSON object' }),
    });

    await user.click(screen.getByTestId('eval-auto-include-personal'));
    await user.click(screen.getByTestId('eval-auto-settings-save'));

    expect(await screen.findByTestId('eval-auto-settings-notice')).toHaveTextContent(
      'body must be a JSON object',
    );
    expect(screen.getByTestId('eval-auto-include-personal')).toBeChecked();
  });

  it('discards the draft', async () => {
    const { user } = await setup();

    await user.click(screen.getByTestId('eval-auto-include-personal'));
    await user.click(screen.getByTestId('eval-auto-settings-reset'));

    expect(screen.getByTestId('eval-auto-include-personal')).not.toBeChecked();
    expect(screen.getByTestId('eval-auto-settings-save')).toBeDisabled();
  });
});

describe('evaluation mode', () => {
  it('hides the history settings in live mode', async () => {
    await setup();

    expect(screen.getByTestId('eval-auto-mode')).toHaveTextContent('Live');
    expect(screen.queryByTestId('eval-auto-history-consent-note')).not.toBeInTheDocument();
    expect(screen.queryByTestId('eval-auto-field-history_window_days')).not.toBeInTheDocument();
  });

  it('shows the consent note and the history settings once hybrid is picked, and saves them', async () => {
    const { calls, user } = await setup();

    await user.click(screen.getByTestId('eval-auto-mode'));
    await user.click(await screen.findByTestId('eval-auto-mode-hybrid'));

    expect(screen.getByTestId('eval-auto-history-consent-note')).toBeInTheDocument();
    const field = screen.getByTestId('eval-auto-field-history_min_turns');
    expect(field).toHaveValue(3);

    await user.clear(field);
    await user.type(field, '5');
    await user.click(screen.getByTestId('eval-auto-settings-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).toEqual({ mode: 'hybrid', history_min_turns: 5 });
  });

  it('renders settings saved before history existed and sends no history keys', async () => {
    const legacy = Object.fromEntries(
      Object.entries(makeSettings()).filter(([key]) => key !== 'mode' && !key.includes('history')),
    );
    const { calls, user } = await setup(legacy);

    expect(screen.getByTestId('eval-auto-mode')).toHaveTextContent('Live');
    const field = screen.getByTestId('eval-auto-field-max_agents_per_job');
    await user.clear(field);
    await user.type(field, '7');
    await user.click(screen.getByTestId('eval-auto-settings-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).toEqual({ max_agents_per_job: 7 });
  });

  it('hints that the minimum turns cannot exceed the maximum', async () => {
    await setup(makeSettings({ mode: 'history' }));

    expect(screen.getByText('1 – max turns per agent')).toBeInTheDocument();
  });

  it('drops a history edit made before switching back to live', async () => {
    const { calls, user } = await setup();

    await user.click(screen.getByTestId('eval-auto-mode'));
    await user.click(await screen.findByTestId('eval-auto-mode-hybrid'));
    const field = screen.getByTestId('eval-auto-field-history_min_turns');
    await user.clear(field);
    await user.type(field, '5');
    await user.click(screen.getByTestId('eval-auto-mode'));
    await user.click(await screen.findByTestId('eval-auto-mode-live'));

    expect(screen.getByTestId('eval-auto-settings-save')).toBeDisabled();
    expect(calls.some(call => call.method === 'PUT')).toBe(false);
  });

  it('says when the minimum turns will be lowered to the maximum', async () => {
    const { user } = await setup(makeSettings({ mode: 'history' }));

    const field = screen.getByTestId('eval-auto-field-history_min_turns');
    await user.clear(field);
    await user.type(field, '40');

    expect(screen.getByText(/Will be saved as 10/)).toBeInTheDocument();
  });

  it('loads a stored history mode with its version and sampling', async () => {
    await setup(makeSettings({ mode: 'history', history_version: 'any', history_strategy: 'recent' }));

    expect(screen.getByTestId('eval-auto-history-consent-note')).toBeInTheDocument();
    expect(screen.getByTestId('eval-auto-history-version')).toHaveTextContent('Any version');
    expect(screen.getByTestId('eval-auto-history-strategy')).toHaveTextContent('Most recent first');
  });
});
