import { memo } from 'react';

import { Chip, Tooltip } from '@mui/material';

import { DIGEST_STATUS } from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';

/** Whether the agent is still the one the identity was created or approved for: match, changed or unknown. */
const DigestStatusChip = memo(props => {
  const { status } = props;

  const config = DIGEST_STATUS[status] ?? DIGEST_STATUS.unknown;

  return (
    <Tooltip
      title={config.hint}
      placement="top"
    >
      <Chip
        label={config.label}
        size="small"
        variant="outlined"
        color={config.color}
        data-testid="identity-digest-chip"
      />
    </Tooltip>
  );
});

DigestStatusChip.displayName = 'DigestStatusChip';

export default DigestStatusChip;
