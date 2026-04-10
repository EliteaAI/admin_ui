import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

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
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
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

const AUDIT_COLUMNS = [
  { field: 'timestamp', label: 'Time', width: '9rem', sortable: true },
  { field: 'event_type', label: 'Type', width: '3rem', sortable: true },
  { field: 'action', label: 'Action', width: 'minmax(0, 1fr)', sortable: true },
  { field: 'user_email', label: 'User', width: '10rem', sortable: true, hideBelow: 800 },
  { field: 'status_code', label: 'Status', width: '4rem', sortable: true, hideBelow: 900 },
  { field: 'duration_ms', label: 'Duration', width: '5.5rem', sortable: true, hideBelow: 900 },
  { field: 'project_id', label: 'Project', width: '4.5rem', sortable: true, hideBelow: 1000 },
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

const AuditTrailTable = memo(function AuditTrailTable(props) {
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
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [total, page, pageSize, onPageChange, onPageSizeChange],
  );

  const renderCell = useCallback((column, value, row) => {
    if (column.field === 'timestamp') {
      return (
        <Typography variant="bodySmall" color="text.secondary" sx={styles.cellText}>
          {formatTimestamp(value)}
        </Typography>
      );
    }

    if (column.field === 'event_type') {
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

    if (column.field === 'action') {
      const isError = row.is_error;
      const hasTrace = row.trace_id;
      let display = value || '-';
      if (row.tool_name || row.model_name) {
        display = `${value} [${row.tool_name || row.model_name}]`;
      }
      return (
        <Tooltip title={hasTrace ? `trace: ${row.trace_id}` : ''} placement="top">
          <Typography
            variant="bodyMedium"
            sx={{
              ...styles.cellText,
              color: isError ? 'error.main' : 'text.secondary',
              cursor: hasTrace ? 'pointer' : 'default',
              '&:hover': hasTrace ? { textDecoration: 'underline' } : {},
            }}
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
          sx={{ ...styles.cellText, color: isErr ? 'error.main' : 'text.secondary' }}
        >
          {value}
        </Typography>
      );
    }

    if (column.field === 'duration_ms') {
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {formatDuration(value)}
        </Typography>
      );
    }

    return (
      <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
        {value != null ? String(value) : '-'}
      </Typography>
    );
  }, [onTraceClick]);

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
          {rows.map((row) => (
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
};

export default AuditTrailTable;
