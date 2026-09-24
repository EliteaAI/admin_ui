import { memo, useCallback, useState } from 'react';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

import CostBudgets from './components/CostBudgets';
import ModelPricesSource from './components/ModelPricesSource';
import { COST_BUDGETS_SETTINGS_COUNT } from './constants/costBudgets.constants';

// The source select; importing is an action, not a stored setting
const MODEL_PRICES_SOURCE_SETTINGS_COUNT = 1;

const CostBudgetsSection = memo(props => {
  const { budgetsDraft, onValidityChange, initialBlock } = props;

  const styles = costBudgetsSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(initialBlock);

  // A validation error must never sit hidden inside a collapsed block
  const [budgetsValid, setBudgetsValid] = useState(true);

  const handleValidityChange = useCallback(
    valid => {
      setBudgetsValid(valid);
      onValidityChange(valid);
    },
    [onValidityChange],
  );

  return (
    <Box sx={styles.root}>
      <CollapsibleSection
        icon={AccountBalanceWalletOutlinedIcon}
        title="Cost Budgets"
        count={COST_BUDGETS_SETTINGS_COUNT}
        expanded={!!expanded.cost_budgets || !budgetsValid}
        onToggle={() => toggle('cost_budgets')}
        keepMounted
      >
        <CostBudgets
          values={budgetsDraft.values}
          onChange={budgetsDraft.onChange}
          onValidityChange={handleValidityChange}
        />
      </CollapsibleSection>

      <CollapsibleSection
        icon={PaidOutlinedIcon}
        title="Model Prices Source"
        count={MODEL_PRICES_SOURCE_SETTINGS_COUNT}
        expanded={!!expanded.model_prices_source}
        onToggle={() => toggle('model_prices_source')}
        keepMounted
      >
        <ModelPricesSource />
      </CollapsibleSection>
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
