import { memo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const GridTableRow = memo(function GridTableRow(props) {
  const {
    row,
    columns = [],
    isSelected = false,
    isHovered = false,
    onSelect,
    onMouseEnter,
    onMouseLeave,
    gridTemplateColumns,
    showCheckbox = true,
    idField = 'id',
    renderCell,
    renderActions,
    rowSx,
  } = props;

  const styles = gridTableRowStyles(isSelected, isHovered, gridTemplateColumns, showCheckbox);
  const rowId = row[idField];

  const handleCheckboxChange = useCallback(() => {
    onSelect?.(rowId);
  }, [onSelect, rowId]);

  const dataColumns = columns.filter((col) => col.field !== 'actions');

  return (
    <Box sx={[styles.row, ...(Array.isArray(rowSx) ? rowSx : rowSx ? [rowSx] : [])]} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {showCheckbox && (
        <Box sx={styles.checkboxCell}>
          <Checkbox
            checked={isSelected}
            onChange={handleCheckboxChange}
            color="secondary"
            sx={styles.checkbox}
            onClick={(e) => e.stopPropagation()}
          />
        </Box>
      )}

      {dataColumns.map((column) => {
        const value = row[column.displayField || column.field];
        let cellContent;

        if (renderCell) {
          cellContent = renderCell(column, value, row);
        } else if (typeof column.format === 'function') {
          cellContent = column.format(value, row);
        } else {
          cellContent = value ?? '-';
        }

        if (typeof cellContent === 'string') {
          return (
            <Box key={column.field} sx={styles.dataCell(column)}>
              <Tooltip title={cellContent} placement="top" disableInteractive>
                <Typography
                  variant="bodyMedium"
                  color="text.secondary"
                  sx={styles.cellText}
                >
                  {cellContent}
                </Typography>
              </Tooltip>
            </Box>
          );
        }

        return (
          <Box key={column.field} sx={styles.dataCell(column)}>
            {cellContent}
          </Box>
        );
      })}

      {renderActions && (
        <Box sx={styles.actionsCell}>{renderActions(row)}</Box>
      )}
    </Box>
  );
});

const gridTableRowStyles = (isSelected, isHovered, gridTemplateColumns, showCheckbox) => ({
  row: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: gridTemplateColumns || (showCheckbox ? '3rem 1fr' : '1fr'),
    alignItems: 'center',
    width: '100%',
    minHeight: '2.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: isSelected || isHovered ? palette.background.userInputBackground : 'transparent',
    transition: 'background-color 0.2s ease',
    '&:first-of-type': {
      borderTopLeftRadius: '0.5rem',
      borderTopRightRadius: '0.5rem',
    },
    '&:last-of-type': {
      borderBottom: 'none',
      borderBottomLeftRadius: '0.5rem',
      borderBottomRightRadius: '0.5rem',
    },
  }),
  checkboxCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  checkbox: {
    padding: '0.375rem',
  },
  dataCell: (column) => ({
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    padding: '0.5rem 1rem',
    minWidth: 0,
    overflow: 'hidden',
    ...(column?.align === 'right' && { justifyContent: 'flex-end' }),
  }),
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  actionsCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    minWidth: 0,
    overflow: 'hidden',
  },
});

export default GridTableRow;
