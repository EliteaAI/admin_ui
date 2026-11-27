import { Fragment, memo, useCallback, useMemo, useState } from 'react';

import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import { Box, Chip, CircularProgress, Tooltip, Typography } from '@mui/material';

import {
  GridTableBody,
  GridTableContainer,
  GridTableHeader,
  GridTablePagination,
} from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';
import {
  EVENT_LABELS,
  PAGE_SIZE_OPTIONS,
} from '@/pages/LifecycleAuditPage/constants/lifecycleAudit.constants';
import {
  actorLabel,
  formatTableTimestamp,
  scopeLabel,
  summarizeChanges,
  timeZoneLabel,
  userLabel,
} from '@/pages/LifecycleAuditPage/helpers/lifecycleAudit.helpers';

import LifecycleAuditDetails from './LifecycleAuditDetails';

const TIME_LABEL = `Time (${timeZoneLabel()})`;

// Widths fit the header label plus the sort arrows and divider
const COLUMNS = {
  projects: [
    { field: 'time', label: TIME_LABEL, width: '11.5rem', sortable: true },
    { field: 'event_type', label: 'Event', width: '10rem', sortable: true },
    { field: 'project_name', label: 'Project name', width: 'minmax(10rem, 1.2fr)', sortable: true },
    { field: 'project_id', label: 'ID', width: '4.5rem', sortable: true, hideBelow: 900 },
    { field: 'affected_user', label: 'Affected user', width: 'minmax(9rem, 1.2fr)', sortable: false },
    { field: 'actor_name', label: 'Performed by', width: '10.5rem', sortable: true },
    { field: 'changes', label: 'Changes', width: 'minmax(9rem, 1fr)', sortable: false },
    { field: 'result', label: 'Result', width: '6.5rem', sortable: true },
    { field: 'expand', label: '', width: '2.5rem', sortable: false },
  ],
  users: [
    { field: 'time', label: TIME_LABEL, width: '11.5rem', sortable: true },
    { field: 'event_type', label: 'Event', width: '10rem', sortable: true },
    { field: 'user_name', label: 'User name', width: 'minmax(8rem, 1fr)', sortable: true },
    { field: 'user_id', label: 'ID', width: '4.5rem', sortable: true, hideBelow: 900 },
    { field: 'scope', label: 'Project / Scope', width: 'minmax(9rem, 1fr)', sortable: false },
    { field: 'actor_name', label: 'Performed by', width: '10.5rem', sortable: true },
    { field: 'changes', label: 'Changes', width: 'minmax(9rem, 1fr)', sortable: false },
    { field: 'result', label: 'Result', width: '6.5rem', sortable: true },
    { field: 'expand', label: '', width: '2.5rem', sortable: false },
  ],
};

