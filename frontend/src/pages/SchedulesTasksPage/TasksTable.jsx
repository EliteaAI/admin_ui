import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import StopOutlined from '@mui/icons-material/StopOutlined';

import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { useTableSort } from '@/hooks/useTableSort';
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

const TASK_COLUMNS = [
  { field: 'meta', label: 'Task', width: '1fr', sortable: true },
  { field: 'task_id', label: 'Task ID', width: '1fr', sortable: true, hideBelow: 900 },
  { field: 'user', label: 'User', width: '12rem', sortable: true, hideBelow: 1100 },
  { field: 'started_at', label: 'Started', width: '13rem', sortable: true, hideBelow: 1000 },
  { field: 'status', label: 'Status', width: '7rem', sortable: true },
  { field: 'actions', label: '', width: '5rem', sortable: false },
];

function parseTaskName(meta) {
  if (!meta) return 'Unknown';
  try {
    const match = meta.match(/'task':\s*'([^']+)'/);
    if (match) return match[1];
  } catch {
    // ignore
  }
  return String(meta);
}

const TasksTable = memo(function TasksTable({ tasks = [], onStop, onOpenLogs }) {
  const [hoveredRowId, setHoveredRowId] = useState(null);

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'status',
    defaultDirection: 'asc',
    comparators: {
      meta: (a, b) => parseTaskName(a).localeCompare(parseTaskName(b)),
    },
  });

  const sortedTasks = useMemo(() => sortData(tasks), [sortData, tasks]);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: TASK_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '5rem',
  });

  const renderCell = useCallback((column, value, row) => {
    if (column.field === 'meta') {
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {parseTaskName(value)}
        </Typography>
      );
    }

    if (column.field === 'task_id') {
      return (
        <Tooltip title={value || ''}>
          <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellTextMono}>
            {value ? value.substring(0, 12) + '...' : '\u2014'}
          </Typography>
        </Tooltip>
      );
    }

    if (column.field === 'status') {
      const statusLower = (value || '').toLowerCase();
      const cfg = STATUS_CONFIG[statusLower] || { label: value || 'Unknown', color: 'default' };
      return <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
    }

    if (column.field === 'started_at') {
      let display = '\u2014';
      if (value) {
        try {
          display = new Date(value).toLocaleString();
        } catch {
          display = value;
        }
      }
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {display}
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
    <Box sx={styles.tableContainer}>
      <GridTableContainer
        isLoading={false}
        isEmpty={sortedTasks.length === 0}
        emptyMessage="No tasks running"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={handleSort}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {sortedTasks.map((row) => (
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
  );
});

const styles = {
  tableContainer: {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cellTextMono: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
  },
  actionsRow: {
    display: 'flex',
    gap: '0.125rem',
  },
};

export default TasksTable;
