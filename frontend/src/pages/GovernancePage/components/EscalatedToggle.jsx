import { memo } from 'react';

import { Checkbox, FormControlLabel, Tooltip } from '@mui/material';

/**
 * The inbox filter of a governance list (#7269): only the items waiting for an approval nobody in their project can
 * give (no project admin, or the only one created it), which a platform operator approves here.
 */
const EscalatedToggle = memo(props => {
  const { checked, onChange, disabled = false, testId } = props;

  return (
    <Tooltip title="Waiting items that no admin of the project can approve: they need a platform operator.">
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={checked}
            onChange={event => onChange(event.target.checked)}
            disabled={disabled}
            inputProps={{ 'data-testid': testId }}
          />
        }
        label="Needs a platform operator"
      />
    </Tooltip>
  );
});

EscalatedToggle.displayName = 'EscalatedToggle';

export default EscalatedToggle;
