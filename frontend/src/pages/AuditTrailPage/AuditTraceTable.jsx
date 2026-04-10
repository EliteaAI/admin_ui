import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import HttpOutlined from '@mui/icons-material/HttpOutlined';
import CableOutlined from '@mui/icons-material/CableOutlined';
import SyncAltOutlined from '@mui/icons-material/SyncAltOutlined';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined';

import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { useAuditTrailListQuery } from '@/api/auditTrailApi';
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTablePagination,
} from '@/components/GridTable';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const EVENT_TYPE_CONFIG = {
  api: { icon: HttpOutlined, color: '#3b82f6', label: 'API' },
  socketio: { icon: CableOutlined, color: '#8b5cf6', label: 'Socket.IO' },
  rpc: { icon: SyncAltOutlined, color: '#6366f1', label: 'RPC' },
  agent: { icon: SmartToyOutlined, color: '#f59e0b', label: 'Agent' },
  tool: { icon: BuildOutlined, color: '#10b981', label: 'Tool' },
  llm: { icon: AutoAwesomeOutlined, color: '#ec4899', label: 'LLM' },
  schedule: { icon: ScheduleOutlined, color: '#f59e0b', label: 'Schedule' },
  admin_task: { icon: AssignmentOutlined, color: '#06b6d4', label: 'Admin Task' },
};

const DEFAULT_EVENT_CONFIG = { icon: HelpOutlineOutlined, color: '#94a3b8', label: 'Unknown' };

const TRACE_COLUMNS = [
  { field: 'expand', label: '', width: '2.5rem', sortable: false },
  { field: 'start_time', label: 'Time', width: '9rem', sortable: true },
  { field: 'root_event_type', label: 'Type', width: '3rem', sortable: false },
  { field: 'root_action', label: 'Action', width: 'minmax(0, 1fr)', sortable: false },
  { field: 'user_email', label: 'User', width: '10rem', sortable: true, hideBelow: 800 },
  { field: 'duration_ms', label: 'Duration', width: '5.5rem', sortable: true, hideBelow: 900 },
  { field: 'span_count', label: 'Spans', width: '3.5rem', sortable: true },
  { field: 'project_id', label: 'Project', width: '4.5rem', sortable: true, hideBelow: 1000 },
];

// Span columns for expanded view (no expand icon column)
const SPAN_COLUMNS = [
  { field: 'timestamp', label: 'Time', width: '9rem', sortable: false },
  { field: 'event_type', label: 'Type', width: '3rem', sortable: false },
  { field: 'action', label: 'Action', width: 'minmax(0, 1fr)', sortable: false },
  { field: 'user_email', label: 'User', width: '10rem', sortable: false, hideBelow: 800 },
  { field: 'status_code', label: 'Status', width: '3rem', sortable: false, hideBelow: 900 },
  { field: 'duration_ms', label: 'Duration', width: '5.5rem', sortable: false, hideBelow: 900 },
  { field: 'project_id', label: 'Project', width: '4.5rem', sortable: false, hideBelow: 1000 },
];

function formatTimestamp(value) {
  if (!value) return '-';
  try {
    const d = new Date(value);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(value);
  }
}

function formatDuration(ms) {
  if (ms == null) return '-';
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}


/**
 * Lazy-loaded expanded spans for a single trace.
 * Uses the existing auditTrailList endpoint filtered by trace_id.
 */
