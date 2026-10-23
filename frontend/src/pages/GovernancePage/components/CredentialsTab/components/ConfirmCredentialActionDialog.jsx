import { memo, useCallback } from 'react';

import { useCredentialReferenceActionMutation } from '@/api/governance.api';
import ConfirmActionDialog from '@/pages/GovernancePage/components/ConfirmActionDialog';
import { ACTIONS } from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';
import { referenceTitle } from '@/pages/GovernancePage/helpers/governance.helpers';

/**
 * Confirms import, activate, suspend, resume and retire of a credential reference. It names the reference and says
 * what the action does. `onDone({ outcome: 'done' | 'stale', row, action })`.
 */
const ConfirmCredentialActionDialog = memo(props => {
  const { open, row, action, projectId, onClose, onDone } = props;

  const [runAction] = useCredentialReferenceActionMutation();

  const config = ACTIONS[action];

  const handleConfirm = useCallback(
    () => runAction({ projectId, referenceId: row.id, action }).unwrap(),
    [runAction, projectId, row, action],
  );

  const handleDone = useCallback(({ outcome }) => onDone({ outcome, row, action }), [onDone, row, action]);

  if (!row || !config) return null;

  return (
    <ConfirmActionDialog
      open={open}
      title={`${config.label}: ${referenceTitle(row)}?`}
      description={config.description}
      confirmLabel={config.confirmLabel}
      destructive={config.destructive}
      errorFallback={`Failed to ${config.label.toLowerCase()}.`}
      onConfirm={handleConfirm}
      onClose={onClose}
      onDone={handleDone}
      testIdPrefix="credential-confirm"
    />
  );
});

ConfirmCredentialActionDialog.displayName = 'ConfirmCredentialActionDialog';

export default ConfirmCredentialActionDialog;
