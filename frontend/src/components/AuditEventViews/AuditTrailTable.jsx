import { memo, useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';

import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';

import AuditEventTypeIcon from './components/AuditEventTypeIcon';
import { AUDIT_PAGE_SIZE_OPTIONS } from './constants/auditEvents.constants';
import { formatDuration, formatTimestamp } from './helpers/auditEvents.helpers';

const AUDIT_COLUMNS = [
  { field: 'timestamp', label: 'Time', width: '9rem', sortable: true },
  { field: 'event_type', label: 'Type', width: '3rem', sortable: true },
  { field: 'action', label: 'Action', width: 'minmax(0, 1fr)', sortable: true },
  {
    field: 'user_email',
    label: 'User',
    width: '10rem',
    sortable: true,
    hideBelow: 800,
  },
  {
    field: 'status_code',
    label: 'Status',
    width: '4rem',
    sortable: true,
    hideBelow: 900,
  },
  {
    field: 'duration_ms',
    label: 'Duration',
    width: '5.5rem',
    sortable: true,
    hideBelow: 900,
  },
  {
    field: 'project_id',
    label: 'Project',
    width: '4.5rem',
    sortable: true,
    hideBelow: 1000,
  },
];

const AuditTrailTable = memo(props => {
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

  const [hoveredRowId, setHoveredRowId] = useState(null);

  const styles = useMemo(() => auditTrailTableStyles(), []);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: AUDIT_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
  });

  const paginationProps = useMemo(
    () => ({
      totalRows: total,
      pageSize,
      isFirstPage: page === 0,
      isLastPage: (page + 1) * pageSize >= total,
      startRow: total > 0 ? page * pageSize + 1 : 0,
      endRow: Math.min((page + 1) * pageSize, total),
      handlePrevPage: () => onPageChange(Math.max(0, page - 1)),
      handleNextPage: () => onPageChange(page + 1),
      handlePageSizeChange: onPageSizeChange,
      pageSizeOptions: AUDIT_PAGE_SIZE_OPTIONS,
    }),
    [total, page, pageSize, onPageChange, onPageSizeChange],
  );

  const renderCell = useCallback(
    (column, value, row) => {
      if (column.field === 'timestamp') {
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

      if (column.field === 'event_type') {
        return <AuditEventTypeIcon eventType={value} />;
      }

      if (column.field === 'action') {
        const isError = row.is_error;
        const hasTrace = row.trace_id;
        let display = value || '-';
        if (row.tool_name || row.model_name) {
          display = `${value} [${row.tool_name || row.model_name}]`;
        }
        return (
          <Tooltip
            title={hasTrace ? `trace: ${row.trace_id}` : display}
            placement="top"
          >
            <Typography
              variant="bodyMedium"
              sx={[styles.cellText, styles.actionText(isError, hasTrace)]}
              onClick={hasTrace ? () => onTraceClick?.(row.trace_id) : undefined}
            >
              {display}
            </Typography>
          </Tooltip>
        );
      }

      if (column.field === 'status_code') {
        if (value == null) return '-';
        const isErr = value >= 400;
        return (
          <Typography
            variant="bodyMedium"
            sx={[styles.cellText, styles.statusText(isErr)]}
          >
            {value}
          </Typography>
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
    [onTraceClick, styles],
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
        emptyMessage="No audit events"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={onSort}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {rows.map(row => (
            <GridTableRow
              key={row.id}
              row={row}
              columns={dataColumns}
              isSelected={false}
              isHovered={hoveredRowId === row.id}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox={false}
              renderCell={renderCell}
            />
          ))}
        </GridTableBody>

        {total > 0 && <GridTablePagination {...paginationProps} />}
      </GridTableContainer>
    </Box>
  );
});

AuditTrailTable.displayName = 'AuditTrailTable';

/** @type {MuiSx} */
const auditTrailTableStyles = () => ({
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
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actionText:
    (isError, hasTrace) =>
    ({ palette }) => ({
      color: isError ? palette.error.main : palette.text.secondary,
      cursor: hasTrace ? 'pointer' : 'default',
      '&:hover': hasTrace ? { textDecoration: 'underline' } : {},
    }),
  statusText:
    isError =>
    ({ palette }) => ({
      color: isError ? palette.error.main : palette.text.secondary,
    }),
});

export default AuditTrailTable;
