import { memo, useCallback, useMemo, useState } from 'react';

import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import { Alert, Box, Button, Chip, IconButton, Snackbar, Tooltip, Typography } from '@mui/material';

import { useOAuthAppListQuery } from '@/api/oauthApps.api';
import { GridTableBody, GridTableContainer, GridTableHeader, GridTableRow } from '@/components/GridTable';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';

import DeleteOAuthAppDialog from './components/DeleteOAuthAppDialog';
import OAuthAppDialog from './components/OAuthAppDialog';
import { providerOf } from './constants/oauthApps.constants';

const COLUMNS = [
  { field: 'name', label: 'Name', width: '1.2fr', sortable: false },
  { field: 'provider', label: 'Provider', width: '10rem', sortable: false, hideBelow: 900 },
  { field: 'client_id', label: 'Client ID', width: '1.4fr', sortable: false, hideBelow: 1100 },
  { field: 'credential_types', label: 'Credentials', width: '1.2fr', sortable: false, hideBelow: 1000 },
  { field: 'allowed_project_ids', label: 'Projects', width: '7rem', sortable: false },
  { field: 'enabled', label: 'Status', width: '9rem', sortable: false },
  { field: 'actions', label: '', sortable: false },
];

const OAuthAppsSection = memo(() => {
  const styles = useMemo(() => oauthAppsSectionStyles(), []);

  const { hasPermission } = useCheckPermission();
  const canEdit = hasPermission(PERMISSIONS.oauthApps.edit);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { data, isFetching, isError } = useOAuthAppListQuery();
  const rows = useMemo(() => data?.rows ?? [], [data]);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '6rem',
  });

  const notify = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const openCreate = useCallback(() => {
    setEditTarget(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback(row => {
    setEditTarget(row);
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => setDialogOpen(false), []);
  const closeDelete = useCallback(() => setDeleteTarget(null), []);
  const closeSnackbar = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  const handleSaved = useCallback(
    isEdit => notify(isEdit ? 'App updated. Credentials that use it pick up the change.' : 'App created.'),
    [notify],
  );
  const handleDeleted = useCallback(() => notify('App deleted.'), [notify]);

  const renderCell = useCallback(
    (column, value, row) => {
      if (column.field === 'provider') {
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {providerOf(row).label}
          </Typography>
        );
      }
      if (column.field === 'credential_types') {
        const provider = providerOf(row);
        const types = value ?? provider.scopeGroups.map(group => group.type);
        return (
          <Box sx={styles.chips}>
            {provider.scopeGroups
              .filter(group => types.includes(group.type))
              .map(group => (
                <Chip
                  key={group.type}
                  label={group.label}
                  size="small"
                  variant="outlined"
                />
              ))}
          </Box>
        );
      }
      if (column.field === 'allowed_project_ids') {
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {value?.length ? `${value.length} selected` : 'All'}
          </Typography>
        );
      }
      if (column.field === 'enabled') {
        return (
          <Box sx={styles.chips}>
            <Chip
              label={value ? 'Enabled' : 'Disabled'}
              size="small"
              color={value ? 'primary' : 'default'}
              variant="outlined"
            />
            {row.is_default && (
              <Chip
                label="Default"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        );
      }
      return (
        <Tooltip
          title={column.field === 'name' ? row.oauth_discovery_endpoint : ''}
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
    },
    [styles],
  );

  const renderActions = useCallback(
    row => (
      <Box sx={styles.actionsRow}>
        <Tooltip title={canEdit ? 'Edit app' : 'No permission to edit'}>
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
        <Tooltip title={canEdit ? 'Delete app' : 'No permission to delete'}>
          <Box component="span">
            <IconButton
              size="small"
              disabled={!canEdit}
              onClick={() => setDeleteTarget(row)}
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </Box>
        </Tooltip>
      </Box>
    ),
    [styles, canEdit, openEdit],
  );

  return (
    <Box sx={styles.root}>
      <Box sx={styles.headerRow}>
        <Typography
          variant="body2"
          sx={styles.description}
        >
          OAuth apps used by credentials of their provider (Microsoft Entra ID: Teams, Outlook and
          SharePoint). With a Default app, users get it and enter nothing. With enabled apps but no default,
          users choose an app or their own (Custom app). With no enabled app, users always enter their own
          app. Each provider has at most one Default app.
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={openCreate}
          disabled={!canEdit}
          sx={styles.addButton}
        >
          New Configuration for App
        </Button>
      </Box>

      {isError ? (
        <Typography
          variant="bodyMedium"
          color="error"
        >
          Failed to load OAuth apps.
        </Typography>
      ) : (
        <GridTableContainer
          isLoading={isFetching}
          isEmpty={rows.length === 0}
          emptyMessage="No apps yet. Users can still bring their own app (Custom app)."
        >
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
                gridTemplateColumns={gridTemplateColumns}
                showCheckbox={false}
                idField="id"
                rowSx={row.enabled ? undefined : styles.disabledRow}
                renderCell={(column, value) => renderCell(column, value, row)}
                renderActions={renderActions}
              />
            ))}
          </GridTableBody>
        </GridTableContainer>
      )}

      <OAuthAppDialog
        open={dialogOpen}
        app={editTarget}
        onClose={closeDialog}
        onSaved={handleSaved}
      />

      <DeleteOAuthAppDialog
        open={Boolean(deleteTarget)}
        app={deleteTarget}
        onClose={closeDelete}
        onDeleted={handleDeleted}
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
          sx={styles.snackbarAlert}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

OAuthAppsSection.displayName = 'OAuthAppsSection';

/** @type {MuiSx} */
const oauthAppsSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    maxWidth: '50rem',
  }),
  addButton: {
    textTransform: 'none',
    flexShrink: 0,
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  disabledRow: {
    opacity: 0.6,
  },
  snackbarAlert: {
    width: '100%',
  },
});

export default OAuthAppsSection;
