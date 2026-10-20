import { memo, useEffect, useState } from 'react';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExploreOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

import CostBudgets from './components/CostBudgets';
import ModelPricesSource from './components/ModelPricesSource';
import ToolSpend from './components/ToolSpend';
import { COST_BUDGETS_SETTINGS_COUNT } from './constants/costBudgets.constants';

// The source select; importing is an action, not a stored setting
const MODEL_PRICES_SOURCE_SETTINGS_COUNT = 1;

const CostBudgetsSection = memo(props => {
  const { budgetsDraft, toolSpendDraft, toolPricingDraft, toolSpendFields, toolPricingFields, onValidityChange, initialBlock } =
    props;

  const styles = costBudgetsSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(initialBlock);

  // A validation error must never sit hidden inside a collapsed block
  const [budgetsValid, setBudgetsValid] = useState(true);
  const [toolSpendValid, setToolSpendValid] = useState(true);

  useEffect(() => {
    onValidityChange(budgetsValid && toolSpendValid);
  }, [budgetsValid, toolSpendValid, onValidityChange]);


  const toolSpendCount = toolSpendFields.length + toolPricingFields.length;

  return (
    <Box sx={styles.root}>
      <CollapsibleSection
        icon={AccountBalanceWalletOutlinedIcon}
        title="Cost Budgets"
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

      {toolSpendCount > 0 && (
        <CollapsibleSection
          icon={TravelExploreIcon}
          title="Tool Spend"
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
      )}
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
