import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import TimelineOutlined from '@mui/icons-material/TimelineOutlined';

import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
  GridTablePagination,
} from '@/components/GridTable';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'success' },
  suspended: { label: 'Suspended', color: 'warning' },
};

const USERS_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: true },
  { field: 'email', label: 'Email', width: '1.2fr', sortable: true, hideBelow: 600 },
  { field: 'last_login', label: 'Last login', width: '1fr', sortable: true, hideBelow: 800 },
  { field: 'status', label: 'Status', width: '7rem', sortable: false, hideBelow: 900 },
  { field: 'is_admin', label: 'Platform Admin', width: '8rem', sortable: false, hideBelow: 900 },
  { field: 'actions', label: 'Actions', width: '10rem', sortable: false },
];

const UsersTable = memo(function UsersTable(props) {
  const {
    users = [],
    total = 0,
    page = 0,
    pageSize = 20,
    onPageChange,
    onPageSizeChange,
    sortConfig,
    onSort,
    isFetching,
    selectedIds = [],
    onSelectionChange,
    onDelete,
    onToggleAdmin,
    onSuspend,
    onActivity,
    showCheckbox = true,
    showActions = true,
    showAdminToggle = true,
  } = props;

  const [hoveredRowId, setHoveredRowId] = useState(null);

  const activeColumns = useMemo(
    () => USERS_COLUMNS.filter((col) => {
      if (col.field === 'actions' && !showActions) return false;
      if (col.field === 'is_admin' && !showAdminToggle) return false;
      if (col.field === 'status' && !showActions) return false;
      return true;
    }),
    [showActions, showAdminToggle],
  );

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: activeColumns,
    containerWidth: window.innerWidth,
    showCheckbox,
    actionsColumnWidth: '10rem',
  });

  const isAllSelected = useMemo(
    () => users.length > 0 && users.every((u) => selectedIds.includes(u.id)),
    [users, selectedIds],
  );

  const isIndeterminate = useMemo(
    () => selectedIds.length > 0 && !isAllSelected,
    [selectedIds.length, isAllSelected],
  );

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(users.map((u) => u.id));
    }
  }, [isAllSelected, users, onSelectionChange]);

  const handleSelectRow = useCallback(
    (userId) => {
      const isCurrentlySelected = selectedIds.includes(userId);
      if (isCurrentlySelected) {
        onSelectionChange(selectedIds.filter((id) => id !== userId));
      } else {
        onSelectionChange([...selectedIds, userId]);
      }
    },
    [selectedIds, onSelectionChange],
  );

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
    if (column.field === 'status') {
      const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.active;
      return <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
    }
    if (column.field === 'is_admin') {
      return (
        <Switch
          size="small"
          checked={!!value}
          onChange={() => onToggleAdmin?.(row.id, !value)}
        />
      );
    }
    if (column.field === 'last_login') {
      if (!value) return 'Never';
      try {
        return new Date(value).toLocaleString();
      } catch {
        return String(value);
      }
    }
    return (
      <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
        {value || '-'}
      </Typography>
    );
  }, [onToggleAdmin]);

  const getRowSx = useCallback((row) => {
    if (row.status === 'suspended') return styles.suspendedRow;
    return undefined;
  }, []);

  const renderActions = useCallback(
    (row) => {
      const isSuspended = row.status === 'suspended';
      return (
        <Box sx={styles.actionsRow}>
          <Tooltip title={isSuspended ? 'Unsuspend user' : 'Suspend user'}>
            <IconButton size="small" onClick={() => onSuspend(row)}>
              {isSuspended
                ? <CheckCircleOutlined fontSize="small" color="success" />
                : <BlockOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="User activity">
            <IconButton size="small" onClick={() => onActivity(row)}>
              <TimelineOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete user">
            <IconButton size="small" onClick={() => onDelete([row.id])}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    [onDelete, onSuspend, onActivity],
  );

  if (isFetching) {
    return (
      <Box sx={styles.skeletonContainer}>
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton
            key={index}
            variant="rectangular"
            width="100%"
            height="2.5rem"
            sx={{ marginBottom: '0.5rem' }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={styles.tableContainer}>
      <GridTableContainer
        isLoading={false}
        isEmpty={users.length === 0}
        emptyMessage="No users"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={onSort}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={showCheckbox}
        />

        <GridTableBody>
          {users.map((row) => (
            <GridTableRow
              key={row.id}
              row={row}
              columns={dataColumns}
              isSelected={showCheckbox && selectedIds.includes(row.id)}
              isHovered={hoveredRowId === row.id}
              onSelect={showCheckbox ? handleSelectRow : undefined}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox={showCheckbox}
              renderCell={renderCell}
              renderActions={showActions ? renderActions : undefined}
              rowSx={getRowSx(row)}
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
  },
  skeletonContainer: {
    width: '100%',
    padding: '1.5rem',
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actionsRow: {
    display: 'flex',
    gap: '0.125rem',
  },
  suspendedRow: ({ palette }) => ({
    opacity: 0.5,
    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
  }),
};

export default UsersTable;
