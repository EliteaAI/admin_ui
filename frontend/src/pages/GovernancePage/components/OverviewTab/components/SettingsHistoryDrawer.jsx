import { memo, useMemo } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import { useGovernanceSettingsHistoryListQuery } from '@/api/governance.api';
import DrawerShell from '@/pages/GovernancePage/components/OverviewTab/components/DrawerShell';
import { formatDateTime } from '@/pages/GovernancePage/components/OverviewTab/helpers/governance.helpers';
import { modeLabel } from '@/pages/GovernancePage/components/OverviewTab/helpers/governanceSettings.helpers';
import { useDrawerPagination } from '@/pages/GovernancePage/components/OverviewTab/hooks/useDrawerPagination.hooks';

const flagText = (label, on) => `${label}: ${on ? 'on' : 'off'}`;

const SettingsHistoryDrawer = memo(props => {
  const { open, onClose, descriptions } = props;

  const styles = useMemo(() => settingsHistoryDrawerStyles(), []);

  const { page, pageSize, getPaginationProps } = useDrawerPagination();

  const { data, isFetching, isError } = useGovernanceSettingsHistoryListQuery(
    { limit: pageSize, offset: page * pageSize },
    { skip: !open, refetchOnMountOrArgChange: true },
  );

  const total = data?.total ?? 0;

  const rows = useMemo(
    () =>
      (data?.rows ?? []).map(row => ({
        key: row.revision,
        testId: `governance-history-row-${row.revision}`,
        content: (
          <>
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
          </>
        ),
      })),
    [data?.rows, descriptions, styles],
  );

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title="Governance history"
      testId="governance-history-drawer"
      isLoading={isFetching}
      errorText={isError ? 'Failed to load the history.' : null}
      notice={data?.table_present === false ? descriptions.preflight.table_missing : null}
      emptyText="No changes recorded yet."
      skeletonHeight="4rem"
      rows={rows}
      paginationProps={getPaginationProps(total)}
    />
  );
});

SettingsHistoryDrawer.displayName = 'SettingsHistoryDrawer';

/** @type {MuiSx} */
const settingsHistoryDrawerStyles = () => ({
  rowHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  note: {
    wordBreak: 'break-word',
  },
});

export default SettingsHistoryDrawer;
