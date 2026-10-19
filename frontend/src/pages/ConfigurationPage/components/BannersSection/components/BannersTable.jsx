import { memo, useCallback, useMemo, useState } from 'react';

import ArrowDownwardOutlined from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowUpwardOutlined from '@mui/icons-material/ArrowUpwardOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Chip, IconButton, Skeleton, Tooltip } from '@mui/material';

import { GridTableBody, GridTableContainer, GridTableHeader, GridTableRow } from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';
import { PLACEMENT_OPTIONS } from '@/pages/ConfigurationPage/components/BannersSection/constants/banners.constants';

const BANNERS_COLUMNS = [
  { field: 'order', label: '#', width: '3rem', sortable: false },
  { field: 'name', label: 'Name', width: '1fr', sortable: false },
  { field: 'placement', label: 'Placement', width: '10rem', sortable: false, hideBelow: 700 },
  { field: 'dismissible', label: 'Dismissible', width: '7rem', sortable: false, hideBelow: 900 },
  { field: 'persist_dismissal', label: 'Remember close', width: '8.5rem', sortable: false, hideBelow: 1000 },
  { field: 'enabled', label: 'Status', width: '7rem', sortable: false },
  { field: 'actions', label: 'Actions', width: '7.5rem', sortable: false },
];

const PLACEMENT_LABELS = Object.fromEntries(PLACEMENT_OPTIONS.map(option => [option.value, option.label]));

const BannersTable = memo(props => {
  const { banners = [], isFetching = false, reordering = false, onRowClick, onMove, onDelete } = props;

  const styles = useMemo(() => bannersTableStyles(), []);

  const [hoveredRowId, setHoveredRowId] = useState(null);

  // The list refetches after each reorder; moving again before it lands would use the stale order
  const moveDisabled = reordering || isFetching;

  const rows = useMemo(() => banners.map((banner, index) => ({ ...banner, order: index + 1 })), [banners]);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: BANNERS_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '7.5rem',
  });

  const renderCell = useCallback((column, value) => {
    if (column.field === 'enabled') {
      return (
        <Chip
          label={value ? 'Enabled' : 'Disabled'}
          size="small"
          color={value ? 'success' : 'default'}
          variant="outlined"
        />
      );
    }
    if (column.field === 'dismissible' || column.field === 'persist_dismissal') {
      return value ? 'Yes' : 'No';
    }
    if (column.field === 'placement') {
      return PLACEMENT_LABELS[value] ?? String(value || '-');
    }
    // Return string so GridTableRow wraps it in Tooltip automatically
    return String(value || '-');
  }, []);

  const renderActions = useCallback(
    row => {
      const index = row.order - 1;
      return (
        <Box sx={styles.actionsRow}>
          <Tooltip title="Move up">
            <Box component="span">
              <IconButton
                size="small"
                disabled={index === 0 || moveDisabled}
                onClick={e => {
                  e.stopPropagation();
                  onMove(index, -1);
                }}
              >
                <ArrowUpwardOutlined fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
          <Tooltip title="Move down">
            <Box component="span">
              <IconButton
                size="small"
                disabled={index === banners.length - 1 || moveDisabled}
                onClick={e => {
                  e.stopPropagation();
                  onMove(index, 1);
                }}
              >
                <ArrowDownwardOutlined fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
          <Tooltip title="Delete banner">
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onDelete(row);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    [styles, banners.length, moveDisabled, onMove, onDelete],
  );

  if (isFetching && banners.length === 0) {
    return (
      <Box sx={styles.skeletonContainer}>
        {Array.from({ length: 3 }).map((_, index) => (
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
        isEmpty={rows.length === 0}
        emptyMessage="No banners yet. Click 'Add banner' to create one."
      >
        <GridTableHeader
          columns={visibleColumns}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {rows.map(row => (
            <Box
              key={row.id}
              onClick={() => onRowClick(row)}
              sx={styles.clickableRow}
            >
              <GridTableRow
                row={row}
                columns={dataColumns}
                isHovered={hoveredRowId === row.id}
                onMouseEnter={() => setHoveredRowId(row.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                gridTemplateColumns={gridTemplateColumns}
                showCheckbox={false}
                renderCell={renderCell}
                renderActions={renderActions}
              />
            </Box>
          ))}
        </GridTableBody>
      </GridTableContainer>
    </Box>
  );
});

BannersTable.displayName = 'BannersTable';

/** @type {MuiSx} */
const bannersTableStyles = () => ({
  tableContainer: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  actionsRow: {
    display: 'flex',
    gap: '0.125rem',
  },
  skeletonContainer: {
    width: '100%',
  },
  clickableRow: ({ palette }) => ({
    cursor: 'pointer',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    '&:last-of-type': {
      borderBottom: 'none',
    },
  }),
});

export default BannersTable;
