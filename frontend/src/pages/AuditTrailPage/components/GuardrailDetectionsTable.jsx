import { memo, useCallback, useMemo, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
  GridTableRow,
} from '@/components/GridTable';

// Input guardrail audit actions are `input:<category>.<rule>:<action>` (#6886)
const COLUMNS = [
  { field: 'category', label: 'Category', width: '10rem' },
  { field: 'rule', label: 'Rule', width: 'minmax(0, 1fr)' },
  { field: 'outcome', label: 'Action', width: '6rem' },
  { field: 'count', label: 'Count', width: '6rem' },
];

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const parseAction = action => {
  const [, rulePath = '', outcome = '-'] = (action || '').split(':');
  const [category = '-', ...rest] = rulePath.split('.');
  return { category, rule: rest.join('.') || '-', outcome };
};

const GuardrailDetectionsTable = memo(props => {
  const {
    groups = [],
    total = 0,
    page = 0,
    pageSize = 50,
    onPageChange,
    onPageSizeChange,
    isFetching,
    onActionClick,
  } = props;

  const [hoveredAction, setHoveredAction] = useState(null);

  const styles = useMemo(() => guardrailDetectionsTableStyles(), []);

  const gridTemplateColumns = COLUMNS.map(column => column.width).join(' ');

  const rows = useMemo(
    () => groups.map(group => ({ ...group, id: group.action, ...parseAction(group.action) })),
    [groups],
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

  const renderCell = useCallback(
    (column, value, row) => (
      <Typography
        variant="bodyMedium"
        sx={[styles.cellText, column.field === 'rule' && styles.ruleText]}
        onClick={column.field === 'rule' ? () => onActionClick?.(row.action) : undefined}
      >
        {value != null ? String(value) : '-'}
      </Typography>
    ),
    [onActionClick, styles],
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
        emptyMessage="No input guardrail detections"
      >
        <GridTableHeader
          columns={COLUMNS}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {rows.map(row => (
            <GridTableRow
              key={row.id}
              row={row}
              columns={COLUMNS}
              isSelected={false}
              isHovered={hoveredAction === row.id}
              onMouseEnter={() => setHoveredAction(row.id)}
              onMouseLeave={() => setHoveredAction(null)}
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

GuardrailDetectionsTable.displayName = 'GuardrailDetectionsTable';

/** @type {MuiSx} */
const guardrailDetectionsTableStyles = () => ({
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
  cellText: ({ palette }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
  }),
  ruleText: {
    cursor: 'pointer',
    '&:hover': { textDecoration: 'underline' },
  },
});

export default GuardrailDetectionsTable;
