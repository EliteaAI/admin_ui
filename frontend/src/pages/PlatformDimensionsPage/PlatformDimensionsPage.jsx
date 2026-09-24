import { memo, useCallback, useMemo, useState } from 'react';

import BlockOutlined from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import { Alert, Box, Chip, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';

import {
  usePlatformDimensionCreateMutation,
  usePlatformDimensionDeactivateMutation,
  usePlatformDimensionListQuery,
  usePlatformDimensionResyncMutation,
  usePlatformDimensionUpdateMutation,
} from '@/api/platformDimensions.api';
import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { GridTableBody, GridTableContainer, GridTableHeader, GridTableRow } from '@/components/GridTable';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';

import PlatformDimensionDialog from './components/PlatformDimensionDialog';
import {
  EVALUATOR_LABELS,
  IMPORTANCE_LABELS,
  POLARITY_LABELS,
} from './constants/platformDimensions.constants';

const COLUMNS = [
  { field: 'name', label: 'Name', width: '1.2fr', sortable: false },
  { field: 'scale', label: 'Scale', width: '10rem', sortable: false },
  {
    field: 'allowed_engines',
    label: 'Evaluator',
    width: '9rem',
    sortable: false,
    hideBelow: 1000,
  },
  {
    field: 'polarity',
    label: 'Polarity',
    width: '9rem',
    sortable: false,
    hideBelow: 1100,
  },
  {
    field: 'default_weight',
    label: 'Importance',
    width: '7rem',
    sortable: false,
    hideBelow: 1300,
  },
  { field: 'is_active', label: 'Status', width: '9rem', sortable: false },
  { field: 'actions', label: 'Actions', width: '9rem', sortable: false },
];

const IMPORTANCE_MAP = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };

const getScaleLabel = row => {
  const { scale_type, scale_min, scale_max } = row;
  if (scale_type === 'binary') return 'Pass/Fail';
  if (scale_type === 'ordinal' && scale_min === 1 && scale_max === 5) return 'Rating (1-5)';
  if (scale_type === 'continuous' && scale_min === 1 && scale_max === 100) return 'Score (1-100)';
  return `Custom (${scale_min}–${scale_max})`;
};

const describeSync = result => {
  const synced = result?.synced_projects ?? 0;
  const failures = result?.failures ?? [];
  const head =
    synced === 0
      ? 'No project is using this dimension yet — nothing to sync.'
      : `Synced ${synced} project(s) using this dimension.`;
  if (!failures.length) return head;
  return `${head} ${failures.length} project(s) failed: ${failures
    .map(failure => failure.project_id)
    .join(', ')}.`;
};

