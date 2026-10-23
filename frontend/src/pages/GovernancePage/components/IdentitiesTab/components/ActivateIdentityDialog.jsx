import { memo, useCallback, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

import { useAgentIdentityActionMutation } from '@/api/governance.api';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import { rowTitle } from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';
import { REFERENCE_HELP, STALE_CODES } from '@/pages/GovernancePage/constants/governance.constants';
import { isValidReference, toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

/**
 * Approves and activates an identity. Both the approval reference and the policy revision are required and are
 * recorded with the approval. The backend refuses the operator who created the identity or last changed its state.
 * `defaultPolicyRevision` is the revision of the effective governance setting, when the operator can read it.
 */
const ActivateIdentityDialog = memo(props => {
  const { open, row, projectId, defaultPolicyRevision, onClose, onDone } = props;

  const styles = activateIdentityDialogStyles();

  const [approvalRef, setApprovalRef] = useState('');
  const [policyRevision, setPolicyRevision] = useState(null);
  const [error, setError] = useState(null);

  const [runAction, { isLoading }] = useAgentIdentityActionMutation();

  // The field follows the effective revision until the operator types their own
  const policyRevisionValue = policyRevision ?? defaultPolicyRevision ?? '';

  const approvalValid = isValidReference(approvalRef);
  const policyValid = isValidReference(policyRevisionValue);

  const handleApprovalChange = useCallback(event => setApprovalRef(event.target.value), []);
  const handlePolicyChange = useCallback(event => setPolicyRevision(event.target.value), []);

  const reset = useCallback(() => {
    setApprovalRef('');
    setPolicyRevision(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    reset();
    onClose();
  }, [isLoading, reset, onClose]);

  const handleConfirm = useCallback(async () => {
    setError(null);
    try {
      await runAction({
        projectId,
        bindingId: row.id,
        action: 'activate',
        expected_state: row.state,
        approval_ref: approvalRef,
        policy_revision: policyRevisionValue,
      }).unwrap();
      reset();
      onDone({ outcome: 'done', row, action: 'activate' });
    } catch (err) {
      const refusal = toGovernanceError(err, 'Failed to activate the identity.');
      if (STALE_CODES.includes(refusal.code)) {
        reset();
        onDone({ outcome: 'stale', row, action: 'activate' });
        return;
      }
      setError(refusal);
    }
  }, [runAction, projectId, row, approvalRef, policyRevisionValue, reset, onDone]);

  if (!row) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="identity-activate-dialog"
    >
      <DialogTitle>Approve and activate {rowTitle(row)}?</DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          <GovernanceErrorAlert error={error} />
          <Typography variant="bodyMedium">
            Activating makes this agent version usable under governance. A second administrator must approve
            it: the operator who created the identity, or who last changed its state, cannot.
          </Typography>
          {row.digest_status === 'changed' && (
            <Alert
              severity="warning"
              data-testid="identity-activate-changed"
            >
              The agent was edited after this identity was created, so the activation will be refused.
            </Alert>
          )}
          <TextField
            label="Approval reference"
            value={approvalRef}
            onChange={handleApprovalChange}
            size="small"
            required
            autoFocus
            error={approvalRef !== '' && !approvalValid}
            helperText={`A ticket or change number that records the approval. ${REFERENCE_HELP}`}
            inputProps={{ 'data-testid': 'identity-approval-ref' }}
          />
          <TextField
            label="Policy revision"
            value={policyRevisionValue}
            onChange={handlePolicyChange}
            size="small"
            required
            error={policyRevisionValue !== '' && !policyValid}
            helperText={`The rules you approved against. ${REFERENCE_HELP}`}
            inputProps={{ 'data-testid': 'identity-policy-revision' }}
          />
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
          onClick={handleConfirm}
          disabled={isLoading || !approvalValid || !policyValid}
          data-testid="identity-activate-submit"
        >
          Approve & activate
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ActivateIdentityDialog.displayName = 'ActivateIdentityDialog';

/** @type {MuiSx} */
const activateIdentityDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
});

export default ActivateIdentityDialog;
