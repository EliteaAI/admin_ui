import { memo } from 'react';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { Alert, Box, Drawer, IconButton, Skeleton, Typography } from '@mui/material';

import { useEvalAutoHistoryQuery } from '@/api/evalAuto.api';
import {
  formatCoverage,
  formatDate,
  formatScore,
  reasonLabel,
  stateLabel,
  tierLabel,
} from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

import StatusChip from './StatusChip';

const SKELETON_COUNT = 3;

/** One agent's scheduled results, newest first. */
const AgentHistoryDrawer = memo(props => {
  const { item, onClose } = props;

  const styles = agentHistoryDrawerStyles();

  const { data, isLoading, isError } = useEvalAutoHistoryQuery(
    { projectId: item?.project_id, applicationId: item?.application_id },
    { skip: !item },
  );
  const rows = data?.rows ?? [];
  const total = data?.total ?? rows.length;

  return (
    <Drawer
      anchor="right"
      open={Boolean(item)}
      onClose={onClose}
      slotProps={{ paper: { sx: styles.paper } }}
    >
      <Box sx={styles.header}>
        <Box sx={styles.headerText}>
          <Typography variant="headingSmall">{item?.agent_name ?? 'Agent'}</Typography>
          <Typography
            variant="bodySmall"
            sx={styles.muted}
          >
            Project {item?.project_id} · agent {item?.application_id}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close"
          data-testid="eval-auto-history-close"
        >
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={styles.body}
        data-testid="eval-auto-history"
      >
        {isError && <Alert severity="error">Failed to load the history.</Alert>}

        {!isLoading && !isError && total > rows.length && (
          <Typography
            variant="bodySmall"
            sx={styles.muted}
            data-testid="eval-auto-history-total"
          >
            Showing the latest {rows.length} of {total} results.
          </Typography>
        )}

        {isLoading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height="4rem"
            />
          ))}

        {!isLoading && !isError && rows.length === 0 && (
          <Typography
            variant="bodyMedium"
            sx={styles.muted}
          >
            No scheduled evaluation yet.
          </Typography>
        )}

        {rows.map(row => (
          <Box
            key={row.id}
            sx={styles.row}
            data-testid={`eval-auto-history-${row.id}`}
          >
            <Box sx={styles.inline}>
              {stateLabel(row.state) ? (
                <Typography
                  variant="labelSmall"
                  sx={styles.muted}
                  data-testid={`eval-auto-history-state-${row.id}`}
                >
                  {stateLabel(row.state)}
                </Typography>
              ) : (
                <>
                  <StatusChip status={row.status} />
                  <Typography variant="bodySmall">
                    Score {formatScore(row.headline_score)} · coverage {formatCoverage(row.coverage)}
                  </Typography>
                </>
              )}
            </Box>
            <Typography
              variant="bodySmall"
              sx={styles.muted}
            >
              {formatDate(row.finished_at ?? row.created_at)} · job {row.job_id} ·{' '}
              {tierLabel(row.dataset_tier)}
              {row.eval_run_id ? ` · run ${row.eval_run_id}` : ''}
            </Typography>
            {row.reason_code && (
              <Typography
                variant="bodySmall"
                sx={styles.muted}
              >
                {reasonLabel(row.reason_code)}
                {row.reason_detail ? `: ${row.reason_detail}` : ''}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Drawer>
  );
});

AgentHistoryDrawer.displayName = 'AgentHistoryDrawer';

/** @type {MuiSx} */
const agentHistoryDrawerStyles = () => ({
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
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  inline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  row: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    paddingBottom: '0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
});

export default AgentHistoryDrawer;
