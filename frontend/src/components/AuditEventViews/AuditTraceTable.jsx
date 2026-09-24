import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Chip, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';

import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
} from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';

import AuditEventTypeIcon from './components/AuditEventTypeIcon';
import AuditTraceSpans from './components/AuditTraceSpans';
import { AUDIT_PAGE_SIZE_OPTIONS } from './constants/auditEvents.constants';
import { formatDuration, formatTimestamp } from './helpers/auditEvents.helpers';

const TRACE_COLUMNS = [
  { field: 'expand', label: '', width: '2.5rem', sortable: false },
  { field: 'start_time', label: 'Time', width: '9rem', sortable: true },
  { field: 'root_event_type', label: 'Type', width: '3rem', sortable: false },
  {
    field: 'root_action',
    label: 'Action',
    width: 'minmax(0, 1fr)',
    sortable: false,
  },
  {
    field: 'user_email',
    label: 'User',
    width: '10rem',
    sortable: true,
    hideBelow: 800,
  },
  {
    field: 'duration_ms',
    label: 'Duration',
    width: '5.5rem',
    sortable: true,
    hideBelow: 900,
  },
  { field: 'span_count', label: 'Spans', width: '3.5rem', sortable: true },
  {
    field: 'project_id',
    label: 'Project',
    width: '4.5rem',
    sortable: true,
    hideBelow: 1000,
  },
];

/**
 * AuditTraceTable — shows traces (grouped by trace_id) with expand/collapse.
 *
 * Uses the same expand/collapse pattern as the Roles PermissionGroupRow:
 * - Set<string> of expanded trace IDs
 * - ChevronRight / ExpandMore icons
 * - Conditional rendering of child spans
 */
const AuditTraceTable = memo(props => {
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

  const styles = useMemo(() => auditTraceTableStyles(), []);

  const { visibleColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: TRACE_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
  });

  const toggleExpand = useCallback(traceId => {
    setExpandedTraces(prev => {
      const next = new Set(prev);
      if (next.has(traceId)) next.delete(traceId);
      else next.add(traceId);
      return next;
    });
  }, []);

  const handlePageChange = useCallback(
    newPage => {
      setExpandedTraces(new Set());
      onPageChange(newPage);
    },
    [onPageChange],
  );

  const handlePageSizeChange = useCallback(
    newSize => {
      setExpandedTraces(new Set());
      onPageSizeChange(newSize);
    },
    [onPageSizeChange],
  );

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
      handlePageSizeChange,
      pageSizeOptions: AUDIT_PAGE_SIZE_OPTIONS,
    }),
    [total, page, pageSize, handlePageChange, handlePageSizeChange],
  );

  const renderTraceCell = useCallback(
    (column, value, row) => {
      if (column.field === 'expand') {
        const isExpanded = expandedTraces.has(row.trace_id);
        return (
          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation();
              toggleExpand(row.trace_id);
            }}
            sx={styles.expandButton}
          >
            {isExpanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        );
      }

      if (column.field === 'start_time') {
        return (
          <Typography
            variant="bodySmall"
            color="text.secondary"
            sx={styles.cellText}
          >
            {formatTimestamp(value)}
          </Typography>
        );
      }

      if (column.field === 'root_event_type') {
        return <AuditEventTypeIcon eventType={value} />;
      }

      if (column.field === 'root_action') {
        const display = value || '-';
        return (
          <Tooltip
            title={`trace: ${row.trace_id}`}
            placement="top"
          >
            <Typography
              variant="bodyMedium"
              sx={[styles.cellText, styles.actionText(row.has_error, !!onTraceClick)]}
              onClick={onTraceClick ? () => onTraceClick(row.trace_id) : undefined}
            >
              {display}
            </Typography>
          </Tooltip>
        );
      }

      if (column.field === 'duration_ms') {
        return (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.cellText}
          >
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
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={styles.cellText}
          >
            {value || '-'}
          </Typography>
        );
      }

      return (
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={styles.cellText}
        >
          {value != null ? String(value) : '-'}
        </Typography>
      );
    },
    [expandedTraces, toggleExpand, onTraceClick, styles],
  );

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
          {rows.map(trace => {
            const isExpanded = expandedTraces.has(trace.trace_id);
            return (
              <Fragment key={trace.trace_id}>
                <Box
                  sx={styles.traceRow(gridTemplateColumns, isExpanded, hoveredTraceId === trace.trace_id)}
                  onMouseEnter={() => setHoveredTraceId(trace.trace_id)}
                  onMouseLeave={() => setHoveredTraceId(null)}
                  onClick={() => toggleExpand(trace.trace_id)}
                >
                  {visibleColumns.map(column => {
                    const value = trace[column.field];
                    const cellContent = renderTraceCell(column, value, trace);
                    return (
                      <Box
                        key={column.field}
                        sx={styles.dataCell}
                      >
                        {cellContent}
                      </Box>
                    );
                  })}
                </Box>
                {isExpanded && <AuditTraceSpans traceId={trace.trace_id} />}
              </Fragment>
            );
          })}
        </GridTableBody>

        {total > 0 && <GridTablePagination {...paginationProps} />}
      </GridTableContainer>
    </Box>
  );
});

AuditTraceTable.displayName = 'AuditTraceTable';

/** @type {MuiSx} */
const auditTraceTableStyles = () => ({
  tableContainer: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  loadingOverlay: ({ palette }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background.overlay.default,
    zIndex: 2,
    pointerEvents: 'none',
  }),
  traceRow:
    (gridTemplateColumns, isExpanded, isHovered) =>
    ({ palette }) => ({
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
  dataCell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actionText:
    (hasError, clickable) =>
    ({ palette }) => ({
      color: hasError ? palette.error.main : palette.text.secondary,
      cursor: clickable ? 'pointer' : 'default',
      '&:hover': clickable ? { textDecoration: 'underline' } : {},
    }),
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
});

export default AuditTraceTable;
