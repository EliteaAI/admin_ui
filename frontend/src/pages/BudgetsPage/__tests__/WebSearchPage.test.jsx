import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@/constants/permissions.constants';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { getCurrentPeriod, getPeriodOptions } from '@/pages/BudgetsPage/helpers/budgetPeriod.helpers';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockApi, ok, renderWithProviders } from '../../GovernancePage/__tests__/governanceTest.helpers';

// #7547: the Web Search page is the Budgets page for one Tool Spend feature, so it gets the same
// month selector, a spend-only past month, and the same export rules
const exportToExcel = vi.hoisted(() => vi.fn());
vi.mock('@/helpers/exportToExcel.helpers', () => ({ exportToExcel }));

const LIST_PATH = '/elitea_core/project_budgets/administration';
const FEATURE = 'web_search';
const READ_ONLY = 'Historical data is read-only. Select the current month to update Web Search settings.';

const [CURRENT, LAST] = getPeriodOptions().map(option => option.value);

const EDIT = [PERMISSIONS.budgets.view, PERMISSIONS.budgets.edit];

// A current Web Search row carries the feature's own switch next to the limit fields
const makeRow = (overrides = {}) => ({
  project_id: 1,
  name: 'alpha',
  display_name: 'alpha',
  is_personal: false,
  monthly_limit: 20,
  effective_limit: 20,
  limit_source: 'explicit',
  currency: 'USD',
  enabled: true,
  feature: FEATURE,
  feature_enabled: true,
  spend: 3.5,
  spend_available: true,
  percent_used: 17.5,
  ...overrides,
});

// A finished month: spend only, no limit and no configuration
const makePastRow = (overrides = {}) => ({
  project_id: 1,
  name: 'alpha',
  display_name: 'alpha',
  is_personal: false,
  currency: 'USD',
  spend: 2,
  spend_available: true,
  ...overrides,
});

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

const setup = async rowsByPeriod => {
  const user = userEvent.setup();
  const calls = mockApi({ [`GET ${LIST_PATH}`]: listFor(rowsByPeriod) });
  renderWithProviders(
    <BudgetsPage
      feature={FEATURE}
      featureLabel="Web search"
    />,
    { permissions: EDIT, route: '/tool-spend/web_search' },
  );
  await screen.findByText('alpha');

  return { user, calls };
};

beforeEach(() => {
  exportToExcel.mockReset();
  exportToExcel.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Web Search month selector', () => {
  it('opens on the current month and asks for it, with the feature on every request', async () => {
    const { calls } = await setup({ [CURRENT]: [makeRow()] });

    expect(lists(calls)[0].params).toMatchObject({ period: CURRENT, feature: FEATURE });
  });

  it('lists the current month and three before it, with the footer from the ticket', async () => {
    const { user } = await setup({ [CURRENT]: [makeRow()] });

    await user.click(screen.getByTestId('budgets-period-select'));

    const items = await screen.findAllByTestId(/^budgets-period-\d{6}$/);
    expect(items).toHaveLength(4);
    expect(within(items[0]).getByText(/· current/)).toBeInTheDocument();
    expect(screen.getByText('Current month and the three before it.')).toBeInTheDocument();
  });

  it('keeps the chosen month across a tab switch, for the feature, and resets to the first page', async () => {
    const { user, calls } = await setup({
      [CURRENT]: [makeRow()],
      [LAST]: [makePastRow({ name: 'last-month-project' })],
    });

    await pickMonth(user, LAST);
    await screen.findByText('last-month-project');
    expect(lists(calls).at(-1).params).toMatchObject({ period: LAST, feature: FEATURE, offset: '0' });

    await user.click(screen.getByRole('tab', { name: /Personal Projects/ }));
    await waitFor(() => expect(lists(calls).at(-1).params.project_type).toBe('personal'));
    expect(lists(calls).at(-1).params).toMatchObject({ period: LAST, feature: FEATURE });
  });
});

