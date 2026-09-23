import { memo, useCallback, useState } from 'react';

import PropTypes from 'prop-types';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

import { useModelPriceResetMutation } from '@/api/modelPrices.api';

const ResetPriceDialog = memo(props => {
  const { open, target, onClose, onDone } = props;

  const styles = resetPriceDialogStyles();

  const [error, setError] = useState('');
  const [resetPrice, { isLoading }] = useModelPriceResetMutation();

  const handleReset = useCallback(async () => {
    setError('');
    try {
      const result = await resetPrice({
        modelName: target.model_name,
      }).unwrap();
      onDone?.(
        (result?.action === 'deleted'
          ? 'Custom-only price removed.'
          : 'Price reset to the imported default.') +
          ' Restart the pylons to apply the change to cost estimation.',
      );
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to reset price.');
    }
  }, [target, resetPrice, onDone, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>Reset price</DialogTitle>
      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={styles.gapBelow}
          >
            {error}
          </Alert>
        )}
        <DialogContentText>
          Reset the custom price for <strong>{target?.model_name}</strong> back to the imported default? If
          this model was never imported, the row is removed.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          onClick={onClose}
          variant="text"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleReset}
          variant="contained"
          color="warning"
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ResetPriceDialog.displayName = 'ResetPriceDialog';

ResetPriceDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  target: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onDone: PropTypes.func,
};

/** @type {MuiSx} */
const resetPriceDialogStyles = () => ({
  gapBelow: {
    marginBottom: '1rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default ResetPriceDialog;
