import { memo, useCallback } from 'react';

import { useAgentIdentityActionMutation } from '@/api/governance.api';
import ConfirmActionDialog from '@/pages/GovernancePage/components/ConfirmActionDialog';
import { ACTIONS } from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';
import { rowTitle } from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';

/**
 * Confirms submit, suspend, resume, retire and rebind. It names the identity and says what the action does.
 * The change is sent with the state the operator saw (`expected_state`), so a stale view is refused instead of applied.
 * `onDone({ outcome: 'done' | 'stale', row, action })`: a stale view closes the dialog, because the list was read again.
 */
const ConfirmIdentityActionDialog = memo(props => {
  const { open, row, action, projectId, onClose, onDone } = props;

  const [runAction] = useAgentIdentityActionMutation();

  const config = ACTIONS[action];

  const handleConfirm = useCallback(
    () => runAction({ projectId, bindingId: row.id, action, expected_state: row.state }).unwrap(),
    [runAction, projectId, row, action],
  );

  const handleDone = useCallback(({ outcome }) => onDone({ outcome, row, action }), [onDone, row, action]);

  if (!row || !config) return null;

  return (
    <ConfirmActionDialog
      open={open}
      title={`${config.label}: ${rowTitle(row)}?`}
      description={config.description}
      confirmLabel={config.confirmLabel}
      destructive={config.destructive}
      errorFallback={`Failed to ${config.label.toLowerCase()}.`}
      onConfirm={handleConfirm}
      onClose={onClose}
      onDone={handleDone}
      testIdPrefix="identity-confirm"
    />
  );
});

ConfirmIdentityActionDialog.displayName = 'ConfirmIdentityActionDialog';

export default ConfirmIdentityActionDialog;
