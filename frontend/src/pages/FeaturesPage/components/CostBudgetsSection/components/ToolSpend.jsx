import { memo, useEffect, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { useToolSpendFeaturesQuery } from '@/api/budgets.api';
import FieldCard from '@/components/SchemaForm/components/FieldCard';

import { groupToolSpendFields, toolSpendFieldError } from '../helpers/toolSpend.helpers';

// Schema-driven: a new feature or backend in admin_schema shows up here without frontend changes
const ToolSpend = memo(props => {
  const { spendFields, pricingFields, spendValues, pricingValues, onSpendChange, onPricingChange, onValidityChange } =
    props;

  const styles = toolSpendStyles();

  const { data: features } = useToolSpendFeaturesQuery();

  const groups = useMemo(
    () => groupToolSpendFields({ spendFields, pricingFields, features, spendValues }),
    [spendFields, pricingFields, features, spendValues],
  );

  const errors = useMemo(() => {
    const all = [
      ...spendFields.map(field => [field.key, toolSpendFieldError(field, spendValues?.[field.key])]),
      ...pricingFields.map(field => [field.key, toolSpendFieldError(field, pricingValues?.[field.key])]),
    ];
    return Object.fromEntries(all.filter(([, error]) => error));
  }, [spendFields, pricingFields, spendValues, pricingValues]);

  useEffect(() => {
    onValidityChange?.(Object.keys(errors).length === 0);
  }, [errors, onValidityChange]);

  const renderField = (field, values, onChange) => (
    <Box key={field.key}>
      <FieldCard
        field={field}
        values={values || {}}
        onChange={onChange}
      />
      {errors[field.key] && (
        <Typography
          variant="caption"
          color="error"
          sx={styles.error}
        >
          {errors[field.key]}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={styles.root}>
      <Typography
        variant="body2"
        sx={styles.description}
      >
        Paid tools such as web search, billed per call on the platform key. Spend is tracked apart from LLM
        budgets and never counts toward them. Limits are in USD per month and are unlimited when left empty;
        per-project and per-member limits are set on each feature&apos;s page in the sidebar. A per-member
        default on team projects is recommended.
      </Typography>

      {groups.map(group => (
        <Box
          key={group.id}
          sx={styles.group}
        >
          <Typography
            variant="subtitle2"
            sx={styles.groupTitle}
          >
            {group.label}
          </Typography>
          {group.pricing.map(field => renderField(field, pricingValues, onPricingChange))}
          {group.spend.map(field => renderField(field, spendValues, onSpendChange))}
        </Box>
      ))}
    </Box>
  );
});

ToolSpend.displayName = 'ToolSpend';

/** @type {MuiSx} */
const toolSpendStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  }),
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  groupTitle: ({ palette }) => ({
    color: palette.text.secondary,
    fontWeight: 600,
  }),
  error: {
    display: 'block',
    marginTop: '0.25rem',
  },
});

export default ToolSpend;
