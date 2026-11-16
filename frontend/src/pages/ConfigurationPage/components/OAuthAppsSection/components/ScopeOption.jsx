import { memo, useCallback } from 'react';

import { Box, Checkbox, Chip, FormControlLabel, Tooltip, Typography } from '@mui/material';

// One scope a credential schema offers: its description as the tooltip, and its flags (admin consent) as chips
const ScopeOption = memo(props => {
  const { option, checked, onToggle } = props;

  const handleChange = useCallback((_, value) => onToggle(option.value, value), [onToggle, option.value]);

  const styles = scopeOptionStyles();

  return (
    <Tooltip
      title={option.description ?? ''}
      placement="top"
    >
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={checked}
            onChange={handleChange}
            inputProps={{ 'data-testid': `oauth-app-scope-${option.value}` }}
          />
        }
        label={
          <Box sx={styles.label}>
            <Typography variant="bodyMedium">{option.label ?? option.value}</Typography>
            {option.admin_consent && (
              <Chip
                label="Admin consent"
                size="small"
                color="warning"
                variant="outlined"
                data-testid={`oauth-app-scope-admin-consent-${option.value}`}
              />
            )}
          </Box>
        }
      />
    </Tooltip>
  );
});

ScopeOption.displayName = 'ScopeOption';

/** @type {MuiSx} */
const scopeOptionStyles = () => ({
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
});

export default ScopeOption;
