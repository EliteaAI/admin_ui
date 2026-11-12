import { afterEach, describe, expect, it, vi } from 'vitest';

import AgentsTab from '@/pages/AgentEvaluationPage/components/AgentsTab';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  ITEMS_PATH,
  VIEW,
  fail,
  makeItem,
  makeJob,
  mockApi,
  ok,
  renderWithProviders,
} from './evalAutoTest.helpers';

const HISTORY_PATH = `${ITEMS_PATH}/4/21`;

const listOf = (items, total = items.length) => ok({ total, items, job: makeJob() });

const setup = async ({ items = [makeItem()], total, status = '', extra = {} } = {}) => {
  const onStatusChange = vi.fn();
  const calls = mockApi({ [`GET ${ITEMS_PATH}`]: listOf(items, total), ...extra });
  const user = userEvent.setup();
  renderWithProviders(
    <AgentsTab
      status={status}
      onStatusChange={onStatusChange}
    />,
    { permissions: [VIEW] },
  );
  await screen.findByTestId('eval-auto-agents');
  return { calls, user, onStatusChange };
};

const listCalls = calls => calls.filter(call => call.path === ITEMS_PATH);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the table', () => {
  it('shows each agent with its status, score, coverage and reason', async () => {
    await setup({
      items: [
        makeItem(),
        makeItem({
          id: 12,
          agent_name: 'Triage',
          status: 'not_evaluated',
          headline_score: null,
          coverage: null,
          reason_code: 'HITL_REQUIRED',
          reason_detail: '3 of 4 cases waited for a person',
        }),
      ],
    });

    const passed = await screen.findByTestId('eval-auto-agent-open-11');
    expect(passed).toHaveTextContent('Refund Desk');
    const chips = screen.getAllByTestId('eval-auto-status-chip');
    expect(chips.map(chip => chip.textContent)).toEqual(['Passed', 'Not Evaluated']);
    expect(screen.getByText('87.3')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByTitle('3 of 4 cases waited for a person')).toBeInTheDocument();
  });

  it('links each run to its evaluation history in EliteaUI, in a new tab', async () => {
    await setup({ items: [makeItem(), makeItem({ id: 12, eval_run_id: null })] });

    const link = await screen.findByTestId('eval-auto-run-link-11');
    expect(link).toHaveAttribute('href', '/app/4/agents/all/21/evaluate/history?run=41');
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.queryByTestId('eval-auto-run-link-12')).not.toBeInTheDocument();
  });

  it('asks for the first page of 20 with the status the overview picked', async () => {
    const { calls } = await setup({ status: 'failed' });

    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(0));
    expect(listCalls(calls).at(-1).params).toEqual({ status: 'failed', limit: '20', offset: '0' });
  });

  it('explains an empty list', async () => {
    await setup({ items: [] });

    expect(await screen.findByText('No agent has been evaluated on schedule yet.')).toBeInTheDocument();
  });

  it('says so when the list cannot be read', async () => {
    await setup({ extra: { [`GET ${ITEMS_PATH}`]: fail(500, { error: 'boom' }) } });

    expect(await screen.findByText('Failed to load the results.')).toBeInTheDocument();
  });
});

describe('filters', () => {
  it('reports a picked status to the page', async () => {
    const { user, onStatusChange } = await setup();

    await user.click(screen.getByTestId('eval-auto-status-filter'));
    await user.click(await screen.findByTestId('eval-auto-status-option-warning'));

    expect(onStatusChange).toHaveBeenCalledWith('warning');
  });

  it('sends the search term and the picked reason, back on the first page', async () => {
    const { calls, user } = await setup();

    await user.type(screen.getByTestId('eval-auto-search'), 'refund');
    await waitFor(() => expect(listCalls(calls).at(-1).params.search).toBe('refund'));

    await user.click(screen.getByTestId('eval-auto-reason-filter'));
    await user.click(await screen.findByTestId('eval-auto-reason-option-TIMEOUT'));
    await waitFor(() =>
      expect(listCalls(calls).at(-1).params).toEqual({
        search: 'refund',
        reason: 'TIMEOUT',
        limit: '20',
        offset: '0',
      }),
    );
  });

  it('sends a project id only once it is a positive integer', async () => {
    const { calls, user } = await setup();

    await user.type(screen.getByTestId('eval-auto-project-filter'), 'x');
    await waitFor(() => expect(listCalls(calls).at(-1).params.project_id).toBeUndefined());

    await user.clear(screen.getByTestId('eval-auto-project-filter'));
    await user.type(screen.getByTestId('eval-auto-project-filter'), '4');
    await waitFor(() => expect(listCalls(calls).at(-1).params.project_id).toBe('4'));
  });
});

describe('the history drawer', () => {
  it('opens one agent and lists its runs', async () => {
    const { user } = await setup({
      extra: {
        [`GET ${HISTORY_PATH}`]: ok({
          total: 2,
          rows: [makeItem({ id: 11 }), makeItem({ id: 9, job_id: 2, status: 'warning', coverage: 60 })],
        }),
      },
    });

    await user.click(await screen.findByTestId('eval-auto-agent-open-11'));

    const history = await screen.findByTestId('eval-auto-history');
    await within(history).findByTestId('eval-auto-history-9');
    expect(within(history).getByTestId('eval-auto-history-11')).toBeInTheDocument();
    expect(within(history).getByText('Warning')).toBeInTheDocument();
  });

  it('says how many results the drawer leaves out, and labels a run still in progress', async () => {
    const { user } = await setup({
      extra: {
        [`GET ${HISTORY_PATH}`]: ok({
          total: 35,
          rows: [makeItem({ id: 13, state: 'running', status: null, headline_score: null }), makeItem()],
        }),
      },
    });

    await user.click(await screen.findByTestId('eval-auto-agent-open-11'));

    expect(await screen.findByTestId('eval-auto-history-total')).toHaveTextContent(
      'Showing the latest 2 of 35 results.',
    );
    expect(screen.getByTestId('eval-auto-history-state-13')).toHaveTextContent('Running');

    await user.click(screen.getByTestId('eval-auto-history-close'));
    await waitFor(() => expect(screen.queryByTestId('eval-auto-history')).not.toBeInTheDocument());
  });

  it('says so when the agent has no history', async () => {
    const { user } = await setup({ extra: { [`GET ${HISTORY_PATH}`]: ok({ total: 0, rows: [] }) } });

    await user.click(await screen.findByTestId('eval-auto-agent-open-11'));

    expect(await screen.findByText('No scheduled evaluation yet.')).toBeInTheDocument();
  });
});
