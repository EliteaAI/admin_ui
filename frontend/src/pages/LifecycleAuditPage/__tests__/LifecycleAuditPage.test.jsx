import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { PERMISSIONS, ROUTE_PERMISSIONS, SIDEBAR_PERMISSIONS } from '@/constants/permissions.constants';
import { RouteDefinitions } from '@/constants/routes.constants';
import { LifecycleAuditPage } from '@/pages/LifecycleAuditPage';
import { formatTimestampWithZone } from '@/pages/LifecycleAuditPage/helpers/lifecycleAudit.helpers';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockApi, ok, renderWithProviders } from '../../GovernancePage/__tests__/governanceTest.helpers';

const LIST_PATH = '/admin/lifecycle_audit/administration';

const MEMBER_ROW = {
  event_id: 'e-1',
  occurred_at: '2026-11-16T09:30:00+00:00',
  event_type: 'project.member_role_changed',
  scope: 'project',
  source: 'ui',
  result: 'success',
  failure_reason: null,
  actor_type: 'user',
  actor_id: 7,
  actor_name: 'Root Admin',
  actor_email: 'root@example.com',
  project_id: 5,
  project_name: 'Alpha',
  project_type: 'team',
  user_id: 11,
  user_name: 'Ann',
  user_email: 'ann@example.com',
  admin_access: 'granted',
  roles_before: ['viewer'],
  roles_after: ['admin'],
  changes: {},
  details: { note: 'x'.repeat(300) },
  request_id: 'req-1',
  imported: false,
};

const page = (rows = [MEMBER_ROW]) =>
  ok({ rows, total: rows.length, live_coverage_since: '2026-11-16T08:00:00+00:00' });

const render = () =>
  // ThemeWrapper provides the date pickers' localization in the app
  renderWithProviders(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <LifecycleAuditPage />
    </LocalizationProvider>,
    {
      permissions: [PERMISSIONS.lifecycleAudit.view],
      route: '/audit',
    },
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LifecycleAuditPage', () => {
  it('shows the Projects columns and asks for the projects tab newest first with a date range', async () => {
    const calls = mockApi({ [`GET ${LIST_PATH}`]: page() });

    render();

    const header = await screen.findByTestId('lifecycle-audit-header');
    expect(within(header).getByText(/^Time \(.+\)$/)).toBeInTheDocument();
    for (const label of [
      'Event',
      'Project name',
      'ID',
      'Affected user',
      'Performed by',
      'Changes',
      'Result',
    ]) {
      expect(within(header).getByText(label)).toBeInTheDocument();
    }
    const [call] = calls.filter(c => c.path === LIST_PATH);
    expect(call.params.tab).toBe('projects');
    expect(call.params.sort_by).toBe('time');
    expect(call.params.sort_order).toBe('desc');
    expect(call.params.date_from).toBeTruthy();
    expect(call.params.date_to).toBeTruthy();
  });

  it('switches to the Users tab with its own columns', async () => {
    const calls = mockApi({ [`GET ${LIST_PATH}`]: page() });
    render();

    await userEvent.click(await screen.findByRole('tab', { name: 'Users' }));

    expect(await screen.findByText('Project / Scope')).toBeInTheDocument();
    expect(within(screen.getByTestId('lifecycle-audit-header')).getByText('User name')).toBeInTheDocument();
    await waitFor(() => expect(calls.some(c => c.path === LIST_PATH && c.params.tab === 'users')).toBe(true));
  });

  it('shows the coverage start and the before/after roles', async () => {
    mockApi({ [`GET ${LIST_PATH}`]: page() });
    render();

    expect(await screen.findByText('Coverage since 16 Nov 2026')).toBeInTheDocument();
    expect(screen.getByText('viewer → admin')).toBeInTheDocument();
    expect(screen.getByText('Root Admin')).toBeInTheDocument();
  });

  it('opens a details panel with every field untruncated', async () => {
    mockApi({ [`GET ${LIST_PATH}`]: page() });
    render();

    await userEvent.click(await screen.findByText('Alpha'));

    const details = await screen.findByTestId('lifecycle-audit-details');
    expect(within(details).getByText('req-1')).toBeInTheDocument();
    expect(within(details).getByText(/x{300}/)).toBeInTheDocument();
    expect(within(details).getByText('e-1')).toBeInTheDocument();
  });

  it('sends combined filters on Apply and clears them', async () => {
    const calls = mockApi({ [`GET ${LIST_PATH}`]: page() });
    render();
    await screen.findByText('Alpha');

    await userEvent.type(screen.getByLabelText('Actor'), 'root');
    await userEvent.click(screen.getByRole('switch', { name: 'Administrator access only' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() =>
      expect(calls.some(c => c.params.actor === 'root' && c.params.admin_access === 'any')).toBe(true),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => {
      const last = calls.filter(c => c.path === LIST_PATH).at(-1);
      expect(last.params.actor).toBeUndefined();
      expect(last.params.admin_access).toBeUndefined();
    });
  });

  it('has no control that changes a record', async () => {
    mockApi({ [`GET ${LIST_PATH}`]: page() });
    render();
    await screen.findByText('Alpha');

    expect(screen.queryByRole('button', { name: /delete|edit|remove/i })).not.toBeInTheDocument();
  });
});

describe('lifecycle audit wiring', () => {
  it('formats time with an explicit timezone', () => {
    expect(formatTimestampWithZone('2026-11-16T09:30:00+00:00')).toMatch(/[A-Z]{2,5}|GMT|UTC/);
    expect(formatTimestampWithZone(null)).toBe('-');
  });

  it('gates the route and sidebar item with the lifecycle audit permission', () => {
    expect(RouteDefinitions.LifecycleAudit).toBe('/audit');
    expect(SIDEBAR_PERMISSIONS.audit).toEqual([PERMISSIONS.lifecycleAudit.view]);
    expect(ROUTE_PERMISSIONS['/audit']).toEqual([PERMISSIONS.lifecycleAudit.view]);
  });
});
