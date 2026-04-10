import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import PlayArrowOutlined from '@mui/icons-material/PlayArrowOutlined';
import StopOutlined from '@mui/icons-material/StopOutlined';

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDarkInit, vscodeLightInit } from '@uiw/codemirror-theme-vscode';

import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
} from '@/components/GridTable';

const STATUS_CONFIG = {
  running: { label: 'Running', color: 'success' },
  done: { label: 'Done', color: 'default' },
  finished: { label: 'Finished', color: 'default' },
  error: { label: 'Error', color: 'error' },
  stopped: { label: 'Stopped', color: 'warning' },
};

const INSTANCE_COLUMNS = [
  { field: 'status', label: 'Status', width: '7rem', sortable: false },
  { field: 'task_id', label: 'Task ID', width: '1fr', sortable: false },
  { field: 'user', label: 'User', width: '12rem', sortable: false, hideBelow: 900 },
  { field: 'started_at', label: 'Started', width: '13rem', sortable: false, hideBelow: 800 },
  { field: 'actions', label: '', width: '5rem', sortable: false },
];

const jsonExtensions = [json()];

function formatDateTime(iso) {
  if (!iso) return '\u2014';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

const TaskDetail = memo(function TaskDetail({
  taskName,
  taskDescription,
  instances,
  onStart,
  onStop,
  onOpenLogs,
  isStarting,
}) {
  const [param, setParam] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const cmTheme = useMemo(
    () =>
      isDark
        ? vscodeDarkInit({
            settings: {
              background: theme.palette.background.default,
              gutterBackground: theme.palette.background.default,
            },
          })
        : vscodeLightInit({
            settings: {
              background: theme.palette.background.default,
              gutterBackground: theme.palette.background.default,
            },
          }),
    [isDark, theme.palette.background.default],
  );

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: INSTANCE_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '5rem',
  });

  const handleStart = useCallback(() => {
    onStart(taskName, param);
    setParam('');
  }, [taskName, param, onStart]);

  const renderCell = useCallback((column, value) => {
    if (column.field === 'status') {
      const statusLower = (value || '').toLowerCase();
      const cfg = STATUS_CONFIG[statusLower] || { label: value || 'Unknown', color: 'default' };
      return <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
    }

    if (column.field === 'task_id') {
      return (
        <Tooltip title={value || ''}>
          <Typography variant="bodyMedium" sx={styles.cellTextMono}>
            {value || '\u2014'}
          </Typography>
        </Tooltip>
      );
    }

    if (column.field === 'started_at') {
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {formatDateTime(value)}
        </Typography>
      );
    }

    if (column.field === 'user') {
      return (
        <Tooltip title={value || ''}>
          <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
            {value || '\u2014'}
          </Typography>
        </Tooltip>
      );
    }

    return (
      <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
        {value || '\u2014'}
      </Typography>
    );
  }, []);

  const renderActions = useCallback(
    (row) => {
      const isRunning = (row.status || '').toLowerCase() === 'running';
      return (
        <Box sx={styles.actionsRow}>
          <Tooltip title="View logs">
            <IconButton size="small" onClick={() => onOpenLogs(row.task_id)}>
              <DescriptionOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {isRunning && (
            <Tooltip title="Stop task">
              <IconButton size="small" onClick={() => onStop(row.task_id)}>
                <StopOutlined fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    },
    [onStop, onOpenLogs],
  );

  return (
    <Box sx={styles.container}>
      <Box sx={styles.header}>
        <Box sx={styles.headerLeft}>
          <Typography sx={styles.title}>{taskName}</Typography>
          {taskDescription && (
            <Typography variant="bodySmall" color="text.metrics" sx={styles.description}>
              {taskDescription}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<PlayArrowOutlined />}
          onClick={handleStart}
          disabled={isStarting}
          sx={styles.startButton}
        >
          Start
        </Button>
      </Box>

      <Box sx={styles.editorArea}>
        <Typography variant="bodySmall" color="text.metrics" sx={styles.editorLabel}>
          Parameters (JSON)
        </Typography>
        <Box sx={styles.editorWrapper}>
          <CodeMirror
            value={param}
            onChange={setParam}
            extensions={jsonExtensions}
            theme={cmTheme}
            placeholder='{"key": "value"}'
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
            }}
            style={{ fontSize: '0.8125rem' }}
          />
        </Box>
      </Box>

      <Box sx={styles.tableArea}>
        <GridTableContainer
          isLoading={false}
          isEmpty={instances.length === 0}
          emptyMessage="No recent runs for this task"
        >
          <GridTableHeader
            columns={visibleColumns}
            gridTemplateColumns={gridTemplateColumns}
            showCheckbox={false}
          />

          <GridTableBody>
            {instances.map((row) => (
              <GridTableRow
                key={row.task_id}
                row={row}
                columns={dataColumns}
                isHovered={hoveredRowId === row.task_id}
                onMouseEnter={() => setHoveredRowId(row.task_id)}
                onMouseLeave={() => setHoveredRowId(null)}
                gridTemplateColumns={gridTemplateColumns}
                showCheckbox={false}
                renderCell={renderCell}
                renderActions={renderActions}
              />
            ))}
          </GridTableBody>
        </GridTableContainer>
      </Box>
    </Box>
  );
});

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem 0',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  title: {
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  description: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
  },
  startButton: {
    textTransform: 'none',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    fontSize: '0.8125rem',
    flexShrink: 0,
  },
  editorArea: {
    padding: '0.5rem 1.5rem 0.75rem',
    flexShrink: 0,
  },
  editorLabel: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.375rem',
  },
  editorWrapper: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.375rem',
    overflow: 'hidden',
    '& .cm-editor': {
      minHeight: '4rem',
      maxHeight: '10rem',
    },
    '& .cm-scroller': {
      overflow: 'auto',
    },
  }),
  tableArea: {
    flex: 1,
    overflow: 'auto',
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cellTextMono: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: 'text.secondary',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actionsRow: {
    display: 'flex',
    gap: '0.125rem',
  },
};

export default TaskDetail;
