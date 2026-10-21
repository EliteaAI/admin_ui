import { memo, useCallback, useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import { REFERENCE_HELP, STALE_CODES } from '@/pages/GovernancePage/constants/governance.constants';
import { isValidReference, toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

/**
 * The approval of a credential reference or a grant. Both the approval reference and the policy revision are required
 * and are recorded with the approval; the backend refuses the operator who created the record (or wrote its value).
 * `onSubmit({ approval_ref, policy_revision })` runs the change and rejects with the refusal.
 * `onDone({ outcome: 'done' | 'stale' })`: a stale view closes the dialog, because the list was read again.
 * `defaultPolicyRevision` is the revision of the effective governance setting, when the operator can read it.
 * Test ids: `<testIdPrefix>-dialog`, `-ref`, `-policy`, `-submit`.
 */
const ApproveDialog = memo(props => {
  const {
    open,
    title,
    description,
    notice,
    defaultPolicyRevision = '',
    submitLabel = 'Approve',
    onSubmit,
    onClose,
    onDone,
    testIdPrefix,
  } = props;

  const styles = approveDialogStyles();

  const [approvalRef, setApprovalRef] = useState('');
  const [policyRevision, setPolicyRevision] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (isSubmitting) return;
    reset();
    onClose();
  }, [isSubmitting, reset, onClose]);

  const handleConfirm = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({ approval_ref: approvalRef, policy_revision: policyRevisionValue });
      reset();
      onDone({ outcome: 'done' });
    } catch (err) {
      const refusal = toGovernanceError(err, 'Failed to approve.');
      if (STALE_CODES.includes(refusal.code)) {
        reset();
        onDone({ outcome: 'stale' });
      } else {
        setError(refusal);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, approvalRef, policyRevisionValue, reset, onDone]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid={`${testIdPrefix}-dialog`}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          <GovernanceErrorAlert error={error} />
          <Typography variant="bodyMedium">{description}</Typography>
          {notice}
          <TextField
            label="Approval reference"
            value={approvalRef}
            onChange={handleApprovalChange}
            size="small"
            required
            autoFocus
            error={approvalRef !== '' && !approvalValid}
            helperText={`A ticket or change number that records the approval. ${REFERENCE_HELP}`}
            inputProps={{ 'data-testid': `${testIdPrefix}-ref` }}
          />
          <TextField
            label="Policy revision"
            value={policyRevisionValue}
            onChange={handlePolicyChange}
            size="small"
            required
            error={policyRevisionValue !== '' && !policyValid}
            helperText={`The rules you approved against. ${REFERENCE_HELP}`}
            inputProps={{ 'data-testid': `${testIdPrefix}-policy` }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={isSubmitting || !approvalValid || !policyValid}
          data-testid={`${testIdPrefix}-submit`}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ApproveDialog.displayName = 'ApproveDialog';

/** @type {MuiSx} */
const approveDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
});

export default ApproveDialog;
