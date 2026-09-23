import { memo, useCallback, useMemo, useState } from 'react';

import BugReportOutlined from '@mui/icons-material/BugReportOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StopOutlined from '@mui/icons-material/StopOutlined';
import ViewColumnOutlined from '@mui/icons-material/ViewColumnOutlined';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';

import { GridTableBody, GridTableContainer, GridTableHeader, GridTableRow } from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';
import { useTableSort } from '@/hooks/useTableSort.hooks';
import {
  POOL_COLUMNS,
  STATUS_CONFIG,
  TASK_COLUMNS,
  TOGGLEABLE_COLUMNS,
} from '@/pages/SchedulesTasksPage/components/ActiveTasksTab/constants/activeTasks.constants';
import {
  formatUtc,
  parseMeta,
  statusRank,
} from '@/pages/SchedulesTasksPage/components/ActiveTasksTab/helpers/activeTasks.helpers';

import CopyableCell from './CopyableCell';

const ActiveTasksNodeCard = memo(props => {
  const { node, onStop, onOpenLogs, onDump, searching, hiddenColumns, onToggleColumn } = props;

  const [expanded, setExpanded] = useState(true);
  const [poolExpanded, setPoolExpanded] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(true);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState(null);

  const styles = useMemo(() => activeTasksNodeCardStyles(), []);

  // Default view: Running first, Pending last, newest within a group first.
  // Sorting Status uses the same rank; other columns sort naturally.
  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'status',
    defaultDirection: 'asc',
    comparators: {
      status: (_a, _b, rowA, rowB) => {
        const byRank = statusRank(rowA.status) - statusRank(rowB.status);
        if (byRank !== 0) return byRank;
        return String(rowB.started_at || '').localeCompare(String(rowA.started_at || ''));
      },
    },
  });
  const sortedTasks = useMemo(() => sortData(node.tasks || []), [sortData, node.tasks]);

  const totalRunning = node.tasks?.length || 0;
  const totalCapacity = (node.pools || []).reduce((sum, p) => sum + (p.task_limit || 0), 0);

  const poolColumns = useResponsiveColumns({
    columns: POOL_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '0',
  });

  const visibleTaskColumns = useMemo(
    () => TASK_COLUMNS.filter(c => !hiddenColumns?.[c.field]),
    [hiddenColumns],
  );
  const hiddenCount = TOGGLEABLE_COLUMNS.filter(c => hiddenColumns?.[c.field]).length;

  const taskColumns = useResponsiveColumns({
    columns: visibleTaskColumns,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '9rem',
  });

  const renderPoolCell = useCallback(
    (column, value) => {
      if (column.field === 'running_tasks') {
        return (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.cellText}
          >
            {value ?? '\u2014'}
          </Typography>
        );
      }
      return (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.cellText}
        >
          {value ?? '\u2014'}
        </Typography>
      );
    },
    [styles],
  );

  const renderTaskCell = useCallback(
    (column, value) => {
      if (column.field === 'task_id') {
        return (
          <CopyableCell
            display={value ? value.substring(0, 12) + '...' : '\u2014'}
            full={value}
            mono
          />
        );
      }
      if (column.field === 'status') {
        const statusLower = (value || '').toLowerCase();
        const cfg = STATUS_CONFIG[statusLower] || {
          label: value || 'Unknown',
          color: 'default',
        };
        return (
          <Chip
            label={cfg.label}
            size="small"
            color={cfg.color}
            variant="outlined"
          />
        );
      }
      if (column.field === 'meta') {
        return (
          <CopyableCell
            display={parseMeta(value)}
            full={value}
          />
        );
      }
      if (column.field === 'runner') {
        return (
          <CopyableCell
            display={value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : '\u2014'}
            full={value}
          />
        );
      }
      if (column.field === 'started_at') {
        return (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.cellText}
          >
            {formatUtc(value)}
          </Typography>
        );
      }
      if (column.field === 'user_input_preview') {
        return (
          <Tooltip title={value || ''}>
            <Typography
              variant="bodyMedium"
              color="text.secondary"
              sx={styles.cellText}
            >
              {value || '\u2014'}
            </Typography>
          </Tooltip>
        );
      }
      return (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.cellText}
        >
          {value ?? '\u2014'}
        </Typography>
      );
    },
    [styles],
  );

  const renderTaskActions = useCallback(
    row => {
      const status = (row.status || '').toLowerCase();
      return (
        <Box sx={styles.taskActions}>
          <Tooltip title="View logs">
            <IconButton
              size="small"
              onClick={() => onOpenLogs(row.task_id)}
            >
              <DescriptionOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {status === 'running' && (
            <Tooltip title="Dump stack (see where the task is stuck)">
              <IconButton
                size="small"
                onClick={() => onDump(row.task_id)}
              >
                <BugReportOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {status === 'running' && (
            <Tooltip title="Stop task">
              <IconButton
                size="small"
                onClick={() => onStop(node.node, row.task_id)}
              >
                <StopOutlined
                  fontSize="small"
                  color="error"
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      );
    },
    [node.node, onStop, onOpenLogs, onDump, styles],
  );

  const handleToggleExpanded = useCallback(() => setExpanded(v => !v), []);

  const handleToggleTasksExpanded = useCallback(() => setTasksExpanded(v => !v), []);

  const handleTogglePoolExpanded = useCallback(() => setPoolExpanded(v => !v), []);

  const handleOpenColumnMenu = useCallback(e => setColumnMenuAnchor(e.currentTarget), []);

  const handleCloseColumnMenu = useCallback(() => setColumnMenuAnchor(null), []);

  return (
    <Box sx={styles.nodeCard}>
      <Box
        sx={styles.nodeHeader}
        onClick={handleToggleExpanded}
      >
        <Box sx={styles.nodeHeaderLeft}>
          <ExpandMoreIcon sx={[styles.expandIcon, !expanded && styles.expandIconCollapsed]} />
          <Typography
            variant="body2"
            sx={styles.nodeTitle}
          >
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
            <Typography
              variant="caption"
              sx={styles.capacityText}
            >
              capacity: {totalCapacity}
            </Typography>
          )}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={styles.nodeBody}>
          {/* Active Tasks */}
          <Box sx={styles.tableSection}>
            <Box sx={styles.subSectionHeader}>
              <Box
                sx={styles.subSectionToggle}
                onClick={handleToggleTasksExpanded}
              >
                <ExpandMoreIcon sx={[styles.subExpandIcon, !tasksExpanded && styles.expandIconCollapsed]} />
                <Typography
                  variant="caption"
                  sx={styles.tableSectionTitle}
                >
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
              <Button
                size="small"
                startIcon={<ViewColumnOutlined sx={styles.buttonIcon} />}
                onClick={handleOpenColumnMenu}
                sx={styles.columnsButton}
              >
                Columns{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}
              </Button>
              <Menu
                anchorEl={columnMenuAnchor}
                open={Boolean(columnMenuAnchor)}
                onClose={handleCloseColumnMenu}
              >
                {TOGGLEABLE_COLUMNS.map(col => (
                  <MenuItem
                    key={col.field}
                    onClick={() => onToggleColumn(col.field)}
                    dense
                  >
                    <Checkbox
                      size="small"
                      checked={!hiddenColumns[col.field]}
                      disableRipple
                    />
                    <ListItemText primary={col.label} />
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Collapse in={tasksExpanded}>
              {sortedTasks.length > 0 ? (
                <GridTableContainer
                  isLoading={false}
                  isEmpty={false}
                >
                  <GridTableHeader
                    columns={taskColumns.visibleColumns}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    gridTemplateColumns={taskColumns.gridTemplateColumns}
                    showCheckbox={false}
                  />
                  <GridTableBody
                    minHeight="0"
                    sx={styles.tableBodyScroll}
                  >
                    {sortedTasks.map(task => (
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
              ) : (
                <Typography
                  variant="caption"
                  sx={styles.emptyTasks}
                >
                  {searching ? 'No matching active tasks' : 'No active tasks'}
                </Typography>
              )}
            </Collapse>
          </Box>

          {/* Pool State */}
          {node.pools?.length > 0 && (
            <Box sx={styles.tableSection}>
              <Box sx={styles.subSectionHeader}>
                <Box
                  sx={styles.subSectionToggle}
                  onClick={handleTogglePoolExpanded}
                >
                  <ExpandMoreIcon sx={[styles.subExpandIcon, !poolExpanded && styles.expandIconCollapsed]} />
                  <Typography
                    variant="caption"
                    sx={styles.tableSectionTitle}
                  >
                    Pool State
                  </Typography>
                  <Chip
                    label={node.pools.length}
                    size="small"
                    variant="outlined"
                    sx={styles.subCountChip}
                  />
                </Box>
              </Box>
              <Collapse in={poolExpanded}>
                <Box sx={styles.tableScroll}>
                  <GridTableContainer
                    isLoading={false}
                    isEmpty={false}
                  >
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
        </Box>
      </Collapse>
    </Box>
  );
});

ActiveTasksNodeCard.displayName = 'ActiveTasksNodeCard';

/** @type {MuiSx} */
const activeTasksNodeCardStyles = () => ({
  columnsButton: {
    textTransform: 'none',
    fontSize: '0.75rem',
    minWidth: 'auto',
  },
  nodeCard: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  nodeHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.625rem 1rem',
    cursor: 'pointer',
    backgroundColor: palette.background.tabPanel,
    '&:hover': {
      backgroundColor: palette.background.conversation.hover,
    },
  }),
  nodeHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  expandIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    transition: 'transform 0.2s',
    color: palette.text.metrics,
  }),
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
  nodeBody: ({ palette }) => ({
    borderTop: `0.0625rem solid ${palette.border.table}`,
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
  subExpandIcon: ({ palette }) => ({
    fontSize: '1rem',
    transition: 'transform 0.2s',
    color: palette.text.metrics,
  }),
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
  tableBodyScroll: {
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
  taskActions: {
    display: 'flex',
    gap: '0.125rem',
  },
  buttonIcon: {
    fontSize: '1rem',
  },
});

export default ActiveTasksNodeCard;
