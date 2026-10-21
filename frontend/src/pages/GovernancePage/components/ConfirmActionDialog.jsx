import { memo, useCallback, useState } from 'react';

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import { STALE_CODES } from '@/pages/GovernancePage/constants/governance.constants';
import { toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

/**
 * Confirms a change that needs no input: it names the record and says what the action does.
 * `onConfirm()` runs the change and rejects with the refusal. `extra` is shown below the description.
 * `onDone({ outcome: 'done' | 'stale' })`: a stale view closes the dialog, because the list was read again.
 * Test ids: `<testIdPrefix>-dialog` and `<testIdPrefix>-submit`.
 */
const ConfirmActionDialog = memo(props => {
  const {
    open,
    title,
    description,
    extra,
    confirmLabel,
    destructive = false,
    errorFallback = 'The change failed.',
    onConfirm,
    onClose,
    onDone,
    testIdPrefix,
  } = props;

  const styles = confirmActionDialogStyles();

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  }, [isSubmitting, onClose]);

  const handleConfirm = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm();
      onDone({ outcome: 'done' });
    } catch (err) {
      const refusal = toGovernanceError(err, errorFallback);
      if (STALE_CODES.includes(refusal.code)) onDone({ outcome: 'stale' });
      else setError(refusal);
    } finally {
      setIsSubmitting(false);
    }
  }, [onConfirm, errorFallback, onDone]);

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
          {extra}
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
          color={destructive ? 'error' : 'primary'}
          onClick={handleConfirm}
          disabled={isSubmitting}
          data-testid={`${testIdPrefix}-submit`}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ConfirmActionDialog.displayName = 'ConfirmActionDialog';

/** @type {MuiSx} */
const confirmActionDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
});

export default ConfirmActionDialog;
