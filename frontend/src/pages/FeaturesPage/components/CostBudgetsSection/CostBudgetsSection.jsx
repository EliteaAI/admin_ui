import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExploreOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

import ComplexityBlock from './components/ComplexityBlock';
import CostBudgets from './components/CostBudgets';
import ModelPricesSource from './components/ModelPricesSource';
import ToolSpend from './components/ToolSpend';
import {
  COMPLEXITY_CARD_SETTINGS_COUNT,
  COMPLEXITY_USAGE_FIELD_PREFIX,
  COST_BUDGETS_SETTINGS_COUNT,
} from './constants/costBudgets.constants';

// The source select; importing is an action, not a stored setting
const MODEL_PRICES_SOURCE_SETTINGS_COUNT = 1;

const CostBudgetsSection = memo(props => {
  const {
    budgetsDraft,
    toolSpendDraft,
    toolPricingDraft,
    usageDraft,
    toolSpendFields,
    toolPricingFields,
    usageFields,
    onValidityChange,
    initialBlock,
  } = props;

  const styles = costBudgetsSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(initialBlock);

  // A validation error must never sit hidden inside a collapsed block
  const [budgetsValid, setBudgetsValid] = useState(true);
  const [toolSpendValid, setToolSpendValid] = useState(true);
  const [complexityValid, setComplexityValid] = useState(true);

  useEffect(() => {
    onValidityChange(budgetsValid && toolSpendValid && complexityValid);
  }, [budgetsValid, toolSpendValid, complexityValid, onValidityChange]);

  const toolSpendCount = toolSpendFields.length + toolPricingFields.length;

  // The Usage section is missing while the usage plugin is not running: its blocks are then left out
  const meteringFields = useMemo(
    () => (usageFields ?? []).filter(field => !field.key.startsWith(COMPLEXITY_USAGE_FIELD_PREFIX)),
    [usageFields],
  );
  const complexityRetentionFields = useMemo(
    () => (usageFields ?? []).filter(field => field.key.startsWith(COMPLEXITY_USAGE_FIELD_PREFIX)),
    [usageFields],
  );

  const handleComplexityValidity = useCallback(valid => setComplexityValid(valid), []);

  return (
    <Box sx={styles.root}>
      <Box data-testid="features-budget-settings-section">
        <CollapsibleSection
          icon={AccountBalanceWalletOutlinedIcon}
          title="Budget Settings"
          count={COST_BUDGETS_SETTINGS_COUNT}
          expanded={!!expanded.cost_budgets || !budgetsValid}
          sectionId="cost_budgets"
          onToggle={toggle}
          keepMounted
        >
          <CostBudgets
            values={budgetsDraft.values}
            onChange={budgetsDraft.onChange}
            onValidityChange={setBudgetsValid}
          />
        </CollapsibleSection>
      </Box>

      {toolSpendCount > 0 && (
        <Box data-testid="features-tool-settings-section">
          <CollapsibleSection
            icon={TravelExploreIcon}
            title="Tool Settings"
            count={toolSpendCount}
            expanded={!!expanded.tool_spend || !toolSpendValid}
            sectionId="tool_spend"
            onToggle={toggle}
            keepMounted
          >
            <ToolSpend
              spendFields={toolSpendFields}
              pricingFields={toolPricingFields}
              spendValues={toolSpendDraft.values}
              pricingValues={toolPricingDraft.values}
              onSpendChange={toolSpendDraft.onChange}
              onPricingChange={toolPricingDraft.onChange}
              onValidityChange={setToolSpendValid}
            />
          </CollapsibleSection>
        </Box>
      )}

      <CollapsibleSection
        icon={PaidOutlinedIcon}
        title="Model Prices Source"
        count={MODEL_PRICES_SOURCE_SETTINGS_COUNT}
        expanded={!!expanded.model_prices_source}
        sectionId="model_prices_source"
        onToggle={toggle}
        keepMounted
      >
        <ModelPricesSource />
      </CollapsibleSection>

      {usageFields && (
        <Box data-testid="features-usage-settings-section">
          <CollapsibleSection
            icon={AnalyticsOutlinedIcon}
            title="Usage Settings"
            count={meteringFields.length}
            expanded={!!expanded.usage_settings}
            sectionId="usage_settings"
            onToggle={toggle}
            keepMounted
          >
            <GuardrailsSection
              fields={meteringFields}
              values={usageDraft.values}
              onChange={usageDraft.onChange}
            />
          </CollapsibleSection>
        </Box>
      )}

      <Box data-testid="features-complexity-settings-section">
        <CollapsibleSection
          icon={SpeedOutlinedIcon}
          title="Complexity Settings"
          count={COMPLEXITY_CARD_SETTINGS_COUNT + complexityRetentionFields.length}
          expanded={!!expanded.complexity_settings || !complexityValid}
          sectionId="complexity_settings"
          onToggle={toggle}
          keepMounted
        >
          <ComplexityBlock
            values={budgetsDraft.values}
            onChange={budgetsDraft.onChange}
            usageValues={usageDraft.values}
            usageFields={complexityRetentionFields}
            onUsageChange={usageDraft.onChange}
            onValidityChange={handleComplexityValidity}
          />
        </CollapsibleSection>
      </Box>
    </Box>
  );
});

CostBudgetsSection.displayName = 'CostBudgetsSection';

/** @type {MuiSx} */
const costBudgetsSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
  },
});

export default CostBudgetsSection;
