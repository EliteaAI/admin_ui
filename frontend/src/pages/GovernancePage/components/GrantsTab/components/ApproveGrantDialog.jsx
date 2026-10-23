import { memo, useCallback } from 'react';

import { useCredentialGrantActionMutation } from '@/api/governance.api';
import ApproveDialog from '@/pages/GovernancePage/components/ApproveDialog';
import { ACTIONS } from '@/pages/GovernancePage/components/GrantsTab/constants/grants.constants';
import { grantTitle } from '@/pages/GovernancePage/components/GrantsTab/helpers/grants.helpers';

/** Approves a pending grant. `onDone({ outcome: 'done' | 'stale', row, action: 'approve' })`. */
const ApproveGrantDialog = memo(props => {
  const { open, row, projectId, defaultPolicyRevision, onClose, onDone } = props;

  const [runAction] = useCredentialGrantActionMutation();

  const handleSubmit = useCallback(
    values => runAction({ projectId, grantId: row.id, action: 'approve', ...values }).unwrap(),
    [runAction, projectId, row],
  );

  const handleDone = useCallback(({ outcome }) => onDone({ outcome, row, action: 'approve' }), [onDone, row]);

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
      testIdPrefix="grant-approve"
    />
  );
});

ApproveGrantDialog.displayName = 'ApproveGrantDialog';

export default ApproveGrantDialog;
