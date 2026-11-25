import { afterEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@/constants/permissions.constants';
import OverviewTab from '@/pages/AgentEvaluationPage/components/OverviewTab';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  CONSENTS_PATH,
  ITEMS_PATH,
  RUN,
  SCHEDULES_PATH,
  SETTINGS_PATH,
  VIEW,
  fail,
  makeJob,
  mockApi,
  ok,
  renderWithProviders,
} from './evalAutoTest.helpers';

const TOTALS = { passed: 7, warning: 2, failed: 1, not_evaluated: 4 };
const MODE_TOTALS = { live: 11, history: 3 };
const CONSENTS = {
  total: 2,
  projects: [
    { project_id: 4, name: 'Support', in_scope: true },
    { project_id: 9, name: 'Sales', in_scope: false },
  ],
};

const setup = async ({
  permissions = [VIEW, RUN],
  job = makeJob(),
  schedule,
  consents = ok(CONSENTS),
  extra = {},
} = {}) => {
  const onOpenAgents = vi.fn();
  const calls = mockApi({
    [`GET ${ITEMS_PATH}`]: ({ params }) =>
      ok({ total: params.mode ? MODE_TOTALS[params.mode] : TOTALS[params.status], items: [], job }),
    [`GET ${SCHEDULES_PATH}`]: ok({ rows: schedule ? [schedule] : [] }),
    [`GET ${CONSENTS_PATH}`]: consents,
    ...extra,
  });
  const user = userEvent.setup();
  renderWithProviders(<OverviewTab onOpenAgents={onOpenAgents} />, { permissions });
  await screen.findByTestId('eval-auto-overview');
  return { calls, user, onOpenAgents };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('counters', () => {
  it('shows the total per status and opens the agents tab on click', async () => {
    const { user, onOpenAgents } = await setup();

    await waitFor(() => expect(screen.getByTestId('eval-auto-count-passed')).toHaveTextContent('7'));
    expect(screen.getByTestId('eval-auto-count-not_evaluated')).toHaveTextContent('4');

    await user.click(screen.getByTestId('eval-auto-count-failed'));
    expect(onOpenAgents).toHaveBeenCalledWith('failed');
  });

  it('describes the last job', async () => {
    await setup();

    await waitFor(() => expect(screen.getByTestId('eval-auto-last-job')).toHaveTextContent('Last job 3'));
    expect(screen.getByTestId('eval-auto-last-job')).toHaveTextContent(
      'queued 5, carried forward 2, deferred 1, blocked 3',
    );
  });

  it('says when no job has run', async () => {
    await setup({ job: null });

    expect(await screen.findByText('No job has run yet.')).toBeInTheDocument();
  });
});

describe('history evaluation', () => {
  it('counts the latest results per mode', async () => {
    await setup();

    await waitFor(() => expect(screen.getByTestId('eval-auto-mode-count-live')).toHaveTextContent('11'));
    expect(screen.getByTestId('eval-auto-mode-count-history')).toHaveTextContent('3');
    expect(screen.getByTestId('eval-auto-mode-count-history')).toHaveTextContent('History');
  });

  it('lists the projects that allow it, with whether each is in scope', async () => {
    await setup();

    expect(await screen.findByTestId('eval-auto-history-consent-4')).toHaveTextContent('Support');
    expect(screen.getByTestId('eval-auto-history-consent-4')).toHaveTextContent('In scope');
    expect(screen.getByTestId('eval-auto-history-consent-9')).toHaveTextContent('Out of scope');
  });

  it('says when no project allows it', async () => {
    await setup({ consents: ok({ total: 0, projects: [] }) });

    expect(await screen.findByTestId('eval-auto-history-consents-empty')).toBeInTheDocument();
  });

  it('says when the projects could not be loaded', async () => {
    await setup({ consents: fail(500, { error: 'boom' }) });

    expect(await screen.findByText('Could not load the projects.')).toBeInTheDocument();
  });
});

describe('the schedule', () => {
  it('shows whether the schedule is on, when it may read the schedules', async () => {
    await setup({
      permissions: [VIEW, PERMISSIONS.scheduling.view],
      schedule: { name: 'eval_auto_run', active: false, cron: '0 2 * * *', last_run: null },
    });

    expect(await screen.findByTestId('eval-auto-enabled-chip')).toHaveTextContent('Off');
    expect(screen.getByTestId('eval-auto-cron')).toHaveTextContent('The schedule is off');
  });

  it('links to Features → Schedules only with the runtime permission', async () => {
    await setup({ permissions: [VIEW, PERMISSIONS.runtime.plugins] });

    expect(screen.getByTestId('eval-auto-schedules-link')).toHaveAttribute(
      'href',
      '/features#agent_evaluation',
    );
  });

  it('asks for no schedules without the scheduling permission', async () => {
    const { calls } = await setup({ permissions: [VIEW] });

    expect(calls.some(call => call.path === SCHEDULES_PATH)).toBe(false);
    expect(screen.queryByTestId('eval-auto-schedules-link')).not.toBeInTheDocument();
  });
});

describe('run now', () => {
  it('is hidden without the run permission', async () => {
    await setup({ permissions: [VIEW] });

    expect(screen.queryByTestId('eval-auto-run-now')).not.toBeInTheDocument();
  });

  it('reports the started job', async () => {
    const { user } = await setup({
      extra: { [`POST ${SETTINGS_PATH}`]: ok({ started: true, job_id: 4, counters: { queued: 3 } }) },
    });

    await user.click(screen.getByTestId('eval-auto-run-now'));

    expect(await screen.findByTestId('eval-auto-notice')).toHaveTextContent(
      'Job 4 started: 3 agent(s) queued.',
    );
  });

  it('reports a job that is still running', async () => {
    const { user } = await setup({
      extra: { [`POST ${SETTINGS_PATH}`]: fail(409, { started: false, reason: 'job_running', job_id: 3 }) },
    });

    await user.click(screen.getByTestId('eval-auto-run-now'));

    expect(await screen.findByTestId('eval-auto-notice')).toHaveTextContent('Job 3 is still running.');
  });

  it('says the job may have started when the request times out', async () => {
    const { user } = await setup({
      extra: {
        [`POST ${SETTINGS_PATH}`]: fail(504, { ok: false, reason: 'timeout', job_may_have_started: true }),
      },
    });

    await user.click(screen.getByTestId('eval-auto-run-now'));

    expect(await screen.findByTestId('eval-auto-notice')).toHaveTextContent('the job may have started');
  });

  it('explains a refusal during maintenance', async () => {
    const { user } = await setup({
      extra: { [`POST ${SETTINGS_PATH}`]: fail(409, { started: false, reason: 'maintenance' }) },
    });

    await user.click(screen.getByTestId('eval-auto-run-now'));

    expect(await screen.findByTestId('eval-auto-notice')).toHaveTextContent('maintenance mode');
  });
});
