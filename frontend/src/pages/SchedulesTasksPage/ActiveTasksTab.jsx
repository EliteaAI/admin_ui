import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import StopOutlined from '@mui/icons-material/StopOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';

import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
} from '@/components/GridTable';

import {
  useActiveTasksListQuery,
  useActiveTasksRefreshMutation,
  useActiveTasksStopMutation,
} from '@/api/tasksApi';

const POOL_COLUMNS = [
  { field: 'pool', label: 'Pool', width: '1fr', sortable: false },
  { field: 'ident', label: 'Ident', width: '1fr', sortable: false },
  { field: 'task_limit', label: 'Task Limit', width: '8rem', sortable: false },
  { field: 'running_tasks', label: 'Running', width: '8rem', sortable: false },
];

const TASK_COLUMNS = [
  { field: 'task_id', label: 'Task ID', width: '1fr', sortable: false },
  { field: 'status', label: 'Status', width: '7rem', sortable: false },
  { field: 'meta', label: 'Meta', width: '1fr', sortable: false },
  { field: 'runner', label: 'Runner', width: '1fr', sortable: false, hideBelow: 900 },
  { field: 'actions', label: '', width: '4rem', sortable: false },
];

const STATUS_CONFIG = {
  running: { label: 'Running', color: 'success' },
  done: { label: 'Done', color: 'default' },
  error: { label: 'Error', color: 'error' },
  stopped: { label: 'Stopped', color: 'warning' },
};

function parseMeta(meta) {
  if (!meta) return '';
  try {
    const match = meta.match(/'task':\s*'([^']+)'/);
    if (match) return match[1];
  } catch {
    // ignore
  }
  return String(meta).length > 60 ? String(meta).substring(0, 60) + '...' : String(meta);
}

