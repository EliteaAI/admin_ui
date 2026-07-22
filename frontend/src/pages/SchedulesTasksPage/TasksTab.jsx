import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';

import {
  useTaskNamesQuery,
  useTaskListQuery,
  useTaskStartMutation,
  useTaskStopMutation,
} from '@/api/tasksApi';

import TaskNamesList from './TaskNamesList';
import TaskDetail from './TaskDetail';
import TasksTable from './TasksTable';
import { TaskLogDrawer } from "@/components/LogViewerDrawer";

const COMPLETION_DELAY_MS = 15_000;

function parseTaskName(meta) {
  if (!meta) return '';
  try {
    const match = meta.match(/'task':\s*'([^']+)'/);
    if (match) return match[1];
  } catch {
    // ignore
  }
  return '';
}

const EMPTY_DATA = { names: [], tasks: [] };

const TasksTab = memo(function TasksTab({ search = '' }) {
  const { data: taskNamesData = EMPTY_DATA, isLoading: namesLoading } = useTaskNamesQuery();
  const taskNames = taskNamesData.names;
  const groupsMap = taskNamesData.groupsMap || {};
  const taskDescriptions = useMemo(() => {
    const map = {};
    (taskNamesData.tasks || []).forEach((t) => {
      if (t.description) map[t.name] = t.description;
    });
    return map;
  }, [taskNamesData.tasks]);
  const { data: taskListData } = useTaskListQuery(undefined, {
    pollingInterval: 5000,
  });
  const [startTask, { isLoading: isStarting }] = useTaskStartMutation();
  const [stopTask] = useTaskStopMutation();

  const [selectedTask, setSelectedTask] = useState(null);
  const [logTaskId, setLogTaskId] = useState(null);
  const autoCloseTimerRef = useRef(null);
  const prevTaskStatusRef = useRef(null);

  const allInstances = useMemo(() => taskListData?.rows || [], [taskListData]);

  // Find the task meta for the currently opened log drawer
  const logTaskMeta = useMemo(
    () => (logTaskId ? allInstances.find((row) => row.task_id === logTaskId) || null : null),
    [logTaskId, allInstances],
  );

  // Auto-close delay: when a running task finishes, start a countdown
  useEffect(() => {
    if (!logTaskId || !logTaskMeta) return;

    const currentStatus = (logTaskMeta.status || '').toLowerCase();
    const wasRunning = prevTaskStatusRef.current === 'running';
    const isNowFinished = ['done', 'finished', 'error', 'stopped'].includes(currentStatus);

    if (wasRunning && isNowFinished) {
      // Task just completed — start auto-close timer
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = setTimeout(() => {
        setLogTaskId(null);
        autoCloseTimerRef.current = null;
      }, COMPLETION_DELAY_MS);
    }

    prevTaskStatusRef.current = currentStatus;
  }, [logTaskId, logTaskMeta]);

  // Cleanup timer on unmount or when drawer closes
  useEffect(() => {
    if (!logTaskId && autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, [logTaskId]);

  const runningCounts = useMemo(() => {
    const counts = {};
    allInstances.forEach((row) => {
      const name = parseTaskName(row.meta);
      if (name && (row.status || '').toLowerCase() === 'running') {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return counts;
  }, [allInstances]);

  const filteredInstances = useMemo(() => {
    if (!selectedTask) return allInstances;
    return allInstances.filter((row) => parseTaskName(row.meta) === selectedTask);
  }, [allInstances, selectedTask]);

  const handleStart = useCallback(
    async (name, param) => {
      const result = await startTask({ name, param });
      // Auto-open logs: find the newest task for this name after a short delay
      if (result?.data?.ok) {
        setTimeout(() => {
          // Will be picked up by next poll cycle — open logs for newest matching task
        }, 500);
      }
    },
    [startTask],
  );

  const handleStop = useCallback(
    (taskId) => {
      stopTask({ taskId });
    },
    [stopTask],
  );

  const handleOpenLogs = useCallback((taskId) => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    const row = allInstances.find((r) => r.task_id === taskId);
    prevTaskStatusRef.current = row ? (row.status || '').toLowerCase() : null;
    setLogTaskId(taskId);
  }, [allInstances]);

  const handleCloseLogs = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setLogTaskId(null);
  }, []);

  return (
    <Box sx={styles.content}>
      <Box sx={styles.leftPanel}>
        <TaskNamesList
          taskNames={taskNames}
          taskDescriptions={taskDescriptions}
          groupsMap={groupsMap}
          selectedTask={selectedTask}
          onSelect={setSelectedTask}
          isLoading={namesLoading}
          runningCounts={runningCounts}
          search={search}
        />
      </Box>

      <Box sx={styles.rightPanel}>
        {!selectedTask && (
          <Box sx={styles.descriptionBox}>
            <Typography variant="bodyMedium" color="text.secondary" sx={styles.descriptionTitle}>
              Admin Tasks
            </Typography>
            <Typography variant="bodyMedium" color="text.metrics" component="div" sx={styles.descriptionText}>
              One-off maintenance operations registered by platform plugins.<br />
              Tasks include database migrations, data fixes, cache cleanup, and other admin utilities.<br />
              Select a task from the left panel to see its details and run it.<br />
              Each task can accept an optional parameter and streams live logs while running.<br />
              Running tasks auto-refresh every 5 seconds and can be stopped at any time.
            </Typography>
          </Box>
        )}
        {selectedTask ? (
          <TaskDetail
            key={selectedTask}
            taskName={selectedTask}
            taskDescription={taskDescriptions[selectedTask] || ''}
            instances={filteredInstances}
            onStart={handleStart}
            onStop={handleStop}
            onOpenLogs={handleOpenLogs}
            isStarting={isStarting}
          />
        ) : allInstances.length > 0 ? (
          <Box sx={styles.overviewPanel}>
            <TasksTable
              tasks={allInstances}
              onStop={handleStop}
              onOpenLogs={handleOpenLogs}
            />
          </Box>
        ) : (
          <Box sx={styles.emptyState}>
            <AssignmentOutlined sx={styles.emptyIcon} />
            <Typography variant="bodyMedium" color="text.disabled">
              Select a task from the list to start it
            </Typography>
          </Box>
        )}
      </Box>

      <TaskLogDrawer
        open={logTaskId != null}
        taskId={logTaskId}
        taskMeta={logTaskMeta}
        onClose={handleCloseLogs}
      />
    </Box>
  );
});

const styles = {
  content: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    overflow: 'hidden',
  },
  leftPanel: ({ palette }) => ({
    width: '16rem',
    flexShrink: 0,
    borderRight: `0.0625rem solid ${palette.border.lines}`,
    overflow: 'hidden',
  }),
  rightPanel: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  overviewPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
  },
  emptyIcon: {
    fontSize: '3rem',
    color: 'text.disabled',
  },
  descriptionBox: ({ palette }) => ({
    padding: '0.75rem 1rem',
    margin: '0.5rem 1.5rem 0.75rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
    flexShrink: 0,
  }),
  descriptionTitle: {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.875rem',
    marginBottom: '0.375rem',
  },
  descriptionText: {
    display: 'block',
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  },
};

export default TasksTab;
