import { memo } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import ArrowLeftIcon from '@/components/Icons/ArrowLeftIcon';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';

const GridTablePagination = memo(function GridTablePagination(props) {
  const {
    totalRows = 0,
    isFirstPage,
    isLastPage,
    startRow,
    endRow,
    pageSizeOptions = [],
    pageSize,
    handlePrevPage,
    handleNextPage,
    handlePageSizeChange,
    rowsPerPageLabel = 'Rows per page:',
  } = props;

  const styles = gridTablePaginationStyles();

  if (totalRows === 0) {
    return null;
  }

  return (
    <Box sx={styles.footer}>
      <Box sx={styles.paddingContent}>
        <Box sx={styles.left}>
          <Typography variant="bodyMedium" color="text.primary">
            {rowsPerPageLabel}
          </Typography>
          <Select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            variant="standard"
            disableUnderline
            sx={styles.pageSizeDropdown}
          >
            {pageSizeOptions.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.pageInfo}>
          {`${startRow} - ${endRow} of ${totalRows}`}
        </Typography>
        <Box sx={styles.right}>
          <IconButton
            onClick={handlePrevPage}
            sx={styles.paginationButton(isFirstPage)}
            size="small"
            disabled={isFirstPage}
          >
            <Box component={ArrowLeftIcon} sx={styles.arrowIcon(isFirstPage)} />
          </IconButton>
          <IconButton
            onClick={handleNextPage}
            sx={styles.paginationButton(isLastPage)}
            size="small"
            disabled={isLastPage}
          >
            <Box component={ArrowRightIcon} sx={styles.arrowIcon(isLastPage)} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
});

const gridTablePaginationStyles = () => ({
  footer: ({ palette }) => ({
    display: 'flex',
    paddingTop: '1rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  paddingContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.625rem',
    paddingLeft: '1rem',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pageSizeDropdown: {
    minWidth: '1.75rem',
    '& .MuiSelect-select': {
      padding: '0.25rem 1.25rem 0.25rem 0.25rem',
      display: 'flex',
      alignItems: 'center',
    },
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  pageInfo: {
    minWidth: '4.5rem',
    textAlign: 'center',
  },
  paginationButton: (isDisabled) => ({
    padding: '0.375rem',
    minWidth: 0,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.4 : 1,
    transition: 'opacity 0.2s ease',
    '&:hover': {
      backgroundColor: isDisabled ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
    },
  }),
  arrowIcon: (isDisabled) => ({ palette }) => ({
    fontSize: '1rem',
    fill: isDisabled ? palette.icon.fill.disabled : palette.icon.fill.default,
    color: isDisabled ? palette.icon.fill.disabled : palette.icon.fill.default,
    transition: 'fill 0.2s ease, color 0.2s ease',
  }),
});

export default GridTablePagination;
