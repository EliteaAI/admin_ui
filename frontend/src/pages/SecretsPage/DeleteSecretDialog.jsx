import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

import { useSecretDeleteMutation } from '@/api/secretsApi';

function DeleteSecretDialog({ open, onClose, secretName }) {
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Secret</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary">
          Are you sure you want to delete the secret <strong>{secretName}</strong>?
          This action cannot be undone. Any references using{' '}
          <code>{'{{secret.' + secretName + '}}'}</code> will stop working.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={isLoading}>
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DeleteSecretDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  secretName: PropTypes.string,
};

export default DeleteSecretDialog;
