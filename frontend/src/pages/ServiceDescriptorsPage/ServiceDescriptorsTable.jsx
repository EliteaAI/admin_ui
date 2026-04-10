import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import { useTableSort } from '@/hooks/useTableSort';
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
} from '@/components/GridTable';

const DESCRIPTOR_COLUMNS = [
  { field: 'project_id', label: 'Project ID', width: '8rem', sortable: true },
  { field: 'provider_name', label: 'Provider Name', width: '1fr', sortable: true },
  { field: 'service_location_url', label: 'Service URL', width: '2fr', sortable: true },
  { field: 'healthy', label: 'Healthy', width: '8rem', sortable: true },
  { field: 'actions', label: '', width: '4rem', sortable: false },
];

const ServiceDescriptorsTable = memo(function ServiceDescriptorsTable({ descriptors, search, onDelete, isFetching }) {
  const [hoveredRowId, setHoveredRowId] = useState(null);

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'provider_name',
    defaultDirection: 'asc',
  });

  const filteredDescriptors = useMemo(() => {
    if (!search) return descriptors;
    const lowerSearch = search.toLowerCase();
    return descriptors.filter((d) => 
      (d.provider_name || '').toLowerCase().includes(lowerSearch) ||
      (d.service_location_url || '').toLowerCase().includes(lowerSearch)
    );
  }, [descriptors, search]);

  const sortedDescriptors = useMemo(() => sortData(filteredDescriptors), [sortData, filteredDescriptors]);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: DESCRIPTOR_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '4rem',
  });

  const renderCell = useCallback((column, value, row) => {
    if (column.field === 'healthy') {
      const color = value ? 'success' : 'error';
      const label = value ? 'Yes' : 'No';
      return <Chip label={label} size="small" color={color} variant="outlined" />;
    }

    if (column.field === 'project_id') {
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellTextMono}>
          {value != null ? value : '\u2014'}
        </Typography>
      );
    }

    return (
      <Tooltip title={value || ''}>
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {value || '\u2014'}
        </Typography>
      </Tooltip>
    );
  }, []);

  const renderActions = useCallback(
    (row) => {
      return (
        <Box sx={styles.actionsRow}>
          <Tooltip title="Delete descriptor">
            <IconButton size="small" onClick={() => onDelete(row)}>
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      );
    },
    [onDelete],
  );

  return (
    <Box sx={styles.tableContainer}>
      <GridTableContainer
        isLoading={isFetching}
        isEmpty={sortedDescriptors.length === 0}
        emptyMessage="No service descriptors found"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={handleSort}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {sortedDescriptors.map((row) => {
            const rowKey = `${row.project_id}_${row.provider_name}_${row.service_location_url}`;
            return (
              <GridTableRow
                key={rowKey}
                row={row}
                columns={dataColumns}
                isHovered={hoveredRowId === rowKey}
                onMouseEnter={() => setHoveredRowId(rowKey)}
                onMouseLeave={() => setHoveredRowId(null)}
                gridTemplateColumns={gridTemplateColumns}
                showCheckbox={false}
                renderCell={renderCell}
                renderActions={renderActions}
              />
            );
          })}
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

export default ServiceDescriptorsTable;
