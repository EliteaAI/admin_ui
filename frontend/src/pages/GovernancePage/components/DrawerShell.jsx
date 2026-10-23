import { memo } from 'react';

import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { Alert, Box, Drawer, IconButton, Skeleton, Typography } from '@mui/material';

import { GridTablePagination } from '@/components/GridTable';

const SKELETON_COUNT = 4;

/**
 * The frame the drawers of this page share: header with close button, an error alert, an optional notice,
 * loading skeletons, an empty text, the rows (each wrapped in a divider row) and the pagination.
 * `rows` is a list of `{ key, testId, content }`; `paginationProps` is the result of `getPaginationProps(total)`.
 */
const DrawerShell = memo(props => {
  const {
    open,
    onClose,
    title,
    subtitle,
    testId,
    isLoading = false,
    errorText,
    notice,
    emptyText,
    skeletonHeight = '3rem',
    rows = [],
    paginationProps,
  } = props;

  const styles = drawerShellStyles();

  const showRows = !isLoading && rows.length > 0;
  const showEmpty = !isLoading && !errorText && !notice && rows.length === 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: styles.paper }}
    >
      <Box sx={styles.header}>
        <Box sx={styles.headerText}>
          <Typography variant="headingSmall">{title}</Typography>
          {subtitle && (
            <Typography
              variant="bodySmall"
              sx={styles.muted}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
        >
          <CloseOutlined fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={styles.body}
        data-testid={testId}
      >
        {errorText && <Alert severity="error">{errorText}</Alert>}
        {notice && <Alert severity="info">{notice}</Alert>}

        {isLoading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={skeletonHeight}
            />
          ))}

        {showEmpty && (
          <Typography
            variant="bodyMedium"
            sx={styles.muted}
          >
            {emptyText}
          </Typography>
        )}

        {showRows &&
          rows.map(row => (
            <Box
              key={row.key}
              sx={styles.row}
              data-testid={row.testId}
            >
              {row.content}
            </Box>
          ))}

        {paginationProps?.totalRows > 0 && <GridTablePagination {...paginationProps} />}
      </Box>
    </Drawer>
  );
});

DrawerShell.displayName = 'DrawerShell';

/** @type {MuiSx} */
const drawerShellStyles = () => ({
  paper: {
    width: { xs: '100%', sm: '30rem' },
    padding: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  row: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    paddingBottom: '0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
});

export default DrawerShell;
