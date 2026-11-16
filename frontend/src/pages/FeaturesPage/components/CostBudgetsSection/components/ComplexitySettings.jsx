import { memo, useCallback } from 'react';

import { Box, Switch, TextField, Typography } from '@mui/material';

import {
  COMPLEXITY_DEFAULT_FIELDS,
  COMPLEXITY_DEFAULT_GROUP,
  COMPLEXITY_ENABLED_FIELD,
  COMPLEXITY_PINNED_FIELDS,
  COMPLEXITY_PINNED_GROUP,
  COMPLEXITY_THRESHOLDS_INTRO,
  COMPLEXITY_THRESHOLD_MAX,
  COMPLEXITY_THRESHOLD_MIN,
} from '@/pages/FeaturesPage/components/CostBudgetsSection/constants/costBudgets.constants';
import { defaultThresholdValue } from '@/pages/FeaturesPage/components/CostBudgetsSection/helpers/complexity.helpers';

const ComplexitySettings = memo(props => {
  const { values, onChange, budgetsOn, errors, cardStyles } = props;

  const styles = complexitySettingsStyles();

  const enabled = !!values?.[COMPLEXITY_ENABLED_FIELD.key];

  const handleToggle = useCallback(e => onChange(COMPLEXITY_ENABLED_FIELD.key, e.target.checked), [onChange]);

  // Defaults keep '' so Required shows; an empty pinned value means "let calibration decide"
  const handleDefaultChange = useCallback(
    key => e => onChange(key, e.target.value === '' ? '' : Number(e.target.value)),
    [onChange],
  );

  const handlePinnedChange = useCallback(
    key => e => onChange(key, e.target.value === '' ? null : Number(e.target.value)),
    [onChange],
  );

  const renderGroup = (group, fields, valueOf, handler, placeholder) => (
    <Box sx={cardStyles.card}>
      <Box sx={cardStyles.cardRow}>
        <Box sx={[cardStyles.cardLabel, { width: '100%' }]}>
          <Typography
            variant="body2"
            sx={cardStyles.cardTitle}
          >
            {group.title}
          </Typography>
          <Typography
            variant="caption"
            sx={cardStyles.cardHint}
          >
            {group.hint}
          </Typography>
          <Box sx={styles.levelRow}>
            {fields.map(field => (
              <TextField
                key={field.key}
                label={field.title}
                size="small"
                type="number"
                value={valueOf(field) ?? ''}
                onChange={handler(field.key)}
                placeholder={placeholder}
                error={!!errors[field.key]}
                helperText={errors[field.key] || ' '}
                sx={[cardStyles.textField, styles.levelField]}
                slotProps={{ inputLabel: { shrink: true } }}
                inputProps={{
                  min: COMPLEXITY_THRESHOLD_MIN,
                  max: COMPLEXITY_THRESHOLD_MAX,
                  step: 'any',
                  'data-testid': `field-${field.key}`,
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={cardStyles.card}>
        <Box sx={cardStyles.cardRow}>
          <Box sx={cardStyles.cardLabel}>
            <Typography
              variant="body2"
              sx={cardStyles.cardTitle}
            >
              {COMPLEXITY_ENABLED_FIELD.title}
            </Typography>
            <Typography
              variant="caption"
              sx={cardStyles.cardHint}
            >
              {COMPLEXITY_ENABLED_FIELD.hint}
            </Typography>
            {!budgetsOn && (
              <Typography
                variant="caption"
                sx={styles.disabledHint}
                data-testid="complexity-disabled-hint"
              >
                Unavailable while Cost Budgets Mode is off: there is no metering data to score.
              </Typography>
            )}
          </Box>
          <Switch
            checked={enabled}
            onChange={handleToggle}
            disabled={!budgetsOn}
            slotProps={{
              input: { 'aria-label': COMPLEXITY_ENABLED_FIELD.title, 'data-testid': 'complexity-switch' },
            }}
          />
        </Box>
      </Box>

      {budgetsOn && enabled && (
        <>
          <Typography
            variant="body2"
            sx={styles.intro}
            data-testid="complexity-thresholds-intro"
          >
            {COMPLEXITY_THRESHOLDS_INTRO}
          </Typography>
          {renderGroup(
            COMPLEXITY_DEFAULT_GROUP,
            COMPLEXITY_DEFAULT_FIELDS,
            field => defaultThresholdValue(values, field),
            handleDefaultChange,
            '',
          )}
          {renderGroup(
            COMPLEXITY_PINNED_GROUP,
            COMPLEXITY_PINNED_FIELDS,
            field => values?.[field.key],
            handlePinnedChange,
            'Calibrated',
          )}
        </>
      )}
    </>
  );
});

ComplexitySettings.displayName = 'ComplexitySettings';

/** @type {MuiSx} */
const complexitySettingsStyles = () => ({
  intro: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  }),
  levelRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  levelField: {
    flex: '1 1 9rem',
  },
  disabledHint: ({ palette }) => ({
    color: palette.warning.main,
    fontSize: '0.75rem',
  }),
});

export default ComplexitySettings;
