import { memo, useCallback, useMemo, useState } from 'react';

import { Link } from '@mui/material';

import { GridTableBody, GridTableHeader, GridTablePagination, GridTableRow } from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';
import GovernanceStateChip from '@/pages/GovernancePage/components/GovernanceStateChip';
import {
  consentLabel,
  getRowActions,
  identityLabel,
} from '@/pages/GovernancePage/components/MandatesTab/helpers/mandates.helpers';
import RowActionsMenu from '@/pages/GovernancePage/components/RowActionsMenu';
import {
  buildPaginationProps,
  formatDateTime,
  personName,
} from '@/pages/GovernancePage/helpers/governance.helpers';

const COLUMNS = [
  { field: 'agent', label: 'Agent', width: '1.4fr' },
  { field: 'version', label: 'Version', width: '0.6fr' },
  { field: 'owner', label: 'Owner', width: '1.3fr' },
  { field: 'state', label: 'State', width: '9rem' },
  { field: 'identity', label: 'Acts with', width: '1.2fr', hideBelow: 800 },
  { field: 'consent', label: 'Consent', width: '8rem', hideBelow: 800 },
  { field: 'valid_until', label: 'Valid until', width: '1.1fr', hideBelow: 1000 },
  { field: 'actions', label: '', width: '3.5rem' },
];

const MandatesTable = memo(props => {
  const {
    rows,
    total,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    onDetails,
    onAction,
    canManage,
    canApprove,
    userId,
  } = props;

  const styles = useMemo(() => mandatesTableStyles(), []);

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

  const handleOpen = useCallback(row => () => onDetails(row), [onDetails]);

  const renderCell = useCallback(
    (column, _, row) => {
      switch (column.field) {
        case 'agent':
          return (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={handleOpen(row)}
              sx={styles.agentLink}
              data-testid={`mandate-open-${row.id}`}
            >
              {row.application?.name ?? '-'}
            </Link>
          );
        case 'version':
          return row.version?.name ?? String(row.version?.id ?? '-');
        case 'owner':
          return personName(row.owner) ?? '-';
        case 'state':
          return (
            <GovernanceStateChip
              state={row.state}
              testId="mandate-state-chip"
            />
          );
        case 'identity':
          return identityLabel(row.identity_source);
        case 'consent':
          return consentLabel(row);
        case 'valid_until':
          return formatDateTime(row.valid_until);
        default:
          return '-';
      }
    },
    [handleOpen, styles],
  );

  const renderActions = useCallback(
    row => (
      <RowActionsMenu
        row={row}
        actions={getRowActions(row, { canManage, canApprove, userId })}
        onDetails={onDetails}
        onAction={onAction}
        testIdPrefix="mandate"
        ariaLabel="Mandate actions"
      />
    ),
    [canManage, canApprove, userId, onDetails, onAction],
  );

  return (
    <>
      <GridTableHeader
        columns={visibleColumns}
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
          />
        ))}
      </GridTableBody>
      {total > 0 && <GridTablePagination {...paginationProps} />}
    </>
  );
});

MandatesTable.displayName = 'MandatesTable';

/** @type {MuiSx} */
const mandatesTableStyles = () => ({
  agentLink: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    fontSize: '0.875rem',
  },
});

export default MandatesTable;
