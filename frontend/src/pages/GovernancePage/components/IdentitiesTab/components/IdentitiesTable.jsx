import { memo, useCallback, useMemo, useState } from 'react';

import { Link } from '@mui/material';

import { GridTableBody, GridTableHeader, GridTablePagination, GridTableRow } from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';
import GovernanceStateChip from '@/pages/GovernancePage/components/GovernanceStateChip';
import {
  getRowActions,
  modeLabel,
} from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';
import RowActionsMenu from '@/pages/GovernancePage/components/RowActionsMenu';
import { buildPaginationProps, formatDateTime } from '@/pages/GovernancePage/helpers/governance.helpers';

import DigestStatusChip from './DigestStatusChip';

const COLUMNS = [
  { field: 'application_name', label: 'Agent', width: '1.4fr', sortable: true },
  { field: 'version', label: 'Version', width: '0.7fr' },
  { field: 'identity_mode', label: 'Identity mode', width: '1.1fr', hideBelow: 900 },
  { field: 'digest_status', label: 'Definition', width: '7rem', hideBelow: 700 },
  { field: 'state', label: 'State', width: '9rem', sortable: true },
  { field: 'created_by', label: 'Created by', width: '1.2fr', hideBelow: 1000 },
  { field: 'updated_at', label: 'Updated', width: '1.1fr', sortable: true, hideBelow: 900 },
  { field: 'actions', label: '', width: '3.5rem' },
];

const IdentitiesTable = memo(props => {
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
    canManage,
    canApprove,
    userId,
  } = props;

  const styles = useMemo(() => identitiesTableStyles(), []);

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
        case 'application_name':
          return (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => onDetails(row)}
              sx={styles.agentLink}
              data-testid={`identity-open-${row.id}`}
            >
              {row.application?.name ?? '-'}
            </Link>
          );
        case 'version':
          return row.version?.name ?? '-';
        case 'identity_mode':
          return modeLabel(row.identity_mode);
        case 'digest_status':
          return <DigestStatusChip status={row.digest_status} />;
        case 'state':
          return (
            <GovernanceStateChip
              state={row.state}
              testId="identity-state-chip"
            />
          );
        case 'created_by':
          return row.created_by?.email ?? '-';
        case 'updated_at':
          return formatDateTime(row.updated_at);
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
        actions={getRowActions(row, { canManage, canApprove, userId })}
        onDetails={onDetails}
        onAction={onAction}
        testIdPrefix="identity"
        ariaLabel="Identity actions"
      />
    ),
    [canManage, canApprove, userId, onDetails, onAction],
  );

  const getRowSx = useCallback(row => (row.state === 'retired' ? styles.retiredRow : undefined), [styles]);

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

IdentitiesTable.displayName = 'IdentitiesTable';

/** @type {MuiSx} */
const identitiesTableStyles = () => ({
  agentLink: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    fontSize: '0.875rem',
  },
  retiredRow: {
    opacity: 0.6,
  },
});

export default IdentitiesTable;
