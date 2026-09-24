import { memo, useEffect, useMemo, useState } from 'react';

import { Box, Chip, Typography } from '@mui/material';

import { LogViewerDrawer } from '@/components/LogViewerDrawer';
import { useTaskLogSocket } from '@/pages/SchedulesTasksPage/hooks/useTaskLogSocket.hooks';

const COMPLETION_DELAY_SEC = 15;

const TaskLogDrawer = memo(props => {
  const { open, taskId, taskMeta, onClose } = props;

  const styles = taskLogDrawerStyles();

  const { logs, connected, clearLogs } = useTaskLogSocket(taskId, open);

  const logText = useMemo(() => logs.join('\n'), [logs]);

  useEffect(() => {
    clearLogs();
  }, [taskId, clearLogs]);

  const taskStatus = taskMeta?.status || '';
  const isFinished = ['done', 'finished', 'error', 'stopped'].includes(taskStatus.toLowerCase());
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!open || !isFinished) {
      setCountdown(0);
      return;
    }
    setCountdown(COMPLETION_DELAY_SEC);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, isFinished, taskId, onClose]);

  const hasLogs = logs.length > 0;

  const statusLabel = taskStatus
    ? taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1).toLowerCase()
    : 'Unknown';

  const statusColor = (() => {
    const s = taskStatus.toLowerCase();
    if (s === 'running') return 'success';
    if (s === 'error') return 'error';
    if (s === 'stopped') return 'warning';
    return 'default';
  })();

  const placeholder = !connected && taskId ? 'Loading logs...' : 'Waiting for log output...';

  const headerExtra = (
    <Chip
      label={connected ? 'Live' : hasLogs ? 'Cached' : 'Connecting'}
      size="small"
      color={connected ? 'success' : 'default'}
      variant="outlined"
      sx={styles.statusChip}
    />
  );

  const metaBar = taskMeta ? (
    <Box sx={styles.metaBar}>
      <Chip
        label={statusLabel}
        size="small"
        color={statusColor}
        variant="outlined"
      />
      {taskMeta.user && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={styles.metaItem}
        >
          User: {taskMeta.user}
        </Typography>
      )}
      {taskMeta.started_at && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={styles.metaItem}
        >
          Started: {new Date(taskMeta.started_at).toLocaleString()}
        </Typography>
      )}
      {isFinished && countdown > 0 && (
        <Typography
          variant="body2"
          color="text.metrics"
          sx={styles.countdownText}
        >
          Auto-close in {countdown}s
        </Typography>
      )}
    </Box>
  ) : null;

  return (
    <LogViewerDrawer
      open={open}
      onClose={onClose}
      title="Task Logs"
      subtitle={taskId}
      logs={logText}
      placeholder={placeholder}
      downloadFilename={`task-logs-${taskId || 'unknown'}`}
      headerExtra={headerExtra}
      metaBar={metaBar}
    />
  );
});

TaskLogDrawer.displayName = 'TaskLogDrawer';

/** @type {MuiSx} */
const taskLogDrawerStyles = () => ({
  statusChip: {
    fontSize: '0.6875rem',
    height: '1.25rem',
    flexShrink: 0,
  },
  metaBar: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.subtle.faint,
    flexWrap: 'wrap',
  }),
  metaItem: {
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
  },
  countdownText: {
    fontSize: '0.75rem',
    whiteSpace: 'nowrap',
    marginLeft: 'auto',
  },
});

export default TaskLogDrawer;