describe('Web Search table', () => {
  it('shows every column and the editing actions for the current month', async () => {
    await setup({ [CURRENT]: [makeRow()] });

    for (const label of ['Enabled', 'Limit', 'Spent', 'Used']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByTestId('EditOutlinedIcon').closest('button')).toBeEnabled();
  });

  it('shows Name, ID and Spent for a past month: no Enabled, Limit, Used or Source', async () => {
    const { user } = await setup({ [CURRENT]: [makeRow()], [LAST]: [makePastRow()] });

    await pickMonth(user, LAST);

    expect(await screen.findByText('$2.00')).toBeInTheDocument();
    for (const label of ['Name', 'ID', 'Spent', 'Actions']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    for (const label of ['Enabled', 'Limit', 'Used', 'Source']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
    expect(screen.queryByText('Unlimited')).not.toBeInTheDocument();
  });

  it('disables the actions of a past month with the ticket tooltip, and the current month restores them', async () => {
    const { user } = await setup({ [CURRENT]: [makeRow()], [LAST]: [makePastRow()] });
    const editButton = () => screen.getByTestId('EditOutlinedIcon').closest('button');

    await pickMonth(user, LAST);
    await screen.findByText('$2.00');
    await waitFor(() => expect(editButton()).toBeDisabled());
    await user.hover(editButton().parentElement);
    expect(await screen.findByText(READ_ONLY)).toBeInTheDocument();

    await pickMonth(user, CURRENT);
    expect(await screen.findByText('Enabled')).toBeInTheDocument();
    await waitFor(() => expect(editButton()).toBeEnabled());
  });

  it('keeps real spend, a real zero and an unreadable month apart', async () => {
    const { user } = await setup({
      [CURRENT]: [makeRow()],
      [LAST]: [
        makePastRow({ name: 'spent-some', spend: 2 }),
        makePastRow({ project_id: 2, name: 'spent-nothing', spend: 0 }),
        makePastRow({ project_id: 3, name: 'unreadable', spend: null, spend_available: false }),
      ],
    });

    await pickMonth(user, LAST);
    await screen.findByText('spent-some');

    expect(within(rowOf('spent-some')).getByText('$2.00')).toBeInTheDocument();
    expect(within(rowOf('spent-nothing')).getByText('$0.00')).toBeInTheDocument();
    expect(within(rowOf('unreadable')).getByText('Not available')).toBeInTheDocument();
    expect(within(rowOf('unreadable')).queryByText('$0.00')).not.toBeInTheDocument();
  });

  it("does not show the previous month's rows as the new month's while loading", async () => {
    const user = userEvent.setup();
    let release;
    const gate = new Promise(resolve => {
      release = resolve;
    });
    const handler = listFor({
      [CURRENT]: [makeRow({ name: 'current-project' })],
      [LAST]: [makePastRow({ name: 'last-month-project' })],
    });
    const calls = mockApi({
      [`GET ${LIST_PATH}`]: args =>
        args.params.period === LAST ? gate.then(() => handler(args)) : handler(args),
    });
    renderWithProviders(
      <BudgetsPage
        feature={FEATURE}
        featureLabel="Web search"
      />,
      { permissions: EDIT, route: '/tool-spend/web_search' },
    );
    await screen.findByText('current-project');

    await pickMonth(user, LAST);

    await waitFor(() => expect(lists(calls).at(-1).params.period).toBe(LAST));
    await waitFor(() => expect(screen.queryByText('current-project')).not.toBeInTheDocument());
    expect(screen.queryByText('last-month-project')).not.toBeInTheDocument();
    expect(screen.getByTestId('budgets-export')).toBeDisabled();

    release();

    expect(await screen.findByText('last-month-project')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('budgets-export')).toBeEnabled());
  });
});

describe('Web Search export', () => {
  const exportNow = async user => {
    await waitFor(() => expect(screen.getByTestId('budgets-export')).toBeEnabled());
    await user.click(screen.getByTestId('budgets-export'));
    await waitFor(() => expect(exportToExcel).toHaveBeenCalledTimes(1));

    return exportToExcel.mock.calls[0];
  };

  it('exports the current month with every column, Enabled included, as elitea-web-search-YYYY-MM', async () => {
    const { user } = await setup({ [CURRENT]: [makeRow()] });

    const [fileName, sheets] = await exportNow(user);

    expect(fileName).toBe(`elitea-web-search-${CURRENT.slice(0, 4)}-${CURRENT.slice(4)}.xlsx`);
    expect(sheets.map(sheet => sheet.sheetName)).toEqual(['Team Projects', 'Personal Projects']);
    const headers = sheets[0].columns.map(column => column.header);
    expect(headers.slice(0, 7)).toEqual([
      'Name',
      'ID',
      'Limit (USD)',
      'Spent (USD)',
      'Used (%)',
      'Source',
      'Enabled',
    ]);
    expect(headers.slice(-2)).toEqual(['Reporting month', 'Date range']);
  });

  it('exports Name, ID and Spent plus the period for a past month, for both sheets and every record', async () => {
    const rows = [1, 2, 3].map(id =>
      makePastRow({ project_id: id, name: id === 1 ? 'alpha' : `project-${id}` }),
    );
    const { user, calls } = await setup({ [CURRENT]: [makeRow()], [LAST]: rows });
    await pickMonth(user, LAST);
    await screen.findByText('project-2');
    const before = lists(calls).length;

    const [fileName, sheets] = await exportNow(user);

    expect(fileName).toBe(`elitea-web-search-${LAST.slice(0, 4)}-${LAST.slice(4)}.xlsx`);
    for (const sheet of sheets) {
      expect(
        sheet.columns.map(column => column.header).filter(header => header !== 'Owner' && header !== 'Email'),
      ).toEqual(['Name', 'ID', 'Spent (USD)', 'Reporting month', 'Date range']);
    }
    const requests = lists(calls).slice(before);
    expect(requests.every(call => call.params.period === LAST && call.params.feature === FEATURE)).toBe(true);
    expect(new Set(requests.map(call => call.params.project_type))).toEqual(new Set(['team', 'personal']));
    expect(sheets[0].rows).toHaveLength(3);
    expect(sheets[0].rows[0].reporting_month).toBe(`${LAST.slice(0, 4)}-${LAST.slice(4)}`);
  });

  it('writes a month whose spend could not be read as Not available, not as 0', async () => {
    const { user } = await setup({
      [CURRENT]: [makeRow()],
      [LAST]: [makePastRow({ spend: null, spend_available: false })],
    });
    await pickMonth(user, LAST);
    await screen.findAllByText('Not available');

    const [, sheets] = await exportNow(user);

    const row = sheets[0].rows[0];
    const spent = sheets[0].columns.find(column => column.key === 'spend');
    expect(spent.transform(row.spend, row)).toBe('Not available');
  });
});