const TraceSpans = memo(function TraceSpans({ traceId }) {
  const { data, isFetching } = useAuditTrailListQuery(
    { trace_id: traceId, limit: 200, sort_by: 'timestamp', sort_order: 'asc' },
    { skip: !traceId },
  );

  const spanColumns = useMemo(() => {
    const w = window.innerWidth;
    return SPAN_COLUMNS.filter((c) => !c.hideBelow || w >= c.hideBelow);
  }, []);

  const gridTemplateColumns = useMemo(
    () => `2.5rem ${spanColumns.map((c) => c.width).join(' ')}`,
    [spanColumns],
  );

  if (isFetching) {
    return (
      <Box sx={styles.spanLoadingRow}>
        <Skeleton variant="rectangular" width="100%" height="2rem" sx={{ borderRadius: '0.25rem' }} />
      </Box>
    );
  }

  const spans = data?.rows ?? [];
  if (spans.length === 0) {
    return (
      <Box sx={styles.spanEmptyRow}>
        <Typography variant="bodySmall" color="text.metrics">
          No spans found for this trace
        </Typography>
      </Box>
    );
  }

  return spans.map((span) => (
    <Box key={span.id} sx={styles.spanRow(gridTemplateColumns)}>
      {/* Empty cell to align with expand icon column */}
      <Box />
      {spanColumns.map((column) => {
        const value = span[column.field];

        if (column.field === 'timestamp') {
          return (
            <Box key={column.field} sx={styles.spanCell}>
              <Typography variant="bodySmall" color="text.metrics" sx={styles.cellText}>
                {formatTimestamp(value)}
              </Typography>
            </Box>
          );
        }

        if (column.field === 'event_type') {
          const config = EVENT_TYPE_CONFIG[value] || DEFAULT_EVENT_CONFIG;
          const IconComponent = config.icon;
          return (
            <Box key={column.field} sx={styles.spanCell}>
              <Tooltip title={config.label} placement="top" arrow>
                <Box sx={styles.iconCell}>
                  <IconComponent sx={{ fontSize: '0.9375rem', color: config.color }} />
                </Box>
              </Tooltip>
            </Box>
          );
        }

        if (column.field === 'action') {
          let display = value || '-';
          if (span.tool_name || span.model_name) {
            display = `${value} [${span.tool_name || span.model_name}]`;
          }
          return (
            <Box key={column.field} sx={styles.spanCell}>
              <Typography
                variant="bodySmall"
                sx={{
                  ...styles.cellText,
                  color: span.is_error ? 'error.main' : 'text.metrics',
                }}
              >
                {display}
              </Typography>
            </Box>
          );
        }

        if (column.field === 'status_code') {
          if (value == null) return <Box key={column.field} sx={styles.spanCell}>-</Box>;
          return (
            <Box key={column.field} sx={styles.spanCell}>
              <Typography
                variant="bodySmall"
                sx={{ ...styles.cellText, color: value >= 400 ? 'error.main' : 'text.metrics' }}
              >
                {value}
              </Typography>
            </Box>
          );
        }

        if (column.field === 'duration_ms') {
          return (
            <Box key={column.field} sx={styles.spanCell}>
              <Typography variant="bodySmall" color="text.metrics" sx={styles.cellText}>
                {formatDuration(value)}
              </Typography>
            </Box>
          );
        }

        return (
          <Box key={column.field} sx={styles.spanCell}>
            <Typography variant="bodySmall" color="text.metrics" sx={styles.cellText}>
              {value != null ? String(value) : '-'}
            </Typography>
          </Box>
        );
      })}
    </Box>
  ));
});


/**
 * AuditTraceTable — shows traces (grouped by trace_id) with expand/collapse.
 *
 * Uses the same expand/collapse pattern as the Roles PermissionGroupRow:
 * - Set<string> of expanded trace IDs
 * - ChevronRight / ExpandMore icons
 * - Conditional rendering of child spans
 */
