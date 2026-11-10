import { memo, useCallback, useMemo } from 'react';

import { Chip, Tooltip, Typography } from '@mui/material';

import { useScimUserListQuery } from '@/api/scim.api';
import { GridTableBody, GridTableContainer, GridTableHeader, GridTableRow } from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';

const USER_COLUMNS = [
  { field: 'user_name', label: 'User', width: '1.2fr', sortable: false },
  { field: 'email', label: 'Email', width: '1.2fr', sortable: false, hideBelow: 900 },
  { field: 'elitea_user_id', label: 'ELITEA account', width: '9rem', sortable: false },
  { field: 'status', label: 'Status', width: '8rem', sortable: false },
  { field: 'groups', label: 'Groups', width: '1fr', sortable: false, hideBelow: 1100 },
  { field: 'updated_at', label: 'Last change', width: '12rem', sortable: false, hideBelow: 1000 },
];

const STATUS_CHIPS = {
  active: { label: 'Active', color: 'primary' },
  inactive: { label: 'Inactive', color: 'warning' },
  deleted: { label: 'Deleted', color: 'default' },
};

const formatDate = value => (value ? new Date(value).toLocaleString() : '-');

/** Users the IdP provisioned: their ELITEA account, state and direct groups */
const ScimUsersAudit = memo(() => {
  const styles = useMemo(() => scimUsersAuditStyles(), []);

  const users = useScimUserListQuery();
  const rows = useMemo(() => users.data?.rows ?? [], [users.data]);

  const columns = useResponsiveColumns({
    columns: USER_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
  });

  const renderCell = useCallback(
    (column, value, row) => {
      if (column.field === 'status') {
        const chip = STATUS_CHIPS[value] ?? STATUS_CHIPS.active;
        return (
          <Tooltip title={row.suspended_by_scim ? 'ELITEA account suspended by the sync' : ''}>
            <Chip
              label={chip.label}
              size="small"
              color={chip.color}
              variant="outlined"
            />
          </Tooltip>
        );
      }
      if (column.field === 'elitea_user_id') {
        return <Typography variant="bodyMedium">{value ? `#${value}` : 'Not linked'}</Typography>;
      }
      if (column.field === 'groups') {
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {value?.length ? value.join(', ') : '-'}
          </Typography>
        );
      }
      if (column.field === 'updated_at') {
        return <Typography variant="bodyMedium">{formatDate(value)}</Typography>;
      }
      return (
        <Tooltip title={column.field === 'user_name' ? (row.display_name ?? '') : ''}>
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {value ?? '-'}
          </Typography>
        </Tooltip>
      );
    },
    [styles],
  );

  if (users.isError) {
    return (
      <Typography
        variant="bodyMedium"
        color="error"
      >
        Failed to load users.
      </Typography>
    );
  }

  return (
    <GridTableContainer
      isLoading={users.isFetching}
      isEmpty={rows.length === 0}
      emptyMessage="No users provisioned yet. Assign users or groups to the enterprise app in the IdP."
    >
      <GridTableHeader
        columns={columns.visibleColumns}
        gridTemplateColumns={columns.gridTemplateColumns}
        showCheckbox={false}
      />
      <GridTableBody>
        {rows.map(row => (
          <GridTableRow
            key={row.id}
            row={row}
            columns={columns.dataColumns}
            gridTemplateColumns={columns.gridTemplateColumns}
            showCheckbox={false}
            idField="id"
            rowSx={row.status === 'deleted' ? styles.inactiveRow : undefined}
            renderCell={renderCell}
          />
        ))}
      </GridTableBody>
    </GridTableContainer>
  );
});

ScimUsersAudit.displayName = 'ScimUsersAudit';

/** @type {MuiSx} */
const scimUsersAuditStyles = () => ({
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  inactiveRow: {
    opacity: 0.6,
  },
});

export default ScimUsersAudit;
