import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen } from '@testing-library/react';

import { CostBudgetsSection } from '..';

const theme = createTheme(getDesignTokens('dark'));

const usageField = key => ({ key, title: key, path: `usage.${key}`, type: 'integer', section: 'Usage' });

const USAGE_FIELDS = [
  usageField('usage_retention_months'),
  usageField('usage_max_call_cost_usd'),
  usageField('usage_complexity_quiet_minutes'),
  usageField('usage_complexity_run_retention_days'),
];

const draft = (values = {}) => ({ values, onChange: vi.fn(), isDirty: false });

const renderSection = (props = {}) =>
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CostBudgetsSection
          budgetsDraft={draft({ usage_mode: 'observe' })}
          toolSpendDraft={draft()}
          toolPricingDraft={draft()}
          usageDraft={draft()}
          toolSpendFields={[]}
          toolPricingFields={[]}
          usageFields={USAGE_FIELDS}
          onValidityChange={vi.fn()}
          {...props}
        />
      </ThemeProvider>
    </Provider>,
  );

const blockTitles = () =>
  screen
    .getAllByRole('button')
    .filter(button => button.hasAttribute('aria-expanded'))
    .map(button => button.textContent.replace(/\d+ settings?$/, ''));

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })),
  );
});

describe('Cost & Usage blocks', () => {
  it('shows Budget Settings, Model Prices Source, Usage Settings and Complexity Settings in order', () => {
    renderSection();

    expect(blockTitles()).toEqual([
      'Budget Settings',
      'Model Prices Source',
      'Usage Settings',
      'Complexity Settings',
    ]);
  });

  it('puts Tool Settings second when the backend has tool fields', () => {
    renderSection({ toolSpendFields: [usageField('tool_spend_enabled')] });

    expect(blockTitles()).toEqual([
      'Budget Settings',
      'Tool Settings',
      'Model Prices Source',
      'Usage Settings',
      'Complexity Settings',
    ]);
  });

  it('counts the metering fields in Usage Settings, leaving out the complexity ones', () => {
    renderSection();

    expect(screen.getByTestId('features-usage-settings-section')).toHaveTextContent('2 settings');
  });

  it('leaves the Usage blocks out while the usage plugin is not running', () => {
    renderSection({ usageFields: undefined });

    expect(screen.queryByTestId('features-usage-settings-section')).not.toBeInTheDocument();
    expect(screen.getByTestId('features-complexity-settings-section')).toBeInTheDocument();
  });

  it('opens the block a deep link points at', () => {
    renderSection({ initialBlock: 'usage_settings' });

    const header = screen.getByTestId('features-usage-settings-section').querySelector('[aria-expanded]');
    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps the budget block free of the complexity switch', () => {
    renderSection({ initialBlock: 'cost_budgets' });

    const budget = screen.getByTestId('features-budget-settings-section');
    expect(budget).not.toHaveTextContent('Agent & Pipeline Complexity');
  });

  it('opens Complexity Settings with the switch and thresholds for the complexity link', () => {
    renderSection({
      initialBlock: 'complexity_settings',
      budgetsDraft: draft({ usage_mode: 'observe', usage_complexity_enabled: true }),
    });

    const complexity = screen.getByTestId('features-complexity-settings-section');
    expect(complexity).toHaveTextContent('Agent & Pipeline Complexity');
    expect(complexity).toHaveTextContent('Starting Thresholds (until calibrated)');
  });
});