const AuditTraceTable = memo(function AuditTraceTable(props) {
  const {
    rows = [],
    total = 0,
    page = 0,
    pageSize = 50,
    onPageChange,
    onPageSizeChange,
    sortConfig,
    onSort,
    isFetching,
    onTraceClick,
  } = props;

  const [expandedTraces, setExpandedTraces] = useState(new Set());
  const [hoveredTraceId, setHoveredTraceId] = useState(null);

  const { visibleColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: TRACE_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
  });

  const toggleExpand = useCallback((traceId) => {
    setExpandedTraces((prev) => {
      const next = new Set(prev);
      if (next.has(traceId)) next.delete(traceId);
      else next.add(traceId);
      return next;
    });
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setExpandedTraces(new Set());
    onPageChange(newPage);
  }, [onPageChange]);

  const handlePageSizeChange = useCallback((newSize) => {
    setExpandedTraces(new Set());
    onPageSizeChange(newSize);
  }, [onPageSizeChange]);

  const paginationProps = useMemo(
    () => ({
      totalRows: total,
      pageSize,
      isFirstPage: page === 0,
      isLastPage: (page + 1) * pageSize >= total,
      startRow: total > 0 ? page * pageSize + 1 : 0,
      endRow: Math.min((page + 1) * pageSize, total),
      handlePrevPage: () => handlePageChange(Math.max(0, page - 1)),
      handleNextPage: () => handlePageChange(page + 1),
      handlePageSizeChange: handlePageSizeChange,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [total, page, pageSize, handlePageChange, handlePageSizeChange],
  );

  const renderTraceCell = useCallback((column, value, row) => {
    if (column.field === 'expand') {
      const isExpanded = expandedTraces.has(row.trace_id);
      return (
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); toggleExpand(row.trace_id); }}
          sx={styles.expandButton}
        >
          {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>
      );
    }

    if (column.field === 'start_time') {
      return (
        <Typography variant="bodySmall" color="text.secondary" sx={styles.cellText}>
          {formatTimestamp(value)}
        </Typography>
      );
    }

    if (column.field === 'root_event_type') {
      const config = EVENT_TYPE_CONFIG[value] || DEFAULT_EVENT_CONFIG;
      const IconComponent = config.icon;
      return (
        <Tooltip title={config.label} placement="top" arrow>
          <Box sx={styles.iconCell}>
            <IconComponent sx={{ fontSize: '1.125rem', color: config.color }} />
          </Box>
        </Tooltip>
      );
    }

    if (column.field === 'root_action') {
      const display = value || '-';
      return (
        <Tooltip title={`trace: ${row.trace_id}`} placement="top">
          <Typography
            variant="bodyMedium"
            sx={{
              ...styles.cellText,
              color: row.has_error ? 'error.main' : 'text.secondary',
              cursor: onTraceClick ? 'pointer' : 'default',
              '&:hover': onTraceClick ? { textDecoration: 'underline' } : {},
            }}
            onClick={onTraceClick ? () => onTraceClick(row.trace_id) : undefined}
          >
            {display}
          </Typography>
        </Tooltip>
      );
    }

    if (column.field === 'duration_ms') {
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {formatDuration(value)}
        </Typography>
      );
    }

    if (column.field === 'span_count') {
      return (
        <Chip
          label={value}
          size="small"
          sx={styles.spanCountChip}
        />
      );
    }

    if (column.field === 'user_email') {
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {value || '-'}
        </Typography>
      );
    }

    return (
      <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
        {value != null ? String(value) : '-'}
      </Typography>
    );
  }, [expandedTraces, toggleExpand, onTraceClick]);

  return (
    <Box sx={styles.tableContainer}>
      {isFetching && (
        <Box sx={styles.loadingOverlay}>
          <CircularProgress size={28} />
        </Box>
      )}
      <GridTableContainer
        isLoading={false}
        isEmpty={!isFetching && rows.length === 0}
        emptyMessage="No traces found"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={onSort}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {rows.map((trace) => {
            const isExpanded = expandedTraces.has(trace.trace_id);
            return (
              <Fragment key={trace.trace_id}>
                <Box
                  sx={styles.traceRow(gridTemplateColumns, isExpanded, hoveredTraceId === trace.trace_id)}
                  onMouseEnter={() => setHoveredTraceId(trace.trace_id)}
                  onMouseLeave={() => setHoveredTraceId(null)}
                  onClick={() => toggleExpand(trace.trace_id)}
                >
                  {visibleColumns.map((column) => {
                    const value = trace[column.field];
                    const cellContent = renderTraceCell(column, value, trace);
                    return (
                      <Box key={column.field} sx={styles.dataCell}>
                        {cellContent}
                      </Box>
                    );
                  })}
                </Box>
                {isExpanded && <TraceSpans traceId={trace.trace_id} />}
              </Fragment>
            );
          })}
        </GridTableBody>

        {total > 0 && <GridTablePagination {...paginationProps} />}
      </GridTableContainer>
    </Box>
  );
});

const styles = {
  tableContainer: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  traceRow: (gridTemplateColumns, isExpanded, isHovered) => ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns,
    alignItems: 'center',
    width: '100%',
    minHeight: '2.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: isExpanded
      ? palette.background.tabPanel
      : isHovered
        ? palette.background.userInputBackground
        : 'transparent',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
  }),
  spanRow: (gridTemplateColumns) => ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns,
    alignItems: 'center',
    width: '100%',
    minHeight: '2rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  spanLoadingRow: ({ palette }) => ({
    padding: '0.5rem 1rem 0.5rem 3.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  spanEmptyRow: ({ palette }) => ({
    padding: '0.75rem 1rem 0.75rem 3.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  dataCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  spanCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandButton: {
    padding: '0.125rem',
  },
  spanCountChip: ({ palette }) => ({
    height: '1.25rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    backgroundColor: palette.background.tabPanel,
    color: palette.text.secondary,
  }),
};

export default AuditTraceTable;
