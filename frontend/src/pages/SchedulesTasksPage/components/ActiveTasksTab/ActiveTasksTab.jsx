import { memo, useCallback, useMemo, useState } from 'react';

import HubOutlined from '@mui/icons-material/HubOutlined';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';

import { useMaintenanceQuery, useMaintenanceSaveMutation } from '@/api/configuration.api';
import {
  useActiveTasksListQuery,
  useActiveTasksRefreshMutation,
  useActiveTasksStopMutation,
} from '@/api/tasks.api';
import TaskLogDrawer from '@/pages/SchedulesTasksPage/components/TaskLogDrawer';

import ActiveTasksNodeCard from './components/ActiveTasksNodeCard';
import StackDumpDrawer from './components/StackDumpDrawer';
import { formatClockUtc, taskMatchesSearch } from './helpers/activeTasks.helpers';

const ActiveTasksTab = memo(props => {
  const { search = '' } = props;

  const styles = activeTasksTabStyles();

  const { data, isLoading, isFetching, isError, error, refetch, fulfilledTimeStamp } =
    useActiveTasksListQuery(undefined, {
      pollingInterval: 15000,
    });
  const [refreshNode] = useActiveTasksRefreshMutation();
  const [stopTask] = useActiveTasksStopMutation();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [logTaskId, setLogTaskId] = useState(null);
  const [dumpTaskId, setDumpTaskId] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState({});
  const [pauseConfirmOpen, setPauseConfirmOpen] = useState(false);

  const { data: maintenanceData, isSuccess: maintenanceLoaded } = useMaintenanceQuery();
  const [saveMaintenance, { isLoading: pauseSaving }] = useMaintenanceSaveMutation();
  const tasksPaused = Boolean(maintenanceData?.tasks_paused);

  const nodes = useMemo(() => {
    const all = data?.nodes || [];
    const lower = search.trim().toLowerCase();
    if (!lower) return all;
    return all.map(node => ({
      ...node,
      tasks: (node.tasks || []).filter(t => taskMatchesSearch(t, lower, hiddenColumns)),
    }));
  }, [data, search, hiddenColumns]);

  const toggleColumn = useCallback(field => {
    setHiddenColumns(prev => ({ ...prev, [field]: !prev[field] }));
  }, []);

  // Global refresh: ask every node to re-broadcast pool + task state (the real
  // refresh, not just a cache re-read), then let the list refetch. Guarded
  // against overlap by globalRefreshing.
  const [globalRefreshing, setGlobalRefreshing] = useState(false);
  const handleManualRefresh = useCallback(async () => {
    if (globalRefreshing) return;
    const targets = (data?.nodes || []).map(n => n.node);
    if (targets.length === 0) {
      refetch();
      return;
    }
    setGlobalRefreshing(true);
    try {
      for (const nodeStr of targets) {
        await refreshNode({ node: nodeStr, scope: 'pool' }).unwrap();
        await refreshNode({ node: nodeStr, scope: 'task' }).unwrap();
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Refresh failed: ${err?.message || 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setGlobalRefreshing(false);
    }
  }, [globalRefreshing, data, refreshNode, refetch]);

  const handleOpenLogs = useCallback(taskId => {
    setLogTaskId(taskId);
  }, []);

  const handleCloseLogs = useCallback(() => {
    setLogTaskId(null);
  }, []);

  const handleOpenDump = useCallback(taskId => {
    setDumpTaskId(taskId);
  }, []);

  const handleCloseDump = useCallback(() => {
    setDumpTaskId(null);
  }, []);

  const handleStop = useCallback(
    async (nodeStr, taskId) => {
      try {
        await stopTask({ node: nodeStr, taskId }).unwrap();
        setSnackbar({
          open: true,
          message: `Stop signal sent for task ${taskId.substring(0, 12)}...`,
          severity: 'info',
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Stop failed: ${err?.message || 'Unknown error'}`,
          severity: 'error',
        });
      }
    },
    [stopTask],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleTogglePauseClick = useCallback(() => {
    setPauseConfirmOpen(true);
  }, []);

  const handleCancelPause = useCallback(() => {
    setPauseConfirmOpen(false);
  }, []);

  const handleConfirmPause = useCallback(async () => {
    const newValue = !tasksPaused;
    setPauseConfirmOpen(false);
    try {
      await saveMaintenance({ tasks_paused: newValue }).unwrap();
      setSnackbar({
        open: true,
        message: newValue
          ? 'New tasks are now paused. Running tasks are unaffected.'
          : 'New tasks are accepted again.',
        severity: newValue ? 'warning' : 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to toggle: ${err?.data?.error || err?.message || 'Unknown error'}`,
        severity: 'error',
      });
    }
  }, [tasksPaused, saveMaintenance]);

  const handleRetry = useCallback(() => refetch(), [refetch]);

  if (isLoading) {
    return (
      <Box sx={styles.loading}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (nodes.length === 0) {
    return (
      <Box sx={styles.emptyState}>
        <HubOutlined sx={styles.emptyIcon} />
        <Typography
          variant="bodyMedium"
          color="text.disabled"
        >
          {isError ? 'Could not load active tasks' : 'No task nodes available'}
        </Typography>
        <Button
          size="small"
          startIcon={isFetching ? <CircularProgress size={12} /> : <RefreshIcon sx={styles.buttonIcon} />}
          onClick={handleRetry}
          disabled={isFetching}
          sx={styles.columnsButton}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const lastRefreshed = formatClockUtc(fulfilledTimeStamp);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.toolbar}>
        {lastRefreshed && (
          <Typography
            variant="caption"
            sx={styles.lastRefreshed}
          >
            Last refreshed {lastRefreshed}
          </Typography>
        )}
        {tasksPaused && (
          <Chip
            label="New tasks paused"
            size="small"
            color="warning"
            variant="outlined"
            icon={<PauseCircleOutlined sx={styles.buttonIcon} />}
          />
        )}
        <Tooltip
          title={
            tasksPaused ? 'Resume accepting new tasks' : 'Reject new tasks; running tasks are unaffected'
          }
        >
          <Box component="span">
            <Button
              size="small"
              startIcon={
                pauseSaving ? (
                  <CircularProgress size={12} />
                ) : tasksPaused ? (
                  <PlayCircleOutlined sx={styles.buttonIcon} />
                ) : (
                  <PauseCircleOutlined sx={styles.buttonIcon} />
                )
              }
              onClick={handleTogglePauseClick}
              disabled={pauseSaving || !maintenanceLoaded}
              sx={styles.columnsButton}
            >
              {tasksPaused ? 'Resume new tasks' : 'Pause new tasks'}
            </Button>
          </Box>
        </Tooltip>
        <Tooltip title="Refresh all nodes">
          <Box component="span">
            <Button
              size="small"
              startIcon={
                globalRefreshing ? <CircularProgress size={12} /> : <RefreshIcon sx={styles.buttonIcon} />
              }
              onClick={handleManualRefresh}
              disabled={globalRefreshing}
              sx={styles.columnsButton}
            >
              Refresh
            </Button>
          </Box>
        </Tooltip>
      </Box>
      {isError && (
        <Alert
          severity="error"
          sx={styles.errorBanner}
        >
          Could not refresh active tasks
          {error?.status ? ` (${error.status})` : ''}. Showing last known data.
        </Alert>
      )}
      <Box sx={styles.scrollArea}>
        {nodes.map(node => (
          <ActiveTasksNodeCard
            key={node.node}
            node={node}
            onStop={handleStop}
            onOpenLogs={handleOpenLogs}
            onDump={handleOpenDump}
            searching={Boolean(search.trim())}
            hiddenColumns={hiddenColumns}
            onToggleColumn={toggleColumn}
          />
        ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <TaskLogDrawer
        open={logTaskId != null}
        taskId={logTaskId}
        onClose={handleCloseLogs}
      />

      <StackDumpDrawer
        open={dumpTaskId != null}
        taskId={dumpTaskId}
        onClose={handleCloseDump}
      />

      <Dialog
        open={pauseConfirmOpen}
        onClose={handleCancelPause}
      >
        <DialogTitle>{tasksPaused ? 'Resume new tasks?' : 'Pause new tasks?'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tasksPaused
              ? 'New tasks (predicts, index jobs, pipelines) will be accepted again on every node.'
              : 'New tasks (predicts, index jobs, pipelines) will be rejected on every node until resumed. Already-running tasks are left to finish; this does not show the maintenance splash to other users.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPause}>Cancel</Button>
          <Button
            onClick={handleConfirmPause}
            color={tasksPaused ? 'primary' : 'warning'}
            variant="contained"
            disabled={pauseSaving}
          >
            {tasksPaused ? 'Resume' : 'Pause'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

ActiveTasksTab.displayName = 'ActiveTasksTab';

/** @type {MuiSx} */
const activeTasksTabStyles = () => ({
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    padding: '0.5rem 1.5rem 0',
  },
  lastRefreshed: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.6875rem',
    marginRight: 'auto',
  }),
  errorBanner: {
    margin: '0.5rem 1.5rem 0',
  },
  columnsButton: {
    textTransform: 'none',
    fontSize: '0.75rem',
    minWidth: 'auto',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  loading: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
  },
  emptyIcon: ({ palette }) => ({
    fontSize: '3rem',
    color: palette.text.disabled,
  }),
  buttonIcon: {
    fontSize: '1rem',
  },
});

export default ActiveTasksTab;