const LifecycleAuditTable = memo(props => {
  const {
    tab,
    rows = [],
    total = 0,
    page = 0,
    pageSize = 50,
    sortConfig,
    isFetching,
    onSort,
    onPageChange,
    onPageSizeChange,
    footerContent,
  } = props;

  const [expanded, setExpanded] = useState(null);

  const styles = useMemo(() => lifecycleAuditTableStyles(), []);

  const { visibleColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: COLUMNS[tab],
    containerWidth: window.innerWidth,
    showCheckbox: false,
  });

  const handleToggle = useCallback(eventId => setExpanded(prev => (prev === eventId ? null : eventId)), []);

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
      rightContent: footerContent,
    }),
    [total, page, pageSize, onPageChange, onPageSizeChange, footerContent],
  );

  const renderCell = useCallback(
    (field, row, isExpanded) => {
      switch (field) {
        case 'time':
          return formatTableTimestamp(row.occurred_at);
        case 'event_type':
          return (
            <Box sx={styles.eventCell}>
              <Typography variant="bodySmall">{EVENT_LABELS[row.event_type] ?? row.event_type}</Typography>
              {row.admin_access && (
                <Chip
                  size="small"
                  label={`Admin ${row.admin_access}`}
                  color={row.admin_access === 'granted' ? 'warning' : 'default'}
                  sx={styles.chip}
                />
              )}
            </Box>
          );
        case 'affected_user':
        case 'user_name':
          return userLabel(row);
        case 'scope':
          return scopeLabel(row);
        case 'actor_name':
          return actorLabel(row);
        case 'changes': {
          const summary = summarizeChanges(row);
          return (
            <Tooltip
              title={summary}
              placement="top-start"
              disableHoverListener={!summary}
            >
              <Typography
                variant="bodySmall"
                sx={styles.cellText}
              >
                {summary}
              </Typography>
            </Tooltip>
          );
        }
        case 'expand':
          return (
            <Box
              component={ExpandMoreOutlined}
              sx={styles.expandIcon(isExpanded)}
            />
          );
        case 'result':
          return (
            <Chip
              size="small"
              label={row.result}
              color={row.result === 'success' ? 'success' : 'error'}
              variant="outlined"
              sx={styles.chip}
            />
          );
        default:
          return row[field] ?? '';
      }
    },
    [styles],
  );

  return (
    <Box sx={styles.root}>
      {isFetching && (
        <Box sx={styles.loadingOverlay}>
          <CircularProgress size={28} />
        </Box>
      )}
      <GridTableContainer
        isEmpty={!isFetching && rows.length === 0}
        emptyMessage="No audit events for these filters"
      >
        <Box data-testid="lifecycle-audit-header">
          <GridTableHeader
            columns={visibleColumns}
            sortConfig={sortConfig}
            onSort={onSort}
            gridTemplateColumns={gridTemplateColumns}
            showCheckbox={false}
          />
        </Box>
        <GridTableBody>
          {rows.map(row => (
            <Fragment key={row.event_id}>
              <Box
                sx={styles.row(gridTemplateColumns, expanded === row.event_id)}
                onClick={() => handleToggle(row.event_id)}
              >
                {visibleColumns.map(column => {
                  const content = renderCell(column.field, row, expanded === row.event_id);
                  return (
                    <Box
                      key={column.field}
                      sx={styles.cell}
                    >
                      {typeof content === 'object' ? (
                        content
                      ) : (
                        <Typography
                          variant="bodySmall"
                          sx={styles.cellText}
                        >
                          {content}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
              {expanded === row.event_id && <LifecycleAuditDetails row={row} />}
            </Fragment>
          ))}
        </GridTableBody>
        {total > 0 && <GridTablePagination {...paginationProps} />}
      </GridTableContainer>
    </Box>
  );
});

LifecycleAuditTable.displayName = 'LifecycleAuditTable';

/** @type {MuiSx} */
const lifecycleAuditTableStyles = () => ({
  root: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  loadingOverlay: ({ palette }) => ({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background.overlay.default,
    zIndex: 2,
    pointerEvents: 'none',
  }),
  row:
    (gridTemplateColumns, isExpanded) =>
    ({ palette }) => ({
      display: 'grid',
      gridTemplateColumns,
      alignItems: 'center',
      width: '100%',
      minHeight: '2.5rem',
      borderBottom: `0.0625rem solid ${palette.border.table}`,
      backgroundColor: isExpanded ? palette.background.tabPanel : 'transparent',
      cursor: 'pointer',
      '&:hover': { backgroundColor: palette.background.userInputBackground },
    }),
  cell: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  eventCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.125rem',
    minWidth: 0,
  },
  chip: {
    height: '1.25rem',
    fontSize: '0.6875rem',
  },
  expandIcon:
    isExpanded =>
    ({ palette }) => ({
      fontSize: '1.125rem',
      color: palette.icon.fill.default,
      transform: isExpanded ? 'rotate(180deg)' : 'none',
      transition: 'transform 0.15s',
    }),
});

export default LifecycleAuditTable;
