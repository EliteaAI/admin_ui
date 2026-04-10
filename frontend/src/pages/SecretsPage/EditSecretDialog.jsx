import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { useSecretUpdateMutation } from '@/api/secretsApi';

function EditSecretDialog({ open, onClose, secretName }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [updateSecret, { isLoading }] = useSecretUpdateMutation();

  useEffect(() => {
    if (open) {
      setValue('');
      setError('');
    }
  }, [open]);

  const handleSave = useCallback(async () => {
    setError('');
    if (!value) {
      setError('Secret value is required.');
      return;
    }
    try {
      await updateSecret({ name: secretName, value }).unwrap();
      setValue('');
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to update secret.');
    }
  }, [secretName, value, updateSecret, onClose]);

  const handleClose = useCallback(() => {
    setValue('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Secret</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          margin="dense"
          label="Secret Name"
          fullWidth
          value={secretName || ''}
          disabled
        />
        <TextField
          autoFocus
          margin="dense"
          label="New Value"
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          placeholder="Enter new value"
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

EditSecretDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  secretName: PropTypes.string,
};

export default EditSecretDialog;
