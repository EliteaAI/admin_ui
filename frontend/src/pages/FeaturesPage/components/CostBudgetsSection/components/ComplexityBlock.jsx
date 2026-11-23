import { memo, useEffect, useMemo } from 'react';

import { Box } from '@mui/material';

import { GuardrailsSection } from '@/components/SchemaForm';
import { COMPLEXITY_ENABLED_FIELD } from '@/pages/FeaturesPage/components/CostBudgetsSection/constants/costBudgets.constants';
import { complexityThresholdErrors } from '@/pages/FeaturesPage/components/CostBudgetsSection/helpers/complexity.helpers';

import ComplexitySettings from './ComplexitySettings';
import { costBudgetsStyles } from './CostBudgets';

const ComplexityBlock = memo(props => {
  const { values, onChange, usageValues, usageFields, onUsageChange, onValidityChange } = props;

  const styles = costBudgetsStyles();

  const budgetsOn = (values?.usage_mode || 'off') !== 'off';
  const complexityEnabled = !!values?.[COMPLEXITY_ENABLED_FIELD.key];

  const errors = useMemo(() => complexityThresholdErrors(values), [values]);

  // Save lives in the page, so invalid thresholds have to be reported upwards
  useEffect(() => {
    onValidityChange(!(budgetsOn && complexityEnabled && Object.values(errors).some(Boolean)));
  }, [budgetsOn, complexityEnabled, errors, onValidityChange]);

  return (
    <Box sx={styles.root}>
      <ComplexitySettings
        values={values}
        onChange={onChange}
        budgetsOn={budgetsOn}
        errors={errors}
        cardStyles={styles}
      />
      {usageFields.length > 0 && (
        <GuardrailsSection
          fields={usageFields}
          values={usageValues}
          onChange={onUsageChange}
        />
      )}
    </Box>
  );
});

ComplexityBlock.displayName = 'ComplexityBlock';

export default ComplexityBlock;
