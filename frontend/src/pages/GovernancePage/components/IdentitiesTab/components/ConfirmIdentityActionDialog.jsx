import { memo, useCallback, useState } from 'react';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { useAgentIdentityActionMutation } from '@/api/governance.api';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import {
  ACTIONS,
  STALE_CODES,
} from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';
import { rowTitle } from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';
import { toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

/**
 * Confirms submit, suspend, resume, retire and rebind. It names the identity and says what the action does.
 * The change is sent with the state the operator saw (`expected_state`), so a stale view is refused instead of applied.
 * `onDone({ outcome: 'done' | 'stale', row, action })`: a stale view closes the dialog, because the list was read again.
 */
const ConfirmIdentityActionDialog = memo(props => {
  const { open, row, action, projectId, onClose, onDone } = props;

  const styles = confirmIdentityActionDialogStyles();

  const [error, setError] = useState(null);

  const [runAction, { isLoading }] = useAgentIdentityActionMutation();

  const config = ACTIONS[action];

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setError(null);
    onClose();
  }, [isLoading, onClose]);

  const handleConfirm = useCallback(async () => {
    setError(null);
    try {
      await runAction({ projectId, bindingId: row.id, action, expected_state: row.state }).unwrap();
      onDone({ outcome: 'done', row, action });
    } catch (err) {
      const refusal = toGovernanceError(err, `Failed to ${config.label.toLowerCase()}.`);
      if (STALE_CODES.includes(refusal.code)) {
        onDone({ outcome: 'stale', row, action });
        return;
      }
      setError(refusal);
    }
  }, [runAction, projectId, row, action, config, onDone]);

  if (!row || !config) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="identity-confirm-dialog"
    >
      <DialogTitle>
        {config.label}: {rowTitle(row)}?
      </DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          <GovernanceErrorAlert error={error} />
          <Typography variant="bodyMedium">{config.description}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color={config.destructive ? 'error' : 'primary'}
          onClick={handleConfirm}
          disabled={isLoading}
          data-testid="identity-confirm-submit"
        >
          {config.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ConfirmIdentityActionDialog.displayName = 'ConfirmIdentityActionDialog';

/** @type {MuiSx} */
const confirmIdentityActionDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
});

export default ConfirmIdentityActionDialog;
