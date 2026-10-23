import { memo, useCallback } from 'react';

import { useCredentialReferenceActionMutation } from '@/api/governance.api';
import ApproveDialog from '@/pages/GovernancePage/components/ApproveDialog';
import { ACTIONS } from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';
import { referenceTitle } from '@/pages/GovernancePage/helpers/governance.helpers';

/** Approves a validated credential reference. `onDone({ outcome: 'done' | 'stale', row, action: 'approve' })`. */
const ApproveCredentialDialog = memo(props => {
  const { open, row, projectId, defaultPolicyRevision, onClose, onDone } = props;

  const [runAction] = useCredentialReferenceActionMutation();

  const handleSubmit = useCallback(
    values => runAction({ projectId, referenceId: row.id, action: 'approve', ...values }).unwrap(),
    [runAction, projectId, row],
  );

  const handleDone = useCallback(({ outcome }) => onDone({ outcome, row, action: 'approve' }), [onDone, row]);

  if (!row) return null;

  return (
    <ApproveDialog
      open={open}
      title={`Approve ${referenceTitle(row)}?`}
      description={ACTIONS.approve.description}
      defaultPolicyRevision={defaultPolicyRevision}
      onSubmit={handleSubmit}
      onClose={onClose}
      onDone={handleDone}
      testIdPrefix="credential-approve"
    />
  );
});

ApproveCredentialDialog.displayName = 'ApproveCredentialDialog';

export default ApproveCredentialDialog;
