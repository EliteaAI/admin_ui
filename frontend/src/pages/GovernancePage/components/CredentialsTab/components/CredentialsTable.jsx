import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Chip, Link, Tooltip, Typography } from '@mui/material';

import { GridTableBody, GridTableHeader, GridTablePagination, GridTableRow } from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';
import {
  getRowActions,
  storeLabel,
} from '@/pages/GovernancePage/components/CredentialsTab/helpers/credentials.helpers';
import GovernanceStateChip from '@/pages/GovernancePage/components/GovernanceStateChip';
import RowActionsMenu from '@/pages/GovernancePage/components/RowActionsMenu';
import { FINISHED_STATES } from '@/pages/GovernancePage/constants/governance.constants';
import {
  buildPaginationProps,
  classLabel,
  formatDateTime,
  isPersonal,
  referenceTitle,
} from '@/pages/GovernancePage/helpers/governance.helpers';

import PersonalCredentialNotice from './PersonalCredentialNotice';

const COLUMNS = [
  { field: 'configuration', label: 'Configuration', width: '1.5fr' },
  { field: 'provider', label: 'Provider', width: '0.9fr', sortable: true, hideBelow: 700 },
  { field: 'ownership_class', label: 'Class', width: '1.2fr', hideBelow: 700 },
  { field: 'store_kind', label: 'Store', width: '1fr', hideBelow: 900 },
  { field: 'state', label: 'State', width: '8rem', sortable: true },
  { field: 'generation', label: 'Gen.', width: '4rem', hideBelow: 900 },
  { field: 'validated', label: 'Probe', width: '4.5rem', hideBelow: 900 },
  { field: 'approved_by', label: 'Approved by', width: '1.2fr', hideBelow: 1000 },
  { field: 'updated_at', label: 'Updated', width: '1.1fr', sortable: true, hideBelow: 1000 },
  { field: 'actions', label: '', width: '3.5rem' },
];

const CHANGED_HINT =
  'The configuration changed after its credential was imported. Import it again to use the new values.';

const CredentialsTable = memo(props => {
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

  const styles = useMemo(() => credentialsTableStyles(), []);

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

  const hasPersonal = rows.some(isPersonal);

  const renderCell = useCallback(
    (column, _, row) => {
      switch (column.field) {
        case 'configuration':
          return (
            <Box sx={styles.configuration}>
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => onDetails(row)}
                sx={styles.link}
                data-testid={`credential-open-${row.id}`}
              >
                {referenceTitle(row)}
              </Link>
              {!isPersonal(row) && row.configuration_changed === true && (
                <Tooltip title={CHANGED_HINT}>
                  <Chip
                    label="Configuration changed"
                    size="small"
                    variant="outlined"
                    color="warning"
                    data-testid="credential-changed-chip"
                  />
                </Tooltip>
              )}
            </Box>
          );
        case 'provider':
          return row.provider ?? '-';
        case 'ownership_class':
          return (
            <Box sx={styles.classCell}>
              <Chip
                label={classLabel(row.ownership_class)}
                size="small"
                variant="outlined"
                data-testid="credential-class-chip"
              />
              {isPersonal(row) && (
                <Typography
                  variant="bodySmall"
                  sx={styles.muted}
                  data-testid="credential-owner"
                >
                  {row.owner?.email ?? '-'}
                </Typography>
              )}
            </Box>
          );
        case 'store_kind':
          return storeLabel(row.store_kind);
        case 'state':
          return (
            <GovernanceStateChip
              state={row.state}
              testId="credential-state-chip"
            />
          );
        case 'generation':
          return String(row.generation ?? 0);
        case 'validated':
          return row.validated ? 'OK' : '-';
        case 'approved_by':
          return row.approved_by?.email ?? '-';
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
        actions={getRowActions(row, permissions)}
        onDetails={onDetails}
        onAction={onAction}
        testIdPrefix="credential"
        ariaLabel="Credential actions"
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
      {hasPersonal && <PersonalCredentialNotice />}
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

CredentialsTable.displayName = 'CredentialsTable';

/** @type {MuiSx} */
const credentialsTableStyles = () => ({
  configuration: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.25rem 0.5rem',
    minWidth: 0,
  },
  link: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    fontSize: '0.875rem',
  },
  classCell: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.125rem',
    minWidth: 0,
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  finishedRow: {
    opacity: 0.6,
  },
});

export default CredentialsTable;