const PlatformDimensionsPage = memo(() => {
  const styles = useMemo(() => platformDimensionsPageStyles(), []);

  usePageTitle('Platform dimensions');

  const { hasPermission } = useCheckPermission();
  const canCreate = hasPermission(PERMISSIONS.platformDimensions.create);
  const canEdit = hasPermission(PERMISSIONS.platformDimensions.edit);
  const canDeactivate = hasPermission(PERMISSIONS.platformDimensions.delete);

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isFetching, isError, refetch } = usePlatformDimensionListQuery();

  const [createDimension, { isLoading: isCreating }] = usePlatformDimensionCreateMutation();
  const [updateDimension, { isLoading: isUpdating }] = usePlatformDimensionUpdateMutation();
  const [deactivateDimension] = usePlatformDimensionDeactivateMutation();
  const [resyncDimension, { isLoading: isSyncing }] = usePlatformDimensionResyncMutation();

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(row => row.name?.toLowerCase().includes(term));
  }, [data, search]);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '9rem',
  });

  const notify = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSave = useCallback(
    async payload => {
      if (editTarget) {
        await updateDimension({ uuid: editTarget.uuid, ...payload }).unwrap();
        notify('Dimension updated. Use Sync to push it to projects using it.');
      } else {
        await createDimension(payload).unwrap();
        notify('Dimension created.');
      }
    },
    [editTarget, createDimension, updateDimension, notify],
  );

  const handleToggleActive = useCallback(
    async row => {
      try {
        if (row.is_active) {
          await deactivateDimension({ uuid: row.uuid }).unwrap();
        } else {
          await updateDimension({ uuid: row.uuid, is_active: true }).unwrap();
        }

        notify(
          row.is_active
            ? 'Dimension deactivated. Existing bindings and run history are kept.'
            : 'Dimension activated.',
        );
      } catch (err) {
        notify(err?.data?.error ?? err?.error ?? 'Failed to change the status.', 'error');
      }
    },
    [deactivateDimension, updateDimension, notify],
  );

  const handleSync = useCallback(
    async row => {
      try {
        const result = await resyncDimension({ uuid: row.uuid }).unwrap();
        notify(describeSync(result), result?.failures?.length ? 'warning' : 'success');
      } catch (err) {
        notify(err?.data?.error ?? err?.error ?? 'Failed to sync the dimension.', 'error');
      }
    },
    [resyncDimension, notify],
  );

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback(row => {
    setEditTarget(row);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const renderCell = useCallback(
    (column, value, row) => {
      if (column.field === 'scale') {
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {getScaleLabel(row)}
          </Typography>
        );
      }

      if (column.field === 'allowed_engines') {
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {(value ?? []).map(engine => EVALUATOR_LABELS[engine] ?? engine).join(' · ')}
          </Typography>
        );
      }

      if (column.field === 'default_weight') {
        const importanceKey = IMPORTANCE_MAP[value] ?? null;
        const importanceLabel = importanceKey ? IMPORTANCE_LABELS[importanceKey] : (value ?? '-');
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {importanceLabel}
          </Typography>
        );
      }

      if (column.field === 'polarity') {
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {POLARITY_LABELS[value] ?? value}
          </Typography>
        );
      }

      if (column.field === 'is_active') {
        return (
          <Chip
            label={value ? 'Active' : 'Inactive'}
            size="small"
            color={value ? 'primary' : 'default'}
            variant="outlined"
          />
        );
      }

      if (column.field === 'name') {
        return (
          <Tooltip
            title={row.description || ''}
            placement="top"
          >
            <Typography
              variant="bodyMedium"
              sx={styles.cellText}
            >
              {value || '-'}
            </Typography>
          </Tooltip>
        );
      }

      return (
        <Typography
          variant="bodyMedium"
          sx={styles.cellText}
        >
          {value ?? '-'}
        </Typography>
      );
    },
    [styles],
  );

  const renderActions = useCallback(
    row => (
      <Box sx={styles.actionsRow}>
        <Tooltip title={canEdit ? 'Edit dimension' : 'No permission to edit'}>
          <Box component="span">
            <IconButton
              size="small"
              disabled={!canEdit}
              onClick={() => openEdit(row)}
            >
              <EditOutlined fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip
          title={
            canEdit
              ? 'Sync to projects — pushes this definition to the projects already using it'
              : 'No permission to sync'
          }
        >
          <Box component="span">
            <IconButton
              size="small"
              disabled={!canEdit || isSyncing}
              onClick={() => handleSync(row)}
            >
              <SyncOutlined fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
        <Tooltip
          title={
            !canDeactivate
              ? 'No permission to change the status'
              : row.is_active
                ? 'Deactivate — hides it from project pickers, keeps existing bindings'
                : 'Activate'
          }
        >
          <Box component="span">
            <IconButton
              size="small"
              disabled={!canDeactivate}
              onClick={() => handleToggleActive(row)}
            >
              {row.is_active ? <BlockOutlined fontSize="small" /> : <CheckCircleOutlined fontSize="small" />}
            </IconButton>
          </Box>
        </Tooltip>
      </Box>
    ),
    [styles, canEdit, canDeactivate, isSyncing, openEdit, handleSync, handleToggleActive],
  );

  const headerControls = useMemo(
    () => (
      <Tooltip title="Reload">
        <Box component="span">
          <IconButton
            size="small"
            onClick={refetch}
            disabled={isFetching}
          >
            <RefreshOutlined fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>
    ),
    [refetch, isFetching],
  );

  return (
    <>
      <DrawerPage>
        <DrawerPageHeader
          title="Platform dimensions"
          showSearchInput
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name"
          extraContent={headerControls}
          showAddButton
          onAdd={openCreate}
          addButtonTooltip={canCreate ? 'New platform dimension' : 'No permission to create'}
          addButtonDisabled={!canCreate}
        />

        <Box sx={styles.tableContainer}>
          {isError ? (
            <Box sx={styles.errorContainer}>Failed to load platform dimensions.</Box>
          ) : (
            <GridTableContainer
              isLoading={isFetching}
              isEmpty={rows.length === 0}
              emptyMessage="No platform dimensions yet"
            >
              <GridTableHeader
                columns={visibleColumns}
                gridTemplateColumns={gridTemplateColumns}
                showCheckbox={false}
              />
              <GridTableBody>
                {rows.map(row => (
                  <GridTableRow
                    key={row.uuid}
                    row={row}
                    columns={dataColumns}
                    gridTemplateColumns={gridTemplateColumns}
                    showCheckbox={false}
                    idField="uuid"
                    renderCell={(column, value) => renderCell(column, value, row)}
                    renderActions={renderActions}
                  />
                ))}
              </GridTableBody>
            </GridTableContainer>
          )}
        </Box>
      </DrawerPage>

      <PlatformDimensionDialog
        open={dialogOpen}
        dimension={editTarget}
        isSaving={isCreating || isUpdating}
        onClose={closeDialog}
        onSave={handleSave}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 5000 : 10000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
});

PlatformDimensionsPage.displayName = 'PlatformDimensionsPage';

/** @type {MuiSx} */
const platformDimensionsPageStyles = () => ({
  tableContainer: {
    flexGrow: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  errorContainer: {
    padding: '1rem',
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
});

export default PlatformDimensionsPage;
