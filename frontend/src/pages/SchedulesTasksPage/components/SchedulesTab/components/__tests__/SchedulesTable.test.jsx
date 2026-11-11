import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import getDesignTokens from '@/theme/main.theme';
import { render, screen } from '@testing-library/react';

import SchedulesTable from '../SchedulesTable';

const mocks = vi.hoisted(() => ({ canOpen: true }));

vi.mock('@/hooks/useCheckPermission.hooks', () => ({
  useCheckPermission: () => ({ hasPermission: () => mocks.canOpen }),
}));

const theme = createTheme(getDesignTokens('dark'));

const schedule = (id, managedBy) => ({
  id,
  name: `Schedule ${id}`,
  cron: '0 * * * *',
  active: true,
  rpc_func: 'run_it',
  last_run: null,
  managed_by: managedBy,
});

const renderTable = rows =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <SchedulesTable
          schedules={rows}
          sortConfig={{ field: 'name', direction: 'asc' }}
          onSort={vi.fn()}
          onScheduleClick={vi.fn()}
        />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('SchedulesTable managed schedule lock', () => {
  it('links a schedule managed in the schedules section to Features > Schedules', () => {
    mocks.canOpen = true;
    renderTable([schedule(1, { section: 'schedules', fields: ['pipeline_scheduling_cron'] })]);

    const link = screen.getByRole('link', { name: 'Managed in Features → Schedules' });

    expect(link).toHaveAttribute('href', '/features#schedules');
  });

  it('links a schedule managed in the webhooks section to Features > Webhooks', () => {
    mocks.canOpen = true;
    renderTable([schedule(1, { section: 'webhooks', fields: ['schedules_webhook_max_waiting_runs'] })]);

    const link = screen.getByRole('link', { name: 'Managed in Features → Webhooks' });

    expect(link).toHaveAttribute('href', '/features#webhooks');
  });

  it('keeps the Configuration > Runtime link for a backend that still manages the schedule there', () => {
    mocks.canOpen = true;
    renderTable([schedule(1, { section: 'runtime', fields: ['pipeline_scheduling_cron'] })]);

    const link = screen.getByRole('link', { name: 'Managed in Configuration → Runtime' });

    expect(link).toHaveAttribute('href', '/configuration#runtime');
  });

  it('shows the lock without a link when the admin cannot open the settings', () => {
    mocks.canOpen = false;
    renderTable([schedule(1, { section: 'schedules', fields: [] })]);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows the lock without a link for a section it does not know', () => {
    mocks.canOpen = true;
    renderTable([schedule(1, { section: 'other', fields: [] })]);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
