import { memo } from 'react';

import { Chip } from '@mui/material';

import { STATUS_CONFIG } from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

const StatusChip = memo(props => {
  const { status, testId } = props;

  const config = STATUS_CONFIG[status] ?? { label: status ?? '-', color: 'default' };

  return (
    <Chip
      size="small"
      variant="outlined"
      label={config.label}
      color={config.color}
      data-testid={testId}
    />
  );
});

StatusChip.displayName = 'StatusChip';

export default StatusChip;
