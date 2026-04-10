import { memo, useCallback, useMemo, useState } from 'react';

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
import TaskLogDrawer from './TaskLogDrawer';

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

const TasksTab = memo(function TasksTab() {
  const { data: taskNamesData = EMPTY_DATA, isLoading: namesLoading } = useTaskNamesQuery();
  const taskNames = taskNamesData.names;
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

  const allInstances = useMemo(() => taskListData?.rows || [], [taskListData]);

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
    (name, param) => {
      startTask({ name, param });
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
    setLogTaskId(taskId);
  }, []);

  const handleCloseLogs = useCallback(() => {
    setLogTaskId(null);
  }, []);

  return (
    <Box sx={styles.content}>
      <Box sx={styles.leftPanel}>
        <TaskNamesList
          taskNames={taskNames}
          taskDescriptions={taskDescriptions}
          selectedTask={selectedTask}
          onSelect={setSelectedTask}
          isLoading={namesLoading}
          runningCounts={runningCounts}
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
