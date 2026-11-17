import { memo, useCallback } from 'react';

import { Checkbox, FormControlLabel, Tooltip } from '@mui/material';

// One scope a credential schema offers, with its description as the tooltip
const ScopeOption = memo(props => {
  const { option, checked, onToggle } = props;

  const handleChange = useCallback((_, value) => onToggle(option.value, value), [onToggle, option.value]);

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
        label={option.label ?? option.value}
      />
    </Tooltip>
  );
});

ScopeOption.displayName = 'ScopeOption';

export default ScopeOption;
