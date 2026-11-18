import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import getDesignTokens from '@/theme/main.theme';
import { render, screen } from '@testing-library/react';

import ConfigurationPage from '../ConfigurationPage';

vi.mock('@/api/configuration.api', async importOriginal => ({
  ...(await importOriginal()),
  useConfigSchemasQuery: () => ({
    data: {
      sections: [
        { id: 'runtime', title: 'Runtime' },
        { id: 'notifications', title: 'User Management' },
      ],
    },
  }),
  useConfigValuesQuery: () => ({}),
  useConfigValuesSaveMutation: () => [vi.fn(), {}],
  useConfigRestartMutation: () => [vi.fn(), {}],
}));

vi.mock('@/hooks/useCheckPermission.hooks', () => ({
  useCheckPermission: () => ({ hasAnyPermission: () => true }),
}));

describe('Configuration sections', () => {
  afterEach(() => window.history.replaceState(null, '', window.location.pathname));

  it('does not show the Notifications section owned by Features', () => {
    window.history.replaceState(null, '', '#runtime');
    render(
      <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
        <ConfigurationPage />
      </ThemeProvider>,
    );

    expect(screen.getByText('Runtime')).toBeInTheDocument();
    expect(screen.queryByText('User Management')).not.toBeInTheDocument();
  });
});
