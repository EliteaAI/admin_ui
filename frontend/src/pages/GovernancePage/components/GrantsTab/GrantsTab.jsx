import { memo, useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { useCredentialGrantListQuery, useGovernanceSettingsGetQuery } from '@/api/governance.api';
import { GridTableContainer } from '@/components/GridTable';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import GovernanceSnackbar from '@/pages/GovernancePage/components/GovernanceSnackbar';
import { toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';
import { useGovernanceProject } from '@/pages/GovernancePage/hooks/useGovernanceProject.hooks';
import { useGovernanceSnackbar } from '@/pages/GovernancePage/hooks/useGovernanceSnackbar.hooks';
import { useGovernanceTable } from '@/pages/GovernancePage/hooks/useGovernanceTable.hooks';

import ApproveGrantDialog from './components/ApproveGrantDialog';
import ConfirmGrantActionDialog from './components/ConfirmGrantActionDialog';
import CreateGrantDialog from './components/CreateGrantDialog';
import GrantDetailDrawer from './components/GrantDetailDrawer';
import GrantsTable from './components/GrantsTable';
import GrantsToolbar from './components/GrantsToolbar';
import { buildListParams, grantTitle, successMessage } from './helpers/grants.helpers';

const NO_PROJECT_TEXT = 'Choose a project to see its grants.';

/**
 * The Grants tab: which agent may use which credential for which user. Reading needs `credentials.view`, creating,
 * suspending, resuming and revoking `credentials.manage`, and approving `credentials.approve`. The backend enforces
 * all three; the UI only hides what would be refused. Filtering by user gives the per-user view.
 */
const GrantsTab = memo(() => {
  const styles = grantsTabStyles();

  const { hasPermission } = useCheckPermission();
  const canManage = hasPermission(PERMISSIONS.credentials.manage);
  const canApprove = hasPermission(PERMISSIONS.credentials.approve);
  const canReadSettings = hasPermission(PERMISSIONS.governance.settings.view);

  const currentUserId = useSelector(state => state.user.user?.id);
  const userId = currentUserId != null && !Number.isNaN(Number(currentUserId)) ? Number(currentUserId) : null;

  const { project, selectProject } = useGovernanceProject();

  const [stateFilter, setStateFilter] = useState('');
  const [userFilter, setUserFilter] = useState(null);
  const { page, setPage, resetPage, pageSize, handlePageSizeChange, sort, handleSort } = useGovernanceTable();

  const [detailRow, setDetailRow] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [approveRow, setApproveRow] = useState(null);
  const { snackbar, showSuccess, showWarning, close: handleSnackbarClose } = useGovernanceSnackbar();

  const projectId = project?.id;

  const { data, isLoading, isError, error } = useCredentialGrantListQuery(
    buildListParams({ projectId, state: stateFilter, user: userFilter, page, pageSize, sort }),
    { skip: !projectId, refetchOnMountOrArgChange: true },
  );

  // The effective setting gives the policy revision to prefill in the approval
  const { data: settings } = useGovernanceSettingsGetQuery(undefined, { skip: !canReadSettings });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const hasFilters = Boolean(stateFilter || userFilter);
  const permissions = useMemo(() => ({ canManage, canApprove, userId }), [canManage, canApprove, userId]);

  const handleProjectChange = useCallback(
    next => {
      selectProject(next);
      setUserFilter(null);
      resetPage();
    },
    [selectProject, resetPage],
  );

  const handleStateChange = useCallback(
    event => {
      setStateFilter(event.target.value);
      resetPage();
    },
    [resetPage],
  );

  const handleUserChange = useCallback(
    next => {
      setUserFilter(next);
      resetPage();
    },
    [resetPage],
  );

  const handleDetails = useCallback(row => setDetailRow(row), []);
  const handleDetailsClose = useCallback(() => setDetailRow(null), []);

  const handleCreateOpen = useCallback(() => setCreateOpen(true), []);
  const handleCreateClose = useCallback(() => setCreateOpen(false), []);

  const handleCreated = useCallback(
    ({ title }) => {
      setCreateOpen(false);
      resetPage();
      showSuccess(`Grant for ${title} created. It is pending approval.`);
    },
    [resetPage, showSuccess],
  );

  const handleAction = useCallback((row, action) => {
    if (action === 'approve') setApproveRow(row);
    else setConfirmTarget({ row, action });
  }, []);

  const handleConfirmClose = useCallback(() => setConfirmTarget(null), []);
  const handleApproveClose = useCallback(() => setApproveRow(null), []);

  // A stale view means another operator changed the grant first. The list was read again by the refused call.
  const handleActionDone = useCallback(
    ({ outcome, row, action }) => {
      setConfirmTarget(null);
      setApproveRow(null);
      if (outcome === 'stale') {
        showWarning(
          `${grantTitle(row)} was changed by someone else. The list is up to date now; check its state and try again.`,
        );
      } else {
        showSuccess(successMessage(row, action));
      }
    },
    [showSuccess, showWarning],
  );

  let emptyMessage = null;
  if (!project) emptyMessage = NO_PROJECT_TEXT;
  else if (!isLoading && !isError && rows.length === 0) {
    emptyMessage = hasFilters
      ? 'No grants match the filters.'
      : `No grants in ${project.name} yet.${canManage ? ' Use Create grant to add one.' : ''}`;
  }

  const toolbar = (
    <GrantsToolbar
      project={project}
      onProjectChange={handleProjectChange}
      user={userFilter}
      onUserChange={handleUserChange}
      state={stateFilter}
      onStateChange={handleStateChange}
      canCreate={canManage}
      onCreate={handleCreateOpen}
    />
  );

  return (
    <Box
      sx={styles.root}
      data-testid="governance-grants"
    >
      <GridTableContainer
        toolbar={toolbar}
        isLoading={Boolean(project) && isLoading}
        isEmpty={emptyMessage != null}
        emptyMessage={emptyMessage ?? ''}
      >
        {isError ? (
          <Box sx={styles.error}>
            <GovernanceErrorAlert error={toGovernanceError(error, 'Failed to load the grants.')} />
          </Box>
        ) : (
          <GrantsTable
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

      <GrantDetailDrawer
        open={Boolean(detailRow)}
        onClose={handleDetailsClose}
        row={detailRow}
      />
      <CreateGrantDialog
        open={createOpen}
        projectId={projectId}
        onClose={handleCreateClose}
        onCreated={handleCreated}
      />
      <ConfirmGrantActionDialog
        open={Boolean(confirmTarget)}
        row={confirmTarget?.row}
        action={confirmTarget?.action}
        projectId={projectId}
        onClose={handleConfirmClose}
        onDone={handleActionDone}
      />
      <ApproveGrantDialog
        open={Boolean(approveRow)}
        row={approveRow}
        projectId={projectId}
        defaultPolicyRevision={settings?.effective?.policy_revision ?? ''}
        onClose={handleApproveClose}
        onDone={handleActionDone}
      />

      <GovernanceSnackbar
        snackbar={snackbar}
        onClose={handleSnackbarClose}
        testId="grants-snackbar"
      />
    </Box>
  );
});

GrantsTab.displayName = 'GrantsTab';

/** @type {MuiSx} */
const grantsTabStyles = () => ({
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

export default GrantsTab;
