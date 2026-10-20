import { memo } from 'react';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { Alert, Box, Chip, Drawer, IconButton, Skeleton, Typography } from '@mui/material';

import { useSecurityAuditListQuery } from '@/api/governance.api';
import { GridTablePagination } from '@/components/GridTable';
import { formatDateTime } from '@/pages/GovernancePage/helpers/governance.helpers';
import { useDrawerPagination } from '@/pages/GovernancePage/hooks/useDrawerPagination.hooks';

/**
 * Recent security audit events, newest first. `filters` are query filters of the audit view
 * (for example `{ would_deny: true }`); pass a stable object.
 */
const SecurityEventsDrawer = memo(props => {
  const { open, onClose, title, subtitle, filters } = props;

  const styles = securityEventsDrawerStyles();

  const { page, pageSize, getPaginationProps } = useDrawerPagination();

  const { data, isFetching, isError } = useSecurityAuditListQuery(
    { ...filters, limit: pageSize, offset: page * pageSize },
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
        <Box sx={styles.headerText}>
          <Typography variant="headingSmall">{title}</Typography>
          {subtitle && (
            <Typography
              variant="bodySmall"
              sx={styles.subtitle}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
        >
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={styles.body}
        data-testid="security-events-drawer"
      >
        {isError && <Alert severity="error">Failed to load security events.</Alert>}

        {isFetching &&
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height="3rem"
            />
          ))}

        {!isFetching && !isError && rows.length === 0 && (
          <Typography
            variant="bodyMedium"
            sx={styles.subtitle}
          >
            No events recorded.
          </Typography>
        )}

        {!isFetching &&
          rows.map(row => (
            <Box
              key={row.event_id}
              sx={styles.row}
              data-testid="security-event-row"
            >
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
                  sx={styles.subtitle}
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
            </Box>
          ))}

        {total > 0 && <GridTablePagination {...getPaginationProps(total)} />}
      </Box>
    </Drawer>
  );
});

SecurityEventsDrawer.displayName = 'SecurityEventsDrawer';

/** @type {MuiSx} */
const securityEventsDrawerStyles = () => ({
  paper: {
    width: { xs: '100%', sm: '30rem' },
    padding: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  subtitle: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
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
  detail: ({ palette }) => ({
    color: palette.text.secondary,
    wordBreak: 'break-word',
  }),
});

export default SecurityEventsDrawer;
