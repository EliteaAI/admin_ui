import { memo } from 'react';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { Alert, Box, Chip, Drawer, IconButton, Skeleton, Typography } from '@mui/material';

import { useGovernanceSettingsHistoryListQuery } from '@/api/governance.api';
import { GridTablePagination } from '@/components/GridTable';
import { formatDateTime } from '@/pages/GovernancePage/helpers/governance.helpers';
import { useDrawerPagination } from '@/pages/GovernancePage/hooks/useDrawerPagination.hooks';

import { modeLabel } from '../helpers/governanceSettings.helpers';

const flagText = (label, on) => `${label}: ${on ? 'on' : 'off'}`;

const SettingsHistoryDrawer = memo(props => {
  const { open, onClose, descriptions } = props;

  const styles = settingsHistoryDrawerStyles();

  const { page, pageSize, getPaginationProps } = useDrawerPagination();

  const { data, isFetching, isError } = useGovernanceSettingsHistoryListQuery(
    { limit: pageSize, offset: page * pageSize },
    { skip: !open, refetchOnMountOrArgChange: true },
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: styles.paper }}
    >
      <Box sx={styles.header}>
        <Typography variant="headingSmall">Governance history</Typography>
        <IconButton
          size="small"
          onClick={onClose}
        >
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={styles.body}
        data-testid="governance-history-drawer"
      >
        {isError && <Alert severity="error">Failed to load the history.</Alert>}

        {data?.table_present === false && (
          <Alert severity="info">{descriptions.preflight.table_missing}</Alert>
        )}

        {isFetching &&
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height="4rem"
            />
          ))}

        {!isFetching && !isError && data?.table_present !== false && rows.length === 0 && (
          <Typography
            variant="bodyMedium"
            sx={styles.muted}
          >
            No changes recorded yet.
          </Typography>
        )}

        {!isFetching &&
          rows.map(row => (
            <Box
              key={row.revision}
              sx={styles.row}
              data-testid={`governance-history-row-${row.revision}`}
            >
              <Box sx={styles.rowHead}>
                <Typography variant="labelMedium">Revision {row.revision}</Typography>
                <Chip
                  label={modeLabel(descriptions, row.mode)}
                  size="small"
                  variant="outlined"
                />
              </Box>
              <Typography
                variant="bodyMedium"
                sx={styles.note}
              >
                {row.change_note}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.muted}
              >
                {[
                  row.policy_revision && `Policy revision ${row.policy_revision}`,
                  row.environment && `Environment ${row.environment}`,
                  flagText('Legacy tokens', row.flags?.admit_legacy_pat),
                  flagText('Runtime bindings', row.flags?.allow_runtime_domain_binding),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
              <Typography
                variant="bodySmall"
                sx={styles.muted}
              >
                {row.changed_by?.email ?? (row.changed_by ? `User ${row.changed_by.id}` : 'Unknown user')}
                {' · '}
                {formatDateTime(row.changed_at)}
              </Typography>
            </Box>
          ))}

        {total > 0 && <GridTablePagination {...getPaginationProps(total)} />}
      </Box>
    </Drawer>
  );
});

SettingsHistoryDrawer.displayName = 'SettingsHistoryDrawer';

/** @type {MuiSx} */
const settingsHistoryDrawerStyles = () => ({
  paper: {
    width: { xs: '100%', sm: '30rem' },
    padding: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  row: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    paddingBottom: '0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  rowHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  note: {
    wordBreak: 'break-word',
  },
});

export default SettingsHistoryDrawer;
