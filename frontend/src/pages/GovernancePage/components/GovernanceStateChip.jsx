import { memo } from 'react';

import { Chip } from '@mui/material';

import { FINISHED_STATES, STATE_COLORS } from '@/pages/GovernancePage/constants/governance.constants';
import { stateLabel } from '@/pages/GovernancePage/helpers/governance.helpers';

/** The state of an identity, a credential reference or a grant: in use is green, on its way in blue, paused amber. */
const GovernanceStateChip = memo(props => {
  const { state, testId = 'governance-state-chip' } = props;

  const styles = governanceStateChipStyles(FINISHED_STATES.includes(state));

  return (
    <Chip
      label={stateLabel(state)}
      size="small"
      variant="outlined"
      color={STATE_COLORS[state] ?? 'default'}
      sx={styles.root}
      data-testid={testId}
    />
  );
});

GovernanceStateChip.displayName = 'GovernanceStateChip';

/** @type {MuiSx} */
const governanceStateChipStyles = isFinished => ({
  root: {
    opacity: isFinished ? 0.6 : 1,
  },
});

export default GovernanceStateChip;
