import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@/constants/permissions.constants';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { getCurrentPeriod, getPeriodOptions } from '@/pages/BudgetsPage/helpers/budgetPeriod.helpers';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockApi, ok, renderWithProviders } from '../../GovernancePage/__tests__/governanceTest.helpers';

// The workbook writer needs a browser download; what matters here is what it is handed
const exportToExcel = vi.hoisted(() => vi.fn());
vi.mock('@/helpers/exportToExcel.helpers', () => ({ exportToExcel }));

const LIST_PATH = '/elitea_core/project_budgets/administration';

const [CURRENT, LAST] = getPeriodOptions().map(option => option.value);

const EDIT = [PERMISSIONS.budgets.view, PERMISSIONS.budgets.edit];

const makeRow = (overrides = {}) => ({
  project_id: 1,
  name: 'alpha',
  display_name: 'alpha',
  is_personal: false,
  monthly_limit: 50,
  effective_limit: 50,
  limit_source: 'explicit',
  currency: 'USD',
  enabled: true,
  spend: 12.5,
  spend_available: true,
  percent_used: 25,
  ...overrides,
});

// What the endpoint returns for a finished month: spend only, none of the limit fields
const makePastRow = (overrides = {}) => ({
  project_id: 1,
  name: 'alpha',
  display_name: 'alpha',
  is_personal: false,
  currency: 'USD',
  spend: 7,
  spend_available: true,
  ...overrides,
});

// Answers the list for whichever month was asked for, like the real endpoint
const listFor =
  rowsByPeriod =>
  ({ params }) => {
    const period = params.period || CURRENT;
    const rows = rowsByPeriod[period] ?? [];

    return ok({
      rows,
      total: rows.length,
      counts: { team: rows.length, personal: 0 },
      period,
      period_start: `${period.slice(0, 4)}-${period.slice(4)}-01`,
      period_end: `${period.slice(0, 4)}-${period.slice(4)}-28`,
      is_current: period === getCurrentPeriod(),
    });
  };

const lists = calls => calls.filter(call => call.method === 'GET' && call.path === LIST_PATH);

// The table is a CSS grid of divs, so a row is the nearest ancestor holding all of its cells
const rowOf = name => {
  let node = screen.getByText(name);

  while (node && !within(node).queryAllByText(/\$\d|Unlimited|Not available/).length) {
    node = node.parentElement;
  }

  return node;
};

const pickMonth = async (user, period) => {
  await user.click(screen.getByTestId('budgets-period-select'));
  await user.click(await screen.findByTestId(`budgets-period-${period}`));
};

