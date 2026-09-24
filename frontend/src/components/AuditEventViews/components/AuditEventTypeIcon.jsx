import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import {
  DEFAULT_EVENT_CONFIG,
  EVENT_TYPE_CONFIG,
} from '@/components/AuditEventViews/constants/auditEvents.constants';

const AuditEventTypeIcon = memo(props => {
  const { eventType, size = '1.125rem' } = props;

  const config = EVENT_TYPE_CONFIG[eventType] || DEFAULT_EVENT_CONFIG;
  const IconComponent = config.icon;

  const styles = auditEventTypeIconStyles(size, config.colorKey);

  return (
    <Tooltip
      title={config.label}
      placement="top"
      arrow
    >
      <Box sx={styles.root}>
        <IconComponent sx={styles.icon} />
      </Box>
    </Tooltip>
  );
});

AuditEventTypeIcon.displayName = 'AuditEventTypeIcon';

/** @type {MuiSx} */
const auditEventTypeIconStyles = (size, colorKey) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: ({ palette }) => ({
    fontSize: size,
    color: palette.auditEvent[colorKey],
  }),
});

export default AuditEventTypeIcon;
