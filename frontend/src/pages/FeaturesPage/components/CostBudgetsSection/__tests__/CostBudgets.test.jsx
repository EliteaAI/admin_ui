import { useState } from 'react';

import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import getDesignTokens from '@/theme/main.theme';
import { fireEvent, render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CostBudgets from '../components/CostBudgets';

const theme = createTheme(getDesignTokens('dark'));

// Stateful host so onChange round-trips like the real section draft
const Host = props => {
  const { initial, onChange, onValidityChange } = props;
  const [values, setValues] = useState(initial);
  const handleChange = (key, value) => {
    onChange?.(key, value);
    setValues(prev => ({ ...prev, [key]: value }));
  };
  return (
    <CostBudgets
      values={values}
      onChange={handleChange}
      onValidityChange={onValidityChange}
    />
  );
};

const renderHost = (initial, extra = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <Host
        initial={initial}
        {...extra}
      />
    </ThemeProvider>,
  );

const chooseMode = async label => {
  await userEvent.click(within(screen.getByTestId('usage-mode-select')).getByRole('combobox'));
  await userEvent.click(screen.getByRole('option', { name: label }));
};

describe('CostBudgets complexity', () => {
  it('disables the switch while mode is off and explains why', () => {
    renderHost({ usage_mode: 'off' });
    expect(screen.getByTestId('complexity-switch')).toBeDisabled();
    expect(screen.getByTestId('complexity-disabled-hint')).toBeInTheDocument();
  });

  it('enables the switch in observe and shows thresholds once on', async () => {
    const onChange = vi.fn();
    renderHost({ usage_mode: 'observe' }, { onChange });
    expect(screen.queryByTestId('field-usage_complexity_default_medium')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('complexity-switch'));
    expect(onChange).toHaveBeenCalledWith('usage_complexity_enabled', true);
    expect(screen.getByTestId('field-usage_complexity_default_medium')).toHaveValue(10);
    expect(screen.getByTestId('field-usage_complexity_pinned_high')).toHaveValue(null);
  });

  it('asks before turning mode off while complexity is on; cancel keeps the mode', async () => {
    const onChange = vi.fn();
    renderHost({ usage_mode: 'observe', usage_complexity_enabled: true }, { onChange });

    await chooseMode('Off');
    expect(screen.getByTestId('mode-off-confirm-dialog')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('mode-off-confirm-cancel'));
    await waitForElementToBeRemoved(() => screen.queryByTestId('mode-off-confirm-dialog'));
    expect(onChange).not.toHaveBeenCalledWith('usage_mode', 'off');

    await chooseMode('Off');
    await userEvent.click(screen.getByTestId('mode-off-confirm-submit'));
    expect(onChange).toHaveBeenCalledWith('usage_mode', 'off');
    expect(onChange).not.toHaveBeenCalledWith('usage_complexity_enabled', false);
  });

  it('turns mode off without a dialog when complexity is off', async () => {
    const onChange = vi.fn();
    renderHost({ usage_mode: 'observe' }, { onChange });
    await chooseMode('Off');
    expect(screen.queryByTestId('mode-off-confirm-dialog')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('usage_mode', 'off');
  });

  it('blocks save on non-increasing thresholds and clears pinned to null', () => {
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    renderHost({ usage_mode: 'observe', usage_complexity_enabled: true }, { onChange, onValidityChange });
    expect(onValidityChange).toHaveBeenLastCalledWith(true);

    fireEvent.change(screen.getByTestId('field-usage_complexity_default_high'), { target: { value: '5' } });
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    fireEvent.change(screen.getByTestId('field-usage_complexity_default_high'), { target: { value: '40' } });
    expect(onValidityChange).toHaveBeenLastCalledWith(true);

    fireEvent.change(screen.getByTestId('field-usage_complexity_pinned_medium'), { target: { value: '20' } });
    fireEvent.change(screen.getByTestId('field-usage_complexity_pinned_extreme'), {
      target: { value: '15' },
    });
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    fireEvent.change(screen.getByTestId('field-usage_complexity_pinned_extreme'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith('usage_complexity_pinned_extreme', null);
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });
});
