import { memo } from 'react';

import { Chip } from '@mui/material';

import { STATE_COLORS } from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';
import { stateLabel } from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';

const IdentityStateChip = memo(props => {
  const { state } = props;

  const styles = identityStateChipStyles(state === 'retired');

  return (
    <Chip
      label={stateLabel(state)}
      size="small"
      variant="outlined"
      color={STATE_COLORS[state] ?? 'default'}
      sx={styles.root}
      data-testid="identity-state-chip"
    />
  );
});

IdentityStateChip.displayName = 'IdentityStateChip';

/** @type {MuiSx} */
const identityStateChipStyles = isRetired => ({
  root: {
    opacity: isRetired ? 0.6 : 1,
  },
});

export default IdentityStateChip;
