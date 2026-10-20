import { memo, useMemo } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import { useSecurityAuditListQuery } from '@/api/governance.api';
import DrawerShell from '@/pages/GovernancePage/components/OverviewTab/components/DrawerShell';
import { formatDateTime } from '@/pages/GovernancePage/components/OverviewTab/helpers/governance.helpers';
import { useDrawerPagination } from '@/pages/GovernancePage/components/OverviewTab/hooks/useDrawerPagination.hooks';

/**
 * Recent security audit events, newest first. `filters` are query filters of the audit view
 * (for example `{ would_deny: true }`); pass a stable object.
 */
const SecurityEventsDrawer = memo(props => {
  const { open, onClose, title, subtitle, filters } = props;

  const styles = useMemo(() => securityEventsDrawerStyles(), []);

  const { page, pageSize, getPaginationProps } = useDrawerPagination();

  const { data, isFetching, isError } = useSecurityAuditListQuery(
    { ...filters, limit: pageSize, offset: page * pageSize },
    { skip: !open, refetchOnMountOrArgChange: true },
  );

  const total = data?.total ?? 0;

  const rows = useMemo(
    () =>
      (data?.rows ?? []).map(row => ({
        key: row.event_id,
        testId: 'security-event-row',
        content: (
          <>
            <Box sx={styles.rowHead}>
              {row.reason_code && (
                <Chip
                  label={row.reason_code}
                  size="small"
                  variant="outlined"
                />
              )}
              <Typography
                variant="bodySmall"
                sx={styles.muted}
              >
                {formatDateTime(row.occurred_at)}
              </Typography>
            </Box>
            <Typography
              variant="bodySmall"
              sx={styles.detail}
            >
              {[
                row.event_type,
                row.user_ref && `user ${row.user_ref}`,
                row.project_id != null && `project ${row.project_id}`,
                row.agent_binding_ref && `binding ${row.agent_binding_ref}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </>
        ),
      })),
    [data?.rows, styles],
  );

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      testId="security-events-drawer"
      isLoading={isFetching}
      errorText={isError ? 'Failed to load security events.' : null}
      emptyText="No events recorded."
      rows={rows}
      paginationProps={getPaginationProps(total)}
    />
  );
});

SecurityEventsDrawer.displayName = 'SecurityEventsDrawer';

/** @type {MuiSx} */
const securityEventsDrawerStyles = () => ({
  rowHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  detail: ({ palette }) => ({
    color: palette.text.secondary,
    wordBreak: 'break-word',
  }),
});

export default SecurityEventsDrawer;
