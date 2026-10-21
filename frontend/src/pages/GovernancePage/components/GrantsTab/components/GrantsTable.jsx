import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Chip, Link, Typography } from '@mui/material';

import { GridTableBody, GridTableHeader, GridTablePagination, GridTableRow } from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';
import GovernanceStateChip from '@/pages/GovernancePage/components/GovernanceStateChip';
import {
  bindingTitle,
  getRowActions,
  subjectLabel,
  toolkitTitle,
} from '@/pages/GovernancePage/components/GrantsTab/helpers/grants.helpers';
import RowActionsMenu from '@/pages/GovernancePage/components/RowActionsMenu';
import { FINISHED_STATES } from '@/pages/GovernancePage/constants/governance.constants';
import {
  buildPaginationProps,
  classLabel,
  formatDateTime,
  personName,
} from '@/pages/GovernancePage/helpers/governance.helpers';

const COLUMNS = [
  { field: 'binding', label: 'Agent', width: '1.4fr' },
  { field: 'toolkit', label: 'Toolkit', width: '1fr', hideBelow: 700 },
  { field: 'credential', label: 'Credential', width: '1.4fr', hideBelow: 700 },
  { field: 'subject', label: 'User', width: '1.3fr' },
  { field: 'state', label: 'State', width: '9rem', sortable: true },
  { field: 'valid_until', label: 'Valid until', width: '1fr', hideBelow: 900 },
  { field: 'approved_by', label: 'Approved by', width: '1.2fr', hideBelow: 1000 },
  { field: 'actions', label: '', width: '3.5rem' },
];

const NOT_A_MEMBER_HINT = 'This reference matches no member of the project.';

const GrantsTable = memo(props => {
  const {
    rows,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    sortConfig,
    onSort,
    onDetails,
    onAction,
    permissions,
  } = props;

  const styles = useMemo(() => grantsTableStyles(), []);

  const [hoveredRowId, setHoveredRowId] = useState(null);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '3.5rem',
  });

  const paginationProps = useMemo(
    () => buildPaginationProps({ total, page, pageSize, onPageChange, onPageSizeChange }),
    [total, page, pageSize, onPageChange, onPageSizeChange],
  );

  const renderCell = useCallback(
    (column, _, row) => {
      switch (column.field) {
        case 'binding':
          return (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => onDetails(row)}
              sx={styles.link}
              data-testid={`grant-open-${row.id}`}
            >
              {bindingTitle(row.binding)}
            </Link>
          );
        case 'toolkit':
          return toolkitTitle(row.toolkit);
        case 'credential':
          return (
            <Box sx={styles.stack}>
              <Typography variant="bodyMedium">
                {row.credential?.configuration_title ?? row.credential?.provider ?? '-'}
              </Typography>
              {row.credential?.ownership_class && (
                <Typography
                  variant="bodySmall"
                  sx={styles.muted}
                >
                  {classLabel(row.credential.ownership_class)}
                </Typography>
              )}
            </Box>
          );
        case 'subject':
          return (
            <Box sx={styles.subject}>
              <Typography
                variant="bodyMedium"
                sx={styles.truncate}
                data-testid="grant-subject"
              >
                {subjectLabel(row.subject)}
              </Typography>
              {!row.subject?.user && !String(row.subject?.ref ?? '').startsWith('mandate:') && (
                <Chip
                  label="Not a member"
                  size="small"
                  variant="outlined"
                  title={NOT_A_MEMBER_HINT}
                  data-testid="grant-not-member-chip"
                />
              )}
            </Box>
          );
        case 'state':
          return (
            <GovernanceStateChip
              state={row.state}
              testId="grant-state-chip"
            />
          );
        case 'valid_until':
          return row.valid_until ? formatDateTime(row.valid_until) : 'No end date';
        case 'approved_by':
          return personName(row.approved_by) ?? '-';
        default:
          return '-';
      }
    },
    [onDetails, styles],
  );

  const renderActions = useCallback(
    row => (
      <RowActionsMenu
        row={row}
        actions={getRowActions(row, permissions)}
        onDetails={onDetails}
        onAction={onAction}
        testIdPrefix="grant"
        ariaLabel="Grant actions"
      />
    ),
    [permissions, onDetails, onAction],
  );

  const getRowSx = useCallback(
    row => (FINISHED_STATES.includes(row.state) ? styles.finishedRow : undefined),
    [styles],
  );

  return (
    <>
      <GridTableHeader
        columns={visibleColumns}
        sortConfig={sortConfig}
        onSort={onSort}
        gridTemplateColumns={gridTemplateColumns}
        showCheckbox={false}
      />
      <GridTableBody>
        {rows.map(row => (
          <GridTableRow
            key={row.id}
            row={row}
            columns={dataColumns}
            isHovered={hoveredRowId === row.id}
            onMouseEnter={() => setHoveredRowId(row.id)}
            onMouseLeave={() => setHoveredRowId(null)}
            gridTemplateColumns={gridTemplateColumns}
            showCheckbox={false}
            renderCell={renderCell}
            renderActions={renderActions}
            rowSx={getRowSx(row)}
          />
        ))}
      </GridTableBody>
      {total > 0 && <GridTablePagination {...paginationProps} />}
    </>
  );
});

GrantsTable.displayName = 'GrantsTable';

/** @type {MuiSx} */
const grantsTableStyles = () => ({
  link: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    fontSize: '0.875rem',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  subject: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.25rem 0.5rem',
    minWidth: 0,
  },
  truncate: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  finishedRow: {
    opacity: 0.6,
  },
});

export default GrantsTable;
