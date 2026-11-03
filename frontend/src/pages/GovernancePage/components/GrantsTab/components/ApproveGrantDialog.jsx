import { memo, useCallback, useState } from 'react';

import { useCredentialGrantActionMutation } from '@/api/governance.api';
import ApproveDialog from '@/pages/GovernancePage/components/ApproveDialog';
import { ACTIONS } from '@/pages/GovernancePage/components/GrantsTab/constants/grants.constants';
import { grantTitle } from '@/pages/GovernancePage/components/GrantsTab/helpers/grants.helpers';

import BatchGrantFields from './BatchGrantFields';

/**
 * Approves a pending grant, and (#7269) optionally the same use for another member or a project role in the same
 * change. `onDone({ outcome: 'done' | 'stale', row, action: 'approve' })`.
 */
const ApproveGrantDialog = memo(props => {
  const { open, row, projectId, defaultPolicyRevision, onClose, onDone } = props;

  const [runAction] = useCredentialGrantActionMutation();
  const [alsoUser, setAlsoUser] = useState(null);
  const [alsoRole, setAlsoRole] = useState('');

  const handleSubmit = useCallback(
    values =>
      runAction({
        projectId,
        grantId: row.id,
        action: 'approve',
        ...values,
        ...(alsoUser && { also_grant_to: [alsoUser.id] }),
        ...(alsoRole && { also_grant_role: alsoRole }),
      }).unwrap(),
    [runAction, projectId, row, alsoUser, alsoRole],
  );

  const handleDone = useCallback(
    ({ outcome }) => {
      setAlsoUser(null);
      setAlsoRole('');
      onDone({ outcome, row, action: 'approve' });
    },
    [onDone, row],
  );

  if (!row) return null;

  return (
    <ApproveDialog
      open={open}
      title={`Approve ${grantTitle(row)}?`}
      description={ACTIONS.approve.description}
      defaultPolicyRevision={defaultPolicyRevision}
      onSubmit={handleSubmit}
      onClose={onClose}
      onDone={handleDone}
      notice={
        <BatchGrantFields
          projectId={projectId}
          user={alsoUser}
          onUserChange={setAlsoUser}
          role={alsoRole}
          onRoleChange={setAlsoRole}
        />
      }
      testIdPrefix="grant-approve"
    />
  );
});

ApproveGrantDialog.displayName = 'ApproveGrantDialog';

export default ApproveGrantDialog;
