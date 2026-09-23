import { memo, useCallback, useState } from 'react';

import PropTypes from 'prop-types';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { useSecretDeleteMutation } from '@/api/secrets.api';

const DeleteSecretDialog = memo(props => {
  const { open, onClose, secretName } = props;

  const styles = deleteSecretDialogStyles();

  const [error, setError] = useState('');
  const [deleteSecret, { isLoading }] = useSecretDeleteMutation();

  const handleDelete = useCallback(async () => {
    setError('');
    try {
      await deleteSecret({ name: secretName }).unwrap();
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to delete secret.');
    }
  }, [secretName, deleteSecret, onClose]);

  const handleClose = useCallback(() => {
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Delete Secret</DialogTitle>
      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={styles.gapBelow}
          >
            {error}
          </Alert>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Are you sure you want to delete the secret <strong>{secretName}</strong>? This action cannot be
          undone. Any references using <code>{'{{secret.' + secretName + '}}'}</code> will stop working.
        </Typography>
      </DialogContent>
      <DialogActions sx={styles.dialogActions}>
        <Button
          onClick={handleClose}
          variant="text"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={isLoading}
        >
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

DeleteSecretDialog.displayName = 'DeleteSecretDialog';

DeleteSecretDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  secretName: PropTypes.string,
};

/** @type {MuiSx} */
const deleteSecretDialogStyles = () => ({
  gapBelow: {
    marginBottom: '1rem',
  },
  dialogActions: {
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    paddingBottom: '1rem',
  },
});

export default DeleteSecretDialog;
