import { memo, useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { Alert, Box, Snackbar } from '@mui/material';

import { useAgentIdentityListQuery, useGovernanceSettingsGetQuery } from '@/api/governance.api';
import { GridTableContainer } from '@/components/GridTable';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import { toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';
import { useGovernanceProject } from '@/pages/GovernancePage/hooks/useGovernanceProject.hooks';

import ActivateIdentityDialog from './components/ActivateIdentityDialog';
import ConfirmIdentityActionDialog from './components/ConfirmIdentityActionDialog';
import CreateIdentityDialog from './components/CreateIdentityDialog';
import IdentitiesTable from './components/IdentitiesTable';
import IdentitiesToolbar from './components/IdentitiesToolbar';
import IdentityDetailDrawer from './components/IdentityDetailDrawer';
import { DEFAULT_PAGE_SIZE, DEFAULT_SORT } from './constants/identities.constants';
import { buildListParams, rowTitle, successMessage } from './helpers/identities.helpers';

const NO_PROJECT_TEXT = 'Choose a project to see its agent identities.';
const CLOSED_SNACKBAR = { open: false, message: '', severity: 'success' };

/**
 * The Agent identities tab: the agent identities of one project, their state and whether the agent still matches
 * what was approved. Reading needs `governance.bindings.view`, changing `governance.bindings.manage`, and approving
 * (activating) `governance.bindings.approve`. The backend enforces all three; the UI only hides what would be refused.
 */
const IdentitiesTab = memo(() => {
  const styles = identitiesTabStyles();

  const { hasPermission } = useCheckPermission();
  const canManage = hasPermission(PERMISSIONS.governance.bindings.manage);
  const canApprove = hasPermission(PERMISSIONS.governance.bindings.approve);
  const canReadSettings = hasPermission(PERMISSIONS.governance.settings.view);

  const currentUserId = useSelector(state => state.user.user?.id);
  const userId = currentUserId != null && !Number.isNaN(Number(currentUserId)) ? Number(currentUserId) : null;

  const { project, selectProject } = useGovernanceProject();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const [stateFilter, setStateFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState(DEFAULT_SORT);

  const [detailRow, setDetailRow] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [activateRow, setActivateRow] = useState(null);
  const [snackbar, setSnackbar] = useState(CLOSED_SNACKBAR);

  const projectId = project?.id;

  const { data, isLoading, isError, error } = useAgentIdentityListQuery(
    buildListParams({
      projectId,
      state: stateFilter,
      mode: modeFilter,
      search: debouncedSearch,
      page,
      pageSize,
      sort,
    }),
    { skip: !projectId, refetchOnMountOrArgChange: true },
  );

  // The effective setting gives the policy revision to prefill and whether runtime domain bindings may be created
  const { data: settings } = useGovernanceSettingsGetQuery(undefined, { skip: !canReadSettings });
  const effective = settings?.effective;

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const hasFilters = Boolean(stateFilter || modeFilter || debouncedSearch);

  const handleProjectChange = useCallback(
    next => {
      selectProject(next);
      setPage(0);
    },
    [selectProject],
  );

  const handleSearchChange = useCallback(event => {
    setSearch(event.target.value);
    setPage(0);
  }, []);

  const handleStateChange = useCallback(event => {
    setStateFilter(event.target.value);
    setPage(0);
  }, []);

  const handleModeChange = useCallback(event => {
    setModeFilter(event.target.value);
    setPage(0);
  }, []);

  const handleSort = useCallback(field => {
    setSort(prev =>
      prev.field === field
        ? { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    );
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback(value => {
    setPageSize(value);
    setPage(0);
  }, []);

  const handleDetails = useCallback(row => setDetailRow(row), []);
  const handleDetailsClose = useCallback(() => setDetailRow(null), []);

  const handleCreateOpen = useCallback(() => setCreateOpen(true), []);
  const handleCreateClose = useCallback(() => setCreateOpen(false), []);

  const handleCreated = useCallback(({ agentName, versionName }) => {
    setCreateOpen(false);
    setPage(0);
    setSnackbar({
      open: true,
      message: `Identity for ${agentName} ${versionName} created as a draft.`,
      severity: 'success',
    });
  }, []);

  const handleAction = useCallback((row, action) => {
    if (action === 'activate') setActivateRow(row);
    else setConfirmTarget({ row, action });
  }, []);

  const handleConfirmClose = useCallback(() => setConfirmTarget(null), []);
  const handleActivateClose = useCallback(() => setActivateRow(null), []);

  // A stale view means another operator changed the identity first. The list was read again by the refused call.
  const handleActionDone = useCallback(({ outcome, row, action }) => {
    setConfirmTarget(null);
    setActivateRow(null);
    setSnackbar(
      outcome === 'stale'
        ? {
            open: true,
            message: `${rowTitle(row)} was changed by someone else. The list is up to date now; check its state and try again.`,
            severity: 'warning',
          }
        : { open: true, message: successMessage(row, action), severity: 'success' },
    );
  }, []);

  const handleSnackbarClose = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);

  let emptyMessage = null;
  if (!project) emptyMessage = NO_PROJECT_TEXT;
  else if (!isLoading && !isError && rows.length === 0) {
    emptyMessage = hasFilters
      ? 'No agent identities match the filters.'
      : `No agent identities in ${project.name} yet.${canManage ? ' Use Create identity to add one.' : ''}`;
  }

  const toolbar = (
    <IdentitiesToolbar
      project={project}
      onProjectChange={handleProjectChange}
      search={search}
      onSearchChange={handleSearchChange}
      state={stateFilter}
      onStateChange={handleStateChange}
      mode={modeFilter}
      onModeChange={handleModeChange}
      canCreate={canManage}
      onCreate={handleCreateOpen}
    />
  );

  return (
    <Box
      sx={styles.root}
      data-testid="governance-identities"
    >
      <GridTableContainer
        toolbar={toolbar}
        isLoading={Boolean(project) && isLoading}
        isEmpty={emptyMessage != null}
        emptyMessage={emptyMessage ?? ''}
      >
        {isError ? (
          <Box sx={styles.error}>
            <GovernanceErrorAlert error={toGovernanceError(error, 'Failed to load the agent identities.')} />
          </Box>
        ) : (
          <IdentitiesTable
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            sortConfig={sort}
            onSort={handleSort}
            onDetails={handleDetails}
            onAction={handleAction}
            canManage={canManage}
            canApprove={canApprove}
            userId={userId}
          />
        )}
      </GridTableContainer>

      <IdentityDetailDrawer
        open={Boolean(detailRow)}
        onClose={handleDetailsClose}
        projectId={projectId}
        row={detailRow}
      />
      <CreateIdentityDialog
        open={createOpen}
        projectId={projectId}
        runtimeDomainAllowed={effective ? effective.allow_runtime_domain_binding === true : true}
        onClose={handleCreateClose}
        onCreated={handleCreated}
      />
      <ConfirmIdentityActionDialog
        open={Boolean(confirmTarget)}
        row={confirmTarget?.row}
        action={confirmTarget?.action}
        projectId={projectId}
        onClose={handleConfirmClose}
        onDone={handleActionDone}
      />
      <ActivateIdentityDialog
        open={Boolean(activateRow)}
        row={activateRow}
        projectId={projectId}
        defaultPolicyRevision={effective?.policy_revision ?? ''}
        onClose={handleActivateClose}
        onDone={handleActionDone}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={styles.snackbarAlert}
          data-testid="identities-snackbar"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

IdentitiesTab.displayName = 'IdentitiesTab';

/** @type {MuiSx} */
const identitiesTabStyles = () => ({
  root: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    maxWidth: '100%',
  },
  error: {
    display: 'flex',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
  },
  snackbarAlert: {
    width: '100%',
  },
});

export default IdentitiesTab;
