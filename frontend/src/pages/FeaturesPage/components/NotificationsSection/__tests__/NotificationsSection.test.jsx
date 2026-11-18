import { useCallback, useMemo, useState } from 'react';

import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationsSection } from '..';

const theme = createTheme(getDesignTokens('dark'));

const NOTIFICATION_FIELDS = [
  {
    key: 'project_membership_on_added',
    title: 'Notify users when added to a team project',
    path: 'notifications.project_membership.on_added',
    type: 'boolean',
    section: 'notifications',
  },
  {
    key: 'project_membership_on_removed',
    title: 'Notify users when removed from a team project',
    path: 'notifications.project_membership.on_removed',
    type: 'boolean',
    section: 'notifications',
  },
];

const Harness = ({ onChange }) => {
  const [values, setValues] = useState({
    project_membership_on_added: true,
    project_membership_on_removed: false,
  });
  const change = useCallback(
    (key, value) => {
      onChange(key, value);
      setValues(prev => ({ ...prev, [key]: value }));
    },
    [onChange],
  );
  const notificationsDraft = useMemo(() => ({ values, onChange: change }), [values, change]);

  return (
    <NotificationsSection
      notificationsDraft={notificationsDraft}
      notificationsFields={NOTIFICATION_FIELDS}
    />
  );
};

const setup = () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Harness onChange={onChange} />
      </ThemeProvider>
    </Provider>,
  );
  return { onChange, user };
};

describe('Notifications section', () => {
  it('shows both project-membership settings with their saved values', async () => {
    const { user } = setup();
    const projectMembership = screen.getByText('Project Membership').closest('[role="button"]');

    expect(within(projectMembership).getByText('2 settings')).toBeInTheDocument();
    expect(projectMembership).toHaveAttribute('aria-expanded', 'false');

    await user.click(projectMembership);

    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toBeChecked();
    expect(switches[1]).not.toBeChecked();
  });

  it('edits the removal notification setting through the shared draft', async () => {
    const { onChange, user } = setup();
    await user.click(screen.getByText('Project Membership').closest('[role="button"]'));

    await user.click(screen.getAllByRole('switch')[1]);

    expect(onChange).toHaveBeenCalledWith('project_membership_on_removed', true);
  });
});
