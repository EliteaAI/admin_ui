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
  it('shows who each run acts as', async () => {
    await setup({ items: [makeItem(), makeItem({ id: 12, owner_id: null })] });

    expect(await screen.findByTestId('eval-auto-owner-11')).toHaveTextContent('2');
    expect(screen.getByTestId('eval-auto-owner-12')).toHaveTextContent('-');
  });

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

describe('the mode column', () => {
  it('labels a history result and sums up its turns on hover', async () => {
    await setup({
      items: [
        makeItem(),
        makeItem({
          id: 12,
          mode: 'history',
          history: { window_days: 28, sampled: 6, eligible: 9, conversations: 3, users: 2 },
        }),
      ],
    });

    expect(await screen.findByTestId('eval-auto-mode-11')).toHaveTextContent('Live');
    const history = screen.getByTestId('eval-auto-mode-12');
    expect(history).toHaveTextContent('History');
    expect(history).toHaveAttribute('title', '6 turns · 3 chats · 28 days');
    expect(screen.getByTestId('eval-auto-mode-summary-12')).toHaveTextContent('6 turns · 3 chats · 28 days');
  });

  it('sums up no turns for a hybrid result that fell back to live, or one without enough history', async () => {
    const history = { window_days: 28, sampled: 0, eligible: 2, conversations: 1, users: 1 };
    await setup({
      items: [
        makeItem({ id: 13, mode: 'live', history }),
        makeItem({ id: 14, mode: 'history', status: 'not_evaluated', reason_code: 'NO_TRAFFIC', history }),
      ],
    });

    expect(await screen.findByTestId('eval-auto-mode-13')).toHaveTextContent('Live');
    expect(screen.getByTestId('eval-auto-mode-13')).toHaveAttribute('title', '');
    expect(screen.queryByTestId('eval-auto-mode-summary-13')).not.toBeInTheDocument();
    expect(screen.getByTestId('eval-auto-mode-14')).toHaveTextContent('History');
    expect(screen.queryByTestId('eval-auto-mode-summary-14')).not.toBeInTheDocument();
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

  it('shows the mode of each run, with the turns a history run scored', async () => {
    const { user } = await setup({
      extra: {
        [`GET ${HISTORY_PATH}`]: ok({
          total: 2,
          rows: [
            makeItem({
              id: 13,
              mode: 'history',
              history: { window_days: 28, sampled: 6, eligible: 9, conversations: 3, users: 2 },
            }),
            makeItem(),
          ],
        }),
      },
    });

    await user.click(await screen.findByTestId('eval-auto-agent-open-11'));

    expect(await screen.findByTestId('eval-auto-history-mode-13')).toHaveTextContent(
      'History · 6 turns · 3 chats · 28 days',
    );
    expect(screen.getByTestId('eval-auto-history-mode-11')).toHaveTextContent(/^Live$/);
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