beforeEach(() => {
  exportToExcel.mockReset();
  exportToExcel.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('month selector', () => {
  it('opens on the current month and asks the API for it', async () => {
    const calls = mockApi({ [`GET ${LIST_PATH}`]: listFor({ [CURRENT]: [makeRow()] }) });
    renderWithProviders(<BudgetsPage />, { permissions: EDIT, route: '/budgets' });

    await screen.findByText('alpha');

    expect(lists(calls)[0].params.period).toBe(CURRENT);
  });

  it('offers the current month plus three previous, newest first, with the current one tagged', async () => {
    const user = userEvent.setup();
    mockApi({ [`GET ${LIST_PATH}`]: listFor({ [CURRENT]: [makeRow()] }) });
    renderWithProviders(<BudgetsPage />, { permissions: EDIT, route: '/budgets' });
    await screen.findByText('alpha');

    await user.click(screen.getByTestId('budgets-period-select'));

    const options = getPeriodOptions();
    const items = await screen.findAllByTestId(/^budgets-period-\d{6}$/);
    expect(items).toHaveLength(4);
    expect(items.map(item => item.dataset.testid)).toEqual(
      options.map(option => `budgets-period-${option.value}`),
    );
    expect(within(items[0]).getByText(/· current/)).toBeInTheDocument();
    expect(within(items[1]).queryByText(/· current/)).not.toBeInTheDocument();
  });

  it('reloads the table for the chosen month and keeps it across a tab switch and a refresh', async () => {
    const user = userEvent.setup();
    const calls = mockApi({
      [`GET ${LIST_PATH}`]: listFor({
        [CURRENT]: [makeRow({ name: 'current-project' })],
        [LAST]: [makePastRow({ name: 'last-month-project' })],
      }),
    });
    renderWithProviders(<BudgetsPage />, { permissions: EDIT, route: '/budgets' });
    await screen.findByText('current-project');

    await pickMonth(user, LAST);
    await screen.findByText('last-month-project');
    expect(lists(calls).at(-1).params.period).toBe(LAST);
    expect(lists(calls).at(-1).params.offset).toBe('0');

    await user.click(screen.getByRole('tab', { name: /Personal Projects/ }));
    await waitFor(() => expect(lists(calls).at(-1).params.project_type).toBe('personal'));
    expect(lists(calls).at(-1).params.period).toBe(LAST);

    await user.click(screen.getByRole('tab', { name: /Team Projects/ }));
    // Refresh is disabled while a load is in flight, so wait for the tab switch to settle
    const refresh = () => screen.getByTestId('RefreshOutlinedIcon').closest('button');
    await waitFor(() => expect(refresh()).toBeEnabled());
    const before = lists(calls).length;
    await user.click(refresh());
    await waitFor(() => expect(lists(calls).length).toBeGreaterThan(before));
    expect(lists(calls).at(-1).params.period).toBe(LAST);
  });

  it("does not show the previous month's rows as the new month's while loading", async () => {
    const user = userEvent.setup();
    let release;
    const gate = new Promise(resolve => {
      release = resolve;
    });
    const handler = listFor({
      [CURRENT]: [makeRow({ name: 'current-project' })],
      [LAST]: [makeRow({ name: 'last-month-project' })],
    });
    mockApi({
      [`GET ${LIST_PATH}`]: args =>
        args.params.period === LAST ? gate.then(() => handler(args)) : handler(args),
    });
    renderWithProviders(<BudgetsPage />, { permissions: EDIT, route: '/budgets' });
    await screen.findByText('current-project');

    await pickMonth(user, LAST);

    await waitFor(() => expect(screen.queryByText('current-project')).not.toBeInTheDocument());
    expect(screen.getByTestId('budgets-export')).toBeDisabled();
    release();
  });
});

describe('historical months', () => {
  it('are read-only, with the explanation, while the current month stays editable', async () => {
    const user = userEvent.setup();
    mockApi({
      [`GET ${LIST_PATH}`]: listFor({ [CURRENT]: [makeRow()], [LAST]: [makePastRow()] }),
    });
    renderWithProviders(<BudgetsPage />, { permissions: EDIT, route: '/budgets' });
    await screen.findByText('alpha');

    const editButton = () => screen.getByTestId('EditOutlinedIcon').closest('button');
    expect(editButton()).toBeEnabled();

    await pickMonth(user, LAST);
    await screen.findByText('alpha');

    await waitFor(() => expect(editButton()).toBeDisabled());
    expect(screen.getByTestId('PeopleOutlineIcon').closest('button')).toBeDisabled();
    await user.hover(editButton().parentElement);
    expect(
      await screen.findByText(
        'Historical budgets are read-only. Select the current month to update budget limits.',
      ),
    ).toBeInTheDocument();
  });

  it('show spend only: no Limit, Used or Source column, while the current month keeps them', async () => {
    const user = userEvent.setup();
    mockApi({
      [`GET ${LIST_PATH}`]: listFor({ [CURRENT]: [makeRow()], [LAST]: [makePastRow()] }),
    });
    renderWithProviders(<BudgetsPage />, { permissions: EDIT, route: '/budgets' });
    await screen.findByText('alpha');
    // Source is hidden below 1100px wide, which is narrower than the test window
    for (const label of ['Limit', 'Spent', 'Used']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    await pickMonth(user, LAST);

    // The table is a skeleton while the month loads, so wait for the new rows before reading headers
    expect(await screen.findByText('$7.00')).toBeInTheDocument();
    expect(screen.getByText('Spent')).toBeInTheDocument();
    expect(screen.queryByText('Limit')).not.toBeInTheDocument();
    expect(screen.queryByText('Used')).not.toBeInTheDocument();
    expect(screen.queryByText('Source')).not.toBeInTheDocument();
    expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();

    await pickMonth(user, CURRENT);
    expect(await screen.findByText('Limit')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  it('keep real spend and a real zero distinct from a month that could not be read', async () => {
    const user = userEvent.setup();
    mockApi({
      [`GET ${LIST_PATH}`]: listFor({
        [CURRENT]: [makeRow()],
        [LAST]: [
          makePastRow({ name: 'spent-some', spend: 7 }),
          makePastRow({ project_id: 2, name: 'spent-nothing', spend: 0 }),
          makePastRow({ project_id: 3, name: 'unreadable', spend: null, spend_available: false }),
        ],
      }),
    });
    renderWithProviders(<BudgetsPage />, { permissions: EDIT, route: '/budgets' });
    await screen.findByText('alpha');

    await pickMonth(user, LAST);
    await screen.findByText('spent-some');

    expect(within(rowOf('spent-some')).getByText('$7.00')).toBeInTheDocument();
    expect(within(rowOf('spent-nothing')).getByText('$0.00')).toBeInTheDocument();
    expect(within(rowOf('unreadable')).getByText('Not available')).toBeInTheDocument();
    expect(within(rowOf('unreadable')).queryByText('$0.00')).not.toBeInTheDocument();
  });
});

describe('export to Excel', () => {
  const setup = async rowsByPeriod => {
    const user = userEvent.setup();
    const calls = mockApi({ [`GET ${LIST_PATH}`]: listFor(rowsByPeriod) });
    renderWithProviders(<BudgetsPage />, { permissions: EDIT, route: '/budgets' });
    await screen.findByText('alpha');

    return { user, calls };
  };

  it('exports the selected month for both project types, with the month in the file name', async () => {
    const { user, calls } = await setup({ [CURRENT]: [makeRow()], [LAST]: [makePastRow()] });
    await pickMonth(user, LAST);
    await screen.findByText('alpha');
    await waitFor(() => expect(screen.getByTestId('budgets-export')).toBeEnabled());
    const before = lists(calls).length;

    await user.click(screen.getByTestId('budgets-export'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalledTimes(1));
    const exportCalls = lists(calls).slice(before);
    expect(exportCalls.length).toBeGreaterThanOrEqual(2);
    expect(exportCalls.every(call => call.params.period === LAST)).toBe(true);
    expect(new Set(exportCalls.map(call => call.params.project_type))).toEqual(new Set(['team', 'personal']));

    const [fileName, sheets] = exportToExcel.mock.calls[0];
    expect(fileName).toBe(`elitea-budgets-${LAST.slice(0, 4)}-${LAST.slice(4)}.xlsx`);
    expect(sheets.map(sheet => sheet.sheetName)).toEqual(['Team Projects', 'Personal Projects']);
  });

  it('exports every record, not the visible page', async () => {
    const rows = [1, 2, 3].map(id => makeRow({ project_id: id, name: id === 1 ? 'alpha' : `project-${id}` }));
    const { user, calls } = await setup({ [CURRENT]: rows });
    const before = lists(calls).length;

    await user.click(screen.getByTestId('budgets-export'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalled());
    // A probe for the total (limit 1), then one request for all of it from the start
    const full = lists(calls)
      .slice(before)
      .filter(call => call.params.limit === '3');
    expect(full.length).toBeGreaterThan(0);
    expect(full.every(call => call.params.offset === '0')).toBe(true);
    expect(exportToExcel.mock.calls[0][1][0].rows).toHaveLength(3);
  });

  it('stamps the reporting month and range on every row, and keeps the existing columns first', async () => {
    const { user } = await setup({ [CURRENT]: [makeRow()] });

    await user.click(screen.getByTestId('budgets-export'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalled());
    const [, sheets] = exportToExcel.mock.calls[0];
    const team = sheets[0];
    const headers = team.columns.map(column => column.header);
    expect(headers.slice(0, 6)).toEqual(['Name', 'ID', 'Limit (USD)', 'Spent (USD)', 'Used (%)', 'Source']);
    expect(headers.slice(-2)).toEqual(['Reporting month', 'Date range']);
    expect(team.rows[0].reporting_month).toBe(`${CURRENT.slice(0, 4)}-${CURRENT.slice(4)}`);
    expect(team.rows[0].reporting_range).toContain(' – ');
  });

  it('exports spend only for a finished month, with the month and range after it', async () => {
    const { user } = await setup({ [CURRENT]: [makeRow()], [LAST]: [makePastRow()] });
    await pickMonth(user, LAST);
    await screen.findByText('$7.00');
    await waitFor(() => expect(screen.getByTestId('budgets-export')).toBeEnabled());

    await user.click(screen.getByTestId('budgets-export'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalled());
    const [, sheets] = exportToExcel.mock.calls[0];
    for (const sheet of sheets) {
      const headers = sheet.columns.map(column => column.header);
      expect(headers).not.toContain('Limit (USD)');
      expect(headers).not.toContain('Used (%)');
      expect(headers).not.toContain('Source');
      expect(headers).toContain('Spent (USD)');
      expect(headers.slice(-2)).toEqual(['Reporting month', 'Date range']);
    }
  });

  it('writes a month whose spend could not be read as Not available, not as 0', async () => {
    const { user } = await setup({
      [CURRENT]: [makeRow()],
      [LAST]: [makePastRow({ spend: null, spend_available: false })],
    });
    await pickMonth(user, LAST);
    await screen.findAllByText('Not available');
    await waitFor(() => expect(screen.getByTestId('budgets-export')).toBeEnabled());

    await user.click(screen.getByTestId('budgets-export'));

    await waitFor(() => expect(exportToExcel).toHaveBeenCalled());
    const [, sheets] = exportToExcel.mock.calls[0];
    const row = sheets[0].rows[0];
    const spent = sheets[0].columns.find(column => column.key === 'spend');
    expect(spent.transform(row.spend, row)).toBe('Not available');
  });
});
