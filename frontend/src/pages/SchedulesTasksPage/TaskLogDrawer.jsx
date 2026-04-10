import { memo, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseOutlined from '@mui/icons-material/CloseOutlined';

import { useTaskLogSocket } from '@/hooks/useTaskLogSocket';

const TaskLogDrawer = memo(function TaskLogDrawer({ open, taskId, onClose }) {
  const { logs, connected, clearLogs } = useTaskLogSocket(taskId, open);
  const logEndRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  // Clear logs when taskId changes
  useEffect(() => {
    clearLogs();
  }, [taskId, clearLogs]);

  const hasLogs = logs.length > 0;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={styles.drawer}>
      <Box sx={styles.root}>
        <Box sx={styles.header}>
          <Box sx={styles.headerLeft}>
            <Typography variant="h6" sx={styles.title}>
              Task Logs
            </Typography>
            <Box sx={styles.headerMeta}>
              {taskId && (
                <Typography variant="body2" color="text.metrics" sx={styles.taskIdText}>
                  {taskId}
                </Typography>
              )}
              <Chip
                label={connected ? 'Live' : hasLogs ? 'Cached' : 'Connecting'}
                size="small"
                color={connected ? 'success' : 'default'}
                variant="outlined"
                sx={styles.statusChip}
              />
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseOutlined fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={styles.logContainer}>
          {!hasLogs && !connected && taskId && (
            <Typography variant="body2" sx={styles.emptyText}>
              Loading logs...
            </Typography>
          )}
          {!hasLogs && connected && (
            <Typography variant="body2" sx={styles.emptyText}>
              Waiting for log output...
            </Typography>
          )}
          {logs.map((line, index) => (
            <Box key={index} component="pre" sx={styles.logLine}>
              {line}
            </Box>
          ))}
          <div ref={logEndRef} />
        </Box>
      </Box>
    </Drawer>
  );
});

const styles = {
  drawer: {
    '& .MuiDrawer-paper': {
      width: '50vw',
      maxWidth: '50vw',
    },
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    overflow: 'hidden',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  taskIdText: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusChip: {
    fontSize: '0.6875rem',
    height: '1.25rem',
    flexShrink: 0,
  },
  logContainer: ({ palette }) => ({
    flex: 1,
    overflow: 'auto',
    padding: '1rem',
    backgroundColor: palette.mode === 'dark' ? '#1a1a2e' : '#f5f5f5',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    lineHeight: 1.6,
  }),
  logLine: ({ palette }) => ({
    margin: 0,
    padding: '0 0.5rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    color: palette.mode === 'dark' ? '#e0e0e0' : '#333',
    '&:hover': {
      backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.metrics,
    fontStyle: 'italic',
    padding: '2rem',
    textAlign: 'center',
  }),
};

export default TaskLogDrawer;
