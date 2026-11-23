import { useState } from 'react';

import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ComplexityBlock from '../components/ComplexityBlock';

const theme = createTheme(getDesignTokens('dark'));

const RETENTION_FIELDS = [
  {
    key: 'usage_complexity_quiet_minutes',
    title: 'Complexity: run finished after (minutes)',
    path: 'usage.complexity_quiet_minutes',
    type: 'integer',
    section: 'Usage',
  },
  {
    key: 'usage_complexity_run_retention_days',
    title: 'Complexity: per-run score retention (days)',
    path: 'usage.complexity_run_retention_days',
    type: 'integer',
    section: 'Usage',
  },
];

// Stateful host so onChange round-trips like the real section draft
const Host = props => {
  const { initial, usageInitial = {}, onChange, onUsageChange, onValidityChange } = props;
  const [values, setValues] = useState(initial);
  const [usageValues, setUsageValues] = useState(usageInitial);

  const handleChange = (key, value) => {
    onChange?.(key, value);
    setValues(prev => ({ ...prev, [key]: value }));
  };
  const handleUsageChange = (key, value) => {
    onUsageChange?.(key, value);
    setUsageValues(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ComplexityBlock
      values={values}
      onChange={handleChange}
      usageValues={usageValues}
      usageFields={RETENTION_FIELDS}
      onUsageChange={handleUsageChange}
      onValidityChange={onValidityChange ?? (() => {})}
    />
  );
};

const renderHost = (initial, extra = {}) =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Host
          initial={initial}
          {...extra}
        />
      </ThemeProvider>
    </Provider>,
  );

describe('ComplexityBlock', () => {
  it('disables the switch while mode is off and explains why', () => {
    renderHost({ usage_mode: 'off' });

    expect(screen.getByTestId('complexity-switch')).toBeDisabled();
    expect(screen.getByTestId('complexity-disabled-hint')).toBeInTheDocument();
  });

  it('enables the switch in observe and shows the thresholds once on', async () => {
    const onChange = vi.fn();
    renderHost({ usage_mode: 'observe' }, { onChange });
    expect(screen.queryByTestId('field-usage_complexity_default_medium')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('complexity-switch'));

    expect(onChange).toHaveBeenCalledWith('usage_complexity_enabled', true);
    expect(screen.getByTestId('field-usage_complexity_default_medium')).toHaveValue(10);
    expect(screen.getByTestId('field-usage_complexity_pinned_high')).toHaveValue(null);
  });

  it('shows the switch, both threshold groups and then the retention fields, in order', () => {
    renderHost({ usage_mode: 'observe', usage_complexity_enabled: true });

    const order = [
      screen.getByText('Agent & Pipeline Complexity'),
      screen.getByText('Starting Thresholds (until calibrated)'),
      screen.getByText('Fixed Thresholds (override calibration)'),
      screen.getByText('Complexity: run finished after (minutes)'),
      screen.getByText('Complexity: per-run score retention (days)'),
    ];

    order
      .slice(1)
      .forEach((node, index) =>
        expect(order[index].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy(),
      );
  });

  it('keeps the retention fields on the Usage values, not the budget values', async () => {
    const onChange = vi.fn();
    const onUsageChange = vi.fn();
    renderHost(
      { usage_mode: 'observe' },
      { usageInitial: { usage_complexity_quiet_minutes: 15 }, onChange, onUsageChange },
    );

    const field = screen.getByDisplayValue('15');
    fireEvent.change(field, { target: { value: '20' } });

    expect(onUsageChange).toHaveBeenCalledWith('usage_complexity_quiet_minutes', 20);
    expect(onChange).not.toHaveBeenCalled();
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

  it('does not block save on bad thresholds while the mode is off', () => {
    const onValidityChange = vi.fn();
    renderHost(
      { usage_mode: 'off', usage_complexity_enabled: true, usage_complexity_default_high: 1 },
      { onValidityChange },
    );

    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });
});
