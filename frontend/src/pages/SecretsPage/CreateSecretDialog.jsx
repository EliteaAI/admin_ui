import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { useSecretCreateMutation } from '@/api/secretsApi';
import { SECRET_NAME_REGEX } from './constants';

function CreateSecretDialog({ open, onClose, existingNames }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [createSecret, { isLoading }] = useSecretCreateMutation();

  const handleCreate = useCallback(async () => {
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Secret name is required.');
      return;
    }
    if (!SECRET_NAME_REGEX.test(trimmedName)) {
      setError('Name must contain only letters, digits, and underscores.');
      return;
    }
    if (existingNames?.has(trimmedName)) {
      setError(`Secret "${trimmedName}" already exists.`);
      return;
    }
    if (!value) {
      setError('Secret value is required.');
      return;
    }
    try {
      await createSecret({ name: trimmedName, value }).unwrap();
      setName('');
      setValue('');
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to create secret.');
    }
  }, [name, value, existingNames, createSecret, onClose]);

  const handleClose = useCallback(() => {
    setName('');
    setValue('');
    setError('');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Secret</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          label="Secret Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          helperText="Letters, digits, and underscores only"
        />
        <TextField
          margin="dense"
          label="Secret Value"
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleCreate} variant="contained" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

CreateSecretDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  existingNames: PropTypes.instanceOf(Set),
};

export default CreateSecretDialog;