function NodeCard({ node, onRefresh, onRefreshScope, onStop, refreshing, refreshingScope }) {
  const [expanded, setExpanded] = useState(true);
  const [poolExpanded, setPoolExpanded] = useState(true);
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const totalRunning = node.tasks?.length || 0;
  const totalCapacity = (node.pools || []).reduce((sum, p) => sum + (p.task_limit || 0), 0);

  const poolColumns = useResponsiveColumns({
    columns: POOL_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '0',
  });

  const taskColumns = useResponsiveColumns({
    columns: TASK_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '4rem',
  });

  const handleRefresh = useCallback(() => {
    onRefresh(node.node);
  }, [node.node, onRefresh]);

  const renderPoolCell = useCallback((column, value) => {
    if (column.field === 'running_tasks') {
      const limit = null; // we show limit in its own column
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {value ?? '\u2014'}
        </Typography>
      );
    }
    return (
      <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
        {value ?? '\u2014'}
      </Typography>
    );
  }, []);

  const renderTaskCell = useCallback((column, value, row) => {
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
    if (column.field === 'meta') {
      return (
        <Tooltip title={value || ''}>
          <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
            {parseMeta(value)}
          </Typography>
        </Tooltip>
      );
    }
    if (column.field === 'runner') {
      return (
        <Tooltip title={value || ''}>
          <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
            {value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : '\u2014'}
          </Typography>
        </Tooltip>
      );
    }
    return (
      <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
        {value ?? '\u2014'}
      </Typography>
    );
  }, []);

  const renderTaskActions = useCallback(
    (row) => {
      const status = (row.status || '').toLowerCase();
      if (status !== 'running') return null;
      return (
        <Tooltip title="Stop task">
          <IconButton size="small" onClick={() => onStop(node.node, row.task_id)}>
            <StopOutlined fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      );
    },
    [node.node, onStop],
  );

  return (
    <Box sx={styles.nodeCard}>
      <Box sx={styles.nodeHeader} onClick={() => setExpanded((v) => !v)}>
        <Box sx={styles.nodeHeaderLeft}>
          <ExpandMoreIcon
            sx={[styles.expandIcon, !expanded && styles.expandIconCollapsed]}
          />
          <Typography variant="body2" sx={styles.nodeTitle}>
            {node.plugin}
          </Typography>
          <Chip
            label={`${totalRunning} task${totalRunning !== 1 ? 's' : ''}`}
            size="small"
            color={totalRunning > 0 ? 'success' : 'default'}
            variant="outlined"
            sx={styles.countChip}
          />
          {totalCapacity > 0 && (
            <Typography variant="caption" sx={styles.capacityText}>
              capacity: {totalCapacity}
            </Typography>
          )}
        </Box>
        <Button
          size="small"
          startIcon={refreshing ? <CircularProgress size={12} /> : <RefreshIcon sx={{ fontSize: '0.875rem' }} />}
          onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
          disabled={refreshing}
          sx={styles.refreshButton}
        >
          Refresh
        </Button>
      </Box>

      <Collapse in={expanded}>
        <Box sx={styles.nodeBody}>
          {/* Pool State */}
          {node.pools?.length > 0 && (
            <Box sx={styles.tableSection}>
              <Box sx={styles.subSectionHeader}>
                <Box
                  sx={styles.subSectionToggle}
                  onClick={() => setPoolExpanded((v) => !v)}
                >
                  <ExpandMoreIcon
                    sx={[styles.subExpandIcon, !poolExpanded && styles.expandIconCollapsed]}
                  />
                  <Typography variant="caption" sx={styles.tableSectionTitle}>
                    Pool State
                  </Typography>
                  <Chip
                    label={node.pools.length}
                    size="small"
                    variant="outlined"
                    sx={styles.subCountChip}
                  />
                </Box>
                <Tooltip title="Refresh pool state">
                  <IconButton
                    size="small"
                    onClick={() => onRefreshScope(node.node, 'pool')}
                    disabled={refreshingScope === 'pool'}
                    sx={styles.subRefreshButton}
                  >
                    {refreshingScope === 'pool' ? <CircularProgress size={12} /> : <RefreshIcon sx={{ fontSize: '0.875rem' }} />}
                  </IconButton>
                </Tooltip>
              </Box>
              <Collapse in={poolExpanded}>
                <Box sx={styles.tableScroll}>
                  <GridTableContainer isLoading={false} isEmpty={false}>
                    <GridTableHeader
                      columns={poolColumns.visibleColumns}
                      gridTemplateColumns={poolColumns.gridTemplateColumns}
                      showCheckbox={false}
                    />
                    <GridTableBody>
                      {node.pools.map((pool, idx) => (
                        <GridTableRow
                          key={pool.ident || idx}
                          row={pool}
                          columns={poolColumns.dataColumns}
                          gridTemplateColumns={poolColumns.gridTemplateColumns}
                          showCheckbox={false}
                          renderCell={renderPoolCell}
                        />
                      ))}
                    </GridTableBody>
                  </GridTableContainer>
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Active Tasks */}
          <Box sx={styles.tableSection}>
            <Box sx={styles.subSectionHeader}>
              <Box
                sx={styles.subSectionToggle}
                onClick={() => setTasksExpanded((v) => !v)}
              >
                <ExpandMoreIcon
                  sx={[styles.subExpandIcon, !tasksExpanded && styles.expandIconCollapsed]}
                />
                <Typography variant="caption" sx={styles.tableSectionTitle}>
                  Active Tasks
                </Typography>
                <Chip
                  label={totalRunning}
                  size="small"
                  color={totalRunning > 0 ? 'success' : 'default'}
                  variant="outlined"
                  sx={styles.subCountChip}
                />
              </Box>
              <Tooltip title="Refresh task state">
                <IconButton
                  size="small"
                  onClick={() => onRefreshScope(node.node, 'task')}
                  disabled={refreshingScope === 'task'}
                  sx={styles.subRefreshButton}
                >
                  {refreshingScope === 'task' ? <CircularProgress size={12} /> : <RefreshIcon sx={{ fontSize: '0.875rem' }} />}
                </IconButton>
              </Tooltip>
            </Box>
            <Collapse in={tasksExpanded}>
              {node.tasks?.length > 0 ? (
                <Box sx={styles.tableScroll}>
                  <GridTableContainer isLoading={false} isEmpty={false}>
                    <GridTableHeader
                      columns={taskColumns.visibleColumns}
                      gridTemplateColumns={taskColumns.gridTemplateColumns}
                      showCheckbox={false}
                    />
                    <GridTableBody>
                      {node.tasks.map((task) => (
                        <GridTableRow
                          key={task.task_id}
                          row={task}
                          columns={taskColumns.dataColumns}
                          gridTemplateColumns={taskColumns.gridTemplateColumns}
                          showCheckbox={false}
                          renderCell={renderTaskCell}
                          renderActions={renderTaskActions}
                        />
                      ))}
                    </GridTableBody>
                  </GridTableContainer>
                </Box>
              ) : (
                <Typography variant="caption" sx={styles.emptyTasks}>
                  No active tasks
                </Typography>
              )}
            </Collapse>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

const ActiveTasksTab = memo(function ActiveTasksTab() {
  const { data, isLoading } = useActiveTasksListQuery(undefined, {
    pollingInterval: 5000,
  });
  const [refreshNode, { isLoading: refreshing }] = useActiveTasksRefreshMutation();
  const [stopTask] = useActiveTasksStopMutation();
  const [refreshingNode, setRefreshingNode] = useState(null);
  const [refreshingScopeKey, setRefreshingScopeKey] = useState(null); // "node::scope"
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const nodes = useMemo(() => data?.nodes || [], [data]);

  const handleRefresh = useCallback(
    async (nodeStr) => {
      setRefreshingNode(nodeStr);
      try {
        await refreshNode({ node: nodeStr, scope: 'pool' }).unwrap();
        await refreshNode({ node: nodeStr, scope: 'task' }).unwrap();
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Refresh failed: ${err?.message || 'Unknown error'}`,
          severity: 'error',
        });
      } finally {
        setRefreshingNode(null);
      }
    },
    [refreshNode],
  );

  const handleRefreshScope = useCallback(
    async (nodeStr, scope) => {
      const key = `${nodeStr}::${scope}`;
      setRefreshingScopeKey(key);
      try {
        await refreshNode({ node: nodeStr, scope }).unwrap();
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Refresh failed: ${err?.message || 'Unknown error'}`,
          severity: 'error',
        });
      } finally {
        setRefreshingScopeKey(null);
      }
    },
    [refreshNode],
  );

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
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

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
        <Typography variant="bodyMedium" color="text.disabled">
          No task nodes available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.scrollArea}>
        {nodes.map((node) => (
          <NodeCard
            key={node.node}
            node={node}
            onRefresh={handleRefresh}
            onRefreshScope={handleRefreshScope}
            onStop={handleStop}
            refreshing={refreshingNode === node.node}
            refreshingScope={
              refreshingScopeKey?.startsWith(`${node.node}::`)
                ? refreshingScopeKey.split('::')[1]
                : null
            }
          />
        ))}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

const styles = {
  root: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
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
  emptyIcon: {
    fontSize: '3rem',
    color: 'text.disabled',
  },
  nodeCard: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  nodeHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 1rem',
    cursor: 'pointer',
    backgroundColor: palette.background.tabPanel || palette.background.userInputBackground,
    '&:hover': {
      backgroundColor: palette.background.conversation?.hover || palette.action.hover,
    },
  }),
  nodeHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  expandIcon: {
    fontSize: '1.25rem',
    transition: 'transform 0.2s',
    color: 'text.metrics',
  },
  expandIconCollapsed: {
    transform: 'rotate(-90deg)',
  },
  nodeTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  countChip: {
    fontSize: '0.6875rem',
    height: '1.25rem',
    '& .MuiChip-label': {
      padding: '0 0.375rem',
    },
  },
  capacityText: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.6875rem',
  }),
  refreshButton: {
    textTransform: 'none',
    fontSize: '0.75rem',
    minWidth: 'auto',
  },
  nodeBody: ({ palette }) => ({
    borderTop: `1px solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '0.75rem',
  }),
  tableSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  subSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.25rem 0',
  },
  subSectionToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  subRefreshButton: {
    padding: '0.125rem',
  },
  subExpandIcon: {
    fontSize: '1rem',
    transition: 'transform 0.2s',
    color: 'text.metrics',
  },
  subCountChip: {
    fontSize: '0.625rem',
    height: '1rem',
    '& .MuiChip-label': {
      padding: '0 0.25rem',
    },
  },
  tableScroll: {
    maxHeight: '18rem',
    overflowY: 'auto',
  },
  tableSectionTitle: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }),
  emptyTasks: ({ palette }) => ({
    color: palette.text.disabled,
    fontSize: '0.75rem',
    padding: '0.75rem 0.25rem',
  }),
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
};

export default ActiveTasksTab;
