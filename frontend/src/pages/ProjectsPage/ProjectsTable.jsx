import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
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
  failed: { label: 'Failed', color: 'error' },
  pending: { label: 'Pending', color: 'default' },
};

const PROJECTS_COLUMNS = [
  { field: 'name', label: 'Name', width: '1.2fr', sortable: true },
  { field: 'id', label: 'ID', width: '5rem', sortable: true, hideBelow: 600 },
  { field: 'owner_name', label: 'Owner', width: '1fr', sortable: false, hideBelow: 800 },
  { field: 'admin_names', label: 'Admins', width: '1fr', sortable: false, hideBelow: 1100 },
  { field: 'status', label: 'Status', width: '7rem', sortable: true, hideBelow: 900 },
  { field: 'actions', label: 'Actions', width: '14rem', sortable: false },
];

const ProjectsTable = memo(function ProjectsTable(props) {
  const {
    projects = [],
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
    onAddAdmin,
    onSuspend,
    onActivity,
  } = props;

  const [hoveredRowId, setHoveredRowId] = useState(null);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: PROJECTS_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: true,
    actionsColumnWidth: '14rem',
  });

  const isAllSelected = useMemo(
    () => projects.length > 0 && projects.every((p) => selectedIds.includes(p.id)),
    [projects, selectedIds],
  );

  const isIndeterminate = useMemo(
    () => selectedIds.length > 0 && !isAllSelected,
    [selectedIds.length, isAllSelected],
  );

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(projects.map((p) => p.id));
    }
  }, [isAllSelected, projects, onSelectionChange]);

  const handleSelectRow = useCallback(
    (projectId) => {
      const isCurrentlySelected = selectedIds.includes(projectId);
      if (isCurrentlySelected) {
        onSelectionChange(selectedIds.filter((id) => id !== projectId));
      } else {
        onSelectionChange([...selectedIds, projectId]);
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

  const renderCell = useCallback((column, value) => {
    if (column.field === 'status') {
      const cfg = STATUS_CONFIG[value] || STATUS_CONFIG.pending;
      return <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
    }
    if (column.field === 'id') {
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {value}
        </Typography>
      );
    }
    if (column.field === 'admin_names') {
      const names = Array.isArray(value) ? value : [];
      const text = names.length > 0 ? names.join(', ') : '-';
      return (
        <Tooltip title={names.length > 1 ? text : ''} placement="top">
          <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
            {text}
          </Typography>
        </Tooltip>
      );
    }
    return (
      <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
        {value || '-'}
      </Typography>
    );
  }, []);

  const getRowSx = useCallback((row) => {
    if (row.status === 'suspended') return styles.suspendedRow;
    return undefined;
  }, []);

  const renderActions = useCallback(
    (row) => {
      const isSuspended = row.status === 'suspended';
      return (
        <Box sx={styles.actionsRow}>
          <Tooltip title="Add admin">
            <IconButton size="small" onClick={() => onAddAdmin(row)}>
              <PersonAddAlt1Outlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isSuspended ? 'Unsuspend project' : 'Suspend project'}>
            <IconButton size="small" onClick={() => onSuspend(row)}>
              {isSuspended
                ? <CheckCircleOutlined fontSize="small" color="success" />
                : <BlockOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Project activity">
            <IconButton size="small" onClick={() => onActivity(row)}>
              <TimelineOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete project">
            <IconButton size="small" onClick={() => onDelete([row.id])}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    [onDelete, onAddAdmin, onSuspend, onActivity],
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
        isEmpty={projects.length === 0}
        emptyMessage="No projects"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={onSort}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox
        />

        <GridTableBody>
          {projects.map((row) => (
            <GridTableRow
              key={row.id}
              row={row}
              columns={dataColumns}
              isSelected={selectedIds.includes(row.id)}
              isHovered={hoveredRowId === row.id}
              onSelect={handleSelectRow}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox
              renderCell={renderCell}
              renderActions={renderActions}
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

export default ProjectsTable;
