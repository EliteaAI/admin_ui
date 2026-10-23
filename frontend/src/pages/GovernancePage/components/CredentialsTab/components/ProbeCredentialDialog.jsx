import { memo, useCallback, useState } from 'react';

import { Checkbox, FormControlLabel } from '@mui/material';

import { useCredentialReferenceActionMutation } from '@/api/governance.api';
import ConfirmActionDialog from '@/pages/GovernancePage/components/ConfirmActionDialog';
import { ACTIONS } from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';
import { isPersonal, referenceTitle } from '@/pages/GovernancePage/helpers/governance.helpers';

/**
 * Probes a credential reference. A personal one can also be tested against its provider (`check_connection`); once it
 * is past pending that test is the only probe there is, so it is on and cannot be switched off.
 * `onDone({ outcome: 'done' | 'stale', row, action: 'probe' })`.
 */
const ProbeCredentialDialog = memo(props => {
  const { open, row, projectId, onClose, onDone } = props;

  const [check, setCheck] = useState(false);

  const [runAction] = useCredentialReferenceActionMutation();

  const personal = row ? isPersonal(row) : false;
  const checkRequired = personal && row.state !== 'pending';
  const checkConnection = personal && (checkRequired || check);

  const handleCheckChange = useCallback(event => setCheck(event.target.checked), []);

  const handleConfirm = useCallback(
    () =>
      runAction({
        projectId,
        referenceId: row.id,
        action: 'probe',
        // Only a personal reference takes the flag; the backend refuses it for any other
        ...(checkConnection && { check_connection: true }),
      }).unwrap(),
    [runAction, projectId, row, checkConnection],
  );

  const handleClose = useCallback(() => {
    setCheck(false);
    onClose();
  }, [onClose]);

  const handleDone = useCallback(
    ({ outcome }) => {
      setCheck(false);
      onDone({ outcome, row, action: 'probe' });
    },
    [onDone, row],
  );

  if (!row) return null;

  return (
    <ConfirmActionDialog
      open={open}
      title={`Probe ${referenceTitle(row)}?`}
      description={ACTIONS.probe.description}
      extra={
        personal ? (
          <FormControlLabel
            label="Also test the stored credential against its provider (check connection)"
            control={
              <Checkbox
                checked={checkRequired || check}
                disabled={checkRequired}
                onChange={handleCheckChange}
                inputProps={{ 'data-testid': 'credential-probe-check' }}
              />
            }
          />
        ) : null
      }
      confirmLabel={ACTIONS.probe.confirmLabel}
      errorFallback="Failed to probe."
      onConfirm={handleConfirm}
      onClose={handleClose}
      onDone={handleDone}
      testIdPrefix="credential-probe"
    />
  );
});

ProbeCredentialDialog.displayName = 'ProbeCredentialDialog';

export default ProbeCredentialDialog;
