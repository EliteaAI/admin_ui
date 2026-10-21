import { memo, useCallback } from 'react';

import { useCredentialGrantActionMutation } from '@/api/governance.api';
import ConfirmActionDialog from '@/pages/GovernancePage/components/ConfirmActionDialog';
import { ACTIONS } from '@/pages/GovernancePage/components/GrantsTab/constants/grants.constants';
import { grantTitle } from '@/pages/GovernancePage/components/GrantsTab/helpers/grants.helpers';

/**
 * Confirms suspend, resume and revoke of a grant. It names the grant and says what the action does.
 * `onDone({ outcome: 'done' | 'stale', row, action })`.
 */
const ConfirmGrantActionDialog = memo(props => {
  const { open, row, action, projectId, onClose, onDone } = props;

  const [runAction] = useCredentialGrantActionMutation();

  const config = ACTIONS[action];

  const handleConfirm = useCallback(
    () => runAction({ projectId, grantId: row.id, action }).unwrap(),
    [runAction, projectId, row, action],
  );

  const handleDone = useCallback(({ outcome }) => onDone({ outcome, row, action }), [onDone, row, action]);

  if (!row || !config) return null;

  return (
    <ConfirmActionDialog
      open={open}
      title={`${config.label}: ${grantTitle(row)}?`}
      description={config.description}
      confirmLabel={config.confirmLabel}
      destructive={config.destructive}
      errorFallback={`Failed to ${config.label.toLowerCase()}.`}
      onConfirm={handleConfirm}
      onClose={onClose}
      onDone={handleDone}
      testIdPrefix="grant-confirm"
    />
  );
});

ConfirmGrantActionDialog.displayName = 'ConfirmGrantActionDialog';

export default ConfirmGrantActionDialog;
