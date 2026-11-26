import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import ToolSpend from '@/pages/FeaturesPage/components/CostBudgetsSection/components/ToolSpend';
import getDesignTokens from '@/theme/main.theme';
import { render, screen } from '@testing-library/react';

vi.mock('@/api/budgets.api', () => ({ useToolSpendFeaturesQuery: () => ({ data: [] }) }));
vi.mock('@/api/configuration.api', () => ({ useConfigSuggestionsQuery: () => ({}) }));

const TAVILY_FIELD = {
  key: 'costs_tool_pricing_tavily_usd_per_credit',
  type: 'number',
  title: 'Tavily: USD per credit',
  backend: 'tavily',
  minimum: 0,
  value_schema: { type: 'number', exclusiveMinimum: 0 },
};

const renderToolSpend = value =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <ToolSpend
        spendFields={[]}
        pricingFields={[TAVILY_FIELD]}
        spendValues={{}}
        pricingValues={{ [TAVILY_FIELD.key]: value }}
        onSpendChange={vi.fn()}
        onPricingChange={vi.fn()}
        onValidityChange={vi.fn()}
      />
    </ThemeProvider>,
  );

// #7747: the field's own error replaces the section's message, so one value never shows two
describe('ToolSpend field errors', () => {
  it('shows one message for an invalid price', () => {
    renderToolSpend(-1);

    expect(screen.getByText('Enter a number greater than 0')).toBeInTheDocument();
    expect(screen.queryByText(/^Must be/)).not.toBeInTheDocument();
  });

  it('still says a missing price is required', () => {
    renderToolSpend(null);

    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
