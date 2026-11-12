import { memo, useCallback, useMemo, useState } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Link,
  Skeleton,
  Snackbar,
  Typography,
} from '@mui/material';

import { useEvalAutoItemsQuery, useEvalAutoRunNowMutation } from '@/api/evalAuto.api';
import { useScheduleListQuery } from '@/api/schedules.api';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { RouteDefinitions } from '@/constants/routes.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import {
  STATUS_CONFIG,
  STATUS_OPTIONS,
  describeCron,
  formatDate,
} from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

const RUN_SCHEDULE = 'eval_auto_run';
// Why a run-now was refused; any other reason is shown as the backend sent it.
const REFUSAL_MESSAGES = {
  maintenance: 'The platform is in maintenance mode, so no evaluation can start.',
};

const OverviewTab = memo(props => {
  const { onOpenAgents } = props;

  const styles = overviewTabStyles();

  const { hasPermission } = useCheckPermission();
  const canRun = hasPermission(PERMISSIONS.evalAuto.run);
  const canSeeSchedules = hasPermission(PERMISSIONS.scheduling.view);
  const canOpenRuntime = hasPermission(PERMISSIONS.runtime.plugins);

  // One page per status gives the counters without fetching every agent.
  const passed = useEvalAutoItemsQuery({ status: 'passed', limit: 1, offset: 0 });
  const warning = useEvalAutoItemsQuery({ status: 'warning', limit: 1, offset: 0 });
  const failed = useEvalAutoItemsQuery({ status: 'failed', limit: 1, offset: 0 });
  const notEvaluated = useEvalAutoItemsQuery({ status: 'not_evaluated', limit: 1, offset: 0 });
  const { data: schedules, isLoading: schedulesLoading } = useScheduleListQuery(undefined, {
    skip: !canSeeSchedules,
  });
  const [runNow, { isLoading: isStarting }] = useEvalAutoRunNowMutation();
  const [notice, setNotice] = useState(null);

  const counts = useMemo(
    () => ({
      passed: passed.data?.total,
      warning: warning.data?.total,
      failed: failed.data?.total,
      not_evaluated: notEvaluated.data?.total,
    }),
    [passed.data, warning.data, failed.data, notEvaluated.data],
  );
  const job = passed.data?.job;
  const schedule = useMemo(() => (schedules?.rows ?? []).find(row => row.name === RUN_SCHEDULE), [schedules]);

  const handleRunNow = useCallback(async () => {
    try {
      const result = await runNow().unwrap();
      setNotice({
        severity: 'success',
        message: `Job ${result.job_id} started: ${result.counters?.queued ?? 0} agent(s) queued. The counters update as agents finish; reload to see them.`,
      });
    } catch (err) {
      const reason = err?.data?.reason;
      const message =
        reason === 'job_running'
          ? `Job ${err.data.job_id} is still running.`
          : (REFUSAL_MESSAGES[reason] ?? err?.data?.error ?? reason ?? 'Failed to start the evaluation.');
      setNotice({ severity: 'warning', message });
    }
  }, [runNow]);

  if (schedulesLoading) {
    return (
      <Box sx={styles.container}>
        <Skeleton
          variant="rectangular"
          height="8rem"
        />
      </Box>
    );
  }

  return (
    <Box
      sx={styles.container}
      data-testid="eval-auto-overview"
    >
      <Box sx={styles.headerRow}>
        <Box sx={styles.scheduleInfo}>
          <Box sx={styles.inline}>
            <Typography variant="headingSmall">Scheduled evaluation</Typography>
            {schedule && (
              <Chip
                size="small"
                variant="outlined"
                label={schedule.active ? 'On' : 'Off'}
                color={schedule.active ? 'primary' : 'default'}
                data-testid="eval-auto-enabled-chip"
              />
            )}
          </Box>
          {/* On/off and the cadence are the Runtime config's; this page only shows them. */}
          {canOpenRuntime ? (
            <Link
              component={RouterLink}
              to={`${RouteDefinitions.Configuration}#runtime`}
              variant="bodySmall"
              data-testid="eval-auto-runtime-link"
            >
              Turn on or off, and set the schedule, in Configuration → Runtime
            </Link>
          ) : (
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              Turned on or off, and scheduled, in Configuration → Runtime
            </Typography>
          )}
          {schedule && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              data-testid="eval-auto-cron"
            >
              {schedule.active ? describeCron(schedule.cron) : 'The schedule is off'} · last tick{' '}
              {formatDate(schedule.last_run)}
            </Typography>
          )}
          <Typography
            variant="bodySmall"
            color="text.secondary"
            data-testid="eval-auto-last-job"
          >
            {job
              ? `Last job ${job.id} (${job.trigger}) started ${formatDate(job.started_at)}, ${
                  job.finished_at ? `finished ${formatDate(job.finished_at)}` : 'still running'
                } · queued ${job.counters?.queued ?? 0}, carried forward ${job.counters?.carried_forward ?? 0}, deferred ${
                  job.counters?.deferred ?? 0
                }`
              : 'No job has run yet.'}
          </Typography>
        </Box>
        {canRun && (
          <Button
            variant="contained"
            startIcon={<PlayArrowRounded />}
            disabled={isStarting}
            onClick={handleRunNow}
            data-testid="eval-auto-run-now"
          >
            Run now
          </Button>
        )}
      </Box>

      <Box sx={styles.cards}>
        {STATUS_OPTIONS.map(status => (
          <Card
            key={status}
            variant="outlined"
            sx={styles.card}
          >
            <CardActionArea
              sx={styles.cardAction}
              onClick={() => onOpenAgents(status)}
              data-testid={`eval-auto-count-${status}`}
            >
              <Typography variant="headingLarge">{counts[status] ?? '-'}</Typography>
              <Typography
                variant="bodySmall"
                color={
                  STATUS_CONFIG[status].color === 'default'
                    ? 'text.secondary'
                    : `${STATUS_CONFIG[status].color}.main`
                }
              >
                {STATUS_CONFIG[status].label}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      <Snackbar
        open={!!notice}
        autoHideDuration={6000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notice?.severity ?? 'info'}
          onClose={() => setNotice(null)}
          data-testid="eval-auto-notice"
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

OverviewTab.displayName = 'OverviewTab';

/** @type {MuiSx} */
const overviewTabStyles = () => ({
  container: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    overflow: 'auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
  },
  scheduleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  inline: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
    gap: '1rem',
  },
  card: {
    borderRadius: '0.5rem',
  },
  cardAction: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.25rem',
  },
});

export default OverviewTab;
