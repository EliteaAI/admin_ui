import { afterEach, describe, expect, it, vi } from 'vitest';

import { OverviewTab } from '@/pages/GovernancePage/components/OverviewTab';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  AUDIT_PATH,
  HISTORY_PATH,
  MANAGE,
  SETTINGS_PATH,
  VIEW,
  makeSettings,
  mockApi,
  ok,
  renderWithProviders,
  storedRow,
} from './governanceTest.helpers';

const historyRow = (revision, overrides = {}) => ({
  revision,
  mode: 'audit_only',
  policy_revision: `CHG-${revision}`,
  flags: { admit_legacy_pat: true, allow_runtime_domain_binding: false },
  environment: 'prod-eu',
  change_note: `Note ${revision}`,
  changed_by: { id: 7, email: 'admin@example.com' },
  changed_at: '2026-10-20T18:02:00+00:00',
  ...overrides,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('history drawer', () => {
  it('lists the changes with mode, note, flags and who made them', async () => {
    const calls = mockApi({
      [`GET ${SETTINGS_PATH}`]: ok(makeSettings({ stored: storedRow({ revision: 2 }) })),
      [`GET ${HISTORY_PATH}`]: ({ params }) =>
        ok({
          total: 2,
          table_present: true,
          rows:
            params.limit === '1'
              ? [historyRow(2)]
              : [
                  historyRow(2),
                  historyRow(1, {
                    mode: 'off',
                    changed_by: { id: 9, email: null },
                    flags: {
                      admit_legacy_pat: false,
                      allow_runtime_domain_binding: false,
                      allow_development_runs: true,
                    },
                  }),
                ],
        }),
    });
    const user = userEvent.setup();
    renderWithProviders(<OverviewTab />, { permissions: [VIEW, MANAGE] });
    await screen.findByTestId('governance-overview');

    await user.click(screen.getByTestId('governance-history-button'));

    const second = await screen.findByTestId('governance-history-row-2');
    expect(second).toHaveTextContent('Revision 2');
    expect(second).toHaveTextContent('Audit only');
    expect(second).toHaveTextContent('Note 2');
    expect(second).toHaveTextContent('Policy revision CHG-2');
    expect(second).toHaveTextContent('Environment prod-eu');
    expect(second).toHaveTextContent('Legacy tokens: on');
    expect(second).toHaveTextContent('Runtime bindings: off');
    expect(second).toHaveTextContent('Development runs: default'); // not chosen in that revision (#7213)
    expect(second).toHaveTextContent('admin@example.com');

    const first = screen.getByTestId('governance-history-row-1');
    expect(first).toHaveTextContent('Off');
    expect(first).toHaveTextContent('User 9');
    expect(first).toHaveTextContent('Development runs: on');

    const request = calls.filter(call => call.path === HISTORY_PATH).find(call => call.params.limit === '20');
    expect(request.params).toEqual({ limit: '20', offset: '0' });
  });

  it('says so when nothing was recorded yet and when storage is missing', async () => {
    mockApi({
      [`GET ${SETTINGS_PATH}`]: ok(makeSettings()),
      [`GET ${HISTORY_PATH}`]: ok({ total: 0, rows: [], table_present: false }),
    });
    const user = userEvent.setup();
    renderWithProviders(<OverviewTab />, { permissions: [VIEW] });
    await screen.findByTestId('governance-overview');

    await user.click(screen.getByTestId('governance-history-button'));

    const drawer = await screen.findByTestId('governance-history-drawer');
    await waitFor(() =>
      expect(within(drawer).getByText(/create_governance_settings_tables/)).toBeInTheDocument(),
    );
  });
});

describe('would-deny events drawer', () => {
  it('lists the recent would-deny events from the audit view', async () => {
    const calls = mockApi({
      [`GET ${SETTINGS_PATH}`]: ok(makeSettings()),
      [`GET ${HISTORY_PATH}`]: ok({ total: 0, rows: [], table_present: true }),
      [`GET ${AUDIT_PATH}`]: ok({
        total: 1,
        rows: [
          {
            event_id: '0b8c1b3e-7d8f-4a0e-9d3a-1c5e2f4a6b7c',
            event_type: 'admission',
            occurred_at: '2026-10-20T17:00:00+00:00',
            decision: 'allow',
            would_deny: true,
            reason_code: 'NO_ACTIVE_BINDING',
            user_ref: 'idp:t:u1',
            project_id: 12,
            agent_binding_ref: null,
          },
        ],
      }),
    });
    const user = userEvent.setup();
    renderWithProviders(<OverviewTab />, { permissions: [VIEW] });
    await screen.findByTestId('governance-overview');

    await user.click(screen.getByTestId('governance-events-button'));

    const row = await screen.findByTestId('security-event-row');
    expect(row).toHaveTextContent('NO_ACTIVE_BINDING');
    expect(row).toHaveTextContent('user idp:t:u1');
    expect(row).toHaveTextContent('project 12');
    expect(calls.find(call => call.path === AUDIT_PATH).params).toEqual({
      would_deny: 'true',
      limit: '20',
      offset: '0',
    });
  });
});
