import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import {
  formatTimestampWithZone,
  formatValue,
} from '@/pages/LifecycleAuditPage/helpers/lifecycleAudit.helpers';

const FIELDS = [
  ['event_id', 'Event ID'],
  ['event_type', 'Event type'],
  ['occurred_at', 'Occurred at'],
  ['scope', 'Scope'],
  ['source', 'Source'],
  ['result', 'Result'],
  ['failure_reason', 'Failure reason'],
  ['actor_type', 'Actor type'],
  ['actor_id', 'Actor ID'],
  ['actor_name', 'Actor name'],
  ['actor_email', 'Actor email'],
  ['project_id', 'Project ID'],
  ['project_name', 'Project name'],
  ['project_type', 'Project type'],
  ['user_id', 'User ID'],
  ['user_name', 'User name'],
  ['user_email', 'User email'],
  ['admin_access', 'Administrator access'],
  ['roles_before', 'Roles before'],
  ['roles_after', 'Roles after'],
  ['changes', 'Changes'],
  ['details', 'Details'],
  ['request_id', 'Request ID'],
  ['imported', 'Imported'],
];

const LifecycleAuditDetails = memo(props => {
  const { row } = props;

  const styles = lifecycleAuditDetailsStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="lifecycle-audit-details"
    >
      {FIELDS.map(([field, label]) => (
        <Box
          key={field}
          sx={styles.item}
        >
          <Typography
            variant="labelSmall"
            color="text.metrics"
          >
            {label}
          </Typography>
          <Typography
            variant="bodySmall"
            component="pre"
            sx={styles.value}
          >
            {field === 'occurred_at'
              ? `${formatTimestampWithZone(row.occurred_at)} (${row.occurred_at})`
              : formatValue(Array.isArray(row[field]) ? row[field].join(', ') || null : row[field])}
          </Typography>
        </Box>
      ))}
    </Box>
  );
});

LifecycleAuditDetails.displayName = 'LifecycleAuditDetails';

/** @type {MuiSx} */
const lifecycleAuditDetailsStyles = () => ({
  root: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))',
    gap: '0.75rem 1.5rem',
    padding: '1rem 1.5rem',
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  value: {
    margin: '0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'inherit',
  },
});

export default LifecycleAuditDetails;
