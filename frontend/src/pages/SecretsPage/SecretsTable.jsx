import { memo, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';

import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
  GridTablePagination,
} from '@/components/GridTable';
import { useLazySecretRevealQuery } from '@/api/secretsApi';

const COLUMNS = [
  { field: 'name', label: 'Name', width: '1.5fr', sortable: true },
  { field: 'value', label: 'Value', width: '2fr', sortable: false },
  { field: 'actions', label: '', width: '8rem', sortable: false },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const SecretsTable = memo(function SecretsTable({
  secrets,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  sortConfig,
  onSort,
  isFetching,
  isReadOnly,
  onEdit,
  onDelete,
}) {
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [triggerReveal] = useLazySecretRevealQuery();

  // Clear revealed values when data changes (after create/edit/delete)
  useEffect(() => {
    setRevealedSecrets({});
  }, [total]);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '8rem',
  });

  const handleRevealToggle = useCallback(
    async (name) => {
      if (revealedSecrets[name] !== undefined) {
        setRevealedSecrets((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
        return;
      }
      try {
        const result = await triggerReveal({ name }).unwrap();
        setRevealedSecrets((prev) => ({ ...prev, [name]: result.secret ?? '' }));
      } catch {
        // silently fail
      }
    },
    [revealedSecrets, triggerReveal],
  );

  const renderCell = useCallback(
    (column, value, row) => {
      if (column.field === 'name') {
        return (
          <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellTextMono}>
            {value}
          </Typography>
        );
      }
      if (column.field === 'value') {
        const revealed = revealedSecrets[row.name];
        return (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            sx={revealed !== undefined ? styles.cellTextMonoWrap : styles.cellTextMono}
          >
            {revealed !== undefined ? revealed : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
          </Typography>
        );
      }
      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {value ?? '\u2014'}
        </Typography>
      );
    },
    [revealedSecrets],
  );

  const renderActions = useCallback(
    (row) => {
      const isRevealed = revealedSecrets[row.name] !== undefined;
      return (
        <Box sx={styles.actions}>
          <Tooltip title={isRevealed ? 'Hide value' : 'Reveal value'}>
            <IconButton size="small" onClick={() => handleRevealToggle(row.name)}>
              {isRevealed ? (
                <VisibilityOffOutlined fontSize="small" />
              ) : (
                <VisibilityOutlined fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          {!isReadOnly && (
            <>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(row.name)}>
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete(row.name)}>
                  <DeleteOutlined fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      );
    },
    [revealedSecrets, isReadOnly, handleRevealToggle, onEdit, onDelete],
  );

  const startRow = page * pageSize + 1;
  const endRow = Math.min((page + 1) * pageSize, total);
  const isFirstPage = page === 0;
  const isLastPage = (page + 1) * pageSize >= total;

  return (
    <GridTableContainer
      isLoading={isFetching}
      isEmpty={secrets.length === 0 && !isFetching}
      emptyMessage="No secrets found"
    >
      <GridTableHeader
        columns={visibleColumns}
        gridTemplateColumns={gridTemplateColumns}
        showCheckbox={false}
        sortConfig={sortConfig}
        onSort={onSort}
      />
      <GridTableBody>
        {secrets.map((secret) => (
          <GridTableRow
            key={secret.name}
            row={secret}
            columns={dataColumns}
            gridTemplateColumns={gridTemplateColumns}
            showCheckbox={false}
            renderCell={renderCell}
            renderActions={renderActions}
            idField="name"
          />
        ))}
      </GridTableBody>
      {total > 0 && (
        <GridTablePagination
          totalRows={total}
          isFirstPage={isFirstPage}
          isLastPage={isLastPage}
          startRow={startRow}
          endRow={endRow}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          pageSize={pageSize}
          handlePrevPage={() => onPageChange(page - 1)}
          handleNextPage={() => onPageChange(page + 1)}
          handlePageSizeChange={onPageSizeChange}
        />
      )}
    </GridTableContainer>
  );
});

const styles = {
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
    fontSize: '0.8125rem',
  },
  cellTextMonoWrap: {
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
    wordBreak: 'break-all',
    whiteSpace: 'normal',
  },
  actions: {
    display: 'flex',
    gap: '0.125rem',
  },
};

SecretsTable.propTypes = {
  secrets: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  sortConfig: PropTypes.object,
  onSort: PropTypes.func,
  isFetching: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default SecretsTable;
