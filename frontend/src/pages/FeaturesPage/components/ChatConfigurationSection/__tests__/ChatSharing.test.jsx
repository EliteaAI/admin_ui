import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import getDesignTokens from '@/theme/main.theme';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatSharing from '../components/ChatSharing';

const theme = createTheme(getDesignTokens('dark'));

const setup = values => {
  const onChange = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <ChatSharing
        values={values}
        onChange={onChange}
      />
    </ThemeProvider>,
  );
  return { onChange, toggle: screen.getByRole('switch', { name: 'Enable External Chat Sharing' }) };
};

describe('ChatSharing (#7757)', () => {
  it('is on when the platform never saved the setting', () => {
    const { toggle } = setup({});

    expect(toggle).toBeChecked();
  });

  it('shows the saved value', () => {
    const { toggle } = setup({ chat_sharing_external_enabled: false });

    expect(toggle).not.toBeChecked();
  });

  it('reports the new value under the schema key', async () => {
    const { onChange, toggle } = setup({ chat_sharing_external_enabled: true });

    await userEvent.setup().click(toggle);

    expect(onChange).toHaveBeenCalledWith('chat_sharing_external_enabled', false);
  });
});
