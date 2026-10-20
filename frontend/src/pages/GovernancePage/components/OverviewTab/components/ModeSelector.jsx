import { memo, useCallback } from 'react';

import InfoOutlined from '@mui/icons-material/InfoOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { Box, FormControlLabel, Radio, RadioGroup, Tooltip, Typography } from '@mui/material';

import { MODES, MODE_RANK } from '../constants/governanceSettings.constants';
import { fillPlaceholders, firstSentence, modeLabel } from '../helpers/governanceSettings.helpers';

/**
 * The three governance modes as radio cards, each with its description. A mode above the deployment's ceiling
 * is disabled and its tooltip says why.
 */
const ModeSelector = memo(props => {
  const { value, onChange, disabled = false, ceilingMode, descriptions } = props;

  const styles = modeSelectorStyles();

  const handleChange = useCallback(
    event => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const lockText = fillPlaceholders(descriptions.locks.max_mode, {
    max: modeLabel(descriptions, ceilingMode),
  });

  return (
    <RadioGroup
      row
      value={value}
      onChange={handleChange}
      aria-label="Governance mode"
      sx={styles.group}
    >
      {MODES.map(mode => {
        const isLocked = MODE_RANK[mode] > MODE_RANK[ceilingMode];
        const info = descriptions.modes[mode];

        return (
          <Tooltip
            key={mode}
            title={isLocked ? lockText : info.tooltip}
            placement="top"
          >
            <Box
              component="span"
              sx={styles.optionWrap}
              data-testid={`governance-mode-option-${mode}`}
            >
              <FormControlLabel
                value={mode}
                disabled={disabled || isLocked}
                sx={styles.option(value === mode, isLocked)}
                control={
                  <Radio
                    size="small"
                    slotProps={{ input: { 'data-testid': `governance-mode-radio-${mode}` } }}
                  />
                }
                label={
                  <Box sx={styles.optionText}>
                    <Box sx={styles.optionTitle}>
                      <Typography variant="labelMedium">{info.label}</Typography>
                      {isLocked ? <LockOutlined sx={styles.icon} /> : <InfoOutlined sx={styles.icon} />}
                    </Box>
                    <Typography
                      variant="bodySmall"
                      sx={styles.description}
                    >
                      {firstSentence(info.tooltip)}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Tooltip>
        );
      })}
    </RadioGroup>
  );
});

ModeSelector.displayName = 'ModeSelector';

/** @type {MuiSx} */
const modeSelectorStyles = () => ({
  group: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(11rem, 1fr))',
    gap: '0.75rem',
    width: '100%',
  },
  optionWrap: {
    display: 'flex',
  },
  option:
    (selected, locked) =>
    ({ palette }) => ({
      flex: 1,
      margin: 0,
      alignItems: 'flex-start',
      padding: '0.625rem 0.75rem',
      borderRadius: '0.5rem',
      border: `0.0625rem solid ${palette.border.table}`,
      backgroundColor: selected ? palette.background.userInputBackgroundActive : 'transparent',
      opacity: locked ? 0.6 : 1,
      '& .MuiFormControlLabel-label': {
        flex: 1,
        minWidth: 0,
      },
    }),
  optionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    paddingTop: '0.125rem',
  },
  optionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  icon: ({ palette }) => ({
    fontSize: '0.875rem',
    color: palette.text.metrics,
  }),
  description: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default ModeSelector;
