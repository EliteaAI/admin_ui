import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { useCredentialReferenceListQuery, useGovernanceSettingsGetQuery } from '@/api/governance.api';
import { GridTableContainer } from '@/components/GridTable';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import GovernanceSnackbar from '@/pages/GovernancePage/components/GovernanceSnackbar';
import { referenceTitle, toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';
import { useGovernanceProject } from '@/pages/GovernancePage/hooks/useGovernanceProject.hooks';
import { useGovernanceSnackbar } from '@/pages/GovernancePage/hooks/useGovernanceSnackbar.hooks';
import { useGovernanceTable } from '@/pages/GovernancePage/hooks/useGovernanceTable.hooks';

import ApproveCredentialDialog from './components/ApproveCredentialDialog';
import ConfirmCredentialActionDialog from './components/ConfirmCredentialActionDialog';
import CreateCredentialDialog from './components/CreateCredentialDialog';
import CredentialDetailDrawer from './components/CredentialDetailDrawer';
import CredentialsTable from './components/CredentialsTable';
import CredentialsToolbar from './components/CredentialsToolbar';
import ProbeCredentialDialog from './components/ProbeCredentialDialog';
import SetPersonalValueDialog from './components/SetPersonalValueDialog';
import { CORPORATE_VAULT_STORE } from './constants/credentials.constants';
import { buildListParams, successMessage } from './helpers/credentials.helpers';

const NO_PROJECT_TEXT = 'Choose a project to see its credentials.';

/**
 * The Credentials tab: the credential references of one project, their lifecycle and who may use them. Reading needs
 * `credentials.view`, registering, importing, setting a personal value, activating, suspending, resuming and
 * retiring `credentials.manage`, probing `credentials.probe`, approving `credentials.approve`. The backend enforces
 * all of them; the UI only hides what would be refused.
 */
const CredentialsTab = memo(() => {
  const styles = credentialsTabStyles();

  const { hasPermission } = useCheckPermission();
  const canManage = hasPermission(PERMISSIONS.credentials.manage);
  const canProbe = hasPermission(PERMISSIONS.credentials.probe);
  const canApprove = hasPermission(PERMISSIONS.credentials.approve);
  const canReadSettings = hasPermission(PERMISSIONS.governance.settings.view);

  const currentUserId = useSelector(state => state.user.user?.id);
  const userId = currentUserId != null && !Number.isNaN(Number(currentUserId)) ? Number(currentUserId) : null;

  const { project, selectProject } = useGovernanceProject();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const [stateFilter, setStateFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState(null);
  const { page, setPage, resetPage, pageSize, handlePageSizeChange, sort, handleSort } = useGovernanceTable();

  const [detailRow, setDetailRow] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [approveRow, setApproveRow] = useState(null);
  const [probeRow, setProbeRow] = useState(null);
  const [valueRow, setValueRow] = useState(null);
  const { snackbar, showSuccess, showWarning, close: handleSnackbarClose } = useGovernanceSnackbar();

  const projectId = project?.id;

  const { data, isLoading, isError, error } = useCredentialReferenceListQuery(
    buildListParams({
      projectId,
      state: stateFilter,
      ownershipClass: classFilter,
      storeKind: storeFilter,
      owner: ownerFilter,
      search: debouncedSearch,
      page,
      pageSize,
      sort,
    }),
    { skip: !projectId, refetchOnMountOrArgChange: true },
  );

  // The effective setting gives the policy revision to prefill, and the preflight says whether Corporate Vault is set up
  const { data: settings } = useGovernanceSettingsGetQuery(undefined, { skip: !canReadSettings });
  const vaultCheck = settings?.preflight?.checks?.find(check => check.id === CORPORATE_VAULT_STORE);
  const vaultAvailable = vaultCheck ? vaultCheck.status === 'ok' : true;

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const hasFilters = Boolean(stateFilter || classFilter || storeFilter || ownerFilter || debouncedSearch);
  const permissions = useMemo(
    () => ({ canManage, canProbe, canApprove, userId }),
    [canManage, canProbe, canApprove, userId],
  );

  const handleProjectChange = useCallback(
    next => {
      selectProject(next);
      setOwnerFilter(null);
      resetPage();
    },
    [selectProject, resetPage],
  );

  const handleSearchChange = useCallback(
    event => {
      setSearch(event.target.value);
      resetPage();
    },
    [resetPage],
  );

  const handleStateChange = useCallback(
    event => {
      setStateFilter(event.target.value);
      resetPage();
    },
    [resetPage],
  );

  const handleClassChange = useCallback(
    event => {
      setClassFilter(event.target.value);
      resetPage();
    },
    [resetPage],
  );

  const handleStoreChange = useCallback(
    event => {
      setStoreFilter(event.target.value);
      resetPage();
    },
    [resetPage],
  );

  const handleOwnerChange = useCallback(
    next => {
      setOwnerFilter(next);
      resetPage();
    },
    [resetPage],
  );

  const handleDetails = useCallback(row => setDetailRow(row), []);
  const handleDetailsClose = useCallback(() => setDetailRow(null), []);

  const handleCreateOpen = useCallback(() => setCreateOpen(true), []);
  const handleCreateClose = useCallback(() => setCreateOpen(false), []);

  const handleCreated = useCallback(
    ({ title, personal }) => {
      setCreateOpen(false);
      resetPage();
      showSuccess(
        `Credential reference for ${title} created as pending. ${
          personal ? 'Set the personal value next.' : 'Import its value next.'
        }`,
      );
    },
    [resetPage, showSuccess],
  );

  const handleAction = useCallback((row, action) => {
    if (action === 'setValue') setValueRow(row);
    else if (action === 'approve') setApproveRow(row);
    else if (action === 'probe') setProbeRow(row);
    else setConfirmTarget({ row, action });
  }, []);

  const handleConfirmClose = useCallback(() => setConfirmTarget(null), []);
  const handleApproveClose = useCallback(() => setApproveRow(null), []);
  const handleProbeClose = useCallback(() => setProbeRow(null), []);
  const handleValueClose = useCallback(() => setValueRow(null), []);

  // A stale view means another operator changed the reference first. The list was read again by the refused call.
  const handleActionDone = useCallback(
    ({ outcome, row, action, generation }) => {
      setConfirmTarget(null);
      setApproveRow(null);
      setProbeRow(null);
      setValueRow(null);
      if (outcome === 'stale') {
        showWarning(
          `${referenceTitle(row)} was changed by someone else. The list is up to date now; check its state and try again.`,
        );
      } else if (action) {
        showSuccess(successMessage(row, action));
      } else {
        showSuccess(
          `Personal value of ${referenceTitle(row)} stored as generation ${generation ?? (row.generation ?? 0) + 1}. Probe it next.`,
        );
      }
    },
    [showSuccess, showWarning],
  );

  let emptyMessage = null;
  if (!project) emptyMessage = NO_PROJECT_TEXT;
  else if (!isLoading && !isError && rows.length === 0) {
    emptyMessage = hasFilters
      ? 'No credentials match the filters.'
      : `No credentials registered in ${project.name} yet.${canManage ? ' Use Register credential to add one.' : ''}`;
  }

  const toolbar = (
    <CredentialsToolbar
      project={project}
      onProjectChange={handleProjectChange}
      search={search}
      onSearchChange={handleSearchChange}
      state={stateFilter}
      onStateChange={handleStateChange}
      ownershipClass={classFilter}
      onClassChange={handleClassChange}
      storeKind={storeFilter}
      onStoreChange={handleStoreChange}
      owner={ownerFilter}
      onOwnerChange={handleOwnerChange}
      canCreate={canManage}
      onCreate={handleCreateOpen}
    />
  );

  const defaultPolicyRevision = settings?.effective?.policy_revision ?? '';

  return (
    <Box
      sx={styles.root}
      data-testid="governance-credentials"
    >
      <GridTableContainer
        toolbar={toolbar}
        isLoading={Boolean(project) && isLoading}
        isEmpty={emptyMessage != null}
        emptyMessage={emptyMessage ?? ''}
      >
        {isError ? (
          <Box sx={styles.error}>
            <GovernanceErrorAlert error={toGovernanceError(error, 'Failed to load the credentials.')} />
          </Box>
        ) : (
          <CredentialsTable
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
            permissions={permissions}
          />
        )}
      </GridTableContainer>

      <CredentialDetailDrawer
        open={Boolean(detailRow)}
        onClose={handleDetailsClose}
        projectId={projectId}
        row={detailRow}
      />
      <CreateCredentialDialog
        open={createOpen}
        projectId={projectId}
        vaultAvailable={vaultAvailable}
        onClose={handleCreateClose}
        onCreated={handleCreated}
      />
      <ConfirmCredentialActionDialog
        open={Boolean(confirmTarget)}
        row={confirmTarget?.row}
        action={confirmTarget?.action}
        projectId={projectId}
        onClose={handleConfirmClose}
        onDone={handleActionDone}
      />
      <ApproveCredentialDialog
        open={Boolean(approveRow)}
        row={approveRow}
        projectId={projectId}
        defaultPolicyRevision={defaultPolicyRevision}
        onClose={handleApproveClose}
        onDone={handleActionDone}
      />
      <ProbeCredentialDialog
        open={Boolean(probeRow)}
        row={probeRow}
        projectId={projectId}
        onClose={handleProbeClose}
        onDone={handleActionDone}
      />
      <SetPersonalValueDialog
        open={Boolean(valueRow)}
        row={valueRow}
        projectId={projectId}
        onClose={handleValueClose}
        onDone={handleActionDone}
      />

      <GovernanceSnackbar
        snackbar={snackbar}
        onClose={handleSnackbarClose}
        testId="credentials-snackbar"
      />
    </Box>
  );
});

CredentialsTab.displayName = 'CredentialsTab';

/** @type {MuiSx} */
const credentialsTabStyles = () => ({
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
});

export default CredentialsTab;
