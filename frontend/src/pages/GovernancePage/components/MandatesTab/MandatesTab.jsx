import { memo, useCallback, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import {
  useGovernanceSettingsGetQuery,
  useMandateActionMutation,
  useMandateListQuery,
} from '@/api/governance.api';
import { GridTableContainer } from '@/components/GridTable';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import ApproveDialog from '@/pages/GovernancePage/components/ApproveDialog';
import ConfirmActionDialog from '@/pages/GovernancePage/components/ConfirmActionDialog';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import GovernanceSnackbar from '@/pages/GovernancePage/components/GovernanceSnackbar';
import { toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';
import { useGovernanceProject } from '@/pages/GovernancePage/hooks/useGovernanceProject.hooks';
import { useGovernanceSnackbar } from '@/pages/GovernancePage/hooks/useGovernanceSnackbar.hooks';
import { useGovernanceTable } from '@/pages/GovernancePage/hooks/useGovernanceTable.hooks';

import ConsentScopeNotice from './components/ConsentScopeNotice';
import CreateMandateDialog from './components/CreateMandateDialog';
import MandateDetailDrawer from './components/MandateDetailDrawer';
import MandatesTable from './components/MandatesTable';
import MandatesToolbar from './components/MandatesToolbar';
import { ACTION_TEXT } from './constants/mandates.constants';
import { rowTitle, successMessage } from './helpers/mandates.helpers';

const NO_PROJECT_TEXT = 'Choose a project to see its mandates.';

/**
 * The Mandates tab: the mandates that let one agent version run on schedules and webhooks without its owner present,
 * and, where the platform allows it, the identity those runs act with. Reading needs `governance.bindings.view`,
 * changing `governance.bindings.manage`, approving and resuming `governance.bindings.approve`; the owner's consent is
 * theirs alone. The backend enforces every rule; the UI only hides what would be refused.
 */
const MandatesTab = memo(() => {
  const styles = mandatesTabStyles();

  const { hasPermission } = useCheckPermission();
  const canManage = hasPermission(PERMISSIONS.governance.bindings.manage);
  const canApprove = hasPermission(PERMISSIONS.governance.bindings.approve);
  const canReadSettings = hasPermission(PERMISSIONS.governance.settings.view);

  const currentUserId = useSelector(state => state.user.user?.id);
  const userId = currentUserId != null && !Number.isNaN(Number(currentUserId)) ? Number(currentUserId) : null;

  const { project, selectProject } = useGovernanceProject();
  const [stateFilter, setStateFilter] = useState('');
  const { page, setPage, resetPage, pageSize, handlePageSizeChange } = useGovernanceTable();

  const [detailRow, setDetailRow] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [approveRow, setApproveRow] = useState(null);
  const { snackbar, showSuccess, showWarning, close: handleSnackbarClose } = useGovernanceSnackbar();

  const projectId = project?.id;
  const { data, isLoading, isError, error } = useMandateListQuery(
    { projectId, limit: pageSize, offset: page * pageSize, state: stateFilter },
    { skip: !projectId, refetchOnMountOrArgChange: true },
  );
  const { data: settings } = useGovernanceSettingsGetQuery(undefined, { skip: !canReadSettings });
  const [runAction] = useMandateActionMutation();

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const handleProjectChange = useCallback(
    next => {
      selectProject(next);
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

  const handleDetails = useCallback(row => setDetailRow(row), []);
  const handleDetailsClose = useCallback(() => setDetailRow(null), []);
  const handleCreateOpen = useCallback(() => setCreateOpen(true), []);
  const handleCreateClose = useCallback(() => setCreateOpen(false), []);

  const handleCreated = useCallback(
    ({ agentName, versionName }) => {
      setCreateOpen(false);
      resetPage();
      showSuccess(`Mandate for ${agentName} ${versionName} created as a draft.`);
    },
    [resetPage, showSuccess],
  );

  const handleAction = useCallback((row, action) => {
    if (action === 'approve') setApproveRow(row);
    else setConfirmTarget({ row, action });
  }, []);

  const handleConfirmClose = useCallback(() => setConfirmTarget(null), []);
  const handleApproveClose = useCallback(() => setApproveRow(null), []);

  const handleConfirm = useCallback(
    () => runAction({ projectId, mandateId: confirmTarget.row.id, action: confirmTarget.action }).unwrap(),
    [runAction, projectId, confirmTarget],
  );

  const handleApprove = useCallback(
    body => runAction({ projectId, mandateId: approveRow.id, action: 'approve', ...body }).unwrap(),
    [runAction, projectId, approveRow],
  );

  const handleDone = useCallback(
    (row, action) =>
      ({ outcome }) => {
        setConfirmTarget(null);
        setApproveRow(null);
        if (outcome === 'stale') {
          showWarning(`${rowTitle(row)} was changed by someone else. The list is up to date now; try again.`);
        } else {
          showSuccess(successMessage(row, action));
        }
      },
    [showSuccess, showWarning],
  );

  let emptyMessage = null;
  if (!project) emptyMessage = NO_PROJECT_TEXT;
  else if (!isLoading && !isError && rows.length === 0) {
    emptyMessage = stateFilter
      ? 'No mandates in this state.'
      : `No mandates in ${project.name} yet.${canManage ? ' Use Create mandate to add one.' : ''}`;
  }

  const confirmText = confirmTarget ? ACTION_TEXT[confirmTarget.action] : null;

  return (
    <Box
      sx={styles.root}
      data-testid="governance-mandates"
    >
      <GridTableContainer
        toolbar={
          <MandatesToolbar
            project={project}
            onProjectChange={handleProjectChange}
            state={stateFilter}
            onStateChange={handleStateChange}
            canCreate={canManage}
            onCreate={handleCreateOpen}
          />
        }
        isLoading={Boolean(project) && isLoading}
        isEmpty={emptyMessage != null}
        emptyMessage={emptyMessage ?? ''}
      >
        {isError ? (
          <Box sx={styles.error}>
            <GovernanceErrorAlert error={toGovernanceError(error, 'Failed to load the mandates.')} />
          </Box>
        ) : (
          <MandatesTable
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            onDetails={handleDetails}
            onAction={handleAction}
            canManage={canManage}
            canApprove={canApprove}
            userId={userId}
          />
        )}
      </GridTableContainer>

      <MandateDetailDrawer
        open={Boolean(detailRow)}
        onClose={handleDetailsClose}
        row={detailRow}
      />
      <CreateMandateDialog
        open={createOpen}
        projectId={projectId}
        identitySources={data?.identity_sources ?? []}
        onClose={handleCreateClose}
        onCreated={handleCreated}
      />
      <ConfirmActionDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget ? `${confirmText.label}: ${rowTitle(confirmTarget.row)}` : ''}
        description={confirmText?.description ?? ''}
        extra={
          confirmTarget?.action === 'consent' ? (
            <ConsentScopeNotice
              projectId={projectId}
              mandateId={confirmTarget.row.id}
            />
          ) : null
        }
        confirmLabel={confirmText?.label ?? 'Confirm'}
        destructive={Boolean(confirmText?.destructive)}
        errorFallback="The change failed."
        onConfirm={handleConfirm}
        onClose={handleConfirmClose}
        onDone={confirmTarget ? handleDone(confirmTarget.row, confirmTarget.action) : handleConfirmClose}
        testIdPrefix="mandate-confirm"
      />
      <ApproveDialog
        open={Boolean(approveRow)}
        title={approveRow ? `Approve mandate: ${rowTitle(approveRow)}` : ''}
        description="Once approved, the mandate's runs are admitted under it until it is suspended, revoked or expires."
        defaultPolicyRevision={settings?.effective?.policy_revision ?? ''}
        onSubmit={handleApprove}
        onClose={handleApproveClose}
        onDone={approveRow ? handleDone(approveRow, 'approve') : handleApproveClose}
        testIdPrefix="mandate-approve"
      />

      <GovernanceSnackbar
        snackbar={snackbar}
        onClose={handleSnackbarClose}
        testId="mandates-snackbar"
      />
    </Box>
  );
});

MandatesTab.displayName = 'MandatesTab';

/** @type {MuiSx} */
const mandatesTabStyles = () => ({
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

export default MandatesTab;
